const router = require("express").Router();
const prisma = require("../prisma");
const { texto, tratarErro } = require("../utils/helpers");

router.get("/", async (req, res) => {
  try {
    res.json(await prisma.categoria.findMany({ orderBy: { nome: "asc" } }));
  } catch (err) { tratarErro(res, err); }
});

router.get("/:id", async (req, res) => {
  try {
    const c = await prisma.categoria.findUnique({ where: { id: req.params.id } });
    if (!c) return res.status(404).json({ error: "Categoria não encontrada." });
    res.json(c);
  } catch (err) { tratarErro(res, err); }
});

router.post("/", async (req, res) => {
  try {
    const nome = texto(req.body.nome);
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório." });
    res.status(201).json(await prisma.categoria.create({ data: { nome } }));
  } catch (err) { tratarErro(res, err); }
});

router.put("/:id", async (req, res) => {
  try {
    const nome = texto(req.body.nome);
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório." });
    res.json(await prisma.categoria.update({ where: { id: req.params.id }, data: { nome } }));
  } catch (err) { tratarErro(res, err); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.categoria.delete({ where: { id: req.params.id } });
    res.json({ message: "Categoria removida." });
  } catch (err) { tratarErro(res, err); }
});

module.exports = router;
