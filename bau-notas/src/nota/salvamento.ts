/**
 * Salvamento automático do conteúdo das notas.
 *
 * Fica fora do caminho da digitação: o editor só avisa "mudou" (guardando uma
 * referência ao documento, que é imutável); a conversão para JSON e a gravação
 * acontecem cerca de 800 ms depois da última tecla. Ao sair da nota, ao
 * esconder o app ou ao ir para segundo plano, grava na hora.
 */
import type { Node as NoPm } from '@tiptap/pm/model';
import { enfileirar, gravarSinc } from '../dados/repositorio';
import { marcarNotaSalva, sqlConteudoDaNota, tituloDaNota, useLoja } from '../estado/loja';
import { aoEvento } from '../nativo/ponte';
import { agora } from '../util/texto';
import { mencoesDoDocumento, textoDoDocumento, type NoDoc } from './documento';
import type { Instrucao } from '../dados/banco';

const ESPERA = 800;

interface Pendente {
  doc: NoPm;
  temporizador: number;
}

const pendentes = new Map<string, Pendente>();
const ouvintes = new Set<() => void>();

function avisar(): void {
  for (const f of ouvintes) f();
}

/** Há texto digitado que ainda não foi enviado para gravação? */
export function haPendencias(notaId?: string): boolean {
  return notaId ? pendentes.has(notaId) : pendentes.size > 0;
}

export function aoMudarPendencias(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

function montar(notaId: string, doc: NoPm): Instrucao[] {
  const json = doc.toJSON() as NoDoc;
  const s = useLoja.getState();
  const vazio = doc.childCount === 1 && doc.firstChild?.isTextblock === true && doc.firstChild.content.size === 0;
  const texto = textoDoDocumento(json, (id) => tituloDaNota(s.notas[id]));
  const quando = agora();
  marcarNotaSalva(notaId, quando);
  return sqlConteudoDaNota(notaId, vazio ? '' : JSON.stringify(json), texto, mencoesDoDocumento(json), quando);
}

/** O editor chama a cada alteração. Barato: só guarda a referência e reinicia o relógio. */
export function marcarAlterada(notaId: string, doc: NoPm): void {
  const anterior = pendentes.get(notaId);
  if (anterior) window.clearTimeout(anterior.temporizador);
  pendentes.set(notaId, { doc, temporizador: window.setTimeout(() => gravarNota(notaId), ESPERA) });
  if (!anterior) avisar();
}

/** Envia para gravação o que estiver pendente desta nota. */
export function gravarNota(notaId: string): void {
  const p = pendentes.get(notaId);
  if (!p) return;
  window.clearTimeout(p.temporizador);
  pendentes.delete(notaId);
  if (useLoja.getState().notas[notaId]) void enfileirar(montar(notaId, p.doc));
  avisar();
}

export function gravarTudo(): void {
  for (const id of [...pendentes.keys()]) gravarNota(id);
}

/** Grava tudo e só volta com os dados em disco. */
function gravarTudoSinc(): void {
  const sql: Instrucao[] = [];
  for (const [id, p] of pendentes) {
    window.clearTimeout(p.temporizador);
    if (useLoja.getState().notas[id]) sql.push(...montar(id, p.doc));
  }
  pendentes.clear();
  avisar();
  try {
    gravarSinc(sql);
  } catch {
    // Se a gravação imediata falhar, tenta pelo caminho normal.
    void enfileirar(sql);
  }
}

let ligado = false;

/** Liga os gatilhos de "gravar agora": app minimizado, tela escondida, página fechando. */
export function ligarSalvamento(): void {
  if (ligado) return;
  ligado = true;
  aoEvento('pausa', gravarTudoSinc);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') gravarTudoSinc();
  });
  window.addEventListener('pagehide', gravarTudoSinc);
}
