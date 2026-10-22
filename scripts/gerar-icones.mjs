// Ícones provisórios do PWA (até o design definitivo): node scripts/gerar-icones.mjs
import sharp from "sharp";

const cor = "#16a34a";
const svg = (lado, margem) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${cor}"/>
  <g transform="translate(50 50) scale(${1 - margem}) translate(-50 -50)">
    <path d="M28 52 L44 68 L74 34" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const badge = `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 100 100">
  <path d="M22 52 L42 72 L80 30" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const saida = "public/icones";
await sharp(Buffer.from(svg(192, 0))).png().toFile(`${saida}/icone-192.png`);
await sharp(Buffer.from(svg(512, 0))).png().toFile(`${saida}/icone-512.png`);
// Maskable: o Android recorta em círculo/squircle — o desenho fica na zona segura de 80%.
await sharp(Buffer.from(svg(512, 0.25))).png().toFile(`${saida}/icone-maskable-512.png`);
await sharp(Buffer.from(svg(180, 0))).png().toFile("src/app/apple-icon.png");
// Badge da barra de status do Android: só o alfa importa.
await sharp(Buffer.from(badge)).png().toFile(`${saida}/badge-96.png`);
await sharp(Buffer.from(svg(48, 0))).resize(48).png().toFile("src/app/icon.png");
console.log("Ícones gerados.");
