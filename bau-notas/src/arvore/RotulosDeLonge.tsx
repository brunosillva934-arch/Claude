/**
 * Títulos legíveis com o zoom bem reduzido.
 *
 * Abaixo de certo zoom o texto dentro dos nós ficaria ilegível. Os nós viram
 * blocos na cor do tipo e os títulos passam a ser desenhados aqui, com o ícone
 * do tipo, em fonte grande e de tamanho constante na tela. Os rótulos dos
 * ramos também aparecem, sempre que couberem. Quando não cabe tudo, têm
 * prioridade os nós mais próximos da raiz (e o nó selecionado): é como um
 * mapa, em que as cidades pequenas só aparecem quando se aproxima.
 */
import { memo, useMemo } from 'react';
import { ViewportPortal, useStore } from '@xyflow/react';
import { Hash, type LucideIcon } from 'lucide-react';
import { tituloDaNota, useLoja } from '../estado/loja';
import { iconeDoTipo } from '../ui/icones';
import { coresDoTipo } from '../util/cores';
import { aoBaixarNoNo, aoClicarNoNo, aoMenuDeContexto } from './gestos';
import { ALTURA_NO, LARGURA_NO, MAX_ROTULO, filhosVisiveis, type Disposicao } from './layout';

/** Abaixo deste zoom a árvore entra no modo "de longe". */
export const ZOOM_DE_LONGE = 0.62;

interface Titulo {
  id: string;
  x: number;
  y: number;
  texto: string;
  nivel: number;
  cor: string;
  fundo: string;
  icone: LucideIcon;
  /** Largura da coluna (nó + vão), em unidades do canvas: limita o título na tela. */
  coluna: number;
  /** Pixels de tela guardados, no fim da coluna, para os rótulos dos ramos dos filhos. */
  reserva: number;
  /** Folha: não há nada à direita, o título pode se estender. */
  folha: boolean;
  /** Linhas que o título pode ocupar (1 a 3). */
  linhas: number;
}

interface Ramo {
  id: string;
  x: number;
  y: number;
  texto: string;
}

