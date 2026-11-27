/* SHA-256 em JavaScript puro, para conferir a integridade das bulas guardadas no aparelho.
   Ao salvar, o app grava o resumo do conteúdo; ao abrir, recalcula. Se não bater, a cópia
   foi alterada ou corrompida e não é mostrada. Não depende de crypto.subtle, que alguns
   WebViews antigos e páginas abertas de arquivo local não oferecem. */
(function (raiz) {
  "use strict";

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function utf8(texto) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(texto);
    var s = unescape(encodeURIComponent(texto));
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }

  function sha256(texto) {
    var dados = utf8(String(texto));
    var n = dados.length;
    var total = ((n + 9 + 63) >> 6) << 6; // mensagem + 0x80 + 8 bytes de tamanho, em blocos de 64
    var m = new Uint8Array(total);
    m.set(dados);
    m[n] = 0x80;
    var bits = n * 8;
    var alto = Math.floor(bits / 0x100000000);
    var baixo = bits >>> 0;
    m[total - 8] = (alto >>> 24) & 0xff;
    m[total - 7] = (alto >>> 16) & 0xff;
    m[total - 6] = (alto >>> 8) & 0xff;
    m[total - 5] = alto & 0xff;
    m[total - 4] = (baixo >>> 24) & 0xff;
    m[total - 3] = (baixo >>> 16) & 0xff;
    m[total - 2] = (baixo >>> 8) & 0xff;
    m[total - 1] = baixo & 0xff;

    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var w = new Int32Array(64);

    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) {
        var j = off + i * 4;
        w[i] = (m[j] << 24) | (m[j + 1] << 16) | (m[j + 2] << 8) | m[j + 3];
      }
      for (i = 16; i < 64; i++) {
        var x = w[i - 15], y = w[i - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    var hex = "";
    [h0, h1, h2, h3, h4, h5, h6, h7].forEach(function (v) {
      hex += ("00000000" + (v >>> 0).toString(16)).slice(-8);
    });
    return hex;
  }

  var Integridade = { sha256: sha256 };
  if (typeof module !== "undefined" && module.exports) module.exports = Integridade;
  else raiz.Integridade = Integridade;
})(this);
