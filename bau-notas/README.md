# Baú

Notas médicas organizadas em árvores, para tablet Android. Funciona 100% offline:
não tem conta, servidor nem nuvem, e o app **não declara nenhuma permissão**
(nem a de internet). Tudo fica só no aparelho.

O arquivo para instalar é **`Bau.apk`**, nesta pasta.

> Situação: **versão 0.7.0**. Etapas 1 e 2 de 5: árvore visual, tópicos, busca,
> tema, e o editor completo com sumário, modo foco e estabilidade da escrita.
> Os links entre notas (etapa 3), o filtro por tipo na árvore (etapa 4) e o
> backup (etapa 5) vêm a seguir.

## Instalar no tablet

1. Baixe `Bau.apk` no tablet (Android 10 ou mais novo).
2. Toque no arquivo. O Android pede para permitir a instalação de apps vindos do
   navegador ou do gerenciador de arquivos ("fontes desconhecidas"): permita e volte.
3. Se o Play Protect disser que não conhece o app, escolha "Instalar mesmo assim".
   O aviso aparece porque o app não veio da loja.

As versões seguintes instalam por cima e mantêm as notas, desde que sejam
assinadas com a mesma chave (veja "Chave de assinatura").

## O que já funciona (etapa 1)

- Ao abrir, a árvore inteira aparece enquadrada na tela.
- Árvore da esquerda para a direita, com o rótulo do ramo escrito sobre a linha.
- Cada nó mostra título, ícone e cor do tipo. Com o zoom reduzido, os títulos
  passam a ser desenhados em tamanho constante e legível.
- Pinça para zoom, um dedo para arrastar, toque duplo no fundo para "Ver tudo";
  botões fixos de "Ver tudo", zoom + e −; minimapa quando parte da árvore sai da tela.
- Tocar num nó seleciona, destaca o caminho desde a raiz e mostra "+ Filho" e
  "+ Irmão". O nó novo entra com o título em edição e sugere notas que já existem.
- Toque longo: renomear, mudar o tipo, rótulo do ramo, recolher/expandir, mover, excluir.
  Sem soltar, arrastar o nó troca-o de pai. Excluir pede confirmação e pode ser desfeito.
- Paisagem: árvore à esquerda e nota à direita, com divisória ajustável e tela cheia.
  Retrato: "Abrir" (ou toque duplo) abre a nota por cima da árvore.
- O voltar do Android fecha um nível por vez e pede um segundo toque para sair.
- Menu lateral com todas as árvores; visão em lista recuada sincronizada.
- Teclado físico: Tab cria filho, Enter cria irmão, F2 renomeia, setas navegam,
  Espaço recolhe, Delete exclui, Ctrl+Z desfaz.
- Tipos de nota editáveis (menu lateral → "Tipos de nota"): nome, cor e ícone
  de cada tipo, e criação de tipos novos.
- **Tópicos**: itens de lista dentro de um ramo. Ex.: a nota "Inibidores diretos
  do fator Xa" explica o mecanismo, e embaixo dela Rivaroxabana, Apixabana e
  Edoxabana são tópicos. Um tópico tem tipo, cor e ícone como qualquer nota, mas
  no lugar do texto longo leva só uma **recomendação curta**, escrita no próprio
  cartão da árvore (e na lista, na busca e na nota de cima).
  - O cartão do tópico é tingido na cor do tipo; a nota completa é branca.
  - Ao criar um nó, escolha "Nota" ou "Tópico" e o tipo. "+ Irmão" de um tópico
    já vem como tópico do mesmo tipo, para listar em série.
  - A recomendação se escreve no painel ao lado (ou pelo toque longo,
    "Escrever uma recomendação").
  - A nota de cima mostra, logo abaixo do título, a lista dos seus tópicos com as
    recomendações, e um botão "Adicionar tópico".
  - Pelo toque longo, um tópico vira nota completa (a recomendação passa a ser o
    primeiro parágrafo) e uma nota vira tópico, sem perder nada.
