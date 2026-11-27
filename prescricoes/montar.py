#!/usr/bin/env python3
"""Junta web/ e os dados num único HTML, com fontes e ícone embutidos.

O mesmo arquivo vai dentro do APK (assets/index.html) e serve no computador:
abre com dois cliques em qualquer navegador.

uso: python3 montar.py destino.html [dados/prescricoes.json]
"""
import base64
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
WEB = RAIZ / "web"
FONTES = [
    ("IBM Plex Sans", 400, "normal", "ibm-plex-sans-latin-400-normal.woff2"),
    ("IBM Plex Sans", 500, "normal", "ibm-plex-sans-latin-500-normal.woff2"),
    ("IBM Plex Sans", 600, "normal", "ibm-plex-sans-latin-600-normal.woff2"),
]


def ler(nome):
    return (WEB / nome).read_text(encoding="utf-8")


def fontes():
    regras = []
    for familia, peso, estilo, arquivo in FONTES:
        dados = base64.b64encode((WEB / "fontes" / arquivo).read_bytes()).decode("ascii")
        regras.append(
            '@font-face{font-family:"%s";font-style:%s;font-weight:%d;font-display:swap;'
            'src:url(data:font/woff2;base64,%s) format("woff2")}' % (familia, estilo, peso, dados)
        )
    return "\n".join(regras)


def montar(caminho_dados):
    dados = json.loads(pathlib.Path(caminho_dados).read_text(encoding="utf-8"))
    js_dados = "window.DADOS=" + json.dumps(dados, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";"
    icone = base64.b64encode((RAIZ / "res" / "mipmap-xhdpi" / "ic_launcher.png").read_bytes()).decode("ascii")
    partes = {
        "/*ICONE*/": "data:image/png;base64," + icone,
        "/*FONTES*/": fontes(),
        "/*ESTILO*/": ler("estilo.css"),
        "/*DADOS*/": js_dados,
        "/*APP*/": ler("app.js"),
    }
    html = ler("index.html")
    for marca, conteudo in partes.items():
        if html.count(marca) != 1:
            raise SystemExit("marca %s deveria aparecer uma vez em index.html" % marca)
        if "</script" in conteudo.lower() or "</style" in conteudo.lower():
            raise SystemExit("o conteúdo de %s fecharia a tag antes da hora" % marca)
    for marca, conteudo in partes.items():
        html = html.replace(marca, conteudo)
    return html


if __name__ == "__main__":
    destino = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
    origem = sys.argv[2] if len(sys.argv) > 2 else RAIZ / "dados" / "prescricoes.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(montar(origem), encoding="utf-8")
    print("%s: %d KB" % (destino, destino.stat().st_size // 1024))
