/**
 * Estado central do app.
 *
 * Tudo o que a tela mostra sai daqui. Cada ação muda o estado em memória na
 * hora (a tela responde sem esperar o disco) e agenda a gravação no SQLite
 * pela fila de escrita do repositório.
 */
import { create } from 'zustand';
import { abrirBanco, type Instrucao } from '../dados/banco';
import { migrar } from '../dados/esquema';
import { montarExemplo } from '../dados/exemplo';
import {
  aguardarEscritas,
  aoMudarFila,
  carregarTudo,
  enfileirar,
  sqlApagarNo,
  sqlApagarNota,
  sqlAtualizarArvore,
  sqlAtualizarNo,
  sqlAtualizarNota,
  sqlConfig,
  sqlExcluirNos,
  sqlInserirArvore,
  sqlInserirNo,
  sqlInserirNota,
  sqlRestaurarNos,
  sqlSalvarTipo,
  usarBanco,
} from '../dados/repositorio';
import { TIPO_GERAL, type Arvore, type No, type Nota, type NotaMeta, type TipoNota } from '../dados/tipos';
import { agora, uid } from '../util/texto';

export type Visao = 'arvore' | 'lista';
export type PosicaoSolta = 'dentro' | 'antes' | 'depois';

export interface Arrasto {
  noId: string;
  alvoId: string | null;
  posicao: PosicaoSolta;
}

export interface Estado {
  pronto: boolean;
  /** Onde os dados estão guardados (texto para as configurações). */
  armazenamento: string;
  escuro: boolean;
  /** Tela larga o bastante para árvore e nota lado a lado (paisagem). */
  largo: boolean;

  tipos: Record<string, TipoNota>;
  notas: Record<string, NotaMeta>;
  arvores: Record<string, Arvore>;
  /** Nós ativos de todas as árvores. */
  nos: Record<string, No>;

  arvoreAtualId: string | null;
  selecionadoId: string | null;
  /** Ids do caminho da raiz até o nó selecionado. */
  caminho: ReadonlySet<string>;
  /** Nota mostrada no painel (segue a seleção, mas também pode ser uma nota fora da árvore). */
  notaAbertaId: string | null;
  /** Nó com o título em edição direto na árvore. `novo` = acabou de ser criado. */
  edicao: { noId: string; novo: boolean } | null;

  visao: Visao;
  /** Preferência: em tela larga, mostrar a nota ao lado da árvore. */
  painelLigado: boolean;
  /** A nota ocupa a tela toda (tela cheia em paisagem; sobreposta em retrato). */
  notaExpandida: boolean;
  /** Fração da largura ocupada pela árvore na tela dividida. */
  proporcao: number;

  /** Modo "mover": o próximo nó tocado vira o novo pai deste. */
  movendoId: string | null;
  arrasto: Arrasto | null;
  gavetaAberta: boolean;

  /** Contadores que a árvore observa para enquadrar tudo ou revelar um nó. */
  pedidoVerTudo: number;
  pedidoRevelar: { noId: string; n: number } | null;

  salvamento: 'salvo' | 'salvando' | 'erro';
}

const VAZIO: ReadonlySet<string> = new Set();

export const useLoja = create<Estado>(() => ({
  pronto: false,
  armazenamento: '',
  escuro: document.documentElement.getAttribute('data-tema') === 'escuro',
  largo: window.innerWidth >= 900,
  tipos: {},
  notas: {},
  arvores: {},
  nos: {},
  arvoreAtualId: null,
  selecionadoId: null,
  caminho: VAZIO,
  notaAbertaId: null,
  edicao: null,
  visao: 'arvore',
  painelLigado: true,
  notaExpandida: false,
  proporcao: 0.56,
  movendoId: null,
  arrasto: null,
  gavetaAberta: false,
  pedidoVerTudo: 0,
  pedidoRevelar: null,
  salvamento: 'salvo',
}));

const get = useLoja.getState;
const set = useLoja.setState;

// ------------------------------------------------------------------ índice

export interface Indice {
  /** Filhos de cada nó, já ordenados. */
  filhos: Map<string, string[]>;
  /** Nós em que cada nota aparece. */
  porNota: Map<string, string[]>;
}

const SEM_FILHOS: string[] = [];
const cacheIndice = new WeakMap<Record<string, No>, Indice>();

/** Índice dos nós, recalculado só quando o conjunto de nós muda. */
export function indiceDe(nos: Record<string, No>): Indice {
  const pronto = cacheIndice.get(nos);
  if (pronto) return pronto;
  const filhos = new Map<string, string[]>();
  const porNota = new Map<string, string[]>();
  for (const id in nos) {
    const no = nos[id]!;
    if (no.paiId) {
      const lista = filhos.get(no.paiId);
      if (lista) lista.push(id);
      else filhos.set(no.paiId, [id]);
    }
    const usos = porNota.get(no.notaId);
    if (usos) usos.push(id);
    else porNota.set(no.notaId, [id]);
  }
  for (const lista of filhos.values()) {
    lista.sort((a, b) => nos[a]!.ordem - nos[b]!.ordem || (a < b ? -1 : 1));
  }
  const indice: Indice = { filhos, porNota };
  cacheIndice.set(nos, indice);
  return indice;
}

