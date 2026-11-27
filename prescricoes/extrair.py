#!/usr/bin/env python3
"""Lê o PDF do Drive de Prescrições e gera o JSON que o app usa.

O PDF é diagramado sempre do mesmo jeito: cada parte da ficha tem cor e tamanho de
letra próprios (título azul 15,5 pt, item da receita azul-marinho 10,6 pt, quantidade
10 pt à direita, orientação 10,6 pt com marcador...). O extrator usa essas marcas,
não o texto corrido, para montar as fichas.

uso: python3 extrair.py parte1.pdf [parte2.pdf ...] [-o dados/prescricoes.json]
     (o PDF inteiro ou as partes, em qualquer ordem: a página vem do número impresso)

Precisa do PyMuPDF:  pip install pymupdf
"""
import argparse
import html
import json
import pathlib
import re
import sys
import unicodedata

import pymupdf

# ── estilos do PDF: (tamanho, cor) ────────────────────────────────────────────
TITULO = (15.5, "2a8faa")
CID = (11.0, "1f6f86")
ETIQUETA = (7.4, "ffffff")
BUSQUE = (8.6, "5d6b78")
ROTULO_TOPO = (7.4, "1f6f86")      # ATESTADO SUGERIDO / RETORNO
VALOR_TOPO = (8.8, "12315a")
H_ANTES = (7.6, "9a6a08")
H_RECEITA = (9.8, "ffffff")
CASO = (8.8, "2e8b57")
ITEM = (10.6, "12315a")
QTD = (10.0, "12315a")
H_ORIENT = (8.0, "2e8b57")
H_ALARME = (8.0, "c8413b")
H_OPCOES = (8.4, "2e8b57")
GRUPO = (9.4, "12315a")
OU = (7.6, "ffffff")
NOTA = (8.2, "5d6b78")
H_UNIDADE = (8.4, "2a8faa")
H_PLANT = (7.8, "7b8794")
H_SEGURANCA = (8.4, "0e6e73")
H_ENCAMINHAR = (8.4, "5b4b9a")
H_DICA = (8.4, "12315a")
H_REF = (7.4, "7b8794")
REF = (7.8, "6b7783")
ROTULO = (10.6, "0e6e73")
NUM_PAGINA = (15.0, "ffffff")
INDICE = (7.6, "5d6b78")
COPIE = (7.8, "ffffff")
CORPO_CORES = {"1d2733", "1c2633"}

# tabelas do fim
T_TITULO = (15.0, "2a8faa")
T_SUB = (9.2, "5d6b78")
T_CAB = (8.0, "ffffff")

# cores que viram destaque no texto
DESTAQUE = {
    "0e6e73": "rot",   # rótulo "Gestante:" etc.
    "c8413b": "ver",   # vermelho: Evitar, Contraindicado
    "b07a0a": "amb",   # âmbar: Cautela
    "2e8b57": "vde",   # verde: Seguro, Compatível
    "12315a": "neg",   # azul-marinho em negrito
}

SELOS = {(126, 64): "sus", (410, 64): "fp", (412, 64): "ce"}
ZOOM = 2
FAIXA = (20, 160)  # faixa da esquerda onde ficam os marcadores de lista
TAGS = ["PLANTÃO", "AMBULATÓRIO", "GESTANTE", "PEDIATRIA", "IST"]


SIGLAS = {"ITU", "DM2", "PA", "HPV", "DPOC", "PEP", "DIP", "IST", "SII", "COVID", "DRGE", "GECA", "BCP", "CID", "HIV"}
PROPRIOS = {"BELL": "Bell", "BARTHOLIN": "Bartholin", "HELICOBACTER": "Helicobacter", "QUERVAIN": "Quervain"}


def nome_legivel(titulo):
    """'CISTITE / ITU NÃO COMPLICADA' -> 'Cistite / ITU não complicada' (siglas ficam em maiúsculas)."""
    def troca(m):
        w = m.group(0)
        if w.upper() in SIGLAS:
            return w.upper()
        if w.upper() in PROPRIOS:
            return PROPRIOS[w.upper()]
        return w.lower()
    t = re.sub(r"[A-Za-zÀ-ÿ0-9]+", troca, titulo)
    for i, c in enumerate(t):
        if c.isalpha():
            return t[:i] + c.upper() + t[i + 1:]
    return t


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def chave(s):
    return re.sub(r"[^a-z0-9]+", " ", sem_acento(s).lower()).strip()


