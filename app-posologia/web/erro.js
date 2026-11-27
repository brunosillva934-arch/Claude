/* se algo quebrar, o motivo aparece na tela em vez de uma página em branco */
window.addEventListener("error", function (e) {
  var n = document.getElementById("erro");
  if (!n) return;
  n.hidden = false;
  n.textContent = "Algo falhou no app: " + (e.message || "erro desconhecido") + (e.lineno ? " (linha " + e.lineno + ")" : "") + ". As bulas salvas continuam no aparelho.";
});
