require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.post('/analisar-nacionalidade', upload.single('foto'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType    = req.file.mimetype;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
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
      console.error('Erro OpenRouter API:', errText);
      throw new Error('Falha na API');
    }

    const data          = await response.json();
    const textoResposta = data.choices[0].message.content.trim();
    const jsonLimpo     = textoResposta.replace(/```json\n?|\n?```/g, '').trim();
    const resultado     = JSON.parse(jsonLimpo);

    res.json({ sucesso: true, ...resultado });

  } catch (err) {
    console.error('Erro na análise:', err);
    res.status(500).json({ erro: 'Erro ao analisar a imagem. Tenta novamente.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n🌍 NacionaliPhoto a correr em http://localhost:${PORT}\n`);
});