- **Busca** (lupa na barra superior, ou Ctrl+K):
  - por nome e no conteúdo das notas, ignorando acentos e maiúsculas e
    tolerando erros de digitação, com o trecho encontrado em destaque;
  - com o campo vazio, todas as notas em ordem alfabética, com o índice de A a Z
    na lateral (dá para deslizar o dedo pelas letras);
  - filtro por tipo (Doença, Medicamento, Exame, Estudo…), que pode ser
    combinado; os tópicos entram junto com as notas do mesmo tipo, e há um
    filtro "Só tópicos";
  - cada resultado mostra o tipo e em quais árvores a nota aparece; tocar abre a
    nota e destaca o nó na árvore.
- **Tema**: menu lateral → "Aparência": seguir o sistema, sempre claro ou sempre escuro.
- Com a nota ao lado, o "Ver tudo" enquadra a árvore contando com os títulos,
  sem cortar nada na borda.
- Dados de exemplo: árvore "Dor torácica" e árvore "Anticoagulação", que
  reaproveita as mesmas notas.
- No menu lateral há "Criar árvore de teste com 600 nós", para conferir a
  fluidez no próprio tablet, e "Adicionar as árvores de exemplo", que cria uma
  cópia nova dos exemplos (útil para ver os tópicos depois de atualizar o app).

## Árvores

Cada nó tem um de três **formatos**, escolhido ao criar (e mudado depois pelo
toque longo → "Mudar o formato", sem perder nada):

| Formato | Para quê | Na árvore |
| --- | --- | --- |
| **Nota** | Texto completo (mecanismo, quadro, conduta) | Cartão branco com a faixa da cor do tipo |
| **Tópico** | Item de lista com recomendação curta (ex.: um medicamento) | Cartão tingido na cor do tipo, com a recomendação embaixo do nome |
| **Seção** | Só um título que agrupa ramos (ex.: "Dor torácica" dentro de "Grandes síndromes clínicas") | Cartão cheio, escuro (claro no tema escuro), título grande em negrito |

A seção não tem texto nem tipo; o painel ao lado mostra o que há dentro dela e
um botão "Adicionar nesta seção". "+ Irmão" de uma seção já vem como seção.

