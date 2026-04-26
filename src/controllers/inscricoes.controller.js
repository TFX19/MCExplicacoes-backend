import prisma from "../lib/prisma.js";

// POST /inscricoes  — rota PÚBLICA (formulário do website)
export async function criarInscricao(req, res) {
  try {
    const {
      nome,
      email,
      telemovel,
      anoEscolar,
      escola,
      materiasIds,
      mensagem,
    } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "nome e email são obrigatórios" });
    }

    const inscricao = await prisma.inscricao.create({
      data: {
        nome,
        email,
        telemovel: telemovel ?? null,
        anoEscolar: anoEscolar ?? null,
        escola: escola ?? null,
        mensagem: mensagem ?? null,
        materiasIds: { set: materiasIds ?? [] },
      },
    });

    res.status(201).json({ sucesso: true, id: inscricao.id });
  } catch (err) {
    console.error("criarInscricao error:", err);
    res.status(500).json({ error: err.message });
  }
}

// GET /inscricoes  — backoffice
export async function listarInscricoes(req, res) {
  try {
    const { estado, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = estado ? { estado } : {};

    const [inscricoes, total] = await Promise.all([
      prisma.inscricao.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { criadoEm: "desc" },
        include: { aluno: { select: { id: true, nome: true } } },
      }),
      prisma.inscricao.count({ where }),
    ]);

    res.json({
      data: inscricoes,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /inscricoes/:id/converter  — converte inscrição em aluno
export async function converterInscricao(req, res) {
  try {
    const inscricao = await prisma.inscricao.findUnique({
      where: { id: req.params.id },
    });
    if (!inscricao)
      return res.status(404).json({ error: "Inscrição não encontrada" });

    // Cria o aluno e remove a inscrição numa transação
    const [aluno] = await prisma.$transaction([
      prisma.aluno.create({
        data: {
          nome: inscricao.nome,
          email: inscricao.email,
          telemovel: inscricao.telemovel,
          anoEscolar: inscricao.anoEscolar,
          escola: inscricao.escola,
          materias: {
            create: (inscricao.materiasIds ?? []).map((id) => ({
              materiaId: id,
            })),
          },
        },
      }),
      prisma.inscricao.delete({
        where: { id: req.params.id },
      }),
    ]);

    res.status(201).json(aluno);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /inscricoes/:id
export async function atualizarInscricao(req, res) {
  try {
    const inscricao = await prisma.inscricao.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(inscricao);
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "Inscrição não encontrada" });
    res.status(500).json({ error: err.message });
  }
}
