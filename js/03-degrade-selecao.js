// ── BOLINHAS DE AJUSTE DO DEGRADÊ ──────────────────────────────────────
    let _dgAjuste = null; // {el, x1, y1, x2, y2, tipo, fill}
    let _dgBolhaDrag = null; // 'a' ou 'b' — qual bolinha está sendo arrastada
    let _txtDgAjuste = null; // {degId, el, x1,y1,x2,y2, tipo, c1, c2} — degradê de texto

    function _atualizarBolinhasDegrade() {
        if (!_dgAjuste) return;
        const bA = document.getElementById('dg-bolinha-a');
        const bB = document.getElementById('dg-bolinha-b');
        const btnDG = document.getElementById('btn-confirmar-degrade');
        const coresDg = getDegradeCores();
        const corA = coresDg[0] || '#03dac6';
        const corB = coresDg[coresDg.length-1] || '#ff00ff';
        bA.style.background = corA;
        bA.style.boxShadow  = `0 0 0 2px ${corA},0 3px 10px rgba(0,0,0,0.6)`;
        bB.style.background = corB;
        bB.style.boxShadow  = `0 0 0 2px ${corB},0 3px 10px rgba(0,0,0,0.6)`;
        const {x: sx1, y: sy1} = canvasParaClient(_dgAjuste.x1, _dgAjuste.y1);
        const {x: sx2, y: sy2} = canvasParaClient(_dgAjuste.x2, _dgAjuste.y2);
        bA.style.left = (sx1 - 26)+'px'; bA.style.top = (sy1 - 26)+'px'; bA.style.display='flex';
        bB.style.left = (sx2 - 26)+'px'; bB.style.top = (sy2 - 26)+'px'; bB.style.display='flex';
        btnDG.style.display = 'block';
    }

    function _esconderBolinhasDegrade() {
        document.getElementById('dg-bolinha-a').style.display='none';
        document.getElementById('dg-bolinha-b').style.display='none';
        document.getElementById('btn-confirmar-degrade').style.display='none';
        _dgAjuste = null; _dgBolhaDrag = null;
    }

    function _atualizarBolinhasTxtDg() {
        if (!_txtDgAjuste) return;
        const bA = document.getElementById('txt-dg-bolinha-a');
        const bB = document.getElementById('txt-dg-bolinha-b');
        bA.style.background = _txtDgAjuste.c1;
        bA.style.boxShadow  = `0 0 0 2px ${_txtDgAjuste.c1},0 2px 8px rgba(0,0,0,0.6)`;
        bB.style.background = _txtDgAjuste.c2;
        bB.style.boxShadow  = `0 0 0 2px ${_txtDgAjuste.c2},0 2px 8px rgba(0,0,0,0.6)`;
        const {x: sx1, y: sy1} = canvasParaClient(_txtDgAjuste.x1, _txtDgAjuste.y1);
        const {x: sx2, y: sy2} = canvasParaClient(_txtDgAjuste.x2, _txtDgAjuste.y2);
        bA.style.left = (sx1-16)+'px'; bA.style.top = (sy1-16)+'px'; bA.style.display='flex';
        bB.style.left = (sx2-16)+'px'; bB.style.top = (sy2-16)+'px'; bB.style.display='flex';
        document.getElementById('btn-confirmar-degrade').style.display='block';
    }

    let _txtDgRAF = null;
    function _reconstruirTxtDg() {
        if (!_txtDgAjuste) return;
        if (_txtDgRAF) return;
        _txtDgRAF = requestAnimationFrame(() => {
            _txtDgRAF = null;
            if (!_txtDgAjuste) return;
            const {degId, x1, y1, x2, y2, tipo} = _txtDgAjuste;
            const gradEl = document.getElementById(degId);
            if (!gradEl) return;
            if (tipo === 'linear') {
                gradEl.setAttribute('x1',x1); gradEl.setAttribute('y1',y1);
                gradEl.setAttribute('x2',x2); gradEl.setAttribute('y2',y2);
            } else {
                const r = Math.hypot(x2-x1, y2-y1);
                gradEl.setAttribute('cx',x1); gradEl.setAttribute('cy',y1);
                gradEl.setAttribute('fx',x1); gradEl.setAttribute('fy',y1);
                gradEl.setAttribute('r', r || 10);
            }
        });
    }

    function _esconderBolinhasTxtDg() {
        document.getElementById('txt-dg-bolinha-a').style.display='none';
        document.getElementById('txt-dg-bolinha-b').style.display='none';
        document.getElementById('btn-confirmar-degrade').style.display='none';
        _txtDgAjuste = null;
    }

    let _dgRAF = null;
    function _reconstruirDegrade() {
        if (!_dgAjuste) return;
        if (_dgRAF) return;
        _dgRAF = requestAnimationFrame(() => {
            _dgRAF = null;
            if (!_dgAjuste) return;
            const {el, x1, y1, x2, y2, tipo} = _dgAjuste;
            const fillVal = el.getAttribute('fill') || '';
            const idMatch = fillVal.match(/url\(#([^)]+)\)/);
            if (idMatch) {
                const gradEl = livreLayer.querySelector('#'+idMatch[1]) ||
                               document.getElementById(idMatch[1]);
                if (gradEl) {
                    if (tipo === 'linear') {
                        gradEl.setAttribute('x1', x1); gradEl.setAttribute('y1', y1);
                        gradEl.setAttribute('x2', x2); gradEl.setAttribute('y2', y2);
                    } else {
                        const dist = Math.hypot(x2-x1, y2-y1);
                        const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
                        const raioMax = Math.max(dist, Math.hypot(W,H)*0.5);
                        gradEl.setAttribute('cx', x1); gradEl.setAttribute('cy', y1);
                        gradEl.setAttribute('fx', x1); gradEl.setAttribute('fy', y1);
                        gradEl.setAttribute('r',  raioMax);
                    }
                    if (camadas[camadaAtiva]) {
                        camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
                    }
                    return;
                }
            }
            const parent = el.parentNode;
            if (!parent) return;
            let novoEl;
            if (tipo === 'linear') {
                novoEl = criarDegradeLinear(x1, y1, x2, y2, _dgAjuste.fill);
            } else {
                const dist = Math.hypot(x2-x1, y2-y1);
                novoEl = criarDegradeRadialSVG(x1, y1, dist, _dgAjuste.fill);
            }
            parent.replaceChild(novoEl, el);
            _dgAjuste.el = novoEl;
            if (camadas[camadaAtiva]) {
                camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
            }
        });
    }

    document.getElementById('btn-confirmar-degrade').addEventListener('touchstart', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (_txtDgAjuste) {
            _esconderBolinhasTxtDg();
            mostrarNotificacao('✅ Degradê do texto salvo!');
            return;
        }
        document.getElementById('degrade-preview-layer').innerHTML='';
        if (camadas[camadaAtiva]) {
            camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
        }
        _esconderBolinhasDegrade(); _esconderBolinhasTxtDg();
        modoDegrade = false;
        degradeStart = null;
        document.getElementById('btnDegrade').style.background='#e74c3c';
        _dgPrevReset();
    }, {passive:false});

    function _setupBolinhaDrag(elId, qual) {
        const el = document.getElementById(elId);
        el.addEventListener('touchstart', (e) => {
            e.stopPropagation(); e.preventDefault();
            _dgBolhaDrag = qual;
            isDragging = false;
        }, {passive:false});
        el.addEventListener('touchmove', (e) => {
            e.stopPropagation(); e.preventDefault();
            const {x: cx, y: cy} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
            if (_txtDgAjuste) {
                if (qual === 'a') { _txtDgAjuste.x1=cx; _txtDgAjuste.y1=cy; }
                else              { _txtDgAjuste.x2=cx; _txtDgAjuste.y2=cy; }
                _reconstruirTxtDg();
                _atualizarBolinhasTxtDg();
            } else if (_dgAjuste) {
                if (qual === 'a') { _dgAjuste.x1=cx; _dgAjuste.y1=cy; }
                else              { _dgAjuste.x2=cx; _dgAjuste.y2=cy; }
                _reconstruirDegrade();
                _atualizarBolinhasDegrade();
            }
        }, {passive:false});
        el.addEventListener('touchend', (e) => {
            e.stopPropagation();
            _dgBolhaDrag = null;
        }, {passive:true});
    }
    _setupBolinhaDrag('dg-bolinha-a', 'a');
    _setupBolinhaDrag('dg-bolinha-b', 'b');

    function _setupTxtBolinhaDrag(elId, qual) {
        const el = document.getElementById(elId);
        el.addEventListener('touchstart', (e) => {
            e.stopPropagation(); e.preventDefault();
            isDragging = false;
        }, {passive:false});
        el.addEventListener('touchmove', (e) => {
            e.stopPropagation(); e.preventDefault();
            if (!_txtDgAjuste) return;
            const {x: cx, y: cy} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
            if (qual === 'a') { _txtDgAjuste.x1=cx; _txtDgAjuste.y1=cy; }
            else              { _txtDgAjuste.x2=cx; _txtDgAjuste.y2=cy; }
            _reconstruirTxtDg();
            _atualizarBolinhasTxtDg();
        }, {passive:false});
        el.addEventListener('touchend', (e) => { e.stopPropagation(); }, {passive:true});
    }
    _setupTxtBolinhaDrag('txt-dg-bolinha-a', 'a');
    _setupTxtBolinhaDrag('txt-dg-bolinha-b', 'b');

    function hexMid(h1,h2,t) {
        const r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16);
        const r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16);
        const r=Math.round(r1+(r2-r1)*t), g=Math.round(g1+(g2-g1)*t), b=Math.round(b1+(b2-b1)*t);
        return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    }

    function getDefs() {
        let defs = livreLayer.querySelector('defs');
        if (!defs) { defs=document.createElementNS(NS,'defs'); livreLayer.prepend(defs); }
        return defs;
    }

    function construirClipPath(clipId) {
        const defs = getDefs();
        ['#mask-'+clipId, '#'+clipId].forEach(sel => {
            const old = defs.querySelector(sel);
            if (old) old.remove();
        });
        const maskId = 'mask-'+clipId;
        const mask = document.createElementNS(NS,'mask');
        mask.setAttribute('id', maskId);
        mask.setAttribute('maskUnits','userSpaceOnUse');
        const W = workSurface.offsetWidth || 800;
        const H = workSurface.offsetHeight || 1000;
        const bg = document.createElementNS(NS,'rect');
        bg.setAttribute('x',0); bg.setAttribute('y',0);
        bg.setAttribute('width',W); bg.setAttribute('height',H);
        bg.setAttribute('fill','black');
        mask.appendChild(bg);
        let temConteudo = false;
        const cam = camadas[camadaAtiva];
        if (cam) {
            cam.caminhos.forEach(c => {
                const d = buildPathD(c.pontos, c.fechado);
                if (!d) return;
                const sw = Math.max(parseFloat(c.width)||2, 1);
                const p = document.createElementNS(NS,'path');
                p.setAttribute('d', d);
                p.setAttribute('stroke-linecap','round');
                p.setAttribute('stroke-linejoin','round');
                if (c.fechado) {
                    p.setAttribute('fill','white');
                    p.setAttribute('stroke','none');
                } else {
                    p.setAttribute('fill','none');
                    p.setAttribute('stroke','white');
                    p.setAttribute('stroke-width', sw);
                }
                mask.appendChild(p);
                temConteudo = true;
            });
        }
        function clonarParaMask(el) {
            if (el.tagName === 'defs') return;
            const fillOrig   = el.getAttribute('fill')   || 'none';
            const strokeOrig = el.getAttribute('stroke') || 'none';
            const swOrig     = parseFloat(el.getAttribute('stroke-width') || '0');
            if (fillOrig !== 'none') {
                const c = el.cloneNode(true);
                c.setAttribute('fill','white');
                c.setAttribute('stroke','none');
                c.removeAttribute('filter');
                mask.appendChild(c); temConteudo = true;
            } else if (strokeOrig !== 'none' && swOrig > 0) {
                const c = el.cloneNode(true);
                c.setAttribute('fill','none');
                c.setAttribute('stroke','white');
                c.setAttribute('stroke-width', swOrig);
                c.removeAttribute('filter');
                mask.appendChild(c); temConteudo = true;
            }
            if (el.tagName === 'g' || el.tagName === 'G') {
                [...el.children].forEach(child => clonarParaMask(child));
            }
        }
        [...livreLayer.children].forEach(el => clonarParaMask(el));
        if (!temConteudo) return null;
        defs.appendChild(mask);
        return maskId;
    }
