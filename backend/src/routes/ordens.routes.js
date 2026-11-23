const router = require("express").Router();
const prisma = require("../prisma");
const { texto, tratarErro } = require("../utils/helpers");

const include = {
  cliente: true,
  categoria: true,
  funcionario: { select: { id: true, username: true } },
  pecas: { include: { peca: true } },
};

// ---------- KANBAN ----------
// GET /ordens/kanban -> { aFazer, fazendo, feito (só as 3 últimas) }
router.get("/kanban", async (req, res) => {
  try {
    const [aFazer, fazendo, feito] = await Promise.all([
      prisma.ordemServico.findMany({ where: { status: "A_FAZER" }, orderBy: { criadoEm: "asc" }, include }),
      prisma.ordemServico.findMany({ where: { status: "FAZENDO" }, orderBy: { criadoEm: "asc" }, include }),
      prisma.ordemServico.findMany({ where: { status: "FEITO" }, orderBy: { concluidoEm: "desc" }, take: 3, include }),
    ]);
    res.json({ aFazer, fazendo, feito });
  } catch (err) { tratarErro(res, err); }
});

// ---------- CRUD ----------
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (["A_FAZER", "FAZENDO", "FEITO"].includes(req.query.status)) where.status = req.query.status;
    res.json(await prisma.ordemServico.findMany({ where, orderBy: { criadoEm: "desc" }, include }));
  } catch (err) { tratarErro(res, err); }
});

router.get("/:id", async (req, res) => {
  try {
    const o = await prisma.ordemServico.findUnique({ where: { id: req.params.id }, include });
    if (!o) return res.status(404).json({ error: "Ordem não encontrada." });
    res.json(o);
  } catch (err) { tratarErro(res, err); }
});

// POST /ordens -> criação interna pelo funcionário (cliente já deve existir)
router.post("/", async (req, res) => {
  try {
    const clienteCpf = String(req.body.clienteCpf ?? "").replace(/\D/g, "");
    const problema = texto(req.body.problema);
    const descricao = texto(req.body.descricao);
    if (!clienteCpf || !problema || problema.length > 50 || !descricao || descricao.length > 250)
      return res.status(400).json({ error: "Informe clienteCpf, problema (máx. 50) e descricao (máx. 250)." });
    const cliente = await prisma.cliente.findUnique({ where: { cpf: clienteCpf } });
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado." });
    const ordem = await prisma.ordemServico.create({
      data: {
        clienteCpf, problema, descricao,
        fotoUrl: texto(req.body.fotoUrl) || null,
        categoriaId: req.body.categoriaId || null,
      },
      include,
    });
    res.status(201).json(ordem);
  } catch (err) { tratarErro(res, err); }
});

// PUT /ordens/:id -> edita dados do chamado (status/funcionário mudam só pelas ações abaixo)
router.put("/:id", async (req, res) => {
  try {
    const data = {};
    if (req.body.problema !== undefined) {
      const p = texto(req.body.problema);
      if (!p || p.length > 50) return res.status(400).json({ error: "Problema inválido (máx. 50)." });
      data.problema = p;
    }
    if (req.body.descricao !== undefined) {
      const d = texto(req.body.descricao);
      if (!d || d.length > 250) return res.status(400).json({ error: "Descrição inválida (máx. 250)." });
      data.descricao = d;
    }
    if (req.body.fotoUrl !== undefined) data.fotoUrl = texto(req.body.fotoUrl) || null;
    if (req.body.categoriaId !== undefined) data.categoriaId = req.body.categoriaId || null;
    res.json(await prisma.ordemServico.update({ where: { id: req.params.id }, data, include }));
  } catch (err) { tratarErro(res, err); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.ordemServico.delete({ where: { id: req.params.id } }); // pivô cai em cascata
    res.json({ message: "Ordem removida." });
  } catch (err) { tratarErro(res, err); }
});

// ---------- AÇÕES DO KANBAN ----------
// PATCH /ordens/:id/aceitar  (A_FAZER -> FAZENDO, atômico: evita 2 funcionários no mesmo card)
router.patch("/:id/aceitar", async (req, res) => {
  try {
    const r = await prisma.ordemServico.updateMany({
      where: { id: req.params.id, status: "A_FAZER", funcionarioId: null },
      data: { status: "FAZENDO", funcionarioId: req.userId },
    });
    if (r.count === 0) {
      const existe = await prisma.ordemServico.findUnique({ where: { id: req.params.id } });
      if (!existe) return res.status(404).json({ error: "Ordem não encontrada." });
      return res.status(409).json({ error: "Este serviço já foi aceito por outro funcionário." });
    }
    res.json(await prisma.ordemServico.findUnique({ where: { id: req.params.id }, include }));
  } catch (err) { tratarErro(res, err); }
});

