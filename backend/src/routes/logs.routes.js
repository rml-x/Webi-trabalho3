const router = require("express").Router();
const prisma = require("../prisma");
const { tratarErro } = require("../utils/helpers");

// Histórico das OS que saíram da coluna "Feito"
router.get("/", async (req, res) => {
  try {
    res.json(await prisma.logServico.findMany({ orderBy: { concluidoEm: "desc" } }));
  } catch (err) { tratarErro(res, err); }
});

router.get("/:id", async (req, res) => {
  try {
    const log = await prisma.logServico.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: "Log não encontrado." });
    res.json(log);
  } catch (err) { tratarErro(res, err); }
});

module.exports = router;