function criarDegradeLinear(x1,y1,x2,y2,fill) {
    const id  = 'lg-'+(++degradeIdCnt);
    const clipId = 'clip-dg-'+degradeIdCnt;
    const defs = getDefs();
    const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
    const grad = document.createElementNS(NS,'linearGradient');
    grad.setAttribute('id',id);
    grad.setAttribute('gradientUnits','userSpaceOnUse');
    grad.setAttribute('x1',x1); grad.setAttribute('y1',y1);
    grad.setAttribute('x2',x2); grad.setAttribute('y2',y2);
    const coresL = getDegradeCores();
    const nL = coresL.length;
    const stepsL = 8;
    for (let ci = 0; ci < nL - 1; ci++) {
        for (let s = 0; s <= stepsL; s++) {
            const t = s / stepsL;
            const offset = (ci + t) / (nL - 1);
            const cor = hexMid(coresL[ci], coresL[ci+1], t);
            const stop = document.createElementNS(NS,'stop');
            stop.setAttribute('offset', (offset*100).toFixed(1)+'%');
            stop.setAttribute('stop-color', cor);
            grad.appendChild(stop);
        }
    }
    defs.appendChild(grad);
    const rect = document.createElementNS(NS,'rect');
    rect.setAttribute('x',0); rect.setAttribute('y',0);
    rect.setAttribute('width',W); rect.setAttribute('height',H);
    rect.setAttribute('fill',`url(#${id})`);
    if (fill === 'camada') {
        const maskId2 = construirClipPath(clipId);
        if (maskId2) rect.setAttribute('mask',`url(#${maskId2})`);
    }
    return rect;
}

