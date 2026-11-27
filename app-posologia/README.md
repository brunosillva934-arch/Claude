# Posologia · bulas oficiais (celular e computador)

App de consulta de posologia direto da bula oficial. Você digita o princípio ativo, em
português ou em inglês, e o app mostra a bula aprovada pela FDA com a seção de posologia
aberta, as doses destacadas e a fonte, a versão e a data de cada texto. Traz também uma
calculadora de dose que só faz a conta com os números que você digita.

| Onde | Arquivo |
| --- | --- |
| Android | **`Posologia.apk`** |
| Computador (Windows, Mac ou Linux) | **`Posologia.html`** |

Os dois são a mesma página: o que muda é só onde ela roda.

## De onde vêm os dados

| O quê | Fonte | Como |
| --- | --- | --- |
| Bula | **FDA** (agência dos EUA), pela **openFDA** (`api.fda.gov`) | A bula aprovada, no formato oficial SPL: o mesmo documento do DailyMed |
| Nome do medicamento | **RxNorm**, da Biblioteca Nacional de Medicina dos EUA (`rxnav.nlm.nih.gov`) | Converte o nome digitado no princípio ativo padronizado |
| Bula brasileira | **Bulário Eletrônico da ANVISA** | Link que abre o bulário no navegador, já com a busca feita |

O caminho de uma busca, sempre visível no topo da tela:

1. **Nome → princípio ativo.** O RxNorm entende a maior parte dos nomes em português
   (amoxicilina, cefalexina, furosemida…) e erros de digitação. Para os poucos que ele não
   entende (dipirona, noradrenalina, paracetamol, varfarina, salbutamol…), o app tem uma
   tabela curta de equivalência, `APELIDOS` em `web/bulas.js`. Cada nome dessa tabela foi
   conferido no RxNorm, e a troca aparece na tela ("dipirona → dipyrone"). Se a
   correspondência é fraca, o app avisa e pede que você escolha.
2. **Princípio ativo → formulação.** Os nomes genéricos registrados na FDA que contêm
   aquele princípio ativo. Associações aparecem separadas (amoxicilina sozinha e
   amoxicilina com clavulanato não se misturam), e o sal também (penicilina G benzatina
   não vira "penicilina G").
3. **Formulação → bula.** Só bulas do fabricante original, sem as das reembaladoras, que
   repetem o texto. As de referência (NDA ou BLA) vêm primeiro; depois as demais, da mais
   recente para a mais antiga.

## O que o app faz e o que não faz

Faz:

- mostra o texto da bula **como veio da FDA**: em inglês, sem tradução, sem resumo, sem
  reescrita. Só quebra parágrafos nos números de subseção (2.1, 2.2…) e pinta de amarelo
  as doses e frequências. O teste de ponta a ponta confere, letra por letra, que o texto
  da tela é o mesmo da FDA;
- abre já na ordem que importa para prescrever: advertência em destaque (boxed warning,
  em vermelho), posologia, apresentações, contraindicações, populações específicas
  (gestação, lactação, pediatria, idosos, rim, fígado), advertências, interações,
  superdosagem;
- procura dentro da bula ("renal", "pediatric", "mg/kg"), abrindo as seções onde achou;
- salva bulas no aparelho para usar sem internet, e confere ao abrir se a FDA publicou
  versão mais nova ou retirou a bula;
- copia a referência da bula (fabricante, versão, data, set ID e link do DailyMed).

Não faz:

- **não sugere dose** e não preenche a calculadora a partir da bula;
- não usa inteligência artificial;
- não tem a bula brasileira. Doses e apresentações aprovadas no Brasil podem ser diferentes
  das americanas. Medicamentos sem registro nos EUA (dipirona, por exemplo) não têm bula na
  FDA; o app diz isso e oferece o bulário da ANVISA;
