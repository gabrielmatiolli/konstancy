-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PapelNaFamilia" AS ENUM ('ADMIN', 'MEMBRO');

-- CreateEnum
CREATE TYPE "FinalidadeDoCodigo" AS ENUM ('CONFIRMAR_EMAIL', 'RECUPERAR_SENHA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "telefone" VARCHAR(20),
    "emailVerificadoEm" TIMESTAMP(3),
    "senhaHash" VARCHAR(100) NOT NULL,
    "avatarVersao" INTEGER NOT NULL DEFAULT 0,
    "versaoSessao" INTEGER NOT NULL DEFAULT 0,
    "familiaAtivaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "codigoConvite" VARCHAR(12) NOT NULL,
    "borrarAtePostar" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membro" (
    "usuarioId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "papel" "PapelNaFamilia" NOT NULL DEFAULT 'MEMBRO',
    "entrouEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membro_pkey" PRIMARY KEY ("usuarioId","familiaId")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "fotoPath" VARCHAR(255) NOT NULL,
    "thumbPath" VARCHAR(255) NOT NULL,
    "largura" INTEGER NOT NULL,
    "altura" INTEGER NOT NULL,
    "descricao" TEXT,
    "atividade" VARCHAR(40),
    "duracaoMin" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curtida" (
    "checkinId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Curtida_pkey" PRIMARY KEY ("checkinId","usuarioId")
);

-- CreateTable
CREATE TABLE "Desafio" (
    "id" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "criadorId" TEXT NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "premio" VARCHAR(200) NOT NULL,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "encerradoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participante" (
    "desafioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "entrouEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("desafioId","usuarioId")
);

-- CreateTable
CREATE TABLE "InscricaoPush" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "p256dh" VARCHAR(200) NOT NULL,
    "auth" VARCHAR(100) NOT NULL,
    "userAgent" VARCHAR(255),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoVerificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "finalidade" "FinalidadeDoCodigo" NOT NULL,
    "codigoHash" VARCHAR(64) NOT NULL,
    "destino" VARCHAR(191) NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoVerificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefone_key" ON "Usuario"("telefone");

-- CreateIndex
CREATE INDEX "Usuario_familiaAtivaId_idx" ON "Usuario"("familiaAtivaId");

-- CreateIndex
CREATE UNIQUE INDEX "Familia_codigoConvite_key" ON "Familia"("codigoConvite");

-- CreateIndex
CREATE INDEX "Membro_familiaId_idx" ON "Membro"("familiaId");

-- CreateIndex
CREATE INDEX "Checkin_familiaId_dia_idx" ON "Checkin"("familiaId", "dia");

-- CreateIndex
CREATE INDEX "Checkin_usuarioId_dia_idx" ON "Checkin"("usuarioId", "dia");

-- CreateIndex
CREATE INDEX "Comentario_checkinId_criadoEm_idx" ON "Comentario"("checkinId", "criadoEm");

-- CreateIndex
CREATE INDEX "Curtida_usuarioId_idx" ON "Curtida"("usuarioId");

-- CreateIndex
CREATE INDEX "Desafio_familiaId_dataFim_idx" ON "Desafio"("familiaId", "dataFim");

-- CreateIndex
CREATE INDEX "Desafio_criadorId_idx" ON "Desafio"("criadorId");

-- CreateIndex
CREATE INDEX "Participante_usuarioId_idx" ON "Participante"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPush_endpoint_key" ON "InscricaoPush"("endpoint");

-- CreateIndex
CREATE INDEX "InscricaoPush_usuarioId_idx" ON "InscricaoPush"("usuarioId");

-- CreateIndex
CREATE INDEX "CodigoVerificacao_usuarioId_finalidade_criadoEm_idx" ON "CodigoVerificacao"("usuarioId", "finalidade", "criadoEm");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_familiaAtivaId_fkey" FOREIGN KEY ("familiaAtivaId") REFERENCES "Familia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "Checkin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curtida" ADD CONSTRAINT "Curtida_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "Checkin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curtida" ADD CONSTRAINT "Curtida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desafio" ADD CONSTRAINT "Desafio_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "Desafio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participante" ADD CONSTRAINT "Participante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoVerificacao" ADD CONSTRAINT "CodigoVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