export function filhosDe(nos: Record<string, No>, id: string): string[] {
  return indiceDe(nos).filhos.get(id) ?? SEM_FILHOS;
}

/** O nó e todos os seus descendentes, em profundidade. */
export function ramoDe(nos: Record<string, No>, id: string): string[] {
  const saida: string[] = [];
  const pilha = [id];
  while (pilha.length) {
    const atual = pilha.pop()!;
    saida.push(atual);
    const f = filhosDe(nos, atual);
    for (let i = f.length - 1; i >= 0; i--) pilha.push(f[i]!);
  }
  return saida;
}

export function contarDescendentes(nos: Record<string, No>, id: string): number {
  return ramoDe(nos, id).length - 1;
}

export function caminhoAte(nos: Record<string, No>, id: string): ReadonlySet<string> {
  const ids = new Set<string>();
  let atual: No | undefined = nos[id];
  while (atual) {
    ids.add(atual.id);
    atual = atual.paiId ? nos[atual.paiId] : undefined;
  }
  return ids;
}

/** true se `id` é o próprio `ancestralId` ou está abaixo dele. */
export function estaNoRamo(nos: Record<string, No>, id: string, ancestralId: string): boolean {
  let atual: No | undefined = nos[id];
  while (atual) {
    if (atual.id === ancestralId) return true;
    atual = atual.paiId ? nos[atual.paiId] : undefined;
  }
  return false;
}

export function tituloDaNota(nota: NotaMeta | undefined): string {
  const t = nota?.titulo.trim();
  return t ? t : 'Sem título';
}

/** Árvores na ordem do menu lateral. */
export function arvoresOrdenadas(arvores: Record<string, Arvore>): Arvore[] {
  return Object.values(arvores).sort((a, b) => a.ordem - b.ordem || a.criadaEm - b.criadaEm);
}

export function tiposOrdenados(tipos: Record<string, TipoNota>): TipoNota[] {
  return Object.values(tipos).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
}

// ------------------------------------------------------------------ desfazer

interface PassoDesfazer {
  rotulo: string;
  desfazer: () => void;
}

const pilhaDesfazer: PassoDesfazer[] = [];

function registrarDesfazer(passo: PassoDesfazer): void {
  pilhaDesfazer.push(passo);
  if (pilhaDesfazer.length > 30) pilhaDesfazer.shift();
}

/** Desfaz a última alteração na estrutura (mover ou excluir). Devolve o que foi desfeito. */
export function desfazer(): string | null {
  const passo = pilhaDesfazer.pop();
  if (!passo) return null;
  passo.desfazer();
  return passo.rotulo;
}

// ------------------------------------------------------------------ início

function novaNota(titulo: string, tipoId: string): Nota {
  const quando = agora();
  return {
    id: uid(),
    titulo,
    tipoId,
    conteudo: '',
    texto: '',
    criadaEm: quando,
    atualizadaEm: quando,
    excluidaEm: null,
  };
}

function meta(n: Nota): NotaMeta {
  return {
    id: n.id,
    titulo: n.titulo,
    tipoId: n.tipoId,
    criadaEm: n.criadaEm,
    atualizadaEm: n.atualizadaEm,
    excluidaEm: n.excluidaEm,
  };
}

function porId<T extends { id: string }>(itens: T[]): Record<string, T> {
  const mapa: Record<string, T> = {};
  for (const i of itens) mapa[i.id] = i;
  return mapa;
}

function guardarPreferencia(chave: string, valor: string): void {
  void enfileirar([sqlConfig(chave, valor)]);
}

/** Abre o banco, cria o esquema e os dados de exemplo na primeira vez, e carrega tudo. */
export async function iniciar(): Promise<void> {
  const banco = await abrirBanco();
  usarBanco(banco);
  const bancoNovo = await migrar(banco);
  if (bancoNovo) {
    const exemplo = montarExemplo();
    await banco.lote([...exemplo.instrucoes, sqlConfig('arvoreAtual', exemplo.primeiraArvoreId)]);
  }
  const dados = await carregarTudo();
  const arvores = porId(dados.arvores);
  const lista = arvoresOrdenadas(arvores);
  const preferida = dados.config.arvoreAtual;
  const arvoreAtualId = preferida && arvores[preferida] ? preferida : (lista[0]?.id ?? null);
  const proporcao = Number(dados.config.proporcao);

  aoMudarFila((pendentes, erro) => {
    const novo = erro ? 'erro' : pendentes > 0 ? 'salvando' : 'salvo';
    if (get().salvamento !== novo && !(get().salvamento === 'erro' && !erro && pendentes > 0)) {
      set({ salvamento: novo });
    }
  });

  set({
    pronto: true,
    armazenamento: banco.descricao,
    tipos: porId(dados.tipos),
    notas: porId(dados.notas),
    arvores,
    nos: porId(dados.nos),
    arvoreAtualId,
    visao: dados.config.visao === 'lista' ? 'lista' : 'arvore',
    painelLigado: dados.config.painelLigado !== '0',
    proporcao: proporcao >= 0.25 && proporcao <= 0.75 ? proporcao : 0.56,
  });
}

// ------------------------------------------------------------------ tela

