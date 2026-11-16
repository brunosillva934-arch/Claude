/**
 * Moldura do app.
 *
 * Tela larga (paisagem): árvore à esquerda e nota à direita, com divisória
 * ajustável; a nota pode ir para tela cheia.
 * Tela estreita (retrato): a árvore ocupa tudo e a nota abre por cima.
 * A decisão usa só a largura, que não muda quando o teclado abre.
 */
import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useAtalhosDaArvore } from '../arvore/atalhos';
import { Lista } from '../arvore/Lista';
import { VisaoArvore } from '../arvore/VisaoArvore';
import { abrirGaveta, definirLargo, definirProporcao, useLoja } from '../estado/loja';
import { PainelNota } from '../nota/PainelNota';
import { Camadas } from '../ui/Camadas';
import { avisar } from '../ui/servico';
import { BarraSuperior } from './BarraSuperior';
import { Gaveta } from './Gaveta';

const LARGURA_DIVIDIDA = 900;

function Divisor() {
  const arrastando = useRef(false);
  return (
    <div
      className="divisor"
      role="separator"
      aria-orientation="vertical"
      aria-label="Ajustar a divisão entre a árvore e a nota"
      onPointerDown={(e) => {
        arrastando.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.classList.add('ativo');
      }}
      onPointerMove={(e) => {
        if (arrastando.current) definirProporcao(e.clientX / window.innerWidth, false);
      }}
      onPointerUp={(e) => {
        if (!arrastando.current) return;
        arrastando.current = false;
        e.currentTarget.classList.remove('ativo');
        definirProporcao(e.clientX / window.innerWidth, true);
      }}
      onPointerCancel={(e) => {
        arrastando.current = false;
        e.currentTarget.classList.remove('ativo');
      }}
    >
      <span className="divisor-pega" />
    </div>
  );
}

export function App() {
  const temArvore = useLoja((s) => s.arvoreAtualId !== null);
  const visao = useLoja((s) => s.visao);
  const largo = useLoja((s) => s.largo);
  const painelLigado = useLoja((s) => s.painelLigado);
  const notaAbertaId = useLoja((s) => s.notaAbertaId);
  const notaExpandida = useLoja((s) => s.notaExpandida);
  const proporcao = useLoja((s) => s.proporcao);
  const salvamento = useLoja((s) => s.salvamento);

  useEffect(() => {
    // Altura da tela sem o teclado, por orientação. Serve de base para o espaço
    // livre no fim da nota, que assim não muda quando o teclado abre ou fecha.
    let largura = window.innerWidth;
    let alturaCheia = 0;
    const medir = () => {
      definirLargo(window.innerWidth >= LARGURA_DIVIDIDA);
      if (window.innerWidth !== largura) {
        largura = window.innerWidth;
        alturaCheia = 0;
      }
      if (window.innerHeight > alturaCheia) {
        alturaCheia = window.innerHeight;
        document.documentElement.style.setProperty('--altura-cheia', `${alturaCheia}px`);
      }
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  useEffect(() => {
    if (salvamento === 'erro') avisar('Não foi possível gravar a última alteração', { duracao: 6000 });
  }, [salvamento]);

  const modo: 'arvore' | 'dividido' | 'nota' =
    notaAbertaId && notaExpandida ? 'nota' : notaAbertaId && largo && painelLigado ? 'dividido' : 'arvore';

  useAtalhosDaArvore(modo !== 'nota' && temArvore);

  return (
    <div className="app" data-modo={modo} data-largo={largo ? '' : undefined}>
      {modo !== 'nota' && <BarraSuperior />}
      <div className="corpo">
        <section
          className="area-arvore"
          style={modo === 'dividido' ? { flex: `0 0 ${(proporcao * 100).toFixed(2)}%` } : undefined}
          hidden={modo === 'nota'}
        >
          {!temArvore ? (
            <div className="vazio">
              <h2>Nenhuma árvore</h2>
              <p>Crie uma árvore para começar a organizar suas notas.</p>
              <button type="button" className="botao principal" onClick={() => abrirGaveta(true)}>
                <Plus size={20} />
                Minhas árvores
              </button>
            </div>
          ) : visao === 'arvore' ? (
            <VisaoArvore />
          ) : (
            <Lista />
          )}
        </section>
        {modo === 'dividido' && <Divisor />}
        {modo !== 'arvore' && notaAbertaId && (
          <section className="area-nota">
            <PainelNota notaId={notaAbertaId} />
          </section>
        )}
      </div>
      <Gaveta />
      <Camadas />
    </div>
  );
}
