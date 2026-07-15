/* ================================================================
   SCRIPT DO SITE — Abraão J Miguel Advocacia do Agro
   Responsável por:
   1. Menu mobile (hambúrguer)
   2. Acordeão da seção "Áreas de Atuação"
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

});