def limpar(s):
    s = unicodedata.normalize("NFC", s)
    s = s.replace("\u00a0", " ").replace("\u2009", " ").replace("\u200b", "")
    return re.sub(r"[ \t]+", " ", s).strip()


# ── leitura das páginas ───────────────────────────────────────────────────────

class Celula:
    """Um pedaço de linha: spans vizinhos na mesma altura."""

    def __init__(self, spans):
        self.spans = spans
        self.x0 = min(s["x0"] for s in spans)
        self.x1 = max(s["x1"] for s in spans)
        self.y0 = min(s["y0"] for s in spans)
        self.y1 = max(s["y1"] for s in spans)
        primeiro = next((s for s in spans if s["text"].strip()), spans[0])
        self.estilo = (primeiro["size"], primeiro["color"])
        self.texto = limpar(self._juntar(lambda s: s["text"]))

    def _juntar(self, f):
        out = ""
        ant = None
        for s in self.spans:
            t = f(s)
            if ant is not None and s["x0"] - ant["x1"] > 1.6 and out and not out.endswith(" ") and not s["text"].startswith(" "):
                out += " "
            out += t
            ant = s
        return out

    def runs(self):
        """[(classe ou None, texto)] para o texto rico."""
        res = []
        ant = None
        for s in self.spans:
            t = s["text"]
            if ant is not None and s["x0"] - ant["x1"] > 1.6 and res and not res[-1][1].endswith(" ") and not t.startswith(" "):
                t = " " + t
            classe = DESTAQUE.get(s["color"])
            if res and res[-1][0] == classe:
                res[-1] = (classe, res[-1][1] + t)
            else:
                res.append((classe, t))
            ant = s
        return res


class Linha:
    def __init__(self, celulas, pagina):
        self.celulas = celulas
        self.pagina = pagina
        self.x0 = celulas[0].x0
        self.y0 = min(c.y0 for c in celulas)
        self.y1 = max(c.y1 for c in celulas)
        self.estilo = celulas[0].estilo
        self.marcador = False
        self.selos = []

    @property
    def texto(self):
        return " ".join(c.texto for c in self.celulas).strip()

    def pedacos(self):
        """[(estilo, texto, x0)]: os spans da linha juntados por estilo, na ordem."""
        res = []
        for c in self.celulas:
            ant = None
            for sp in c.spans:
                est = (sp["size"], sp["color"])
                t = sp["text"]
                if ant is not None and sp["x0"] - ant["x1"] > 1.6 and not t.startswith(" ") and res and not res[-1][1].endswith(" "):
                    t = " " + t
                if res and res[-1][0] == est and ant is not None:
                    res[-1][1] += t
                else:
                    res.append([est, t, sp["x0"]])
                ant = sp
        return [(e, limpar(t), x) for e, t, x in res if limpar(t)]


