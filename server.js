/* ============================================================
   SERVIDOR NODE — PROXY PARA NEWSAPI (agronegócio)
   ------------------------------------------------------------
   Motivo de existir: o plano gratuito da NewsAPI só aceita
   requisições feitas a partir de localhost, então o front-end
   não pode chamar a NewsAPI diretamente quando o site estiver
   publicado. Este servidor faz a chamada por você e devolve só
   os dados prontos pro front-end consumir.

   A chave da API fica aqui no servidor (variável de ambiente),
   nunca no código do site. Isso evita que qualquer visitante
   veja e use sua chave.
============================================================= */

const express = require('express');
const cors = require('cors');

const app = express();

// Porta do servidor (Render, Railway, etc. definem isso automaticamente)
const PORTA = process.env.PORT || 3000;

// Chave da NewsAPI — configure isso como variável de ambiente no
// seu serviço de hospedagem, NUNCA deixe escrita direto aqui.
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Cache simples em memória para não estourar o limite de
// requisições da NewsAPI (free tier costuma ser bem limitado)
let cache = {
    dados: null,
    timestamp: 0
};
const CACHE_DURACAO_MS = 15 * 60 * 1000; // 15 minutos

// Libera CORS para o(s) domínio(s) do seu site.
// Troque '*' pela URL real do seu site quando for pra produção,
// exemplo: origin: 'https://www.seusite.com.br'
app.use(cors({
    origin: '*'
}));

app.get('/', (req, res) => {
    res.send('Servidor de notícias do agronegócio rodando.');
});

app.get('/api/noticias-agro', async (req, res) => {
    try {
        if (!NEWS_API_KEY) {
            return res.status(500).json({
                erro: 'NEWS_API_KEY não configurada no servidor.'
            });
        }

        const agora = Date.now();

        // Se o cache ainda é válido, devolve ele direto
        if (cache.dados && (agora - cache.timestamp) < CACHE_DURACAO_MS) {
            return res.json(cache.dados);
        }

        const url = 'https://newsapi.org/v2/everything'
            + '?q=agronegócio OR agricultura OR pecuária'
            + '&language=pt'
            + '&sortBy=publishedAt'
            + '&pageSize=6'
            + '&apiKey=' + NEWS_API_KEY;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Falha na requisição à NewsAPI: ' + resposta.status);
        }

        const dados = await resposta.json();

        // Simplifica o formato antes de mandar pro front-end
        const artigos = (dados.articles || []).map((artigo) => ({
            titulo: artigo.title || '',
            resumo: artigo.description || '',
            imagem: artigo.urlToImage || null,
            link: artigo.url || '#',
            fonte: artigo.source && artigo.source.name ? artigo.source.name : 'Fonte desconhecida',
            data: artigo.publishedAt || null
        }));

        const resultado = { artigos };

        // Atualiza o cache
        cache = {
            dados: resultado,
            timestamp: agora
        };

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao buscar notícias do agronegócio:', erro);
        res.status(500).json({ erro: 'Não foi possível buscar as notícias no momento.' });
    }
});

app.listen(PORTA, () => {
    console.log('Servidor rodando na porta ' + PORTA);
});
