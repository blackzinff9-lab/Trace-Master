// ── TELA INICIAL ─────────────────────────────────────────────────────────
    function renderizarTelaInicial() {
        const lista  = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
        const el     = document.getElementById('projetos-lista-inicial');
        if (lista.length === 0) {
            el.innerHTML = '<div class="proj-sem">Nenhum projeto salvo ainda.<br>Crie um novo! ✏️</div>';
            return;
        }
        el.innerHTML = [...lista].reverse().map((p, i) => {
            const idxReal = lista.length - 1 - i;
            return `<div class="proj-item-inicial" onclick="carregarProjetoInicial(${idxReal})">
                <div style="font-size:24px">📁</div>
                <div class="proj-info">
                    <div class="proj-nome">${p.nome}</div>
                    <div class="proj-data">${p.data}</div>
                </div>
                <button class="proj-del" onclick="event.stopPropagation();deletarProjetoInicial(${idxReal})">✕</button>
            </div>`;
        }).join('');
    }

    let _editorAberto = false;

    function abrirEditor() {
        _editorAberto = true;
        centralizarFolha();
        const tela = document.getElementById('tela-inicial');
        tela.style.opacity = '0';
        tela.style.transition = 'opacity 0.4s';
        setTimeout(() => {
            tela.style.display = 'none';
            centralizarFolha();
        }, 450);
    }

    function voltarInicio() {
        _editorAberto = false;
        camadas = [criarCamada('Camada 1')];
        camadaAtiva = 0; caminhoAtivo = -1;
        pontosPen = []; pathFechado = false;
        penLayer.innerHTML = ''; drawLayer.innerHTML = ''; livreLayer.innerHTML = '';
        document.getElementById('texto-layer').innerHTML = '';
        svgArea.innerHTML = '';
        camadaFoto = { opacidade: 1, visivel: true, svgHTML: '' };
        fotoOrdem = -1;
        historico = []; historicoFuturo = [];
        modoPen = false; modoEditar = false; modoLivre = false; modoBorracha = false;
        _esconderBolinhasDegrade(); _esconderBolinhasTxtDg();
        modoDegrade = false; degradeStart = null;
        _dgPrevReset();
        document.getElementById('btnDegrade').style.background = '#e74c3c';
        document.getElementById('degrade-preview-layer').innerHTML = '';
        const bFerr = document.getElementById('btnFerramentas');
        const bEdit = document.getElementById('btnEditar');
        const bFech = document.getElementById('btnFechar');
        if (bFerr) { bFerr.textContent = '🖊 PEN ▾'; bFerr.style.background = '#ff00ff'; }
        if (bEdit) bEdit.style.background = '#333';
        if (bFech) bFech.style.background = '#333';
        const tela = document.getElementById('tela-inicial');
        tela.style.display = 'flex';
        tela.style.opacity = '0';
        setTimeout(() => { tela.style.transition = 'opacity 0.4s'; tela.style.opacity = '1'; }, 10);
        renderizarTelaInicial();
    }

    let tipoNovoProjeto = 'finito';
    let modoInfinito = false;
    let gradeAtiva = false;
    let gradeTamanho = 20;

    function renderizarGrade() {
        const layer = document.getElementById('grade-layer');
        layer.innerHTML = '';
        if (!gradeAtiva) return;

        const W = workSurface.offsetWidth  || 800;
        const H = workSurface.offsetHeight || 1000;
        const tam = gradeTamanho;
        const cor = 'rgba(0,0,0,0.08)';
        const corForte = 'rgba(0,0,0,0.15)';

        const ns = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(ns, 'defs');
        const pat = document.createElementNS(ns, 'pattern');
        pat.setAttribute('id', 'grade-pat');
        pat.setAttribute('width', tam);
        pat.setAttribute('height', tam);
        pat.setAttribute('patternUnits', 'userSpaceOnUse');

        const l1 = document.createElementNS(ns, 'path');
        l1.setAttribute('d', `M ${tam} 0 L 0 0 0 ${tam}`);
        l1.setAttribute('fill', 'none');
        l1.setAttribute('stroke', cor);
        l1.setAttribute('stroke-width', '0.5');
        pat.appendChild(l1);

        defs.appendChild(pat);
        layer.appendChild(defs);

        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#grade-pat)');
        layer.appendChild(rect);

        const patG = document.createElementNS(ns, 'pattern');
        patG.setAttribute('id', 'grade-pat-grande');
        patG.setAttribute('width', tam*5);
        patG.setAttribute('height', tam*5);
        patG.setAttribute('patternUnits', 'userSpaceOnUse');
        const l2 = document.createElementNS(ns, 'path');
        l2.setAttribute('d', `M ${tam*5} 0 L 0 0 0 ${tam*5}`);
        l2.setAttribute('fill', 'none');
        l2.setAttribute('stroke', corForte);
        l2.setAttribute('stroke-width', '0.8');
        patG.appendChild(l2);
        defs.appendChild(patG);

        const rectG = document.createElementNS(ns, 'rect');
        rectG.setAttribute('width', '100%');
        rectG.setAttribute('height', '100%');
        rectG.setAttribute('fill', 'url(#grade-pat-grande)');
        layer.appendChild(rectG);
    }

    window.abrirModalNovoProjeto = () => {
        tipoNovoProjeto = 'finito';
        gradeAtiva = false;
        gradeTamanho = 20;
        document.getElementById('card-finito').classList.add('ativo');
        document.getElementById('card-infinito').classList.remove('ativo');
        document.getElementById('chk-grade').checked = false;
        document.getElementById('grade-size-wrap').style.display = 'none';
        ['20','40','80','100'].forEach(s => {
            document.getElementById('gs-'+s).classList.toggle('ativo', s==='20');
        });
        document.getElementById('modal-novo-projeto').classList.add('aberto');
    };

    document.getElementById('chk-grade').addEventListener('change', (e) => {
        gradeAtiva = e.target.checked;
        document.getElementById('grade-size-wrap').style.display = gradeAtiva ? 'block' : 'none';
    });

    ['20','40','80','100'].forEach(s => {
        document.getElementById('gs-'+s).addEventListener('touchstart', (e) => {
            e.stopPropagation();
            gradeTamanho = parseInt(s);
            ['20','40','80','100'].forEach(x =>
                document.getElementById('gs-'+x).classList.toggle('ativo', x===s));
        }, {passive:true});
    });

    function fecharModalNovoProjeto() {
        document.getElementById('modal-novo-projeto').classList.remove('aberto');
    }

    document.getElementById('card-finito').addEventListener('touchstart', (e) => {
        e.stopPropagation();
        tipoNovoProjeto = 'finito';
        document.getElementById('card-finito').classList.add('ativo');
        document.getElementById('card-infinito').classList.remove('ativo');
    }, {passive:true});

    document.getElementById('card-infinito').addEventListener('touchstart', (e) => {
        e.stopPropagation();
        tipoNovoProjeto = 'infinito';
        document.getElementById('card-infinito').classList.add('ativo');
        document.getElementById('card-finito').classList.remove('ativo');
    }, {passive:true});

    document.getElementById('btn-confirmar-novo-proj').addEventListener('touchstart', (e) => {
        e.stopPropagation(); e.preventDefault();
        fecharModalNovoProjeto();
        novoProjeto(tipoNovoProjeto);
    }, {passive:false});

    document.getElementById('btn-cancelar-novo-proj').addEventListener('touchstart', (e) => {
        e.stopPropagation();
        fecharModalNovoProjeto();
    }, {passive:true});

    window.novoProjeto = (tipo = 'finito') => {
        modoInfinito = (tipo === 'infinito');

        camadas = [criarCamada('Camada 1')];
        camadaAtiva = 0; caminhoAtivo = -1;
        pontosPen = []; pathFechado = false;
        penLayer.innerHTML = ''; drawLayer.innerHTML = '';
        svgArea.innerHTML = ''; livreLayer.innerHTML = '';
        document.getElementById('texto-layer').innerHTML = '';
        camadaFoto = { opacidade: 1, visivel: true, svgHTML: '' };
        fotoOrdem = -1;
        historico = []; historicoFuturo = [];
        modoPen = false; modoEditar = false; modoLivre = false; modoBorracha = false;
        _esconderBolinhasDegrade(); _esconderBolinhasTxtDg();
        modoDegrade = false; degradeStart = null;
        _dgPrevReset();
        document.getElementById('btnDegrade').style.background = '#e74c3c';
        document.getElementById('degrade-preview-layer').innerHTML = '';
        const bFerr = document.getElementById('btnFerramentas');
        const bEdit = document.getElementById('btnEditar');
        const bFech = document.getElementById('btnFechar');
        if (bFerr) { bFerr.textContent = '🖊 PEN ▾'; bFerr.style.background = '#ff00ff'; }
        if (bEdit) bEdit.style.background = '#333';
        if (bFech) bFech.style.background = '#333';

        aplicarModoInfinito(modoInfinito);
        renderizarGrade();
        abrirEditor();
    };

    const INF_SIZE = 50000;

    function aplicarModoInfinito(ativo) {
        const vp  = document.getElementById('viewport');
        const ws  = workSurface;
        const ind = document.getElementById('indicador-infinito');

        if (ativo) {
            ws.style.width      = INF_SIZE + 'px';
            ws.style.height     = INF_SIZE + 'px';
            ws.style.background = 'white';
            ws.style.boxShadow  = 'none';
            vp.classList.add('infinito');
            ind.style.display   = 'block';

            scale = 0.8;
            posX  = 20;
            posY  = 80;
        } else {
            ws.style.background = 'white';
            ws.style.boxShadow  = '0 0 20px rgba(0,0,0,0.5)';
            vp.classList.remove('infinito');
            ind.style.display   = 'none';
            const folha = (configUsuario?.folha || '800x1000').split('x');
            ws.style.width  = folha[0] + 'px';
            ws.style.height = folha[1] + 'px';
            scale = 0.8; posX = 20; posY = 80;
        }
        update();
    }

    function centralizarFolha() {
        scale = 0.8;
        if (modoInfinito) {
            scale = 1.0;
            posX = window.innerWidth  / 2 - 2000 * scale;
            posY = window.innerHeight / 2 - 2000 * scale;
        } else {
            const wsW = workSurface.offsetWidth  || 800;
            const wsH = workSurface.offsetHeight || 1000;
            posX = window.innerWidth  / 2 - (wsW / 2) * scale;
            posY = window.innerHeight / 2 - (wsH / 2) * scale;
        }
        update();
    }

    let expansaoInterval = null;
    function iniciarExpansaoInfinita() {}
    function pararExpansaoInfinita() {
        if (expansaoInterval) { clearInterval(expansaoInterval); expansaoInterval = null; }
    }

   window.carregarProjetoInicial = (idx) => {
        const lista = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
        const p = lista[idx];
        if (!p) return;
        camadas = p.camadas; camadaFoto = p.camadaFoto;
        fotoOrdem = (p.fotoOrdem !== undefined) ? p.fotoOrdem : -1;
        camadaAtiva = 0; caminhoAtivo = -1; pontosPen = []; pathFechado = false;
        penLayer.innerHTML = '';
        if (p.workW) workSurface.style.width  = p.workW + 'px';
        if (p.workH) workSurface.style.height = p.workH + 'px';
        rotacao = p.rotacao || 0;
        svgArea.innerHTML = camadaFoto.svgHTML || '';
        document.getElementById('texto-layer').innerHTML = p.textoHTML || '';
        historico = []; historicoFuturo = [];
        modoInfinito   = p.modoInfinito   || false;
        gradeAtiva     = p.gradeAtiva     || false;
        gradeTamanho   = p.gradeTamanho   || 20;
        _esconderBolinhasDegrade(); _esconderBolinhasTxtDg();
        modoDegrade = false; degradeStart = null; _dgPrevReset();
        document.getElementById('btnDegrade').style.background = '#e74c3c';
        document.getElementById('degrade-preview-layer').innerHTML = '';
        aplicarModoInfinito(modoInfinito);
        renderizarTodos();
        abrirEditor();
    };
