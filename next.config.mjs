/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite abrir o dev server pelo IP da rede local e pelo túnel HTTPS do
  // Cloudflare (testar câmera e push no celular — ver README).
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*", "192.168.15.*", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      // A foto do check-in sobe por Server Action. O celular já comprime para
      // ~0,3 MB; o teto acompanha o da Vercel (4,5 MB por requisição) e a tela
      // avisa antes de tentar mandar algo maior.
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
