#!/usr/bin/env python3
"""Desenha as ilustrações esquemáticas que vêm com o app (web/fotos/*.svg).

São esquemas, não fotos: mostram o que um desenho mostra bem (curvas, posições,
proporções, mapas). Domínio público (CC0), como o resto do conteúdo do app.

uso: python3 desenhos.py        (reescreve os SVG em web/fotos/)
"""
import math
import pathlib

PASTA = pathlib.Path(__file__).resolve().parent / "web" / "fotos"

TINTA = "#22302d"
CINZA = "#9aa5a2"
CLARO = "#e6ecea"
NORMAL = "#0f6b63"
NORMAL_C = "#d8efeb"
ANORMAL = "#b2442a"
ANORMAL_C = "#f6ddd5"
AMARELO = "#d9a400"
PELE = "#f3e2d3"
PELE_T = "#c9a68a"
FONTE = "font-family=\"'IBM Plex Sans','Roboto','Noto Sans','DejaVu Sans',sans-serif\""


def svg(conteudo, w=600, h=400, topo=22):
    """topo: faixa de cima que fica de fora (o nome do achado já aparece no app, não no desenho)."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {topo} {w} {h - topo}" width="{w}" height="{h - topo}">'
            f'<rect y="{topo}" width="{w}" height="{h - topo}" fill="#fff"/>{conteudo}</svg>\n')


def txt(x, y, s, tam=18, cor=TINTA, ancora="start", peso=400, estilo=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" {FONTE} font-size="{tam}" fill="{cor}" '
            f'text-anchor="{ancora}" font-weight="{peso}" {estilo}>{s}</text>')


def linha(pts, cor=TINTA, larg=3, extra=""):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polyline points="{d}" fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'


def poli(pts, cor, fundo, larg=2, extra=""):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polygon points="{d}" fill="{fundo}" stroke="{cor}" stroke-width="{larg}" stroke-linejoin="round" {extra}/>'


def gauss(t, c, l):
    return math.exp(-((t - c) / l) ** 2)


def titulo(s, sub=""):
    """Só a descrição do que observar. O nome (s) fica fora do desenho: o app já o mostra,
    e na revisão por imagem ele entregaria a resposta."""
    return txt(24, 48, sub, 16, CINZA) if sub else ""


# ── respiração ────────────────────────────────────────────────────────

def traco_resp(f, x0, x1, y0, passo=1.0):
    """f(x) devolve o deslocamento para cima (inspiração) em px."""
    pts = []
    x = x0
    while x <= x1:
        pts.append((x, y0 - f(x - x0)))
        x += passo
    return pts


def respiracao(nome, legenda, f, cor=ANORMAL, sub="inspiração para cima · mesmo intervalo de tempo"):
    ref = lambda u: 14 * (0.5 - 0.5 * math.cos(2 * math.pi * u / 90))
    c = titulo(legenda, sub)
    if cor != NORMAL:
        c += txt(24, 150, "Normal", 15, CINZA)
        c += linha(traco_resp(ref, 140, 576, 160), CINZA, 2.5)
    c += txt(24, 300, "Normal" if cor == NORMAL else "Alterado", 15, cor, peso=600)
    c += linha(traco_resp(f, 140, 576, 320), cor, 3)
    c += f'<line x1="120" y1="372" x2="576" y2="372" stroke="{CLARO}" stroke-width="2"/>'
    c += txt(348, 392, "tempo →", 14, CINZA, "middle")
    return svg(c)


def resp_cheyne(u):
    ciclo = u % 300
    if ciclo > 220:
        return 0
    env = math.sin(math.pi * ciclo / 220)
    return 34 * env * (0.5 - 0.5 * math.cos(2 * math.pi * ciclo / 36))


def resp_biot(u):
    grupos = [(0, 120), (190, 260), (380, 470)]  # surtos irregulares, pausas imprevisíveis
    for a, b in grupos:
        if a <= u <= b:
            amp = (22, 17, 24, 19)[int((u - a) // 40) % 4]  # amplitude constante em cada incursão
            return amp * (0.5 - 0.5 * math.cos(2 * math.pi * (u - a) / 40))
    return 0


# ── pulso arterial ────────────────────────────────────────────────────

def batimento(t, tipo):
    if tipo == "normal":
        return 1.0 * gauss(t, 0.16, 0.07) + 0.42 * gauss(t, 0.30, 0.08) + 0.30 * gauss(t, 0.48, 0.06) + 0.10 * gauss(t, 0.7, 0.2)
    if tipo == "parvus":
        return 0.48 * gauss(t, 0.36, 0.15) + 0.08 * gauss(t, 0.7, 0.2)
    if tipo == "martelo":
        return 1.45 * gauss(t, 0.12, 0.05) + 0.12 * gauss(t, 0.3, 0.08) - 0.12
    if tipo == "bisferiens":
        return 0.95 * gauss(t, 0.13, 0.05) + 0.88 * gauss(t, 0.31, 0.06) + 0.18 * gauss(t, 0.55, 0.08)
    raise ValueError(tipo)


def traco_pulso(x0, x1, y0, escala, amp_por_batida, tipo_por_batida, largura_batida=150):
    pts = []
    x = x0
    while x <= x1:
        k = int((x - x0) // largura_batida)
        t = ((x - x0) % largura_batida) / largura_batida
        pts.append((x, y0 - escala * amp_por_batida(k) * batimento(t, tipo_por_batida(k))))
        x += 1
    return pts


def pulso(nome, legenda, tipo, amp=lambda k: 1.0, nota="", sub="pressão arterial ao longo do tempo"):
    c = titulo(legenda, sub)
    cor = NORMAL if tipo == "normal" else ANORMAL
    if tipo != "normal":
        c += txt(24, 128, "Normal", 15, CINZA)
        c += linha(traco_pulso(140, 576, 175, 70, lambda k: 1.0, lambda k: "normal"), CINZA, 2.5)
    c += txt(24, 278, "Normal" if tipo == "normal" else "Alterado", 15, cor, peso=600)
    c += linha(traco_pulso(140, 576, 345, 70, amp, lambda k: tipo if tipo not in ("alternante", "paradoxal") else "normal"), cor, 3)
    if nota:
        c += nota
    return svg(c)


def nota_paradoxal():
    return (f'<rect x="290" y="222" width="150" height="10" rx="5" fill="{ANORMAL_C}"/>'
            + txt(365, 216, "inspiração", 14, ANORMAL, "middle"))


# ── pulso venoso jugular ──────────────────────────────────────────────

def jvp(t, tipo, k):
    a = 0.75 * gauss(t, 0.10, 0.05)
    cc = 0.35 * gauss(t, 0.24, 0.03)
    v = 0.6 * gauss(t, 0.58, 0.08)
    if tipo == "canhao" and k == 1:
        a = 1.9 * gauss(t, 0.30, 0.05)  # átrio contrai com a tricúspide fechada
    if tipo == "vgigante":
        cc, v = 0, 1.5 * gauss(t, 0.45, 0.13)  # onda cv: x some, y íngreme
    return a + cc + v


def jugular(nome, legenda, tipo):
    def traco(y0, tp, cor, larg):
        pts = []
        for x in range(120, 577):
            k = (x - 120) // 150
            t = ((x - 120) % 150) / 150
            pts.append((x, y0 - 60 * jvp(t, tp, k)))
        return linha(pts, cor, larg)
    c = titulo(legenda, "pulso venoso jugular · B1 e B2 marcadas")
    for i in range(3):
        for y in (170, 350):
            c += f'<line x1="{120 + 150 * i + 30:.0f}" y1="{y - 78}" x2="{120 + 150 * i + 30:.0f}" y2="{y + 6}" stroke="{CLARO}" stroke-width="2"/>'
            c += f'<line x1="{120 + 150 * i + 75:.0f}" y1="{y - 78}" x2="{120 + 150 * i + 75:.0f}" y2="{y + 6}" stroke="{CLARO}" stroke-width="2" stroke-dasharray="4 4"/>'
    c += txt(24, 128, "Normal", 15, CINZA) + traco(170, "normal", CINZA, 2.5)
    for x, s in ((135, "a"), (157, "c"), (205, "v")):
        c += txt(x, 104 if s != "c" else 132, s, 15, CINZA, "middle", 600)
    c += txt(24, 300, "Alterado", 15, ANORMAL, peso=600) + traco(350, tipo, ANORMAL, 3)
    c += txt(150, 392, "B1", 13, CINZA, "middle") + txt(195, 392, "B2", 13, CINZA, "middle")
    return svg(c)


# ── fonocardiograma esquemático ───────────────────────────────────────
B1, B2, B1b = 110, 330, 550
BASE = 300


def bulha(x, alt=70, larg=7, cor=TINTA, rot=""):
    s = f'<rect x="{x - larg / 2:.1f}" y="{BASE - alt}" width="{larg}" height="{alt}" rx="2" fill="{cor}"/>'
    if rot:
        s += txt(x, BASE + 26, rot, 15, cor, "middle", 600)
    return s


def sopro(pts):
    return poli([(pts[0][0], BASE)] + pts + [(pts[-1][0], BASE)], ANORMAL, ANORMAL_C, 2)


def fono(legenda, sub, extras, b1=70, b2=70, b2_desdobra=False, b1_rot="B1"):
    c = titulo(legenda, sub)
    c += f'<rect x="{B1}" y="96" width="{B2 - B1}" height="18" rx="4" fill="{CLARO}"/>' + txt((B1 + B2) / 2, 110, "sístole", 13, TINTA, "middle")
    c += f'<rect x="{B2}" y="96" width="{B1b - B2}" height="18" rx="4" fill="#f1f4f3"/>' + txt((B2 + B1b) / 2, 110, "diástole", 13, TINTA, "middle")
    c += f'<line x1="70" y1="{BASE}" x2="580" y2="{BASE}" stroke="{CINZA}" stroke-width="2"/>'
    c += extras
    c += bulha(B1, b1, rot=b1_rot) + bulha(B1b, b1, rot="B1")
    if b2_desdobra:
        c += bulha(B2 - 7, b2, 6) + bulha(B2 + 9, b2 * 0.85, 6) + txt(B2, BASE + 26, "B2", 15, TINTA, "middle", 600)
    else:
        c += bulha(B2, b2, rot="B2")
    return svg(c)


def diamante(x0, x1, alt):
    m = (x0 + x1) / 2
    return sopro([(x0, BASE - 4), (m, BASE - alt), (x1, BASE - 4)])


# ── unhas e dedos ─────────────────────────────────────────────────────

def dedo_perfil(x, y, baqueteado=False, colher=False, cor=TINTA, fundo=PELE):
    """Ponta de dedo de perfil, apontando para a direita, unha em cima."""
    if baqueteado:
        corpo = (f"M{x},{y} L{x + 210},{y - 6} C{x + 250},{y - 34} {x + 330},{y - 40} {x + 352},{y + 6} "
                 f"C{x + 372},{y + 52} {x + 330},{y + 96} {x + 250},{y + 92} L{x},{y + 86} Z")
        unha = f"M{x + 214},{y - 10} C{x + 262},{y - 44} {x + 330},{y - 44} {x + 352},{y + 4}"
    else:
        corpo = (f"M{x},{y} L{x + 230},{y + 2} C{x + 280},{y + 2} {x + 318},{y + 14} {x + 330},{y + 40} "
                 f"C{x + 340},{y + 70} {x + 300},{y + 90} {x + 240},{y + 88} L{x},{y + 86} Z")
        if colher:
            unha = f"M{x + 226},{y} C{x + 262},{y + 14} {x + 300},{y + 6} {x + 332},{y - 10}"
        else:
            unha = f"M{x + 226},{y - 2} C{x + 270},{y - 4} {x + 312},{y + 6} {x + 332},{y + 30}"
    return (f'<path d="{corpo}" fill="{fundo}" stroke="{PELE_T}" stroke-width="2.5"/>'
            f'<path d="{unha}" fill="none" stroke="{cor}" stroke-width="7" stroke-linecap="round"/>')


def unha_topo(cx, cy, detalhe="", leito="#f4c9c0"):
    """Ponta do dedo vista de cima, com a lâmina da unha."""
    s = f'<rect x="{cx - 70}" y="{cy - 120}" width="140" height="300" rx="70" fill="{PELE}" stroke="{PELE_T}" stroke-width="2.5"/>'
    s += f'<rect x="{cx - 52}" y="{cy - 100}" width="104" height="150" rx="40" fill="{leito}" stroke="{PELE_T}" stroke-width="2"/>'
    s += f'<path d="M{cx - 52},{cy + 30} Q{cx},{cy + 6} {cx + 52},{cy + 30}" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/>'
    return s + detalhe


# ── olhos ─────────────────────────────────────────────────────────────

def olho(cx, cy, pupila=4.0, dx=0.0, dy=0.0, palpebra=0.0, fechado=False):
    """palpebra: fração da fenda coberta pela pálpebra superior (0 a 1)."""
    s = f'<path d="M{cx - 62},{cy} Q{cx},{cy - 44} {cx + 62},{cy} Q{cx},{cy + 44} {cx - 62},{cy} Z" fill="#fff" stroke="{TINTA}" stroke-width="2.5"/>'
    if fechado:
        return (f'<path d="M{cx - 62},{cy} Q{cx},{cy - 44} {cx + 62},{cy} Q{cx},{cy + 44} {cx - 62},{cy} Z" fill="{PELE}" stroke="{PELE_T}" stroke-width="2"/>'
                f'<path d="M{cx - 60},{cy} Q{cx},{cy + 22} {cx + 60},{cy}" fill="none" stroke="{TINTA}" stroke-width="3"/>')
    clip = f"o{int(cx)}{int(cy)}"
    s += f'<clipPath id="{clip}"><path d="M{cx - 62},{cy} Q{cx},{cy - 44} {cx + 62},{cy} Q{cx},{cy + 44} {cx - 62},{cy} Z"/></clipPath>'
    s += f'<g clip-path="url(#{clip})"><circle cx="{cx + dx}" cy="{cy + dy}" r="21" fill="#7b5a3c"/>'
    s += f'<circle cx="{cx + dx}" cy="{cy + dy}" r="{pupila * 2.4:.1f}" fill="#111"/>'
    s += f'<circle cx="{cx + dx + 6}" cy="{cy + dy - 7}" r="3" fill="#fff" opacity=".8"/>'
    if palpebra > 0:
        topo = cy - 22
        s += f'<rect x="{cx - 70}" y="{topo - 30}" width="140" height="{30 + 44 * palpebra:.1f}" fill="{PELE}"/>'
        s += f'<line x1="{cx - 70}" y1="{topo + 44 * palpebra:.1f}" x2="{cx + 70}" y2="{topo + 44 * palpebra:.1f}" stroke="{TINTA}" stroke-width="3"/>'
    s += "</g>"
    s += f'<path d="M{cx - 62},{cy} Q{cx},{cy - 44} {cx + 62},{cy} Q{cx},{cy + 44} {cx - 62},{cy} Z" fill="none" stroke="{TINTA}" stroke-width="2.5"/>'
    return s


def par_de_olhos(legenda, sub, d, e, nota=""):
    """d e e: dicionários de olho() para o olho direito (à esquerda de quem olha) e o esquerdo."""
    c = titulo(legenda, sub)
    c += f'<rect x="90" y="120" width="420" height="190" rx="95" fill="{PELE}"/>'
    c += olho(210, 215, **d) + olho(390, 215, **e)
    c += txt(210, 340, "olho direito", 14, CINZA, "middle") + txt(390, 340, "olho esquerdo", 14, CINZA, "middle")
    c += txt(300, 380, "como você vê o paciente, de frente", 13, CINZA, "middle")
    return svg(c + nota)


# ── corpo de frente (mapas de sensibilidade) ──────────────────────────
CORPO = [
    '<circle cx="150" cy="52" r="28"/>',
    '<rect x="140" y="76" width="20" height="20"/>',
    '<path d="M98,100 Q150,86 202,100 L196,252 Q150,264 104,252 Z"/>',
    '<path d="M100,104 L82,108 L62,244 L80,247 Z"/>', '<ellipse cx="70" cy="262" rx="11" ry="17"/>',
    '<path d="M200,104 L218,108 L238,244 L220,247 Z"/>', '<ellipse cx="230" cy="262" rx="11" ry="17"/>',
    '<path d="M106,246 L148,252 L144,392 L120,392 Z"/>', '<path d="M152,252 L194,246 L180,392 L156,392 Z"/>',
    '<ellipse cx="129" cy="398" rx="17" ry="7"/>', '<ellipse cx="171" cy="398" rx="17" ry="7"/>',
]


def corpo(ox, oy, sombras, idc, rotulo=""):
    """sombras: lista de (svg dentro do sistema do corpo, cor). Recortado pela silhueta."""
    s = f'<g transform="translate({ox},{oy})"><clipPath id="{idc}">{"".join(CORPO)}</clipPath>'
    s += f'<g fill="#fff" stroke="{TINTA}" stroke-width="2.5">{"".join(CORPO)}</g>'
    s += f'<g clip-path="url(#{idc})">{"".join(sombras)}</g>'
    s += f'<g fill="none" stroke="{TINTA}" stroke-width="2.5">{"".join(CORPO)}</g>'
    if rotulo:
        s += txt(150, 432, rotulo, 14, CINZA, "middle")
    return s + "</g>"


def mapa_sens(legenda, sub, sombras, chave, w=600, h=516):
    c = titulo(legenda, sub) + corpo(60, 70, sombras, "c" + legenda[:3].replace(" ", ""), "de frente; direita do paciente à esquerda")
    y = 170
    for cor, texto in chave:
        c += f'<rect x="340" y="{y - 14}" width="22" height="18" rx="3" fill="{cor}"/>' + txt(372, y, texto, 15)
        y += 32
    return svg(c, w, h)


# ── posturas (deitado de lado, cabeça à esquerda) ─────────────────────

def boneco(partes, cabeca=(110, 210)):
    s = f'<circle cx="{cabeca[0]}" cy="{cabeca[1]}" r="26" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
    for p in partes:
        s += linha(p, TINTA, 13)
    return s


# ── geração ───────────────────────────────────────────────────────────

def todos():
    d = {}
    S = lambda u, a, p: a * (0.5 - 0.5 * math.cos(2 * math.pi * u / p))
    d["resp-eupneia"] = respiracao("Eupneia", "Eupneia", lambda u: S(u, 14, 90), NORMAL, "ritmo e amplitude regulares · inspiração para cima")
    d["resp-taquipneia"] = respiracao("Taquipneia", "Taquipneia", lambda u: S(u, 11, 42), sub="mais incursões no mesmo tempo")
    d["resp-bradipneia"] = respiracao("Bradipneia", "Bradipneia", lambda u: S(u, 14, 170), sub="menos incursões no mesmo tempo")
    d["resp-kussmaul"] = respiracao("Kussmaul", "Respiração de Kussmaul", lambda u: S(u, 40, 95), sub="inspirações amplas e profundas, sem pausas")
    d["resp-cheyne"] = respiracao("Cheyne-Stokes", "Respiração de Cheyne-Stokes", resp_cheyne, sub="amplitude cresce, decresce e para (apneia)")
    d["resp-biot"] = respiracao("Biot", "Respiração de Biot", resp_biot, sub="surtos irregulares e pausas imprevisíveis")

    d["pulso-normal"] = pulso("Normal", "Pulso arterial normal", "normal", sub="subida rápida, pico e incisura dicrótica")
    d["pulso-parvus"] = pulso("Parvus et tardus", "Pulso parvus et tardus", "parvus", sub="pequeno e de subida lenta (estenose aórtica)")
    d["pulso-martelo"] = pulso("Martelo d'água", "Pulso em martelo d'água", "martelo", sub="amplo, sobe e cai de forma abrupta")
    d["pulso-bisferiens"] = pulso("Bisferiens", "Pulso bisferiens", "bisferiens", sub="dois picos em cada sístole")
    d["pulso-alternante"] = pulso("Alternante", "Pulso alternante", "alternante", amp=lambda k: 1.0 if k % 2 == 0 else 0.55,
                                  sub="um batimento forte e um fraco, ritmo regular")
    d["pulso-paradoxal"] = pulso("Paradoxal", "Pulso paradoxal", "paradoxal", amp=lambda k: 0.55 if k == 1 else 1.0, nota=nota_paradoxal(),
                                 sub="a amplitude cai mais de 10 mmHg na inspiração")

    d["jugular-canhao"] = jugular("Onda a em canhão", "Ondas a em canhão (dissociação AV)", "canhao")
    d["jugular-v"] = jugular("Onda v gigante", "Onda v gigante (insuficiência tricúspide)", "vgigante")

    d["fono-normal"] = fono("Bulhas normais em dois tempos", "B1 no início da sístole, B2 no início da diástole", "")
    d["fono-ea"] = fono("Sopro sistólico ejetivo (em diamante)", "Estenose aórtica: começa depois de B1 e termina antes de B2",
                        diamante(B1 + 22, B2 - 18, 62), b2=50)
    d["fono-cmh"] = fono("Sopro da cardiomiopatia hipertrófica", "Ejetivo; aumenta com Valsalva e de pé, diminui de cócoras",
                         diamante(B1 + 40, B2 - 22, 52))
    d["fono-im"] = fono("Sopro holossistólico", "Insuficiência mitral: de B1 a B2, intensidade constante",
                        sopro([(B1 + 5, BASE - 42), (B2 - 5, BASE - 42)]), b1=48)
    d["fono-civ"] = fono("Sopro holossistólico rude", "Comunicação interventricular: ocupa toda a sístole",
                         sopro([(B1 + 5, BASE - 55), (B2 - 5, BASE - 50)]))
    d["fono-iao"] = fono("Sopro diastólico aspirativo", "Insuficiência aórtica: começa em B2 e decresce",
                         sopro([(B2 + 6, BASE - 52), (B2 + 190, BASE - 4)]))
    d["fono-em"] = fono("Estalido de abertura e ruflar", "Estenose mitral: B1 forte, estalido (EA), ruflar e reforço pré-sistólico",
                        bulha(B2 + 42, 46, 6, ANORMAL, "EA")
                        + sopro([(B2 + 56, BASE - 30), (B2 + 140, BASE - 8)])
                        + sopro([(B1b - 70, BASE - 6), (B1b - 8, BASE - 40)]), b1=95)
    d["fono-pca"] = fono("Sopro contínuo em maquinaria", "Canal arterial: cresce até B2, atravessa e segue na diástole",
                         sopro([(B1 + 8, BASE - 10), (B2, BASE - 60), (B1b - 30, BASE - 8)]))
    d["fono-prolapso"] = fono("Clique e sopro telessistólico", "Prolapso mitral: clique no meio da sístole, sopro até B2",
                              bulha(B1 + 115, 46, 6, ANORMAL, "clique") + sopro([(B1 + 128, BASE - 14), (B2 - 6, BASE - 44)]))
    d["fono-pulmonar"] = fono("Sopro ejetivo pulmonar e B2 desdobrada", "Comunicação interatrial: desdobramento fixo de B2",
                              diamante(B1 + 26, B2 - 30, 40), b2_desdobra=True)
    d["fono-b3"] = fono("Terceira bulha (B3)", "Logo depois de B2, no enchimento rápido: ritmo de galope",
                        bulha(B2 + 62, 34, 9, ANORMAL, "B3"))
    d["fono-b4"] = fono("Quarta bulha (B4)", "Logo antes de B1, na contração atrial",
                        bulha(B1b - 40, 34, 9, ANORMAL, "B4"))
    return d


# ══ segundo bloco: unhas, olhos, face, corpo, posturas, tórax, abdome, mãos, obstetrícia, pediatria ══

def dedo_lado(x, y, tipo):
    """Ponta de dedo de perfil (para a direita, dorso em cima). Devolve (svg, dobra, tangente da unha)."""
    if tipo == "baqueteado":
        corpo = (f"M{x},{y} L{x + 205},{y - 4} C{x + 245},{y - 40} {x + 330},{y - 46} {x + 354},{y + 4} "
                 f"C{x + 378},{y + 56} {x + 334},{y + 104} {x + 250},{y + 98} L{x},{y + 86} Z")
        unha = f"M{x + 207},{y - 6} C{x + 247},{y - 42} {x + 328},{y - 48} {x + 352},{y + 2}"
        dobra, tang = (x + 207, y - 6), (40, -36)
    elif tipo == "colher":
        corpo = (f"M{x},{y} L{x + 230},{y + 2} C{x + 270},{y + 14} {x + 300},{y + 12} {x + 330},{y + 2} "
                 f"C{x + 350},{y + 40} {x + 312},{y + 90} {x + 240},{y + 88} L{x},{y + 86} Z")
        unha = f"M{x + 228},{y + 2} C{x + 268},{y + 18} {x + 304},{y + 14} {x + 334},{y - 2}"
        dobra, tang = (x + 228, y + 2), (40, 16)
    else:
        corpo = (f"M{x},{y} L{x + 230},{y + 2} C{x + 270},{y + 16} {x + 318},{y + 22} {x + 334},{y + 46} "
                 f"C{x + 346},{y + 76} {x + 300},{y + 92} {x + 240},{y + 88} L{x},{y + 86} Z")
        unha = f"M{x + 228},{y} C{x + 268},{y + 14} {x + 312},{y + 20} {x + 330},{y + 38}"
        dobra, tang = (x + 228, y), (40, 14)
    s = (f'<path d="{corpo}" fill="{PELE}" stroke="{PELE_T}" stroke-width="2.5"/>'
         f'<path d="{unha}" fill="none" stroke="#c98f86" stroke-width="8" stroke-linecap="round"/>')
    return s, dobra, tang


def angulo(dobra, tang, cor, rot):
    x, y = dobra
    n = math.hypot(*tang)
    ux, uy = tang[0] / n, tang[1] / n
    s = f'<line x1="{x}" y1="{y}" x2="{x - 110}" y2="{y}" stroke="{cor}" stroke-width="2" stroke-dasharray="6 5"/>'
    s += f'<line x1="{x}" y1="{y}" x2="{x + 110 * ux:.1f}" y2="{y + 110 * uy:.1f}" stroke="{cor}" stroke-width="2" stroke-dasharray="6 5"/>'
    return s + txt(x - 6, y - 14, rot, 16, cor, "end", 600)


def unha_baqueteamento():
    c = titulo("Baqueteamento digital", "ângulo entre o dorso do dedo e a unha (de Lovibond)")
    s1, d1, t1 = dedo_lado(110, 120, "normal")
    s2, d2, t2 = dedo_lado(110, 280, "baqueteado")
    c += s1 + angulo(d1, t1, NORMAL, "≈ 160°") + txt(24, 175, "Normal", 15, NORMAL, peso=600)
    c += s2 + angulo(d2, t2, ANORMAL, "≥ 180°") + txt(24, 335, "Alterado", 15, ANORMAL, peso=600)
    return svg(c, 600, 420)


def schamroth():
    def dedo(cx, lado, normal):
        X = lambda m: cx + lado * m
        if normal:  # dorso encosta na articulação e na ponta da unha; afunda na dobra da unha
            corpo = (f"M{X(0)},350 L{X(0)},258 Q{X(4)},234 {X(15)},206 Q{X(10)},172 {X(0)},152 "
                     f"Q{X(0)},116 {X(42)},112 Q{X(82)},112 {X(84)},170 L{X(84)},350 Z")
            unha = f"M{X(13)},210 Q{X(9)},174 {X(1)},152"
        else:  # dobra abaulada encosta no outro dedo; as pontas se afastam
            corpo = (f"M{X(0)},350 L{X(0)},178 Q{X(0)},150 {X(16)},126 Q{X(34)},102 {X(62)},106 "
                     f"Q{X(96)},114 {X(94)},176 L{X(86)},350 Z")
            unha = f"M{X(1)},196 Q{X(2)},156 {X(16)},126"
        return (f'<path d="{corpo}" fill="{PELE}" stroke="{PELE_T}" stroke-width="2.5"/>'
                f'<path d="{unha}" fill="none" stroke="#c98f86" stroke-width="7" stroke-linecap="round"/>')
    c = titulo("Sinal de Schamroth", "dois dedos iguais encostados pelo dorso, unha com unha")
    c += dedo(170, -1, True) + dedo(170, 1, True)
    c += f'<path d="M170,258 Q174,234 185,206 Q180,172 170,152 Q160,172 155,206 Q166,234 170,258 Z" fill="{NORMAL_C}" stroke="{NORMAL}" stroke-width="2"/>'
    c += txt(170, 382, "Normal: janela em losango", 15, NORMAL, "middle", 600)
    c += dedo(430, -1, False) + dedo(430, 1, False)
    c += f'<path d="M430,178 L446,126 L414,126 Z" fill="none" stroke="{ANORMAL}" stroke-width="2" stroke-dasharray="4 3"/>'
    c += txt(430, 382, "Alterado: sem janela", 15, ANORMAL, "middle", 600)
    return svg(c)


def unha_coiloniquia():
    c = titulo("Coiloníquia (unha em colher)", "unha fina, côncava, com as bordas viradas para cima")
    s1, _, _ = dedo_lado(110, 130, "normal")
    s2, _, _ = dedo_lado(110, 280, "colher")
    c += s1 + txt(24, 185, "Normal", 15, NORMAL, peso=600) + s2 + txt(24, 335, "Alterado", 15, ANORMAL, peso=600)
    c += f'<ellipse cx="400" cy="287" rx="16" ry="5" fill="#9cc7e8" opacity=".9"/>' + txt(470, 268, "segura uma gota", 14, ANORMAL, "middle")
    return svg(c, 600, 400)


def unha_topo_fig(titulo_, sub, detalhe, leito="#f4c9c0"):
    c = titulo(titulo_, sub)
    c += f'<g transform="translate(0,20)">{unha_topo(150, 200)}</g>' + txt(150, 432, "normal", 14, CINZA, "middle")
    c += f'<g transform="translate(0,20)">{unha_topo(400, 200, detalhe, leito)}</g>'
    return svg(c, 600, 446)


def unhas():
    d = {}
    cx, cy = 400, 220  # centro da unha da direita já com o deslocamento de 20
    terry = (f'<rect x="{cx - 52}" y="{cy - 100}" width="104" height="150" rx="40" fill="#f4efe9"/>'
             f'<rect x="{cx - 52}" y="{cy - 100}" width="104" height="22" rx="10" fill="#e9a79c"/>')
    d["unha-terry"] = unha_topo_fig("Unhas de Terry", "unha quase toda branca, faixa rosada na ponta", "")
    d["unha-terry"] = d["unha-terry"].replace("</svg>", f'<g>{terry}</g>' + txt(470, 102, "faixa rosada", 13, ANORMAL) + "</svg>")
    beau = "".join(f'<path d="M{cx - 50},{y} Q{cx},{y - 10} {cx + 50},{y}" fill="none" stroke="#a7685f" stroke-width="4"/>' for y in (cy - 30, cy - 12))
    d["unha-beau"] = unha_topo_fig("Linhas de Beau", "sulcos transversais: a matriz parou de crescer por um tempo", "").replace("</svg>", beau + "</svg>")
    estilhaco = "".join(f'<line x1="{x}" y1="{cy - 92}" x2="{x + 2}" y2="{cy - 60}" stroke="#6b1d14" stroke-width="2.5" stroke-linecap="round"/>' for x in (cx - 22, cx + 4, cx + 26))
    d["unha-estilhaco"] = unha_topo_fig("Hemorragias em estilhaço", "linhas finas vermelho-escuras no sentido do crescimento", "").replace("</svg>", estilhaco + "</svg>")
    furos = "".join(f'<circle cx="{cx + dx}" cy="{cy + dy}" r="3.2" fill="#9b7068"/>' for dx, dy in ((-24, -10), (-6, -30), (16, -14), (28, 6), (-14, 14), (4, 2), (-30, -40), (22, -46)))
    onicolise = f'<path d="M{cx - 52},{cy - 74} Q{cx - 20},{cy - 56} {cx + 10},{cy - 72} Q{cx + 30},{cy - 82} {cx + 52},{cy - 72} L{cx + 52},{cy - 100} L{cx - 52},{cy - 100} Z" fill="#f2ead2"/>'
    d["unha-psoriase"] = unha_topo_fig("Unha na psoríase", "depressões puntiformes (pitting) e descolamento na ponta", "").replace("</svg>", onicolise + furos + "</svg>")
    return d


# olhos

def olhos_todos():
    d = {}
    N = dict(pupila=3.5)
    d["olhos-normais"] = par_de_olhos("Pupilas isocóricas", "mesmo tamanho; contraem com a luz nos dois olhos", N, N)
    d["olhos-anisocoria"] = par_de_olhos("Anisocoria", "pupilas de tamanhos diferentes", dict(pupila=6.8), dict(pupila=3.0))
    d["olhos-miose"] = par_de_olhos("Miose bilateral", "pupilas puntiformes (opioides, organofosforados, ponte)", dict(pupila=1.1), dict(pupila=1.1))
    d["olhos-midriase"] = par_de_olhos("Midríase bilateral", "pupilas dilatadas", dict(pupila=7.6), dict(pupila=7.6))
    d["olhos-ptose"] = par_de_olhos("Ptose palpebral à direita", "a pálpebra superior cobre parte da íris", dict(pupila=3.5, palpebra=0.55), N)
    d["olhos-iii"] = par_de_olhos("Paralisia do III nervo à direita", "olhando para a frente: olho para baixo e para fora, ptose e midríase",
                                  dict(pupila=7.0, dx=-18, dy=9, palpebra=0.62), N)
    d["olhos-vi"] = par_de_olhos("Paralisia do VI nervo à direita", "pedido para olhar para a direita: o olho direito não vai para fora",
                                 dict(pupila=3.5, dx=0), dict(pupila=3.5, dx=-20),
                                 nota=f'<path d="M330,110 L270,110" stroke="{TINTA}" stroke-width="3" marker-end="url(#seta)"/>'
                                 + '<defs><marker id="seta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#22302d"/></marker></defs>'
                                 + txt(300, 100, "olhar", 13, TINTA, "middle"))
    return d


def hemianopsia():
    c = titulo("Hemianopsia homônima direita", "campos visuais como o paciente vê: a mesma metade some nos dois olhos")
    for cx, rot in ((190, "olho esquerdo"), (410, "olho direito")):
        c += f'<clipPath id="h{cx}"><circle cx="{cx}" cy="220" r="100"/></clipPath>'
        c += f'<circle cx="{cx}" cy="220" r="100" fill="#fff" stroke="{TINTA}" stroke-width="3"/>'
        c += f'<rect x="{cx}" y="110" width="110" height="220" fill="#2a2f2e" clip-path="url(#h{cx})"/>'
        c += f'<line x1="{cx}" y1="115" x2="{cx}" y2="325" stroke="{CINZA}" stroke-width="1.5" stroke-dasharray="4 4"/>'
        c += f'<circle cx="{cx}" cy="220" r="4" fill="{ANORMAL}"/>' + txt(cx, 352, rot, 15, CINZA, "middle")
    c += txt(300, 385, "lesão da via óptica esquerda depois do quiasma", 14, ANORMAL, "middle")
    return svg(c)


# face

def rosto(cx, cy, fraco, tipo):
    """fraco: lado de quem olha ('esq'); tipo: 'periferica' ou 'central'. Pedido: franzir a testa, fechar os olhos, sorrir."""
    s = f'<ellipse cx="{cx}" cy="{cy}" rx="100" ry="128" fill="{PELE}" stroke="{PELE_T}" stroke-width="2.5"/>'
    for lado in (-1, 1):
        e_fraco = (lado == -1 and fraco == "esq") or (lado == 1 and fraco == "dir")
        ox = cx + lado * 42
        testa = not (e_fraco and tipo == "periferica")
        olho_fecha = not (e_fraco and tipo == "periferica")
        boca_sobe = not e_fraco
        if testa:
            for k in range(3):
                y = cy - 92 + k * 10
                s += f'<path d="M{cx + lado * 12},{y} q{lado * 18},-5 {lado * 36},0 t{lado * 36},0" fill="none" stroke="{PELE_T}" stroke-width="2"/>'
        s += f'<path d="M{ox - 26},{cy - 46} Q{ox},{cy - (58 if testa else 50)} {ox + 26},{cy - 46}" fill="none" stroke="#6b5240" stroke-width="5" stroke-linecap="round"/>'
        if olho_fecha:
            s += f'<path d="M{ox - 24},{cy - 22} Q{ox},{cy - 12} {ox + 24},{cy - 22}" fill="none" stroke="{TINTA}" stroke-width="3"/>'
        else:  # não fecha: aparece a esclera, olho rolado para cima (sinal de Bell)
            s += f'<path d="M{ox - 24},{cy - 22} Q{ox},{cy - 40} {ox + 24},{cy - 22} Q{ox},{cy - 6} {ox - 24},{cy - 22} Z" fill="#fff" stroke="{TINTA}" stroke-width="2.5"/>'
            s += f'<circle cx="{ox}" cy="{cy - 31}" r="8" fill="#7b5a3c"/>'
        if boca_sobe:
            s += f'<path d="M{cx + lado * 20},{cy + 14} Q{cx + lado * 40},{cy + 34} {cx + lado * 50},{cy + 52}" fill="none" stroke="{PELE_T}" stroke-width="2.5"/>'
    yl = cy + 44 if fraco == "dir" else cy + 78
    yr = cy + 44 if fraco == "esq" else cy + 78
    s += f'<path d="M{cx - 44},{yl} Q{cx},{cy + 84} {cx + 44},{yr}" fill="#b5524a" stroke="#7a3029" stroke-width="2.5"/>'
    s += f'<path d="M{cx},{cy - 20} L{cx - 8},{cy + 22} Q{cx},{cy + 28} {cx + 10},{cy + 22}" fill="none" stroke="{PELE_T}" stroke-width="2.5"/>'
    return s


def faces():
    d = {}
    base = "pedido: franzir a testa, fechar os olhos e sorrir"
    c = titulo("Paralisia facial periférica (direita)", base)
    c += rosto(300, 236, "esq", "periferica") + txt(300, 392, "lado afetado à esquerda de quem olha", 13, CINZA, "middle")
    c += txt(150, 120, "testa lisa", 14, ANORMAL, "middle") + txt(150, 140, "olho não fecha", 14, ANORMAL, "middle") + txt(150, 330, "boca desvia", 14, ANORMAL, "middle") + txt(150, 350, "para o lado são", 14, ANORMAL, "middle")
    d["face-periferica"] = svg(c, 600, 404)
    c = titulo("Paralisia facial central (direita)", base)
    c += rosto(300, 236, "esq", "central") + txt(300, 392, "lado afetado à esquerda de quem olha", 13, CINZA, "middle")
    c += txt(150, 120, "testa e olho", 14, NORMAL, "middle") + txt(150, 140, "preservados", 14, NORMAL, "middle") + txt(150, 330, "só a metade", 14, ANORMAL, "middle") + txt(150, 350, "de baixo cai", 14, ANORMAL, "middle")
    d["face-central"] = svg(c, 600, 404)
    return d


# mapas de sensibilidade

def sensibilidade():
    d = {}
    gr = ('<defs><linearGradient id="gbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b2442a" stop-opacity="0"/>'
          '<stop offset=".5" stop-color="#b2442a" stop-opacity=".5"/><stop offset="1" stop-color="#b2442a" stop-opacity=".7"/></linearGradient>'
          '<pattern id="hach" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#dfe7f5"/><line x1="0" y1="0" x2="0" y2="10" stroke="#3d5f9e" stroke-width="4"/></pattern></defs>')
    d["sens-bota-luva"] = mapa_sens("Hipoestesia em bota e luva", "começa nos pés, depois sobe; as mãos vêm depois",
                                    [gr, '<rect x="30" y="200" width="75" height="90" fill="url(#gbl)"/>', '<rect x="195" y="200" width="75" height="90" fill="url(#gbl)"/>',
                                     '<rect x="100" y="300" width="100" height="110" fill="url(#gbl)"/>'],
                                    [(ANORMAL_C, "menos sensibilidade"), ("#b2442a", "mais intensa nas pontas")])
    d["sens-nivel"] = mapa_sens("Nível sensitivo", "perda abaixo de um dermátomo (aqui T10, no umbigo)",
                                ['<rect x="100" y="196" width="100" height="220" fill="#e7a593"/>',
                                 '<line x1="80" y1="196" x2="220" y2="196" stroke="#b2442a" stroke-width="3" stroke-dasharray="6 4"/>'],
                                [("#e7a593", "sem sensibilidade"), ("#b2442a", "nível: T10 (umbigo)")])
    d["sens-capa"] = mapa_sens("Perda em capa (siringomielia)", "dor e temperatura perdidas em ombros, braços e mãos",
                               ['<rect x="0" y="96" width="300" height="56" fill="#e7a593"/>', '<rect x="0" y="96" width="101" height="200" fill="#e7a593"/>',
                                '<rect x="199" y="96" width="101" height="200" fill="#e7a593"/>'],
                               [("#e7a593", "sem dor nem temperatura"), ("#fff", "tato e posição preservados")])
    d["sens-hemi"] = mapa_sens("Hemi-hipoestesia esquerda", "perda em todo um lado do corpo, incluindo a face",
                               ['<rect x="150" y="0" width="160" height="420" fill="#e7a593"/>'],
                               [("#e7a593", "lado esquerdo do paciente"), ("#fff", "lesão no hemisfério direito")])
    d["sens-brown"] = mapa_sens("Brown-Séquard (lesão à direita, T10)", "o que se perde de cada lado abaixo da lesão",
                                [gr, '<rect x="100" y="196" width="50" height="220" fill="url(#hach)"/>', '<rect x="150" y="210" width="50" height="210" fill="#e7a593"/>',
                                 '<line x1="80" y1="196" x2="220" y2="196" stroke="#b2442a" stroke-width="3" stroke-dasharray="6 4"/>'],
                                [("url(#hach)", "direita: fraqueza, perda de"), ("#fff", "  posição e vibração"), ("#e7a593", "esquerda: perda de dor"), ("#fff", "  e temperatura")])
    return d


# posturas (perfil, deitado de costas, cabeça à esquerda)

def posturas():
    d = {}
    chao = f'<line x1="40" y1="292" x2="570" y2="292" stroke="{CLARO}" stroke-width="6"/>'
    tronco = [(132, 262), (300, 266)]
    c = titulo("Postura de decorticação", "braços fletidos sobre o peito, pernas estendidas, pés em flexão plantar")
    c += chao + boneco([tronco, [(300, 266), (520, 270)], [(520, 270), (548, 286)], [(150, 258), (215, 250)], [(215, 250), (178, 228)]], (104, 252))
    c += f'<circle cx="174" cy="224" r="11" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
    c += txt(205, 205, "punhos e cotovelos fletidos", 14, ANORMAL)
    d["postura-decorticacao"] = svg(c, 600, 340)
    c = titulo("Postura de descerebração", "braços estendidos e rodados para dentro, pernas estendidas, pés em flexão plantar")
    c += chao + boneco([tronco, [(300, 266), (520, 270)], [(520, 270), (548, 286)], [(150, 258), (240, 268)], [(240, 268), (318, 276)]], (100, 256))
    c += f'<circle cx="324" cy="278" r="11" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
    c += txt(230, 316, "braços estendidos junto ao corpo", 14, ANORMAL)
    d["postura-descerebracao"] = svg(c, 600, 340)
    c = titulo("Opistótono", "corpo arqueado, apoiado na nuca e nos calcanhares")
    c += chao + f'<path d="M128,272 Q300,96 452,250" fill="none" stroke="{TINTA}" stroke-width="15" stroke-linecap="round"/>'
    c += linha([(452, 250), (512, 282)], TINTA, 13)
    c += f'<circle cx="106" cy="270" r="25" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
    d["postura-opistotono"] = svg(c, 600, 340)
    return d


# tórax em corte

def corte_torax(tipo):
    pts = []
    for i in range(181):
        a = 2 * math.pi * i / 180
        rx, ry = (140, 82) if tipo in ("normal", "excavatum", "carinatum") else (122, 112)
        x, y = 300 + rx * math.cos(a), 230 - ry * math.sin(a)
        frente = math.sin(a) > 0 and abs(math.cos(a)) < 0.45
        if frente and tipo == "excavatum":
            y += 46 * (1 - (math.cos(a) / 0.45) ** 2) ** 2
        if frente and tipo == "carinatum":
            y -= 40 * (1 - abs(math.cos(a)) / 0.45) ** 1.6
        pts.append((x, y))
    return pts


def toraces():
    d = {}
    for tipo, tit, sub in (("normal", "Tórax normal em corte", "diâmetro lateral maior que o anteroposterior"),
                           ("tonel", "Tórax em tonel", "diâmetro anteroposterior quase igual ao lateral"),
                           ("excavatum", "Pectus excavatum", "esterno afundado"),
                           ("carinatum", "Pectus carinatum", "esterno projetado para a frente")):
        c = titulo(tit, sub + " · visto de cima, frente para cima")
        if tipo != "normal":
            c += poli(corte_torax("normal"), CINZA, "none", 2, 'stroke-dasharray="7 6"')
        c += poli(corte_torax(tipo), NORMAL if tipo == "normal" else ANORMAL, NORMAL_C if tipo == "normal" else ANORMAL_C, 3)
        c += f'<circle cx="300" cy="{230 + (82 if tipo != "tonel" else 112) - 22}" r="14" fill="#fff" stroke="{TINTA}" stroke-width="2.5"/>'
        c += txt(300, 120 if tipo != "carinatum" else 104, "frente (esterno)", 14, TINTA, "middle") + txt(300, 372, "coluna", 14, TINTA, "middle")
        if tipo != "normal":
            c += txt(470, 380, "tracejado: normal", 13, CINZA, "middle")
        d["torax-" + tipo] = svg(c)
    return d


# precórdio

def precordio(marcas):
    c = '<g transform="translate(0,34)">'
    c += '<path d="M150,70 Q300,40 450,70 L470,390 L130,390 Z" fill="#fbf6f1" stroke="#c9b9ab" stroke-width="2"/>'
    c += f'<rect x="285" y="78" width="30" height="262" rx="8" fill="#efe6dc" stroke="#c9b9ab" stroke-width="2"/>'
    c += f'<path d="M298,82 Q240,70 175,84" fill="none" stroke="#c9b9ab" stroke-width="7" stroke-linecap="round"/><path d="M302,82 Q360,70 425,84" fill="none" stroke="#c9b9ab" stroke-width="7" stroke-linecap="round"/>'

    def costela(k, lado):
        y = 80 + 40 * k
        x0 = 300 + lado * 15
        return (x0, y), (x0 + lado * 85, y + 6), (x0 + lado * 170, y + 36)

    def ponto(k, frac, lado):
        """meio do espaço intercostal k (entre costelas k e k+1), a uma fração do caminho para fora."""
        def q(p0, p1, p2, t):
            return ((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
        a, b = q(*costela(k, lado), frac), q(*costela(k + 1, lado), frac)
        return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)

    for k in range(1, 7):
        for lado in (-1, 1):
            p0, p1, p2 = costela(k, lado)
            c += f'<path d="M{p0[0]},{p0[1]} Q{p1[0]},{p1[1]} {p2[0]},{p2[1]}" fill="none" stroke="#d8cabd" stroke-width="5" stroke-linecap="round"/>'
    for k in range(2, 6):
        x, y = ponto(k, 0.06, 1)
        c += txt(x + 6, y + 5, f"{k}º", 12, CINZA)
    c += f'<line x1="400" y1="90" x2="400" y2="385" stroke="{CINZA}" stroke-width="2" stroke-dasharray="6 6"/>' + txt(404, 384, "linha hemiclavicular", 12, CINZA)
    c += txt(150, 384, "direita do paciente", 12, CINZA)
    for k, frac, lado, cor, r, rot, dx in marcas:
        x, y = ponto(k, frac, lado)
        c += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{cor}" fill-opacity=".85" stroke="#fff" stroke-width="2"/>'
        if rot:
            c += txt(x + dx, y + 5, rot, 13, cor, "start" if dx > 0 else "end", 600)
    return c + "</g>"


def precordios():
    d = {}
    d["focos-ausculta"] = svg(titulo("Focos de ausculta") + precordio([
        (2, 0.12, -1, NORMAL, 10, "aórtico", -16), (2, 0.12, 1, NORMAL, 10, "pulmonar", 16), (3, 0.12, 1, NORMAL, 10, "aórtico acessório", 16),
        (4, 0.04, 1, NORMAL, 10, "tricúspide", 16), (5, 0.5, 1, NORMAL, 10, "mitral", 16)]), 600, 434)
    d["ictus-normal"] = svg(titulo("Ictus cordis normal", "5º espaço intercostal esquerdo, na linha hemiclavicular") + precordio([
        (5, 0.5, 1, NORMAL, 13, "1 a 2 polpas", 18)]), 600, 434)
    d["ictus-desviado"] = svg(titulo("Ictus desviado e difuso", "para baixo e para fora: ventrículo esquerdo dilatado") + precordio([
        (5, 0.5, 1, CINZA, 10, "", 0), (6, 0.88, 1, ANORMAL, 22, "", 0)]) + txt(436, 372, "6º EIC, linha", 13, ANORMAL, "end", 600) + txt(436, 389, "axilar anterior", 13, ANORMAL, "end", 600), 600, 434)
    return d


# abdome

def abdome(extra, tit, sub):
    c = titulo(tit, sub)
    c += '<path d="M170,80 Q300,62 430,80 Q448,220 420,330 Q300,372 180,330 Q152,220 170,80 Z" fill="#fbf6f1" stroke="#c9b9ab" stroke-width="2.5"/>'
    c += '<path d="M200,100 L300,92 L400,100" fill="none" stroke="#c9b9ab" stroke-width="3"/><path d="M300,92 L230,150 M300,92 L370,150" stroke="#c9b9ab" stroke-width="3"/>'
    c += '<path d="M205,300 Q250,330 300,352 Q350,330 395,300" fill="none" stroke="#c9b9ab" stroke-width="2.5"/>'
    c += '<circle cx="205" cy="300" r="5" fill="#c9b9ab"/><circle cx="395" cy="300" r="5" fill="#c9b9ab"/>'
    c += '<circle cx="300" cy="215" r="7" fill="#e3cdb9" stroke="#a88a72" stroke-width="2"/>'
    return svg(c + extra)


def abdomes():
    d = {}
    mc = (205 + (300 - 205) / 3, 300 - (300 - 215) / 3)
    d["abd-mcburney"] = abdome(
        f'<line x1="205" y1="300" x2="300" y2="215" stroke="{CINZA}" stroke-width="2" stroke-dasharray="6 5"/>'
        f'<circle cx="{mc[0]:.1f}" cy="{mc[1]:.1f}" r="11" fill="{ANORMAL}" stroke="#fff" stroke-width="2"/>'
        + txt(196, 318, "espinha ilíaca", 12, CINZA, "end") + txt(196, 333, "anterossuperior", 12, CINZA, "end") + txt(312, 210, "umbigo", 12, CINZA)
        + txt(150, 262, "ponto doloroso", 14, ANORMAL, "end", 600),
        "Ponto de McBurney", "a 1/3 da distância da espinha ilíaca ao umbigo, à direita do paciente")
    veias = ""
    for ang in range(0, 360, 40):
        a = math.radians(ang + 10)
        pts = []
        for r in range(14, 120, 4):
            w = 6 * math.sin(r / 9)
            pts.append((300 + r * math.cos(a) - w * math.sin(a), 215 + r * 0.85 * math.sin(a) + w * math.cos(a)))
        veias += linha(pts, "#4a6fb5", 4)
    d["abd-medusa"] = abdome(veias, "Cabeça de medusa", "veias que saem do umbigo: hipertensão portal")
    manchas = ('<ellipse cx="300" cy="217" rx="30" ry="22" fill="#7d4f8f" opacity=".55"/>'
               '<path d="M165,180 Q150,240 178,300 Q196,250 186,180 Z" fill="#6f7d3c" opacity=".5"/><path d="M435,180 Q450,240 422,300 Q404,250 414,180 Z" fill="#6f7d3c" opacity=".5"/>'
               + txt(300, 262, "ao redor do umbigo", 14, "#7d4f8f", "middle", 600) + txt(140, 240, "flancos", 14, "#5d6a2f", "end", 600))
    d["abd-cullen"] = abdome(manchas, "Sinais de Cullen e de Grey Turner", "equimose ao redor do umbigo e nos flancos")
    return d


# mãos

def dedo_segmentos(x, y, angs, comps=(78, 52, 36), cor=TINTA):
    pts = [(x, y)]
    a = 0
    for ang, comp in zip(angs, comps):
        a += math.radians(ang)
        x, y = x + comp * math.cos(a), y + comp * math.sin(a)
        pts.append((x, y))
    s = linha(pts, PELE_T, 24) + linha(pts, PELE, 18)
    for p in pts[1:-1]:
        s += f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="5" fill="{cor}"/>'
    return s, pts


def maos():
    d = {}
    c = titulo("Deformidades dos dedos na artrite reumatoide", "dedo de perfil, dorso para cima, ponta à direita")
    for y, angs, rot, det, cor in ((140, (0, 0, 0), "Normal", "", NORMAL), (245, (0, -28, 58), "Pescoço de cisne", "IFP estendida, IFD fletida", ANORMAL),
                                   (350, (0, 62, -40), "Botoeira", "IFP fletida, IFD estendida", ANORMAL)):
        s, pts = dedo_segmentos(120, y, angs)
        c += s + txt(360, y, rot, 15, cor, peso=600) + (txt(360, y + 20, det, 13, CINZA) if det else "")
    d["dedos-ar"] = svg(c, 600, 420)

    def mao(desvio=0, nos=False):
        s = '<rect x="190" y="230" width="150" height="130" rx="30" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
        s += '<path d="M196,320 L130,250 Q118,232 136,226 L206,270 Z" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
        for i, (xb, comp) in enumerate(((205, 125), (243, 140), (281, 130), (316, 100))):
            larg = 30 if i < 3 else 26
            g = f'<g transform="rotate({desvio},{xb + larg / 2},{238})"><rect x="{xb}" y="{238 - comp}" width="{larg}" height="{comp + 16}" rx="13" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
            for frac, cor in ((0.45, "#e0a24d"), (0.75, ANORMAL)):
                y = 238 - comp * frac
                g += f'<line x1="{xb + 6}" y1="{y}" x2="{xb + larg - 6}" y2="{y}" stroke="#d5b9a3" stroke-width="2"/>'
                if nos:
                    g += f'<circle cx="{xb + 4}" cy="{y}" r="6" fill="{cor}"/><circle cx="{xb + larg - 4}" cy="{y}" r="6" fill="{cor}"/>'
            s += g + "</g>"
        return s
    c = titulo("Nódulos de Heberden e de Bouchard", "mão direita pelo dorso")
    c += mao(nos=True) + f'<circle cx="372" cy="150" r="7" fill="{ANORMAL}"/>' + txt(386, 155, "Heberden:", 14, ANORMAL, peso=600) + txt(386, 174, "interfalângicas distais", 13)
    c += f'<circle cx="372" cy="214" r="7" fill="#e0a24d"/>' + txt(386, 219, "Bouchard:", 14, "#b07a22", peso=600) + txt(386, 238, "interfalângicas proximais", 13)
    d["mao-heberden"] = svg(c, 600, 400)
    c = titulo("Desvio ulnar dos dedos", "mão direita pelo dorso: dedos tombam para o lado do dedo mínimo") + mao(desvio=22)
    d["mao-desvio-ulnar"] = svg(c, 600, 400)
    return d


# membros e manobras

def manobras():
    d = {}
    def figura(cx, inclina, rot, cor):
        s = f'<circle cx="{cx}" cy="80" r="22" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
        s += linha([(cx, 104), (cx, 210)], TINTA, 14)
        dy = 50 * math.tan(math.radians(inclina))
        s += linha([(cx - 50, 210 + dy), (cx + 50, 210 - dy)], cor, 10)  # pelve
        s += linha([(cx + 44, 210 - dy), (cx + 44, 360)], TINTA, 13)  # perna de apoio (direita do paciente, vista por trás)
        s += linha([(cx - 44, 210 + dy), (cx - 44, 290 + dy), (cx - 44, 330 + dy - 60)], TINTA, 13)  # perna levantada, joelho fletido
        s += f'<line x1="{cx - 80}" y1="362" x2="{cx + 80}" y2="362" stroke="{CLARO}" stroke-width="5"/>'
        s += txt(cx, 392, rot, 14, cor, "middle", 600)
        return s
    c = titulo("Sinal de Trendelenburg", "visto por trás; apoio na perna direita, a esquerda levantada")
    c += '<g transform="translate(0,22)">' + figura(170, 0, "normal: pelve nivelada", NORMAL) + figura(430, 12, "positivo: pelve cai do lado levantado", ANORMAL) + "</g>"
    d["trendelenburg"] = svg(c, 600, 430)

    c = titulo("Sinal de Lasègue", "perna estendida elevada: dor abaixo do joelho entre 30° e 70°")
    chao = 340
    c += f'<line x1="30" y1="{chao}" x2="580" y2="{chao}" stroke="{CLARO}" stroke-width="6"/>'
    c += f'<circle cx="60" cy="{chao - 26}" r="24" fill="{PELE}" stroke="{TINTA}" stroke-width="3"/>'
    hx, hy = 250, chao - 22
    c += linha([(84, chao - 20), (hx, hy)], TINTA, 15) + linha([(hx, hy), (470, hy + 2)], TINTA, 13) + linha([(470, hy + 2), (482, hy - 14)], TINTA, 9)
    a1, a2, a = math.radians(30), math.radians(70), math.radians(50)
    c += (f'<path d="M{hx},{hy} L{hx + 200 * math.cos(a1):.1f},{hy - 200 * math.sin(a1):.1f} A200,200 0 0,0 {hx + 200 * math.cos(a2):.1f},{hy - 200 * math.sin(a2):.1f} Z" '
          f'fill="{ANORMAL_C}" opacity=".7"/>')
    for ang in (30, 70):
        b = math.radians(ang)
        c += txt(hx + 214 * math.cos(b), hy - 214 * math.sin(b) + 5, f"{ang}°", 14, ANORMAL, "middle", 600)
    fx, fy = hx + 210 * math.cos(a), hy - 210 * math.sin(a)
    c += linha([(hx, hy), (fx, fy)], TINTA, 13) + linha([(fx, fy), (fx + 20, fy + 4)], TINTA, 10)
    nx, ny = math.sin(a), math.cos(a)  # lado de trás da perna
    onda = [(hx + t * math.cos(a) + (14 + 5 * math.sin(t / 7)) * nx, hy - t * math.sin(a) + (14 + 5 * math.sin(t / 7)) * ny) for t in range(20, 160, 2)]
    c += linha(onda, ANORMAL, 3) + txt(hx + 120 * math.cos(a) + 40, hy - 120 * math.sin(a) + 50, "dor que desce", 14, ANORMAL, peso=600)
    c += txt(hx + 120 * math.cos(a) + 40, hy - 120 * math.sin(a) + 68, "pela face posterior", 14, ANORMAL, peso=600)
    d["lasegue"] = svg(c, 600, 370)

    c = titulo("Edema com cacifo (sinal de Godet)", "a pressão do dedo deixa uma depressão que demora a sumir")
    for ox, depois in ((40, False), (320, True)):
        c += f'<rect x="{ox}" y="300" width="240" height="50" rx="8" fill="#e8e3d8" stroke="#bdb39f" stroke-width="2"/>' + txt(ox + 120, 330, "osso", 13, CINZA, "middle")
        topo = f"M{ox},160 L{ox + 85},160 Q{ox + 120},{215} {ox + 155},160 L{ox + 240},160 L{ox + 240},300 L{ox},300 Z"
        c += f'<path d="{topo}" fill="#dbeaf3" stroke="#8fb3c9" stroke-width="2"/>'
        c += "".join(f'<circle cx="{ox + 20 + (i * 37) % 210}" cy="{190 + (i * 23) % 95}" r="4" fill="#8fb3c9"/>' for i in range(18))
        c += f'<path d="M{ox},160 L{ox + 85},160 Q{ox + 120},215 {ox + 155},160 L{ox + 240},160" fill="none" stroke="{PELE_T}" stroke-width="6"/>'
        if not depois:
            c += f'<rect x="{ox + 100}" y="80" width="40" height="125" rx="18" fill="{PELE}" stroke="{PELE_T}" stroke-width="2.5"/>' + txt(ox + 120, 380, "pressão por 5 a 10 s", 14, TINTA, "middle")
        else:
            c += f'<path d="M{ox + 100},120 L{ox + 120},140 L{ox + 140},120" fill="none" stroke="{ANORMAL}" stroke-width="3"/>' + txt(ox + 120, 380, "a depressão fica: cacifo", 14, ANORMAL, "middle", 600)
    d["edema-cacifo"] = svg(c)

    c = titulo("Sinal de Babinski", "estímulo na borda lateral da planta; resposta do hálux")
    c += '<path d="M90,360 Q60,250 80,170 Q95,110 150,100 Q205,110 210,180 Q215,260 175,360 Q130,390 90,360 Z" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
    for x, y, r in ((185, 92, 17), (157, 80, 11), (136, 82, 10), (117, 88, 9), (101, 99, 8)):
        c += f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
    c += f'<path d="M110,345 Q78,260 96,190 Q110,140 172,128" fill="none" stroke="{ANORMAL}" stroke-width="4" marker-end="url(#sb)"/>'
    c += '<defs><marker id="sb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b2442a"/></marker></defs>'
    c += txt(150, 392, "pé direito pela planta", 13, CINZA, "middle")

    def pe(ox, hallux_ang, cor, rot, leque=False):
        s = f'<path d="M{ox},300 L{ox + 150},300 Q{ox + 175},296 {ox + 182},284 L{ox + 70},230 Q{ox + 20},226 {ox},250 Z" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
        a = math.radians(hallux_ang)
        s += linha([(ox + 182, 284), (ox + 182 + 34 * math.cos(a), 284 - 34 * math.sin(a))], cor, 12)
        if leque:
            for dang in (14, 28):
                b = math.radians(hallux_ang - 50 + dang)
                s += linha([(ox + 176, 290), (ox + 176 + 22 * math.cos(b), 290 - 22 * math.sin(b))], cor, 7)
        return s + txt(ox + 95, 330, rot, 14, cor, "middle", 600)
    c += pe(250, -30, NORMAL, "normal: dedos fletem")
    return d, c


def babinski(c_base):
    c = c_base
    # resposta anormal desenhada acima da normal
    ox, oy = 250, -140
    s = f'<g transform="translate(0,{oy})">'
    s += f'<path d="M{ox},300 L{ox + 150},300 Q{ox + 175},296 {ox + 182},284 L{ox + 70},230 Q{ox + 20},226 {ox},250 Z" fill="#fbe9dc" stroke="#c9a68a" stroke-width="2.5"/>'
    a = math.radians(58)
    s += linha([(ox + 182, 284), (ox + 182 + 36 * math.cos(a), 284 - 36 * math.sin(a))], ANORMAL, 12)
    for b in (8, -14):
        bb = math.radians(b)
        s += linha([(ox + 172, 292), (ox + 172 + 26 * math.cos(bb), 292 - 26 * math.sin(bb))], ANORMAL, 7)
    s += txt(ox + 95, 330, "alterado: hálux estende, dedos abrem", 14, ANORMAL, "middle", 600) + "</g>"
    return svg(c + s)


# obstetrícia

def utero(cont, tit, sub):
    c = titulo(tit, sub)
    c += '<path d="M300,370 Q215,365 190,280 Q165,170 215,110 Q300,60 385,110 Q435,170 410,280 Q385,365 300,370 Z" fill="#f7e3df" stroke="#c78f86" stroke-width="3"/>'
    c += '<rect x="282" y="362" width="36" height="24" rx="8" fill="#e8c7c1" stroke="#c78f86" stroke-width="2"/>' + txt(330, 382, "colo", 13, CINZA)
    return svg(c + cont, 600, 400)


def feto(cx, cy, ang):
    a = math.radians(ang)
    hx, hy = cx + 70 * math.cos(a), cy + 70 * math.sin(a)
    s = f'<ellipse cx="{cx}" cy="{cy}" rx="62" ry="44" transform="rotate({ang},{cx},{cy})" fill="#fbe9dc" stroke="#b98f75" stroke-width="2.5"/>'
    s += f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="38" fill="#fbe9dc" stroke="#b98f75" stroke-width="2.5"/>'
    return s


def obstetricia():
    d = {}
    d["feto-cefalico"] = utero(feto(300, 175, 90), "Situação longitudinal, apresentação cefálica", "cabeça para baixo, junto à pelve")
    d["feto-pelvico"] = utero(feto(300, 250, -90), "Apresentação pélvica", "cabeça no fundo do útero, nádegas na pelve")
    d["feto-transverso"] = utero(feto(285, 220, 0), "Situação transversa", "feto atravessado; não há polo na pelve")
    c = titulo("Altura uterina pela idade gestacional", "em cm, da sínfise ao fundo ≈ semanas, entre cerca de 20 e 34")
    c += '<path d="M200,384 Q160,250 196,128 Q300,58 404,128 Q440,250 400,384 Z" fill="#fbf6f1" stroke="#c9b9ab" stroke-width="2.5"/>'
    for y, rot in ((366, "sínfise"), (236, "umbigo"), (100, "xifoide")):
        c += f'<circle cx="300" cy="{y}" r="5" fill="#a88a72"/>' + txt(310, y - 6, rot, 12, CINZA)
    for sem, y, larg in ((12, 350, 34), (16, 300, 60), (20, 236, 82), (24, 206, 88), (28, 176, 90), (32, 146, 86), (36, 112, 72)):
        c += f'<path d="M{300 - larg},{y + 16} Q300,{y - 14} {300 + larg},{y + 16}" fill="none" stroke="{NORMAL}" stroke-width="2.5"/>'
        c += f'<line x1="{300 + larg}" y1="{y + 16}" x2="452" y2="{y + 6}" stroke="{CLARO}" stroke-width="1.5"/>' + txt(458, y + 11, f"{sem} sem", 14, NORMAL, peso=600)
    c += txt(24, 380, "Com 40 semanas o fundo", 13, CINZA) + txt(24, 396, "desce um pouco (insinuação).", 13, CINZA)
    d["altura-uterina"] = svg(c, 600, 406)
    return d


# pediatria

def pediatria():
    d = {}
    c = titulo("Fontanelas e suturas do lactente", "crânio visto de cima, testa para cima")
    c += '<ellipse cx="300" cy="225" rx="128" ry="160" fill="#fbe9dc" stroke="#c9a68a" stroke-width="3"/>'
    sut = 'fill="none" stroke="#b98f75" stroke-width="3"'
    c += f'<path d="M300,68 L300,120" {sut}/><path d="M178,150 Q240,128 282,140 M318,140 Q360,128 422,150" {sut}/>'
    c += f'<path d="M300,168 L300,330" {sut}/><path d="M290,340 Q240,330 205,300 M310,340 Q360,330 395,300" {sut}/>'
    c += f'<path d="M300,118 L322,144 L300,170 L278,144 Z" fill="#f4d7c4" stroke="{NORMAL}" stroke-width="3"/>'
    c += f'<path d="M300,328 L314,346 L286,346 Z" fill="#f4d7c4" stroke="{NORMAL}" stroke-width="3"/>'
    c += txt(336, 146, "anterior: fecha entre 12 e 18 meses", 13, NORMAL, peso=600) + txt(326, 352, "posterior: até 2 meses", 13, NORMAL, peso=600)
    c += txt(166, 140, "coronal", 12, CINZA, "end") + txt(312, 250, "sagital", 12, CINZA) + txt(196, 316, "lambdoide", 12, CINZA, "end") + txt(312, 96, "metópica", 12, CINZA)
    d["fontanelas"] = svg(c, 600, 400)

    zonas = {1: "#fbe9a0", 2: "#f6d96a", 3: "#efc33c", 4: "#e2a91a", 5: "#c98c00"}
    c = titulo("Zonas de Kramer", "a icterícia do recém-nascido avança da cabeça para os pés")
    partes = [
        (1, '<circle cx="190" cy="105" r="46"/><rect x="176" y="146" width="28" height="16"/>'),
        (2, '<path d="M140,160 Q190,150 240,160 L238,230 L142,230 Z"/>'),
        (3, '<path d="M142,230 L238,230 L236,292 Q190,304 144,292 Z"/><path d="M146,290 L188,298 L184,350 L156,350 Z"/><path d="M192,298 L234,290 L224,350 L196,350 Z"/>'),
        (4, '<path d="M142,164 L124,170 L104,262 L120,266 Z"/><path d="M238,164 L256,170 L276,262 L260,266 Z"/><path d="M156,350 L184,350 L180,400 L162,400 Z"/><path d="M196,350 L224,350 L218,400 L200,400 Z"/>'),
        (5, '<ellipse cx="110" cy="278" rx="11" ry="15"/><ellipse cx="270" cy="278" rx="11" ry="15"/><ellipse cx="168" cy="408" rx="16" ry="7"/><ellipse cx="212" cy="408" rx="16" ry="7"/>'),
    ]
    c += '<g transform="translate(0,24)">'
    for z, forma in partes:
        c += f'<g fill="{zonas[z]}" stroke="#a87f2c" stroke-width="2">{forma}</g>'
    for z, (x, y) in {1: (190, 112), 2: (190, 200), 3: (190, 268), 4: (114, 220), 5: (110, 284)}.items():
        c += txt(x, y, str(z), 18, TINTA, "middle", 700)
    c += "</g>"
    leg = ((1, "cabeça e pescoço", "≈ 6"), (2, "tronco até o umbigo", "≈ 9"), (3, "abaixo do umbigo, coxas", "≈ 12"),
           (4, "braços e pernas", "≈ 15"), (5, "mãos e pés", "> 15"))
    for i, (z, onde, val) in enumerate(leg):
        y = 140 + 40 * i
        c += f'<rect x="330" y="{y - 16}" width="24" height="22" rx="4" fill="{zonas[z]}" stroke="#a87f2c" stroke-width="1.5"/>' + txt(342, y, str(z), 13, TINTA, "middle", 700)
        c += txt(364, y, onde, 14) + txt(580, y, val, 14, TINTA, "end", 600)
    c += txt(580, 120, "mg/dL", 12, CINZA, "end") + txt(330, 360, "Estimativa grosseira; confirme com", 13, CINZA) + txt(330, 377, "bilirrubina sérica ou transcutânea.", 13, CINZA)
    d["kramer"] = svg(c, 600, 450)
    return d


def mais_desenhos():
    d = {}
    d["unha-baqueteamento"] = unha_baqueteamento()
    d["unha-schamroth"] = schamroth()
    d["unha-coiloniquia"] = unha_coiloniquia()
    d.update(unhas())
    d.update(olhos_todos())
    d["campo-hemianopsia"] = hemianopsia()
    d.update(faces())
    d.update(sensibilidade())
    d.update(posturas())
    d.update(toraces())
    d.update(precordios())
    d.update(abdomes())
    d.update(maos())
    m, base_babinski = manobras()
    d.update(m)
    d["babinski"] = babinski(base_babinski)
    d.update(obstetricia())
    d.update(pediatria())
    return d


if __name__ == "__main__":
    PASTA.mkdir(parents=True, exist_ok=True)
    feitos = todos()
    feitos.update(mais_desenhos())
    for nome, conteudo in feitos.items():
        (PASTA / f"{nome}.svg").write_text(conteudo, encoding="utf-8")
    print(f"{len(feitos)} ilustrações em {PASTA}")
