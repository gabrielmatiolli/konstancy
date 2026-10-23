-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `avatarVersao` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `emailVerificadoEm` DATETIME(3) NULL,
    ADD COLUMN `telefone` VARCHAR(20) NULL;

-- CreateTable
CREATE TABLE `CodigoVerificacao` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `finalidade` ENUM('CONFIRMAR_EMAIL', 'RECUPERAR_SENHA') NOT NULL,
    `codigoHash` VARCHAR(64) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `expiraEm` DATETIME(3) NOT NULL,
    `usadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CodigoVerificacao_usuarioId_finalidade_criadoEm_idx`(`usuarioId`, `finalidade`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_telefone_key` ON `Usuario`(`telefone`);

-- AddForeignKey
ALTER TABLE `CodigoVerificacao` ADD CONSTRAINT `CodigoVerificacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
