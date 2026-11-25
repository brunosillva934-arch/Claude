# Suturas · treino de técnica cirúrgica

App para anotar o treino de pontos, nós e coordenação e acompanhar a evolução de
cada técnica: ritmo (segundos por ponto), volume, qualidade, falhas, metas semanais
e constância. Funciona sem internet: tudo fica só no seu aparelho.

| Onde | Arquivo |
| --- | --- |
| Android | **`Suturas.apk`** |
| Computador (Windows, Mac ou Linux) | **`Suturas.html`** |

Os dois são a mesma página: o que muda é só onde ela roda.

## Instalar no Android

1. Baixe `Suturas.apk` no celular (no GitHub, abra o arquivo e use o botão de
   baixar, "Download raw file") e toque no arquivo.
2. Permita a instalação de apps vindos do navegador ou do gerenciador de arquivos.
3. Se o Play Protect avisar que não conhece o app, escolha instalar mesmo assim:
   o aviso aparece porque o app não veio da loja.

Serve em Android 5.0 ou mais novo. Versões novas instalam por cima e mantêm o
histórico. O app não pede permissão nenhuma.

## Técnicas

Já vêm cadastradas:

- **Suturas** (contam pontos): ponto simples, ponto duplo, ponto em U horizontal,
  ponto em U vertical (Donati), ponto em X, chuleio simples, chuleio ancorado e
  sutura intradérmica.
- **Nós** (contam nós): nó de cirurgião, nó manual a duas mãos, a uma mão e nó
  instrumental.
- **Coordenação**: coordenação bimanual e caixa de laparoscopia (contam tempo) e
  transferência com pinças (conta transferências).

Em **Técnicas → Nova** você cria as suas: nome, categoria (Suturas, Nós,
Coordenação ou Outros), se conta repetições ou só tempo, a unidade (pontos, nós,
anastomoses…), uma meta semanal e observações (fio, material). A técnica nova
entra em tudo: listas, gráficos, metas, histórico, planilha e resumo. Dá para
renomear e editar as que vieram prontas, e arquivar as que você não usa (as
sessões continuam nas estatísticas).

## Treinar

Em **Treinar**, escolha a técnica e, se quiser, uma meta para a sessão (por
exemplo, 30 pontos). Toque em **Começar**:

- toque no botão grande a cada ponto ou nó; o anel em volta mostra quanto falta
  para a meta;
- **com as mãos ocupadas, aperte um botão de volume**: ele também conta (dá para
  desligar em Ajustes). No computador, a barra de espaço conta;
- **Desfazer** tira a última contagem, **Falha** anota um ponto refeito ou nó que
  afrouxou, **Pausar** congela o cronômetro;
- o cronômetro continua se a tela apagar ou você trocar de app, e a tela fica
  acesa enquanto você está no treino.

Ao **concluir**, dá para corrigir quantidade, tempo e falhas, dar uma nota de 1 a
5 para a qualidade e escrever uma anotação. O app avisa quando você bate o seu
melhor ritmo. O tempo de cada ponto fica guardado e aparece num gráfico ao abrir
a sessão.

Treinou sem o celular? Use **Registrar** para lançar uma sessão já feita, com dia,
hora, quantidade e tempo.

## Estatísticas

- **Início**: a semana (sessões, tempo, dias treinados, sequência de dias), as
  metas semanais, o calendário de constância das últimas 18 semanas e, para 7,
  30 ou 90 dias ou tudo: tempo de treino por categoria, volume (pontos, nós,
  minutos), cada técnica e quanto o ritmo melhorou.
- **Cada técnica**: total, sessões, ritmo recente e melhor ritmo, tempo,
  qualidade média, falhas, a curva do ritmo sessão a sessão (com a média das 3
  últimas), volume por semana com a linha da meta e a curva da qualidade.
- **Histórico**: todas as sessões por dia, com filtro por categoria.

Toque num gráfico para ver os números; "Ver em tabela" mostra tudo em números.

## Guardar e levar os dados

Em **Ajustes**:

- **Salvar cópia de segurança**: um arquivo `.json` com técnicas e sessões.
  Faça de vez em quando e sempre antes de trocar de celular.
- **Restaurar cópia**: junta a cópia ao que já está no aparelho (sem repetir) ou
  substitui tudo. Serve também para levar o histórico do celular para o
  computador e vice-versa.
- **Exportar planilha**: CSV com todas as sessões, que abre no Excel e no
  Planilhas Google.
- **Resumo da semana**: texto pronto para mandar ao preceptor ou ao grupo.

No computador, os dados ficam guardados **naquele navegador**. Limpar os dados de
navegação apaga o que foi registrado: salve uma cópia antes.

## Para quem for mexer no código

- `web/` tem a página: `app.js` (telas, treino e estatísticas), `graficos.js`
  (gráficos em SVG, sem biblioteca), `estilo.css` e as fontes IBM Plex.
- `src/` tem a casca Android: um WebView que guarda os dados em arquivos
  privados, conta pelos botões de volume, mantém a tela acesa e salva ou abre
  arquivos pelo seletor do sistema.
- `./montar.sh` monta `Suturas.apk` e `Suturas.html` sem Gradle, só com pacotes
  do Ubuntu/Debian (a lista está no começo do script). A cada versão nova,
  aumente `CODIGO` e `NOME` no script.
- `chave-de-teste.jks` assina o APK. Fica no repositório de propósito: assinando
  sempre com a mesma chave, a versão nova instala por cima sem apagar o histórico.
- `node icone.js` redesenha o ícone (precisa do Playwright).
