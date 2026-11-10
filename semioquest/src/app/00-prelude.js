// Prelúdio: liga o código do app ao React carregado por <script> (UMD, cdnjs).
// O bundle original embutia o React; aqui só ficam os atalhos que o restante do código usa.
const S = window.React;
const vi = S;
const s = (() => {
  const jsx = (tipo, props, chave) => S.createElement(tipo, chave === undefined ? props : { ...props, key: chave });
  return { jsx, jsxs: jsx, Fragment: S.Fragment };
})();
const Jp = window.ReactDOM.createRoot;
// Auxiliar de campos de classe usado pelo código descompilado do ts-fsrs.
const Ca = (alvo, chave, valor) => {
  const k = typeof chave != "symbol" ? chave + "" : chave;
  return k in alvo ? Object.defineProperty(alvo, k, { enumerable: !0, configurable: !0, writable: !0, value: valor }) : (alvo[k] = valor), valor;
};
document.documentElement.lang = "pt-BR";
