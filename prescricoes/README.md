# Prescrições (app Android)

App pessoal para consultar o **Drive de Prescrições** sem ficar rolando o PDF:
busca por doença, sintoma, apelido, CID ou remédio, abre a ficha com a receita
pronta e copia para o receituário. Funciona sem internet.

O conteúdo vem do PDF de quem comprou o material. Por isso **nem os dados extraídos
nem o APK ficam neste repositório** (ele é público): aqui está só o código. Quem
tem o PDF gera o app na própria máquina.

## O que o app faz

- **Condutas**: as 123 fichas, em ordem alfabética, com os 20 atalhos do plantão,
  favoritas e as últimas abertas. Filtro por etiqueta (Plantão, Ambulatório,
  Gestante, Pediatria, IST).
- **Busca**: sem acento e por começo de palavra ("amox" acha amoxicilina). Procura
  no nome da conduta, nos apelidos do índice ("cobreiro" → Herpes zoster), no
  "Busque também", no CID ("J45"), nos remédios, nas tabelas e dentro do texto de
  todas as fichas, com o trecho achado marcado.
- **Ficha**: atestado sugerido, retorno, antes de prescrever, receita pronta,
  outras opções, prescrição na unidade, notas para o plantonista e referências,
  com os selos SUS / Farmácia Popular / controle especial. Botão **Copiar** na
  receita pronta e em cada item.
- **Remédios**: os 209 remédios das receitas. Cada um mostra todas as doses e
  posologias em que aparece, a linha das tabelas de gestação, amamentação e
  doença renal, e as fichas que só o citam.
- **Tabelas**: as tabelas de consulta rápida do fim do PDF, em cartões que cabem
  no celular.
- **Receita**: monte a sua a partir da receita pronta, troque itens pelas opções
  (de qualquer ficha), desmarque orientações e copie ou compartilhe.
- **Editar e criar**: qualquer conduta pode ser atualizada pelo lápis no alto da ficha
  (nome, CID, etiquetas, outros nomes, atestado, retorno, remédios, quantidades,
  posologia, selos, orientações, sinais de alarme, seções inteiras e referências), e
  dá para criar condutas novas e editar as linhas das tabelas. Veja abaixo.
- Tema claro ou escuro (segue o sistema) e quatro tamanhos de letra.

## Editar, criar e guardar

- **Editar uma conduta**: abra a ficha e toque no lápis (ou em "Editar esta conduta",
  no fim). Cada remédio, tópico e título tem setas para subir e descer e a lixeira;
  embaixo de cada seção há "+ Remédio", "+ Tópico" e "Outro…" (título de lista, grupo
  de opções, "OU", parágrafo). `**texto**` vira negrito, como o "**Gestante:**" das
  fichas. Toque em **Salvar** no alto.
- A ficha editada ganha a faixa "Editada por você em …" com o link **Ver o original do
  PDF**; no editor, **Voltar ao original do PDF** desfaz tudo. "Salvar como conduta
  nova…" guarda a versão editada à parte e deixa a original como estava.
- **Criar uma conduta**: "Nova conduta", ao lado de "Todas as condutas", ou o botão
  que aparece quando a busca não acha nada. Ela entra na busca, na lista, nos remédios
  e no filtro **Minhas**.
- **Tabelas**: "Editar tabela" em cada uma. Nas colunas de gestação, amamentação e
  doença renal, Seguro, Compatível, Cautela, Evitar e Contraindicado ganham a cor
  sozinhos.
- Voltar sem salvar pergunta antes. Se o app for fechado no meio da edição, ele avisa
  ao abrir de novo e continua de onde parou.
- **Onde fica**: só no aparelho, num arquivo privado do app. Atualizar o app (instalar
  a versão nova por cima) mantém tudo; **desinstalar apaga**. Por isso, em Sobre e
  ajustes → Suas alterações, use **Salvar cópia** de vez em quando (gera um `.json`)
  e **Restaurar cópia** para trazer de volta, num celular novo ou no
  `Prescricoes.html` do computador. A restauração só troca as condutas e tabelas que
  estão na cópia; o resto fica.
- As edições ficam por cima do conteúdo do PDF, ligadas a cada conduta pelo nome
  original. Se você gerar o app de novo com um PDF atualizado, as suas versões
  continuam valendo onde houver edição.

## Gerar o app

Precisa de Python 3, Java e alguns pacotes do Ubuntu/Debian (sem Gradle nem
Android Studio):

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
pip install pymupdf

python3 extrair.py caminho/do/drive.pdf      # ou as partes: parte1.pdf parte2.pdf ...
./montar.sh
```

Saem nesta pasta o `Prescricoes.apk` e o `Prescricoes.html` (a mesma coisa para
abrir no navegador do computador). O extrator leva uns 30 segundos.

Para instalar: copie o APK para o celular, toque nele, permita instalar apps de
fora da loja e, se o Play Protect avisar que não conhece o app, instale mesmo assim.
Android 5.0 ou mais novo. Nenhuma permissão é pedida.

Versão nova: aumente `NOME` e `CODIGO` em `montar.sh`. Como a assinatura é sempre
a mesma chave (a de `../app-android`), ela instala por cima e mantém favoritas e
receita.

## Como o extrator lê o PDF

O PDF não tem estrutura, mas a diagramação é constante: cada parte da ficha tem cor
e tamanho de letra próprios (título azul de 15,5 pt, item da receita azul-marinho
de 10,6 pt, quantidade de 10 pt à direita, rótulo "Gestante:" verde-petróleo...).
O `extrair.py` usa essas marcas para separar as seções. Detalhes que ele resolve:

- o PDF guarda cópias invisíveis de marcadores de lista e de selos em camadas
  escondidas; por isso o marcador é procurado na página desenhada, e o selo só
  conta se estiver logo depois do nome do remédio;
- letras acentuadas soltas no rodapé e a marca d'água com o dono da cópia ficam
  de fora;
- a página vem do número impresso, então o PDF inteiro ou em partes dá no mesmo;
- os apelidos de cada ficha saem do índice, ligados pela página.

| Caminho | O que é |
| --- | --- |
| `extrair.py` | PDF → `dados/prescricoes.json` |
| `web/` | A página: `app.js` (busca e telas), `estilo.css`, `index.html`, fontes |
| `montar.py` | Junta `web/` e os dados num único HTML |
| `montar.sh` | Gera o APK e o HTML |
| `src/`, `res/`, `AndroidManifest.xml` | A atividade Android (um WebView), ícone e tema |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |

## O que foi e o que não foi testado

Conferido: todo trecho de texto das páginas de fichas aparece nos dados extraídos;
edição de conduta (mudar dose e posologia, somar e reordenar remédio, apagar
orientação, negrito), ver o original e voltar a ele, sair sem salvar, rascunho
recuperado depois de fechar, conduta nova (achada pelo nome, pelos outros nomes e pelo
CID, e no filtro Minhas), edição de tabela com as cores, e a cópia de segurança indo
de um navegador para outro e recusando arquivo errado;
as 123 fichas e os 209 remédios abrem sem erro numa tela de 360 px; a receita
pronta de todas as fichas copia; busca por nome, apelido, CID, remédio e texto;
receita montada, favoritas e ajustes sobrevivendo ao recarregar; tema escuro.
A página foi testada no Chromium em modo celular, com uma imitação da ponte do
Android.

Não testado: o APK rodando num aparelho ou emulador (foi conferido por dentro:
manifesto, assinatura, conteúdo).
