import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envio de e-mail por SMTP — a conta de e-mail do domínio na Hostinger serve
 * (smtp.hostinger.com, porta 465). Sem SMTP configurado, em desenvolvimento o
 * e-mail é impresso no terminal do `next dev`; em produção, falha alto.
 */

let transporte: Transporter | null | undefined;

function obterTransporte() {
  if (transporte !== undefined) return transporte;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporte = null;
    return null;
  }
  const porta = Number(process.env.SMTP_PORTA || 465);
  transporte = nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA },
  });
  return transporte;
}

export interface Email {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}

export async function enviarEmail(email: Email) {
  const smtp = obterTransporte();
  if (!smtp) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP não configurado. Veja o .env.example.");
    console.info(`\n[email:dev] para ${email.para} — ${email.assunto}\n${email.texto}\n`);
    return;
  }
  await smtp.sendMail({
    from: process.env.EMAIL_REMETENTE || process.env.SMTP_USUARIO,
    to: email.para,
    subject: email.assunto,
    text: email.texto,
    html: email.html,
  });
}

const escapar = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** E-mail do código: o número grande no topo, legível na prévia da notificação. */
export function emailDeCodigo({ nome, codigo, motivo }: { nome: string; codigo: string; motivo: string }) {
  const primeiroNome = nome.split(" ")[0];
  const texto = `Oi, ${primeiroNome}!\n\nSeu código do Konstancy é: ${codigo}\n\n${motivo} Ele vale por 15 minutos.\n\nSe não foi você, é só ignorar este e-mail.`;
  const html = `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f5f6f4;font-family:Arial,Helvetica,sans-serif;color:#14181a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:20px;padding:32px 28px">
        <tr><td style="font-size:20px;font-weight:bold;color:#157a3f;padding-bottom:20px">Konstancy</td></tr>
        <tr><td style="font-size:16px;line-height:1.5">Oi, ${escapar(primeiroNome)}! Seu código é:</td></tr>
        <tr><td style="padding:20px 0">
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;background:#eef0ec;border-radius:14px;padding:18px 0">${codigo}</div>
        </td></tr>
        <tr><td style="font-size:15px;line-height:1.5;color:#61686e">${escapar(motivo)} Ele vale por 15 minutos.<br><br>Se não foi você, é só ignorar este e-mail.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { texto, html };
}
