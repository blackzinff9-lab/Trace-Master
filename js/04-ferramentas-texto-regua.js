// ── 1. SELEÇÃO E MOVER ───────────────────────────────────────────────
    let modoSelecao = false;
    let selecaoEl = null, selecaoTipo = null;
    let selecaoArrastando = false;
    let selecaoOffX = 0, selecaoOffY = 0;
    let selecaoTransX = 0, selecaoTransY = 0;

    window.toggleSelecao = () => {
        modoSelecao = !modoSelecao;
        const btn = document.getElementById('btnSelecao');
        btn.style.background = modoSelecao ? '#03dac6' : '#333';
        btn.style.color = modoSelecao ? '#000' : 'white';
        if (!modoSelecao) limparSelecao();
        if (modoSelecao) { modoPen=false; modoLivre=false; modoBorracha=false; modoEditar=false; }
    };

    function limparSelecao() {
        selecaoEl=null; _selRealEl=null;
        _selResizing=false; _selResizeCorner=null;
        _selBBox=null; _selCurrentScale=1;
        _selHandlePositions=null;
        _selRotating=false; _selRotOrigAngle=0; _selRotCurAngle=0;
        document.getElementById('selecao-layer').innerHTML='';
        _esconderHandlesHTML();
    }

    let _selResizing = false;
    let _selResizeCorner = null;
    let _selResizeStartScale = 1;
    let _selBBox = null;
    let _selCurrentScale = 1;
    let _selResizeAnchorCX = 0, _selResizeAnchorCY = 0;
    let _selResizeTouchStartCX = 0, _selResizeTouchStartCY = 0;
    let _selResizeStartDist = 1;
    let _selHandlePositions = null;
    let _selRealEl = null;

    let _selRotating = false;
    let _selRotStartAngle = 0;
    let _selRotCurAngle  = 0;
    let _selRotOrigAngle = 0;
    let _selRotCX = 0, _selRotCY = 0;

    function desenharHandlesSelecao(el, bbOverride) {
        const sl = document.getElementById('selecao-layer');
        sl.innerHTML='';
        if (el && el !== sl) _selRealEl = el;
        try {
            let bb;
            if (bbOverride) {
                bb = bbOverride;
            } else {
                try { bb = _selRealEl ? _selRealEl.getBBox() : el.getBBox(); } catch(_) { return; }
            }
            if (!bb || bb.width === 0 && bb.height === 0) return;
            const pad = 6/scale;
            const x0 = bb.x - pad, y0 = bb.y - pad;
            const x1 = bb.x + bb.width + pad, y1 = bb.y + bb.height + pad;
            const cx = (x0+x1)/2, cy = (y0+y1)/2;
            _selHandlePositions = {x0,y0,x1,y1,cx,cy,hr:14/scale};

            const bRect = document.createElementNS(NS,'rect');
            bRect.setAttribute('x',x0); bRect.setAttribute('y',y0);
            bRect.setAttribute('width',x1-x0); bRect.setAttribute('height',y1-y0);
            bRect.setAttribute('fill','rgba(3,218,198,0.07)');
            bRect.setAttribute('stroke','#03dac6'); bRect.setAttribute('stroke-width',1.5/scale);
            bRect.setAttribute('stroke-dasharray',`${5/scale} ${3/scale}`);
            sl.appendChild(bRect);

            const move = document.createElementNS(NS,'circle');
            move.setAttribute('cx',cx); move.setAttribute('cy',cy);
            move.setAttribute('r',11/scale);
            move.setAttribute('fill','#03dac6'); move.setAttribute('stroke','white');
            move.setAttribute('stroke-width',2/scale);
            sl.appendChild(move);
            const moveTxt = document.createElementNS(NS,'text');
            moveTxt.setAttribute('x',cx); moveTxt.setAttribute('y',cy);
            moveTxt.setAttribute('text-anchor','middle');
            moveTxt.setAttribute('dominant-baseline','middle');
            moveTxt.setAttribute('fill','#000');
            moveTxt.setAttribute('font-size',9/scale);
            moveTxt.setAttribute('pointer-events','none');
            moveTxt.textContent='✥';
            sl.appendChild(moveTxt);

            const del = document.createElementNS(NS,'circle');
            del.setAttribute('cx', x1+22/scale); del.setAttribute('cy', y0-22/scale);
            del.setAttribute('r', 10/scale);
            del.setAttribute('fill','#e74c3c'); del.setAttribute('stroke','white');
            del.setAttribute('stroke-width', 1.5/scale);
            del.setAttribute('pointer-events','all');
            del.addEventListener('touchstart',(e)=>{
                e.stopPropagation(); e.preventDefault();
                salvarHistorico();
                if (selecaoCaminhoInfo) {
                    const cam = camadas[selecaoCaminhoInfo.camadaIdx];
                    if (cam) cam.caminhos.splice(selecaoCaminhoInfo.caminhoIdx, 1);
                    selecaoCaminhoInfo = null;
                    renderizarTodos();
                } else if (_selRealEl) {
                    _selRealEl.remove();
                }
                limparSelecao(); _selRealEl = null; _selCurrentScale = 1;
            },{passive:false});
            sl.appendChild(del);
            const delTxt = document.createElementNS(NS,'text');
            delTxt.setAttribute('x', x1+22/scale); delTxt.setAttribute('y', y0-22/scale);
            delTxt.setAttribute('text-anchor','middle'); delTxt.setAttribute('dominant-baseline','middle');
            delTxt.setAttribute('fill','white'); delTxt.setAttribute('font-size', 10/scale);
            delTxt.setAttribute('font-weight','bold'); delTxt.setAttribute('pointer-events','none');
            delTxt.textContent='✕';
            sl.appendChild(delTxt);

            const rotHY_canvas = y0 - 36/scale;
            const rotLine = document.createElementNS(NS,'line');
            rotLine.setAttribute('x1', cx); rotLine.setAttribute('y1', y0);
            rotLine.setAttribute('x2', cx); rotLine.setAttribute('y2', rotHY_canvas);
            rotLine.setAttribute('stroke','#ff9800'); rotLine.setAttribute('stroke-width', 1.2/scale);
            rotLine.setAttribute('stroke-dasharray', `${3/scale} ${2/scale}`);
            rotLine.setAttribute('pointer-events','none');
            sl.appendChild(rotLine);

            _posicionarHandlesHTML(x0, y0, x1, y1, cx, cy);

        } catch(err) { console.warn('handles err',err); }
    }

    function _posicionarHandlesHTML(x0, y0, x1, y1, cx, cy) {
        const corners = {tl:[x0,y0], tr:[x1,y0], bl:[x0,y1], br:[x1,y1]};
        for (const [id, [hx,hy]] of Object.entries(corners)) {
            const sc = canvasParaClient(hx, hy);
            const div = document.getElementById('sel-handle-'+id);
            if (!div) continue;
            div.style.left = sc.x + 'px';
            div.style.top  = sc.y + 'px';
            div.style.display = 'block';
        }
        const rotCanvasY = y0 - 36/scale;
        const scRot = canvasParaClient(cx, rotCanvasY);
        const divRot = document.getElementById('sel-handle-rot');
        if (divRot) {
            divRot.style.left = scRot.x + 'px';
            divRot.style.top  = scRot.y + 'px';
            divRot.style.display = 'flex';
        }
        _selHandlePositions.rotCanvasCX = cx;
        _selHandlePositions.rotCanvasCY = cy;
    }

    function _esconderHandlesHTML() {
        ['tl','tr','bl','br'].forEach(id => {
            const d = document.getElementById('sel-handle-'+id);
            if (d) d.style.display = 'none';
        });
        const r = document.getElementById('sel-handle-rot');
        if (r) r.style.display = 'none';
    }

    setTimeout(() => {
        ['tl','tr','bl','br'].forEach(cornerId => {
            const div = document.getElementById('sel-handle-'+cornerId);
            if (!div) return;
            div.addEventListener('touchstart', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (!_selHandlePositions) return;
                const {x0,y0,x1,y1} = _selHandlePositions;
                _selResizing = true;
                _selResizeCorner = cornerId;
                _selResizeStartScale = 1;
                _selCurrentScale = 1;
                if (selecaoCaminhoInfo) {
                    const cam = camadas[selecaoCaminhoInfo.camadaIdx];
                    const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
                    const xs=c.pontos.map(p=>p.x), ys=c.pontos.map(p=>p.y);
                    const mnX=Math.min(...xs),mxX=Math.max(...xs),mnY=Math.min(...ys),mxY=Math.max(...ys);
                    const pad=6/scale;
                    _selBBox = {x:mnX-pad,y:mnY-pad,w:(mxX-mnX)+pad*2,h:(mxY-mnY)+pad*2};
                    c._origPontos = c.pontos.map(p=>({...p}));
                } else {
                    _selBBox = {x:x0,y:y0,w:x1-x0,h:y1-y0};
                }
                const oppX = (cornerId==='tl'||cornerId==='bl') ? x1 : x0;
                const oppY = (cornerId==='tl'||cornerId==='tr') ? y1 : y0;
                _selResizeAnchorCX = oppX;
                _selResizeAnchorCY = oppY;
                const tcStart = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
                _selResizeStartDist = Math.max(10, Math.hypot(tcStart.x-oppX, tcStart.y-oppY));
            }, {passive:false});

            div.addEventListener('touchmove', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (!_selResizing || !_selBBox) return;
                const tc = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
                const curDist = Math.max(5, Math.hypot(tc.x-_selResizeAnchorCX, tc.y-_selResizeAnchorCY));
                _aplicarResize(Math.max(0.05, _selResizeStartScale*(curDist/_selResizeStartDist)));
            }, {passive:false});

            div.addEventListener('touchend', (e) => {
                e.stopPropagation();
                if (!_selResizing) return;
                _selResizing = false; _selResizeCorner = null;
                const fatorFinal = _selCurrentScale;
                if (selecaoCaminhoInfo) {
                    const cam = camadas[selecaoCaminhoInfo.camadaIdx];
                    const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
                    c._origPontos = c.pontos.map(p=>({...p}));
                    const xs=c.pontos.map(p=>p.x), ys=c.pontos.map(p=>p.y);
                    const minX=Math.min(...xs), maxX=Math.max(...xs);
                    const minY=Math.min(...ys), maxY=Math.max(...ys);
                    _selBBox = {x:minX,y:minY,w:maxX-minX,h:maxY-minY,cx:(minX+maxX)/2,cy:(minY+maxY)/2};
                } else if (_selRealEl && _selBBox) {
                    const {x:bx,y:by,w:bw,h:bh} = _selBBox;
                    const cx2=bx+bw/2+selecaoTransX, cy2=by+bh/2+selecaoTransY;
                    const nw=bw*fatorFinal, nh=bh*fatorFinal;
                    _selBBox = {x:cx2-nw/2,y:cy2-nh/2,w:nw,h:nh,cx:cx2,cy:cy2};
                }
                _selResizeStartScale=1; _selCurrentScale=1;
                salvarHistorico();
                if (camadas[camadaAtiva]) camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
            }, {passive:false});
        });

        const divRot = document.getElementById('sel-handle-rot');
        if (divRot) {
            divRot.addEventListener('touchstart', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (!_selHandlePositions) return;
                const {rotCanvasCX, rotCanvasCY} = _selHandlePositions;
                _selRotating = true;
                _selRotCX = rotCanvasCX; _selRotCY = rotCanvasCY;
                const tc = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
                _selRotStartAngle = Math.atan2(tc.y-rotCanvasCY, tc.x-rotCanvasCX)*180/Math.PI;
                if (_selRealEl) {
                    const tr = _selRealEl.getAttribute('transform')||'';
                    const rm = tr.match(/rotate\(([-\d.]+)/);
                    _selRotOrigAngle = rm ? parseFloat(rm[1]) : 0;
                } else { _selRotOrigAngle = 0; }
                _selRotCurAngle = _selRotOrigAngle;
            }, {passive:false});

            divRot.addEventListener('touchmove', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (!_selRotating) return;
                const tc = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
                const curAngle = Math.atan2(tc.y-_selRotCY, tc.x-_selRotCX)*180/Math.PI;
                let delta = curAngle - _selRotStartAngle;
                let novoAngulo = _selRotOrigAngle + delta;
                const snap = Math.round(novoAngulo/15)*15;
                if (Math.abs(novoAngulo-snap)<5) novoAngulo=snap;
                _selRotCurAngle = novoAngulo;
                _aplicarRotacao(novoAngulo);
            }, {passive:false});

            divRot.addEventListener('touchend', (e) => {
                e.stopPropagation();
                if (!_selRotating) return;
                _selRotating = false;
                if (selecaoCaminhoInfo) {
                    const cam = camadas[selecaoCaminhoInfo.camadaIdx];
                    const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
                    c._origPontos = c.pontos.map(p=>({...p}));
                }
                _selRotOrigAngle = _selRotCurAngle;
                salvarHistorico();
                if (camadas[camadaAtiva]) camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
            }, {passive:false});
        }
    }, 0);

    let selecaoCaminhoInfo = null;

    function tentarSelecionar(x, y) {
        selecaoCaminhoInfo = null;
        const layers = [document.getElementById('texto-layer'), livreLayer];
        for (const layer of layers) {
            const els = [...layer.querySelectorAll('path,text,circle,rect,ellipse,line,g,image')].reverse();
            for (const el of els) {
                try {
                    const bb = el.getBBox();
                    if (x>=bb.x-10 && x<=bb.x+bb.width+10 && y>=bb.y-10 && y<=bb.y+bb.height+10) {
                        selecaoEl = el;
                        _selRealEl = el;
                        _selCurrentScale = 1;
                        _selResizing = false;
                        _selRotating = false; _selRotOrigAngle = 0; _selRotCurAngle = 0;
                        selecaoTransX = 0; selecaoTransY = 0;
                        const cur = el.getAttribute('transform')||'';
                        const m = cur.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
                        if (m) { selecaoTransX=parseFloat(m[1]); selecaoTransY=parseFloat(m[2]); }
                        try {
                            const bb2 = el.getBBox();
                            _selBBox = {x: bb2.x, y: bb2.y, w: bb2.width, h: bb2.height};
                        } catch(_) { _selBBox = null; }
                        desenharHandlesSelecao(el);
                        return true;
                    }
                } catch(e) {}
            }
        }

        for (let ci = 0; ci < camadas.length; ci++) {
            const cam = camadas[ci];
            if (!cam || !cam.visivel || !cam.caminhos) continue;
            for (let pi = 0; pi < cam.caminhos.length; pi++) {
                const c = cam.caminhos[pi];
                if (!c.pontos.length) continue;
                const xs = c.pontos.map(p=>p.x), ys = c.pontos.map(p=>p.y);
                const minX=Math.min(...xs), maxX=Math.max(...xs);
                const minY=Math.min(...ys), maxY=Math.max(...ys);
                const margem = 20/scale;
                if (x>=minX-margem && x<=maxX+margem && y>=minY-margem && y<=maxY+margem) {
                    selecaoCaminhoInfo = {camadaIdx: ci, caminhoIdx: pi};
                    c._origPontos = c.pontos.map(p => ({...p}));
                    _selCurrentScale = 1;
                    const d = buildPathD(c.pontos, c.fechado);
                    const tmpEl = document.createElementNS(NS, 'path');
                    tmpEl.setAttribute('d', d);
                    drawLayer.appendChild(tmpEl);
                    selecaoEl = tmpEl;
                    selecaoTransX = 0; selecaoTransY = 0;
                    desenharHandlesSelecao(tmpEl);
                    tmpEl.remove();
                    const sl = document.getElementById('selecao-layer');
                    sl.innerHTML = '';
                    const rect = document.createElementNS(NS,'rect');
                    rect.setAttribute('x',minX-4/scale); rect.setAttribute('y',minY-4/scale);
                    rect.setAttribute('width',(maxX-minX)+8/scale); rect.setAttribute('height',(maxY-minY)+8/scale);
                    rect.setAttribute('fill','rgba(3,218,198,0.08)');
                    rect.setAttribute('stroke','#03dac6'); rect.setAttribute('stroke-width',1.5/scale);
                    rect.setAttribute('stroke-dasharray',`${5/scale} ${3/scale}`);
                    sl.appendChild(rect);
                    selecaoEl = rect;
                    return true;
                }
            }
        }
        limparSelecao();
        return false;
              }
