import prisma from "../lib/prisma.js";

// GET /pagamentos
export async function listarPagamentos(req, res) {
  try {
    const { alunoId, estado, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (alunoId) where.alunoId = alunoId;
    if (estado) where.estado = estado;

    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { criadoEm: "desc" },
        include: {
          aluno: { select: { id: true, nome: true } },
          sessao: { select: { id: true, dataHora: true } },
        },
      }),
      prisma.pagamento.count({ where }),
    ]);

    res.json({
      data: pagamentos,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /pagamentos/resumo  — total recebido vs pendente
export async function resumoPagamentos(req, res) {
  try {
    const [pago, pendente] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { estado: "pago" },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.pagamento.aggregate({
        where: { estado: "pendente" },
        _sum: { valor: true },
        _count: true,
      }),
    ]);

    res.json({
      pago: { total: pago._sum.valor ?? 0, count: pago._count },
      pendente: { total: pendente._sum.valor ?? 0, count: pendente._count },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /pagamentos
export async function criarPagamento(req, res) {
  try {
    const {
      alunoId,
      sessaoId,
      valor,
      metodo,
      estado,
      dataPagamento,
      descricao,
    } = req.body;

    const pagamento = await prisma.pagamento.create({
      data: {
        alunoId,
        sessaoId,
        valor,
        metodo,
        estado,
        descricao,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
      },
      include: { aluno: { select: { id: true, nome: true } } },
    });

    res.status(201).json(pagamento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /pagamentos/:id
export async function atualizarPagamento(req, res) {
  try {
    const dados = req.body;
    if (dados.dataPagamento)
      dados.dataPagamento = new Date(dados.dataPagamento);

    const pagamento = await prisma.pagamento.update({
      where: { id: req.params.id },
      data: dados,
    });

    res.json(pagamento);
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "Pagamento não encontrado" });
    res.status(500).json({ error: err.message });
  }
}

// DELETE /pagamentos/lote
export async function eliminarVariosPagamentos(req, res) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids deve ser um array não vazio" });
    }

    const resultado = await prisma.pagamento.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({ deletados: resultado.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /pagamentos/:id
export async function eliminarPagamento(req, res) {
  try {
    await prisma.pagamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "Pagamento não encontrado" });
    res.status(500).json({ error: err.message });
  }
}