export function definirLargo(largo: boolean): void {
  if (get().largo !== largo) set({ largo });
}

export function definirEscuro(escuro: boolean): void {
  if (get().escuro !== escuro) set({ escuro });
}

export function definirVisao(visao: Visao): void {
  if (get().visao === visao) return;
  set({ visao, edicao: null });
  guardarPreferencia('visao', visao);
}

export function alternarPainel(): void {
  const ligado = !get().painelLigado;
  set({ painelLigado: ligado, notaExpandida: false });
  guardarPreferencia('painelLigado', ligado ? '1' : '0');
}

export function definirProporcao(proporcao: number, gravar: boolean): void {
  const p = Math.min(0.75, Math.max(0.25, proporcao));
  set({ proporcao: p });
  if (gravar) guardarPreferencia('proporcao', p.toFixed(3));
}

export function abrirGaveta(aberta: boolean): void {
  set({ gavetaAberta: aberta });
}

export function pedirVerTudo(): void {
  set({ pedidoVerTudo: get().pedidoVerTudo + 1 });
}

export function pedirRevelar(noId: string): void {
  set({ pedidoRevelar: { noId, n: (get().pedidoRevelar?.n ?? 0) + 1 } });
}

/** Abre a nota em tela cheia (paisagem) ou por cima da árvore (retrato). */
export function expandirNota(expandida: boolean): void {
  const s = get();
  if (expandida && !s.notaAbertaId) return;
  if (s.notaExpandida !== expandida) set({ notaExpandida: expandida });
}

/** Fecha o painel da nota sem mexer na seleção da árvore. */
export function fecharNota(): void {
  set({ notaAbertaId: null, notaExpandida: false });
}

// ------------------------------------------------------------------ seleção

export function selecionar(noId: string | null): void {
  const s = get();
  if (noId === null) {
    if (s.selecionadoId !== null || s.edicao) set({ selecionadoId: null, caminho: VAZIO, edicao: null });
    return;
  }
  const no = s.nos[noId];
  if (!no) return;
  if (s.selecionadoId === noId && s.notaAbertaId === no.notaId) return;
  set({
    selecionadoId: noId,
    caminho: caminhoAte(s.nos, noId),
    notaAbertaId: no.notaId,
    edicao: s.edicao && s.edicao.noId !== noId ? null : s.edicao,
  });
}

/** Garante que o nó esteja visível: expande os ancestrais recolhidos. */
function expandirAncestrais(nos: Record<string, No>, noId: string): { nos: Record<string, No>; sql: Instrucao[] } {
  let copia = nos;
  const sql: Instrucao[] = [];
  let atual = nos[noId]?.paiId ? nos[nos[noId]!.paiId!] : undefined;
  while (atual) {
    if (atual.recolhido) {
      if (copia === nos) copia = { ...nos };
      copia[atual.id] = { ...atual, recolhido: false };
      sql.push(sqlAtualizarNo(atual.id, { recolhido: false }));
    }
    atual = atual.paiId ? nos[atual.paiId] : undefined;
  }
  return { nos: copia, sql };
}

/** Seleciona um nó em qualquer árvore, trocando de árvore e expandindo ramos se preciso. */
export function irParaNo(noId: string): void {
  const s = get();
  const no = s.nos[noId];
  if (!no) return;
  const { nos, sql } = expandirAncestrais(s.nos, noId);
  const trocou = s.arvoreAtualId !== no.arvoreId;
  set({
    nos,
    arvoreAtualId: no.arvoreId,
    selecionadoId: noId,
    caminho: caminhoAte(nos, noId),
    notaAbertaId: no.notaId,
    edicao: null,
    pedidoVerTudo: trocou ? s.pedidoVerTudo + 1 : s.pedidoVerTudo,
  });
  if (sql.length) void enfileirar(sql);
  if (trocou) guardarPreferencia('arvoreAtual', no.arvoreId);
  else pedirRevelar(noId);
}

/**
 * Abre uma nota pelo id (toque num link, resultado de busca).
 * Se ela estiver em alguma árvore, o nó correspondente é selecionado e
 * destacado, de preferência na árvore que já está aberta.
 */
export function abrirNota(notaId: string, opcoes: { expandir?: boolean } = {}): void {
  const s = get();
  if (!s.notas[notaId]) return;
  const usos = indiceDe(s.nos).porNota.get(notaId) ?? [];
  const aqui = usos.find((id) => s.nos[id]!.arvoreId === s.arvoreAtualId);
  const destino = aqui ?? usos[0];
  if (destino) irParaNo(destino);
  else set({ selecionadoId: null, caminho: VAZIO, notaAbertaId: notaId, edicao: null });
  if (opcoes.expandir || !get().largo || !get().painelLigado) set({ notaExpandida: true });
}

// ------------------------------------------------------------------ nós

function renumerar(nos: Record<string, No>, ids: string[], sql: Instrucao[]): void {
  ids.forEach((id, i) => {
    const no = nos[id]!;
    if (no.ordem !== i) {
      nos[id] = { ...no, ordem: i };
      sql.push(sqlAtualizarNo(id, { ordem: i }));
    }
  });
}