// ── 2. TEXTO VETORIAL ────────────────────────────────────────────────
let textoFonte = 'sans-serif', textoBold = false, textoItalic = false;
let textoPosX = 400, textoPosY = 300;
let _textoEditando = null;
let _txtDrag = null;
let _penPontosCriados = 0;
let _penUndoIdx = -1;

function _abrirEdicaoTexto() {
    const el = _textoEditando;
    if (!el) return;
    document.getElementById('btn-editar-texto').style.display = 'none';
    document.getElementById('texto-input').value = el.textContent;
    const tam = parseInt(el.getAttribute('font-size')) || 32;
    document.getElementById('texto-tamanho').value = tam;
    document.getElementById('texto-tam-val').textContent = tam;
    const corSalva = el.getAttribute('data-cor') || '#000000';
    document.getElementById('texto-cor').value = corSalva;
    const fonte = el.getAttribute('data-fonte') || 'sans-serif';
    document.getElementById('fonte-select').value = fonte;
    document.getElementById('fonte-preview').style.fontFamily = fonte;
    document.getElementById('fonte-preview').textContent = el.textContent || 'Abc 123';
    textoFonte = fonte;
    textoBold   = el.getAttribute('data-bold')   === '1';
    textoItalic = el.getAttribute('data-italic') === '1';
    const boldEl   = document.getElementById('txt-bold');
    const italicEl = document.getElementById('txt-italic');
    boldEl.style.color         = textoBold   ? '#03dac6' : '#aaa';
    boldEl.style.borderColor   = textoBold   ? '#03dac6' : '#333';
    italicEl.style.color       = textoItalic ? '#03dac6' : '#aaa';
    italicEl.style.borderColor = textoItalic ? '#03dac6' : '#333';
    const degId  = el.getAttribute('data-deg-id')   || '';
    const degTipo = el.getAttribute('data-deg-tipo') || 'linear';
    const degC1  = el.getAttribute('data-deg-c1')   || '#ff00ff';
    const degC2  = el.getAttribute('data-deg-c2')   || '#00cfff';
    const temDeg = !!degId;
    document.getElementById('txt-degrade-ativo').checked = temDeg;
    document.getElementById('txt-degrade-wrap').style.display = temDeg ? 'flex' : 'none';
    if (temDeg) {
        document.getElementById('txt-deg-cor1').value = degC1;
        document.getElementById('txt-deg-cor2').value = degC2;
        txtDegradeTipo = degTipo;
        document.getElementById('txt-deg-linear').style.cssText =
            `flex:1;padding:5px;border-radius:7px;border:${degTipo==='linear'?'2px solid #03dac6;background:#1e2e2e;color:#03dac6':'1px solid #333;background:#2a2a2a;color:#888'};font-size:9px;font-weight:bold;text-align:center;`;
        document.getElementById('txt-deg-radial').style.cssText =
            `flex:1;padding:5px;border-radius:7px;border:${degTipo==='radial'?'2px solid #03dac6;background:#1e2e2e;color:#03dac6':'1px solid #333;background:#2a2a2a;color:#888'};font-size:9px;font-weight:bold;text-align:center;`;
    }
    const cCor = el.getAttribute('data-contorno-cor') || '#000000';
    const cEsp = parseFloat(el.getAttribute('data-contorno-esp')) || 0;
    const temContorno = cEsp > 0;
    document.getElementById('txt-contorno-ativo').checked = temContorno;
    document.getElementById('txt-contorno-wrap').style.display = temContorno ? 'flex' : 'none';
    if (temContorno) {
        document.getElementById('txt-contorno-cor').value = cCor;
        document.getElementById('txt-contorno-esp').value = cEsp;
        document.getElementById('txt-contorno-esp-val').textContent = cEsp + 'px';
    }
    textoPosX = parseFloat(el.getAttribute('x')) || textoPosX;
    textoPosY = parseFloat(el.getAttribute('y')) || textoPosY;
    document.getElementById('modal-texto').classList.add('aberto');
    setTimeout(() => document.getElementById('texto-input').focus(), 100);
}

