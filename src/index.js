import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes/index.js'

const app  = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  credentials: true,
}))
app.use(express.json())

// Healthcheck
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// API routes
app.use('/api', router)

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` }))

// Error handler global
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 API a correr em http://localhost:${PORT}`)
})
