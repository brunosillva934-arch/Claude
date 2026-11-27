#!/usr/bin/env python3
"""Junta web/ num único HTML, com fontes e ícone embutidos e a política de segurança (CSP) fechada.

O mesmo arquivo vai dentro do APK (assets/index.html) e é a versão para computador
(Posologia.html), que abre com dois cliques no navegador.

A CSP só deixa rodar os dois blocos de script desta página (pelo resumo SHA-256 de cada um),
só aceita o estilo desta página e só deixa conversar com os dois servidores oficiais.
Qualquer script injetado, estilo de fora ou endereço diferente é bloqueado pelo navegador.

uso: python3 montar.py destino.html
"""
import base64
import hashlib
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
WEB = RAIZ / "web"
FONTES = [
    ("Newsreader", 400, "normal", "newsreader-latin-400-normal.woff2"),
    ("Newsreader", 600, "normal", "newsreader-latin-600-normal.woff2"),
    ("Newsreader", 400, "italic", "newsreader-latin-400-italic.woff2"),
    ("Newsreader", 600, "italic", "newsreader-latin-600-italic.woff2"),
    ("IBM Plex Sans", 400, "normal", "ibm-plex-sans-latin-400-normal.woff2"),
    ("IBM Plex Sans", 500, "normal", "ibm-plex-sans-latin-500-normal.woff2"),
    ("IBM Plex Sans", 600, "normal", "ibm-plex-sans-latin-600-normal.woff2"),
    ("IBM Plex Mono", 400, "normal", "ibm-plex-mono-latin-400-normal.woff2"),
]
SCRIPTS = ["calculo.js", "integridade.js", "bulas.js", "app.js"]
SERVIDORES = ["https://api.fda.gov", "https://rxnav.nlm.nih.gov"]


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


def resumo(texto):
    return "'sha256-%s'" % base64.b64encode(hashlib.sha256(texto.encode("utf-8")).digest()).decode("ascii")


def montar():
    icone = base64.b64encode((RAIZ / "res" / "mipmap-xhdpi" / "ic_launcher.png").read_bytes()).decode("ascii")
    partes = {
        "/*ICONE*/": "data:image/png;base64," + icone,
        "/*ESTILO*/": fontes() + "\n" + ler("estilo.css"),
        "/*ERRO*/": ler("erro.js"),
        "/*CODIGO*/": "\n".join(ler(s) for s in SCRIPTS),
    }
    html = ler("index.html")
    for marca, conteudo in list(partes.items()) + [("/*CSP*/", "")]:
        if html.count(marca) != 1:
            raise SystemExit("marca %s deveria aparecer uma vez em index.html" % marca)
    for marca, conteudo in partes.items():
        if "</script" in conteudo.lower() or "</style" in conteudo.lower():
            raise SystemExit("o conteúdo de %s fecharia a tag antes da hora" % marca)
        html = html.replace(marca, conteudo)

    scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
    estilos = re.findall(r"<style>(.*?)</style>", html, re.S)
    if len(scripts) != 2 or len(estilos) != 1:
        raise SystemExit("esperava 2 scripts e 1 estilo, achei %d e %d" % (len(scripts), len(estilos)))
    csp = "; ".join([
        "default-src 'none'",
        "script-src " + " ".join(resumo(s) for s in scripts),
        "style-src " + resumo(estilos[0]),
        "font-src data:",
        "img-src data:",
        "connect-src " + " ".join(SERVIDORES),
        "base-uri 'none'",
        "form-action 'none'",
    ])
    return html.replace("/*CSP*/", csp)


if __name__ == "__main__":
    destino = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(montar(), encoding="utf-8")
    print("%s: %d KB" % (destino, destino.stat().st_size // 1024))
