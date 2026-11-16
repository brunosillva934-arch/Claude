/**
 * Tema claro/escuro seguindo o sistema.
 *
 * No tablet quem avisa a troca é a casca Android (não dependemos de
 * `prefers-color-scheme` dentro do WebView, que varia entre versões); no
 * navegador vale a preferência do sistema. As barras do Android são pintadas
 * na cor do app.
 */
import { definirEscuro } from '../estado/loja';
import { aoEvento, infoSistema, pintarBarras, temNativo } from '../nativo/ponte';

const BARRAS = {
  claro: { status: '#FFFFFF', navegacao: '#F3F5F8' },
  escuro: { status: '#1A1F26', navegacao: '#111418' },
};

function aplicar(escuro: boolean): void {
  document.documentElement.setAttribute('data-tema', escuro ? 'escuro' : 'claro');
  definirEscuro(escuro);
  const cores = escuro ? BARRAS.escuro : BARRAS.claro;
  pintarBarras(cores.status, cores.navegacao, !escuro);
}

export function ligarTema(): void {
  if (temNativo) {
    aplicar(infoSistema()?.noturno ?? false);
    aoEvento('tema', (noturno) => aplicar(noturno === true));
    return;
  }
  const consulta = window.matchMedia('(prefers-color-scheme: dark)');
  aplicar(consulta.matches);
  consulta.addEventListener('change', (e) => aplicar(e.matches));
}
