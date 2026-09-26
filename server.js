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

   ------------------------------------------------------------
   SOBRE A TIRA DE COTAÇÕES
   ------------------------------------------------------------
   O Dólar vem de uma API financeira aberta (Frankfurter.app —
   gratuita, sem chave, sem limite de uso), buscada automaticamente
   a cada requisição.

   Milho, Boi Gordo, Soja e Café Arábica só existem oficialmente
   como indicador do CEPEA/ESALQ, e o robots.txt do site deles
   proíbe acesso automatizado (bot/scraper) — então este servidor
   NÃO tenta buscar esses valores no site do CEPEA. Em vez disso,
   eles vêm do arquivo local `cotacoes-manuais.json`, que você (ou
   quem administra o site) atualiza manualmente uma vez por dia
   com o valor publicado em cepea.org.br. É rápido: abra o arquivo,
   troque o "valor" e a "atualizadoEm" de cada item.

   A variação (seta pra cima/baixo, %) desses quatro é calculada
   automaticamente pelo servidor: ele guarda o valor de cada dia em
   `historico-cotacoes.json` e compara com o valor salvo de um dia
   anterior. Isso também vale para o Dólar. No primeiríssimo dia
   rodando (antes de existir um "valor de ontem" salvo), a variação
   vem como null e a tira mostra só o preço, sem seta — a partir do
   dia seguinte já aparece normal.
============================================================= */


const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Porta do servidor (Render, Railway, etc. definem isso automaticamente)
const PORTA = process.env.PORT || 3000;

// Chave da NewsAPI — configure isso como variável de ambiente no
// seu serviço de hospedagem, NUNCA deixe escrita direto aqui.
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/* ------------------------------------------------------------
   COTAÇÕES — helpers de histórico/variação e leitura do arquivo
   manual. Ver explicação completa no topo do arquivo.
------------------------------------------------------------- */

const CAMINHO_HISTORICO = path.join(__dirname, 'historico-cotacoes.json');
const CAMINHO_COTACOES_MANUAIS = path.join(__dirname, 'cotacoes-manuais.json');

// Nome de exibição de cada item manual (a chave precisa bater com
// a chave usada em cotacoes-manuais.json)
const NOMES_COTACOES_MANUAIS = {
    milho: 'Milho (CEPEA)',
    boiGordo: 'Boi Gordo (CEPEA)',
    soja: 'Soja (CEPEA)',
    cafeArabica: 'Café Arábica (CEPEA)'
};

function carregarHistorico() {
    try {
        if (fs.existsSync(CAMINHO_HISTORICO)) {
            return JSON.parse(fs.readFileSync(CAMINHO_HISTORICO, 'utf-8'));
        }
    } catch (erro) {
        console.error('Não consegui ler o histórico de cotações:', erro.message);
    }
    return {};
}

function salvarHistorico(historico) {
    try {
        fs.writeFileSync(CAMINHO_HISTORICO, JSON.stringify(historico, null, 2), 'utf-8');
    } catch (erro) {
        console.error('Não consegui salvar o histórico de cotações:', erro.message);
    }
}

function carregarCotacoesManuais() {
    try {
        if (fs.existsSync(CAMINHO_COTACOES_MANUAIS)) {
            return JSON.parse(fs.readFileSync(CAMINHO_COTACOES_MANUAIS, 'utf-8'));
        }
    } catch (erro) {
        console.error('Não consegui ler cotacoes-manuais.json:', erro.message);
    }
    return {};
}

