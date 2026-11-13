# Fichário (app Android)

Fichário de conhecimento médico para celular e tablet. Funciona sem internet e não pede
permissão nenhuma: as fichas ficam só no aparelho.

O arquivo para instalar é **`Fichario.apk`**, nesta pasta.

## Instalar

1. Baixe `Fichario.apk` no celular (e no tablet).
2. Toque no arquivo. O Android vai pedir para permitir a instalação de apps vindos do navegador
   ou do gerenciador de arquivos: permita e volte.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim. O aviso aparece
   porque o app não veio da loja.

Serve em Android 5.0 ou mais novo. Versões futuras instalam por cima da atual e mantêm as fichas.

## Usar

- **Anotar**: o botão Anotar abre uma nota em branco. Escreva como numa nota e marque onde viu
  (aula, enfermaria, livro, plantão). Sem ficha escolhida, a nota vai para a caixa de entrada.
  Um texto compartilhado de outro app (PDF, WhatsApp, navegador) também abre como nota nova.
- **Encaixar**: em Hoje, "Encaixar" passa pelas notas da caixa uma a uma. O app sugere a ficha
  (pelo nome ou pela sigla escrita na nota) e a seção (pelas palavras do texto).
- **Fichas**: seis seções (Definição, Fisiopatologia, Quadro clínico, Diagnóstico, Tratamento,
  Pérolas), sinônimos e diferenciais. "Compartilhar" manda a ficha como texto.
- **Revisar**: a ficha volta em Hoje no dia de revisar (1, 3, 7, 14, 30, 60, 120 dias). Cada seção
  fica fechada até você tentar lembrar.
- **Backup**: "Enviar o fichário" gera um arquivo `.json` e abre o compartilhamento (Quick Share,
  WhatsApp, Drive, e-mail). No outro aparelho, abra o arquivo com o Fichário ou use
  "Importar arquivo". A importação junta os dois: o que é novo entra, o que foi mexido fica com a
  versão mais recente, o que foi apagado sai, e nada se duplica. Faça nos dois sentidos para
  celular e tablet ficarem iguais. "Salvar cópia em…" guarda o arquivo onde você escolher.

Na primeira abertura há duas fichas e duas notas de exemplo; "Apagar exemplos", em Hoje, tira tudo.

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

| Caminho | O que é |
| --- | --- |
| `web/` | A página do app: `app.js` (telas e dados), `estilo.css`, `preact-htm.js`, fontes |
| `montar.py` | Junta `web/` num único `index.html`, com fontes e Preact embutidos |
| `src/` | `MainActivity` (WebView e a ponte para arquivos, compartilhamento e barras do sistema) e `Arquivos` (entrega o arquivo exportado ao app que recebe) |
| `res/`, `AndroidManifest.xml` | Ícone, tema e declaração do app |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `chave-de-teste.jks` | Chave de assinatura, senha `android` |

A chave fica no repositório de propósito. Ela não protege nada além deste app de uso pessoal, e
assinar sempre com a mesma é o que deixa a versão nova instalar por cima sem apagar as fichas.

Os dados ficam em `files/dados/fichario.json`, regravado inteiro a cada mudança (arquivo novo e
troca de nome, para nunca ficar pela metade). Apagar deixa registrada a data, para que a
importação no outro aparelho apague também.
