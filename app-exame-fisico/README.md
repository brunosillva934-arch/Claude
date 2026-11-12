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
**como reconhecer**; cada motivo, uma nota de **como leva ao achado**.

O app já vem com 11 áreas (exame geral, sinais vitais, pele e anexos, cabeça e
pescoço, respiratório, cardiovascular, vascular periférico, abdome, neurológico,
osteoarticular, mamas/geniturinário/anorretal), com os achados esperados, os
anormais e os motivos de cada um. É um ponto de partida para estudo: confira com
as suas referências e ajuste como quiser.

## Usar

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
- **Revisão**: um achado anormal por vez, por área ou de todas; tente lembrar os
  motivos antes de abrir.
- **Buscar** (lupa): tópicos, achados e motivos.
- **Menu (⋮)**: salvar cópia de segurança (um `.json` com roteiro e exames),
  restaurar de uma cópia (também por "abrir com" no gerenciador de arquivos) e
  repor o conteúdo inicial.

## Instalar

1. Baixe `Exame-fisico.apk` no celular.
2. Toque no arquivo e permita a instalação de apps vindos do navegador ou do
   gerenciador de arquivos.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim.

Serve em Android 5.0 ou mais novo. Versões futuras instalam por cima e mantêm o
que você escreveu.

## Montar de novo

Sem Gradle nem Android Studio; bastam pacotes do Ubuntu/Debian:

```sh
apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
./montar.sh
```

| Caminho | O que é |
| --- | --- |
| `web/dados.js` | O conteúdo inicial: áreas, tópicos, achados e motivos |
| `web/app.js`, `web/estilo.css` | As telas |
| `montar.py` | Junta `web/` num único `index.html`, com as fontes embutidas |
| `src/` | A atividade Android: um WebView e a ponte para arquivos e compartilhamento |
| `res/`, `AndroidManifest.xml` | Ícone, tema e declaração do app |
| `icone.js` | Redesenha os PNG do ícone (precisa do Playwright) |
| `chave-de-teste.jks` | Chave de assinatura, senha `android` |

A chave fica no repositório de propósito: assinar sempre com a mesma é o que
deixa a versão nova instalar por cima. Para uma versão nova, aumente `NOME` e
`CODIGO` em `montar.sh`. O conteúdo de `web/dados.js` só entra na primeira
abertura (ou em "Repor o conteúdo inicial"); depois vale o que está no aparelho.

## O que foi e o que não foi testado

A página foi testada em navegador com tamanho de celular (390 e 320 px, claro e
escuro): navegação, criar/editar/apagar/desfazer, motivos ligados pelo nome,
exame com resumo, revisão, busca, e a ponte com o Android simulada (salvar,
cópia de segurança, restauração, arquivo inválido). O APK foi conferido por
dentro (manifesto, assinatura, conteúdo). Ele **não foi executado em aparelho
nem em emulador** no ambiente em que foi montado.
