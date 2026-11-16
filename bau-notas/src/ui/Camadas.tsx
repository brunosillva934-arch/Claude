/**
 * Menus, diálogos e avisos. Ficam por cima de tudo e cada um responde ao
 * botão voltar do Android.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useVoltar } from '../estado/navegacao';
import { dispensarAviso, fecharMenu, responderDialogo, useUi, type DialogoAberto, type MenuAberto } from './servico';

function Menu({ menu }: { menu: MenuAberto }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const armado = useRef(!menu.aposSoltar);
  useVoltar(true, fecharMenu);

  useEffect(() => {
    if (armado.current) return;
    let t = 0;
    const armar = () => {
      t = window.setTimeout(() => {
        armado.current = true;
      }, 60);
    };
    window.addEventListener('pointerup', armar, true);
    window.addEventListener('pointercancel', armar, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerup', armar, true);
      window.removeEventListener('pointercancel', armar, true);
    };
  }, [menu]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const margem = 8;
    const r = el.getBoundingClientRect();
    const left = Math.max(margem, Math.min(menu.x, window.innerWidth - r.width - margem));
    const top = Math.max(margem, Math.min(menu.y, window.innerHeight - r.height - margem));
    setPos({ left, top });
  }, [menu]);

  return (
    <div
      className="camada-menu"
      onPointerDown={(e) => {
        if (menu.manterFoco) e.preventDefault();
        if (e.target === e.currentTarget) fecharMenu();
      }}
      onMouseDown={(e) => {
        if (menu.manterFoco) e.preventDefault();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={ref}
        className="menu"
        role="menu"
        style={pos ? { left: pos.left, top: pos.top } : { left: menu.x, top: menu.y, visibility: 'hidden' }}
      >
        {menu.titulo && <div className="menu-titulo">{menu.titulo}</div>}
        {menu.itens.map((item) => {
          const Icone = item.icone;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-item={item.id}
              className={
                'menu-item' + (item.perigo ? ' perigo' : '') + (item.separadorAntes ? ' com-separador' : '')
              }
              disabled={item.desativado}
              onClick={() => {
                if (!armado.current) return;
                fecharMenu();
                item.aoEscolher();
              }}
            >
              {item.cor ? (
                <span className="menu-cor" style={{ background: item.cor }} />
              ) : Icone ? (
                <span className="menu-icone">
                  <Icone size={20} />
                </span>
              ) : (
                <span className="menu-icone" />
              )}
              <span className="menu-rotulo">{item.rotulo}</span>
              {item.detalhe && <span className="menu-detalhe">{item.detalhe}</span>}
              {item.marcado && (
                <span className="menu-marca">
                  <Check size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dialogo({ dialogo }: { dialogo: DialogoAberto }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState(dialogo.valor ?? '');
  useVoltar(true, () => responderDialogo(null));

  useEffect(() => {
    const el = entrada.current;
    if (el) {
      el.focus({ preventScroll: true });
      el.select();
    }
  }, []);

  const podeOk = dialogo.tipo === 'confirmar' || dialogo.permitirVazio || valor.trim().length > 0;
  const ok = () => {
    if (!podeOk) return;
    responderDialogo(dialogo.tipo === 'texto' ? valor : true);
  };

  return (
    <div
      className="camada-dialogo"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) responderDialogo(null);
      }}
    >
      <div className="dialogo" role="dialog" aria-modal="true" aria-label={dialogo.titulo}>
        <h2 className="dialogo-titulo">{dialogo.titulo}</h2>
        {dialogo.texto && <p className="dialogo-texto">{dialogo.texto}</p>}
        {dialogo.tipo === 'texto' && (
          <input
            ref={entrada}
            className="campo"
            value={valor}
            placeholder={dialogo.dica}
            enterKeyHint="done"
            autoCapitalize="sentences"
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                ok();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                responderDialogo(null);
              }
              e.stopPropagation();
            }}
          />
        )}
        <div className="dialogo-botoes">
          <button type="button" className="botao" data-acao="cancelar" onClick={() => responderDialogo(null)}>
            {dialogo.rotuloCancelar}
          </button>
          <button
            type="button"
            className={'botao principal' + (dialogo.perigo ? ' perigo' : '')}
            data-acao="ok"
            disabled={!podeOk}
            onClick={ok}
          >
            {dialogo.rotuloOk}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Camadas() {
  const menu = useUi((s) => s.menu);
  const dialogo = useUi((s) => s.dialogo);
  const avisos = useUi((s) => s.avisos);

  return (
    <>
      {menu && <Menu menu={menu} />}
      {dialogo && <Dialogo key={dialogo.titulo + dialogo.tipo} dialogo={dialogo} />}
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className="aviso">
            <span className="aviso-texto">{a.texto}</span>
            {a.acao && (
              <button
                type="button"
                className="aviso-acao"
                onClick={() => {
                  dispensarAviso(a.id);
                  a.acao!.aoTocar();
                }}
              >
                {a.acao.rotulo}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
