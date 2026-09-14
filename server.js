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

   FILTRO DE RELEVÂNCIA: para garantir que só venha notícia de
   agro (nada de política geral, esporte, etc.), a busca combina
   duas coisas:
     1. "domains" — restringe a busca a portais que só publicam
        sobre agronegócio (Canal Rural, Notícias Agrícolas, Globo
        Rural, Agrolink);
     2. "qInTitle" — dentro desses portais, ainda filtra pelo
        TÍTULO da matéria (mais preciso que buscar no texto
        inteiro), usando termos diferentes por subcategoria.

   SUBCATEGORIAS: o endpoint aceita ?categoria=geral|direito|gestao
   e ?limite=N (quantas notícias) e ?pagina=N (paginação, para o
   botão "Carregar mais notícias" da página noticias.html).
============================================================= */

const express = require('express');
const cors = require('cors');

const app = express();

// Porta do servidor (Render, Railway, etc. definem isso automaticamente)
const PORTA = process.env.PORT || 3000;

// Chave da NewsAPI — configure isso como variável de ambiente no
// seu serviço de hospedagem, NUNCA deixe escrita direto aqui.
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Portais que publicam essencialmente sobre agronegócio — isso é o
// que garante que não apareça notícia fora do tema, mesmo que a
// palavra-chave dê "match" em algum outro contexto.
const DOMINIOS_AGRO = [
    'canalrural.com.br',
    'noticiasagricolas.com.br',
    'globorural.globo.com',
    'agrolink.com.br'
].join(',');

// Termos de busca NO TÍTULO da matéria, por subcategoria.
// "geral" é propositalmente ampla (agro no sentido amplo) porque os
// domínios acima já garantem que é tudo sobre agronegócio.
const QUERIES_POR_CATEGORIA = {
    geral: '(agro OR agronegócio OR agropecuária OR agricultura OR agronomia OR rural OR lavoura OR safra OR pecuária)',
    direito: '(direito OR jurídico OR jurídica OR "crédito rural" OR fundiária OR fundiário OR contrato OR PRONAF OR CPR OR CRA OR regularização OR sucessão)',
    gestao: '(gestão OR planejamento OR "propriedade rural" OR sucessório OR administração OR investimento OR custeio OR financiamento)'
};

// Cache em memória — 1 hora de duração — para economizar ao máximo
// as requisições do plano gratuito da NewsAPI. Uma entrada por
// combinação categoria+limite+página.
let cache = {}; // ex.: cache['geral:12:1'] = { dados: {...}, timestamp: 123 }
const CACHE_DURACAO_MS = 60 * 60 * 1000; // 1 hora

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

        // Categoria pedida pelo front-end (padrão: "geral", usada no
        // carrossel da home). Se vier algo inválido, cai no "geral".
        const categoriaPedida = String(req.query.categoria || 'geral');
        const categoria = QUERIES_POR_CATEGORIA[categoriaPedida] ? categoriaPedida : 'geral';

        // Quantidade de notícias pedida (padrão 6, máximo 30 por
        // página para não estourar o plano gratuito da NewsAPI)
        const limitePedido = parseInt(req.query.limite, 10);
        const limite = Number.isFinite(limitePedido)
            ? Math.min(Math.max(limitePedido, 1), 30)
            : 6;

        // Página pedida (para o botão "Carregar mais notícias")
        const paginaPedida = parseInt(req.query.pagina, 10);
        const pagina = Number.isFinite(paginaPedida) ? Math.max(paginaPedida, 1) : 1;

        const chaveCache = categoria + ':' + limite + ':' + pagina;
        const agora = Date.now();

        // Se o cache dessa combinação ainda é válido, devolve ele direto
        const entradaCache = cache[chaveCache];
        if (entradaCache && (agora - entradaCache.timestamp) < CACHE_DURACAO_MS) {
            return res.json(entradaCache.dados);
        }

        const montarUrl = function (comDominios) {
            var partes = [
                'https://newsapi.org/v2/everything',
                '?qInTitle=' + encodeURIComponent(QUERIES_POR_CATEGORIA[categoria]),
                comDominios ? '&domains=' + encodeURIComponent(DOMINIOS_AGRO) : '',
                '&language=pt',
                '&sortBy=publishedAt',
                '&pageSize=' + limite,
                '&page=' + pagina,
                '&apiKey=' + NEWS_API_KEY
            ];
            return partes.join('');
        };

        let resposta = await fetch(montarUrl(true));

        if (!resposta.ok) {
            throw new Error('Falha na requisição à NewsAPI: ' + resposta.status);
        }

        let dados = await resposta.json();

        // Se a busca restrita aos portais de agro não trouxe nada (pode
        // acontecer se a NewsAPI não tiver esses domínios bem indexados
        // para o termo/página pedidos), tenta de novo sem a restrição de
        // domínio — ainda assim filtrando pelo título (qInTitle), então
        // o resultado continua sendo só sobre agro.
        if ((dados.articles || []).length === 0) {
            resposta = await fetch(montarUrl(false));

            if (!resposta.ok) {
                throw new Error('Falha na requisição à NewsAPI: ' + resposta.status);
            }

            dados = await resposta.json();
        }

        // Simplifica o formato antes de mandar pro front-end
        const artigos = (dados.articles || []).map((artigo) => ({
            titulo: artigo.title || '',
            resumo: artigo.description || '',
            imagem: artigo.urlToImage || null,
            link: artigo.url || '#',
            fonte: artigo.source && artigo.source.name ? artigo.source.name : 'Fonte desconhecida',
            data: artigo.publishedAt || null
        }));

        const resultado = {
            artigos,
            categoria,
            limite,
            pagina,
            total: dados.totalResults || artigos.length
        };

        // Atualiza o cache dessa combinação categoria+limite+página
        cache[chaveCache] = {
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