window.deletarProjetoInicial = (idx) => {
    const lista = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
    lista.splice(idx, 1);
    localStorage.setItem('tm_projetos', JSON.stringify(lista));
    renderizarTelaInicial();
};

let _autoSaveTimer = null;
function _autoSave() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
        try {
            if (camadas[camadaAtiva]) {
                camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
            }
            const rascunho = {
                ts: Date.now(),
                camadas: camadas.map(c => ({
                    ...c, caminhos: c.caminhos.map(p => ({...p, pontos: [...p.pontos]}))
                })),
                camadaFoto,
                fotoOrdem,
                textoHTML: document.getElementById('texto-layer').innerHTML,
                workW: workSurface.offsetWidth,
                workH: workSurface.offsetHeight,
                modoInfinito, gradeAtiva, gradeTamanho, rotacao,
            };
            localStorage.setItem('tm_rascunho', JSON.stringify(rascunho));
            const n = document.getElementById('notificacao');
            if (n) { n.textContent = '💾 Rascunho salvo'; n.style.display='block'; setTimeout(()=>n.style.display='none', 1200); }
        } catch(e) { console.warn('Auto-save falhou:', e); }
    }, 2000);
}

let _histTimer = null;
function salvarHistorico() {
    if (_histTimer) { clearTimeout(_histTimer); _histTimer = null; }

    if (camadas[camadaAtiva]) {
        camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
    }

    _histTimer = setTimeout(() => {
        _histTimer = null;
        if (camadas[camadaAtiva]) {
            camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
        }
        historico.push(JSON.stringify({
            camadas: camadas.map(c => ({
                ...c, caminhos: c.caminhos.map(p => ({...p, pontos: [...p.pontos]}))
            })),
            camadaAtivaIdx: camadaAtiva,
            fotoOrdem,
            texto: document.getElementById('texto-layer').innerHTML
        }));
        historicoFuturo = [];
        if (historico.length > 30) historico.shift();
        _autoSave();
    }, 80);
}

