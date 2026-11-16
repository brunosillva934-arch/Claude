import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-700.css';
import '@fontsource/source-serif-4/latin-700-italic.css';
import '@fontsource/source-serif-4/latin-ext-400.css';
import '@fontsource/source-serif-4/latin-ext-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import './estilos/base.css';
import './estilos/arvore.css';
import './estilos/nota.css';
import { App } from './app/App';
import { adotarTemaGravado, ligarTema } from './app/tema';
import { iniciar } from './estado/loja';
import { ligarVoltar } from './estado/navegacao';
import { ligarSalvamento } from './nota/salvamento';

async function abrir(): Promise<void> {
  if (window.__bauWebViewAntigo) return; // inicio.js já mostrou o aviso
  ligarTema();
  ligarVoltar();
  ligarSalvamento();
  await iniciar();
  adotarTemaGravado();
  const raiz = document.getElementById('raiz')!;
  raiz.textContent = '';
  createRoot(raiz).render(<App />);
  window.__bauPronto?.();
}

abrir().catch((e: unknown) => {
  const erro = e instanceof Error ? e : new Error(String(e));
  window.__bauFalha?.('O Baú não conseguiu abrir', `${erro.message}\n\n${erro.stack ?? ''}`);
});

// Ganchos de leitura usados só pelos testes automáticos (testes/*.cjs).
if (!__ANDROID__) {
  void import('./testes/ganchos');
}
