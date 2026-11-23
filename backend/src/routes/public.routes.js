// Única exceção às rotas protegidas: o cliente NÃO tem login.
const router = require("express").Router();
const prisma = require("../prisma");
const { soDigitos, cpfValido, texto, tratarErro } = require("../utils/helpers");

// POST /public/ordens  -> cliente abre um chamado
// Se o CPF já existe: só cria uma NOVA ordem vinculada ao CPF (cliente não é alterado).
router.post("/ordens", async (req, res) => {
  try {
    const nome = texto(req.body.nome);
    const cpf = soDigitos(req.body.cpf);
    const whatsapp = soDigitos(req.body.whatsapp);
    const problema = texto(req.body.problema);
    const descricao = texto(req.body.descricao);
    const fotoUrl = texto(req.body.fotoUrl) || null; // placeholder (texto), opcional

    if (!nome || nome.length > 50)
      return res.status(400).json({ error: "Nome obrigatório (máx. 50 caracteres)." });
    if (!cpfValido(cpf)) return res.status(400).json({ error: "CPF inválido." });
    if (whatsapp.length < 10 || whatsapp.length > 11)
      return res.status(400).json({ error: "WhatsApp inválido (DDD + número)." });
    if (!problema || problema.length > 50)
      return res.status(400).json({ error: "Problema obrigatório (máx. 50 caracteres)." });
    if (!descricao || descricao.length > 250)
      return res.status(400).json({ error: "Descrição obrigatória (máx. 250 caracteres)." });
    if (fotoUrl && fotoUrl.length > 200)
      return res.status(400).json({ error: "Nome da foto muito longo (máx. 200)." });

    const resultado = await prisma.$transaction(async (tx) => {
      const existente = await tx.cliente.findUnique({ where: { cpf } });
      if (!existente) await tx.cliente.create({ data: { cpf, nome, whatsapp } });
      const ordem = await tx.ordemServico.create({
        data: { problema, descricao, fotoUrl, clienteCpf: cpf },
      });
      return { ordem, clienteNovo: !existente };
    });

    res.status(201).json({
      message: resultado.clienteNovo
        ? "Cliente cadastrado e chamado aberto!"
        : "Cliente reconhecido! Novo chamado vinculado ao seu CPF.",
      clienteNovo: resultado.clienteNovo,
      ordem: { id: resultado.ordem.id, status: resultado.ordem.status },
    });
  } catch (err) {
    tratarErro(res, err);
  }
});

// GET /public/ordens/:cpf  -> acompanhamento (mínimo de dados, por causa da LGPD)
router.get("/ordens/:cpf", async (req, res) => {
  try {
    const cpf = soDigitos(req.params.cpf);
    if (!cpfValido(cpf)) return res.status(400).json({ error: "CPF inválido." });
    const ordens = await prisma.ordemServico.findMany({
      where: { clienteCpf: cpf },
      orderBy: { criadoEm: "desc" },
      select: { id: true, problema: true, status: true, criadoEm: true, concluidoEm: true },
    });
    if (ordens.length === 0)
      return res.status(404).json({ error: "Nenhum chamado ativo para este CPF." });
    res.json(ordens);
  } catch (err) {
    tratarErro(res, err);
  }
});

module.exports = router;
