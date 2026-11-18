#!/usr/bin/env python3
"""Monta a versão web (PWA) em site/, pronta para publicar no Netlify, e o zip para arrastar.

A página é a mesma do APK (montar.py); aqui ela ganha a ponte web (pwa/ponte-web.js),
o manifesto, os ícones e o service worker que a faz funcionar sem internet.

uso: python3 montar-pwa.py
"""
import hashlib
import json
import pathlib
import re
import shutil
import zipfile

import montar

RAIZ = pathlib.Path(__file__).resolve().parent
PWA = RAIZ / "pwa"
SITE = RAIZ / "site"
ZIP = RAIZ / "Exame-fisico-site.zip"

CSP = ("default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; "
       "img-src 'self' data: blob:; manifest-src 'self'; worker-src 'self'; connect-src 'self'")
CABECA = """<meta name="theme-color" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#151c1b">
<meta name="description" content="Roteiro de exame físico com achados esperados e anormais, os motivos de cada achado e imagens. Funciona sem internet; os dados ficam no aparelho.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Exame físico">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icones/icone.svg" type="image/svg+xml">
<link rel="icon" href="icones/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icones/apple-touch-icon.png">
"""


def versao_app():
    m = re.search(r"^NOME=(\S+)", (RAIZ / "montar.sh").read_text(encoding="utf-8"), re.M)
    return m.group(1) if m else "?"


def pagina(rotulo):
    html = montar.montar()
    antes = html
    html = re.sub(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">',
                  '<meta http-equiv="Content-Security-Policy" content="%s">' % CSP, html, count=1)
    if html == antes:
        raise SystemExit("não achei a política de segurança em index.html")
    if html.count("</head>") != 1:
        raise SystemExit("index.html deveria ter um </head>")
    html = html.replace("</head>", CABECA + "</head>")
    ponte = (PWA / "ponte-web.js").read_text(encoding="utf-8").replace("/*VERSAO*/", rotulo)
    if "</script" in ponte.lower():
        raise SystemExit("ponte-web.js fecharia a tag antes da hora")
    marca = '<input id="seletor-foto" type="file" accept="image/*" hidden>\n'
    if html.count(marca) != 1:
        raise SystemExit("não achei onde pôr a ponte em index.html")
    return html.replace(marca, marca + "<script>" + ponte + "</script>\n")


def copiar(origem, destino):
    if origem.is_dir():
        shutil.copytree(origem, destino)
    else:
        shutil.copy2(origem, destino)


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    rotulo = versao_app() + " (web)"
    (SITE / "index.html").write_text(pagina(rotulo), encoding="utf-8")
    copiar(RAIZ / "web" / "fotos", SITE / "fotos")
    copiar(PWA / "icones", SITE / "icones")
    copiar(PWA / "telas", SITE / "telas")
    copiar(PWA / "manifest.webmanifest", SITE / "manifest.webmanifest")
    copiar(PWA / "_headers", SITE / "_headers")
    json.loads((SITE / "manifest.webmanifest").read_text(encoding="utf-8"))  # manifesto precisa ser JSON válido

    # o que o service worker guarda para funcionar sem internet (as telas do manifesto ficam de fora)
    guardar = ["./", "manifest.webmanifest"]
    guardar += sorted("fotos/" + f.name for f in (SITE / "fotos").iterdir())
    guardar += sorted("icones/" + f.name for f in (SITE / "icones").iterdir())
    resumo = hashlib.sha256()
    for nome in ["index.html"] + guardar[1:]:
        resumo.update(nome.encode())
        resumo.update((SITE / nome).read_bytes())
    versao = versao_app() + "-" + resumo.hexdigest()[:10]
    sw = (PWA / "sw.js").read_text(encoding="utf-8")
    for marca, valor in (("/*VERSAO*/", versao), ("/*ARQUIVOS*/[]", json.dumps(guardar, ensure_ascii=False))):
        if sw.count(marca) != 1:
            raise SystemExit("marca %s deveria aparecer uma vez em sw.js" % marca)
        sw = sw.replace(marca, valor)
    (SITE / "sw.js").write_text(sw, encoding="utf-8")

    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(SITE.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(SITE).as_posix())
    total = sum(f.stat().st_size for f in SITE.rglob("*") if f.is_file())
    print("site/: %d arquivos, %d KB · versão %s · %s: %d KB" % (
        sum(1 for f in SITE.rglob("*") if f.is_file()), total // 1024, versao, ZIP.name, ZIP.stat().st_size // 1024))


if __name__ == "__main__":
    main()
