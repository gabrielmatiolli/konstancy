# Konstancy

PWA para a família registrar check-ins diários de atividade física, no estilo BeReal:
foto + descrição, curtidas, comentários, push quando alguém treina e desafios com data
de fim e prêmio.

Stack: Next.js 16 (App Router, Server Actions) · Prisma 7 + MySQL/MariaDB · Web Push
(VAPID, `web-push`) · `sharp` para as fotos · Tailwind 4. Deploy como app Node.js na
Hostinger, igual ao RR Film e à Multipatas.

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
    api/cron/           lembrete diário e encerramento de desafios
    manifest.ts         manifesto do PWA
  componentes/          UI (provisória — o design vem depois)
  lib/
    auth.ts             sessão em cookie JWT (jose) + bcrypt
    familia.ts          família ativa, convites
    datas.ts            "dia civil" em America/Sao_Paulo
    fotos.ts            sharp → WebP + miniatura, gravado em STORAGE_DIR
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

1. Suba o MySQL local (serviço `MySQL80`, precisa de terminal como administrador).
2. Preencha a senha na `DATABASE_URL` do `.env.local` (caracteres especiais codificados).
3. Crie o banco e aplique as migrations, depois o seed:

```bash
npx prisma migrate dev
```

```bash
npm run db:seed
```

4. `npm run dev` e abra http://localhost:3000 — contas de teste no `prisma/seed.ts`.

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

## Deploy na Hostinger

1. Crie o `.env` de produção a partir do `.env.example`:
   - `SESSAO_SEGREDO` e `CRON_SEGREDO` novos (não reaproveitar os de dev);
   - as chaves VAPID podem ser as mesmas do dev ou novas (`npm run vapid`). **Trocar as
     chaves depois invalida todas as inscrições de push** — cada um precisa reativar;
   - `STORAGE_DIR` apontando para uma pasta **fora** da pasta do app (ex.:
     `/home/<usuario>/konstancy-fotos`), senão as fotos somem no próximo deploy.
2. Aplique as migrations no banco da Hostinger: `npm run db:deploy`.
3. `python scripts/empacotar.py` gera `konstancy.zip`; suba como app Node.js.
4. E-mail: crie uma conta de e-mail no domínio (hPanel → E-mails), por exemplo
   `nao-responda@dominio`, e preencha `SMTP_*` e `EMAIL_REMETENTE` no `.env`
   (`smtp.hostinger.com`, porta 465). Configure SPF/DKIM do domínio (o hPanel faz) para
   os códigos não caírem no spam. Sem SMTP, em produção o envio falha com erro claro.
5. Cron jobs no hPanel (horário do servidor é UTC):
   - lembrete às 19h de Brasília → `0 22 * * *`
     `curl -s -H "Authorization: Bearer $CRON_SEGREDO" "https://<dominio>/api/cron?tarefa=lembrete"`
   - encerrar desafios às 0h10 de Brasília → `10 3 * * *`
     `curl -s -H "Authorization: Bearer $CRON_SEGREDO" "https://<dominio>/api/cron?tarefa=encerrar"`

## Próximos passos

- Design (Figma) e ícones definitivos.
- Foto de perfil, reações com emoji, "dupla câmera" (frente + traseira) como no BeReal.
- Trocar o `STORAGE_DIR` por S3/R2 se o volume de fotos crescer (`src/lib/fotos.ts`).
- Recuperação de senha por e-mail.