def ler_paginas(caminhos):
    paginas = {}
    seq = 0
    for caminho in caminhos:
        doc = pymupdf.open(caminho)
        lidas = []  # (índice no arquivo, número impresso, linhas)
        for idx, page in enumerate(doc):
            seq += 1
            altura = page.rect.height
            spans, imgs, bolinhas = [], [], []
            numero = None
            for b in page.get_text("dict")["blocks"]:
                if b["type"] != 0:
                    continue
                for l in b["lines"]:
                    for s in l["spans"]:
                        if not s["text"]:
                            continue
                        if s["bbox"][3] < 0 or s["bbox"][1] > altura:
                            continue  # letras soltas fora da página
                        est = (round(s["size"], 1), "%06x" % s["color"])
                        if est == (12.0, "000000") and "Licensed" in s["text"]:
                            continue  # marca d'água com o dono da cópia: fica de fora
                        if est == NUM_PAGINA and s["text"].strip().isdigit():
                            numero = int(s["text"].strip())
                            continue
                        spans.append({"x0": s["bbox"][0], "y0": s["bbox"][1], "x1": s["bbox"][2], "y1": s["bbox"][3],
                                      "oy": s["origin"][1], "size": est[0], "color": est[1], "text": s["text"]})
            for im in page.get_image_info():
                bb = im["bbox"]
                selo = SELOS.get((im["width"], im["height"]))
                if selo and bb[2] - bb[0] < 120:
                    imgs.append({"x0": bb[0], "y0": bb[1], "x1": bb[2], "y1": bb[3], "selo": selo})
            # O PDF guarda cópias invisíveis de marcadores e selos em camadas escondidas.
            # Por isso o marcador de lista é procurado na página desenhada, não nos vetores.
            bolinhas = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM), clip=pymupdf.Rect(FAIXA[0], 0, FAIXA[1], altura),
                                       colorspace=pymupdf.csGRAY) if any(s["size"] == 10.6 for s in spans) else None
            lidas.append((idx, numero, spans, imgs, bolinhas))
        # página sem número impresso (capa, índice): deduz pelo deslocamento das numeradas
        difs = [num - idx for idx, num, *_ in lidas if num is not None]
        desloc = max(set(difs), key=difs.count) if difs else seq - len(lidas)
        for idx, numero, spans, imgs, bolinhas in lidas:
            n = numero if numero is not None else idx + desloc
            paginas[n] = montar_linhas(n, spans, imgs, bolinhas)
    return paginas


def tem_marcador(pix, linha):
    """Há uma bolinha escura logo à esquerda do começo da linha?"""
    if pix is None:
        return False
    xa, xb = linha.x0 - 14, linha.x0 - 4
    ya, yb = linha.y0, linha.y1
    pts = []
    for y in range(int(ya * ZOOM), int(yb * ZOOM)):
        for x in range(int((xa - FAIXA[0]) * ZOOM), int((xb - FAIXA[0]) * ZOOM)):
            if 0 <= x < pix.width and 0 <= y < pix.height and pix.pixel(x, y)[0] < 100:
                pts.append((x, y))
    if len(pts) < 10:
        return False
    larg = (max(x for x, _ in pts) - min(x for x, _ in pts)) / ZOOM
    alt = (max(y for _, y in pts) - min(y for _, y in pts)) / ZOOM
    return larg <= 5.5 and alt <= 5.5


def montar_linhas(pagina, spans, imgs, bolinhas):
    spans.sort(key=lambda s: (s["oy"], s["x0"]))
    grupos = []
    for s in spans:
        if grupos and abs(s["oy"] - grupos[-1][0]) <= 2.2:
            grupos[-1][1].append(s)
        else:
            grupos.append([s["oy"], [s]])
    linhas = []
    for _, g in grupos:
        g.sort(key=lambda s: s["x0"])
        celulas, atual = [], [g[0]]
        for s in g[1:]:
            ant = atual[-1]
            mudou = (s["size"], s["color"]) != (ant["size"], ant["color"])
            if s["x0"] - ant["x1"] > 9 or (mudou and s["x0"] - ant["x1"] > 4 and not ant["text"].endswith(" ") and not s["text"].startswith(" ")):
                celulas.append(Celula(atual))
                atual = [s]
            else:
                atual.append(s)
        celulas.append(Celula(atual))
        celulas = [c for c in celulas if c.texto]
        if not celulas:
            continue
        if all(len(t) == 1 and not t.isascii() for c in celulas for t in c.texto.split()):
            continue  # acentos soltos de letra maiúscula que o PDF deixa no rodapé
        linha = Linha(celulas, pagina)
        linha.marcador = tem_marcador(bolinhas, linha)
        # selos: em fila logo depois do nome do remédio (as cópias escondidas ficam fora da fila)
        fim = celulas[0].x1
        candidatos = sorted((im for im in imgs if linha.y0 - 2 <= (im["y0"] + im["y1"]) / 2 <= linha.y1 + 2), key=lambda im: im["x0"])
        for im in candidatos:
            if fim - 2 <= im["x0"] <= fim + 9 and im["selo"] not in [x for _, x in linha.selos]:
                linha.selos.append((im["x0"], im["selo"]))
                fim = im["x1"]
        linhas.append(linha)
    titulos = [l for l in linhas if l.estilo == TITULO]
    for l in list(linhas):
        if l.estilo in (ETIQUETA, INDICE) and l not in titulos:
            perto = [t for t in titulos if abs(t.y0 - l.y0) < 12]
            if perto:
                perto[0].celulas.extend(l.celulas)
                linhas.remove(l)
    return linhas


