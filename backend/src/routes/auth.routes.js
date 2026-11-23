const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");
const { texto, tratarErro } = require("../utils/helpers");

// POST /auth/register  -> exige o código de admin (validado AQUI no backend)
router.post("/register", async (req, res) => {
  try {
    const username = texto(req.body.username);
    const email = texto(req.body.email).toLowerCase();
    const { password, adminCode } = req.body;

    if (!username || !email || !password || !adminCode)
      return res.status(400).json({ error: "Informe username, email, password e adminCode." });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: "E-mail inválido." });
    if (String(password).length < 6)
      return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
    if (adminCode !== process.env.ADMIN_CODE)
      return res.status(403).json({ error: "Código de admin incorreto." });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hash },
      select: { id: true, username: true, email: true },
    });
    res.status(201).json({ message: "Usuário cadastrado com sucesso.", user });
  } catch (err) {
    if (err.code === "P2002")
      return res.status(409).json({ error: "E-mail ou username já cadastrado." });
    tratarErro(res, err);
  }
});

// POST /auth/login  -> mensagem em caso de erro
router.post("/login", async (req, res) => {
  try {
    const email = texto(req.body.email).toLowerCase();
    const { password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Informe email e password." });

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    tratarErro(res, err);
  }
});

// GET /auth/me (protegida)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json(user);
  } catch (err) {
    tratarErro(res, err);
  }
});

module.exports = router;
