// Mantém só os dígitos
const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

// Valida CPF (11 dígitos + dígitos verificadores)
function cpfValido(valor) {
  const cpf = soDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(cpf[t])) return false;
  }
  return true;
}

const texto = (v) => (typeof v === "string" ? v.trim() : "");

// Converte erros do Prisma em respostas HTTP
function tratarErro(res, err) {
  if (err.code === "P2002") return res.status(409).json({ error: "Registro duplicado." });
  if (err.code === "P2003")
    return res.status(409).json({ error: "Operação bloqueada: existem registros vinculados." });
  if (err.code === "P2025") return res.status(404).json({ error: "Registro não encontrado." });
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor." });
}

module.exports = { soDigitos, cpfValido, texto, tratarErro };
