#!/usr/bin/env python3
"""Junta web/ num único index.html, com as fontes embutidas, para ir dentro do APK.

uso: python3 montar.py destino/index.html
"""
import base64
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
WEB = RAIZ / "web"
FONTES = [
    ("Newsreader", 400, "normal", "newsreader-latin-400-normal.woff2"),
    ("Newsreader", 600, "normal", "newsreader-latin-600-normal.woff2"),
    ("Newsreader", 600, "italic", "newsreader-latin-600-italic.woff2"),
    ("IBM Plex Sans", 400, "normal", "ibm-plex-sans-latin-400-normal.woff2"),
    ("IBM Plex Sans", 500, "normal", "ibm-plex-sans-latin-500-normal.woff2"),
    ("IBM Plex Sans", 600, "normal", "ibm-plex-sans-latin-600-normal.woff2"),
    ("IBM Plex Mono", 400, "normal", "ibm-plex-mono-latin-400-normal.woff2"),
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


def juntar_conteudo():
    """dados.js (versão 1 e as funções) e depois cada conteudo/*.js, em ordem de nome."""
    partes = [ler("dados.js")]
    for arq in sorted((WEB / "conteudo").glob("*.js")):
        partes.append(arq.read_text(encoding="utf-8"))
    return "\n".join(partes)


def montar():
    partes = {
        "/*FONTES*/": fontes(),
        "/*ESTILO*/": ler("estilo.css"),
        "/*DADOS*/": juntar_conteudo(),
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
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(montar(), encoding="utf-8")
    print("%s: %d KB" % (destino, destino.stat().st_size // 1024))
