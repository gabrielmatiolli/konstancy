// Ícones do PWA a partir do símbolo (K de quadrados): node scripts/gerar-icones.mjs
import sharp from "sharp";

const FLORESTA = "#08372a";
const VERDE = "#12b76a";
const QUADRADOS = [
  [0, 0], [0, 10], [0, 20], [0, 30], [0, 40],
  [10, 20], [20, 10], [30, 0], [20, 30],
];

/** `escala`: quanto do ícone o K ocupa — o maskable precisa caber na zona segura (80%). */
function svg(lado, escala, cantos = true) {
  const altura = lado * escala;
  const s = altura / 48;
  const largura = 38 * s;
  const ox = (lado - largura) / 2;
  const oy = (lado - altura) / 2;
  const r = (x, y, cor) =>
    `<rect x="${ox + x * s}" y="${oy + y * s}" width="${8 * s}" height="${8 * s}" rx="${2.5 * s}" fill="${cor}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" ${cantos ? `rx="${lado * 0.22}"` : ""} fill="${FLORESTA}"/>
  ${QUADRADOS.map(([x, y]) => r(x, y, VERDE)).join("")}
  ${r(30, 40, "#ffffff")}
</svg>`;
}

// Badge da barra de status do Android: só o alfa importa (o K em branco).
const badge = (() => {
  const s = 1.6;
  const ox = (96 - 38 * s) / 2;
  const oy = (96 - 48 * s) / 2;
  const todos = [...QUADRADOS, [30, 40]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${todos
    .map(([x, y]) => `<rect x="${ox + x * s}" y="${oy + y * s}" width="${8 * s}" height="${8 * s}" rx="${2.5 * s}" fill="#fff"/>`)
    .join("")}</svg>`;
})();

const saida = "public/icones";
// O Android e o iOS aplicam a própria máscara: os ícones "any" e o apple-icon vão sem cantos.
await sharp(Buffer.from(svg(192, 0.6, false))).png().toFile(`${saida}/icone-192.png`);
await sharp(Buffer.from(svg(512, 0.6, false))).png().toFile(`${saida}/icone-512.png`);
await sharp(Buffer.from(svg(512, 0.46, false))).png().toFile(`${saida}/icone-maskable-512.png`);
await sharp(Buffer.from(svg(180, 0.6, false))).png().toFile("src/app/apple-icon.png");
await sharp(Buffer.from(badge)).png().toFile(`${saida}/badge-96.png`);
// Favicon da aba: com cantos, fica melhor sobre a barra do navegador.
await sharp(Buffer.from(svg(48, 0.62, true))).png().toFile("src/app/icon.png");
console.log("Ícones gerados.");