window.desfazerPen = () => {
    if (modoBorracha && pontosBorracha.length > 0) {
        pontosBorracha.pop();
        renderizarBorracha();
        return;
    }
    if ((modoPen || modoEditar) && pontosPen.length > 0) {
        historicoFuturo.push(JSON.stringify({
            pontos: [...pontosPen.map(p => ({...p}))],
            fechado: pathFechado
        }));
        pontosPen.pop();
        if (pathFechado) {
            pathFechado = false;
            document.getElementById('btnFechar').style.background = '#333';
        }
        renderizarPen();
        return;
    }
    if (historico.length === 0) return;

    if (camadas[camadaAtiva]) {
        camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
    }
    historicoFuturo.push(JSON.stringify({
        camadas: camadas.map(c => ({
            ...c, caminhos: c.caminhos.map(p => ({...p, pontos: [...p.pontos]}))
        })),
        camadaAtivaIdx: camadaAtiva,
        texto: document.getElementById('texto-layer').innerHTML
    }));
    const snap = JSON.parse(historico.pop());
    camadas = snap.camadas !== undefined ? snap.camadas : snap;
    if (snap.camadaAtivaIdx !== undefined) camadaAtiva = snap.camadaAtivaIdx;
    if (snap.fotoOrdem !== undefined) fotoOrdem = snap.fotoOrdem;
    if (snap.texto !== undefined) document.getElementById('texto-layer').innerHTML = snap.texto;
    if (snap.livre !== undefined && camadas[camadaAtiva]) {
        camadas[camadaAtiva].livreHTML = snap.livre;
    }
    caminhoAtivo = -1; pontosPen = []; pathFechado = false;
    penLayer.innerHTML = '';
    document.getElementById('btnFechar').style.background = '#333';
    document.getElementById('btn-confirmar-pen').style.display = 'none';
    renderizarTodos();
    if (painelAberto) renderizarPainel();
};