// PATCH /ordens/:id/devolver  (FAZENDO -> A_FAZER, só o dono)
router.patch("/:id/devolver", async (req, res) => {
  try {
    const o = await prisma.ordemServico.findUnique({ where: { id: req.params.id } });
    if (!o) return res.status(404).json({ error: "Ordem não encontrada." });
    if (o.status !== "FAZENDO") return res.status(409).json({ error: "A ordem não está em andamento." });
    if (o.funcionarioId !== req.userId)
      return res.status(403).json({ error: "Apenas o funcionário responsável pode devolver." });
    res.json(await prisma.ordemServico.update({
      where: { id: o.id }, data: { status: "A_FAZER", funcionarioId: null }, include,
    }));
  } catch (err) { tratarErro(res, err); }
});

// PATCH /ordens/:id/concluir  body: { videoUrl: "teste x11" }  (FAZENDO -> FEITO)
router.patch("/:id/concluir", async (req, res) => {
  try {
    const videoUrl = texto(req.body.videoUrl);
    if (!videoUrl) return res.status(400).json({ error: "Informe o vídeo de teste (nome/identificação) para concluir." });

    const o = await prisma.ordemServico.findUnique({ where: { id: req.params.id } });
    if (!o) return res.status(404).json({ error: "Ordem não encontrada." });
    if (o.status !== "FAZENDO") return res.status(409).json({ error: "A ordem não está em andamento." });
    if (o.funcionarioId !== req.userId)
      return res.status(403).json({ error: "Apenas o funcionário responsável pode concluir." });

    const concluida = await prisma.$transaction(async (tx) => {
      const atual = await tx.ordemServico.update({
        where: { id: o.id },
        data: { status: "FEITO", videoUrl, concluidoEm: new Date() },
        include,
      });

      // Mantém só as 3 últimas em FEITO; as mais antigas viram log e saem da tabela de OS
      const antigas = await tx.ordemServico.findMany({
        where: { status: "FEITO" },
        orderBy: { concluidoEm: "desc" },
        skip: 3,
        include,
      });
      for (const a of antigas) {
        await tx.logServico.create({
          data: {
            ordemIdOriginal: a.id,
            clienteCpf: a.clienteCpf,
            clienteNome: a.cliente.nome,
            problema: a.problema,
            descricao: a.descricao,
            fotoUrl: a.fotoUrl,
            videoUrl: a.videoUrl,
            funcionarioNome: a.funcionario?.username ?? null,
            pecasJson: a.pecas.map((p) => ({ nome: p.peca.nome, preco: p.peca.preco, quantidade: p.quantidade })),
            concluidoEm: a.concluidoEm,
          },
        });
        await tx.ordemServico.delete({ where: { id: a.id } });
      }
      return atual;
    });

    res.json(concluida);
  } catch (err) { tratarErro(res, err); }
});

// ---------- N:N  ORDEM <-> PEÇA ----------
// POST /ordens/:id/pecas/:idPeca   body: { quantidade }
router.post("/:id/pecas/:idPeca", async (req, res) => {
  try {
    const quantidade = req.body.quantidade === undefined ? 1 : Number(req.body.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1)
      return res.status(400).json({ error: "Quantidade deve ser um inteiro maior que 0." });

    const [ordem, peca] = await Promise.all([
      prisma.ordemServico.findUnique({ where: { id: req.params.id } }),
      prisma.peca.findUnique({ where: { id: req.params.idPeca } }),
    ]);
    if (!ordem) return res.status(404).json({ error: "Ordem não encontrada." });
    if (!peca) return res.status(404).json({ error: "Peça não encontrada." });

    const link = await prisma.ordemServicoPeca.create({
      data: { ordemId: ordem.id, pecaId: peca.id, quantidade },
      include: { peca: true },
    });
    res.status(201).json(link);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Peça já associada a esta ordem." });
    tratarErro(res, err);
  }
});

// GET /ordens/:id/pecas
router.get("/:id/pecas", async (req, res) => {
  try {
    const ordem = await prisma.ordemServico.findUnique({ where: { id: req.params.id } });
    if (!ordem) return res.status(404).json({ error: "Ordem não encontrada." });
    const links = await prisma.ordemServicoPeca.findMany({
      where: { ordemId: req.params.id },
      include: { peca: true },
    });
    res.json(links.map((l) => ({ quantidade: l.quantidade, peca: l.peca })));
  } catch (err) { tratarErro(res, err); }
});

// DELETE /ordens/:id/pecas/:idPeca
router.delete("/:id/pecas/:idPeca", async (req, res) => {
  try {
    await prisma.ordemServicoPeca.delete({
      where: { ordemId_pecaId: { ordemId: req.params.id, pecaId: req.params.idPeca } },
    });
    res.json({ message: "Associação removida." });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Associação não encontrada." });
    tratarErro(res, err);
  }
});

module.exports = router;
