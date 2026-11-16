/**
 * Menus, diálogos e avisos chamados de qualquer lugar do app.
 * A parte visual está em Camadas.tsx.
 */
import { create } from 'zustand';
import type { ComponentType } from 'react';

export interface ItemMenu {
  id: string;
  rotulo: string;
  icone?: ComponentType<{ size?: number | string }>;
  /** Texto pequeno à direita (atalho, valor atual). */
  detalhe?: string;
  perigo?: boolean;
  desativado?: boolean;
  /** Bolinha colorida à esquerda (lista de tipos). */
  cor?: string;
  marcado?: boolean;
  separadorAntes?: boolean;
  aoEscolher: () => void;
}

export interface MenuAberto {
  titulo?: string;
  /** Ponto da tela onde o menu ancora. */
  x: number;
  y: number;
  itens: ItemMenu[];
  /**
   * Menu aberto por toque longo, com o dedo ainda na tela: os itens só passam
   * a valer depois que o dedo é levantado, para o ato de soltar não escolher nada.
   */
  aposSoltar?: boolean;
  /**
   * Menu aberto a partir da barra do editor: tocar nele não tira o foco do
   * texto, para o teclado não fechar e reabrir a cada escolha.
   */
  manterFoco?: boolean;
}

export interface DialogoAberto {
  tipo: 'confirmar' | 'texto';
  titulo: string;
  texto?: string;
  rotuloOk: string;
  rotuloCancelar: string;
  perigo?: boolean;
  /** Só no tipo "texto". */
  valor?: string;
  dica?: string;
  permitirVazio?: boolean;
  resolver: (resposta: string | boolean | null) => void;
}

export interface Aviso {
  id: number;
  texto: string;
  acao?: { rotulo: string; aoTocar: () => void };
}

interface EstadoUi {
  menu: MenuAberto | null;
  dialogo: DialogoAberto | null;
  avisos: Aviso[];
}

export const useUi = create<EstadoUi>(() => ({ menu: null, dialogo: null, avisos: [] }));

export function abrirMenu(menu: MenuAberto): void {
  useUi.setState({ menu });
}

export function fecharMenu(): void {
  if (useUi.getState().menu) useUi.setState({ menu: null });
}

export function confirmar(opcoes: {
  titulo: string;
  texto?: string;
  rotuloOk?: string;
  perigo?: boolean;
}): Promise<boolean> {
  return new Promise((resolver) => {
    useUi.setState({
      menu: null,
      dialogo: {
        tipo: 'confirmar',
        titulo: opcoes.titulo,
        texto: opcoes.texto,
        rotuloOk: opcoes.rotuloOk ?? 'Confirmar',
        rotuloCancelar: 'Cancelar',
        perigo: opcoes.perigo,
        resolver: (r) => resolver(r === true),
      },
    });
  });
}

/** Pede um texto curto. Devolve null se a pessoa cancelar. */
export function perguntarTexto(opcoes: {
  titulo: string;
  texto?: string;
  valor?: string;
  dica?: string;
  rotuloOk?: string;
  permitirVazio?: boolean;
}): Promise<string | null> {
  return new Promise((resolver) => {
    useUi.setState({
      menu: null,
      dialogo: {
        tipo: 'texto',
        titulo: opcoes.titulo,
        texto: opcoes.texto,
        valor: opcoes.valor ?? '',
        dica: opcoes.dica,
        rotuloOk: opcoes.rotuloOk ?? 'Salvar',
        rotuloCancelar: 'Cancelar',
        permitirVazio: opcoes.permitirVazio,
        resolver: (r) => resolver(typeof r === 'string' ? r : null),
      },
    });
  });
}

export function responderDialogo(resposta: string | boolean | null): void {
  const d = useUi.getState().dialogo;
  if (!d) return;
  useUi.setState({ dialogo: null });
  d.resolver(resposta);
}

let proximoAviso = 1;
const temporizadores = new Map<number, number>();

export function dispensarAviso(id: number): void {
  const t = temporizadores.get(id);
  if (t !== undefined) clearTimeout(t);
  temporizadores.delete(id);
  useUi.setState((s) => ({ avisos: s.avisos.filter((a) => a.id !== id) }));
}

/** Mostra um aviso curto no rodapé, com uma ação opcional (ex.: "Desfazer"). */
export function avisar(
  texto: string,
  opcoes: { acao?: { rotulo: string; aoTocar: () => void }; duracao?: number } = {},
): number {
  const id = proximoAviso++;
  const duracao = opcoes.duracao ?? (opcoes.acao ? 8000 : 3200);
  // Um aviso por vez: o novo substitui o anterior.
  for (const antigo of useUi.getState().avisos) dispensarAviso(antigo.id);
  useUi.setState({ avisos: [{ id, texto, acao: opcoes.acao }] });
  temporizadores.set(id, window.setTimeout(() => dispensarAviso(id), duracao));
  return id;
}
