# Baú

Notas médicas organizadas em árvores, para tablet Android. Funciona 100% offline:
não tem conta, servidor nem nuvem, e o app **não declara nenhuma permissão**
(nem a de internet). Tudo fica só no aparelho.

O arquivo para instalar é **`Bau.apk`**, nesta pasta.

> Situação: **versão 0.2.0**. Etapa 1 de 5 (projeto, modelo de dados e árvore
> visual), já com tópicos, busca e escolha de tema. O editor completo, os links
> e o backup entram nas próximas etapas.

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
- **Tópicos**: nós só com título, sem texto, para organizar o ramo ("Exames",
  "Tratamento", "Orais"…). Ao criar um nó, escolha "Nota" ou "Tópico"; pelo
  toque longo dá para transformar um no outro (o texto de uma nota fica guardado
  e volta se ela deixar de ser tópico). O painel de um tópico lista o que há
  dentro dele; o toque duplo num tópico recolhe ou expande o ramo.
- **Busca** (lupa na barra superior, ou Ctrl+K):
  - por nome e no conteúdo das notas, ignorando acentos e maiúsculas e
    tolerando erros de digitação, com o trecho encontrado em destaque;
  - com o campo vazio, todas as notas em ordem alfabética, com o índice de A a Z
    na lateral (dá para deslizar o dedo pelas letras);
  - filtro por tipo (Doença, Medicamento, Exame, Estudo…), que pode ser
    combinado, e um filtro só para tópicos;
  - cada resultado mostra o tipo e em quais árvores a nota aparece; tocar abre a
    nota e destaca o nó na árvore.
- **Tema**: menu lateral → "Aparência": seguir o sistema, sempre claro ou sempre escuro.
- Com a nota ao lado, o "Ver tudo" enquadra a árvore contando com os títulos,
  sem cortar nada na borda.
- Dados de exemplo: árvore "Dor torácica" e árvore "Anticoagulação", que
  reaproveita as mesmas notas.
- No menu lateral há "Criar árvore de teste com 600 nós", para conferir a
  fluidez no próprio tablet.

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
StatusBar → `pintarBarras`; Filesystem, Share e Camera entram nas etapas 2 e 5.

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

- **Nota**: id, título, tipo, tópico (sim/não), conteúdo (JSON do editor), texto (para a busca), criadaEm, atualizadaEm.
- **Tipo**: id, nome, cor, ícone (Doença, Medicamento, Exame, Estudo/Artigo, Sintoma, Conduta/Procedimento, Geral; editáveis).
- **Árvore**: id, nome, nó raiz.
- **Nó**: id, árvoreId, notaId, paiId, ordem, rótuloDoRamo, recolhido.
- **Links**: origemId → destinoId, sempre pelo id da nota.

Nota e nó são coisas diferentes: a mesma nota pode aparecer em vários ramos e
árvores, e editar num lugar atualiza todos.