document.getElementById('btn-editar-texto').addEventListener('touchstart', (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!_textoEditando) return;
    _textoEditando._substituir = true;
    _abrirEdicaoTexto();
}, {passive:false});

window.ativarModoTexto = () => {
    const btn = document.getElementById('btnTexto');
    const ativo = btn.style.background === 'rgb(3, 218, 198)';
    btn.style.background = ativo ? '#333' : '#03dac6';
    btn.style.color = ativo ? 'white' : '#000';
    if (!ativo) mostrarNotificacao('T Toque na tela onde quer inserir o texto');
};

window.abrirModalTexto = () => {
    document.getElementById('modal-texto').classList.add('aberto');
    const sel = document.getElementById('fonte-select');
    const prev = document.getElementById('fonte-preview');
    prev.style.fontFamily = sel.value;
    setTimeout(()=>document.getElementById('texto-input').focus(),100);
};

document.getElementById('btn-cancelar-texto').addEventListener('touchstart',(e)=>{
    e.stopPropagation();
    document.getElementById('modal-texto').classList.remove('aberto');
    if (_textoEditando && _textoEditando._substituir) {
        _textoEditando._substituir = false;
    }
    _textoEditando = null;
    document.getElementById('txt-degrade-ativo').checked=false;
    document.getElementById('txt-degrade-wrap').style.display='none';
    document.getElementById('txt-contorno-ativo').checked=false;
    document.getElementById('txt-contorno-wrap').style.display='none';
},{passive:true});

