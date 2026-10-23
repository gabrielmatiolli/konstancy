# Konstancy

PWA para a família registrar check-ins diários de atividade física, no estilo BeReal:
foto + descrição, curtidas, comentários, push quando alguém treina e desafios com data
de fim e prêmio.

Stack: Next.js 16 (App Router, Server Actions) · Prisma 7 + PostgreSQL (Neon) · Web Push
(VAPID, `web-push`) · `sharp` para as fotos, guardadas no Cloudflare R2 · Tailwind 4.
Deploy na Vercel.

## Funcionalidades

| Tela | Rota | O que faz |
| --- | --- | --- |
| Início | `/` | Quem já treinou hoje (anéis nos avatares), CTA do check-in e o feed da última semana |
| Check-in | `/checkin/novo` | Câmera do celular, atividade, duração e descrição. A foto é comprimida no aparelho |
| Check-in | `/checkin/[id]` | Foto grande, curtidas e comentários |
| Painel | `/painel` | Grade pessoa × dia (7/14/30 dias) com as miniaturas; linha de "treinaram x/y" |
| Desafios | `/desafios`, `/desafios/novo`, `/desafios/[id]` | Período, prêmio, placar, sequência 🔥 e vencedor |
| Perfil | `/perfil` | Estatísticas, ligar/desligar notificações neste aparelho |
| Família | `/familia` | Convite (código + link para WhatsApp), membros, admins, modo BeReal |
| Onboarding | `/cadastro`, `/entrar`, `/comecar`, `/convite/[codigo]` | Conta, criar família ou entrar por convite |

**Modo BeReal** (ligado por padrão, configurável pela família): as fotos de hoje dos
outros ficam borradas até você postar a sua. O borrão é aplicado no servidor
(`/api/fotos/[id]`), não só no CSS.

**Regra dos desafios:** vence quem fizer check-in em mais dias distintos entre o início
e o fim. Vários check-ins no mesmo dia contam uma vez; empate divide o prêmio. O placar é
calculado na hora a partir dos check-ins (`src/lib/desafios.ts`).

**Conta:** login com e-mail **ou** celular e senha. O e-mail é confirmado por um código
de 6 números (não bloqueia o uso; o app avisa até confirmar), e é por ele que a senha é
recuperada: código no e-mail → senha nova → as outras sessões caem. Códigos guardados
só como HMAC, valem 15 min, 5 tentativas, 1 envio por minuto e 5 por hora. Foto de
perfil em 256px (`/api/avatar/[id]`), visível só para quem divide uma família. SMS ainda
não: o celular é guardado em E.164 (`+5511…`) para um provedor entrar depois.

**Push enviado quando:** alguém da família faz check-in · curtem seu check-in ·
comentam no seu check-in (ou numa conversa em que você comentou) · sai um desafio novo ·
um desafio termina (cron) · lembrete de fim de tarde para quem não treinou (cron).

## Estrutura

```
prisma/
  schema.prisma         Usuario, Familia, Membro, Checkin, Comentario, Curtida,
                        Desafio, Participante, InscricaoPush
  migrations/           SQL versionado — aplicar com npm run db:deploy
  seed.ts               família de teste (só banco local)
public/
  sw.js                 service worker: recebe o push e abre a tela certa
  icones/               ícones provisórios (scripts/gerar-icones.mjs)
src/
  acoes/                Server Actions: auth, familia, checkins (+curtidas/comentários),
                        desafios, push
  app/
    (publico)/          entrar, cadastro
    (app)/              telas logadas, com navegação inferior
    comecar/            onboarding sem família
    convite/[codigo]/   link de convite
    api/fotos/[id]/     serve as fotos só para membros (e borra quando precisa)
    api/cron/[tarefa]/  lembrete diário e encerramento de desafios (cron da Vercel)
    manifest.ts         manifesto do PWA
  componentes/          UI (provisória — o design vem depois)
  lib/
    auth.ts             sessão em cookie JWT (jose) + bcrypt
    familia.ts          família ativa, convites
    datas.ts            "dia civil" em America/Sao_Paulo
    fotos.ts            sharp → WebP em três tamanhos
    armazenamento.ts    R2/S3 em produção, pasta local em dev
    push.ts             envio Web Push e limpeza de inscrições mortas
    desafios.ts         placar
    consultas.ts        consultas do feed e regra do borrão
```

## Design e desempenho

Pensado primeiro para Android de entrada (tela de 360px, 2 GB de RAM, 4G fraco), com a
mesma cara em Android, iPhone e desktop:

