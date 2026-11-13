#!/usr/bin/env python3
"""Junta web/ num único index.html, com fontes e Preact embutidos, para ir dentro do APK.

uso: python3 montar.py destino/index.html
"""
import base64
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
WEB = RAIZ / "web"
FONTES = [
    ("Atkinson Hyperlegible", 400, "normal", "atkinson-hyperlegible-latin-400-normal.woff2"),
    ("Atkinson Hyperlegible", 700, "normal", "atkinson-hyperlegible-latin-700-normal.woff2"),
    ("Atkinson Hyperlegible", 400, "italic", "atkinson-hyperlegible-latin-400-italic.woff2"),
    ("Source Serif 4", 500, "normal", "source-serif-4-latin-500-normal.woff2"),
    ("Source Serif 4", 600, "normal", "source-serif-4-latin-600-normal.woff2"),
    ("IBM Plex Mono", 500, "normal", "ibm-plex-mono-latin-500-normal.woff2"),
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


def montar():
    partes = {
        "/*FONTES*/": fontes(),
        "/*ESTILO*/": ler("estilo.css"),
        "/*PREACT*/": ler("preact-htm.js"),
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