function criarDegradeRadialSVG(cx,cy,raio,fill) {
    const id  = 'rg-'+(++degradeIdCnt);
    const clipId = 'clip-dg-'+degradeIdCnt;
    const defs = getDefs();
    const W = workSurface.offsetWidth, H = workSurface.offsetHeight;
    const grad = document.createElementNS(NS,'radialGradient');
    grad.setAttribute('id',id);
    grad.setAttribute('gradientUnits','userSpaceOnUse');
    grad.setAttribute('cx',cx); grad.setAttribute('cy',cy);
    const raioMax = Math.max(raio, Math.hypot(W,H) * 0.5);
    grad.setAttribute('r', raioMax);
    grad.setAttribute('fx',cx); grad.setAttribute('fy',cy);
    const coresR = getDegradeCores();
    const nR = coresR.length;
    const stepsR = 8;
    for (let ci = 0; ci < nR - 1; ci++) {
        for (let s = 0; s <= stepsR; s++) {
            const t = s / stepsR;
            const offset = (ci + t) / (nR - 1);
            const cor = hexMid(coresR[ci], coresR[ci+1], t);
            const stop = document.createElementNS(NS,'stop');
            stop.setAttribute('offset', (offset*100).toFixed(1)+'%');
            stop.setAttribute('stop-color', cor);
            grad.appendChild(stop);
        }
    }
    defs.appendChild(grad);
    const rect = document.createElementNS(NS,'rect');
    rect.setAttribute('x',0); rect.setAttribute('y',0);
    rect.setAttribute('width',W); rect.setAttribute('height',H);
    rect.setAttribute('fill',`url(#${id})`);
    if (fill === 'camada') {
        const maskId2 = construirClipPath(clipId);
        if (maskId2) rect.setAttribute('mask',`url(#${maskId2})`);
    }
    return rect;
}