window.refazerPen = () => {
    if (historicoFuturo.length === 0) return;
    const snapshot = JSON.parse(historicoFuturo.pop());
    if (snapshot.pontos !== undefined) {
        pontosPen   = snapshot.pontos;
        pathFechado = snapshot.fechado;
        document.getElementById('btnFechar').style.background = pathFechado ? '#03dac6' : '#333';
        renderizarPen();
    } else {
        if (camadas[camadaAtiva]) {
            camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
        }
        historico.push(JSON.stringify({
            camadas: camadas.map(c => ({
                ...c, caminhos: c.caminhos.map(p => ({...p, pontos: [...p.pontos]}))
            })),
            camadaAtivaIdx: camadaAtiva,
            texto: document.getElementById('texto-layer').innerHTML
        }));
        camadas = snapshot.camadas !== undefined ? snapshot.camadas : snapshot;
        if (snapshot.camadaAtivaIdx !== undefined) camadaAtiva = snapshot.camadaAtivaIdx;
        if (snapshot.fotoOrdem !== undefined) fotoOrdem = snapshot.fotoOrdem;
        if (snapshot.texto !== undefined) document.getElementById('texto-layer').innerHTML = snapshot.texto;
        if (snapshot.livre !== undefined && camadas[camadaAtiva]) {
            camadas[camadaAtiva].livreHTML = snapshot.livre;
        }
        caminhoAtivo = -1; pontosPen = []; pathFechado = false;
        penLayer.innerHTML = '';
        document.getElementById('btnFechar').style.background = '#333';
        document.getElementById('btn-confirmar-pen').style.display = 'none';
        renderizarTodos();
        if (painelAberto) renderizarPainel();
    }
};

