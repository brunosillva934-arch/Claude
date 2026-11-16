/**
 * Tema claro ou escuro.
 *
 * A pessoa escolhe entre seguir o sistema, sempre claro ou sempre escuro. A
 * escolha fica no banco (e num espelho no localStorage, lido por inicio.js
 * antes da primeira pintura, para o app já abrir na cor certa).
 *
 * No tablet quem informa o tema do sistema é a casca Android (não dependemos de
 * `prefers-color-scheme` dentro do WebView, que varia entre versões). As barras
 * do Android são pintadas na cor do app.
 */
import { definirEscuro, definirTemaPreferido, useLoja, type PreferenciaTema } from '../estado/loja';
import { aoEvento, infoSistema, pintarBarras, temNativo } from '../nativo/ponte';

const CHAVE = 'bau-tema';
const BARRAS = {
  claro: { status: '#FFFFFF', navegacao: '#F3F5F8' },
  escuro: { status: '#1A1F26', navegacao: '#111418' },
};

let sistemaEscuro = false;
let preferencia: PreferenciaTema = 'sistema';

function lerEspelho(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === 'claro' || v === 'escuro' ? v : 'sistema';
  } catch {
    return 'sistema';
  }
}

function gravarEspelho(tema: PreferenciaTema): void {
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem localStorage o app só demora um instante a mais para trocar de cor ao abrir.
  }
}

function aplicar(): void {
  const escuro = preferencia === 'sistema' ? sistemaEscuro : preferencia === 'escuro';
  document.documentElement.setAttribute('data-tema', escuro ? 'escuro' : 'claro');
  definirEscuro(escuro);
  const cores = escuro ? BARRAS.escuro : BARRAS.claro;
  pintarBarras(cores.status, cores.navegacao, !escuro);
}

export function ligarTema(): void {
  preferencia = lerEspelho();
  if (temNativo) {
    sistemaEscuro = infoSistema()?.noturno ?? false;
    aoEvento('tema', (noturno) => {
      sistemaEscuro = noturno === true;
      aplicar();
    });
  } else {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    sistemaEscuro = consulta.matches;
    consulta.addEventListener('change', (e) => {
      sistemaEscuro = e.matches;
      aplicar();
    });
  }
  aplicar();
}

/** Depois de abrir o banco: vale a escolha gravada nele. */
export function adotarTemaGravado(): void {
  preferencia = useLoja.getState().temaPreferido;
  gravarEspelho(preferencia);
  aplicar();
}

export function escolherTema(tema: PreferenciaTema): void {
  preferencia = tema;
  gravarEspelho(tema);
  definirTemaPreferido(tema);
  aplicar();
}