// Data de hoje no fuso de Brasília, formato AAAA-MM-DD
function dataDeHojeSP() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// "R$ 1234.5" -> "R$ 1.234,50" (formatação brasileira, sempre 2 casas)
function formatarReais(valorNumerico) {
    return 'R$ ' + valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Registra o valor de hoje no histórico e devolve a variação
// percentual em relação ao último valor salvo de um dia diferente
// (ou null se ainda não tiver um valor anterior pra comparar).
function registrarEObterVariacao(historico, chave, valorNumerico) {
    const hoje = dataDeHojeSP();
    const registroAnterior = historico[chave];

    let variacaoPercentual = null;

    if (registroAnterior && typeof registroAnterior.valor === 'number') {
        if (registroAnterior.data === hoje) {
            // Já registramos um valor hoje — mantém a variação que já
            // tinha sido calculada (contra o dia anterior a esse).
            variacaoPercentual = typeof registroAnterior.variacaoPercentual === 'number'
                ? registroAnterior.variacaoPercentual
                : null;
        } else {
            variacaoPercentual = ((valorNumerico - registroAnterior.valor) / registroAnterior.valor) * 100;
        }
    }

    historico[chave] = {
        data: hoje,
        valor: valorNumerico,
        variacaoPercentual: variacaoPercentual
    };

    return variacaoPercentual;
}

// Monta o objeto de variação que vai pro front-end, já formatado.
function formatarVariacao(percentual) {
    if (typeof percentual !== 'number' || Number.isNaN(percentual)) {
        return null;
    }
    const arredondado = Math.round(percentual * 100) / 100;
    return {
        percentual: arredondado,
        texto: (arredondado > 0 ? '+' : '') + arredondado.toFixed(2).replace('.', ',') + '%',
        direcao: arredondado > 0 ? 'alta' : (arredondado < 0 ? 'baixa' : 'estavel')
    };
}

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
// Termos excluídos de TODAS as buscas (mesmo dentro dos portais de
// agro, uma matéria pode falar de política, crime ou violência —
// isso é filtrado aqui, no título da matéria).
const TERMOS_EXCLUIDOS =
    'NOT (política OR político OR eleição OR eleições OR eleitoral OR ' +
    'presidente OR presidenciais OR ministro OR ministério OR governo OR ' +
    'congresso OR senado OR câmara OR STF OR STJ OR TSE OR partido OR ' +
    'crime OR crimes OR criminoso OR homicídio OR homicídios OR assassinato OR ' +
    'assassinatos OR assassinado OR assassinada OR morte OR mortes OR morto OR ' +
    'morta OR mortos OR mortas OR morreu OR morreram OR faleceu OR faleceram OR ' +
    'falecimento OR óbito OR óbitos OR vítima OR vítimas OR luto OR funeral OR ' +
    'velório OR violência OR violento OR polícia OR policial OR prisão OR preso OR ' +
    'presa OR tiroteio OR chacina OR estupro OR tráfico OR acidente OR tragédia OR ' +
    'guerra OR conflito)';

const QUERIES_POR_CATEGORIA = {
    geral: '(agro OR agronegócio OR agropecuária OR agricultura OR agronomia OR rural OR lavoura OR safra OR pecuária) ' + TERMOS_EXCLUIDOS,
    direito: '(direito OR jurídico OR jurídica OR "crédito rural" OR fundiária OR fundiário OR contrato OR PRONAF OR CPR OR CRA OR regularização OR sucessão) ' + TERMOS_EXCLUIDOS,
    gestao: '(gestão OR planejamento OR "propriedade rural" OR sucessório OR administração OR investimento OR custeio OR financiamento) ' + TERMOS_EXCLUIDOS
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

app.get('/api/cotacoes', async (req, res) => {
    try {
        const resultado = {};
        const historico = carregarHistorico();

        // --- Dólar (Frankfurter.app — 100% automático, gratuito,
        // sem chave, sem limite de uso) ---
        try {
            const respDolar = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
            if (respDolar.ok) {
                const dadosDolar = await respDolar.json();
                const valor = dadosDolar.rates && dadosDolar.rates.BRL;
                if (valor) {
                    const valorNumerico = Number(valor);
                    const variacaoPercentual = registrarEObterVariacao(historico, 'dolar', valorNumerico);
                    resultado.dolar = {
                        nome: 'Dólar',
                        valor: formatarReais(valorNumerico),
                        variacao: formatarVariacao(variacaoPercentual),
                        atualizadoEm: dadosDolar.date || null
                    };
                }
            }
        } catch (erroDolar) {
            console.error('Erro ao buscar cotação do dólar:', erroDolar);
        }

        // --- Milho, Boi Gordo, Soja e Café Arábica (CEPEA) ---
        // Valor vem do arquivo local cotacoes-manuais.json (ver
        // explicação no topo do arquivo); a variação é calculada
        // automaticamente comparando com o histórico.
        const cotacoesManuais = carregarCotacoesManuais();
        Object.keys(NOMES_COTACOES_MANUAIS).forEach((chave) => {
            const item = cotacoesManuais[chave];
            if (!item || typeof item.valor !== 'number') return;

            const variacaoPercentual = registrarEObterVariacao(historico, chave, item.valor);
            resultado[chave] = {
                nome: NOMES_COTACOES_MANUAIS[chave],
                valor: formatarReais(item.valor) + (item.unidade ? ' /' + item.unidade : ''),
                variacao: formatarVariacao(variacaoPercentual),
                atualizadoEm: item.atualizadoEm || null
            };
        });

        salvarHistorico(historico);

        res.json(resultado);

    } catch (erro) {
        console.error('Erro ao montar cotações:', erro);
        res.status(500).json({ erro: 'Não foi possível buscar as cotações no momento.' });
    }
});

app.listen(PORTA, () => {
    console.log('Servidor rodando na porta ' + PORTA);
});
