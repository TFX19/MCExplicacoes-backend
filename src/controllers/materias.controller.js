import prisma from '../lib/prisma.js'

// GET /materias
export async function listarMaterias(req, res) {
  try {
    const materias = await prisma.materia.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    })
    res.json(materias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /materias
export async function criarMateria(req, res) {
  try {
    const materia = await prisma.materia.create({ data: req.body })
    res.status(201).json(materia)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Matéria já existe' })
    res.status(500).json({ error: err.message })
  }
}

// PATCH /materias/:id
export async function atualizarMateria(req, res) {
  try {
    const materia = await prisma.materia.update({
      where: { id: req.params.id },
      data:  req.body,
    })
    res.json(materia)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Matéria não encontrada' })
    res.status(500).json({ error: err.message })
  }
}
