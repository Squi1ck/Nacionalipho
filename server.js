require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Multer (imagem em memória, sem guardar em disco) ─────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// ─── POST /analisar-nacionalidade ─────────────────────────────
app.post('/analisar-nacionalidade', upload.single('foto'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
    }

    try {
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: { type: 'base64', media_type: mimeType, data: base64Image }
                        },
                        {
                            type: 'text',
                            text: `Analisa as características físicas visíveis desta pessoa (estrutura facial, tom de pele, traços) e faz uma estimativa divertida e criativa das 5 nacionalidades mais prováveis com percentagens.

IMPORTANTE: Isto é uma aplicação de entretenimento, não científica. Sê criativo e bem-humorado.

Responde APENAS com JSON válido, sem markdown, sem texto extra:
{
  "nacionalidades": [
    { "pais": "Brasil", "bandeira": "🇧🇷", "percentagem": 40 },
    { "pais": "Portugal", "bandeira": "🇵🇹", "percentagem": 25 },
    { "pais": "Espanha", "bandeira": "🇪🇸", "percentagem": 15 },
    { "pais": "Itália", "bandeira": "🇮🇹", "percentagem": 12 },
    { "pais": "França", "bandeira": "🇫🇷", "percentagem": 8 }
  ],
  "descricao": "Frase criativa e bem-humorada sobre o resultado (máx 2 frases)",
  "tracos_detectados": "Descrição breve e positiva dos traços físicos que influenciaram a análise"
}`
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Erro Claude API:', errText);
            throw new Error('Falha na API da Claude');
        }

        const data = await response.json();
        const textoResposta = data.content[0].text.trim();
        const jsonLimpo = textoResposta.replace(/```json\n?|\n?```/g, '').trim();
        const resultado = JSON.parse(jsonLimpo);

        res.json({ sucesso: true, ...resultado });

    } catch (err) {
        console.error('Erro na análise:', err);
        res.status(500).json({ erro: 'Erro ao analisar a imagem. Tenta novamente.' });
    }
});

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🌍 NacionaliPhoto a correr em http://localhost:${PORT}\n`);
});
