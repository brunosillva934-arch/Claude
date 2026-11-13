# Fichário Médico

Fichário de conhecimento médico para celular e tablet, publicado como página no claude.ai:
https://claude.ai/artifact/DhGdb4ZTcXtZoorZaPCnrx

## Fluxo

1. **Anotar**: o botão Anotar abre uma nota em branco. Escreva como numa nota e marque onde viu (aula, enfermaria, livro, plantão). Se não escolher uma ficha, a nota vai para a caixa de entrada.
2. **Encaixar**: na tela Hoje, "Encaixar" passa pelas notas da caixa uma a uma. O app sugere a ficha (pelo nome ou pela sigla escrita na nota) e a seção (pelas palavras do texto). Você confirma ou troca.
3. **Revisar**: a ficha volta em Hoje no dia de revisar (1, 3, 7, 14, 30, 60, 120 dias). Na revisão, cada seção fica fechada até você tentar lembrar.

Cada ficha tem seis seções: Definição, Fisiopatologia, Quadro clínico, Diagnóstico, Tratamento e Pérolas. Também tem sinônimos e diferenciais, que viram atalhos quando existe uma ficha com o mesmo nome.

## Dados

As fichas e notas ficam no banco de dados da página (`fichas/<id>`, `notas/<id>`), legível e gravável só pela dona da página. Toda alteração entra antes numa fila guardada no aparelho e sobe em ordem, então uma nota escrita sem sinal não se perde.