# ── texto rico ────────────────────────────────────────────────────────────────

def html_de(celulas):
    partes = []
    for c in celulas:
        for classe, t in c.runs():
            t = html.escape(t.replace("\u00a0", " "), quote=False)
            partes.append('<b class="%s">%s</b>' % (classe, t) if classe else t)
        partes.append(" ")
    h = re.sub(r"[ \t]+", " ", "".join(partes)).strip()
    h = re.sub(r'<b class="(\w+)">\s*</b>', " ", h)
    return re.sub(r"\s+", " ", h).strip()


def juntar(a, b):
    """Junta duas linhas de um mesmo parágrafo (texto puro ou HTML)."""
    if not a:
        return b
    if re.search(r"[A-Za-zÀ-ÿ]-$", a) and not a.endswith(" -"):
        return a + b
    return a + " " + b


def texto_de_html(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h))


# ── fichas ────────────────────────────────────────────────────────────────────

ROTULOS_SECAO = {
    "antes": "Antes de prescrever",
    "receita": "Receita pronta",
    "opcoes": "Outras opções e ajustes",
    "unidade": "Na unidade",
    "plantonista": "Para o plantonista",
}


class Ficha:
    def __init__(self, pagina):
        self.pagina = pagina
        self.titulo = ""
        self.cid = ""
        self.tags = []
        self.busque = ""
        self.atestado = ""
        self.retorno = ""
        self.secoes = []
        self.referencias = ""
        self.cabecalho = True  # ainda lendo título/CID

    def secao(self, tipo, titulo=None, sub=None):
        s = {"tipo": tipo, "titulo": titulo or ROTULOS_SECAO[tipo], "blocos": []}
        if sub:
            s["sub"] = sub
        self.secoes.append(s)
        return s

    def atual(self):
        if not self.secoes:
            self.secao("antes")
        return self.secoes[-1]


def separar_tags(t):
    achadas = []
    resto = t.replace(" ", "")
    while resto:
        for tag in TAGS:
            if resto.startswith(tag):
                achadas.append(tag)
                resto = resto[len(tag):]
                break
        else:
            raise ValueError("etiqueta desconhecida: %r" % t)
    return achadas


def cabecalho(f, ln):
    for pe, pt, _ in ln.pedacos():
        if pe == TITULO:
            f.titulo = juntar(f.titulo, pt)
        elif pe == CID:
            f.cid = juntar(f.cid, pt)
        elif pe == ETIQUETA:
            f.tags += separar_tags(pt)


def subtitulo(ln):
    """O texto miúdo ao lado do nome da seção ("troque se o caso pedir")."""
    ps = ln.pedacos()
    return " ".join(pt for _, pt, _ in ps[1:]) or None


