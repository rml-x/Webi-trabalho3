# Oficina E-Bike — API REST + Front (DWEB 1)

## 1. Rodar o backend

```bash
cd backend
npm install
```

Crie o `.env`:
- Windows (PowerShell/CMD): `copy .env.example .env`
- Linux: `cp .env.example .env`

Edite o `.env`: cole sua `DATABASE_URL`, troque o `JWT_SECRET` por algo longo. `ADMIN_CODE` já vem como `EBIKE123`.

Crie as tabelas no Neon e gere o client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Suba a API:

```bash
npm run dev        
# ou
npm start
```

Teste: abra http://localhost:3000 → `{"status":"ok","api":"Oficina E-Bike"}`.

## 2. Rodar o frontend (outro terminal)

```bash
cd frontend
npm install
npm run dev
```

- Cliente (sem login): http://localhost:5173/
- Funcionário: http://localhost:5173/painel/login

## 3. Linux

```bash
git clone <seu-repositorio>
cd <repo>/backend
npm install
cp .env.example .env      # edite com a DATABASE_URL e JWT_SECRET
npx prisma generate
npx prisma migrate deploy # só aplica as migrations já commitadas (tabelas já existem no Neon: não muda nada)
npm start
```
