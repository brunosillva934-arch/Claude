# Instrumentação Cirúrgica Visual — treino

Treinador dos 98 instrumentais (+ 2 comparações) do material "Instrumentação Cirúrgica Visual — 100 Instrumentais Essenciais".

- `instrumentacao.html` — a página publicada (dados embutidos); as imagens ficam em `img/`
  - `img/m/` instrumental recortado, sem nome nem número gravado
  - `img/d/` lupa de detalhe da ponta
  - `img/p/` página original inteira
- `fonte/items.jsonl` — transcrição das 100 páginas (nome, seções, recortes)
- `fonte/pagina.html` — página com o marcador `__DATA__` no lugar dos dados
- `scripts/` — geração de dados, recortes e HTML; `judge_test.js` testa a correção da resposta digitada

Artefato: https://claude.ai/artifact/P7yBociFpqg7rwQyeiu1m5
