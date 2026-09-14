/* ================================================================
   SCRIPT DO SITE — Abraão J Miguel Advocacia do Agro
   Responsável por:
   1. Menu mobile (hambúrguer)
   2. Acordeão da seção "Áreas de Atuação"
   3. Acordeão da seção "Dúvidas Frequentes"
   4. Destaque do link ativo no menu conforme a rolagem
   5. Animação leve de entrada dos blocos (.revelar) ao rolar a página
   6. Estrutura (stub) para futura integração com API de notícias
      do agronegócio
================================================================= */

document.addEventListener('DOMContentLoaded', function () {

    /* ------------------------------------------------------------
       1. MENU MOBILE (HAMBÚRGUER)
    ------------------------------------------------------------- */

    var botaoHamburguer = document.getElementById('botaoHamburguer');
    var menuNavegacao = document.getElementById('menuNavegacao');

    if (botaoHamburguer && menuNavegacao) {

        function alternarMenu() {
            var menuEstaAberto = menuNavegacao.classList.toggle('menu-aberto');
            botaoHamburguer.classList.toggle('menu-aberto', menuEstaAberto);
            botaoHamburguer.setAttribute('aria-expanded', menuEstaAberto);
        }

        function fecharMenu() {
            menuNavegacao.classList.remove('menu-aberto');
            botaoHamburguer.classList.remove('menu-aberto');
            botaoHamburguer.setAttribute('aria-expanded', 'false');
        }

        botaoHamburguer.addEventListener('click', alternarMenu);

        var linksDoMenu = menuNavegacao.querySelectorAll('a');
        linksDoMenu.forEach(function (link) {
            link.addEventListener('click', fecharMenu);
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                fecharMenu();
            }
        });
    }


    /* ------------------------------------------------------------
       1.5 COLUNAS INDEPENDENTES — SEÇÃO "ÁREAS DE ATUAÇÃO"
       Antes os cards ficavam em CSS Grid: ao abrir um card, a LINHA
       inteira (todas as colunas) crescia e empurrava tudo pra baixo.
       Agora distribuímos os cards em colunas flex independentes
       (uma <div class="coluna-servicos"> por coluna). Assim, abrir um
       card só empurra os cards abaixo dele NA MESMA COLUNA.
       O número de colunas muda por breakpoint (3 no desktop, 2 no
       tablet, 1 no mobile) e é recalculado ao redimensionar a janela.
    ------------------------------------------------------------- */

    var trilhaServicos = document.getElementById('trilhaServicos');
    var colunasAtuais = 0;

    function calcularNumeroColunas() {
        var largura = window.innerWidth;
        if (largura <= 768) return 1;
        if (largura <= 1024) return 2;
        return 3;
    }

    function distribuirCardsEmColunas() {
        if (!trilhaServicos) return;

        var numeroColunas = calcularNumeroColunas();
        if (numeroColunas === colunasAtuais) return; // nada mudou, evita retrabalho
        colunasAtuais = numeroColunas;

        // Pega todos os cards (não importa se já estão dentro de colunas)
        var cards = Array.prototype.slice.call(
            trilhaServicos.querySelectorAll('.cartao-servico')
        );

        // Cria as novas colunas
        var colunas = [];
        for (var i = 0; i < numeroColunas; i++) {
            var coluna = document.createElement('div');
            coluna.className = 'coluna-servicos';
            colunas.push(coluna);
        }

        // Distribui os cards nas colunas em zigue-zague (1,2,3,1,2,3...)
        // preservando a ordem de leitura original.
        cards.forEach(function (card, indice) {
            colunas[indice % numeroColunas].appendChild(card);
        });

        // Limpa o container e insere as colunas já montadas
        trilhaServicos.innerHTML = '';
        colunas.forEach(function (coluna) {
            trilhaServicos.appendChild(coluna);
        });
    }

    distribuirCardsEmColunas();

    var redimensionamentoServicos;
    window.addEventListener('resize', function () {
        clearTimeout(redimensionamentoServicos);
        redimensionamentoServicos = setTimeout(distribuirCardsEmColunas, 150);
    });


    /* ------------------------------------------------------------
       2. ACORDEÃO — SEÇÃO "ÁREAS DE ATUAÇÃO"
       Clicar no cabeçalho (ícone + título) mostra ou esconde o
       conteúdo do card. Só um card fica aberto por vez.
    ------------------------------------------------------------- */

    var cartoesServico = document.querySelectorAll('.cartao-servico');

    cartoesServico.forEach(function (cartao) {
        var cabecalho = cartao.querySelector('.cabecalho-servico');
        var detalhes = cartao.querySelector('.detalhes-servico');

        if (!cabecalho || !detalhes) return;

        cabecalho.addEventListener('click', function () {
            var estaAberto = cartao.classList.contains('aberto');

            // Fecha todos os outros cards abertos
            cartoesServico.forEach(function (outroCartao) {
                if (outroCartao !== cartao) {
                    outroCartao.classList.remove('aberto');
                    var outrosDetalhes = outroCartao.querySelector('.detalhes-servico');
                    var outroCabecalho = outroCartao.querySelector('.cabecalho-servico');
                    if (outrosDetalhes) outrosDetalhes.style.maxHeight = null;
                    if (outroCabecalho) outroCabecalho.setAttribute('aria-expanded', 'false');
                }
            });

            if (estaAberto) {
                cartao.classList.remove('aberto');
                detalhes.style.maxHeight = null;
                cabecalho.setAttribute('aria-expanded', 'false');
            } else {
                cartao.classList.add('aberto');
                detalhes.style.maxHeight = detalhes.scrollHeight + 'px';
                cabecalho.setAttribute('aria-expanded', 'true');
            }
        });
    });


    /* ------------------------------------------------------------
       3. ACORDEÃO — SEÇÃO "DÚVIDAS FREQUENTES"
       Só uma pergunta fica aberta por vez.
    ------------------------------------------------------------- */

    var itensDuvida = document.querySelectorAll('.item-duvida');

    itensDuvida.forEach(function (item) {
        var pergunta = item.querySelector('.pergunta-duvida');
        var resposta = item.querySelector('.resposta-duvida');

        if (!pergunta || !resposta) return;

        pergunta.addEventListener('click', function () {
            var estaAberta = item.classList.contains('aberta');

            // Fecha todas as outras perguntas abertas
            itensDuvida.forEach(function (outroItem) {
                if (outroItem !== item) {
                    outroItem.classList.remove('aberta');
                    var outraResposta = outroItem.querySelector('.resposta-duvida');
                    var outraPergunta = outroItem.querySelector('.pergunta-duvida');
                    if (outraResposta) outraResposta.style.maxHeight = null;
                    if (outraPergunta) outraPergunta.setAttribute('aria-expanded', 'false');
                }
            });

            if (estaAberta) {
                item.classList.remove('aberta');
                resposta.style.maxHeight = null;
                pergunta.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('aberta');
                resposta.style.maxHeight = resposta.scrollHeight + 'px';
                pergunta.setAttribute('aria-expanded', 'true');
            }
        });
    });


    /* ------------------------------------------------------------
       4. LINK ATIVO NO MENU CONFORME A ROLAGEM
    ------------------------------------------------------------- */

    var secoesComId = document.querySelectorAll('section[id]');
    var linksMenu = document.querySelectorAll('.menu-navegacao a');

    if (secoesComId.length && linksMenu.length) {
        var observadorSecoes = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    var idAtual = entrada.target.getAttribute('id');
                    linksMenu.forEach(function (link) {
                        link.classList.toggle(
                            'link-ativo',
                            link.getAttribute('href') === '#' + idAtual
                        );
                    });
                }
            });
        }, { rootMargin: '-45% 0px -45% 0px' });

        secoesComId.forEach(function (secao) {
            observadorSecoes.observe(secao);
        });
    }


    /* ------------------------------------------------------------
       5. REVELAR BLOCOS AO ROLAR (.revelar → .revelar.visivel)
    ------------------------------------------------------------- */

    var blocosRevelar = document.querySelectorAll('.revelar');

    if (blocosRevelar.length) {
        var observadorRevelar = new IntersectionObserver(function (entradas, observador) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visivel');
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15 });

        blocosRevelar.forEach(function (bloco) {
            observadorRevelar.observe(bloco);
        });
    }