let _dgPrevRAF = null;
let _dgPrevArgs = null;
let _dgPrevInited = false;
let _dgPrevGrad = null;
let _dgPrevRect = null;
let _dgPrevW = 0, _dgPrevH = 0;

function _initPreviewDegrade() {
    const layer = document.getElementById('degrade-preview-layer');
    layer.innerHTML = '';
    _dgPrevW = workSurface.offsetWidth;
    _dgPrevH = workSurface.offsetHeight;
    const defs = document.createElementNS(NS,'defs');
    if (degradeTipo === 'linear') {
        _dgPrevGrad = document.createElementNS(NS,'linearGradient');
    } else {
        _dgPrevGrad = document.createElementNS(NS,'radialGradient');
    }
    _dgPrevGrad.setAttribute('id','dg-prev');
    _dgPrevGrad.setAttribute('gradientUnits','userSpaceOnUse');
    const cores = getDegradeCores();
    cores.forEach((c, i) => {
        const s = document.createElementNS(NS,'stop');
        s.setAttribute('offset', (i/(cores.length-1)*100).toFixed(1)+'%');
        s.setAttribute('stop-color', c);
        _dgPrevGrad.appendChild(s);
    });
    defs.appendChild(_dgPrevGrad);
    const clipIdPrev = 'clip-dg-prev';
    ['#mask-'+clipIdPrev, '#'+clipIdPrev].forEach(sel => {
        const old = defs.querySelector(sel);
        if (old) old.remove();
    });
    const clip = document.createElementNS(NS,'mask');
    clip.setAttribute('id', clipIdPrev);
    clip.setAttribute('maskUnits','userSpaceOnUse');
    let temClip = false;
    const bgPrev = document.createElementNS(NS,'rect');
    bgPrev.setAttribute('x',0); bgPrev.setAttribute('y',0);
    bgPrev.setAttribute('width', _dgPrevW || workSurface.offsetWidth || 800);
    bgPrev.setAttribute('height', _dgPrevH || workSurface.offsetHeight || 1000);
    bgPrev.setAttribute('fill','black');
    clip.appendChild(bgPrev);
    const cam = camadas[camadaAtiva];
    if (cam) {
        cam.caminhos.forEach(c => {
            const d = buildPathD(c.pontos, c.fechado);
            if (!d) return;
            const sw = Math.max(parseFloat(c.width)||2, 1);
            const p = document.createElementNS(NS,'path');
            p.setAttribute('d',d);
            p.setAttribute('stroke-linecap','round');
            if (c.fechado) {
                p.setAttribute('fill','white'); p.setAttribute('stroke','none');
            } else {
                p.setAttribute('fill','none'); p.setAttribute('stroke','white');
                p.setAttribute('stroke-width', sw);
            }
            clip.appendChild(p);
            temClip = true;
        });
    }
    function clonarParaClipPrev(el) {
        if (el.tagName === 'defs') return;
        const fillOrig   = el.getAttribute('fill')   || 'none';
        const strokeOrig = el.getAttribute('stroke') || 'none';
        const swOrig     = parseFloat(el.getAttribute('stroke-width') || '0');
        if (fillOrig !== 'none') {
            const c = el.cloneNode(true);
            c.setAttribute('fill','white');
            c.setAttribute('stroke','none');
            c.removeAttribute('filter');
            clip.appendChild(c);
            temClip = true;
        }
        if (strokeOrig !== 'none' && swOrig > 0) {
            const c = el.cloneNode(true);
            c.setAttribute('fill','none');
            c.setAttribute('stroke','white');
            c.setAttribute('stroke-width', swOrig);
            c.removeAttribute('filter');
            clip.appendChild(c);
            temClip = true;
        }
        if (el.tagName === 'g' || el.tagName === 'G') {
            [...el.children].forEach(child => clonarParaClipPrev(child));
        }
    }
    [...livreLayer.children].forEach(el => clonarParaClipPrev(el));
    if (temClip) defs.appendChild(clip);
    layer.appendChild(defs);
    _dgPrevRect = document.createElementNS(NS,'rect');
    _dgPrevRect.setAttribute('x','0'); _dgPrevRect.setAttribute('y','0');
    _dgPrevRect.setAttribute('width', _dgPrevW);
    _dgPrevRect.setAttribute('height', _dgPrevH);
    _dgPrevRect.setAttribute('fill','url(#dg-prev)');
    if (temClip) _dgPrevRect.setAttribute('mask','url(#clip-dg-prev)');
    layer.appendChild(_dgPrevRect);
    _dgPrevInited = true;
}