document.getElementById('btn-inserir-texto').addEventListener('touchend',(e)=>{
    e.stopPropagation(); e.preventDefault(); inserirTexto();
},{passive:false});
document.getElementById('btn-inserir-texto').addEventListener('click',(e)=>{
    e.stopPropagation(); inserirTexto();
});

document.getElementById('texto-tamanho').addEventListener('input',(e)=>{
    document.getElementById('texto-tam-val').textContent=e.target.value;
});

const fonteSelectEl = document.getElementById('fonte-select');
function onFonteChange() {
    textoFonte = fonteSelectEl.value;
    const prev = document.getElementById('fonte-preview');
    prev.style.fontFamily = textoFonte;
    const txt = document.getElementById('texto-input').value || 'Abc 123';
    prev.textContent = txt;
}
fonteSelectEl.addEventListener('change', onFonteChange);
fonteSelectEl.addEventListener('input', onFonteChange);
document.getElementById('texto-input').addEventListener('input',(e)=>{
    const prev = document.getElementById('fonte-preview');
    prev.textContent = e.target.value || 'Abc 123';
});
document.getElementById('btn-fonte-custom').addEventListener('touchstart',(e)=>{
    e.stopPropagation();
    const nome = document.getElementById('fonte-custom').value.trim();
    if (!nome) return;
    textoFonte = nome;
    const prev = document.getElementById('fonte-preview');
    prev.style.fontFamily = nome;
    mostrarNotificacao('Fonte "'+nome+'" aplicada!');
},{passive:true});