window.resetView = () => {
    scale = 0.8; posX = 20; posY = 80; rotacao = 0;
    update();
    _atualizarIndicadorRotacao();
};

const nomesFerr = { pen: '🖊 PEN ▾', livre: '✏️ LIVRE ▾', borracha: '🧹 BORR ▾' };
const coresFerr = { pen: '#ff00ff', livre: '#03dac6', borracha: '#ff6600' };

window.toggleMenuFerramentas = () => {
    menuFerraberto = !menuFerraberto;
    document.getElementById('menu-ferramentas').style.display = menuFerraberto ? 'flex' : 'none';
    if (menuFerraberto && menuPinceisAberto) fecharMenuPinceis();
};

window.selecionarFerramenta = (f) => {
    ferramentaAtiva = f;
    menuFerraberto  = false;
    document.getElementById('menu-ferramentas').style.display = 'none';
    const _ficEl = document.getElementById('ferr-icon');
    const _flbEl = document.getElementById('ferr-label');
    if (_ficEl) _ficEl.textContent = nomesFerr[f] ? nomesFerr[f].split(' ')[0] : '🖊';
    if (_flbEl) _flbEl.textContent = { pen:'PEN', livre:'LIVRE', borracha:'BORR' }[f] || 'DRAW';
    ['pen','livre','borracha'].forEach(n => {
        document.getElementById('fBtn-' + n).style.background =
            n === f ? coresFerr[f] : '#333';
    });
    modoPen = false; modoLivre = false; modoBorracha = false;
    penLayer.innerHTML = '';
    pontosBorracha = [];
    borrachaLayer.innerHTML = '';
    if (f === 'pen') {
        modoPen = true;
        encerrarEdicao();
        const caminhos = getCaminhos();
        caminhoAtivo = caminhos.length;
        caminhos.push({pontos:[], fechado:false,
            stroke:  document.getElementById('col-main').value,
            width:   document.getElementById('brush-size').value,
            opacity: document.getElementById('brush-opacity').value,
            tipo:    document.getElementById('pincel-tipo').value,
            pincel:  pincelAtual});
        pontosPen   = caminhos[caminhoAtivo].pontos;
        pathFechado = false;
    } else if (f === 'livre') {
        modoLivre = true;
    } else if (f === 'borracha') {
        modoBorracha = true;
    }
};