def ler_fichas(paginas, primeira, ultima):
    fichas = []
    f = None
    ultimo = None        # último bloco de texto, para emendar a linha seguinte
    ultima_linha = None
    ref_modo = False
    rotulo_x = {}        # x dos rótulos ATESTADO / RETORNO

    def novo_bloco(sec, bloco):
        sec["blocos"].append(bloco)
        return bloco

    for n in range(primeira, ultima + 1):
        for ln in paginas.get(n, []):
            est = ln.estilo
            txt = ln.texto
            if est in (INDICE, COPIE) and txt in ("índice ↑", "copie e cole"):
                continue
            # tira das células o "índice ↑" e o "copie e cole" que dividem a linha com outra coisa
            ln.celulas = [c for c in ln.celulas if not (c.estilo in (INDICE, COPIE) and c.texto in ("índice ↑", "copie e cole"))]
            if not ln.celulas:
                continue
            txt = ln.texto

            if est == TITULO:
                if f is None or not f.cabecalho:
                    f = Ficha(n)
                    fichas.append(f)
                    ultimo = None
                    ref_modo = False
                cabecalho(f, ln)
                ultima_linha = ln
                continue
            if f is None:
                continue
            if f.cabecalho and est in (CID, ETIQUETA, INDICE):
                cabecalho(f, ln)
                continue
            if est == BUSQUE:
                f.cabecalho = False
                t = re.sub(r"^Busque também:\s*", "", txt)
                f.busque = juntar(f.busque, t)
                continue
            f.cabecalho = False

            if est == ROTULO_TOPO or (est == VALOR_TOPO and not f.secoes):
                # ATESTADO SUGERIDO valor   RETORNO valor (o valor pode quebrar em mais linhas)
                campo = None
                for pe, pt, px in ln.pedacos():
                    if pe == ROTULO_TOPO:
                        campo = "atestado" if pt.startswith("ATESTADO") else "retorno"
                        rotulo_x[campo] = px
                    elif pe == VALOR_TOPO:
                        alvo = campo
                        if alvo is None:
                            alvo = "retorno" if "retorno" in rotulo_x and px >= rotulo_x["retorno"] - 5 else "atestado"
                        setattr(f, alvo, juntar(getattr(f, alvo), pt))
                continue

            if est == H_REF:
                ref_modo = True
                resto = " ".join(pt for pe, pt, _ in ln.pedacos() if pe != H_REF)
                f.referencias = juntar(f.referencias, resto)
                continue
            if ref_modo and est == REF:
                f.referencias = juntar(f.referencias, txt)
                continue

            if est == H_ANTES:
                f.secao("antes")
                ultimo = None
                continue
            if est == H_RECEITA:
                titulo = "Receita pronta" if "RECEITA" in txt else "Orientações prontas"
                f.secao("receita", titulo)
                ultimo = None
                continue
            if est == H_OPCOES:
                sub = subtitulo(ln)
                f.secao("opcoes", sub=sub)
                ultimo = None
                continue
            if est == H_UNIDADE:
                nome = ln.pedacos()[0][1]
                sub = subtitulo(ln)
                if nome.startswith("NA UNIDADE"):
                    sub = sub or nome[len("NA UNIDADE"):].strip() or None
                    f.secao("unidade", "Na unidade", sub)
                else:
                    f.secao("unidade", nome.capitalize(), sub)
                ultimo = None
                continue
            if est == H_PLANT:
                f.secao("plantonista")
                ultimo = None
                continue

            sec = f.atual()
            if est == CASO:
                sec["caso"] = juntar(sec.get("caso", ""), re.sub(r"^Caso:\s*", "", txt))
                ultimo = None
                continue
            if est in (H_ORIENT, H_ALARME, H_SEGURANCA, H_ENCAMINHAR) or (est == H_DICA and txt.startswith("DICA")):
                tom = {H_ORIENT: "orient", H_ALARME: "alarme", H_SEGURANCA: "seguranca",
                       H_ENCAMINHAR: "encaminhar", H_DICA: "dica"}[est]
                sub = subtitulo(ln)
                nome = ln.pedacos()[0][1]
                m = re.match(r"^([^a-zà-ÿ]+?)\s+([a-zà-ÿ].*)$", nome)
                if m:  # "PRESCREVER COM SEGURANÇA gestante · amamentação · idoso · rim"
                    nome, sub = m.group(1), juntar(m.group(2), sub or "").strip()
                b = {"t": "sub", "tom": tom, "texto": nome}
                if sub:
                    b["nota"] = sub
                novo_bloco(sec, b)
                ultimo = None
                continue
            if est == GRUPO:
                if ultimo is not None and ultimo.get("t") == "grupo" and ultima_linha is not None and ultima_linha.estilo == GRUPO:
                    ultimo["texto"] = juntar(ultimo["texto"], txt)
                else:
                    ultimo = novo_bloco(sec, {"t": "grupo", "texto": txt})
                ultima_linha = ln
                continue
            if est == OU:
                novo_bloco(sec, {"t": "ou"})
                ultimo = None
                ultima_linha = ln
                continue
            if est == NOTA and txt.strip() == "escolha 1":
                continue

            if est == ITEM:
                m = re.match(r"^(\d+[a-z]?)\.\s*(.*)$", ln.celulas[0].texto)
                qtd = " ".join(c.texto for c in ln.celulas[1:] if c.estilo == QTD)
                if m:
                    b = {"t": "item", "n": m.group(1), "nome": m.group(2).strip(), "x": ln.x0}
                    if qtd:
                        b["qtd"] = qtd
                    if ln.selos:
                        b["selos"] = [s for _, s in sorted(ln.selos)]
                    ultimo = novo_bloco(sec, b)
                elif ultimo is not None and ultimo.get("t") == "item" and "uso" not in ultimo:
                    ultimo["nome"] = juntar(ultimo["nome"], ln.celulas[0].texto)
                    if qtd and "qtd" not in ultimo:
                        ultimo["qtd"] = qtd
                    for _, selo in sorted(ln.selos):
                        if selo not in ultimo.setdefault("selos", []):
                            ultimo["selos"].append(selo)
                else:
                    ultimo = novo_bloco(sec, {"t": "p", "html": html_de(ln.celulas)})
                ultima_linha = ln
                continue
            if est == QTD and ultimo is not None and ultimo.get("t") == "item":
                ultimo["qtd"] = juntar(ultimo.get("qtd", ""), txt)
                continue

            # corpo: marcador, continuação, uso do item ou parágrafo
            h = html_de(ln.celulas)
            mesma_pagina = ultima_linha is not None and ultima_linha.pagina == ln.pagina
            salto = (ln.y0 - ultima_linha.y1) if mesma_pagina else 0
            if ln.marcador:
                ultimo = novo_bloco(sec, {"t": "li", "html": h, "x": ln.x0})
            elif ultimo is not None and ultimo.get("t") == "item" and ln.x0 > ultimo["x"] + 4 and salto < 8:
                ultimo["uso"] = juntar(ultimo.get("uso", ""), h)
            elif ultimo is not None and ultimo.get("t") in ("li", "p") and abs(ln.x0 - ultimo["x"]) < 4 and salto < 6:
                ultimo["html"] = juntar(ultimo["html"], h)
            else:
                ultimo = novo_bloco(sec, {"t": "p", "html": h, "x": ln.x0, "nota": est == NOTA})
            ultima_linha = ln
    return fichas