function inserirNovoNo(paiId: string, indice: number): string | null {
  const s = get();
  const pai = s.nos[paiId];
  if (!pai) return null;
  const nota = novaNota('', TIPO_GERAL);
  const no: No = {
    id: uid(),
    arvoreId: pai.arvoreId,
    notaId: nota.id,
    paiId,
    ordem: indice,
    rotuloDoRamo: null,
    recolhido: false,
  };
  const sql: Instrucao[] = [sqlInserirNota(nota), sqlInserirNo(no)];
  const nos = { ...s.nos, [no.id]: no };
  if (pai.recolhido) {
    nos[paiId] = { ...pai, recolhido: false };
    sql.push(sqlAtualizarNo(paiId, { recolhido: false }));
  }
  const irmaos = filhosDe(s.nos, paiId).slice();
  irmaos.splice(Math.min(indice, irmaos.length), 0, no.id);
  renumerar(nos, irmaos, sql);
  set({
    nos,
    notas: { ...s.notas, [nota.id]: meta(nota) },
    selecionadoId: no.id,
    caminho: caminhoAte(nos, no.id),
    notaAbertaId: nota.id,
    edicao: { noId: no.id, novo: true },
    movendoId: null,
  });
  void enfileirar(sql);
  pedirRevelar(no.id);
  return no.id;
}

/** Cria um filho no fim da lista de filhos. O nó entra com o título em edição. */
export function criarFilho(paiId: string): string | null {
  return inserirNovoNo(paiId, filhosDe(get().nos, paiId).length);
}

/** Cria um irmão logo abaixo do nó. A raiz não tem irmãos. */
export function criarIrmao(noId: string): string | null {
  const no = get().nos[noId];
  if (!no || !no.paiId) return null;
  return inserirNovoNo(no.paiId, no.ordem + 1);
}

export function editarTitulo(noId: string): void {
  if (get().nos[noId]) {
    set({ edicao: { noId, novo: false }, selecionadoId: noId, caminho: caminhoAte(get().nos, noId) });
    pedirRevelar(noId);
  }
}

/** Remove de vez um nó recém-criado que ficou sem título, junto com a nota vazia dele. */
function descartarNovo(noId: string): void {
  const s = get();
  const no = s.nos[noId];
  if (!no) return;
  const nos = { ...s.nos };
  delete nos[noId];
  const sql: Instrucao[] = [sqlApagarNo(noId)];
  const notas = { ...s.notas };
  const outrosUsos = (indiceDe(s.nos).porNota.get(no.notaId) ?? []).filter((id) => id !== noId);
  if (outrosUsos.length === 0 && !notas[no.notaId]?.titulo) {
    delete notas[no.notaId];
    sql.push(...sqlApagarNota(no.notaId));
  }
  if (no.paiId) renumerar(nos, filhosDe(s.nos, no.paiId).filter((id) => id !== noId), sql);
  const voltarPara = no.paiId && nos[no.paiId] ? no.paiId : null;
  set({
    nos,
    notas,
    edicao: null,
    selecionadoId: voltarPara,
    caminho: voltarPara ? caminhoAte(nos, voltarPara) : VAZIO,
    notaAbertaId:
      s.notaAbertaId === no.notaId ? (voltarPara ? nos[voltarPara]!.notaId : null) : s.notaAbertaId,
  });
  void enfileirar(sql);
}

/** Conclui a edição do título. Título vazio num nó novo descarta o nó. */
export function confirmarTitulo(noId: string, titulo: string): void {
  const s = get();
  const no = s.nos[noId];
  const edicao = s.edicao;
  if (!no || !edicao || edicao.noId !== noId) return;
  const limpo = titulo.replace(/\s+/g, ' ').trim();
  if (!limpo) {
    if (edicao.novo) descartarNovo(noId);
    else set({ edicao: null });
    return;
  }
  set({ edicao: null });
  renomearNota(no.notaId, limpo);
}

export function cancelarEdicao(): void {
  const edicao = get().edicao;
  if (!edicao) return;
  if (edicao.novo) descartarNovo(edicao.noId);
  else set({ edicao: null });
}

/**
 * Faz um nó recém-criado apontar para uma nota que já existe, em vez de criar
 * outra. É assim que a mesma nota aparece em vários ramos sem duplicar.
 */
export function usarNotaExistente(noId: string, notaId: string): void {
  const s = get();
  const no = s.nos[noId];
  if (!no || !s.notas[notaId] || no.notaId === notaId) {
    set({ edicao: null });
    return;
  }
  const antiga = no.notaId;
  const nos = { ...s.nos, [noId]: { ...no, notaId } };
  const sql: Instrucao[] = [sqlAtualizarNo(noId, { notaId })];
  const notas = { ...s.notas };
  const outrosUsos = (indiceDe(s.nos).porNota.get(antiga) ?? []).filter((id) => id !== noId);
  if (outrosUsos.length === 0 && !notas[antiga]?.titulo) {
    delete notas[antiga];
    sql.push(...sqlApagarNota(antiga));
  }
  set({
    nos,
    notas,
    edicao: null,
    notaAbertaId: s.notaAbertaId === antiga ? notaId : s.notaAbertaId,
  });
  void enfileirar(sql);
}