window.toggleMover = () => {
    folhaTravada = !folhaTravada;
    document.getElementById('btnMover').textContent =
        folhaTravada ? '🔒 MOVER' : '🔓 MOVER';
    document.getElementById('btnMover').style.background =
        folhaTravada ? '#ff6600' : '#333';
};

window.toggleModo = () => {
    modoPen=false; modoEditar=false; modoLivre=false; modoBorracha=false;
    const bFerr = document.getElementById('btnFerramentas');
    if (bFerr) { bFerr.textContent = '🖊 PEN ▾'; bFerr.style.background = '#ff00ff'; }
    document.getElementById('btnEditar').style.background='#333';
    encerrarEdicao();
};

window.fecharCaminho = () => {
    if (pontosPen.length < 3) return;
    pathFechado = !pathFechado;
    document.getElementById('btnFechar').style.background = pathFechado ? '#03dac6' : '#333';
    renderizarPen();
};
window.abrirModalSalvar = () => {
    document.getElementById('modal-salvar').classList.add('aberto');
};

document.getElementById('modal-degrade').addEventListener('touchstart', (e) => {
    if (e.target === document.getElementById('modal-degrade')) fecharModalDegrade();
}, {passive:true});

document.getElementById('dg-n2').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setNCores(2);
}, {passive:true});
document.getElementById('dg-n3').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setNCores(3);
}, {passive:true});
document.getElementById('dg-n4').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setNCores(4);
}, {passive:true});
['dg-c0','dg-c1','dg-c2','dg-c3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', atualizarPreviewDegrade);
});

document.getElementById('btnSelecao').addEventListener('touchstart', (e) => {
    e.stopPropagation(); toggleSelecao();
}, {passive:true});
document.getElementById('btnTexto').addEventListener('touchstart', (e) => {
    e.stopPropagation(); ativarModoTexto();
}, {passive:true});
document.getElementById('btnRegua').addEventListener('touchstart', (e) => {
    e.stopPropagation(); toggleRegua();
}, {passive:true});
document.getElementById('btnContaGotas').addEventListener('touchstart', (e) => {
    e.stopPropagation(); toggleContaGotas();
}, {passive:true});
document.getElementById('btnEspelho').addEventListener('touchstart', (e) => {
    e.stopPropagation(); toggleEspelho();
}, {passive:true});

document.getElementById('dg-btn-linear').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setTipoDegrade('linear');
}, {passive:true});
document.getElementById('dg-btn-radial').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setTipoDegrade('radial');
}, {passive:true});
document.getElementById('dg-btn-tela').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setFillDegrade('tela');
}, {passive:true});
document.getElementById('dg-btn-camada').addEventListener('touchstart', (e) => {
    e.stopPropagation(); setFillDegrade('camada');
}, {passive:true});
document.getElementById('dg-btn-desenhar').addEventListener('touchstart', (e) => {
    e.stopPropagation(); e.preventDefault(); confirmarDegrade();
}, {passive:false});
document.getElementById('dg-btn-cancelar').addEventListener('touchstart', (e) => {
    e.stopPropagation(); fecharModalDegrade();
}, {passive:true});

window.fecharModalSalvar = () => {
    document.getElementById('modal-salvar').classList.remove('aberto');
    document.getElementById('lista-projetos').style.display = 'none';
};

function mostrarNotificacao(msg) {
    const n = document.getElementById('notificacao');
    n.textContent = msg;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 2500);
}

