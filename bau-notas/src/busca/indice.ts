/**
 * Índice da busca (MiniSearch).
 *
 * - ignora acentos e maiúsculas: "hipertensao" encontra "Hipertensão";
 * - tolera erros de digitação (busca aproximada) e aceita só o começo da palavra;
 * - procura no título e no conteúdo, com o título valendo mais.
 */
import MiniSearch from 'minisearch';
import type { NotaMeta } from '../dados/tipos';
import { normalizar } from '../util/texto';

export interface Trecho {
  antes: string;
  achado: string;
  depois: string;
}

export interface Achado {
  notaId: string;
  pontos: number;
  /** Parte do título que casou com a busca, para destacar. */
  titulo: Trecho | null;
  /** Trecho do conteúdo em que a busca foi encontrada. */
  trecho: Trecho | null;
}

interface Documento {
  id: string;
  titulo: string;
  resumo: string;
  texto: string;
}

/**
 * Tira acentos e maiúsculas sem mudar o comprimento do texto: uma posição
 * encontrada no texto normalizado vale também no original.
 */
export function normalizarAlinhado(s: string): string {
  let saida = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    const n = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (n.length === 1) saida += n;
    else {
      const m = c.toLowerCase();
      saida += m.length === 1 ? m : c;
    }
  }
  return saida;
}

/** Recorta o texto em volta da primeira ocorrência de um dos termos. */
function recortar(texto: string, termos: string[], margemAntes: number, margemDepois: number): Trecho | null {
  if (!texto || termos.length === 0) return null;
  const norm = normalizarAlinhado(texto);
  let onde = -1;
  let tamanho = 0;
  for (const termo of termos) {
    // De preferência no começo de uma palavra.
    let i = norm.indexOf(termo);
    while (i > 0 && /[a-z0-9]/.test(norm[i - 1]!)) i = norm.indexOf(termo, i + 1);
    if (i < 0) i = norm.indexOf(termo);
    if (i >= 0 && (onde < 0 || i < onde)) {
      onde = i;
      tamanho = termo.length;
    }
  }
  if (onde < 0) return null;
  let inicio = Math.max(0, onde - margemAntes);
  if (inicio > 0) {
    const espaco = texto.indexOf(' ', inicio);
    if (espaco >= 0 && espaco < onde) inicio = espaco + 1;
  }
  const fim = Math.min(texto.length, onde + tamanho + margemDepois);
  const limpar = (t: string) => t.replace(/\s+/g, ' ');
  return {
    antes: (inicio > 0 ? '…' : '') + limpar(texto.slice(inicio, onde)),
    achado: texto.slice(onde, onde + tamanho),
    depois: limpar(texto.slice(onde + tamanho, fim)) + (fim < texto.length ? '…' : ''),
  };
}

export class IndiceDeBusca {
  private readonly mini: MiniSearch<Documento>;
  private readonly titulos = new Map<string, string>();
  private readonly resumos = new Map<string, string>();
  /** false enquanto o conteúdo das notas ainda não foi carregado (busca só nos títulos). */
  readonly comConteudo: boolean;

  constructor(notas: NotaMeta[], private readonly textos: Map<string, string> | null) {
    this.comConteudo = textos !== null;
    this.mini = new MiniSearch<Documento>({
      fields: ['titulo', 'resumo', 'texto'],
      processTerm: (termo) => normalizar(termo) || null,
      searchOptions: {
        boost: { titulo: 5, resumo: 2 },
        prefix: true,
        fuzzy: (termo) => (termo.length > 3 ? 0.2 : false),
        combineWith: 'AND',
      },
    });
    const documentos: Documento[] = [];
    for (const n of notas) {
      this.titulos.set(n.id, n.titulo);
      const resumo = n.topico ? n.resumo : '';
      if (resumo) this.resumos.set(n.id, resumo);
      const texto = n.topico || n.secao ? '' : (textos?.get(n.id) ?? '');
      documentos.push({ id: n.id, titulo: n.titulo, resumo, texto });
    }
    this.mini.addAll(documentos);
  }

  buscar(consulta: string): Achado[] {
    if (!normalizar(consulta)) return [];
    return this.mini.search(consulta).map((r) => {
      const noTitulo: string[] = [];
      const noResumo: string[] = [];
      const noTexto: string[] = [];
      for (const termo of Object.keys(r.match)) {
        const campos = r.match[termo]!;
        if (campos.includes('titulo')) noTitulo.push(termo);
        if (campos.includes('resumo')) noResumo.push(termo);
        if (campos.includes('texto')) noTexto.push(termo);
      }
      const id = String(r.id);
      return {
        notaId: id,
        pontos: r.score,
        titulo: recortar(this.titulos.get(id) ?? '', noTitulo, 1000, 1000),
        trecho:
          recortar(this.resumos.get(id) ?? '', noResumo, 1000, 1000) ??
          recortar(this.textos?.get(id) ?? '', noTexto, 48, 90),
      };
    });
  }
}
