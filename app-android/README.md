# Discursivas · treino (celular e computador)

App para responder as questões baixadas em TXT no gerador **Discursivas de Medicina**.
Funciona sem internet: as questões e as respostas ficam só no seu aparelho ou no
seu navegador.

| Onde | Arquivo |
| --- | --- |
| Android | **`Discursivas-treino.apk`** |
| Computador (Windows, Mac ou Linux) | **`Discursivas-treino.html`** |

Os dois são a mesma página: o que muda é só onde ela roda.

## No computador

1. Baixe `Discursivas-treino.html` (no GitHub, abra o arquivo e use o botão de
   baixar, "Download raw file").
2. Guarde-o num lugar fixo, por exemplo em Documentos, e abra com dois cliques.
   Abre no navegador padrão; Chrome e Edge são os testados.
3. Arraste os TXT do gerador para a janela, ou clique em **Importar TXT**.

As respostas ficam guardadas **naquele navegador**. Aberto numa janela que não
deixa guardar nada (por exemplo, a pré-visualização de arquivos de outro app), o
app funciona do mesmo jeito, mas avisa no topo que o que for respondido some ao
fechar. Duas coisas apagam ou escondem
o que você respondeu:

- limpar os dados de navegação (cookies e dados de sites);
- em alguns navegadores, mudar o HTML de pasta ou abrir com outro navegador.

Para não perder nada, salve de vez em quando uma **cópia de segurança** (Ajustes →
Salvar cópia). Para trocar de computador, restaure a cópia no outro.

Atalhos: **Ctrl+Enter** avança ou entrega · **A** a **E** marcam a alternativa ·
**Esc** sai do foco ou volta. No computador, o modo foco abre em tela cheia.

## No Android

1. Baixe `Discursivas-treino.apk` no celular e toque no arquivo.
2. Permita a instalação de apps vindos do navegador ou do gerenciador de arquivos.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim:
   o aviso aparece porque o app não veio da loja.

Serve em Android 5.0 ou mais novo. Versões novas instalam por cima e mantêm o que
já foi respondido. O app não pede permissão nenhuma.

## Usar

- **Listas**: cada TXT importado vira uma lista, com o nome que você deu no
  gerador e um selo colorido do tipo: **Discursivas** em índigo, **Objetivas** em
  terracota, **Mista** com as duas cores. TXT antigo que só dizia "Sessão · 11
  questões" ganha o nome do tema. Para trocar o nome, use o lápis ao lado do
  título da lista (ou o menu ⋮ → Renomear).
- **Importar**: um ou vários TXT de uma vez. No celular, também pelo gerenciador de
  arquivos ("abrir com") ou compartilhando com o app. Se o arquivo não aparecer,
  use "Colar o texto".
- **Discursivas**: cada item (a, b, c) tem a sua caixa, com contador de linhas.
- **Objetivas**: marque a alternativa; cada uma tem uma caixa para você escrever
  por que está certa ou errada. Errou a primeira? Há uma segunda tentativa
  valendo metade.
- **Modo foco**: uma caixa por vez, sem barras nem lista. Em caso evolutivo, o
  momento seguinte só aparece quando você chega nele.
- **Entregar**: o espelho fica lacrado até a entrega. Depois você compara a sua
  resposta com a resposta nota máxima e marca cada quesito (0, metade, inteiro);
  erro grave marcado zera o item. Nas objetivas, o comentário de cada alternativa
  aparece ao lado da justificativa que você escreveu.
- **Exportar**: no menu do arquivo, salve (ou, no celular, compartilhe e copie)
  as suas respostas em TXT.
- **Cópia de segurança**: em Ajustes. Gera um TXT com todos os arquivos e
  respostas. Restaurar é importar esse TXT, no celular ou no computador. Se a
  mesma questão foi respondida nos dois lados, fica a versão mexida por último;
  resposta escrita nunca é trocada por caixa vazia.

A correção é sua, contra o espelho do arquivo. O app não corrige texto sozinho
nem usa IA: para a correção comentada, use o gerador.

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

Gera o APK e o HTML do computador. Só o HTML: `python3 montar.py Discursivas-treino.html`.

| Caminho | O que é |
| --- | --- |
| `web/` | A página: `leitor.js` (lê o TXT), `app.js` (telas), `estilo.css`, fontes e o exemplo |
| `montar.py` | Junta `web/` num único HTML, com fontes e ícone embutidos |
| `src/` | A atividade Android: um WebView e a ponte para arquivos, compartilhamento e barras do sistema |
| `res/`, `AndroidManifest.xml` | Ícone, tema e declaração do app |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `chave-de-teste.jks` | Chave de assinatura, senha `android` |

A chave fica no repositório de propósito. Ela não protege nada além deste app de
uso pessoal, e assinar sempre com a mesma é o que deixa a versão nova instalar
por cima da antiga. Para publicar em loja, troque por uma chave privada.

Para uma versão nova, aumente `NOME` e `CODIGO` em `montar.sh`.

## O que foi e o que não foi testado

A página foi testada no Chromium em tamanho de celular e de computador, com os
TXT reais do gerador (discursivas, objetivas, caso evolutivo, sessão mista):
importar (inclusive arrastando), responder, entregar, corrigir, modo foco, tela
cheia, atalhos, exportar, e a cópia de segurança indo e voltando entre dois
navegadores sem perder a resposta mais nova de nenhum lado. O leitor passou por
milhares de arquivos cortados e embaralhados sem falhar.

Não foi testado: Firefox e Safari; o APK rodando em aparelho ou emulador (ele foi
conferido por dentro: manifesto, assinatura, conteúdo).
