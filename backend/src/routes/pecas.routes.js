const router = require("express").Router();
const prisma = require("../prisma");
const { texto, tratarErro } = require("../utils/helpers");

function validar(body, parcial = false) {
  const data = {};
  if (!parcial || body.nome !== undefined) {
    const nome = texto(body.nome);
    if (!nome) return { erro: "Nome é obrigatório." };
    data.nome = nome;
  }
  if (!parcial || body.preco !== undefined) {
    const preco = Number(body.preco);
    if (!Number.isFinite(preco) || preco < 0) return { erro: "Preço inválido." };
    data.preco = preco;
  }
  if (!parcial || body.estoque !== undefined) {
    const estoque = Number(body.estoque);
    if (!Number.isInteger(estoque) || estoque < 0) return { erro: "Estoque inválido." };
    data.estoque = estoque;
  }
  return { data };
}

router.get("/", async (req, res) => {
  try {
    res.json(await prisma.peca.findMany({ orderBy: { nome: "asc" } }));
  } catch (err) { tratarErro(res, err); }
});

router.get("/:id", async (req, res) => {
  try {
    const p = await prisma.peca.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ error: "Peça não encontrada." });
    res.json(p);
  } catch (err) { tratarErro(res, err); }
});

router.post("/", async (req, res) => {
  try {
    const { data, erro } = validar(req.body);
    if (erro) return res.status(400).json({ error: erro });
    res.status(201).json(await prisma.peca.create({ data: { ...data, userId: req.userId } }));
  } catch (err) { tratarErro(res, err); }
});

router.put("/:id", async (req, res) => {
  try {
    const { data, erro } = validar(req.body, true);
    if (erro) return res.status(400).json({ error: erro });
    res.json(await prisma.peca.update({ where: { id: req.params.id }, data }));
  } catch (err) { tratarErro(res, err); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.peca.delete({ where: { id: req.params.id } });
    res.json({ message: "Peça removida." });
  } catch (err) { tratarErro(res, err); }
});

// N:N -> GET /pecas/:id/ordens  (todas as OS que usam a peça)
router.get("/:id/ordens", async (req, res) => {
  try {
    const peca = await prisma.peca.findUnique({ where: { id: req.params.id } });
    if (!peca) return res.status(404).json({ error: "Peça não encontrada." });
    const links = await prisma.ordemServicoPeca.findMany({
      where: { pecaId: req.params.id },
      include: { ordem: true },
    });
    res.json(links.map((l) => ({ quantidade: l.quantidade, ordem: l.ordem })));
  } catch (err) { tratarErro(res, err); }
});

module.exports = router;