document.getElementById('txt-bold').addEventListener('touchstart',(e)=>{
    e.stopPropagation(); textoBold=!textoBold;
    const el=document.getElementById('txt-bold');
    el.style.color=textoBold?'#03dac6':'#aaa'; el.style.borderColor=textoBold?'#03dac6':'#333';
},{passive:true});

document.getElementById('txt-italic').addEventListener('touchstart',(e)=>{
    e.stopPropagation(); textoItalic=!textoItalic;
    const el=document.getElementById('txt-italic');
    el.style.color=textoItalic?'#03dac6':'#aaa'; el.style.borderColor=textoItalic?'#03dac6':'#333';
},{passive:true});

let txtDegradeTipo = 'linear';
document.getElementById('txt-degrade-ativo').addEventListener('change',(e)=>{
    document.getElementById('txt-degrade-wrap').style.display = e.target.checked ? 'flex' : 'none';
});
document.getElementById('txt-contorno-ativo').addEventListener('change',(e)=>{
    document.getElementById('txt-contorno-wrap').style.display = e.target.checked ? 'flex' : 'none';
});
document.getElementById('txt-contorno-esp').addEventListener('input',(e)=>{
    document.getElementById('txt-contorno-esp-val').textContent = e.target.value + 'px';
});
document.getElementById('txt-deg-linear').addEventListener('touchstart',(e)=>{
    e.stopPropagation(); txtDegradeTipo='linear';
    document.getElementById('txt-deg-linear').style.cssText='flex:1;padding:6px;border-radius:8px;border:2px solid #03dac6;background:#1e2e2e;color:#03dac6;font-size:10px;font-weight:bold;text-align:center;';
    document.getElementById('txt-deg-radial').style.cssText='flex:1;padding:6px;border-radius:8px;border:1px solid #333;background:#2a2a2a;color:#888;font-size:10px;font-weight:bold;text-align:center;';
},{passive:true});
document.getElementById('txt-deg-radial').addEventListener('touchstart',(e)=>{
    e.stopPropagation(); txtDegradeTipo='radial';
    document.getElementById('txt-deg-radial').style.cssText='flex:1;padding:6px;border-radius:8px;border:2px solid #03dac6;background:#1e2e2e;color:#03dac6;font-size:10px;font-weight:bold;text-align:center;';
    document.getElementById('txt-deg-linear').style.cssText='flex:1;padding:6px;border-radius:8px;border:1px solid #333;background:#2a2a2a;color:#888;font-size:10px;font-weight:bold;text-align:center;';
},{passive:true});