function montarSVGString() {
    salvarCaminhoAtivo();
    if (camadas[camadaAtiva]) {
        camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
    }
    const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
    let defsHTML = '', contentHTML = '';

    const totalCamadas = camadas.length;
    const fotoPos = (fotoOrdem < 0 || fotoOrdem >= totalCamadas) ? totalCamadas : fotoOrdem;

    function exportarCamada(cam) {
        if (!cam.visivel) return;
        if (cam.livreHTML) {
            const tmpSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
            tmpSVG.innerHTML = cam.livreHTML;
            [...tmpSVG.children].forEach(child => {
                if (child.tagName.toLowerCase() === 'defs') {
                    defsHTML += child.innerHTML;
                } else {
                    contentHTML += child.outerHTML;
                }
            });
        }
        cam.caminhos.forEach(c => {
            const d = buildPathD(c.pontos, c.fechado);
            if (!d) return;
            const path = document.createElementNS('http://www.w3.org/2000/svg','path');
            path.setAttribute('d', d);
            aplicarEstiloPath(path, c, cam.opacidade);
            contentHTML += path.outerHTML;
        });
    }

    for (let i = totalCamadas - 1; i >= fotoPos; i--) exportarCamada(camadas[i]);

    if (camadaFoto.visivel && camadaFoto.svgHTML) {
        contentHTML += `<g opacity="${camadaFoto.opacidade}">${camadaFoto.svgHTML}</g>`;
    }

    for (let i = fotoPos - 1; i >= 0; i--) exportarCamada(camadas[i]);

    const texLayer = document.getElementById('texto-layer');
    [...texLayer.children].forEach(child => {
        if (child.tagName.toLowerCase() === 'defs') {
            defsHTML += child.innerHTML;
        } else {
            contentHTML += child.outerHTML;
        }
    });

    const defsTag = defsHTML ? `<defs>${defsHTML}</defs>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${defsTag}${contentHTML}</svg>`;
}

// ── EXPORTAR PDF ─────────────────────────────────────────────────────────
window.baixarPDF = () => {
    fecharModalSalvar();
    mostrarNotificacao('⏳ Preparando exportador de PDF...');
    window.TM_carregarJsPDF().then(() => {
    const svgStr = montarSVGString();
    const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
    const blob = new Blob([svgStr], {type: 'image/svg+xml'});
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: W > H ? 'landscape' : 'portrait',
            unit: 'px', format: [W, H]
        });
        pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, W, H);
        pdf.save('tracemaster.pdf');
        mostrarNotificacao('✅ PDF exportado!');
    };
    img.src = url;
    }).catch(() => mostrarNotificacao('❌ Não foi possível carregar o exportador de PDF. Verifique sua conexão.'));
};

// ── SALVAR PROJETO NO APP (localStorage) ────────────────────────────────
window.salvarProjeto = () => {
    salvarCaminhoAtivo();
    if (camadas[camadaAtiva]) {
        camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
    }
    const nome = prompt('Nome do projeto:', 'Projeto ' + new Date().toLocaleDateString('pt-BR'));
    if (!nome) return;
    const projeto = {
        nome, versao: '2.0', data: new Date().toLocaleString('pt-BR'),
        camadas, camadaFoto,
        textoHTML: document.getElementById('texto-layer').innerHTML,
        workW: workSurface.offsetWidth,
        workH: workSurface.offsetHeight,
        modoInfinito, gradeAtiva, gradeTamanho, rotacao,
    };
    const lista = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
    const existIdx = lista.findIndex(p => p.nome === nome);
    if (existIdx >= 0) lista[existIdx] = projeto;
    else lista.push(projeto);
    localStorage.setItem('tm_projetos', JSON.stringify(lista));
    fecharModalSalvar();
    setTimeout(() => voltarInicio(), 300);
};