function atualizarPreviewDegradeLayer(x1,y1,x2,y2) {
    _dgPrevArgs = [x1,y1,x2,y2];
    if (_dgPrevRAF) return;
    _dgPrevRAF = requestAnimationFrame(() => {
        _dgPrevRAF = null;
        const [ax1,ay1,ax2,ay2] = _dgPrevArgs;
        if (!_dgPrevInited) _initPreviewDegrade();
        const W = _dgPrevW, H = _dgPrevH;
        if (degradeTipo === 'linear') {
            _dgPrevGrad.setAttribute('x1',ax1); _dgPrevGrad.setAttribute('y1',ay1);
            _dgPrevGrad.setAttribute('x2',ax2); _dgPrevGrad.setAttribute('y2',ay2);
        } else {
            const raio = Math.hypot(ax2-ax1,ay2-ay1);
            const raioMax = Math.max(raio, Math.hypot(W,H)*0.5);
            _dgPrevGrad.setAttribute('cx',ax1); _dgPrevGrad.setAttribute('cy',ay1);
            _dgPrevGrad.setAttribute('r',raioMax);
            _dgPrevGrad.setAttribute('fx',ax1); _dgPrevGrad.setAttribute('fy',ay1);
        }
    });
}

function _dgPrevReset() { _dgPrevInited=false; _dgPrevGrad=null; _dgPrevRect=null; _dgPrevW=0; _dgPrevH=0; _dgAjuste=null; _dgBolhaDrag=null; _txtDgAjuste=null; }

