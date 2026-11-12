# Discursivas · treino (app Android)

App para responder no celular as questões baixadas em TXT no gerador
**Discursivas de Medicina**. Funciona sem internet e não pede permissão nenhuma:
as questões e as respostas ficam só no aparelho.

O arquivo para instalar é **`Discursivas-treino.apk`**, nesta pasta.

## Instalar

1. Baixe `Discursivas-treino.apk` no celular.
2. Toque no arquivo. O Android vai pedir para permitir a instalação de apps
   vindos do navegador ou do gerenciador de arquivos: permita e volte.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim.
   O aviso aparece porque o app não veio da loja.

Serve em Android 5.0 ou mais novo. Versões futuras instalam por cima da atual
e mantêm o que já foi respondido.

## Usar

- **Importar TXT**: escolha um ou vários arquivos baixados do gerador. Também dá
  para abrir o TXT pelo gerenciador de arquivos ("abrir com") ou compartilhá-lo
  com o app. Se o arquivo não aparecer, use "Colar o texto".
- **Discursivas**: cada item (a, b, c) tem a sua caixa, com contador de linhas.
- **Objetivas**: toque na alternativa para marcar; cada alternativa tem uma caixa
  para você escrever por que está certa ou errada. Errou a primeira? Há uma
  segunda tentativa valendo metade.
- **Modo foco**: uma caixa por vez, sem barras nem lista, tela sempre acesa. Em
  caso evolutivo, o momento seguinte só aparece quando você chega nele.
- **Entregar**: o espelho fica lacrado até a entrega. Depois você confere a sua
  resposta contra a resposta nota máxima e marca cada quesito (0, metade,
  inteiro); erro grave marcado zera o item. Nas objetivas, o comentário de cada
  alternativa aparece ao lado da justificativa que você escreveu.
- **Exportar**: no menu do arquivo, compartilhe, copie ou salve em TXT as suas
  respostas (por exemplo, para pedir uma correção).

A correção é sua, contra o espelho do arquivo. O app não corrige texto sozinho
nem usa IA: para a correção comentada, use o gerador.

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

| Caminho | O que é |
| --- | --- |
| `web/` | A página do app: `leitor.js` (lê o TXT), `app.js` (telas), `estilo.css`, fontes e o exemplo |
| `montar.py` | Junta `web/` num único `index.html`, com as fontes embutidas |
| `src/` | A atividade Android: um WebView e a ponte para arquivos, compartilhamento e barras do sistema |
| `res/`, `AndroidManifest.xml` | Ícone, tema e declaração do app |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `chave-de-teste.jks` | Chave de assinatura, senha `android` |

A chave fica no repositório de propósito. Ela não protege nada além deste app de
uso pessoal, e assinar sempre com a mesma é o que deixa a versão nova instalar
por cima da antiga. Para publicar em loja, troque por uma chave privada.

Para uma versão nova, aumente `NOME` e `CODIGO` em `montar.sh`.

## O que foi e o que não foi testado

A página do app foi testada em navegador com tamanho de celular, com os TXT
reais do gerador (discursivas, objetivas, caso evolutivo, sessão mista), e o
leitor passou por milhares de arquivos cortados e embaralhados sem falhar. O APK
foi conferido por dentro (manifesto, assinatura, conteúdo). Ele **não foi
executado em aparelho nem em emulador** no ambiente em que foi montado.
