# Exame físico (app Android)

Um caderno de semiologia no celular, em que tudo é editável. Funciona sem internet
e não pede permissão nenhuma: o que você escreve fica só no aparelho.

O arquivo para instalar é **`Exame-fisico.apk`**, nesta pasta.

## Como o conteúdo é organizado

```
Área                      Exame geral
└─ Tópico (quantos níveis quiser)   Ectoscopia › Fácies
   └─ Achado esperado ou anormal    Fácies hipocrática
      └─ Motivo                     Desnutrição grave
         └─ Nota: como leva ao achado
```

Cada área e tópico tem uma nota de **como examinar**; cada achado, uma nota de
**como reconhecer** e uma galeria de **imagens**; cada motivo, uma nota de **como
leva ao achado**.

O app já vem com 14 áreas, 90 tópicos, 569 achados e 835 motivos: exame geral,
sinais vitais, pele e anexos, cabeça e pescoço (com fundo de olho, ouvidos, nariz
e pescoço), respiratório, cardiovascular, vascular periférico (com pé diabético),
abdome, neurológico, exame psíquico, osteoarticular (ombro, mão, quadril, joelho,
pé, músculos), mamas/geniturinário/anorretal (com genitália feminina), exame
obstétrico e exame pediátrico e do recém-nascido. É um ponto de partida para
estudo: confira com as suas referências e ajuste como quiser.

Vêm também 74 **ilustrações esquemáticas** ligadas a 77 achados: curvas de pulso,
de respiração e do pulso jugular; linhas do tempo de bulhas e sopros; unhas
(baqueteamento, Schamroth, coiloníquia, Terry, Beau); pupilas e paralisias do III
e do VI nervo; paralisia facial central e periférica; mapas de sensibilidade;
posturas; tórax em corte; focos de ausculta e ictus; pontos e sinais do abdome;
mãos na artrite; Trendelenburg, Lasègue, Babinski, cacifo; altura uterina e
situações fetais; fontanelas e zonas de Kramer. São desenhos feitos para o app
(domínio público), não fotos de pacientes: fácies e lesões de pele ficam para as
fotos que você acrescentar.

Alguns tópicos são de **escolha única** (estado geral, hidratação, estado
nutricional, biotipo): no exame, marcar um achado desmarca os outros. Dá para
ligar ou desligar isso em qualquer tópico, no lápis.

## Usar

- **Imagens**: em qualquer achado, toque em **Foto** para tirar uma foto, escolher
  uma da galeria ou procurar no Wikimedia Commons ou no Google Imagens (abre o
  navegador; salve a imagem e volte em "Escolher da galeria"). A foto é reduzida
  e guardada só no aparelho. Toque numa imagem para vê-la em tela cheia: deslize
  para passar, toque duas vezes para ampliar, edite a legenda ou apague. A primeira
  imagem aparece em miniatura nas listas e no exame. Ao fotografar pacientes, peça
  consentimento e evite rosto e dados que identifiquem.

- **Roteiro**: navegue pelas áreas. Em qualquer nível há **+ Tópico** e
  **+ Achado**; dentro do achado, **+ Motivo**. O lápis edita, reordena (setas)
  e apaga; apagar pode ser desfeito logo em seguida.
- **Motivos repetidos se ligam sozinhos**: ao digitar um motivo, o app sugere os
  que já existem. Motivos com o mesmo nome aparecem juntos na aba **Motivos**,
  que mostra todos os achados que cada um explica, com a nota de cada caminho.
  No achado, "Também explica N outros achados" leva até lá.
- **Exames**: abra um exame (use iniciais ou o leito), marque o que encontrou
  em cada área, escreva observações. "Marcar o esperado no que falta" preenche
  o normal dos tópicos em branco. O **Resumo** monta o texto do exame, lista os
  anormais com seus motivos (toque no provável e ele entra no texto) e mostra
  **motivos que se repetem** entre os achados. Copie, compartilhe ou salve em TXT.
- **Revisão**: por **motivos** (um achado anormal por vez; tente lembrar os
  motivos antes de abrir) ou por **imagens** (reconheça o achado pela imagem).