# ── índice (apelidos de cada ficha) ───────────────────────────────────────────

def ler_indice(paginas, numeros):
    """[(nome, página)] das duas colunas do índice. Nome sem número na linha é continuação."""
    entradas = []
    for n in numeros:
        linhas = paginas.get(n, [])
        colunas = {0: [], 1: []}
        fim = None
        for ln in linhas:
            if "TABELAS DE CONSULTA" in ln.texto:
                fim = ln.y0
        for ln in linhas:
            if fim is not None and ln.y0 >= fim - 1:
                continue
            for k in (0, 1):
                cels = [c for c in ln.celulas if (c.x0 < 297) == (k == 0)]
                if cels:
                    colunas[k].append(cels)
        for col in colunas.values():
            atual = None
            for cels in col:
                nums = [c.texto for c in cels if c.texto.isdigit()]
                nome = " ".join(c.texto for c in cels if not c.texto.isdigit()).strip()
                m = re.match(r"^(.*?)\s+(\d{1,3})$", nome)
                if m and not nums:
                    nome, nums = m.group(1), [m.group(2)]
                if nums and nome:
                    atual = [nome, int(nums[0])]
                    entradas.append(atual)
                elif nome and atual is not None and not nums:
                    atual[0] = juntar(atual[0], nome)
    return [(nome, pag) for nome, pag in entradas]


# ── tabelas do fim ────────────────────────────────────────────────────────────