export function definirRotulo(noId: string, rotulo: string | null): void {
  const s = get();
  const no = s.nos[noId];
  if (!no) return;
  const limpo = rotulo?.replace(/\s+/g, ' ').trim() || null;
  if (limpo === no.rotuloDoRamo) return;
  set({ nos: { ...s.nos, [noId]: { ...no, rotuloDoRamo: limpo } } });
  void enfileirar([sqlAtualizarNo(noId, { rotuloDoRamo: limpo })]);
}

export function alternarRecolhido(noId: string): void {
  const s = get();
  const no = s.nos[noId];
  if (!no || filhosDe(s.nos, noId).length === 0) return;
  const recolhido = !no.recolhido;
  const nos = { ...s.nos, [noId]: { ...no, recolhido } };
  const parcial: Partial<Estado> = { nos };
  // Se a seleção ficou escondida dentro do ramo recolhido, ela sobe para este nó.
  if (recolhido && s.selecionadoId && s.selecionadoId !== noId && estaNoRamo(s.nos, s.selecionadoId, noId)) {
    parcial.selecionadoId = noId;
    parcial.caminho = caminhoAte(nos, noId);
    parcial.notaAbertaId = no.notaId;
    parcial.edicao = null;
  }
  set(parcial);
  void enfileirar([sqlAtualizarNo(noId, { recolhido })]);
}

/** Recolhe ou expande todos os nós da árvore atual que têm filhos. */
export function recolherTudo(recolher: boolean): void {
  const s = get();
  const arvore = s.arvoreAtualId ? s.arvores[s.arvoreAtualId] : undefined;
  if (!arvore) return;
  const nos = { ...s.nos };
  const sql: Instrucao[] = [];
  for (const id of ramoDe(s.nos, arvore.raizId)) {
    const no = s.nos[id]!;
    const deveRecolher = recolher && id !== arvore.raizId && filhosDe(s.nos, id).length > 0;
    if (no.recolhido !== deveRecolher) {
      nos[id] = { ...no, recolhido: deveRecolher };
      sql.push(sqlAtualizarNo(id, { recolhido: deveRecolher }));
    }
  }
  if (sql.length === 0) return;
  const sel = recolher && s.selecionadoId ? arvore.raizId : s.selecionadoId;
  set({
    nos,
    selecionadoId: sel,
    caminho: sel ? caminhoAte(nos, sel) : VAZIO,
    pedidoVerTudo: s.pedidoVerTudo + 1,
  });
  void enfileirar(sql);
}

export function podeMover(noId: string, novoPaiId: string): boolean {
  const { nos } = get();
  const no = nos[noId];
  const pai = nos[novoPaiId];
  if (!no || !pai || !no.paiId) return false;
  if (no.arvoreId !== pai.arvoreId) return false;
  return !estaNoRamo(nos, novoPaiId, noId);
}

/**
 * Troca o nó de pai e/ou de posição entre os irmãos.
 * `indice` é a posição final entre os filhos do novo pai (padrão: no fim).
 */
export function moverNo(noId: string, novoPaiId: string, indice?: number): boolean {
  const s = get();
  if (!podeMover(noId, novoPaiId)) return false;
  const no = s.nos[noId]!;
  const paiAntigoId = no.paiId!;
  const ordemAntiga = no.ordem;
  const nos = { ...s.nos };
  const sql: Instrucao[] = [];

  const antigos = filhosDe(s.nos, paiAntigoId).filter((id) => id !== noId);
  const novos = paiAntigoId === novoPaiId ? antigos : filhosDe(s.nos, novoPaiId).slice();
  const posicao = Math.max(0, Math.min(indice ?? novos.length, novos.length));
  novos.splice(posicao, 0, noId);

  if (paiAntigoId === novoPaiId && posicao === ordemAntiga) return false;

  if (paiAntigoId !== novoPaiId) {
    nos[noId] = { ...no, paiId: novoPaiId };
    sql.push(sqlAtualizarNo(noId, { paiId: novoPaiId }));
    renumerar(nos, antigos, sql);
  }
  renumerar(nos, novos, sql);
  const novoPai = nos[novoPaiId]!;
  if (novoPai.recolhido) {
    nos[novoPaiId] = { ...novoPai, recolhido: false };
    sql.push(sqlAtualizarNo(novoPaiId, { recolhido: false }));
  }
  set({
    nos,
    movendoId: null,
    arrasto: null,
    selecionadoId: noId,
    caminho: caminhoAte(nos, noId),
    notaAbertaId: s.notaAbertaId ? nos[noId]!.notaId : s.notaAbertaId,
  });
  void enfileirar(sql);
  registrarDesfazer({
    rotulo: 'Mover',
    desfazer: () => {
      if (get().nos[noId] && get().nos[paiAntigoId]) moverSemHistorico(noId, paiAntigoId, ordemAntiga);
    },
  });
  return true;
}

function moverSemHistorico(noId: string, paiId: string, indice: number): void {
  const antes = pilhaDesfazer.length;
  moverNo(noId, paiId, indice);
  pilhaDesfazer.length = Math.min(pilhaDesfazer.length, antes);
}

export function iniciarMover(noId: string | null): void {
  set({ movendoId: noId, edicao: null });
}

