/* ================================================================
   SCRIPT DO SITE — Abraão J Miguel Advocacia do Agro
   Responsável por:
   1. Menu mobile (hambúrguer)
   2. Carrossel da seção "Áreas de Atuação"
   3. Acordeão da seção "Dúvidas Frequentes"
   4. Destaque do link ativo no menu conforme a rolagem
   5. Animação leve de entrada dos blocos (.revelar) ao rolar a página
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
       2. CARROSSEL — SEÇÃO "ÁREAS DE ATUAÇÃO"
       - A trilha (.trilha-servicos) rola horizontalmente com
         scroll-snap. As setas e os pontos apenas movem o scroll
         da trilha; o CSS cuida do alinhamento de cada card.
       - O número de "páginas" é calculado a partir de quantos
         cards cabem por vez (1 no mobile, 2 no tablet, 3 no
         desktop), então os pontos se recalculam ao redimensionar.
    ------------------------------------------------------------- */

    var trilhaServicos = document.getElementById('trilhaServicos');
    var setaAnterior = document.getElementById('setaAnterior');
    var setaProxima = document.getElementById('setaProxima');
    var pontosCarrossel = document.getElementById('pontosCarrossel');

    if (trilhaServicos && setaAnterior && setaProxima && pontosCarrossel) {

        var cartoes = Array.prototype.slice.call(trilhaServicos.children);
        var paginaAtual = 0;
        var totalPaginas = 1;

        function cartoesPorPagina() {
            var largura = window.innerWidth;
            if (largura <= 768) return 1;
            if (largura <= 1024) return 2;
            return 3;
        }

        function construirPontos() {
            pontosCarrossel.innerHTML = '';
            var porPagina = cartoesPorPagina();
            totalPaginas = Math.max(1, Math.ceil(cartoes.length / porPagina));

            for (var i = 0; i < totalPaginas; i++) {
                var ponto = document.createElement('button');
                ponto.setAttribute('aria-label', 'Ir para o grupo ' + (i + 1) + ' de serviços');
                ponto.addEventListener('click', function (indice) {
                    return function () { irParaPagina(indice); };
                }(i));
                pontosCarrossel.appendChild(ponto);
            }
            atualizarEstadoVisual();
        }

        function irParaPagina(indice) {
            var porPagina = cartoesPorPagina();
            var indiceCartao = indice * porPagina;
            var cartaoDestino = cartoes[Math.min(indiceCartao, cartoes.length - 1)];

            if (cartaoDestino) {
                trilhaServicos.scrollTo({
                    left: cartaoDestino.offsetLeft,
                    behavior: 'smooth'
                });
            }

            paginaAtual = indice;
            atualizarEstadoVisual();
        }

        function atualizarEstadoVisual() {
            var pontos = pontosCarrossel.querySelectorAll('button');
            pontos.forEach(function (ponto, indice) {
                ponto.classList.toggle('ponto-ativo', indice === paginaAtual);
            });

            setaAnterior.disabled = paginaAtual <= 0;
            setaProxima.disabled = paginaAtual >= totalPaginas - 1;
        }

        // Detecta em qual página o usuário está ao arrastar/rolar manualmente
        var recalculandoPorScroll = false;
        trilhaServicos.addEventListener('scroll', function () {
            if (recalculandoPorScroll) return;
            recalculandoPorScroll = true;

            window.requestAnimationFrame(function () {
                var porPagina = cartoesPorPagina();
                var larguraCartao = cartoes[0] ? cartoes[0].offsetWidth + 24 : 1;
                var indiceCartaoVisivel = Math.round(trilhaServicos.scrollLeft / larguraCartao);
                paginaAtual = Math.min(
                    totalPaginas - 1,
                    Math.round(indiceCartaoVisivel / porPagina)
                );
                atualizarEstadoVisual();
                recalculandoPorScroll = false;
            });
        });

        setaAnterior.addEventListener('click', function () {
            if (paginaAtual > 0) irParaPagina(paginaAtual - 1);
        });

        setaProxima.addEventListener('click', function () {
            if (paginaAtual < totalPaginas - 1) irParaPagina(paginaAtual + 1);
        });

        window.addEventListener('resize', construirPontos);

        construirPontos();
    }


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

});