/* ------------------------------------------------------------
   6. NOTÍCIAS DO AGRONEGÓCIO (via NewsAPI.org, através do
   backend próprio em siteabraao.onrender.com)
------------------------------------------------------------- */

async function carregarNoticiasAgro() {
    var trilha = document.getElementById('trilhaNoticiasAgro');
    if (!trilha) return;

    var url = 'https://siteabraao.onrender.com/api/noticias-agro';

    try {
        var resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error('Falha na requisição: ' + resposta.status);
        }

        var dados = await resposta.json();
        var artigos = dados.artigos || [];

        if (artigos.length === 0) {
            inicializarCarrossel(); // mantém o cartão de exemplo e ativa o carrossel mesmo assim
            return;
        }

        var IMAGEM_PADRAO = 'https://placehold.co/1200x500?text=Agronegócio';

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

        trilha.innerHTML = htmlGerado;

    } catch (erro) {
        console.error('Erro ao carregar notícias do agronegócio:', erro);
        // em caso de erro, o cartão de exemplo do HTML permanece
    } finally {
        inicializarCarrossel();
    }
}

/* ------------------------------------------------------------
   CARROSSEL DE NOTÍCIA EM DESTAQUE
   - loop infinito real (clona primeiro e último slide)
   - setas, bolinhas, arraste (mouse e touch)
   - auto-avanço a cada 5s, reinicia o timer a cada interação
------------------------------------------------------------- */
function inicializarCarrossel() {
    var viewport = document.getElementById('viewportNoticiasAgro');
    var trilha = document.getElementById('trilhaNoticiasAgro');
    var indicadoresContainer = document.getElementById('indicadoresNoticiasAgro');
    var setaAnterior = document.getElementById('setaAnteriorNoticias');
    var setaProxima = document.getElementById('setaProximaNoticias');

    if (!viewport || !trilha || !indicadoresContainer) return;

    var slidesOriginais = Array.prototype.slice.call(trilha.children);
    var totalReal = slidesOriginais.length;

    if (totalReal === 0) return;

    // Se só existe 1 notícia, não precisa de loop/clones/setas
    var comLoop = totalReal > 1;

    // Clona o primeiro e o último slide para permitir loop infinito suave
    if (comLoop) {
        var cloneUltimo = slidesOriginais[totalReal - 1].cloneNode(true);
        var clonePrimeiro = slidesOriginais[0].cloneNode(true);
        trilha.insertBefore(cloneUltimo, slidesOriginais[0]);
        trilha.appendChild(clonePrimeiro);
    }

    var todosSlides = Array.prototype.slice.call(trilha.children);
    var indiceAtual = comLoop ? 1 : 0; // começa no slide real (posição 1, pois 0 é o clone)
    var larguraViewport = viewport.offsetWidth;
    var arrastando = false;
    var posInicialX = 0;
    var deslocamentoAtual = 0;
    var timerAutoAvanco = null;
    var transicaoAtiva = true;

    // Cria as bolinhas (uma por notícia real, não por clone)
    indicadoresContainer.innerHTML = '';
    if (comLoop) {
        for (var i = 0; i < totalReal; i++) {
            var bolinha = document.createElement('button');
            bolinha.className = 'indicador-bolinha';
            bolinha.setAttribute('aria-label', 'Ir para notícia ' + (i + 1));
            bolinha.addEventListener('click', (function (indice) {
                return function () {
                    irParaSlide(indice + 1); // +1 por causa do clone inicial
                    reiniciarAutoAvanco();
                };
            })(i));
            indicadoresContainer.appendChild(bolinha);
        }
    } else {
        setaAnterior.style.display = 'none';
        setaProxima.style.display = 'none';
    }

    function atualizarBolinhas() {
        if (!comLoop) return;
        var bolinhas = indicadoresContainer.children;
        var indiceReal = (indiceAtual - 1 + totalReal) % totalReal;
        for (var i = 0; i < bolinhas.length; i++) {
            bolinhas[i].classList.toggle('ativo', i === indiceReal);
        }
    }

    function posicionar(comTransicao) {
        trilha.style.transition = comTransicao ? 'transform 0.45s ease' : 'none';
        trilha.style.transform = 'translateX(' + (-indiceAtual * larguraViewport) + 'px)';
    }

    function irParaSlide(indice) {
        indiceAtual = indice;
        posicionar(true);
        atualizarBolinhas();
    }

    function proximoSlide() {
        if (transicaoAtiva === false) return;
        irParaSlide(indiceAtual + 1);
    }

    function slideAnterior() {
        irParaSlide(indiceAtual - 1);
    }

    // Ao terminar a transição, se caiu num clone, "teleporta" sem transição
    // para o slide real correspondente — isso cria a ilusão de loop infinito
    trilha.addEventListener('transitionend', function () {
        if (!comLoop) return;

        if (indiceAtual === todosSlides.length - 1) {
            indiceAtual = 1;
            posicionar(false);
        } else if (indiceAtual === 0) {
            indiceAtual = totalReal;
            posicionar(false);
        }
    });

    function iniciarAutoAvanco() {
        if (!comLoop) return;
        timerAutoAvanco = setInterval(proximoSlide, 5000);
    }

    function pararAutoAvanco() {
        if (timerAutoAvanco) {
            clearInterval(timerAutoAvanco);
            timerAutoAvanco = null;
        }
    }

    function reiniciarAutoAvanco() {
        pararAutoAvanco();
        iniciarAutoAvanco();
    }

    // Setas
    if (comLoop) {
        setaProxima.addEventListener('click', function () {
            proximoSlide();
            reiniciarAutoAvanco();
        });

        setaAnterior.addEventListener('click', function () {
            slideAnterior();
            reiniciarAutoAvanco();
        });
    }

    // Recalcula a largura se a janela for redimensionada
    window.addEventListener('resize', function () {
        larguraViewport = viewport.offsetWidth;
        posicionar(false);
    });

    /* ---------- Arraste com mouse e touch ---------- */
    function iniciarArraste(x) {
        arrastando = true;
        posInicialX = x;
        trilha.classList.add('arrastando');
        trilha.style.transition = 'none';
        pararAutoAvanco();
    }

    function moverArraste(x) {
        if (!arrastando) return;
        deslocamentoAtual = x - posInicialX;
        var deslocamentoBase = -indiceAtual * larguraViewport;
        trilha.style.transform = 'translateX(' + (deslocamentoBase + deslocamentoAtual) + 'px)';
    }

    function finalizarArraste() {
        if (!arrastando) return;
        arrastando = false;
        trilha.classList.remove('arrastando');

        var limiteArraste = larguraViewport * 0.15; // 15% da largura já troca de slide

        if (deslocamentoAtual < -limiteArraste) {
            proximoSlide();
        } else if (deslocamentoAtual > limiteArraste) {
            slideAnterior();
        } else {
            posicionar(true); // volta pro lugar se o arraste foi pequeno
        }

        deslocamentoAtual = 0;
        reiniciarAutoAvanco();
    }

    // Mouse
    trilha.addEventListener('mousedown', function (e) {
        iniciarArraste(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
        moverArraste(e.clientX);
    });
    window.addEventListener('mouseup', finalizarArraste);

    // Touch (celular)
    trilha.addEventListener('touchstart', function (e) {
        iniciarArraste(e.touches[0].clientX);
    }, { passive: true });
    trilha.addEventListener('touchmove', function (e) {
        moverArraste(e.touches[0].clientX);
    }, { passive: true });
    trilha.addEventListener('touchend', finalizarArraste);

    // Pausa o auto-avanço quando o mouse está em cima (mas retoma ao sair)
    viewport.addEventListener('mouseenter', pararAutoAvanco);
    viewport.addEventListener('mouseleave', iniciarAutoAvanco);

    // Posição inicial
    posicionar(false);
    atualizarBolinhas();
    iniciarAutoAvanco();
}

carregarNoticiasAgro();

});