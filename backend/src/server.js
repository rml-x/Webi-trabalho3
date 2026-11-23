require("dotenv").config();
const express = require("express");
const cors = require("cors");
const auth = require("./middlewares/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", api: "Oficina E-Bike" }));

// Rotas públicas (sem token)
app.use("/auth", require("./routes/auth.routes"));      // register, login (+ /me protegida lá dentro)
app.use("/public", require("./routes/public.routes"));  // cliente abre/consulta OS

// Rotas protegidas (exigem Authorization: Bearer <token>)
app.use("/clientes", auth, require("./routes/clientes.routes"));
app.use("/categorias", auth, require("./routes/categorias.routes"));
app.use("/pecas", auth, require("./routes/pecas.routes"));
app.use("/ordens", auth, require("./routes/ordens.routes"));
app.use("/logs", auth, require("./routes/logs.routes"));

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));
