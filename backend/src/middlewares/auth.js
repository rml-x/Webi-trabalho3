const jwt = require("jsonwebtoken");

// Espera o cabeçalho:  Authorization: Bearer <token>
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token não informado." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

module.exports = auth;