export function definirArrasto(arrasto: Arrasto | null): void {
  const atual = get().arrasto;
  if (
    atual === arrasto ||
    (atual && arrasto && atual.noId === arrasto.noId && atual.alvoId === arrasto.alvoId && atual.posicao === arrasto.posicao)
  ) {
    return;
  }
  set({ arrasto });
}

export interface ResumoExclusao {
  /** Quantos nós saem da árvore (o nó e seus descendentes). */
  nos: number;
  /** Quantas notas vão para a lixeira por não estarem em mais nenhum lugar. */
  notasParaLixeira: number;
}

function notasOrfas(nos: Record<string, No>, removidos: Set<string>): string[] {
  const { porNota } = indiceDe(nos);
  const orfas = new Set<string>();
  for (const id of removidos) {
    const notaId = nos[id]!.notaId;
    const usos = porNota.get(notaId) ?? [];
    if (usos.every((u) => removidos.has(u))) orfas.add(notaId);
  }
  return [...orfas];
}

export function resumoDaExclusao(noId: string): ResumoExclusao {
  const { nos } = get();
  const ids = new Set(ramoDe(nos, noId));
  return { nos: ids.size, notasParaLixeira: notasOrfas(nos, ids).length };
}

/**
 * Exclui o nó e seus descendentes da árvore. As notas que não aparecem em mais
 * nenhum nó vão para a lixeira. Pode ser desfeito.
 */
export function excluirNo(noId: string): boolean {
  const s = get();
  const no = s.nos[noId];
  if (!no || !no.paiId) return false;
  const ids = ramoDe(s.nos, noId);
  const conjunto = new Set(ids);
  const removidos = ids.map((id) => s.nos[id]!);
  const orfas = notasOrfas(s.nos, conjunto);
  const quando = agora();
  const lote = uid();

  const nos = { ...s.nos };
  for (const id of ids) delete nos[id];
  const notas = { ...s.notas };
  const sql: Instrucao[] = sqlExcluirNos(ids, quando, lote);
  for (const notaId of orfas) {
    notas[notaId] = { ...notas[notaId]!, excluidaEm: quando };
    sql.push(sqlAtualizarNota(notaId, { excluidaEm: quando }));
  }
  renumerar(nos, filhosDe(s.nos, no.paiId).filter((id) => id !== noId), sql);

  const selecaoSome = s.selecionadoId !== null && conjunto.has(s.selecionadoId);
  const novaSelecao = selecaoSome ? no.paiId : s.selecionadoId;
  const notaSome = s.notaAbertaId !== null && orfas.includes(s.notaAbertaId);
  set({
    nos,
    notas,
    edicao: null,
    movendoId: null,
    selecionadoId: novaSelecao,
    caminho: novaSelecao ? caminhoAte(nos, novaSelecao) : VAZIO,
    notaAbertaId: selecaoSome || notaSome ? (novaSelecao ? nos[novaSelecao]!.notaId : null) : s.notaAbertaId,
    notaExpandida: selecaoSome || notaSome ? false : s.notaExpandida,
  });
  void enfileirar(sql);

  registrarDesfazer({
    rotulo: 'Excluir',
    desfazer: () => {
      const atual = get();
      const pai = atual.nos[no.paiId!];
      const restaurados = { ...atual.nos };
      const sqlVolta: Instrucao[] = [];
      // Se o pai original também sumiu nesse meio-tempo, o ramo volta preso à raiz.
      const paiId = pai ? pai.id : (atual.arvores[no.arvoreId]?.raizId ?? null);
      if (!paiId || !atual.nos[paiId]) return;
      for (const r of removidos) restaurados[r.id] = r.id === noId ? { ...r, paiId } : r;
      const irmaos = filhosDe(atual.nos, paiId).slice();
      irmaos.splice(Math.min(no.ordem, irmaos.length), 0, noId);
      sqlVolta.push(...sqlRestaurarNos(removidos.map((r) => restaurados[r.id]!)));
      renumerar(restaurados, irmaos, sqlVolta);
      const notasVolta = { ...atual.notas };
      for (const notaId of orfas) {
        if (notasVolta[notaId]) {
          notasVolta[notaId] = { ...notasVolta[notaId]!, excluidaEm: null };
          sqlVolta.push(sqlAtualizarNota(notaId, { excluidaEm: null }));
        }
      }
      set({
        nos: restaurados,
        notas: notasVolta,
        selecionadoId: noId,
        caminho: caminhoAte(restaurados, noId),
        notaAbertaId: atual.notaAbertaId ? no.notaId : atual.notaAbertaId,
      });
      void enfileirar(sqlVolta);
      if (atual.arvoreAtualId === no.arvoreId) pedirRevelar(noId);
    },
  });
  return true;
}

// ------------------------------------------------------------------ notas

export function renomearNota(notaId: string, titulo: string): void {
  const s = get();
  const nota = s.notas[notaId];
  if (!nota || nota.titulo === titulo) return;
  const atualizadaEm = agora();
  set({ notas: { ...s.notas, [notaId]: { ...nota, titulo, atualizadaEm } } });
  void enfileirar([sqlAtualizarNota(notaId, { titulo, atualizadaEm })]);
}

