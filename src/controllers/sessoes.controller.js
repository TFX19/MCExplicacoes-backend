import prisma from '../lib/prisma.js'

// GET /sessoes
export async function listarSessoes(req, res) {
  try {
    const { alunoId, estado, materiaId, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (alunoId)   where.alunoId   = alunoId
    if (estado)    where.estado    = estado
    if (materiaId) where.materiaId = materiaId

    const [sessoes, total] = await Promise.all([
      prisma.sessao.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { dataHora: 'desc' },
        include: {
          aluno:   { select: { id: true, nome: true, email: true } },
          materia: { select: { id: true, nome: true } },
        },
      }),
      prisma.sessao.count({ where }),
    ])

    res.json({ data: sessoes, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /sessoes/:id
export async function obterSessao(req, res) {
  try {
    const sessao = await prisma.sessao.findUnique({
      where: { id: req.params.id },
      include: {
        aluno:     true,
        materia:   true,
        pagamentos: true,
      },
    })
    if (!sessao) return res.status(404).json({ error: 'Sessão não encontrada' })
    res.json(sessao)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /sessoes
export async function criarSessao(req, res) {
  try {
    const { alunoId, materiaId, dataHora, duracaoMin, local, notas } = req.body

    const sessao = await prisma.sessao.create({
      data: { alunoId, materiaId, dataHora: new Date(dataHora), duracaoMin, local, notas },
      include: {
        aluno:   { select: { id: true, nome: true } },
        materia: { select: { id: true, nome: true } },
      },
    })

    res.status(201).json(sessao)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /sessoes/:id
export async function atualizarSessao(req, res) {
  try {
    const dados = req.body
    if (dados.dataHora) dados.dataHora = new Date(dados.dataHora)

    const sessao = await prisma.sessao.update({
      where: { id: req.params.id },
      data: dados,
      include: {
        aluno:   { select: { id: true, nome: true } },
        materia: { select: { id: true, nome: true } },
      },
    })

    res.json(sessao)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sessão não encontrada' })
    res.status(500).json({ error: err.message })
  }
}

// DELETE /sessoes/:id
export async function eliminarSessao(req, res) {
  try {
    await prisma.sessao.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sessão não encontrada' })
    res.status(500).json({ error: err.message })
  }
}
