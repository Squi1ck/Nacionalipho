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

const NACIONALIDADES = [
  { pais: "Portugal",    bandeira: "🇵🇹" },
  { pais: "Brasil",      bandeira: "🇧🇷" },
  { pais: "Espanha",     bandeira: "🇪🇸" },
  { pais: "Itália",      bandeira: "🇮🇹" },
  { pais: "França",      bandeira: "🇫🇷" },
  { pais: "Alemanha",    bandeira: "🇩🇪" },
  { pais: "Reino Unido", bandeira: "🇬🇧" },
  { pais: "Marrocos",    bandeira: "🇲🇦" },
  { pais: "Angola",      bandeira: "🇦🇴" },
  { pais: "China",       bandeira: "🇨🇳" },
  { pais: "Japão",       bandeira: "🇯🇵" },
  { pais: "México",      bandeira: "🇲🇽" },
  { pais: "Argentina",   bandeira: "🇦🇷" },
  { pais: "Índia",       bandeira: "🇮🇳" },
  { pais: "Turquia",     bandeira: "🇹🇷" },
  { pais: "Grécia",      bandeira: "🇬🇷" },
  { pais: "Rússia",      bandeira: "🇷🇺" },
  { pais: "Suécia",      bandeira: "🇸🇪" },
  { pais: "Coreia do Sul", bandeira: "🇰🇷" },
  { pais: "Nigéria",     bandeira: "🇳🇬" }
];

const DESCRICOES = [
  "Os teus traços são únicos e difíceis de localizar num só país!",
  "A tua cara é um passaporte por si só — bem internacional!",
  "Definitivamente tens sangue de mais do que um continente!",
  "Os teus traços físicos contam uma história de várias culturas.",
  "Podes passar por local em pelo menos 3 países diferentes!",
  "A tua origem é um mistério delicioso para a IA!",
  "Os teus genes claramente viajaram muito antes de chegares a ti!",
  "Uma mistura fascinante que a IA adorou analisar!"
];

const TRACOS = [
  "Estrutura facial equilibrada com traços mediterrânicos",
  "Tom de pele e formato dos olhos com influências diversas",
  "Traços faciais harmoniosos de difícil classificação geográfica",
  "Características físicas que atravessam várias regiões do mundo",
  "Formato do rosto e traços que remetem para múltiplas origens",
  "Combinação única de características que desafia a classificação"
];

function gerarResultadoAleatorio() {
  // Escolher 5 nacionalidades aleatórias sem repetição
  const embaralhadas = [...NACIONALIDADES].sort(() => Math.random() - 0.5);
  const escolhidas   = embaralhadas.slice(0, 5);

  // Gerar percentagens que somam 100
  const pesos = [
    Math.floor(Math.random() * 20) + 30, // 30-50
    Math.floor(Math.random() * 15) + 15, // 15-30
    Math.floor(Math.random() * 10) + 10, // 10-20
    Math.floor(Math.random() * 8)  + 5,  // 5-13
    0
  ];
  pesos[4] = 100 - pesos[0] - pesos[1] - pesos[2] - pesos[3];

  const nacionalidades = escolhidas.map((n, i) => ({
    pais:        n.pais,
    bandeira:    n.bandeira,
    percentagem: pesos[i]
  }));

  return {
    nacionalidades,
    descricao:         DESCRICOES[Math.floor(Math.random() * DESCRICOES.length)],
    tracos_detectados: TRACOS[Math.floor(Math.random() * TRACOS.length)]
  };
}

app.post('/analisar-nacionalidade', upload.single('foto'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
  }

  // Simular tempo de análise (1 a 2 segundos)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const resultado = gerarResultadoAleatorio();
  res.json({ sucesso: true, ...resultado });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n🌍 NacionaliPhoto a correr em http://localhost:${PORT}\n`);
});