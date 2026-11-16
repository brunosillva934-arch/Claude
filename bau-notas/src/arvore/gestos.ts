/**
 * Gestos sobre um nó, usados tanto pelo cartão do nó quanto pelo título que o
 * representa com o zoom reduzido:
 *  - toque: seleciona (e mostra "+ Filho" / "+ Irmão" ao lado);
 *  - toque duplo: abre a nota;
 *  - toque longo: abre o menu; sem soltar, arrastar troca o nó de pai;
 *  - com mouse: botão direito abre o menu e arrastar move o nó.
 */
import type { MouseEvent as EventoMouse, PointerEvent as EventoPonteiro } from 'react';
import { expandirNota, moverNo, pedirRevelar, podeMover, selecionar, tituloDaNota, useLoja } from '../estado/loja';
import { toqueHaptico } from '../nativo/ponte';
import { avisar, fecharMenu } from '../ui/servico';
import { abrirMenuDoNo, avisarDesfazer } from './acoesNo';
import { atualizarArrasto, cancelarArrasto, concluirArrasto, iniciarArrasto } from './arrasto';

const TEMPO_TOQUE_LONGO = 450;
const TEMPO_TOQUE_DUPLO = 350;

interface Gesto {
  noId: string;
  ponteiro: number;
  x: number;
  y: number;
  mouse: boolean;
  temporizador: number;
  longo: boolean;
  arrastando: boolean;
  encerrar: () => void;
}

/** Só um gesto por vez em toda a árvore. */
let gestoAtual: Gesto | null = null;
let ultimoToque = { id: '', quando: 0 };
/** Nó cujo próximo clique deve ser ignorado (o clique que fecha um toque longo ou um arrasto). */
let ignorarCliqueDe: string | null = null;

function ehRaiz(noId: string): boolean {
  return !useLoja.getState().nos[noId]?.paiId;
}

/** Abre o menu do nó ancorado ao lado do elemento tocado. */
export function menuDoNo(noId: string, elemento: Element, aposSoltar = false): void {
  const r = elemento.getBoundingClientRect();
  selecionar(noId);
  abrirMenuDoNo(noId, Math.round(r.right + 8), Math.round(r.top), aposSoltar);
}

/**
 * Início do toque (ou do clique do mouse) sobre um nó.
 * `arrastarComMouse`: no cartão do nó, arrastar com o mouse move o nó.
 */
export function aoBaixarNoNo(noId: string, e: EventoPonteiro, arrastarComMouse: boolean): void {
  if (useLoja.getState().edicao?.noId === noId) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const elemento = e.currentTarget;
  gestoAtual?.encerrar();
  ignorarCliqueDe = null;

  const mover = (ev: PointerEvent) => {
    const g = gestoAtual;
    if (!g || ev.pointerId !== g.ponteiro) return;
    const distancia = Math.hypot(ev.clientX - g.x, ev.clientY - g.y);
    if (g.arrastando) {
      atualizarArrasto(ev.clientX, ev.clientY);
      return;
    }
    if (g.mouse) {
      if (arrastarComMouse && distancia > 6 && !ehRaiz(noId) && !useLoja.getState().movendoId) {
        g.arrastando = iniciarArrasto(noId, ev.clientX, ev.clientY);
        if (g.arrastando) ignorarCliqueDe = noId;
      }
      return;
    }
    if (!g.longo) {
      // O dedo andou antes do toque longo: é o canvas sendo arrastado.
      if (distancia > 10) g.encerrar();
      return;
    }
    if (distancia > 12 && !ehRaiz(noId)) {
      fecharMenu();
      g.arrastando = iniciarArrasto(noId, ev.clientX, ev.clientY);
    }
  };
  const soltar = (ev: PointerEvent) => {
    const g = gestoAtual;
    if (!g || ev.pointerId !== g.ponteiro) return;
    if (g.arrastando) concluirArrasto();
    g.encerrar();
  };
  const cancelar = (ev: PointerEvent) => {
    const g = gestoAtual;
    if (!g || ev.pointerId !== g.ponteiro) return;
    if (g.arrastando) cancelarArrasto();
    g.encerrar();
  };
  // Depois do toque longo o dedo passa a mover o nó: o canvas não pode receber o movimento.
  const segurarCanvas = (ev: TouchEvent) => {
    const g = gestoAtual;
    if (g && (g.longo || g.arrastando)) {
      ev.stopPropagation();
      if (ev.cancelable) ev.preventDefault();
    }
  };

  const gesto: Gesto = {
    noId,
    ponteiro: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    mouse: e.pointerType === 'mouse',
    temporizador: 0,
    longo: false,
    arrastando: false,
    encerrar: () => {
      window.clearTimeout(gesto.temporizador);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', cancelar);
      window.removeEventListener('touchmove', segurarCanvas, true);
      if (gestoAtual === gesto) gestoAtual = null;
    },
  };
  if (!gesto.mouse) {
    gesto.temporizador = window.setTimeout(() => {
      if (gestoAtual !== gesto || useLoja.getState().movendoId) return;
      gesto.longo = true;
      ignorarCliqueDe = noId;
      toqueHaptico();
      menuDoNo(noId, elemento, true);
    }, TEMPO_TOQUE_LONGO);
  }
  gestoAtual = gesto;
  window.addEventListener('pointermove', mover, { passive: true });
  window.addEventListener('pointerup', soltar);
  window.addEventListener('pointercancel', cancelar);
  window.addEventListener('touchmove', segurarCanvas, { capture: true, passive: false });
}

export function aoClicarNoNo(noId: string, e: EventoMouse): void {
  const s = useLoja.getState();
  if (s.edicao?.noId === noId) return;
  if (ignorarCliqueDe === noId) {
    ignorarCliqueDe = null;
    return;
  }
  const no = s.nos[noId];
  if (!no) return;
  if (s.movendoId) {
    // Modo "mover": o nó tocado vira o novo pai.
    if (s.movendoId === noId) return;
    if (!podeMover(s.movendoId, noId)) {
      avisar('Não dá para mover um nó para dentro do próprio ramo');
      return;
    }
    const movido = tituloDaNota(s.notas[s.nos[s.movendoId]!.notaId]);
    const destino = tituloDaNota(s.notas[no.notaId]);
    if (moverNo(s.movendoId, noId)) avisarDesfazer(`“${movido}” movido para “${destino}”`);
    return;
  }
  const agora = e.timeStamp;
  const duplo = ultimoToque.id === noId && agora - ultimoToque.quando < TEMPO_TOQUE_DUPLO;
  ultimoToque = { id: noId, quando: duplo ? 0 : agora };
  selecionar(noId);
  if (duplo) expandirNota(true);
  // Se o nó estiver na beira da tela, o canvas desliza o mínimo para os botões de ação caberem.
  else pedirRevelar(noId);
}

/** Botão direito do mouse. No toque, quem abre o menu é o temporizador do toque longo. */
export function aoMenuDeContexto(noId: string, e: EventoMouse): void {
  e.preventDefault();
  if (useLoja.getState().edicao?.noId === noId) return;
  if ((e.nativeEvent as PointerEvent).pointerType === 'touch' || gestoAtual?.longo) return;
  menuDoNo(noId, e.currentTarget);
}