export function mudarTipoDaNota(notaId: string, tipoId: string): void {
  const s = get();
  const nota = s.notas[notaId];
  if (!nota || !s.tipos[tipoId] || nota.tipoId === tipoId) return;
  const atualizadaEm = agora();
  set({ notas: { ...s.notas, [notaId]: { ...nota, tipoId, atualizadaEm } } });
  void enfileirar([sqlAtualizarNota(notaId, { tipoId, atualizadaEm })]);
}

/** Instruções para gravar o conteúdo de uma nota e os links que saem dela. */
export function sqlConteudoDaNota(
  notaId: string,
  conteudo: string,
  texto: string,
  mencoes: string[],
  atualizadaEm: number,
): Instrucao[] {
  return [
    sqlAtualizarNota(notaId, { conteudo, texto, atualizadaEm }),
    { sql: 'DELETE FROM links WHERE origemId = ?', params: [notaId] },
    ...mencoes.map((destino) => ({
      sql: 'INSERT OR IGNORE INTO links (origemId, destinoId) VALUES (?, ?)',
      params: [notaId, destino],
    })),
  ];
}

/** Atualiza a data da nota em memória depois de um salvamento de conteúdo. */
export function marcarNotaSalva(notaId: string, atualizadaEm: number): void {
  const s = get();
  const nota = s.notas[notaId];
  if (nota) set({ notas: { ...s.notas, [notaId]: { ...nota, atualizadaEm } } });
}

// ------------------------------------------------------------------ tipos

export function salvarTipo(tipo: TipoNota): void {
  set({ tipos: { ...get().tipos, [tipo.id]: tipo } });
  void enfileirar([sqlSalvarTipo(tipo)]);
}

// ------------------------------------------------------------------ árvores

export function selecionarArvore(arvoreId: string): void {
  const s = get();
  if (!s.arvores[arvoreId]) return;
  set({
    arvoreAtualId: arvoreId,
    selecionadoId: null,
    caminho: VAZIO,
    edicao: null,
    movendoId: null,
    gavetaAberta: false,
    notaExpandida: false,
    notaAbertaId: s.arvoreAtualId === arvoreId ? s.notaAbertaId : null,
    pedidoVerTudo: s.pedidoVerTudo + 1,
  });
  guardarPreferencia('arvoreAtual', arvoreId);
}

/** Cria uma árvore nova, com a nota raiz de mesmo nome. */
export function criarArvore(nome: string): string {
  const s = get();
  const limpo = nome.replace(/\s+/g, ' ').trim() || 'Nova árvore';
  const nota = novaNota(limpo, TIPO_GERAL);
  const arvoreId = uid();
  const raiz: No = {
    id: uid(),
    arvoreId,
    notaId: nota.id,
    paiId: null,
    ordem: 0,
    rotuloDoRamo: null,
    recolhido: false,
  };
  const ordem = Object.values(s.arvores).reduce((m, a) => Math.max(m, a.ordem), -1) + 1;
  const arvore: Arvore = { id: arvoreId, nome: limpo, raizId: raiz.id, ordem, criadaEm: agora(), excluidaEm: null };
  set({
    notas: { ...s.notas, [nota.id]: meta(nota) },
    nos: { ...s.nos, [raiz.id]: raiz },
    arvores: { ...s.arvores, [arvoreId]: arvore },
  });
  void enfileirar([sqlInserirNota(nota), sqlInserirNo(raiz), sqlInserirArvore(arvore)]);
  selecionarArvore(arvoreId);
  return arvoreId;
}

export function renomearArvore(arvoreId: string, nome: string): void {
  const s = get();
  const arvore = s.arvores[arvoreId];
  const limpo = nome.replace(/\s+/g, ' ').trim();
  if (!arvore || !limpo || limpo === arvore.nome) return;
  set({ arvores: { ...s.arvores, [arvoreId]: { ...arvore, nome: limpo } } });
  void enfileirar([sqlAtualizarArvore(arvoreId, { nome: limpo })]);
}

export function resumoDaArvore(arvoreId: string): ResumoExclusao {
  const s = get();
  const arvore = s.arvores[arvoreId];
  if (!arvore) return { nos: 0, notasParaLixeira: 0 };
  const ids = new Set(ramoDe(s.nos, arvore.raizId));
  return { nos: ids.size, notasParaLixeira: notasOrfas(s.nos, ids).length };
}