function inserirTexto() {
    const txt = document.getElementById('texto-input').value.trim();
    if (!txt) return;
    const tam = parseInt(document.getElementById('texto-tamanho').value)||32;
    const cor = document.getElementById('texto-cor').value;
    const usaDeg = document.getElementById('txt-degrade-ativo').checked;
    const usaContorno = document.getElementById('txt-contorno-ativo').checked;
    const contornoCor = document.getElementById('txt-contorno-cor').value;
    const contornoEsp = parseFloat(document.getElementById('txt-contorno-esp').value)||2;
    const fonteCustom = document.getElementById('fonte-custom').value.trim();
    const fonteFinal = fonteCustom || document.getElementById('fonte-select').value || 'sans-serif';
    const c1 = document.getElementById('txt-deg-cor1').value;
    const c2 = document.getElementById('txt-deg-cor2').value;
    salvarHistorico();
    const texLayer = document.getElementById('texto-layer');
    const degId = usaDeg ? 'txt-deg-' + Date.now() : null;
    if (usaDeg) {
        let defs = texLayer.querySelector('defs');
        if (!defs) { defs=document.createElementNS(NS,'defs'); texLayer.prepend(defs); }
        let grad;
        if (txtDegradeTipo === 'radial') {
            grad = document.createElementNS(NS,'radialGradient');
            grad.setAttribute('gradientUnits','userSpaceOnUse');
            grad.setAttribute('cx', textoPosX); grad.setAttribute('cy', textoPosY);
            grad.setAttribute('r', tam * 2);
            grad.setAttribute('fx', textoPosX); grad.setAttribute('fy', textoPosY);
        } else {
            grad = document.createElementNS(NS,'linearGradient');
            grad.setAttribute('gradientUnits','userSpaceOnUse');
            grad.setAttribute('x1', textoPosX - tam*2); grad.setAttribute('y1', textoPosY);
            grad.setAttribute('x2', textoPosX + tam*2); grad.setAttribute('y2', textoPosY);
        }
        grad.setAttribute('id', degId);
        const s1=document.createElementNS(NS,'stop');
        s1.setAttribute('offset','0%'); s1.setAttribute('stop-color',c1);
        const s2=document.createElementNS(NS,'stop');
        s2.setAttribute('offset','100%'); s2.setAttribute('stop-color',c2);
        grad.appendChild(s1); grad.appendChild(s2);
        defs.appendChild(grad);
    }
    const el = document.createElementNS(NS,'text');
    el.setAttribute('x',textoPosX); el.setAttribute('y',textoPosY);
    el.setAttribute('fill', usaDeg ? `url(#${degId})` : cor);
    el.setAttribute('font-size',tam);
    el.setAttribute('font-family', fonteFinal);
    el.style.fontFamily = fonteFinal;
    el.setAttribute('font-weight',textoBold?'bold':'normal');
    el.setAttribute('font-style',textoItalic?'italic':'normal');
    el.setAttribute('dominant-baseline','middle');
    el.setAttribute('text-anchor','middle');
    if (usaContorno) {
        el.setAttribute('stroke', contornoCor);
        el.setAttribute('stroke-width', contornoEsp);
        el.style.paintOrder = 'stroke fill';
    }
    el.setAttribute('data-cor', cor);
    el.setAttribute('data-tam', tam);
    el.setAttribute('data-fonte', fonteFinal);
    el.setAttribute('data-bold', textoBold ? '1' : '0');
    el.setAttribute('data-italic', textoItalic ? '1' : '0');
    el.setAttribute('data-contorno-cor', usaContorno ? contornoCor : '');
    el.setAttribute('data-contorno-esp', usaContorno ? contornoEsp : '0');
    el.setAttribute('data-deg-id', degId || '');
    el.setAttribute('data-deg-tipo', usaDeg ? txtDegradeTipo : '');
    el.setAttribute('data-deg-c1', usaDeg ? c1 : '');
    el.setAttribute('data-deg-c2', usaDeg ? c2 : '');
    el.textContent=txt;
    if (_textoEditando && _textoEditando._substituir) {
        const oldDegId = _textoEditando.getAttribute('data-deg-id');
        if (oldDegId) {
            const oldGrad = document.getElementById(oldDegId);
            if (oldGrad) oldGrad.remove();
        }
        texLayer.insertBefore(el, _textoEditando);
        _textoEditando.remove();
        _textoEditando = null;
    } else {
        texLayer.appendChild(el);
    }
    document.getElementById('modal-texto').classList.remove('aberto');
    document.getElementById('texto-input').value='';
    document.getElementById('txt-degrade-ativo').checked=false;
    document.getElementById('txt-degrade-wrap').style.display='none';
    document.getElementById('txt-contorno-ativo').checked=false;
    document.getElementById('txt-contorno-wrap').style.display='none';
    if (usaDeg) {
        _esconderBolinhasDegrade();
        modoDegrade = false; degradeStart = null;
        _dgPrevReset();
        if (txtDegradeTipo === 'radial') {
            _txtDgAjuste = { tipo:'radial', degId, el,
                x1: textoPosX, y1: textoPosY,
                x2: textoPosX + tam*2, y2: textoPosY,
                c1, c2 };
        } else {
            _txtDgAjuste = { tipo:'linear', degId, el,
                x1: textoPosX - tam*2, y1: textoPosY,
                x2: textoPosX + tam*2, y2: textoPosY,
                c1, c2 };
        }
        _atualizarBolinhasTxtDg();
        mostrarNotificacao('🎨 Arraste as bolinhas para ajustar o degradê');
    } else {
        mostrarNotificacao('✓ Texto inserido!');
    }
      }
