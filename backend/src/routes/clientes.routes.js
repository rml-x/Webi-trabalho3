const router = require("express").Router();
const prisma = require("../prisma");
const { soDigitos, cpfValido, texto, tratarErro } = require("../utils/helpers");

router.get("/", async (req, res) => {
  try {
    res.json(await prisma.cliente.findMany({ orderBy: { nome: "asc" } }));
  } catch (err) { tratarErro(res, err); }
});

router.get("/:cpf", async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { cpf: soDigitos(req.params.cpf) },
      include: { ordens: true },
    });
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado." });
    res.json(cliente);
  } catch (err) { tratarErro(res, err); }
});

router.post("/", async (req, res) => {
  try {
    const cpf = soDigitos(req.body.cpf);
    const nome = texto(req.body.nome);
    const whatsapp = soDigitos(req.body.whatsapp);
    if (!cpfValido(cpf)) return res.status(400).json({ error: "CPF inválido." });
    if (!nome || nome.length > 50) return res.status(400).json({ error: "Nome inválido (máx. 50)." });
    if (whatsapp.length < 10 || whatsapp.length > 11)
      return res.status(400).json({ error: "WhatsApp inválido." });
    const cliente = await prisma.cliente.create({ data: { cpf, nome, whatsapp } });
    res.status(201).json(cliente);
  } catch (err) { tratarErro(res, err); }
});

router.put("/:cpf", async (req, res) => {
  try {
    const data = {};
    if (req.body.nome !== undefined) {
      const nome = texto(req.body.nome);
      if (!nome || nome.length > 50) return res.status(400).json({ error: "Nome inválido (máx. 50)." });
      data.nome = nome;
    }
    if (req.body.whatsapp !== undefined) {
      const w = soDigitos(req.body.whatsapp);
      if (w.length < 10 || w.length > 11) return res.status(400).json({ error: "WhatsApp inválido." });
      data.whatsapp = w;
    }
    const cliente = await prisma.cliente.update({ where: { cpf: soDigitos(req.params.cpf) }, data });
    res.json(cliente);
  } catch (err) { tratarErro(res, err); }
});

router.delete("/:cpf", async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { cpf: soDigitos(req.params.cpf) } });
    res.json({ message: "Cliente removido." });
  } catch (err) { tratarErro(res, err); }
});

module.exports = router;