interface Caixa {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const DEGRAUS_POR_OITAVA = 24;
const LARGURA_FOLHA = 340;
const LARGURA_MINIMA = 132;
const ALTURA_RAMO = 19;

function encurtar(rotulo: string): string {
  return rotulo.length > MAX_ROTULO ? rotulo.slice(0, MAX_ROTULO - 1) + '…' : rotulo;
}

/** Largura na tela, em px, do rótulo de um ramo no modo "de longe". */
function larguraDoRamo(rotulo: string | null): number {
  return rotulo ? encurtar(rotulo).length * 6.3 + 16 : 0;
}

/** Largura estimada, em pixels de tela, do título de uma folha no modo "de longe". */
export function larguraDoTituloDeLonge(texto: string, nivel: number): number {
  return Math.min(texto.length * fonteDoNivel(nivel) * 0.62 + 34, LARGURA_FOLHA);
}

function fonteDoNivel(nivel: number): number {
  return nivel === 0 ? 17 : nivel === 1 ? 15 : 13;
}

function RotulosDeLongeBase({ disposicao }: { disposicao: Disposicao }) {
  // O zoom entra em degraus finos (3% cada): os rótulos só são recalculados quando muda de degrau.
  // A conta usa o menor zoom do degrau; ao aproximar, as distâncias só aumentam.
  const degrau = useStore((s) =>
    s.transform[2] < ZOOM_DE_LONGE ? Math.floor(Math.log2(s.transform[2]) * DEGRAUS_POR_OITAVA) : null,
  );
  const nos = useLoja((s) => s.nos);
  const notas = useLoja((s) => s.notas);
  const tipos = useLoja((s) => s.tipos);
  const escuro = useLoja((s) => s.escuro);
  const selecionadoId = useLoja((s) => s.selecionadoId);
  const caminho = useLoja((s) => s.caminho);
  const editandoId = useLoja((s) => s.edicao?.noId ?? null);

  const { titulos, ramos } = useMemo(() => {
    const titulos: Titulo[] = [];
    const ramos: Ramo[] = [];
    if (degrau === null) return { titulos, ramos };
    const zoom = Math.pow(2, degrau / DEGRAUS_POR_OITAVA);
    const colocadas: Caixa[] = [];
    const livre = (c: Caixa) => {
      for (const o of colocadas) {
        if (c.x1 < o.x2 && c.x2 > o.x1 && c.y1 < o.y2 && c.y2 > o.y1) return false;
      }
      return true;
    };

    const tentarTitulo = (id: string, obrigatorio: boolean) => {
      const pos = disposicao.posicoes.get(id);
      const no = nos[id];
      if (!pos || !no || id === editandoId) return;
      const nota = notas[no.notaId];
      const tipo = nota ? tipos[nota.tipoId] : undefined;
      const topico = nota?.topico === true;
      const cores = coresDoTipo(topico ? '#6B7785' : (tipo?.cor ?? '#6B7785'), escuro);
      const texto = tituloDaNota(nota);
      const fonte = fonteDoNivel(pos.nivel);
      const vao = disposicao.vaos[pos.nivel] ?? 96;
      const coluna = LARGURA_NO + vao;
      const filhos = filhosVisiveis(nos, id);
      const folha = filhos.length === 0;
      // Se os filhos têm rótulo no ramo e ele cabe no vão, o título deixa esse espaço livre.
      let reserva = 0;
      for (const filho of filhos) {
        const l = larguraDoRamo(nos[filho]!.rotuloDoRamo);
        if (l > 0 && l <= vao * zoom - 12 && l + 14 > reserva) reserva = l + 14;
      }
      const necessaria = texto.length * fonte * 0.6 + 34;
      // Se, guardando o espaço dos rótulos, o título ficasse espremido, o título tem preferência:
      // os rótulos dos ramos desse nó só entram onde sobrar lugar.
      if (reserva > 0 && coluna * zoom - 8 - reserva < Math.min(necessaria, LARGURA_MINIMA)) reserva = 0;
      // Um nó com filhos nunca passa da própria coluna, para não cobrir o título dos filhos.
      const daColuna = coluna * zoom - 8;
      const maxima = folha ? LARGURA_FOLHA : Math.max(daColuna - reserva, Math.min(LARGURA_MINIMA, daColuna));
      // Um nó com vários filhos tem altura livre ao redor: o título pode quebrar em
      // duas linhas (dois filhos) ou três (três ou mais).
      const linhas = !folha && necessaria > maxima ? Math.min(3, filhos.length) : 1;
      const largura = Math.min(necessaria, maxima);
      // Para a colisão vale a altura da letra, não a do fundo: os fundos podem se encostar.
      const linha = fonte + 5;
      const altura = linha * linhas - 2 * (linhas - 1);
      // Em coordenadas de tela (multiplicadas pelo zoom), para medir colisão.
      const x1 = pos.x * zoom;
      const yc = (pos.y + ALTURA_NO / 2) * zoom;
      const caixa = { x1, y1: yc - altura / 2, x2: x1 + largura, y2: yc + altura / 2 };
      if (!obrigatorio && !livre(caixa)) return;
      colocadas.push(caixa);
      titulos.push({
        id,
        x: pos.x,
        y: pos.y + ALTURA_NO / 2,
        texto,
        nivel: pos.nivel,
        cor: cores.texto,
        fundo: cores.fraca,
        icone: topico ? Hash : iconeDoTipo(tipo?.icone),
        coluna,
        reserva,
        folha,
        linhas,
      });
    };

    if (selecionadoId && disposicao.posicoes.has(selecionadoId)) tentarTitulo(selecionadoId, true);
    // Do nível mais raso para o mais fundo: quem está perto da raiz escolhe lugar primeiro.
    const porNivel = disposicao.ordem
      .filter((id) => id !== selecionadoId)
      .sort((a, b) => disposicao.posicoes.get(a)!.nivel - disposicao.posicoes.get(b)!.nivel);
    for (const id of porNivel) tentarTitulo(id, false);

    // Depois dos títulos, os rótulos dos ramos, onde houver espaço livre antes do nó filho.
    for (const id of disposicao.ordem) {
      const no = nos[id];
      const pos = disposicao.posicoes.get(id);
      if (!no || !pos || !no.rotuloDoRamo || pos.nivel === 0) continue;
      const texto = encurtar(no.rotuloDoRamo);
      const largura = larguraDoRamo(no.rotuloDoRamo);
      const vaoNaTela = (disposicao.vaos[pos.nivel - 1] ?? 96) * zoom;
      if (largura > vaoNaTela - 12) continue;
      const x2 = pos.x * zoom - 5;
      const yc = (pos.y + ALTURA_NO / 2) * zoom;
      const caixa = { x1: x2 - largura, y1: yc - ALTURA_RAMO / 2, x2, y2: yc + ALTURA_RAMO / 2 };
      if (!livre(caixa)) continue;
      colocadas.push(caixa);
      ramos.push({ id, x: pos.x, y: pos.y + ALTURA_NO / 2, texto });
    }
    return { titulos, ramos };
  }, [degrau, disposicao, nos, notas, tipos, escuro, selecionadoId, editandoId]);

  if (titulos.length === 0) return null;
  return (
    <ViewportPortal>
      {ramos.map((r) => (
        <div
          key={'r' + r.id}
          className={'ramo-longe' + (caminho.has(r.id) ? ' no-caminho' : '')}
          style={{
            transform: `translate(${r.x}px, ${r.y}px) scale(calc(1 / var(--zoom, 1))) translate(calc(-100% - 5px), -50%)`,
          }}
        >
          {r.texto}
        </div>
      ))}
      {titulos.map((t) => {
        const Icone = t.icone;
        return (
          <div
            key={t.id}
            className={
              'rotulo-longe nivel-' +
              Math.min(t.nivel, 2) +
              (t.linhas > 1 ? ' varias-linhas' : '') +
              (t.id === selecionadoId ? ' selecionado' : '')
            }
            data-rotulo={t.texto}
            style={{
              transform: `translate(${t.x}px, ${t.y}px) scale(calc(1 / var(--zoom, 1))) translate(0, -50%)`,
              maxWidth: t.folha
                ? LARGURA_FOLHA
                : `max(min(${LARGURA_MINIMA}px, calc(var(--zoom, 1) * ${t.coluna}px - 8px)), ` +
                  `calc(var(--zoom, 1) * ${t.coluna}px - ${8 + t.reserva}px))`,
              color: t.cor,
              ['--linhas' as string]: t.linhas,
              backgroundImage: `linear-gradient(${t.fundo}, ${t.fundo})`,
            }}
            onPointerDown={(e) => aoBaixarNoNo(t.id, e, false)}
            onClick={(e) => {
              e.stopPropagation();
              aoClicarNoNo(t.id, e);
            }}
            onContextMenu={(e) => aoMenuDeContexto(t.id, e)}
          >
            <Icone size={t.nivel === 0 ? 17 : 15} />
            <span>{t.texto}</span>
          </div>
        );
      })}
    </ViewportPortal>
  );
}

export const RotulosDeLonge = memo(RotulosDeLongeBase);