// ── 3. RÉGUA E GUIAS ─────────────────────────────────────────────────
let reguaAtiva = false;
let guias = [];

window.toggleRegua = () => {
    reguaAtiva=!reguaAtiva;
    const btn=document.getElementById('btnRegua');
    btn.style.background=reguaAtiva?'#03dac6':'#333';
    btn.style.color=reguaAtiva?'#000':'white';
    document.getElementById('regua-h').style.display=reguaAtiva?'block':'none';
    document.getElementById('regua-v').style.display=reguaAtiva?'block':'none';
    document.getElementById('guias-layer').style.display=reguaAtiva?'block':'none';
    if (reguaAtiva) update();
    if(reguaAtiva) {
        desenharReguas();
        mostrarNotificacao('📐 Arraste das réguas para criar guias');
    }
};

function desenharReguas() {
    const rh = document.getElementById('regua-h');
    const rv = document.getElementById('regua-v');
    rh.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:18px;background:rgba(20,20,20,0.9);z-index:25;pointer-events:all;overflow:hidden;box-sizing:border-box;display:block;';
    rh.innerHTML = '';
    const step = Math.max(20, Math.round(40/scale));
    const canvasLeft = -posX/scale;
    const W = window.innerWidth/scale;
    for(let x=Math.floor(canvasLeft/step)*step; x<canvasLeft+W; x+=step){
        const screenX = (x - canvasLeft) * scale;
        const d = document.createElement('span');
        d.style.cssText = `position:absolute;left:${screenX}px;top:1px;font-size:7px;color:#888;white-space:nowrap;`;
        d.textContent = Math.round(x);
        rh.appendChild(d);
        const tick = document.createElement('div');
        tick.style.cssText = `position:absolute;left:${screenX}px;bottom:0;width:1px;height:5px;background:#555;`;
        rh.appendChild(tick);
    }
    rv.style.cssText = 'position:fixed;top:18px;left:0;width:18px;height:calc(100% - 18px);background:rgba(20,20,20,0.9);z-index:25;pointer-events:all;overflow:hidden;display:block;';
    rv.innerHTML = '';
    const canvasTop = -posY/scale;
    const H = window.innerHeight/scale;
    for(let y=Math.floor(canvasTop/step)*step; y<canvasTop+H; y+=step){
        const screenY = (y - canvasTop) * scale;
        const d = document.createElement('span');
        d.style.cssText = `position:absolute;top:${screenY}px;left:0;font-size:7px;color:#888;writing-mode:vertical-lr;white-space:nowrap;`;
        d.textContent = Math.round(y);
        rv.appendChild(d);
    }
    renderizarGuias();
}

function renderizarGuias() {
    const gl=document.getElementById('guias-layer');
    gl.innerHTML='';
    guias.forEach(g=>{
        const div=document.createElement('div');
        div.className=g.tipo==='h'?'guia-h':'guia-v';
        if(g.tipo==='h') div.style.top=g.pos+'px';
        else div.style.left=g.pos+'px';
        gl.appendChild(div);
    });
}

document.getElementById('regua-h').addEventListener('touchstart',(e)=>{
    if(!reguaAtiva) return;
    const {y} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
    guias.push({tipo:'h',pos:Math.max(0,y)});
    renderizarGuias();
},{passive:true});

document.getElementById('regua-v').addEventListener('touchstart',(e)=>{
    if(!reguaAtiva) return;
    const {x} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
    guias.push({tipo:'v',pos:Math.max(0,x)});
    renderizarGuias();
},{passive:true});

// ── 4. CONTA-GOTAS ───────────────────────────────────────────────────
let modoContaGotas = false;

window.toggleContaGotas = () => {
    modoContaGotas=!modoContaGotas;
    const btn=document.getElementById('btnContaGotas');
    btn.style.background=modoContaGotas?'#f39c12':'#333';
    const cur=document.getElementById('conta-gotas-cursor');
    cur.style.display=modoContaGotas?'block':'none';
    if(modoContaGotas) {
        modoPen=false; modoLivre=false; modoBorracha=false;
        mostrarNotificacao('💧 Toque em qualquer cor para capturá-la');
    }
};

