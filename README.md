# Backend de Notícias do Agronegócio

Servidor Node.js simples que faz a chamada à NewsAPI por você,
escondendo a chave da API e evitando o bloqueio de CORS que o
plano gratuito da NewsAPI aplica em produção.

## Como rodar localmente

1. Instale as dependências:
   ```
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente:
   ```
   cp .env.example .env
   ```

3. Abra o `.env` e coloque sua chave real da NewsAPI:
   ```
   NEWS_API_KEY=sua_chave_aqui
   ```

4. Instale o pacote `dotenv` (só é necessário localmente, para
   ler o arquivo `.env`; em produção a hospedagem gerencia isso
   por você):
   ```
   npm install dotenv
   ```
   E adicione no topo do `server.js`:
   ```js
   require('dotenv').config();
   ```

5. Rode o servidor:
   ```
   npm start
   ```

6. Teste no navegador ou com curl:
   ```
   http://localhost:3000/api/noticias-agro
   ```

## Como publicar (produção)

Use um serviço como Render, Railway ou Fly.io (todos têm planos
gratuitos):

1. Suba este projeto para um repositório no GitHub (o `.gitignore`
   já impede que `.env` e `node_modules` sejam enviados).
2. Crie um novo serviço "Web Service" na plataforma escolhida,
   apontando para o repositório.
3. Nas configurações do serviço, defina a variável de ambiente
   `NEWS_API_KEY` com sua chave real da NewsAPI.
4. A plataforma vai instalar as dependências e rodar
   `npm start` automaticamente.
5. Você receberá uma URL pública, por exemplo:
   `https://seu-app.onrender.com`

## Como usar no front-end

No seu `script.js`, troque a chamada direta à NewsAPI por uma
chamada ao seu próprio backend:

```javascript
async function carregarNoticiasAgro() {
    var containerNoticias = document.getElementById('containerNoticiasAgro');
    if (!containerNoticias) return;

    // Troque pela URL do seu backend publicado
    var url = 'https://seu-app.onrender.com/api/noticias-agro';

    try {
        var resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Falha na requisição: ' + resposta.status);
        }

        var dados = await resposta.json();
        var artigos = dados.artigos || [];

        if (artigos.length === 0) {
            return; // mantém os cartões de exemplo se não vier nada
        }

        var IMAGEM_PADRAO = 'https://via.placeholder.com/400x220?text=Agronegócio';

        var htmlGerado = artigos.map(function (artigo) {
            var data = artigo.data
                ? new Date(artigo.data).toLocaleDateString('pt-BR')
                : '';

            return `
                <a class="cartao-noticia" href="${artigo.link}" target="_blank" rel="noopener noreferrer">
                    <div class="imagem-noticia">
                        <img src="${artigo.imagem || IMAGEM_PADRAO}" alt="${artigo.titulo}" onerror="this.src='${IMAGEM_PADRAO}'">
                    </div>
                    <div class="conteudo-noticia">
                        <h3>${artigo.titulo}</h3>
                        <p>${artigo.resumo}</p>
                        <span class="fonte-noticia">${artigo.fonte} · ${data}</span>
                    </div>
                </a>
            `;
        }).join('');

        containerNoticias.innerHTML = htmlGerado;

    } catch (erro) {
        console.error('Erro ao carregar notícias do agronegócio:', erro);
    }
}

carregarNoticiasAgro();
```

## Subcategorias e página completa de notícias

O endpoint agora aceita dois parâmetros opcionais:

- `?categoria=geral|direito|gestao` — filtra o assunto das notícias.
  `geral` é a mistura usada no carrossel da home; `direito` cobre
  crédito rural, contratos agrários, regularização fundiária, etc.;
  `gestao` cobre gestão e planejamento da propriedade rural.
- `?limite=N` — quantas notícias devolver (padrão 6, máximo 20).

Exemplo: `https://seu-app.onrender.com/api/noticias-agro?categoria=direito&limite=12`

A página `noticias.html` usa esses parâmetros para os botões de
filtro (Todas / Agro Direito / Agro Gestão) e mostra 12 notícias por
vez. O carrossel da home (`index.html`) continua usando a categoria
`geral` com 6 notícias, sem precisar mudar nada no `script.js` da home.

## Observações importantes

- **Regenere sua chave da NewsAPI.** Ela apareceu exposta no
  código do front-end anteriormente, então qualquer pessoa pode
  tê-la copiado. Gere uma nova chave no painel da NewsAPI e use
  apenas essa nova chave aqui no backend.
- O servidor guarda um cache de 15 minutos em memória, um para cada
  combinação de categoria+limite, para não estourar o limite de
  requisições do plano gratuito da NewsAPI. Se o servidor reiniciar,
  o cache é perdido (isso é esperado para um projeto simples).
- Depois de atualizar o `server.js`, é preciso reimplantar o backend
  no Render (ou onde ele estiver hospedado) para as subcategorias
  funcionarem — o arquivo antigo publicado não tem esse suporte.

## Tira de cotações e capa do e-book (pendências)

- A tira de cotações no topo do site (`#trilhaCotacoes`) ainda está
  com dados de exemplo fixos. Quando você escolher a API de
  cotações (CEPEA/Esalq, B3, etc.), implemente o fetch dentro de
  `carregarCotacoesAgro()` em `script.js` — o passo a passo está
  comentado ali mesmo.
- O card do e-book espera uma imagem de capa em
  `eBooks/capas/gestao-propriedade-rural.jpg` (proporção retrato,
  ex. 600×800px). Até essa imagem existir, aparece um placeholder
  cinza no lugar.
