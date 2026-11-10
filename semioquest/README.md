# SemioQuest

Treino de semiologia médica em um único arquivo HTML, publicado como artefato do Claude.
Este diretório é o código-fonte; `../semioquest.html` é o arquivo gerado que vai para o artefato.

## Como gerar

```
node semioquest/build.mjs           # valida o conteúdo e escreve ../semioquest.html
node semioquest/build.mjs --check   # só valida
```

Não há dependências. O build recusa conteúdo inconsistente: link para tópico, sinal ou quadro que não existe,
tabela com célula faltando, caso sem achado-chave, questão sem gabarito válido.

## Estrutura

| Caminho | O que é |
|---|---|
| `src/app/*.js` | O aplicativo, concatenado em ordem alfabética. Os arquivos mais antigos vêm do bundle original descompilado (nomes de variáveis curtos); os novos têm nomes legíveis: `36-ia-voz.js`, `62-ia-competencias.js`, `72-ia-preceptor.js`, `92-simulado.js`. |
| `src/styles/` | `base.css` (original) e `extra.css` (acréscimos). |
| `src/data/*.json` | Conteúdo original: 36 tópicos, 95 sinais, sons, casos e o caderno de 388 quadros. |
| `conteudo/topicos/*.md` | Tópicos novos da biblioteca, em Markdown. |
| `conteudo/*.mjs` | Sinais, casos, tabelas, sequências, glossário, manobras por região, vínculos com o caderno e banco de questões. |

## Formato dos tópicos (`conteudo/topicos/*.md`)

```
@modulo abdome
@topico abd-anatomia
titulo: Topografia do abdome
nivel: Básico
resumo: primeira linha      (são exatamente três)
resumo: segunda linha
resumo: terceira linha
sinais: murphy, mcburney    (ids do Atlas; opcional)

## Título da seção
Texto em Markdown: **negrito**, listas, tabelas com | e destaques:
> [!dica] …   > [!alerta] …   > [!evidencia] …   > [!perola] …
Links internos: [texto](topico:id), (sinal:id), (caso:id), (som:id), (tabela:id), (quadro:5.3)

@cartoes
Pergunta do cartão :: Resposta do cartão
```

## Inteligência artificial

A página usa as capacidades do artefato, declaradas na publicação: `sample` (Claude), `db` e `user`
(progresso por conta), `dictation` e `tts` (voz, onde o visualizador oferece). Sem elas o app funciona:
os recursos de IA somem e o progresso fica no navegador.

- `35-ia-nucleo.js`: chamadas ao Claude, tratamento de erros, sincronização e a caixa "Pergunte ao Claude".
- `60-ia-estacoes.js`: os modos de estação, os papéis (paciente, simulador de exame, tutor, preceptor, banca)
  e a correção por competências.
- `72-ia-preceptor.js`: conversa ancorada na biblioteca. A cada pergunta a página busca os trechos mais
  pertinentes e os envia junto; as fontes aparecem como links.

## Publicar

Publique `semioquest.html` no artefato com as capacidades
`{"db": {}, "sample": {}, "user": {}, "dictation": {}, "tts": {}}`.