function atualizarPreviewDegradeLayerReal(x1,y1,x2,y2) {
    const layer = document.getElementById('degrade-preview-layer');
    layer.innerHTML='';
    if (!_dgPrevW) { _dgPrevW = workSurface.offsetWidth; _dgPrevH = workSurface.offsetHeight; }
    const W = _dgPrevW, H = _dgPrevH;
    const defs=document.createElementNS(NS,'defs');
    let gradEl, previewEl;
    if (degradeTipo==='linear') {
        gradEl=document.createElementNS(NS,'linearGradient');
        gradEl.setAttribute('id','dg-prev');
        gradEl.setAttribute('gradientUnits','userSpaceOnUse');
        gradEl.setAttribute('x1',x1); gradEl.setAttribute('y1',y1);
        gradEl.setAttribute('x2',x2); gradEl.setAttribute('y2',y2);
    } else {
        const raio=Math.hypot(x2-x1,y2-y1);
        const raioMax=Math.max(raio, Math.hypot(W,H)*0.5);
        gradEl=document.createElementNS(NS,'radialGradient');
        gradEl.setAttribute('id','dg-prev');
        gradEl.setAttribute('gradientUnits','userSpaceOnUse');
        gradEl.setAttribute('cx',x1); gradEl.setAttribute('cy',y1);
        gradEl.setAttribute('r',raioMax);
        gradEl.setAttribute('fx',x1); gradEl.setAttribute('fy',y1);
    }
    const coresPrev = getDegradeCores();
    coresPrev.forEach((c, i) => {
        const s = document.createElementNS(NS,'stop');
        s.setAttribute('offset', (i/(coresPrev.length-1)*100).toFixed(1)+'%');
        s.setAttribute('stop-color', c);
        gradEl.appendChild(s);
    });
    defs.appendChild(gradEl); layer.appendChild(defs);
    previewEl=document.createElementNS(NS,'rect');
    previewEl.setAttribute('x',0); previewEl.setAttribute('y',0);
    previewEl.setAttribute('width',W); previewEl.setAttribute('height',H);
    previewEl.setAttribute('fill','url(#dg-prev)');
    previewEl.setAttribute('opacity','0.85');
    layer.appendChild(previewEl);
    const linha=document.createElementNS(NS,'line');
    linha.setAttribute('x1',x1); linha.setAttribute('y1',y1);
    linha.setAttribute('x2',x2); linha.setAttribute('y2',y2);
    linha.setAttribute('stroke','white'); linha.setAttribute('stroke-width',1.5/scale);
    linha.setAttribute('stroke-opacity','0.8');
    linha.setAttribute('stroke-dasharray',`${6/scale} ${4/scale}`);
    layer.appendChild(linha);
    const coresPt = getDegradeCores();
    const c1El=document.createElementNS(NS,'circle');
    c1El.setAttribute('cx',x1); c1El.setAttribute('cy',y1); c1El.setAttribute('r',6/scale);
    c1El.setAttribute('fill',coresPt[0]||'#fff'); c1El.setAttribute('stroke','white');
    c1El.setAttribute('stroke-width',1.5/scale);
    layer.appendChild(c1El);
    const c2El=document.createElementNS(NS,'circle');
    c2El.setAttribute('cx',x2); c2El.setAttribute('cy',y2); c2El.setAttribute('r',6/scale);
    c2El.setAttribute('fill',coresPt[coresPt.length-1]||'#fff'); c2El.setAttribute('stroke','white');
    c2El.setAttribute('stroke-width',1.5/scale);
    layer.appendChild(c2El);
}
