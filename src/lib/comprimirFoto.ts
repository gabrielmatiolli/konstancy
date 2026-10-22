/**
 * Reduz a foto da câmera no próprio aparelho antes do envio.
 *
 * Pensado para Android de entrada: decodificar uma foto de 12 MP inteira
 * ocupa ~48 MB de memória e pode derrubar a aba num aparelho de 2 GB. Por
 * isso pedimos ao navegador para decodificar já no tamanho final
 * (createImageBitmap com resizeWidth/resizeHeight, que o Chrome faz sem
 * passar pela imagem cheia). Onde isso não existe, cai no <img> + canvas.
 */

/** Lado maior enviado. O servidor ainda gera 1440/720/240 a partir disto. */
const LADO_ENVIO = 1600;
const QUALIDADE = 0.8;

/** Dimensões já com a orientação do EXIF aplicada (o <img> faz isso desde 2020). */
function carregarImagem(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem ilegível"));
    img.src = url;
  });
}

export async function comprimirFoto(arquivo: File): Promise<Blob> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregarImagem(url);
    const escala = Math.min(1, LADO_ENVIO / Math.max(img.naturalWidth, img.naturalHeight));
    const largura = Math.round(img.naturalWidth * escala);
    const altura = Math.round(img.naturalHeight * escala);

    // Pequena o bastante e já JPEG: manda como está.
    if (escala === 1 && arquivo.type === "image/jpeg" && arquivo.size < 1_500_000) return arquivo;

    let fonte: CanvasImageSource = img;
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(arquivo, {
        imageOrientation: "from-image",
        resizeWidth: largura,
        resizeHeight: altura,
        resizeQuality: "medium",
      });
      // Navegador que redimensiona antes de girar devolve retrato/paisagem
      // trocado — aí o <img>, que já vem girado, é a fonte segura.
      if (bitmap.width > bitmap.height === largura > altura) fonte = bitmap;
    } catch {
      // sem suporte às opções: segue com o <img>
    }

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(fonte, 0, 0, largura, altura);
    bitmap?.close();

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", QUALIDADE));
    // Libera a memória do canvas na hora — em aparelho fraco o GC demora.
    canvas.width = canvas.height = 0;
    return blob ?? arquivo;
  } catch {
    // HEIC em Android, arquivo estranho: manda o original e o servidor decide.
    return arquivo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
