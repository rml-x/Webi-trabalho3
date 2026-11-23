# Oficina E-Bike — API REST + Front (DWEB 1)

*REGRAS DE NEGÓCIO: SISTEMA DA OFICINA DE E-BIKES*

*1. Para que serve o sistema*
O sistema organiza o trabalho de uma loja que conserta bicicletas elétricas. O cliente conta o problema da bike pelo site. A equipe da loja acompanha e executa os consertos em um quadro de tarefas, parecido com o Trello.

*2. Quem usa o sistema*
- *Cliente:* abre o chamado pelo site. Não precisa criar conta nem fazer login.
- *Funcionário:* entra com e-mail e senha, pega os serviços e conclui os consertos.
- *Administrador:* autoriza novos funcionários por meio de um código. O código do administrador é *EBIKE123*.

*3. O que o cliente faz: abrir um chamado*
- *Nome:* obrigatório, até 50 caracteres.
- *CPF:* obrigatório, 11 números. O site mostra no formato 000.000.000-00. Ele identifica o cliente, então não pode se repetir.
- *WhatsApp de contato:* obrigatório.
- *Problema:* obrigatório, até 50 caracteres. Exemplos: "bateria não carrega", "motor sem potência", "carenagem quebrada".
- *Descrição do problema:* obrigatória, até 250 caracteres. Exemplo: "o painel mostra 100% de carga, mas o motor não tem potência comigo em cima".
- *Foto do problema:* opcional. Nesta versão, o cliente apenas escreve o nome da foto (por exemplo, "carenagem_quebrada.jpg").

*4. Como o cliente é reconhecido*
- *Primeira vez:* o sistema guarda nome, CPF e WhatsApp e registra o chamado.
- *Cliente que volta:* o sistema reconhece o CPF e não cadastra de novo. Ele apenas cria um novo chamado ligado àquele CPF, e os chamados antigos continuam guardados.
- Se o CPF for inválido ou faltar algum campo obrigatório, o chamado não é aceito e o site avisa o motivo.
- O cliente pode consultar o andamento digitando só o CPF. Ele vê apenas o problema, a situação e a data. Dados pessoais não são mostrados.

*5. Acesso dos funcionários*
- *Entrar:* e-mail e senha.
- *Criar conta nova:* nome, e-mail, senha e o código do administrador (*EBIKE123*). Se o código estiver errado, a conta não é criada.
- Cada e-mail só pode ser cadastrado uma vez.
- As senhas são guardadas de forma protegida, e nem a loja consegue lê-las.
- A sessão expira em 1 hora, depois pede login de novo.
- Sem login, ninguém acessa o painel da loja.

*6. O quadro de serviços (a fazer, fazendo, feito)*
Cada chamado do cliente vira um cartão no quadro, que tem 3 colunas:
- *A fazer:* chamados novos, esperando um funcionário.
- *Fazendo:* serviços que alguém já pegou.
- *Feito:* serviços concluídos.

Como o cartão anda:
1. *Aceitar:* o funcionário escolhe um cartão em "A fazer" e clica em aceitar. O cartão passa para "Fazendo" e fica ligado a ele. Se outro funcionário tentar pegar o mesmo cartão ao mesmo tempo, só o primeiro consegue.
2. *Devolver:* quem aceitou pode desistir. O cartão volta para "A fazer", sem responsável.
3. *Concluir:* só o funcionário responsável pode concluir. Ele é obrigado a informar o vídeo de teste da bike funcionando. Nesta versão, basta escrever o nome do vídeo (por exemplo, "teste x11"). Sem isso, o cartão não vai para "Feito".

*7. A coluna "Feito" e o histórico*
- A coluna "Feito" mostra somente os 3 últimos serviços concluídos.
- Quando um novo serviço é concluído, o mais antigo sai do quadro e vai para o histórico.
- O histórico guarda uma cópia completa: cliente, problema, descrição, funcionário, vídeo, peças usadas e data de conclusão. Nada se perde.

*8. Peças e categorias*
- *Peças:* a loja cadastra peças com nome, preço e quantidade em estoque (por exemplo, bateria, controlador, pneu).
- *Uso nos serviços:* o funcionário informa quais peças usou em cada serviço e em que quantidade. Um serviço pode usar várias peças, e a mesma peça pode aparecer em vários serviços.
- *Categorias:* servem para classificar o serviço (elétrica, bateria, motor, carenagem etc.).

*9. Resumo das regras principais*
- O cliente não faz login; o funcionário faz.
- Nome, CPF, WhatsApp, problema e descrição são obrigatórios. A foto é opcional.
- O CPF identifica o cliente. Quem volta ganha um novo chamado, sem cadastro duplicado.
- Para criar conta de funcionário, é preciso o código do administrador (EBIKE123).
- Todo chamado novo começa em "A fazer".
- Cada serviço só pode ter um funcionário responsável.
- Só o responsável conclui o serviço, e só com o vídeo de teste informado.
- "Feito" mostra os 3 últimos; os mais antigos vão para o histórico.
- Nenhuma senha é exibida ou guardada de forma legível.

*10. Limitações desta versão*
- Foto e vídeo são apenas texto (o nome do arquivo), não há envio real de arquivos, para não precisar utilizar um serviço externo de armazenamento de imagem e vídeo..
- O estoque das peças não diminui automaticamente quando uma peça é usada.

MANUAL DE INSTALAÇÃO: 

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