// ── ABRIR PROJETOS SALVOS NO APP ──────────────────────────────────────────
window.abrirProjetos = () => {
    const listaEl = document.getElementById('lista-projetos');
    const lista   = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
    if (lista.length === 0) {
        listaEl.style.display = 'block';
        listaEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;">Nenhum projeto salvo ainda.</p>';
        return;
    }
    listaEl.style.display = 'block';
    listaEl.innerHTML = lista.map((p, i) => `
        <div style="background:#2a2a2a;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
            <div style="flex:1;">
                <div style="font-size:12px;font-weight:bold;">${p.nome}</div>
                <div style="font-size:10px;color:#666;">${p.data}</div>
            </div>
            <button onclick="carregarProjeto(${i})" style="background:#2980b9;color:white;border:none;padding:5px 10px;border-radius:5px;font-size:11px;font-weight:bold;">ABRIR</button>
            <button onclick="deletarProjeto(${i})" style="background:#7b2020;color:white;border:none;padding:5px 8px;border-radius:5px;font-size:11px;">✕</button>
        </div>`).join('');
};

window.carregarProjeto = (idx) => {
    const lista = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
    const p = lista[idx];
    if (!p) return;
    camadas = p.camadas; camadaFoto = p.camadaFoto;
    fotoOrdem = (p.fotoOrdem !== undefined) ? p.fotoOrdem : -1;
    camadaAtiva = 0; caminhoAtivo = -1; pontosPen = []; pathFechado = false;
    penLayer.innerHTML = '';
    workSurface.style.width  = p.workW + 'px';
    workSurface.style.height = p.workH + 'px';
    rotacao = p.rotacao || 0;
    svgArea.innerHTML = camadaFoto.svgHTML || '';
    document.getElementById('texto-layer').innerHTML = p.textoHTML || '';
    historico = []; historicoFuturo = [];
    _esconderBolinhasDegrade(); _esconderBolinhasTxtDg();
    modoDegrade = false; degradeStart = null; _dgPrevReset();
    document.getElementById('btnDegrade').style.background = '#e74c3c';
    document.getElementById('degrade-preview-layer').innerHTML = '';
    renderizarTodos();
    if (painelAberto) renderizarPainel();
    fecharModalSalvar();
    document.getElementById('lista-projetos').style.display = 'none';
    mostrarNotificacao('✅ "' + p.nome + '" aberto!');
};

window.deletarProjeto = (idx) => {
    const lista = JSON.parse(localStorage.getItem('tm_projetos') || '[]');
    const nome = lista[idx].nome;
    lista.splice(idx, 1);
    localStorage.setItem('tm_projetos', JSON.stringify(lista));
    abrirProjetos();
    mostrarNotificacao('🗑 "' + nome + '" deletado');
};

window.baixarSVG = () => {
    fecharModalSalvar();
    const s = montarSVGString();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([s], {type:'image/svg+xml'}));
    a.download = 'tracemaster.svg'; a.click();
    mostrarNotificacao('✅ SVG exportado!');
};

document.getElementById('brush-size').oninput    = renderizarPen;
document.getElementById('brush-opacity').oninput = renderizarPen;
document.getElementById('pincel-tipo').onchange  = renderizarPen;

const wsW = parseFloat(workSurface.style.width)  || 800;
const wsH = parseFloat(workSurface.style.height) || 1000;
posX = (window.innerWidth  - wsW * scale) / 2;
posY = (window.innerHeight - wsH * scale) / 2;
update();

// ══════════════════════════════════════════════════════════════════════
// FIREBASE — Configuração
// ══════════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyAIbhdlmdV0UUfqmpy8Fp1Qq",
    authDomain: "tracomestre-88a5c.firebaseapp.com",
    projectId: "tracomestre-88a5c",
    storageBucket: "tracomestre-88a5c.firebasestorage.app",
    messagingSenderId: "661742336751",
    appId: "1:661742336751:web:9b0cc7e40bdc201ebaf91a",
    measurementId: "G-GZCSZ5CN5W"
};

let auth = null, db = null, firebaseOk = false;
try {
    if (firebaseConfig.apiKey !== 'SUA_API_KEY') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db   = firebase.firestore();
        firebaseOk = true;
    }
} catch(e) { console.warn('Firebase não configurado:', e); }
