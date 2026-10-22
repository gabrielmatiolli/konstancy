"""Gera saude-check.zip para subir como app Node.js na Hostinger.

Mesmo formato do pacote da Multipatas: o projeto-fonte com `package.json` na raiz
do ZIP, sem `node_modules` nem `.next` — a Hostinger instala, faz o build e sobe
o servidor. Caminhos gravados com barra normal, para extrair certo no Linux
(o Compress-Archive do PowerShell 5.1 grava com contrabarra e quebra a estrutura).

Uso, na raiz do projeto:
    python scripts/empacotar.py
"""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "saude-check.zip"

# Pastas que nunca entram: dependências e build são refeitos no servidor.
PASTAS_FORA = {
    "node_modules",
    ".next",
    ".git",
    "out",
    "build",
    "coverage",
    ".vercel",
    ".claude",
    ".agents",
    ".windsurf",
    "__pycache__",
}

# `.env` entra se existir (como na Multipatas); os `.env*.local` são só de dev.
def fica_de_fora(caminho: Path) -> bool:
    nome = caminho.name
    if nome.endswith(".zip") or nome.endswith(".tsbuildinfo"):
        return True
    if nome.startswith(".env") and nome != ".env":
        return True
    if nome.startswith("npm-debug.log") or nome in {".DS_Store", "Thumbs.db"}:
        return True
    return False


def arquivos_do_projeto() -> list[Path]:
    encontrados: list[Path] = []
    for item in sorted(RAIZ.rglob("*")):
        relativo = item.relative_to(RAIZ)
        if any(parte in PASTAS_FORA for parte in relativo.parts):
            continue
        # Fotos de check-in do dev são conteúdo local, não do projeto.
        if relativo.parts[:1] == ("uploads",):
            continue
        # O cliente do Prisma é gerado no servidor pelo postinstall.
        if relativo.parts[:3] == ("src", "generated", "prisma"):
            continue
        if item.is_file() and not fica_de_fora(item):
            encontrados.append(item)
    return encontrados


def main() -> int:
    arquivos = arquivos_do_projeto()

    nomes = {f.relative_to(RAIZ).as_posix() for f in arquivos}
    obrigatorios = [
        "package.json",
        "package-lock.json",
        "next.config.mjs",
        "src/app/layout.tsx",
        # Sem estes, o `postinstall` (prisma generate) falha no servidor e o
        # build nem começa.
        "prisma.config.ts",
        "prisma/schema.prisma",
    ]
    faltando = [n for n in obrigatorios if n not in nomes]
    if faltando:
        print(f"Faltando no projeto: {', '.join(faltando)}", file=sys.stderr)
        return 1

    if ".env" not in nomes:
        print(
            "Aviso: sem .env no pacote — a Hostinger vai precisar de DATABASE_URL e"
            " JWT_SECRET configurados no painel, senão o build falha.",
            file=sys.stderr,
        )

    # Pastas intermediárias como entradas próprias, igual ao ZIP da Multipatas.
    pastas = sorted(
        {p.as_posix() + "/" for f in arquivos for p in f.relative_to(RAIZ).parents if p != Path(".")}
    )

    DESTINO.unlink(missing_ok=True)
    with zipfile.ZipFile(DESTINO, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for pasta in pastas:
            zf.writestr(zipfile.ZipInfo(pasta), "")
        for arquivo in arquivos:
            zf.write(arquivo, arquivo.relative_to(RAIZ).as_posix())

    with zipfile.ZipFile(DESTINO) as zf:
        corrompido = zf.testzip()
        entradas = zf.namelist()
    if corrompido:
        print(f"Arquivo corrompido no ZIP: {corrompido}", file=sys.stderr)
        return 1
    if any("\\" in e for e in entradas):
        print("O ZIP tem caminhos com contrabarra.", file=sys.stderr)
        return 1

    tamanho = DESTINO.stat().st_size / 1024 / 1024
    print(f"{DESTINO.name}: {len(arquivos)} arquivos, {tamanho:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
