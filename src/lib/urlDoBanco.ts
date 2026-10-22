/**
 * A DATABASE_URL como o driver `mariadb` deve recebê-la.
 *
 * Módulo sem dependência de Next de propósito: o seed (prisma/seed.ts) importa
 * isto por caminho relativo, fora do bundler.
 */

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function urlDoDriver(bruta: string): string {
  let url: URL;
  try {
    url = new URL(bruta);
  } catch {
    // O erro nativo do `new URL` carrega a URL inteira no campo `input` — com a
    // senha do banco — e o Next imprime isso no log a cada request. A mensagem
    // própria explica o problema mais comum sem repetir a credencial.
    throw new Error(
      "DATABASE_URL inválida. Se a senha tem caracteres especiais, eles precisam " +
        "ir codificados na URL: # vira %23, @ vira %40, : vira %3A, / vira %2F.",
    );
  }

  // MySQL 8 autentica com caching_sha2_password. Sem TLS, quando o cache de
  // autenticação do servidor está frio (logo depois de o MySQL subir), a senha
  // só pode ir cifrada com a chave RSA do servidor — e o driver só pede essa
  // chave se receber allowPublicKeyRetrieval. Sem isso, se o app for o primeiro
  // a conectar, cada conexão falha e o pool estoura o tempo com "active=0
  // idle=0" (ver caching-sha2-password-auth.js do driver).
  //
  // Só em loopback: pedir a chave a um servidor remoto deixaria um intermediário
  // trocá-la pela dele. No MariaDB da Hostinger esse plugin nem existe, então o
  // parâmetro não tem efeito em produção.
  if (LOOPBACK.has(url.hostname) && !url.searchParams.has("allowPublicKeyRetrieval")) {
    url.searchParams.set("allowPublicKeyRetrieval", "true");
  }

  return url.toString();
}