- **Buscar** (lupa): tópicos, achados e motivos.
- **Menu (⋮)**: créditos das imagens; salvar cópia de segurança (um `.json` com
  roteiro, exames e as suas fotos),
  restaurar de uma cópia (também por "abrir com" no gerenciador de arquivos) e
  repor o conteúdo inicial.

## Instalar

1. Baixe `Exame-fisico.apk` no celular.
2. Toque no arquivo e permita a instalação de apps vindos do navegador ou do
   gerenciador de arquivos.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim.

Serve em Android 5.0 ou mais novo. Versões futuras instalam por cima e mantêm o
que você escreveu.

### O que acontece ao atualizar

Quem já tem o roteiro no aparelho recebe só o conteúdo novo, junto pelo nome ao
que já existe, e vê um aviso com quantos itens entraram:

- o que você editou (nomes, notas, ordem) fica como está;
- o que você criou fica;
- o que você apagou de uma versão anterior não volta;
- tópicos novos entram na posição em que aparecem no conteúdo do app;
- se você renomeou uma área ou um tópico, o conteúdo novo daquele trecho não
  encontra onde entrar e fica de fora (use "Repor o conteúdo inicial", depois de
  salvar uma cópia, se quiser tudo).

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

| Caminho | O que é |
| --- | --- |
| `web/dados.js` | O conteúdo da versão 1 e as funções que montam o conteúdo |
| `web/conteudo/*.js` | O que entrou depois, por região do corpo, com a versão em que entrou |
| `conferir.js` | Confere o conteúdo antes de montar (caminhos, nomes repetidos, motivos sem nota, imagens) |
| `web/fotos/` | Imagens que vêm com o app; `desenhos.py` gera as ilustrações (SVG) |
| `src/.../SaidaCamera.java` | Endereço onde o app de câmera grava a foto, sem o app pedir permissão |
| `web/app.js`, `web/estilo.css` | As telas |
| `montar.py` | Junta `web/` num único `index.html`, com as fontes embutidas |
| `src/` | A atividade Android: um WebView e a ponte para arquivos e compartilhamento |
| `res/`, `AndroidManifest.xml` | Ícone, tema e declaração do app |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `chave-de-teste.jks` | Chave de assinatura, senha `android` |

A chave fica no repositório de propósito: assinar sempre com a mesma é o que
deixa a versão nova instalar por cima. Para uma versão nova, aumente `NOME` e
`CODIGO` em `montar.sh`.

Para acrescentar imagens que venham com o app (fotos de bancos livres, por
exemplo), ponha o arquivo em `web/fotos/` e ligue-o ao achado com
`S.fotos(versão)("Área › Tópico", "Achado", [S.F("fotos/arquivo.jpg", legenda,
"Autor · licença", "https://página de origem")])`. Use só imagens com licença que
permita redistribuir (domínio público, CC0, CC BY, CC BY-SA) e registre autor,
licença e origem: aparecem no visor e em "Créditos das imagens".

Para acrescentar conteúdo numa versão futura, crie um arquivo em `web/conteudo/`
com `S.mais(3)("Área › Tópico", [itens], "tópico antes do qual entrar")` (3 é a
versão do conteúdo; use sempre um número maior que o anterior). Não altere nem
renomeie o que já foi publicado: a ligação com o roteiro de quem já instalou é
feita pelo nome.

## O que foi e o que não foi testado

A página foi testada em navegador com tamanho de celular (390 e 320 px, claro e
escuro): navegação, criar/editar/apagar/desfazer, motivos ligados pelo nome,
exame com resumo, escolha única, revisão, busca, e a ponte com o Android
simulada (salvar, cópia de segurança, restauração, arquivo inválido). A
atualização foi testada partindo de um roteiro da versão 1 com edições,
apagamentos, área renomeada e área própria, e partindo da versão 1.1. As fotos
foram testadas no navegador (escolher, reduzir, legenda, apagar, cópia de
segurança e restauração); a câmera, a galeria e a leitura do EXIF do Android
só foram compiladas, não executadas. O APK foi conferido por
dentro (manifesto, assinatura, conteúdo). Ele **não foi executado em aparelho
nem em emulador** no ambiente em que foi montado.