- **Mesmo visual em todo sistema:** fonte Figtree servida pelo próprio app, ícones SVG
  (`lucide-react`) em vez de emoji, e controles próprios (interruptor, chips, folha de
  confirmação) em vez dos nativos. Tokens de cor em `src/app/globals.css`, com modo escuro.
- **Fotos em três tamanhos:** 1440px só na tela do check-in, 720px no feed (~76 KB numa
  foto real, contra ~365 KB da grande) e 240px no painel (~12 KB). Check-ins antigos ganham
  a versão média na primeira visita.
- **Compressão no aparelho com pouca memória:** a foto da câmera é decodificada já reduzida
  (`createImageBitmap` com `resizeWidth`) e sobe com ~1600px, respeitando a rotação do EXIF.
- **Rolagem leve:** sem `backdrop-filter` nem sombras grandes; cards fora da tela não são
  desenhados (`content-visibility`) e as fotos só baixam quando chegam perto da tela.
- **Resposta imediata:** esqueleto de carregamento a cada toque (`loading.tsx`), curtida
  otimista e botões com estado de envio.
- **Instalação:** no Android, botão "Instalar app" (evento `beforeinstallprompt`); no
  iPhone, passo a passo. Ver `src/componentes/InstalarApp.tsx`.

Peso do feed em produção: ~149 KB de JS, ~20 KB de fonte e ~8 KB de CSS (comprimidos),
mais as fotos visíveis.

## Rodar local

1. Suba o Postgres local (o `prisma dev`, sem instalar nada além do npm):

```bash
npm run db:local
```

2. Copie o `.env.example` para `.env.local` (a `DATABASE_URL` de exemplo já é a do
   `prisma dev`) e aplique as migrations e o seed:

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

3. `npm run dev` e abra http://localhost:3000 — contas de teste no `prisma/seed.ts`.
   Sem `S3_BUCKET`, as fotos ficam em `./uploads`; sem SMTP, os códigos de e-mail
   aparecem no terminal.

### Testar no celular (Safari/iPhone)

Aberto por `http://192.168.x.x:3000`, o Safari trata a página como não segura e
desliga service worker, push, compartilhar e área de transferência. O app avisa e cai
para alternativas, mas para testar push e o compartilhamento de verdade é preciso
HTTPS com certificado válido. O `next dev --experimental-https` não serve no iPhone (o
certificado local não é confiável lá). Use um túnel com o `npm run dev` rodando:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Ele imprime um endereço `https://….trycloudflare.com` público e temporário: abra no
iPhone, toque em Compartilhar → "Adicionar à Tela de Início", abra o app pelo ícone e
ative as notificações no Perfil (iOS 16.4+). Feche o túnel ao terminar — enquanto ele
roda, qualquer pessoa com o endereço alcança o servidor de dev.

## Deploy na Vercel (plano grátis)

Peças, todas com plano gratuito: **Vercel** (app), **Neon** (Postgres, criado pelo painel
da Vercel), **Cloudflare R2** (fotos) e **Gmail** (e-mail dos códigos). O plano Hobby da
Vercel é para uso pessoal/não comercial — ao cobrar pelo app, é preciso o Pro.

1. Código no GitHub (repositório privado) e projeto importado na Vercel.
2. Vercel → Storage → **Neon**: cria o banco e as variáveis `DATABASE_URL` e
   `DATABASE_URL_UNPOOLED`. Escolha a região mais perto de São Paulo; o `vercel.json` põe
   as funções em `gru1` (São Paulo) — se o banco ficar em outra região, troque lá para a
   mesma (ex.: `iad1` para Virginia), porque cada página faz várias consultas.
3. Cloudflare → R2: crie o bucket (`konstancy-fotos`) e um token de API "Object Read &
   Write" para ele. As fotos continuam passando pelo app (`/api/fotos`), que confere a
   família e aplica o borrão — o bucket fica privado.
4. Gmail: verificação em duas etapas + "senha de app"; `smtp.gmail.com`, porta 465.
5. Variáveis no painel da Vercel — a lista completa está no `.env.example` (as de
   produção geradas ficam no `.env.producao.local`, fora do git).
6. Deploy. O script `vercel-build` aplica as migrations no Neon antes do build (só em
   produção, nunca em deploys de prévia) — ver `scripts/migrar-producao.mjs`.
7. Os crons do `vercel.json` (lembrete às 19h e encerramento à 0h10, horário de Brasília)
   passam a rodar sozinhos; no Hobby, uma vez por dia, em algum minuto da hora marcada.

## Próximos passos

- Design (Figma) e ícones definitivos.
- Foto de perfil, reações com emoji, "dupla câmera" (frente + traseira) como no BeReal.
- Recuperação de senha por e-mail.
