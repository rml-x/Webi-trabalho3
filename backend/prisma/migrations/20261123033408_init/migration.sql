-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('A_FAZER', 'FAZENDO', 'FEITO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "cpf" CHAR(11) NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "whatsapp" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("cpf")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "problema" VARCHAR(50) NOT NULL,
    "descricao" VARCHAR(250) NOT NULL,
    "fotoUrl" TEXT,
    "videoUrl" TEXT,
    "status" "StatusOS" NOT NULL DEFAULT 'A_FAZER',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),
    "clienteCpf" CHAR(11) NOT NULL,
    "funcionarioId" TEXT,
    "categoriaId" TEXT,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pecas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "estoque" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "pecas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico_pecas" (
    "ordemId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ordem_servico_pecas_pkey" PRIMARY KEY ("ordemId","pecaId")
);

-- CreateTable
CREATE TABLE "log_servicos" (
    "id" TEXT NOT NULL,
    "ordemIdOriginal" TEXT NOT NULL,
    "clienteCpf" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "problema" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "videoUrl" TEXT,
    "funcionarioNome" TEXT,
    "pecasJson" JSONB,
    "concluidoEm" TIMESTAMP(3) NOT NULL,
    "arquivadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteCpf_fkey" FOREIGN KEY ("clienteCpf") REFERENCES "clientes"("cpf") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pecas" ADD CONSTRAINT "pecas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_pecas" ADD CONSTRAINT "ordem_servico_pecas_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico_pecas" ADD CONSTRAINT "ordem_servico_pecas_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "pecas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
