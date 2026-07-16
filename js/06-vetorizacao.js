// ── FOTO E VETORIZAÇÃO ────────────────────────────────────────────────────
    document.getElementById('f').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                workSurface.style.width  = img.width  + 'px';
                workSurface.style.height = img.height + 'px';
                hCanvas.width = img.width; hCanvas.height = img.height;
                hCtx.drawImage(img, 0, 0);
                document.getElementById('modal').style.display = 'flex';
                window.imgParaVetor = img;
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx    = previewCanvas ? previewCanvas.getContext('2d') : null;

    ['pre-contraste','pre-brilho','pre-blur','pre-pathomit'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => {
            const valEl = document.getElementById(id+'-val');
            if (id === 'pre-contraste') valEl.textContent = el.value + '%';
            else if (id === 'pre-brilho') valEl.textContent = el.value + '%';
            else if (id === 'pre-blur') valEl.textContent = el.value + 'px';
            else valEl.textContent = el.value;
            atualizarPreviewVetor();
        });
    });

    window.atualizarPreviewVetor = () => {
        if (!window.imgParaVetor || !previewCanvas || !previewCtx) return;
        const contraste = document.getElementById('pre-contraste')?.value || 150;
        const brilho    = document.getElementById('pre-brilho')?.value || 100;
        const blur      = document.getElementById('pre-blur')?.value || 1;
        previewCanvas.width  = window.imgParaVetor.width;
        previewCanvas.height = window.imgParaVetor.height;
        previewCtx.filter = `contrast(${contraste}%) brightness(${brilho}%) blur(${blur}px)`;
        previewCtx.drawImage(window.imgParaVetor, 0, 0);
        previewCtx.filter = 'none';
    };

    function debounce(fn, delay) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    }

    const tmLoader    = document.getElementById('tm-loader');
    const tmLoaderMsg = document.getElementById('tm-loader-msg');
    const tmLoaderBar = document.getElementById('tm-loader-bar');

    function mostrarLoader(msg = 'Processando...') {
        if (!tmLoader) return;
        tmLoaderMsg.textContent = msg;
        tmLoaderBar.style.width = '0%';
        tmLoader.classList.add('ativo');
        let p = 0;
        const tick = setInterval(() => {
            p = Math.min(p + Math.random() * 8, 88);
            tmLoaderBar.style.width = p + '%';
            if (p >= 88) clearInterval(tick);
        }, 150);
        tmLoader._tick = tick;
    }

    function esconderLoader() {
        if (!tmLoader) return;
        clearInterval(tmLoader._tick);
        tmLoaderBar.style.width = '100%';
        setTimeout(() => tmLoader.classList.remove('ativo'), 300);
    }

    let _sugCallback = null, _sugTimer = null;

    function mostrarSugestao(titulo, texto, onSim) {
        const el  = document.getElementById('tm-sugestao');
        const tit = document.getElementById('tm-sug-titulo');
        const txt = document.getElementById('tm-sug-texto');
        if (!el) return;
        clearTimeout(_sugTimer);
        tit.textContent = '💡 ' + titulo;
        txt.textContent = texto;
        _sugCallback = onSim;
        el.classList.add('visivel');
        _sugTimer = setTimeout(() => el.classList.remove('visivel'), 8000);
    }

    document.getElementById('tm-sug-sim')?.addEventListener('click', () => {
        document.getElementById('tm-sugestao')?.classList.remove('visivel');
        if (_sugCallback) { _sugCallback(); _sugCallback = null; }
    });
    document.getElementById('tm-sug-nao')?.addEventListener('click', () => {
        document.getElementById('tm-sugestao')?.classList.remove('visivel');
        _sugCallback = null;
    });

    document.addEventListener('touchstart', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.style.overflow === 'visible') return;
        const r = document.createElement('span');
        r.className = 'tm-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        r.style.cssText = `width:${size}px;height:${size}px;left:${e.touches[0].clientX-rect.left-size/2}px;top:${e.touches[0].clientY-rect.top-size/2}px;`;
        btn.appendChild(r);
        setTimeout(() => r.remove(), 500);
    }, { passive: true });

    function analisarImagem(img) {
        const TAMANHO = 128;
        const c = document.createElement('canvas');
        c.width = c.height = TAMANHO;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, TAMANHO, TAMANHO);
        const raw = ctx.getImageData(0, 0, TAMANHO, TAMANHO).data;
        const N = TAMANHO * TAMANHO;

        let somaBrilho = 0, somaR = 0, somaG = 0, somaB = 0;
        const brilhos = [];

        for (let i = 0; i < raw.length; i += 4) {
            const r = raw[i], g = raw[i+1], b = raw[i+2];
            const lum = 0.299*r + 0.587*g + 0.114*b;
            brilhos.push(lum);
            somaBrilho += lum;
            somaR += r; somaG += g; somaB += b;
        }
        const mediaBrilho = somaBrilho / N;
        const mediaR = somaR/N, mediaG = somaG/N, mediaB = somaB/N;

        let somaVar = 0;
        for (const l of brilhos) somaVar += (l - mediaBrilho) ** 2;
        const stdBrilho = Math.sqrt(somaVar / N) / 128;

        let somaSat = 0;
        for (let i = 0; i < raw.length; i += 4) {
            const r = raw[i]/255, g = raw[i+1]/255, b = raw[i+2]/255;
            const max = Math.max(r,g,b), min = Math.min(r,g,b);
            somaSat += (max === 0) ? 0 : (max-min)/max;
        }
        const saturacaoMedia = somaSat / N;

        let totalBorda = 0;
        for (let y = 1; y < TAMANHO-1; y++) {
            for (let x = 1; x < TAMANHO-1; x++) {
                const idx = (y*TAMANHO + x);
                const gx = brilhos[idx+1] - brilhos[idx-1];
                const gy = brilhos[(y+1)*TAMANHO+x] - brilhos[(y-1)*TAMANHO+x];
                if (Math.sqrt(gx*gx + gy*gy) > 40) totalBorda++;
            }
        }
        const densidadeBordas = totalBorda / N;

        let tipo;
        if (densidadeBordas > 0.15 && saturacaoMedia < 0.25 && stdBrilho > 0.25) {
            tipo = 'lineart';
        } else if (stdBrilho > 0.2 && densidadeBordas > 0.08) {
            tipo = 'desenho';
        } else {
            tipo = 'foto';
        }

        const coresDom = extrairCoresDominantes(raw, 16);

        return { tipo, contraste: stdBrilho, bordas: densidadeBordas, saturacao: saturacaoMedia, coresDom };
    }

    function extrairCoresDominantes(raw, maxCores = 16) {
        const freq = {};
        let totalPixels = 0;

        for (let i = 0; i < raw.length; i += 4) {
            if (raw[i+3] < 100) continue;
            const r = Math.round(raw[i]   / 16) * 16;
            const g = Math.round(raw[i+1] / 16) * 16;
            const b = Math.round(raw[i+2] / 16) * 16;
            if (r >= 230 && g >= 230 && b >= 230) continue;
            const chave = `${r},${g},${b}`;
            freq[chave] = (freq[chave] || 0) + 1;
            totalPixels++;
        }

        if (totalPixels === 0) return ['#000000'];

        const entradas = Object.entries(freq)
            .map(([rgb, count]) => {
                const [r,g,b] = rgb.split(',').map(Number);
                return { r, g, b, count };
            })
            .sort((a, b) => b.count - a.count);

        const clusters = [];
        for (const entry of entradas) {
            let merged = false;
            for (const cl of clusters) {
                const dr = entry.r - cl.r, dg = entry.g - cl.g, db = entry.b - cl.b;
                if (Math.sqrt(dr*dr + dg*dg + db*db) < 55) {
                    const total = cl.count + entry.count;
                    cl.r = Math.round((cl.r * cl.count + entry.r * entry.count) / total);
                    cl.g = Math.round((cl.g * cl.count + entry.g * entry.count) / total);
                    cl.b = Math.round((cl.b * cl.count + entry.b * entry.count) / total);
                    cl.count = total;
                    merged = true;
                    break;
                }
            }
            if (!merged) clusters.push({ ...entry });
        }

        const LIMIAR = totalPixels * 0.004;
        return clusters
            .filter(c => c.count >= LIMIAR)
            .sort((a, b) => b.count - a.count)
            .slice(0, maxCores)
            .map(c => {
                const clamp = v => Math.min(255, Math.max(0, v));
                return '#' + [c.r, c.g, c.b].map(v => clamp(v).toString(16).padStart(2,'0')).join('');
            });
    }

    window.autoVetorizar = () => {
        const img = window.imgParaVetor;
        if (!img) { mostrarNotificacao('⚠️ Carregue uma foto primeiro!'); return; }

        mostrarLoader('🔍 Analisando imagem...');

        setTimeout(() => {
            try {
                const analise = analisarImagem(img);
                esconderLoader();

                const tagEl = document.getElementById('tm-tipo-img-tag');
                if (tagEl) {
                    const mapaTipo = {
                        foto:    { cls: 'tm-tag-foto',    txt: '📷 Foto'    },
                        desenho: { cls: 'tm-tag-desenho', txt: '🖼 Desenho' },
                        lineart: { cls: 'tm-tag-lineart', txt: '✏️ Lineart' },
                    };
                    const info = mapaTipo[analise.tipo];
                    tagEl.className = 'tm-tag-tipo-img ' + info.cls;
                    tagEl.textContent = info.txt;
                    tagEl.style.display = 'inline-block';
                }

                _mostrarPaletaModal(analise.coresDom);

                let contraste, brilho, blur, pathomit;

                if (analise.tipo === 'lineart') {
                    contraste = 250; brilho = 110; blur = 0; pathomit = 8;
                } else if (analise.tipo === 'desenho') {
                    contraste = 180; brilho = 100; blur = 1; pathomit = 12;
                } else {
                    contraste = 200; brilho = 95; blur = 1.5; pathomit = 20;
                }

                _setSlider('pre-contraste', contraste, '%');
                _setSlider('pre-brilho',    brilho,    '%');
                _setSlider('pre-blur',      blur,      'px');
                _setSlider('pre-pathomit',  pathomit,  '');

                const nCores = analise.coresDom.length;
                window._paletaDetectada = analise.coresDom;
                const countEl = document.getElementById('tm-cores-auto-count');
                if (countEl) countEl.textContent = nCores + ' cor' + (nCores !== 1 ? 'es' : '') + ' (auto)';

                if (analise.coresDom.length > 0) {
                    const ids = ['modal-color','modal-color2','modal-color3'];
                    analise.coresDom.slice(0, 3).forEach((c, i) => {
                        const el = document.getElementById(ids[i]);
                        if (el) el.value = c;
                    });
                }
                window.setNrCores(Math.min(nCores, 3));

                atualizarPreviewVetor();

                const msgsSug = {
                    lineart: { t: 'Lineart detectada',  m: `Configuramos para traço com ${nCores} cor${nCores!==1?'es':''}. Deseja vetorizar agora?` },
                    desenho: { t: 'Desenho detectado',  m: `Detectamos ${nCores} cor${nCores!==1?'es':''} no desenho. Vetorizar agora?` },
                    foto:    { t: 'Foto detectada',      m: `Detectamos ${nCores} cor${nCores!==1?'es':''} na imagem. Vetorize ou ajuste se necessário.` },
                };
                const sug = msgsSug[analise.tipo];
                mostrarSugestao(sug.t, sug.m, () => confirmarCor());

            } catch(err) {
                esconderLoader();
                console.error('Erro na análise:', err);
                mostrarNotificacao('❌ Erro na análise automática');
            }
        }, 80);
    };

    function _setSlider(id, val, sufixo) {
        const el = document.getElementById(id);
        const lb = document.getElementById(id + '-val');
        if (el) el.value = val;
        if (lb) lb.textContent = val + sufixo;
    }

    function _mostrarPaletaModal(cores) {
        const wrap    = document.getElementById('tm-paleta-wrap');
        const coresEl = document.getElementById('tm-paleta-cores');
        if (!wrap || !coresEl || !cores.length) return;
        coresEl.innerHTML = '';
        cores.forEach((hex, i) => {
            const sw = document.createElement('div');
            sw.className = 'tm-cor-swatch';
            sw.style.background = hex;
            sw.title = hex;
            sw.addEventListener('click', () => {
                const el = document.getElementById('modal-color');
                if (el) { el.value = hex; atualizarPreviewVetor(); }
                document.querySelectorAll('.tm-cor-swatch').forEach(s => s.classList.remove('ativa'));
                sw.classList.add('ativa');
            });
            coresEl.appendChild(sw);
        });
        wrap.style.display = 'flex';
    }

    function autoClean(ctx, canvas) {
        try {
            if (window._cvReady && window.cv && window.cv.Mat) {
                const cv  = window.cv;
                const src = cv.imread(canvas);
                const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
                cv.morphologyEx(src, src, cv.MORPH_OPEN, kernel);
                cv.morphologyEx(src, src, cv.MORPH_CLOSE, kernel);
                cv.imshow(canvas, src);
                src.delete(); kernel.delete();
                return true;
            }
        } catch(e) {
            console.warn('autoClean OpenCV falhou, usando CSS filter:', e);
        }
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
            if (lum > 200) { data[i]=data[i+1]=data[i+2]=255; }
            else if (lum < 55) { data[i]=data[i+1]=data[i+2]=0; }
        }
        ctx.putImageData(imageData, 0, 0);
        return false;
    }

    const btnVetModal = document.getElementById('btn-vetorizar-modal');
    if (btnVetModal) {
        btnVetModal.addEventListener('touchend', (e) => {
            e.preventDefault(); e.stopPropagation(); confirmarCor();
        }, {passive:false});
        btnVetModal.addEventListener('click', () => confirmarCor());
    }

    const fileInput = document.getElementById('f');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            setTimeout(atualizarPreviewVetor, 200);
        });
    }

    let snapAtivo = false;
    const SNAP_DIST = 10;

    window.toggleSnap = () => {
        snapAtivo = !snapAtivo;
        const btn = document.getElementById('btnSnap');
        if (btn) {
            btn.style.background = snapAtivo ? '#ff9800' : '#333';
            btn.textContent = snapAtivo ? '🧲 ON' : '🧲';
        }
    };

    function aplicarSnap(x, y) {
        if (!snapAtivo || !pontosPen.length) return {x, y};
        for (const p of pontosPen) {
            if (Math.abs(p.x - x) < SNAP_DIST / scale) x = p.x;
            if (Math.abs(p.y - y) < SNAP_DIST / scale) y = p.y;
        }
        return {x, y};
    }

    const lupaEl     = document.getElementById('lupa');
    const lupaCanvas = document.getElementById('lupa-canvas');
    const lupaCtx    = lupaCanvas ? lupaCanvas.getContext('2d') : null;
    const LUPA_ZOOM  = 3;
    const LUPA_SIZE  = 90;

    function mostrarLupa(clientX, clientY) {
        if (!lupaEl || !lupaCtx || !modoEditar) return;
        const {x: sx, y: sy} = clientParaCanvas(clientX, clientY);
        const half = LUPA_SIZE / (2 * LUPA_ZOOM);

        lupaCtx.clearRect(0, 0, LUPA_SIZE, LUPA_SIZE);
        lupaCtx.save();
        lupaCtx.scale(LUPA_ZOOM, LUPA_ZOOM);
        lupaCtx.fillStyle = 'white';
        lupaCtx.fillRect(0, 0, half*2, half*2);

        const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
        const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
            ${drawLayer.innerHTML}${livreLayer.innerHTML}
        </svg>`;
        const blob = new Blob([svgWrapper], {type:'image/svg+xml'});
        const url  = URL.createObjectURL(blob);
        const img  = new Image();
        img.onload = () => {
            lupaCtx.drawImage(img, sx - half, sy - half, half*2, half*2, 0, 0, half*2, half*2);
            URL.revokeObjectURL(url);
            lupaCtx.restore();
            lupaCtx.strokeStyle = 'rgba(3,218,198,0.8)';
            lupaCtx.lineWidth = 1;
            lupaCtx.beginPath();
            lupaCtx.moveTo(LUPA_SIZE/2, LUPA_SIZE/2 - 8);
            lupaCtx.lineTo(LUPA_SIZE/2, LUPA_SIZE/2 + 8);
            lupaCtx.moveTo(LUPA_SIZE/2 - 8, LUPA_SIZE/2);
            lupaCtx.lineTo(LUPA_SIZE/2 + 8, LUPA_SIZE/2);
            lupaCtx.stroke();
        };
        img.onerror = () => { lupaCtx.restore(); URL.revokeObjectURL(url); };
        img.src = url;

        lupaEl.style.display = 'block';
        const lupaX = clientX > window.innerWidth/2 ? 20 : window.innerWidth - 110;
        lupaEl.style.left = lupaX + 'px';
        lupaEl.style.top  = '70px';
    }

    function esconderLupa() {
        if (lupaEl) lupaEl.style.display = 'none';
    }

    let modoOutline = false;

    window.toggleOutline = () => {
        modoOutline = !modoOutline;
        const btn = document.getElementById('btnOutline');
        const overlay = document.getElementById('outline-overlay');
        if (btn) { btn.style.background = modoOutline ? '#03dac6' : '#333'; }
        if (overlay) overlay.style.display = modoOutline ? 'block' : 'none';
        if (modoOutline) renderizarOutline();
    };

    function renderizarOutline() {
        const overlay = document.getElementById('outline-overlay');
        if (!overlay) return;
        overlay.width  = workSurface.offsetWidth;
        overlay.height = workSurface.offsetHeight;
        const ctx2 = overlay.getContext('2d');
        ctx2.clearRect(0, 0, overlay.width, overlay.height);
        if (window.imgParaVetor) {
            ctx2.globalAlpha = 0.35;
            ctx2.drawImage(window.imgParaVetor, 0, 0, overlay.width, overlay.height);
            ctx2.globalAlpha = 1;
        }
        const paths = drawLayer.querySelectorAll('path,ellipse,rect,polygon,line');
        paths.forEach(p => {
            const d = p.getAttribute('d') || '';
            ctx2.strokeStyle = '#03dac6';
            ctx2.lineWidth = 1.5;
            ctx2.setLineDash([4, 3]);
            try {
                const bb = p.getBBox();
                ctx2.strokeRect(bb.x, bb.y, bb.width, bb.height);
            } catch(e) {}
        });
}
window.vetorizarPorCor = (corAlvo) => {
    if (!window.imgParaVetor) return;
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width  = hCanvas.width;
    tmpCanvas.height = hCanvas.height;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(window.imgParaVetor, 0, 0);
    const imgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
    const data    = imgData.data;

    const r2 = parseInt(corAlvo.slice(1,3),16);
    const g2 = parseInt(corAlvo.slice(3,5),16);
    const b2 = parseInt(corAlvo.slice(5,7),16);
    const tolerancia = 60;

    for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i]   - r2);
        const dg = Math.abs(data[i+1] - g2);
        const db = Math.abs(data[i+2] - b2);
        if (dr + dg + db > tolerancia * 3) {
            data[i] = data[i+1] = data[i+2] = 255;
        } else {
            data[i] = data[i+1] = data[i+2] = 0;
        }
    }
    tmpCtx.putImageData(imgData, 0, 0);

    mostrarNotificacao('⏳ Vetorizando por cor...');
    setTimeout(() => {
        const corTraco = document.getElementById('modal-color')?.value || corAlvo;
        let svgString = ImageTracer.imagedataToSVG(imgData, {
            ltres: Math.max(0.1, sensibilidade/200),
            qtres: Math.max(0.1, sensibilidade/200),
            pathomit: 16, blurradius: 1, blurdelta: 20,
            colorsampling: 0, numberofcolors: 1,
            mincolorratio: 0.02,
        });
            svgString = svgString
                .replace(/fill="[^"]*"/g, 'fill="none"')
                .replace(/stroke="none"/g, 'stroke="black"')
                .replace(/<path /g, '<path stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" ');
        svgString = svgString.replace(/fill="rgb\(0,0,0\)"/g, `fill="${corTraco}"`);
        svgString = svgString.replace(/fill="rgb\(255,255,255\)"/g, 'fill="none"');
        novaCamada('Cor ' + corAlvo);
        svgArea.innerHTML = svgString;
        camadaFoto.svgHTML = svgArea.innerHTML;
        renderizarTodos();
        mostrarNotificacao('✅ Camada de cor criada!');
    }, 100);
};

let caminhosSelecionados = [];
window.agruparSelecionados = () => {
    if (caminhosSelecionados.length < 2) {
        mostrarNotificacao('Selecione pelo menos 2 elementos'); return;
    }
    const caminhos = getCaminhos();
    const grupo = { isGrupo: true, filhos: [] };
    caminhosSelecionados.forEach(idx => {
        grupo.filhos.push({...caminhos[idx]});
    });
    caminhosSelecionados.sort((a,b)=>b-a).forEach(idx => caminhos.splice(idx,1));
    caminhos.push(grupo);
    caminhosSelecionados = [];
    salvarHistorico();
    renderizarTodos();
    mostrarNotificacao('✅ Elementos agrupados!');
};

let nrCoresSelecionadas = 1;

window.setNrCores = (n) => {
    nrCoresSelecionadas = n;
    [1,2,3].forEach(i => {
        const btn = document.getElementById('nc-'+i);
        if (btn) {
            btn.style.border = i===n ? '2px solid #03dac6' : '1px solid #444';
            btn.style.background = i===n ? 'rgba(3,218,198,0.1)' : '#2a2a2a';
            btn.style.color = i===n ? '#03dac6' : '#888';
        }
        const col = document.getElementById('modal-color'+(i>1?i:''));
        if (col) col.style.display = i <= n ? '' : 'none';
    });
};

function vetorizarContornos(img, corTraco, larguraTraco = 2) {
    return new Promise((resolve, reject) => {
        try {
            let src = cv.imread(img);
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            let blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 1.5);

            let edges = new cv.Mat();
            cv.Canny(blurred, edges, 50, 150);

            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            const ns = 'http://www.w3.org/2000/svg';
            const svgEl = document.createElementNS(ns, 'svg');
            svgEl.setAttribute('width', img.width);
            svgEl.setAttribute('height', img.height);
            svgEl.setAttribute('viewBox', `0 0 ${img.width} ${img.height}`);

            for (let i = 0; i < contours.size(); i++) {
                let contour = contours.get(i);
                let points = [];
                for (let j = 0; j < contour.data32S.length; j += 2) {
                    points.push({ x: contour.data32S[j], y: contour.data32S[j+1] });
                }
                if (points.length < 3) continue;

                let d = `M ${points[0].x} ${points[0].y}`;
                for (let k = 1; k < points.length; k++) {
                    d += ` L ${points[k].x} ${points[k].y}`;
                }
                d += ' Z';

                let path = document.createElementNS(ns, 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', corTraco);
                path.setAttribute('stroke-width', larguraTraco);
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                svgEl.appendChild(path);
            }

            src.delete(); gray.delete(); blurred.delete();
            edges.delete(); contours.delete(); hierarchy.delete();

            resolve(svgEl);
        } catch(e) { reject(e); }
    });
}

window.confirmarCor = () => {
    const cor1 = document.getElementById('modal-color').value;
    const paletaAuto = (window._paletaDetectada && window._paletaDetectada.length > 0)
        ? window._paletaDetectada : null;
    const usarMultiCor = paletaAuto && paletaAuto.length > 1;

    if (window._cvReady && window.cv && !usarMultiCor) {
        document.getElementById('modal').style.display = 'none';
        mostrarNotificacao('🚀 Detectando contornos com OpenCV...');
        const largura = parseFloat(document.getElementById('brush-size')?.value) || 2;
        vetorizarContornos(window.imgParaVetor, cor1, largura).then(svgEl => {
            svgArea.innerHTML = svgEl.outerHTML;
            camadaFoto.svgHTML = svgArea.innerHTML;
            renderizarTodos();
            if (painelAberto) renderizarPainel();
            mostrarNotificacao('✅ Contornos gerados!');
        }).catch(err => {
            console.error(err);
            mostrarNotificacao('❌ Erro OpenCV: ' + err.message);
        });
        return;
          }
      const cor2 = document.getElementById('modal-color2')?.value || '#888888';
    const cor3 = document.getElementById('modal-color3')?.value || '#444444';
    const sensibilidade = parseFloat(document.getElementById('thresh').value);
    const coresUsuarioFinal = paletaAuto
        ? paletaAuto
        : (nrCoresSelecionadas === 1 ? [cor1] : nrCoresSelecionadas === 2 ? [cor1, cor2] : [cor1, cor2, cor3]);
    const nCores = coresUsuarioFinal.length;

    document.getElementById('modal').style.display = 'none';
    mostrarNotificacao('🚀 Processando traço profissional...');

    setTimeout(() => {
        try {
            hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
            const contraste  = document.getElementById('pre-contraste')?.value || 150;
            const brilho     = document.getElementById('pre-brilho')?.value    || 100;
            const blurPre    = document.getElementById('pre-blur')?.value      || 1;
            hCtx.filter = `blur(${blurPre}px) contrast(${contraste}%) brightness(${brilho}%)`;
            hCtx.drawImage(window.imgParaVetor, 0, 0, hCanvas.width, hCanvas.height);
            hCtx.filter = 'none';

            let imgData;
            if (window._cvReady && window.cv && window.cv.imread) {
                try {
                    const cv = window.cv;
                    const src  = cv.imread(hCanvas);
                    const gray = new cv.Mat();
                    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
                    cv.adaptiveThreshold(gray, gray, 255,
                        cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 10);
                    cv.imshow(hCanvas, gray);
                    src.delete(); gray.delete();
                } catch(cvErr) {
                    console.warn('OpenCV adaptiveThreshold falhou, usando canvas:', cvErr);
                }
            }
            {
                const _fd = hCtx.getImageData(0, 0, hCanvas.width, hCanvas.height);
                const _pd = _fd.data;
                for (let _i = 0; _i < _pd.length; _i += 4) {
                    if (_pd[_i] > 240 && _pd[_i+1] > 240 && _pd[_i+2] > 240) _pd[_i+3] = 0;
                }
                hCtx.putImageData(_fd, 0, 0);
            }
            imgData = hCtx.getImageData(0, 0, hCanvas.width, hCanvas.height);
            const pathomit = parseInt(document.getElementById('pre-pathomit')?.value || 16);

            const hex2rgb = h => ({ r:parseInt(h.slice(1,3),16), g:parseInt(h.slice(3,5),16), b:parseInt(h.slice(5,7),16), a:255 });
            const coresUsuario = coresUsuarioFinal;

            function corDist(c1, c2) {
                return Math.sqrt((c1.r-c2.r)**2 + (c1.g-c2.g)**2 + (c1.b-c2.b)**2);
            }
            function parseFillRgb(fillStr) {
                if (!fillStr) return null;
                const m = fillStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (m) return {r:+m[1],g:+m[2],b:+m[3]};
                if (fillStr.startsWith('#') && fillStr.length === 7) return hex2rgb(fillStr);
                return null;
            }
            const palCores = coresUsuario.map(hex2rgb);
            const pathomitVal = parseInt(document.getElementById('pre-pathomit')?.value || 16);

            let svgString, opcoes;
            if (nCores === 1) {
                opcoes = {
                    colorsampling: 0, numberofcolors: 2, colorquantcycles: 1,
                    pal: [{r:0,g:0,b:0,a:255},{r:255,g:255,b:255,a:0}],
                    ltres:1, qtres:1, pathomit:pathomitVal, blurradius:0,
                    mincolorratio:0, linefilter:true, strokewidth:0, viewbox:true, scale:1
                };
                svgString = ImageTracer.imagedataToSVG(imgData, opcoes);
            } else {
                const palIT = coresUsuario.map(hex2rgb);
                palIT.push({r:255,g:255,b:255,a:0});
                opcoes = {
                    colorsampling: 0,
                    numberofcolors: palIT.length,
                    colorquantcycles: 3,
                    pal: palIT,
                    ltres: 1, qtres: 1,
                    pathomit: pathomitVal,
                    blurradius: 0,
                    mincolorratio: 0,
                    linefilter: false,
                    strokewidth: 0,
                    viewbox: true,
                    scale: 1
                };
                svgString = ImageTracer.imagedataToSVG(imgData, opcoes);
            }

            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            const caminhos = Array.from(svgDoc.querySelectorAll('path'));

            const tmpSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            tmpSvg.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;';
            document.body.appendChild(tmpSvg);

            const larguraTraco = parseFloat(document.getElementById('brush-size')?.value) || 2;
            caminhos.forEach(path => {
                const clone = path.cloneNode(true);
                tmpSvg.appendChild(clone);
                let eFundo = false;
                try {
                    const bb = clone.getBBox();
                    eFundo = bb.width > 0 && bb.height > 0 &&
                             Math.abs(bb.width  - hCanvas.width)  < 10 &&
                             Math.abs(bb.height - hCanvas.height) < 10;
                } catch(e) {
                    const fill = (path.getAttribute('fill')||'').toLowerCase();
                    eFundo = fill.includes('255,255,255') || fill === '#ffffff' || fill === 'white';
                }
                tmpSvg.removeChild(clone);
                if (eFundo) { path.remove(); return; }

                const fillAtual = path.getAttribute('fill') || '';
                const eBranco = fillAtual.toLowerCase().includes('255,255,255') ||
                                fillAtual.toLowerCase() === '#ffffff' ||
                                fillAtual.toLowerCase() === 'white';
                if (eBranco) { path.remove(); return; }

                if (nCores === 1) {
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke', cor1);
                    path.setAttribute('stroke-width', larguraTraco);
                    path.setAttribute('stroke-linecap', 'round');
                    path.setAttribute('stroke-linejoin', 'round');
                    path.removeAttribute('opacity');
                } else {
                    const fillRgb = parseFillRgb(fillAtual);
                    if (fillRgb) {
                        let melhorCor = coresUsuario[0];
                        let melhorDist = Infinity;
                        coresUsuario.forEach(hex => {
                            const rgb = hex2rgb(hex);
                            const d = corDist(fillRgb, rgb);
                            if (d < melhorDist) { melhorDist = d; melhorCor = hex; }
                        });
                        path.setAttribute('fill', melhorCor);
                        path.setAttribute('stroke', melhorCor);
                        path.setAttribute('stroke-width', Math.max(0.5, larguraTraco * 0.3));
                        path.setAttribute('stroke-linejoin', 'round');
                        path.removeAttribute('opacity');
                    } else {
                        path.setAttribute('fill', cor1);
                        path.setAttribute('stroke', cor1);
                        path.setAttribute('stroke-width', Math.max(0.5, larguraTraco * 0.3));
                        path.removeAttribute('opacity');
                    }
                }
            });

            document.body.removeChild(tmpSvg);
            const svgFinal = new XMLSerializer().serializeToString(svgDoc);
            svgArea.innerHTML = svgFinal;
            camadaFoto.svgHTML = svgArea.innerHTML;

            renderizarTodos();
            if (painelAberto) renderizarPainel();
            mostrarNotificacao('✅ Vetorização concluída!');
        } catch (e) {
            console.error('Erro na vetorização:', e);
            mostrarNotificacao('❌ Erro ao processar imagem');
        }
    }, 100);
};
const atualizarPreviewDebounced = debounce(atualizarPreviewVetor, 120);
['pre-contraste','pre-brilho','pre-blur'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.removeAttribute('oninput');
    el.addEventListener('input', () => {
        const valEl = document.getElementById(id+'-val');
        if (id === 'pre-contraste' && valEl) valEl.textContent = el.value + '%';
        else if (id === 'pre-brilho' && valEl) valEl.textContent = el.value + '%';
        else if (id === 'pre-blur'   && valEl) valEl.textContent = el.value + 'px';
        atualizarPreviewDebounced();
    });
});

{
    const _origOnChange = document.getElementById('f').onchange;
    document.getElementById('f').onchange = (e) => {
        if (_origOnChange) _origOnChange.call(document.getElementById('f'), e);
        if (window.TM_carregarOpenCV) window.TM_carregarOpenCV();
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const imgAnl = new Image();
            imgAnl.onload = () => {
                setTimeout(() => {
                    window.imgParaVetor = imgAnl;
                    atualizarPreviewVetor();
                    const _analisar = () => {
                        try {
                            const a = analisarImagem(imgAnl);
                            const tagEl = document.getElementById('tm-tipo-img-tag');
                            const mapaTipo = {
                                foto:    { cls: 'tm-tag-foto',    txt: '📷 Foto'    },
                                desenho: { cls: 'tm-tag-desenho', txt: '🖼 Desenho' },
                                lineart: { cls: 'tm-tag-lineart', txt: '✏️ Lineart' },
                            };
                            if (tagEl) {
                                const info = mapaTipo[a.tipo];
                                tagEl.className = 'tm-tag-tipo-img ' + info.cls;
                                tagEl.textContent = info.txt;
                                tagEl.style.display = 'inline-block';
                            }
                            _mostrarPaletaModal(a.coresDom);
                            window._paletaDetectada = a.coresDom;
                            const countEl2 = document.getElementById('tm-cores-auto-count');
                            if (countEl2) countEl2.textContent = a.coresDom.length + ' cor' + (a.coresDom.length !== 1 ? 'es' : '') + ' (auto)';
                            const msgs = {
                                lineart: 'Detectamos um lineart! "Auto Vetorizar" vai configurar tudo automaticamente.',
                                desenho: 'Detectamos um desenho. Deseja aplicar configuração automática?',
                                foto:    'Imagem fotográfica detectada. "Auto Vetorizar" ajusta tudo pra você!',
                            };
                            mostrarSugestao('Imagem analisada!', msgs[a.tipo], () => autoVetorizar());
                        } catch(_) {}
                    };
                    if (window.requestIdleCallback) requestIdleCallback(_analisar);
                    else setTimeout(_analisar, 300);
                }, 250);
            };
            imgAnl.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
}

{
    const _confirmarCorOrig = window.confirmarCor;
    window.confirmarCor = () => {
        mostrarLoader('🚀 Vetorizando...');
        setTimeout(() => {
            try { if (hCanvas && hCtx) autoClean(hCtx, hCanvas); } catch(_) {}
            _confirmarCorOrig();
            setTimeout(esconderLoader, 1500);
        }, 80);
    };
}

{
    const _notifOrig = window.mostrarNotificacao;
    window.mostrarNotificacao = (msg) => {
        const el = document.getElementById('notificacao');
        if (el) {
            el.classList.remove('saindo');
            el.style.display = 'block';
            el.style.opacity = '1';
            el.textContent = msg;
            clearTimeout(el._tmTimer);
            el._tmTimer = setTimeout(() => {
                el.classList.add('saindo');
                setTimeout(() => { el.style.display='none'; el.classList.remove('saindo'); }, 320);
            }, 2300);
        } else if (_notifOrig) { _notifOrig(msg); }
    };
}

function hitTestCaminhos(x, y) {
    const caminhos = getCaminhos();
    const limiar = 20 / scale;
    for (let ci = caminhos.length - 1; ci >= 0; ci--) {
        const cam = caminhos[ci];
        const pts = cam.pontos;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i+1];
            const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx+dy*dy;
            let t = lenSq > 0 ? ((x-a.x)*dx+(y-a.y)*dy)/lenSq : 0;
            t = Math.max(0, Math.min(1, t));
            if (Math.hypot(x-(a.x+t*dx), y-(a.y+t*dy)) < limiar) return ci;
        }
        if (cam.fechado && pts.length >= 2) {
            const a = pts[pts.length-1], b = pts[0];
            const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx+dy*dy;
            let t = lenSq > 0 ? ((x-a.x)*dx+(y-a.y)*dy)/lenSq : 0;
            t = Math.max(0, Math.min(1, t));
            if (Math.hypot(x-(a.x+t*dx), y-(a.y+t*dy)) < limiar) return ci;
        }
    }
    return -1;
}