- não substitui bases clínicas pagas (Micromedex, Lexicomp, UpToDate), que trazem ajuste
  renal, doses pediátricas e interações revisados por farmacêuticos. Elas exigem contrato
  e chave de acesso da instituição, por isso não estão aqui.

A própria openFDA avisa que os dados dela não devem ser usados sozinhos para decisões de
cuidado médico e devem ser tratados como não validados. O texto é o da bula oficial, mas
o caminho até o app passa pelo processamento da openFDA. Por isso cada bula tem o botão
**DailyMed**, que abre o mesmo documento (mesmo set ID) no repositório oficial da NLM.

## Calculadora de dose

Só aritmética, com cada passo e cada unidade à vista. Nenhuma dose vem embutida.

- **Dose por peso ou superfície:** mg/kg, mcg/kg, UI/kg, mEq/kg, mmol/kg (ou por m², com
  superfície corporal por Mosteller, ou dose fixa), por dose ou por dia, dividida em
  tomadas. Com a apresentação (ex.: 250 mg em 5 mL), dá o volume.
- **Dose máxima:** se você digitar o máximo da bula, o app avisa em vermelho quando a dose
  calculada passa dele e mostra ao lado o valor limitado. Nada é trocado sozinho.
- **Infusão contínua:** mcg/kg/min, mg/kg/h, UI/h etc. para mL/h, e o inverso (mL/h para dose),
  a partir da solução preparada.

Cuidados contra erro de digitação e de leitura:

- vírgula ou ponto como decimal, mas **separador de milhar é recusado**: "1.000" ou
  "2,500" podem ser mil ou um, e o app pede que você escreva de outro jeito;
- resultado sem zero sobrando (5 mg, nunca 5,0 mg) e com zero à esquerda (0,5 mg);
  milhares com espaço fino (12 500 UI), que não se confunde com vírgula;
- "≈" marca o que foi arredondado para exibir; a conta usa o número inteiro;
- unidades incompatíveis (UI contra mg) são erro, não conta; mg, mcg e g são convertidos
  e a conversão aparece no passo a passo;
- avisos para peso ou altura fora do habitual, volume pequeno demais para medir e vazão
  fora do alcance das bombas.

A calculadora roda inteira no aparelho e não guarda nada do que for digitado.

## Segurança e privacidade

- **Dois servidores, e só eles.** A página só consegue falar com `api.fda.gov` e
  `rxnav.nlm.nih.gov`, por HTTPS. Isso é garantido pela política de segurança de conteúdo
  (CSP) da página e, no Android, de novo pelo app, que barra qualquer outro pedido antes
  de sair do aparelho. O APK proíbe HTTP sem criptografia.
- **Nenhum código de fora.** A CSP só deixa rodar os dois blocos de script da própria
  página, identificados pelo resumo SHA-256 de cada um, calculado na montagem. Script
  injetado não roda (o teste de ponta a ponta tenta, e é bloqueado).
- **Texto de fora nunca vira código.** Todo texto das fontes entra na tela como texto.
  As tabelas da bula, que chegam em HTML, são reconstruídas elemento por elemento, só com
  tabela, linha, célula, negrito, itálico e quebra de linha. Scripts, imagens, eventos,
  estilos e links são descartados.
- **Integridade das bulas salvas.** Cada cópia salva leva um resumo SHA-256. Ao abrir, o
  app recalcula: se não bater, a cópia foi corrompida ou modificada fora do app e não é
  mostrada. Isso protege contra corrupção e alteração acidental; não é assinatura
  criptográfica, e quem tem acesso total ao aparelho pode recalcular o resumo.
- **Versão em dia.** Com internet, toda bula salva é conferida com a FDA ao abrir. O app
  avisa quando há versão nova (e atualiza com um toque) e quando a bula saiu da base.
- **O que sai do aparelho:** o nome do medicamento digitado e o identificador da bula.
  Nenhum dado de paciente, nenhum cadastro, nenhuma estatística de uso, nenhum cookie.