- Uma tela pode ter **várias árvores**, uma embaixo da outra: botão "+ Árvore"
  no canto da tela (e no fim da lista recuada). A primeira dá nome à tela; as
  outras podem ser excluídas sozinhas, ir para dentro de um nó ("Pôr dentro de
  outro nó") ou nascer de um ramo ("Separar como árvore própria").
- **Nó entre dois existentes**: com um nó selecionado, "+ Entre" (à esquerda
  dele) cria um nó entre ele e o de cima; o rótulo do ramo vai junto. Numa raiz,
  o botão vira "+ Pai". Também pelo toque longo.

## Editor (etapa 2)

- Barra fixa no topo, com botões de 48 dp e rolagem horizontal: desfazer,
  refazer, fonte (sem serifa, com serifa, monoespaçada, todas embutidas),
  tamanho, negrito, itálico, sublinhado, tachado, cor do texto, marca-texto,
  títulos H1 a H4, listas com marcadores, numerada e de verificação, recuo
  (Tab / Shift+Tab), alinhamento, citação, tabela (com linhas e colunas),
  linha horizontal, imagem da galeria ou da câmera, sobrescrito, subscrito,
  limpar formatação e modo foco.
- Atalhos com teclado físico: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, Ctrl+Y,
  Ctrl+Alt+1 a 4 (títulos), Ctrl+Shift+F (foco), Ctrl+K (busca).
- **Colar** do Word, do Google Docs e do navegador mantém negrito, itálico,
  sublinhado, títulos, listas e tabelas, e tira fontes, cores, estilos e
  metadados.
- **Imagens** (ex.: foto de exame) ficam dentro do app, reduzidas a 1600 px e
  com a rotação da câmera corrigida. A câmera é chamada pelo app de câmera do
  tablet: o Baú não precisa da permissão de câmera.
- Seletor do tipo no cabeçalho e contador de palavras discreto.
- **Sumário** automático com os títulos, recuado por nível, atualizado enquanto
  se escreve. Tocar num item leva até o título; a seção atual fica destacada.
  Em tela cheia, painel fixo à direita (o botão do cabeçalho recolhe); na tela
  dividida e em retrato, painel deslizante.
- **Modo foco**: só o texto, numa coluna de ~70 caracteres, com as barras do
  Android escondidas (modo imersivo). Opções: esmaecer os parágrafos fora de
  edição e máquina de escrever (a linha atual no meio da tela). Sai pelo botão
  discreto do canto, pelo voltar do Android, por Esc ou por Ctrl+Shift+F.

### Estabilidade da escrita

- Um único contêiner de rolagem por nota; nada de textarea de altura fixa,
  rolagem aninhada ou redimensionamento por JavaScript a cada tecla.
- Espaço livre de ~45% da tela (medida sem teclado) embaixo do texto.
- **Teclado**: `windowSoftInputMode="adjustResize"` faz o Android encolher a
  janela uma única vez quando o teclado abre (não quadro a quadro). A página
  usa `100dvh`, então a área do texto acompanha esse tamanho; quando a janela
  assenta (`visualViewport` + `resize`, com 140 ms de espera), se o cursor
  ficou escondido, a nota rola uma única vez, sem animação. Escolhi isso no
  lugar de "pan" (que empurraria a tela inteira para cima, barra incluída) e de
  "nothing" (que deixaria o texto atrás do teclado).
- Enquanto se digita, quem acompanha o cursor é o próprio ProseMirror, e só
  quando ele chega a 96 px da borda de baixo (ou 56 px da de cima); nada de
  `scrollIntoView` a cada tecla.
- O editor não é controlado pelo React: digitar não redesenha o app. Salvamento
  (800 ms), contador e sumário (400 ms) vêm com atraso, fora da digitação.
- CSS: `overflow-anchor: none` na área do texto, `dvh` no lugar de `vh`,
  nenhuma transição de altura.
- No Android 10 o modo foco esconde só a barra de navegação: esconder também a
  de status faria o teclado deixar de redimensionar a janela nessa versão.

Testado no Chromium em tamanho de tablet, em paisagem e em retrato, com o
"teclado" simulado pelo encolhimento da janela (`testes/etapa2.cjs`): 10 páginas
digitadas, 5.000 palavras coladas e escrita no fim, teclado abrindo e fechando
no meio do texto. Em todos: cursor sempre visível, rolagem só para baixo e no
máximo um ajuste por abertura do teclado. **Ainda falta** o teste num tablet de
verdade com Gboard e Samsung Keyboard (sugestões, correção automática, digitação
por gesto e acentos), que só dá para fazer no aparelho.

## Decisão de arquitetura: casca própria em vez de Capacitor

A interface é exatamente a pilha sugerida: **React + TypeScript + Vite**, árvore
com **React Flow**, editor **TipTap** e busca **MiniSearch** (etapa 4). O que
mudou foi só o empacotamento: no lugar do Capacitor há uma casca Android própria,
em Java (`android/src`), com cerca de 600 linhas.

Motivo: o ambiente em que o app é montado não alcança o repositório do Google de
onde vêm o Gradle Plugin e o AndroidX, dos quais o Capacitor depende. Com a casca
própria o APK é montado aqui mesmo, sem Gradle. De quebra:

- **Sem internet por construção.** Nenhuma biblioteca nativa de terceiros; o
  manifesto não tem permissões; a página é servida de dentro do APK por
  interceptação (`https://localhost/` nunca vira conexão) e uma política de
  conteúdo (CSP) recusa qualquer outra origem.
- **Editor tipo Word (seção 6):** igual. O TipTap roda no Android System
  WebView, o mesmo motor que o Capacitor usaria.
- **Estabilidade da escrita (seção 11):** igual ou melhor, porque o
  comportamento do teclado é definido diretamente por nós:
  `windowSoftInputMode="adjustResize"` faz o Android redimensionar a janela uma
  única vez; a página usa `100dvh`, um único contêiner de rolagem por nota e
  `visualViewport` (etapa 2) para manter o cursor visível.
- **Banco:** o SQLite do próprio Android, pela ponte (`Banco.java`).

Os plugins do Capacitor citados na especificação são substituídos por código
equivalente da casca: Keyboard → `adjustResize`; App → `onBackPressed`;
StatusBar → `pintarBarras`; Camera → `escolherImagem` (galeria por
`ACTION_GET_CONTENT`, câmera por `ACTION_IMAGE_CAPTURE` com um provedor de
arquivo privado); Filesystem e Share entram na etapa 5.

## Montar o APK

Precisa de Node 20+, JDK 17+ e, no Ubuntu/Debian:

```sh
sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
```

```sh
cd bau-notas
npm ci
bash android/montar.sh          # gera Bau.apk, assinado com a chave do projeto
bash android/montar.sh --teste  # gera Bau-teste.apk, com chave temporária
```

O script confere o APK pronto e **falha se houver qualquer permissão declarada**
ou se o backup em nuvem não estiver desligado.

Também dá para montar pelo GitHub Actions (`.github/workflows/bau-apk.yml`): a
cada envio o APK aparece em *Actions → Baú - montar o APK → Artifacts*.

## Chave de assinatura

O Android só instala uma versão nova por cima da antiga se as duas tiverem a
mesma assinatura.

- A chave fica em `android/chave-bau.p12`, protegida por senha.
- A **senha não está no repositório**. Ela foi mostrada na conversa em que o app
  foi criado: guarde-a num gerenciador de senhas.
- Para montar: `BAU_SENHA_CHAVE=... bash android/montar.sh`, ou grave a senha em
  `android/chave.senha` (arquivo ignorado pelo git). No GitHub Actions, cadastre
  o segredo `BAU_SENHA_CHAVE`.
- Sem a senha ainda é possível gerar um APK (`--teste`), mas ele não atualiza o
  app já instalado: seria preciso desinstalar, o que apaga as notas.

## Desenvolver e testar

```sh
npm run dev                     # abre em http://127.0.0.1:5173 (banco sql.js no navegador)
npm run build && npm run previa # serve a versão final em http://127.0.0.1:4173
node testes/etapa1.cjs          # teste de aceite da etapa 1 (Chromium, tamanho de tablet)
node testes/etapa1b.cjs         # tópicos, busca, índice A–Z, filtro por tipo e tema
node testes/telas.cjs           # várias árvores na mesma tela e nó entre dois
node testes/etapa2.cjs          # editor, sumário, modo foco e estabilidade da escrita

npm run build:android
npx vite preview --outDir dist-android --port 4174 &
node testes/android-simulado.cjs   # o pacote exato do APK, com a ponte Android imitada

bash android/teste-jvm/testar.sh   # código Java, com Robolectric (precisa do repositório Maven do Google)
```

| Caminho | O que é |
| --- | --- |
| `src/dados` | Modelo, esquema SQLite, repositório e dados de exemplo |
| `src/estado` | Estado do app (`loja.ts`) e pilha do botão voltar |
| `src/arvore` | Árvore visual, gestos, disposição, lista recuada, atalhos |
| `src/nota` | Painel da nota, editor, menções e salvamento automático |
| `src/busca` | Busca (MiniSearch), filtro por tipo e índice A–Z |
| `src/nativo` | Ponte com a casca Android |
| `android/` | Casca Android, recursos, `montar.sh`, chave e testes Java |
| `testes/` | Testes automáticos no navegador |

## Modelo de dados

- **Nota**: id, título, tipo, tópico (sim/não), recomendação (dos tópicos), conteúdo (JSON do editor), texto (para a busca), criadaEm, atualizadaEm.
- **Tipo**: id, nome, cor, ícone (Doença, Medicamento, Classe farmacológica, Mecanismo de ação, Exame, Estudo/Artigo, Sintoma, Conduta/Procedimento, Geral; editáveis).
- **Árvore**: id, nome, nó raiz.
- **Nó**: id, árvoreId, notaId, paiId, ordem, rótuloDoRamo, recolhido.
- **Links**: origemId → destinoId, sempre pelo id da nota.

Nota e nó são coisas diferentes: a mesma nota pode aparecer em vários ramos e
árvores, e editar num lugar atualiza todos.