/** Exclui a árvore inteira (reversível). As notas sem outro uso vão para a lixeira. */
export function excluirArvore(arvoreId: string): boolean {
  const s = get();
  const arvore = s.arvores[arvoreId];
  if (!arvore) return false;
  const ids = ramoDe(s.nos, arvore.raizId);
  const conjunto = new Set(ids);
  const removidos = ids.map((id) => s.nos[id]!).filter(Boolean);
  const orfas = notasOrfas(s.nos, conjunto);
  const quando = agora();
  const lote = uid();

  const nos = { ...s.nos };
  for (const id of ids) delete nos[id];
  const notas = { ...s.notas };
  const arvores = { ...s.arvores };
  delete arvores[arvoreId];
  const sql: Instrucao[] = [
    ...sqlExcluirNos(ids, quando, lote),
    sqlAtualizarArvore(arvoreId, { excluidaEm: quando }),
  ];
  for (const notaId of orfas) {
    notas[notaId] = { ...notas[notaId]!, excluidaEm: quando };
    sql.push(sqlAtualizarNota(notaId, { excluidaEm: quando }));
  }
  const eraAtual = s.arvoreAtualId === arvoreId;
  const proxima = eraAtual ? (arvoresOrdenadas(arvores)[0]?.id ?? null) : s.arvoreAtualId;
  set({
    nos,
    notas,
    arvores,
    arvoreAtualId: proxima,
    selecionadoId: eraAtual ? null : s.selecionadoId,
    caminho: eraAtual ? VAZIO : s.caminho,
    notaAbertaId: eraAtual || (s.notaAbertaId && orfas.includes(s.notaAbertaId)) ? null : s.notaAbertaId,
    notaExpandida: eraAtual ? false : s.notaExpandida,
    edicao: null,
    movendoId: null,
    pedidoVerTudo: s.pedidoVerTudo + 1,
  });
  void enfileirar(sql);
  if (eraAtual && proxima) guardarPreferencia('arvoreAtual', proxima);

  registrarDesfazer({
    rotulo: 'Excluir árvore',
    desfazer: () => {
      const atual = get();
      const nosVolta = { ...atual.nos };
      for (const r of removidos) nosVolta[r.id] = r;
      const notasVolta = { ...atual.notas };
      const sqlVolta: Instrucao[] = [
        ...sqlRestaurarNos(removidos),
        sqlAtualizarArvore(arvoreId, { excluidaEm: null }),
      ];
      for (const notaId of orfas) {
        if (notasVolta[notaId]) {
          notasVolta[notaId] = { ...notasVolta[notaId]!, excluidaEm: null };
          sqlVolta.push(sqlAtualizarNota(notaId, { excluidaEm: null }));
        }
      }
      set({ nos: nosVolta, notas: notasVolta, arvores: { ...atual.arvores, [arvoreId]: arvore } });
      void enfileirar(sqlVolta);
      selecionarArvore(arvoreId);
    },
  });
  return true;
}

/**
 * Cria uma árvore grande, com tipos e rótulos variados, para conferir no
 * próprio tablet se a navegação continua fluida com centenas de nós.
 */
export function criarArvoreDeTeste(total: number): string {
  const s = get();
  const tipos = tiposOrdenados(s.tipos).map((t) => t.id);
  const quando = agora();
  const arvoreId = uid();
  const notas: Record<string, NotaMeta> = { ...s.notas };
  const nos: Record<string, No> = { ...s.nos };
  const sql: Instrucao[] = [];
  // Gerador determinístico: a mesma árvore em toda execução.
  let semente = 20240607;
  const sorteio = () => {
    semente = (semente * 1664525 + 1013904223) % 4294967296;
    return semente / 4294967296;
  };
  const rotulos = ['se positivo', '30%', 'se negativo', '70%', 'grave', 'leve', null, null, null];
  const criar = (titulo: string, tipoId: string, paiId: string | null, ordem: number): string => {
    const nota: Nota = { ...novaNota(titulo, tipoId), criadaEm: quando, atualizadaEm: quando };
    const no: No = {
      id: uid(),
      arvoreId,
      notaId: nota.id,
      paiId,
      ordem,
      rotuloDoRamo: paiId ? rotulos[Math.floor(sorteio() * rotulos.length)]! : null,
      recolhido: false,
    };
    notas[nota.id] = meta(nota);
    nos[no.id] = no;
    sql.push(sqlInserirNota(nota), sqlInserirNo(no));
    return no.id;
  };
  const nome = `Teste com ${total} nós`;
  const raizId = criar(nome, TIPO_GERAL, null, 0);
  const abertos: Array<{ id: string; nivel: number; filhos: number }> = [{ id: raizId, nivel: 0, filhos: 0 }];
  let criados = 1;
  while (criados < total) {
    // Sorteia um pai qualquer com menos de 5 níveis: dá uma árvore larga, de 5 a 6 níveis.
    const candidatos = abertos.filter((a) => a.nivel < 5);
    const pai = candidatos[Math.floor(sorteio() * candidatos.length)] ?? abertos[0]!;
    const tipoId = tipos[Math.floor(sorteio() * tipos.length)] ?? TIPO_GERAL;
    const id = criar(`${s.tipos[tipoId]?.nome ?? 'Nota'} ${criados}`, tipoId, pai.id, pai.filhos);
    pai.filhos++;
    abertos.push({ id, nivel: pai.nivel + 1, filhos: 0 });
    criados++;
  }
  const ordem = Object.values(s.arvores).reduce((m, a) => Math.max(m, a.ordem), -1) + 1;
  const arvore: Arvore = { id: arvoreId, nome, raizId, ordem, criadaEm: quando, excluidaEm: null };
  sql.push(sqlInserirArvore(arvore));
  set({ notas, nos, arvores: { ...s.arvores, [arvoreId]: arvore } });
  void enfileirar(sql);
  selecionarArvore(arvoreId);
  return arvoreId;
}

// ------------------------------------------------------------------ gravação

/** Espera a fila de escrita esvaziar. */
export function aguardarGravacao(): Promise<void> {
  return aguardarEscritas();
}
