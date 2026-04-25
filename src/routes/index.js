import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

import * as alunos from "../controllers/alunos.controller.js";
import * as sessoes from "../controllers/sessoes.controller.js";
import * as pagamentos from "../controllers/pagamentos.controller.js";
import * as inscricoes from "../controllers/inscricoes.controller.js";
import * as materias from "../controllers/materias.controller.js";

const router = Router();

// ------------------------------------------------------------------
// PÚBLICO — sem autenticação (usado pelo formulário do website)
// ------------------------------------------------------------------
router.post("/inscricoes", inscricoes.criarInscricao);
router.get("/materias", materias.listarMaterias); // para preencher o select do form

// ------------------------------------------------------------------
// PRIVADO — requer token JWT do Supabase (backoffice)
// ------------------------------------------------------------------
router.use(requireAuth);

// Alunos
router.get("/alunos", alunos.listarAlunos);
router.get("/alunos/:id", alunos.obterAluno);
router.post("/alunos", alunos.criarAluno);
router.patch("/alunos/:id", alunos.atualizarAluno);
router.delete("/alunos/:id", alunos.eliminarAluno);

// Sessões
router.get("/sessoes", sessoes.listarSessoes);
router.get("/sessoes/:id", sessoes.obterSessao);
router.post("/sessoes", sessoes.criarSessao);
router.patch("/sessoes/:id", sessoes.atualizarSessao);
router.delete("/sessoes/lote", sessoes.eliminarVariasSessoes);
router.delete("/sessoes/:id", sessoes.eliminarSessao);

// Pagamentos
router.get("/pagamentos", pagamentos.listarPagamentos);
router.get("/pagamentos/resumo", pagamentos.resumoPagamentos);
router.post("/pagamentos", pagamentos.criarPagamento);
router.patch("/pagamentos/:id", pagamentos.atualizarPagamento);
router.delete("/pagamentos/lote", pagamentos.eliminarVariosPagamentos);
router.delete("/pagamentos/:id", pagamentos.eliminarPagamento);

// Inscrições (gestão no backoffice)
router.get("/inscricoes", inscricoes.listarInscricoes);
router.patch("/inscricoes/:id", inscricoes.atualizarInscricao);
router.post("/inscricoes/:id/converter", inscricoes.converterInscricao);

// Matérias
router.post("/materias", materias.criarMateria);
router.patch("/materias/:id", materias.atualizarMateria);

export default router;
