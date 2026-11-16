/**
 * Limpeza do que é colado de Word, Google Docs e páginas da internet.
 *
 * Fica a formatação básica (negrito, itálico, sublinhado, tachado, sobrescrito,
 * subscrito, títulos, listas, tabelas, citações) e sai o resto: estilos,
 * classes, fontes, cores de fundo, comentários, metadados e imagens (que
 * viriam de fora do app; para foto de exame, use o botão de imagem).
 */

const REMOVER = 'style, script, meta, link, title, xml, head, noscript, iframe, object, embed, svg, img, picture, video, audio, canvas, form, input, button, select, textarea';

function estilo(el: Element, prop: string): string {
  return (el as HTMLElement).style?.getPropertyValue(prop)?.toLowerCase() ?? '';
}

/** Troca o elemento por um novo, mantendo os filhos. */
function trocarPor(el: Element, tag: string): Element {
  const novo = el.ownerDocument.createElement(tag);
  while (el.firstChild) novo.appendChild(el.firstChild);
  el.replaceWith(novo);
  return novo;
}

/** Tira o elemento e deixa os filhos no lugar. */
function desembrulhar(el: Element): void {
  const pai = el.parentNode;
  if (!pai) return;
  while (el.firstChild) pai.insertBefore(el.firstChild, el);
  pai.removeChild(el);
}

/** Envolve o conteúdo do elemento numa marca (negrito, itálico…). */
function envolver(el: Element, tag: string): void {
  const marca = el.ownerDocument.createElement(tag);
  while (el.firstChild) marca.appendChild(el.firstChild);
  el.appendChild(marca);
}

export function limparHtmlColado(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const corpo = doc.body;

  // Comentários (o Word manda vários, inclusive condicionais).
  const andarilho = doc.createTreeWalker(corpo, NodeFilter.SHOW_COMMENT);
  const comentarios: Node[] = [];
  while (andarilho.nextNode()) comentarios.push(andarilho.currentNode);
  for (const c of comentarios) c.parentNode?.removeChild(c);

  for (const el of [...corpo.querySelectorAll(REMOVER)]) el.remove();

  // Google Docs envolve tudo num <b style="font-weight:normal" id="docs-internal-guid-…">.
  for (const el of [...corpo.querySelectorAll('b[id^="docs-internal-guid"]')]) desembrulhar(el);

  // Tags do Office (o:p, w:…, v:…) e <font>.
  for (const el of [...corpo.querySelectorAll('*')]) {
    if (el.tagName.includes(':') || el.tagName === 'FONT') desembrulhar(el);
  }

  // Formatação que vem só no estilo (Google Docs, navegadores) vira marca de verdade.
  for (const el of [...corpo.querySelectorAll('span, p, div, li, td, th')]) {
    const peso = estilo(el, 'font-weight');
    if (peso === 'bold' || Number(peso) >= 600) envolver(el, 'strong');
    if (estilo(el, 'font-style') === 'italic') envolver(el, 'em');
    const deco = estilo(el, 'text-decoration') + ' ' + estilo(el, 'text-decoration-line');
    if (deco.includes('underline')) envolver(el, 'u');
    if (deco.includes('line-through')) envolver(el, 's');
    const va = estilo(el, 'vertical-align');
    if (va === 'super') envolver(el, 'sup');
    if (va === 'sub') envolver(el, 'sub');
  }

  // Títulos do Word chegam como <p class="MsoHeading1">.
  for (const el of [...corpo.querySelectorAll('p[class*="Heading"], p[class*="Titulo"], p[class*="Ttulo"]')]) {
    const m = /(\d)/.exec(el.className);
    const nivel = Math.min(4, Math.max(1, Number(m?.[1]) || 2));
    trocarPor(el, `h${nivel}`);
  }

  // Fora todos os atributos, menos os que as tabelas e listas usam.
  for (const el of [...corpo.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      const manter = ['colspan', 'rowspan', 'start'].includes(attr.name) && /^\d+$/.test(attr.value);
      if (!manter) el.removeAttribute(attr.name);
    }
  }

  // <span> e <div> sem nada de especial somem; parágrafos vazios do Word também.
  for (const el of [...corpo.querySelectorAll('span')]) desembrulhar(el);
  for (const el of [...corpo.querySelectorAll('p')]) {
    if (!el.textContent?.replace(/ /g, ' ').trim() && !el.querySelector('br')) el.remove();
  }
  return corpo.innerHTML;
}