def ler_tabelas(paginas, numeros):
    """As tabelas de consulta rápida do fim do PDF.

    Colunas: pela posição dos títulos no cabeçalho escuro. Linhas: começa uma nova quando
    a primeira coluna tem texto e o salto vertical é maior que o de uma quebra de linha.
    """
    tabelas = []
    atual = None
    titulo_aberto = False
    for n in numeros:
        linhas = paginas.get(n, [])
        xs = None
        ult_nota_y = None
        for ln in linhas:
            est = ln.estilo
            if est == T_TITULO:
                if titulo_aberto:
                    atual["titulo"] = juntar(atual["titulo"], ln.texto)
                else:
                    atual = {"titulo": ln.texto, "sub": "", "colunas": [], "linhas": [], "notas": []}
                    tabelas.append(atual)
                    titulo_aberto = True
                xs = None
                continue
            titulo_aberto = False
            if atual is None:
                continue
            if est == T_SUB and not atual["linhas"]:
                atual["sub"] = juntar(atual["sub"], html_de(ln.celulas))
                continue
            if est == T_CAB:
                nomes = [c.texto for c in ln.celulas]
                if atual["colunas"] and nomes != atual["colunas"]:
                    # outra tabela sob o mesmo título (corticoides: equivalência e potência tópica)
                    atual = {"titulo": atual["titulo"], "sub": "", "colunas": [], "linhas": [], "notas": []}
                    tabelas.append(atual)
                atual["colunas"] = nomes
                xs = [c.x0 for c in ln.celulas]
                prev_y = None
                continue
            if est[0] > 9.6:
                continue  # contracapa
            spans = [sp for c in ln.celulas for sp in c.spans]
            if xs is not None and est in ((8.4, "12315a"), (8.4, "1d2733"), (8.4, "c8413b"), (8.4, "b07a0a"), (8.4, "2e8b57")):
                cols = [[] for _ in xs]
                for sp in spans:
                    k = max([i for i, x in enumerate(xs) if sp["x0"] >= x - 3] or [0])
                    cols[k].append(sp)
                nova = bool(cols[0]) and cols[0][0]["color"] == "12315a" and (prev_y is None or ln.y0 - prev_y > 13)
                if nova or not atual["linhas"]:
                    atual["linhas"].append([[] for _ in xs])
                linha_tab = atual["linhas"][-1]
                for k, sps in enumerate(cols):
                    if sps:
                        linha_tab[k].append(Celula(sps))
                prev_y = ln.y0
                continue
            # nota de rodapé da tabela (pode quebrar em várias linhas)
            h = html_de(ln.celulas)
            if atual["notas"] and ult_nota_y is not None and ln.y0 - ult_nota_y < 13:
                atual["notas"][-1] = juntar(atual["notas"][-1], h)
            else:
                atual["notas"].append(h)
            ult_nota_y = ln.y0
    for t in tabelas:
        t["linhas"] = [[html_cels(cels) for cels in lt] for lt in t["linhas"]]
    return tabelas


def html_cels(cels):
    h = ""
    for c in cels:
        h = juntar(h, html_de([c]))
    h = re.sub(r'</b> <b class="(\w+)">', " ", h)  # "Amoxicilina +" e "clavulanato" num negrito só
    return h


# ── índice de medicamentos ────────────────────────────────────────────────────

FORMA = re.compile(r"\s(\d|\(|cp\b|comp\b|creme\b|pomada\b|gel\b|xarope\b|solução\b|suspensão\b|colírio\b|spray\b|loção\b|"
                   r"shampoo\b|xampu\b|gotas\b|sachê\b|ampola\b|frasco\b|injetável\b|tópico\b|EV\b|IM\b|em\s+gotas|FPS\b)", re.I)


def remedios_do_item(nome):
    """Nomes de remédio de um item da receita, sem dose nem forma.

    "Sulfametoxazol + trimetoprima 800/160 mg" é um remédio só (as partes não têm dose);
    "Paracetamol 500 mg + codeína 30 mg" são dois; "Metilprednisolona 40 mg EV ou
    Hidrocortisona 100 mg EV" também.
    """
    n = re.sub(r"^(Nebulização|Inalação)\s*:\s*", "", nome.strip(), flags=re.I)
    partes = re.split(r"\s+\+\s+|\s+ou\s+(?=[A-ZÁÉÍÓÚ])", n)
    if len(partes) > 1 and not all(re.search(r"\d", p) for p in partes[:-1]):
        partes = [n]
    res = []
    for p in partes:
        p = re.split(r"\s+[-–]\s+", p)[0]
        m = FORMA.search(p)
        if m and m.start() > 0:
            p = p[: m.start()]
        p = p.strip(" ,.;:")
        if p.upper() == "SF":
            p = "Soro fisiológico"
        if p:
            p = p[0].upper() + p[1:]
            if p not in res:
                res.append(p)
    return res


ids_por_ficha = {}


