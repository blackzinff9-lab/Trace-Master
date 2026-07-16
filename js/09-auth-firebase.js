// ── Estado do usuário ─────────────────────────────────────────────────
    let usuarioAtual = null;
    let configUsuario = {
        nome:   '',
        foto:   '',
        tema:   'escuro',
        accent: '#03dac6',
        folha:  '800x1000',
        idioma: 'pt'
    };

    // ── Observador de autenticação ────────────────────────────────────────
    function iniciarAuth() {
        if (!firebaseOk) {
            mostrarTelaInicial();
            return;
        }
        auth.onAuthStateChanged(user => {
            if (user) {
                usuarioAtual = user;
                carregarConfigUsuario(user.uid);
            } else {
                usuarioAtual = null;
                if (!_editorAberto) mostrarTelaLogin();
            }
        });
    }

    function mostrarTelaLogin() {
        document.getElementById('tela-login').style.display = 'flex';
        document.getElementById('tela-inicial').style.display = 'none';
    }

    function mostrarTelaInicial() {
        document.getElementById('tela-login').style.display = 'none';
        if (_editorAberto) {
            aplicarConfig();
            return;
        }
        const tela = document.getElementById('tela-inicial');
        tela.style.display = 'flex';
        tela.style.opacity = '1';
        aplicarConfig();
        renderizarTelaInicial();
    }

    // ── Login com Google ──────────────────────────────────────────────────
    document.getElementById('btn-login-google').addEventListener('touchstart', async (e) => {
        e.preventDefault();
        if (!firebaseOk) { mostrarTelaInicial(); return; }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        } catch(err) {
            mostrarErroLogin(err.message);
        }
    }, {passive:false});

    // ── Login com email/senha ─────────────────────────────────────────────
    document.getElementById('btn-login-email').addEventListener('touchstart', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        if (!email || !senha) { mostrarErroLogin('Preencha e-mail e senha.'); return; }
        if (!firebaseOk) { mostrarTelaInicial(); return; }
        try {
            await auth.signInWithEmailAndPassword(email, senha);
        } catch(err) { mostrarErroLogin(err.message); }
    }, {passive:false});

    // ── Criar conta ───────────────────────────────────────────────────────
    document.getElementById('btn-demo').addEventListener('touchstart', (e) => {
        e.preventDefault();
        mostrarTelaInicial();
    }, {passive: false});

    document.getElementById('btn-criar-conta').addEventListener('touchstart', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const senha = document.getElementById('login-senha').value;
        if (!email || !senha) { mostrarErroLogin('Preencha e-mail e senha.'); return; }
        if (senha.length < 6) { mostrarErroLogin('Senha: mínimo 6 caracteres.'); return; }
        if (!firebaseOk) { mostrarTelaInicial(); return; }
        try {
            await auth.createUserWithEmailAndPassword(email, senha);
        } catch(err) { mostrarErroLogin(err.message); }
    }, {passive:false});

    function mostrarErroLogin(msg) {
        const el = document.getElementById('login-erro');
        el.textContent = msg; el.style.display = 'block';
        setTimeout(() => el.style.display='none', 4000);
    }

    // ── Logout ────────────────────────────────────────────────────────────
    document.getElementById('btn-logout').addEventListener('touchstart', async (e) => {
        e.stopPropagation();
        fecharPerfil();
        if (firebaseOk) await auth.signOut();
        else mostrarTelaLogin();
    }, {passive:true});

    // ── Carregar config do Firestore ──────────────────────────────────────
    async function carregarConfigUsuario(uid) {
        if (!db) { mostrarTelaInicial(); return; }
        try {
            const doc = await db.collection('usuarios').doc(uid).get();
            if (doc.exists) {
                const d = doc.data();
                configUsuario = { ...configUsuario, ...d };
            } else {
                configUsuario.nome = usuarioAtual.displayName || '';
                configUsuario.foto = usuarioAtual.photoURL    || '';
                await db.collection('usuarios').doc(uid).set(configUsuario);
            }
        } catch(e) { console.warn('Firestore erro:', e); }
        mostrarTelaInicial();
    }

    // ── Salvar config no Firestore ────────────────────────────────────────
    async function salvarConfigUsuario() {
        if (!usuarioAtual) return;
        configUsuario.nome   = document.getElementById('cfg-nome').value   || configUsuario.nome;
        configUsuario.foto   = document.getElementById('cfg-foto').value   || configUsuario.foto;
        configUsuario.accent = document.getElementById('cfg-accent').value;
        configUsuario.folha  = document.getElementById('cfg-folha').value;
        configUsuario.idioma = document.getElementById('cfg-idioma').value;
        localStorage.setItem('tm_config', JSON.stringify(configUsuario));
        if (db) {
            try { await db.collection('usuarios').doc(usuarioAtual.uid).set(configUsuario); }
            catch(e) { console.warn('Erro ao salvar:', e); }
        }
        aplicarConfig();
        fecharPerfil();
        mostrarNotificacao('✅ Configurações salvas!');
    }

    document.getElementById('btn-salvar-cfg').addEventListener('touchstart', (e) => {
        e.stopPropagation(); salvarConfigUsuario();
    }, {passive:true});

    // ── Aplicar configurações visuais ─────────────────────────────────────
    function aplicarConfig() {
        const c = configUsuario;
        document.documentElement.style.setProperty('--accent', c.accent||'#03dac6');
        document.querySelectorAll('.aba-pincel.ativa, #btn-nova-camada').forEach(el => {
            el.style.background = c.accent||'#03dac6';
        });
        if (c.tema === 'claro') {
            document.body.style.background = '#f0f0f0';
            document.body.style.color = '#111';
            document.querySelectorAll('.bar').forEach(el => el.style.background = '#ddd');
        } else {
            document.body.style.background = '#121212';
            document.body.style.color = 'white';
            document.querySelectorAll('.bar').forEach(el => el.style.background = '#1e1e1e');
        }
        if (c.folha) {
            const [w,h] = c.folha.split('x').map(Number);
            if (workSurface) { workSurface.style.width=w+'px'; workSurface.style.height=h+'px'; }
        }
        const avatarSrc = c.foto || (usuarioAtual?.photoURL) ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='22' fill='%23888'/%3E%3Ccircle cx='50' cy='90' r='35' fill='%23888'/%3E%3C/svg%3E";
        ['avatar-inicial','avatar-editor','perfil-avatar-img'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.src = avatarSrc;
        });
        const nome = c.nome || usuarioAtual?.displayName || 'Usuário';
        const elN = document.getElementById('perfil-nome-display');
        if (elN) elN.textContent = nome;
        const elE = document.getElementById('perfil-email-display');
        if (elE) elE.textContent = usuarioAtual?.email || '—';
    }

    // ── Abrir/fechar modal de perfil ──────────────────────────────────────
    window.abrirPerfil = () => {
        document.getElementById('cfg-nome').value   = configUsuario.nome || usuarioAtual?.displayName || '';
        document.getElementById('cfg-foto').value   = configUsuario.foto || usuarioAtual?.photoURL || '';
        document.getElementById('cfg-accent').value = configUsuario.accent || '#03dac6';
        document.getElementById('cfg-folha').value  = configUsuario.folha  || '800x1000';
        document.getElementById('cfg-idioma').value = configUsuario.idioma || 'pt';
        setTema(configUsuario.tema || 'escuro', false);
        aplicarConfig();
        document.getElementById('modal-perfil').classList.add('aberto');
    };

    window.fecharPerfil = () => {
        document.getElementById('modal-perfil').classList.remove('aberto');
    };

    document.getElementById('modal-perfil').addEventListener('touchstart', (e) => {
        if (e.target === document.getElementById('modal-perfil')) fecharPerfil();
    }, {passive:true});

    // ── Tema ──────────────────────────────────────────────────────────────
    window.setTema = (t, salvar=true) => {
        configUsuario.tema = t;
        ['escuro','claro'].forEach(id => {
            const el = document.getElementById('tema-'+id);
            if (el) el.classList.toggle('ativo', id===t);
        });
        if (salvar) aplicarConfig();
    };

    document.getElementById('tema-escuro').addEventListener('touchstart', (e) => {
        e.stopPropagation(); setTema('escuro');
    }, {passive:true});
    document.getElementById('tema-claro').addEventListener('touchstart', (e) => {
        e.stopPropagation(); setTema('claro');
    }, {passive:true});

    document.getElementById('cfg-accent').addEventListener('input', (e) => {
        configUsuario.accent = e.target.value;
        aplicarConfig();
    });

    const cfgLocal = localStorage.getItem('tm_config');
    if (cfgLocal) try { configUsuario = {...configUsuario, ...JSON.parse(cfgLocal)}; } catch(e){}
