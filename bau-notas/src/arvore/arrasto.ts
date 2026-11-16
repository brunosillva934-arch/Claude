/**
 * Arrastar um nó para trocá-lo de pai (depois do toque longo; com mouse,
 * arrastando direto).
 *
 * Soltar no meio de um nó torna o arrastado filho dele; soltar na borda de
 * cima ou de baixo o coloca como irmão, antes ou depois.
 */
import {
  definirArrasto, filhosDe, moverNo, podeMover, tituloDaNota, useLoja, type Arrasto, type PosicaoSolta,
} from '../estado/loja';
import { avisarDesfazer } from './acoesNo';
import { contexto } from './contexto';
import { ALTURA_NO, ESPACO_V, LARGURA_NO } from './layout';

interface Ativo {
  noId: string;
  titulo: string;
  x: number;
  y: number;
  quadro: number;
}

let ativo: Ativo | null = null;
const BORDA = 56;
const PASSO = 16;

function calcularAlvo(noId: string, x: number, y: number): Arrasto {
  const nada: Arrasto = { noId, alvoId: null, posicao: 'dentro' };
  const c = contexto.atual;
  if (!c) return nada;
  const p = c.rf.screenToFlowPosition({ x, y });
  const { nos } = useLoja.getState();
  for (const id of c.disposicao.ordem) {
    const pos = c.disposicao.posicoes.get(id)!;
    if (p.x < pos.x - 12 || p.x > pos.x + LARGURA_NO + 12) continue;
    if (p.y < pos.y - ESPACO_V / 2 || p.y > pos.y + ALTURA_NO + ESPACO_V / 2) continue;
    const alvo = nos[id];
    if (!alvo || id === noId) return nada;
    const altura = (p.y - pos.y) / ALTURA_NO;
    let posicao: PosicaoSolta = altura < 0.26 ? 'antes' : altura > 0.74 ? 'depois' : 'dentro';
    if (!alvo.paiId) posicao = 'dentro';
    const novoPai = posicao === 'dentro' ? id : alvo.paiId!;
    if (!podeMover(noId, novoPai)) return nada;
    return { noId, alvoId: id, posicao };
  }
  return nada;
}

function quadro(): void {
  const a = ativo;
  const c = contexto.atual;
  if (!a || !c) return;
  // Perto da borda do canvas, a árvore desliza para alcançar destinos fora da tela.
  const r = c.envoltorio.getBoundingClientRect();
  let dx = 0;
  let dy = 0;
  if (a.x < r.left + BORDA) dx = PASSO;
  else if (a.x > r.right - BORDA) dx = -PASSO;
  if (a.y < r.top + BORDA) dy = PASSO;
  else if (a.y > r.bottom - BORDA) dy = -PASSO;
  if (dx || dy) {
    const v = c.rf.getViewport();
    void c.rf.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom });
  }
  definirArrasto(calcularAlvo(a.noId, a.x, a.y));
  a.quadro = requestAnimationFrame(quadro);
}

export function arrastando(): boolean {
  return ativo !== null;
}

export function iniciarArrasto(noId: string, x: number, y: number): boolean {
  const s = useLoja.getState();
  const no = s.nos[noId];
  const c = contexto.atual;
  if (!no || !no.paiId || !c) return false;
  const titulo = tituloDaNota(s.notas[no.notaId]);
  ativo = { noId, titulo, x, y, quadro: 0 };
  definirArrasto({ noId, alvoId: null, posicao: 'dentro' });
  c.moverFantasma(x, y, titulo);
  ativo.quadro = requestAnimationFrame(quadro);
  return true;
}

export function atualizarArrasto(x: number, y: number): void {
  if (!ativo) return;
  ativo.x = x;
  ativo.y = y;
  contexto.atual?.moverFantasma(x, y, ativo.titulo);
}

function encerrar(): void {
  if (ativo) cancelAnimationFrame(ativo.quadro);
  ativo = null;
  contexto.atual?.moverFantasma(0, 0, null);
  definirArrasto(null);
}

export function cancelarArrasto(): void {
  encerrar();
}

export function concluirArrasto(): void {
  const a = ativo;
  if (!a) return;
  const destino = calcularAlvo(a.noId, a.x, a.y);
  encerrar();
  if (!destino.alvoId) return;
  const { nos } = useLoja.getState();
  const alvo = nos[destino.alvoId];
  if (!alvo) return;
  let moveu: boolean;
  if (destino.posicao === 'dentro') {
    moveu = moverNo(a.noId, alvo.id);
  } else {
    const paiId = alvo.paiId!;
    const irmaos = filhosDe(nos, paiId).filter((id) => id !== a.noId);
    const i = irmaos.indexOf(alvo.id);
    moveu = moverNo(a.noId, paiId, destino.posicao === 'antes' ? i : i + 1);
  }
  if (moveu) avisarDesfazer(`“${a.titulo}” movido`);
}