def montar(caminhos):
    paginas = ler_paginas(caminhos)
    numeros = sorted(p for p in paginas if p > 0)
    # fichas: da primeira página com título até antes das tabelas
    com_titulo = [p for p in numeros if any(l.estilo == TITULO for l in paginas[p])]
    com_tabela = [p for p in numeros if any(l.estilo == T_TITULO or l.estilo == T_CAB for l in paginas[p])]
    pag_tabelas = [p for p in numeros if p >= min(com_tabela)] if com_tabela else []
    fim_fichas = (min(pag_tabelas) - 1) if pag_tabelas else max(numeros)
    fichas = ler_fichas(paginas, min(com_titulo), fim_fichas)
    indice_pags = [p for p in numeros if p < min(com_titulo) and any(re.search(r"\s\d{1,3}$", l.texto) for l in paginas[p])]
    indice = ler_indice(paginas, [p for p in indice_pags if p >= 7])
    tabelas = ler_tabelas(paginas, pag_tabelas)

    # apelidos do índice, pela página
    por_pagina = {f.pagina: f for f in fichas}
    for nome, pag in indice:
        f = por_pagina.get(pag)
        if f is None:
            continue
        f.__dict__.setdefault("apelidos", [])
        if chave(nome) != chave(f.titulo) and nome not in f.apelidos:
            f.apelidos.append(nome)

    saida = []
    ids = set()
    for f in fichas:
        base = re.sub(r"\s+", "-", chave(f.titulo))[:48].strip("-")
        fid = base
        k = 2
        while fid in ids:
            fid = "%s-%d" % (base, k)
            k += 1
        ids.add(fid)
        ids_por_ficha[id(f)] = fid
        cid = f.cid.strip()
        if cid.startswith("(") and cid.endswith(")"):
            cid = cid[1:-1]
        secoes = []
        for s in f.secoes:
            blocos = []
            for b in s["blocos"]:
                b = dict(b)
                b.pop("x", None)
                if b.get("nota") is False:
                    b.pop("nota")
                if b["t"] == "item":
                    b["remedios"] = remedios_do_item(b["nome"])
                blocos.append(b)
            if blocos or s.get("caso"):
                s = dict(s)
                s["blocos"] = blocos
                secoes.append(s)
        saida.append({
            "id": fid,
            "titulo": f.titulo,
            "nome": nome_legivel(f.titulo),
            "cid": cid,
            "tags": list(dict.fromkeys(f.tags)),
            "busque": f.busque,
            "apelidos": getattr(f, "apelidos", []),
            "atestado": f.atestado,
            "retorno": f.retorno,
            "pagina": f.pagina,
            "secoes": secoes,
            "referencias": f.referencias,
        })

    atalhos = ler_atalhos(paginas, indice_pags, fichas)
    return {"fichas": saida, "tabelas": tabelas, "atalhos": atalhos}


def ler_atalhos(paginas, indice_pags, fichas):
    """Os 'Atalhos do plantão' do índice, ligados às fichas pelo nome."""
    titulos = [(chave(f.titulo), f) for f in fichas]
    res = []
    for p in indice_pags:
        ativo = False
        for ln in paginas[p]:
            if "ATALHOS DO PLANTÃO" in ln.texto:
                ativo = True
                continue
            if not ativo:
                continue
            if re.search(r"\s\d{1,3}$", ln.texto):
                return res
            k = " " + chave(ln.texto) + " "
            achadas = sorted((k.find(" " + t + " "), f) for t, f in titulos if " " + t + " " in k)
            for _, f in achadas:
                fid = ids_por_ficha[id(f)]
                if fid not in res:
                    res.append(fid)
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdfs", nargs="+")
    ap.add_argument("-o", "--saida", default=str(pathlib.Path(__file__).resolve().parent / "dados" / "prescricoes.json"))
    a = ap.parse_args()
    dados = montar(a.pdfs)
    destino = pathlib.Path(a.saida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    nf = len(dados["fichas"])
    ni = sum(1 for f in dados["fichas"] for s in f["secoes"] for b in s["blocos"] if b["t"] == "item")
    print("%s: %d fichas, %d itens de receita, %d tabelas, %d atalhos" % (destino, nf, ni, len(dados["tabelas"]), len(dados["atalhos"])), file=sys.stderr)


if __name__ == "__main__":
    main()