function capturarCor(clientX, clientY) {
    const {x: px, y: py} = clientParaCanvas(clientX, clientY);
    const W=workSurface.offsetWidth, H=workSurface.offsetHeight;
    const c=document.createElement('canvas');
    c.width=W; c.height=H;
    const ctx=c.getContext('2d');
    ctx.fillStyle=modoInfinito?'#1a1a1a':'white';
    ctx.fillRect(0,0,W,H);
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        ${drawLayer.innerHTML}${livreLayer.innerHTML}
        ${document.getElementById('texto-layer').innerHTML}
    </svg>`;
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img,0,0);
        URL.revokeObjectURL(img.src);
        const d=ctx.getImageData(Math.round(px),Math.round(py),1,1).data;
        const hex='#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
        document.getElementById('col-main').value=hex;
        document.getElementById('conta-gotas-cursor').style.background=hex;
        modoContaGotas=false;
        document.getElementById('btnContaGotas').style.background='#333';
        document.getElementById('conta-gotas-cursor').style.display='none';
        mostrarNotificacao('💧 Cor capturada: '+hex);
    };
    img.onerror = () => URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(new Blob([svgStr],{type:'image/svg+xml'}));
}

// ── 5. ESPELHO ───────────────────────────────────────────────────────
let modoEspelho = false;

window.toggleEspelho = () => {
    modoEspelho=!modoEspelho;
    document.getElementById('btnEspelho').style.background=modoEspelho?'#9b59b6':'#333';
    document.getElementById('espelho-line').style.display = modoEspelho ? 'block' : 'none';
    if(modoEspelho) mostrarNotificacao('⟺ Espelho ativo — o que desenhar à esquerda reflete à direita!');
};

function aplicarEspelho(grupo) {
    if(!modoEspelho||!grupo) return;
    const eixoX = (-posX + window.innerWidth/2) / scale;
    const mirror=grupo.cloneNode(true);
    mirror.setAttribute('transform',`translate(${eixoX*2},0) scale(-1,1)`);
    livreLayer.appendChild(mirror);
}

// ── 6. HISTÓRICO VISÍVEL ─────────────────────────────────────────────
let painelHistoricoAberto=false;

window.toggleHistorico=()=>{
    painelHistoricoAberto=!painelHistoricoAberto;
    document.getElementById('painel-historico').classList.toggle('aberto',painelHistoricoAberto);
    const btn=document.getElementById('btnHistorico');
    btn.style.background=painelHistoricoAberto?'#03dac6':'#333';
    btn.style.color=painelHistoricoAberto?'#000':'white';
    if(painelHistoricoAberto) atualizarListaHistorico();
};

function atualizarListaHistorico() {
    const lista=document.getElementById('hist-lista');
    lista.innerHTML='';
    if(historico.length===0){
        lista.innerHTML='<div style="color:#555;font-size:11px;text-align:center;padding:20px;">Nenhuma ação ainda</div>';
        return;
    }
    const cur=document.createElement('div');
    cur.className='hist-item atual'; cur.textContent='● Estado atual';
    lista.appendChild(cur);
    [...historico].reverse().forEach((snap, i)=>{
        const div=document.createElement('div');
        div.className='hist-item';
        div.textContent=`Ação ${historico.length-i}`;
        div.addEventListener('touchstart',(e)=>{
            e.stopPropagation();
            const snapObj = JSON.parse(snap);
            if (snapObj.camadas !== undefined) {
                camadas = snapObj.camadas;
            } else {
                camadas = snapObj;
            }
            caminhoAtivo=-1; pontosPen=[]; pathFechado=false;
            penLayer.innerHTML='';
            document.getElementById('btn-confirmar-pen').style.display='none';
            renderizarTodos();
            if(painelAberto) renderizarPainel();
            atualizarListaHistorico();
        },{passive:true});
        lista.appendChild(div);
    });
}

function update() {
    workSurface.style.transform = `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotacao}deg)`;
    if (_dgAjuste) _atualizarBolinhasDegrade();
}

function _clampPos() {
    const cW = workSurface.offsetWidth, cH = workSurface.offsetHeight;
    const rad = rotacao * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const cantos = [{x:0,y:0},{x:cW,y:0},{x:cW,y:cH},{x:0,y:cH}];
    const tela = cantos.map(p => ({
        x: posX + (p.x * scale) * cos - (p.y * scale) * sin,
        y: posY + (p.x * scale) * sin + (p.y * scale) * cos
    }));
    const minX = Math.min(...tela.map(p=>p.x));
    const maxX = Math.max(...tela.map(p=>p.x));
    const minY = Math.min(...tela.map(p=>p.y));
    const maxY = Math.max(...tela.map(p=>p.y));
    const sw = window.innerWidth, sh = window.innerHeight;
    const margem = 120;
    if (maxX < margem)      posX += margem - maxX;
    if (minX > sw - margem) posX -= minX - (sw - margem);
    if (maxY < margem)      posY += margem - maxY;
    if (minY > sh - margem) posY -= minY - (sh - margem);
}

function clientParaCanvas(clientX, clientY) {
    const rad = rotacao * Math.PI / 180;
    const cos = Math.cos(-rad), sin = Math.sin(-rad);
    const dx = clientX - posX;
    const dy = clientY - posY;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return { x: rx / scale, y: ry / scale };
}

function canvasParaClient(canvasX, canvasY) {
    const rad = rotacao * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const rx = canvasX * scale, ry = canvasY * scale;
    return {
        x: posX + rx * cos - ry * sin,
        y: posY + rx * sin + ry * cos
    };
}

let _indicadorRotTimer = null;
function _atualizarIndicadorRotacao() {
    const el = document.getElementById('indicador-rotacao');
    if (!el) return;
    const graus = ((Math.round(rotacao) % 360) + 360) % 360;
    el.textContent = `↻ ${graus}°`;
    el.style.display = 'block';
    if (_indicadorRotTimer) clearTimeout(_indicadorRotTimer);
    _indicadorRotTimer = setTimeout(() => { el.style.display = 'none'; }, 1500);
          }
