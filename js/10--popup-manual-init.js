// ── SISTEMA DE POPUP MENUS ────────────────────────────────────────────────
    const _todosPopups = ['popup-desenho','popup-pinceis-wrap','popup-vista','popup-projeto'];

    window.fecharTodosPopups = () => {
        _todosPopups.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('aberto');
        });
        document.getElementById('popup-overlay').classList.remove('ativo');
    };

    window.togglePopup = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const jaAberto = el.classList.contains('aberto');
        fecharTodosPopups();
        if (!jaAberto) {
            el.classList.add('aberto');
            document.getElementById('popup-overlay').classList.add('ativo');
        }
    };

    document.getElementById('popup-overlay').addEventListener('touchstart', (e) => {
        e.stopPropagation();
        fecharTodosPopups();
    }, {passive: true});

    const colMain = document.getElementById('col-main');
    const corBar = document.getElementById('cor-preview-bar');
    if (colMain && corBar) {
        colMain.addEventListener('input', () => { corBar.style.background = colMain.value; });
        corBar.style.background = colMain.value;
    }

    window.toggleMenuFerramentas = () => { togglePopup('popup-desenho'); };

    const _ferrIcones = { pen:'🖊', livre:'✏️', borracha:'🧹' };
    const _ferrLabels = { pen:'PEN', livre:'LIVRE', borracha:'BORR' };
    const _origSelecionarFerramenta = window.selecionarFerramenta;
    window.selecionarFerramenta = (f) => {
        const modoJaAtivo = (f==='pen' && modoPen) || (f==='livre' && modoLivre) || (f==='borracha' && modoBorracha);
        if (modoJaAtivo) {
            if (f === 'pen') {
                modoPen = false; ferramentaAtiva = '';
                if (pontosPen.length >= 2) salvarCaminhoAtivo();
                else if (caminhoAtivo >= 0) getCaminhos().splice(caminhoAtivo, 1);
                caminhoAtivo = -1; pontosPen = []; pathFechado = false;
                penLayer.innerHTML = '';
                document.getElementById('btn-confirmar-pen').style.display = 'none';
                renderizarTodos();
            } else if (f === 'livre') {
                modoLivre = false; ferramentaAtiva = '';
            } else if (f === 'borracha') {
                modoBorracha = false; ferramentaAtiva = '';
                pontosBorracha = []; borrachaLayer.innerHTML = '';
            }
            ['pen','livre','borracha'].forEach(n => {
                const it = document.getElementById('pitem-'+n);
                if (it) it.classList.remove('ativo');
            });
            const ic2 = document.getElementById('ferr-icon');
            const lb2 = document.getElementById('ferr-label');
            if (ic2) ic2.textContent = '🖊';
            if (lb2) lb2.textContent = 'DRAW';
            const _bfp = document.getElementById('pitem-fechar');
            if (_bfp) _bfp.style.display = 'none';
            fecharTodosPopups();
            return;
        }
        _origSelecionarFerramenta(f);
        const ic = document.getElementById('ferr-icon');
        const lb = document.getElementById('ferr-label');
        if (ic) ic.textContent = _ferrIcones[f] || '🖊';
        if (lb) lb.textContent = _ferrLabels[f] || 'DRAW';
        ['pen','livre','borracha'].forEach(n => {
            const it = document.getElementById('pitem-'+n);
            if (it) it.classList.toggle('ativo', n === f);
        });
        const btnFecharPen = document.getElementById('pitem-fechar');
        if (btnFecharPen) btnFecharPen.style.display = (f === 'pen') ? 'flex' : 'none';
        fecharTodosPopups();
    };

    document.getElementById('popup-pinceis-wrap').addEventListener('touchstart', function _initPrev() {
        desenharPreviews();
        this.removeEventListener('touchstart', _initPrev);
    }, {passive: true, capture: true});

    // ── FIM POPUP MENUS ───────────────────────────────────────────────────────

    // ── MANUAL ───────────────────────────────────────────────────────────────
    window.abrirManual = () => {
        document.getElementById('modal-manual').style.display = 'block';
        irSecao(0);
    };
    window.fecharManual = () => {
        document.getElementById('modal-manual').style.display = 'none';
    };
    window.irSecao = (idx) => {
        const total = 6;
        for (let i = 0; i < total; i++) {
            const sec = document.getElementById('msec-' + i);
            if (sec) sec.style.display = i === idx ? 'block' : 'none';
        }
        document.querySelectorAll('.manual-nav-btn').forEach((btn, i) => {
            btn.classList.toggle('ativa', i === idx);
        });
        document.getElementById('modal-manual').scrollTo({ top: 0, behavior: 'smooth' });
    };
    // ── FIM MANUAL ───────────────────────────────────────────────────────────

    iniciarAuth();
