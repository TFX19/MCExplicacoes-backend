import prisma from "../lib/prisma.js";

// GET /alunos
export async function listarAlunos(req, res) {
  try {
    const { ativo, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (ativo !== undefined) where.ativo = ativo === "true";
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [alunos, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { criadoEm: "desc" },
        include: { materias: { include: { materia: true } } },
      }),
      prisma.aluno.count({ where }),
    ]);

    res.json({ data: alunos, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /alunos/:id
export async function obterAluno(req, res) {
  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id: req.params.id },
      include: {
        materias: { include: { materia: true } },
        sessoes: {
          orderBy: { dataHora: "desc" },
          take: 10,
          include: { materia: true },
        },
        pagamentos: { orderBy: { criadoEm: "desc" }, take: 10 },
      },
    });
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });
    res.json(aluno);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /alunos
export async function criarAluno(req, res) {
  try {
    const {
      nome,
      email,
      telemovel,
      anoEscolar,
      escola,
      notasInternas,
      materiasIds = [],
    } = req.body;

    const aluno = await prisma.aluno.create({
      data: {
        nome,
        email,
        telemovel,
        anoEscolar,
        escola,
        notasInternas,
        materias: {
          create: materiasIds.map((id) => ({ materiaId: id })),
        },
      },
      include: { materias: { include: { materia: true } } },
    });

    res.status(201).json(aluno);
  } catch (err) {
    if (err.code === "P2002")
      return res.status(409).json({ error: "Email já existe" });
    res.status(500).json({ error: err.message });
  }
}

// PATCH /alunos/:id
export async function atualizarAluno(req, res) {
  try {
    const { materiasIds, ...dados } = req.body;

    const aluno = await prisma.aluno.update({
      where: { id: req.params.id },
      data: {
        ...dados,
        ...(materiasIds && {
          materias: {
            deleteMany: {},
            create: materiasIds.map((id) => ({ materiaId: id })),
          },
        }),
      },
      include: { materias: { include: { materia: true } } },
    });

    res.json(aluno);
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "Aluno não encontrado" });
    res.status(500).json({ error: err.message });
  }
}

// DELETE /alunos/:id
export async function eliminarAluno(req, res) {
  try {
    const id = req.params.id;

    // Tudo numa transação:
    // 1. Apaga pagamentos do aluno
    // 2. Apaga sessões do aluno
    // 3. Apaga relações de matérias
    // 4. Desliga inscrições (mantém o registo histórico mas remove a ligação)
    // 5. Apaga o aluno
    await prisma.$transaction([
      prisma.pagamento.deleteMany({ where: { alunoId: id } }),
      prisma.sessao.deleteMany({ where: { alunoId: id } }),
      prisma.alunoMateria.deleteMany({ where: { alunoId: id } }),
      prisma.inscricao.updateMany({
        where: { alunoId: id },
        data: { alunoId: null, estado: "pendente" },
      }),
      prisma.aluno.delete({ where: { id } }),
    ]);

    res.status(204).send();
  } catch (err) {
    console.error("eliminarAluno error:", err);
    if (err.code === "P2025")
      return res.status(404).json({ error: "Aluno não encontrado" });
    res.status(500).json({ error: err.message });
  }
}