- **No Android:** uma permissão só (internet); as bulas salvas ficam em arquivos privados
  do app; sem cópia automática para a nuvem; links externos só abrem se forem do DailyMed,
  da FDA ou da ANVISA, e sempre no navegador do sistema.

## No computador

1. Baixe `Posologia.html` (no GitHub, abra o arquivo e use o botão de baixar,
   "Download raw file").
2. Guarde num lugar fixo, por exemplo em Documentos, e abra com dois cliques. Chrome e Edge
   são os testados.

As bulas salvas ficam **naquele navegador**. Limpar os dados de navegação apaga as salvas.

## No Android

1. Baixe `Posologia.apk` no celular e toque no arquivo.
2. Permita a instalação de apps vindos do navegador ou do gerenciador de arquivos.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim: o aviso
   aparece porque o app não veio da loja.

Serve em Android 5.0 ou mais novo.

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

Gera o APK e o HTML do computador. Só o HTML: `python3 montar.py Posologia.html`.

**A chave de assinatura não está no repositório**, de propósito: quem tem a chave consegue
assinar um APK que o Android aceita como atualização deste app. O `montar.sh` usa
`chave-de-assinatura.jks` (ou o arquivo em `CHAVE=`, com a senha em `SENHA_CHAVE=`) e, se não
existir, cria uma nova. Guarde a sua fora do Git. Com outra chave, a versão nova só instala
depois de desinstalar a antiga (as bulas salvas se perdem; basta salvar de novo).

Para uma versão nova, aumente `NOME` e `CODIGO` em `montar.sh`.

| Caminho | O que é |
| --- | --- |
| `web/bulas.js` | Fontes (RxNorm e openFDA), tabela de nomes brasileiros, ordem das seções, limpeza das tabelas |
| `web/calculo.js` | Calculadora: leitura de números, conversão de unidades, contas e avisos |
| `web/integridade.js` | SHA-256 das bulas salvas |
| `web/app.js` | As telas |
| `web/estilo.css`, `web/index.html`, `web/fontes/` | Aparência e a casca da página |
| `montar.py` | Junta `web/` num único HTML, com fontes, ícone e a CSP com os resumos dos scripts |
| `src/`, `res/`, `AndroidManifest.xml` | O app Android: um WebView, a trava de rede e a ponte para salvar e abrir links |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `testes/unidade.test.js` | Calculadora, números, SHA-256 e tratamento do texto. `node --test testes/unidade.test.js` |
| `testes/navegador.js` | Ponta a ponta no Chromium, contra a FDA e o RxNorm de verdade. `node testes/navegador.js` |

## O que foi e o que não foi testado

**Testado:**

- 32 testes de unidade, entre eles 2000 casos aleatórios da calculadora conferidos contra
  a fórmula, o SHA-256 contra os vetores oficiais, e a garantia de que quebrar parágrafos e
  destacar doses não muda nenhum caractere da bula.
- 16 passos de ponta a ponta no Chromium, em tamanho de celular e de computador, contra os
  servidores reais: amoxicilina do nome à bula; o texto da posologia na tela conferido letra
  por letra com o da FDA; procura dentro da bula; tabela maliciosa limpa sem executar nada;
  salvar, reabrir, conferir versão; cópia salva adulterada recusada; dipirona levando à
  ANVISA; nome inexistente sem resultado inventado; varfarina, paracetamol e noradrenalina
  chegando ao princípio ativo certo; calculadora por peso com dose máxima, número ambíguo
  recusado, infusão; CSP bloqueando outro servidor e script injetado; tema escuro.
- Os 44 nomes da tabela de equivalência, um a um, no RxNorm.
- O APK foi conferido por dentro (manifesto, permissão, assinatura, página embutida).

**Não testado:** o APK rodando em aparelho ou emulador; Firefox e Safari; o link do
bulário da ANVISA (o site da ANVISA não estava acessível no ambiente de montagem: se o
formato do link mudar, ele abre a página de busca do bulário).
