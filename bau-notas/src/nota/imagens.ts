/**
 * Imagem da galeria ou da câmera (ex.: foto de um exame), guardada dentro do app.
 *
 * No tablet, a casca Android abre a galeria ou a câmera, reduz a foto (no
 * máximo 1600 px no lado maior, corrigindo a rotação) e grava o arquivo na área
 * privada do app; a nota guarda só o endereço interno ("/imagens/…"), servido
 * pela própria casca. No navegador (desenvolvimento), a imagem é reduzida aqui e
 * guardada dentro da nota.
 */
import { chamar, temNativo } from '../nativo/ponte';

const LADO_MAXIMO = 1600;

async function reduzir(arquivo: File): Promise<string> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Abre a galeria (ou a câmera). Devolve o endereço da imagem, ou null se cancelado. */
export async function escolherImagem(camera: boolean): Promise<string | null> {
  if (temNativo) {
    const r = await chamar<{ caminho: string } | null>('imagem.escolher', { camera });
    return r ? r.caminho : null;
  }
  return new Promise((resolver, rejeitar) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.hidden = true;
    if (camera) entrada.setAttribute('capture', 'environment');
    entrada.onchange = () => {
      const arquivo = entrada.files?.[0];
      entrada.remove();
      if (!arquivo) resolver(null);
      else reduzir(arquivo).then(resolver, () => rejeitar(new Error('Não foi possível abrir a imagem')));
    };
    // Precisa estar na página para o seletor de arquivos abrir em todo navegador.
    document.body.appendChild(entrada);
    entrada.click();
  });
}
