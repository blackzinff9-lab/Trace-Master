// Injeta fontes Google dentro do SVG texto-layer
    function carregarGoogleFonts() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Righteous&family=Fredoka+One&family=Pacifico&family=Lobster&family=Press+Start+2P&family=Orbitron:wght@700&family=Cinzel:wght@700&family=Raleway:wght@800&family=Oswald:wght@700&family=Playfair+Display:wght@700&family=Dancing+Script:wght@700&family=Abril+Fatface&family=Black+Han+Sans&family=Boogaloo&family=Chewy&family=Permanent+Marker&family=Russo+One&family=Saira+Stencil+One&family=Yatra+One&display=swap';
        link.onload = () => {
            const prev = document.getElementById('fonte-preview');
            if (prev) prev.style.fontFamily = document.getElementById('fonte-select')?.value || 'sans-serif';
            console.log('Google Fonts carregadas!');
        };
        link.onerror = () => console.warn('Google Fonts não carregou — sem internet?');
        document.head.appendChild(link);
    }
    carregarGoogleFonts();

    const workSurface = document.getElementById('work-surface'),
          svgArea     = document.getElementById('svg-render-area'),
          hCanvas     = document.getElementById('hidden-canvas'),
          hCtx        = hCanvas.getContext('2d'),
          drawLayer   = document.getElementById('draw-layer'),
          penLayer    = document.getElementById('pen-layer'),
          vp          = document.getElementById('viewport');

    let scale = 0.8, posX = 20, posY = 80, distIni = null, isDragging = false, lastX, lastY;
    let rotacao = 0;
    let pinching = false, pinchDistIni = 0, pinchCxIni = 0, pinchCyIni = 0;
    let pinchScaleIni = 1, pinchPosXIni = 0, pinchPosYIni = 0;
    let pinchAnguloIni = 0, pinchRotacaoIni = 0;

    const appState = {
        get scale()   { return scale; },   set scale(v)   { scale = v; },
        get posX()    { return posX; },    set posX(v)    { posX = v; },
        get posY()    { return posY; },    set posY(v)    { posY = v; },
        get rotacao() { return rotacao; }, set rotacao(v) { rotacao = v; },
        get camadas()     { return camadas; },      set camadas(v)     { camadas = v; },
        get camadaAtiva() { return camadaAtiva; },  set camadaAtiva(v) { camadaAtiva = v; },
        get camadaFoto()  { return camadaFoto; },   set camadaFoto(v)  { camadaFoto = v; },
        get idCounter()   { return idCounter; },    set idCounter(v)   { idCounter = v; },
        get historico()       { return historico; },       set historico(v)       { historico = v; },
        get historicoFuturo() { return historicoFuturo; }, set historicoFuturo(v) { historicoFuturo = v; },
        get ferramentaAtiva() { return ferramentaAtiva; }, set ferramentaAtiva(v) { ferramentaAtiva = v; },
        get modoPen()         { return modoPen; },         set modoPen(v)         { modoPen = v; },
        get modoEditar()      { return modoEditar; },      set modoEditar(v)      { modoEditar = v; },
        get modoLivre()       { return modoLivre; },       set modoLivre(v)       { modoLivre = v; },
        get modoBorracha()    { return modoBorracha; },    set modoBorracha(v)    { modoBorracha = v; },
        get modoFormas()      { return modoFormas; },      set modoFormas(v)      { modoFormas = v; },
        get modoDegrade()     { return modoDegrade; },     set modoDegrade(v)     { modoDegrade = v; },
        get modoSelecao()     { return modoSelecao; },     set modoSelecao(v)     { modoSelecao = v; },
        get modoContaGotas()  { return modoContaGotas; },  set modoContaGotas(v)  { modoContaGotas = v; },
        get modoEspelho()     { return modoEspelho; },     set modoEspelho(v)     { modoEspelho = v; },
        get modoOutline()     { return modoOutline; },     set modoOutline(v)     { modoOutline = v; },
        get modoInfinito()    { return modoInfinito; },    set modoInfinito(v)    { modoInfinito = v; },
        get folhaTravada()    { return folhaTravada; },    set folhaTravada(v)    { folhaTravada = v; },
        get pincelAtual() { return pincelAtual; }, set pincelAtual(v) { pincelAtual = v; },
        get cor()       { return document.getElementById('col-main')?.value    ?? '#000000'; },
        get tamanho()   { return parseFloat(document.getElementById('brush-size')?.value    ?? 10); },
        get opacidade() { return parseFloat(document.getElementById('brush-opacity')?.value ?? 1); },
        get textoFonte()  { return textoFonte; },  set textoFonte(v)  { textoFonte = v; },
        get textoBold()   { return textoBold; },   set textoBold(v)   { textoBold = v; },
        get textoItalic() { return textoItalic; }, set textoItalic(v) { textoItalic = v; },
        get textoPosX()   { return textoPosX; },   set textoPosX(v)   { textoPosX = v; },
        get textoPosY()   { return textoPosY; },   set textoPosY(v)   { textoPosY = v; },
        toJSON() {
            return {
                scale, posX, posY, rotacao,
                camadaAtiva,
                ferramentaAtiva, pincelAtual,
            };
        }
    };

    let historico = [], historicoFuturo = [];
    let modoLivre    = false;
    let modoBorracha = false;
    let folhaTravada    = false;
    let menuFerraberto  = false;
    let ferramentaAtiva = 'pen';
    let modoFormas   = false;
    let formaAtual   = 'circulo';
    let formaStart   = null;
    let pontosBorracha = [];
    const livreLayer = document.getElementById('livre-layer');
    let livrePathAtual = null;
    let livrePathD     = '';
    const formaPreview   = document.getElementById('forma-preview');
    const borrachaLayer  = document.getElementById('borracha-layer');

    function renderizarBorracha() {
        borrachaLayer.innerHTML = '';
        if (pontosBorracha.length === 0) return;
        const ns = 'http://www.w3.org/2000/svg';
        const r1 = 9/scale;
        if (pontosBorracha.length >= 2) {
            const linePath = document.createElementNS(ns, 'path');
            let d = `M ${pontosBorracha[0].x} ${pontosBorracha[0].y}`;
            pontosBorracha.forEach(p => d += ` L ${p.x} ${p.y}`);
            linePath.setAttribute('d', d);
            linePath.setAttribute('stroke', '#ff6600');
            linePath.setAttribute('stroke-width', 2/scale);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke-dasharray', `${10/scale},${5/scale}`);
            linePath.setAttribute('stroke-linecap', 'round');
            borrachaLayer.appendChild(linePath);
        }
        if (pontosBorracha.length >= 1) {
            const txt = document.createElementNS(ns, 'text');
            const pu = pontosBorracha[pontosBorracha.length - 1];
            txt.setAttribute('x', pu.x + 14/scale);
            txt.setAttribute('y', pu.y - 10/scale);
            txt.setAttribute('fill', '#ff6600');
            txt.setAttribute('font-size', 11/scale);
            txt.setAttribute('font-weight', 'bold');
            if (pontosBorracha.length === 1) txt.textContent = 'toque p/ marcar fim do rasgo';
            else txt.textContent = `${pontosBorracha.length} pontos  •  2x = cortar  •  ↩ = desfazer`;
            borrachaLayer.appendChild(txt);
        }
        pontosBorracha.forEach((p, i) => {
            const isLast = i === pontosBorracha.length - 1;
            const outer = document.createElementNS(ns, 'circle');
            outer.setAttribute('cx', p.x); outer.setAttribute('cy', p.y);
            outer.setAttribute('r', r1);
            outer.setAttribute('fill', isLast ? '#ff6600' : 'white');
            outer.setAttribute('stroke', '#ff6600');
            outer.setAttribute('stroke-width', 2/scale);
            borrachaLayer.appendChild(outer);
            const inner = document.createElementNS(ns, 'circle');
            inner.setAttribute('cx', p.x); inner.setAttribute('cy', p.y);
            inner.setAttribute('r', r1 * 0.45);
            inner.setAttribute('fill', isLast ? 'white' : '#ff6600');
            borrachaLayer.appendChild(inner);
        });
      }
function aplicarBorracha() {
    if (pontosBorracha.length < 2) return;

    const pb0 = pontosBorracha[0];
    const pbN = pontosBorracha[pontosBorracha.length - 1];
    const brushR = Math.max(parseFloat(document.getElementById('brush-size').value), 8) / scale;

    const lcDx = pbN.x - pb0.x, lcDy = pbN.y - pb0.y;
    const lcLen = Math.hypot(lcDx, lcDy);
    if (lcLen < 1) return;
    const lcNx = lcDx / lcLen, lcNy = lcDy / lcLen;
    const lcPx = -lcNy, lcPy = lcNx;

    function distPerpLC(p) {
        const dx = p.x - pb0.x, dy = p.y - pb0.y;
        return dx * lcPx + dy * lcPy;
    }
    function distParalLC(p) {
        const dx = p.x - pb0.x, dy = p.y - pb0.y;
        return dx * lcNx + dy * lcNy;
    }
    function lerp(a, b, t) {
        return { x: a.x + t*(b.x-a.x), y: a.y + t*(b.y-a.y), tipo:'ancora' };
    }
    function projSegmento(p, a, b) {
        const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx+dy*dy;
        if (lenSq < 0.0001) return { t:0, dist:Math.hypot(p.x-a.x, p.y-a.y) };
        const t = Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/lenSq));
        return { t, dist:Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy)) };
    }
    function acharIntersecoes(pts) {
        const hits = [];
        for (let i = 0; i < pts.length-1; i++) {
            const a = pts[i], b = pts[i+1];
            const dA = distPerpLC(a);
            const dB = distPerpLC(b);
            if ((dA - brushR) * (dB - brushR) <= 0 && Math.abs(dB - dA) > 0.0001) {
                const t = (brushR - dA) / (dB - dA);
                if (t >= 0 && t <= 1) {
                    const pt = lerp(a, b, t);
                    const pParal = distParalLC(pt);
                    if (pParal >= -brushR*2 && pParal <= lcLen + brushR*2)
                        hits.push({segIdx:i, t, x:pt.x, y:pt.y});
                }
            }
            if ((dA + brushR) * (dB + brushR) <= 0 && Math.abs(dB - dA) > 0.0001) {
                const t = (-brushR - dA) / (dB - dA);
                if (t >= 0 && t <= 1) {
                    const pt = lerp(a, b, t);
                    const pParal = distParalLC(pt);
                    if (pParal >= -brushR*2 && pParal <= lcLen + brushR*2)
                        hits.push({segIdx:i, t, x:pt.x, y:pt.y});
                }
            }
        }
        hits.sort((a, b) => a.segIdx !== b.segIdx ? a.segIdx-b.segIdx : a.t-b.t);
        const dedup = [];
        for (const h of hits) {
            const last = dedup[dedup.length-1];
            if (!last || last.segIdx !== h.segIdx || Math.abs(last.t-h.t) > 0.01)
                dedup.push(h);
        }
        return dedup;
    }
    function construir(pts, hits) {
        if (hits.length < 2) return null;
        const hA = hits[0];
        const hB = hits[hits.length-1];
        const fA = [];
        for (let i = 0; i <= hA.segIdx; i++)
            fA.push({...pts[i], tipo:pts[i].tipo||'ancora'});
        const pA = {x:hA.x, y:hA.y, tipo:'ancora'};
        if (Math.hypot(pA.x-fA[fA.length-1].x, pA.y-fA[fA.length-1].y) > 1)
            fA.push(pA);
        const fD = [{x:hB.x, y:hB.y, tipo:'ancora'}];
        for (let i = hB.segIdx+1; i < pts.length; i++)
            fD.push({...pts[i], tipo:pts[i].tipo||'ancora'});
        if (fD.length >= 2 && Math.hypot(fD[0].x-fD[1].x, fD[0].y-fD[1].y) < 1)
            fD.shift();
        return { fA, fD };
    }
    function distMediaAoTraco(pts) {
        let soma = 0, count = 0;
        for (const p of pts) {
            soma += Math.abs(distPerpLC(p));
            count++;
        }
        return count > 0 ? soma/count : Infinity;
    }
    function projDireta(p, pts) {
        let best = null;
        for (let i = 0; i < pts.length-1; i++) {
            const dx=pts[i+1].x-pts[i].x, dy=pts[i+1].y-pts[i].y;
            const lenSq=dx*dx+dy*dy;
            if (lenSq < 0.0001) continue;
            const t=Math.max(0,Math.min(1,((p.x-pts[i].x)*dx+(p.y-pts[i].y)*dy)/lenSq));
            const x=pts[i].x+t*dx, y=pts[i].y+t*dy;
            const d=Math.hypot(p.x-x,p.y-y);
            if (!best || d < best.d) best={segIdx:i,t,x,y,d};
        }
        return best;
    }
    function hitsComFallback(pts) {
        let hits = acharIntersecoes(pts);
        if (hits.length >= 2) return hits;
        const h0 = projDireta(pb0, pts);
        const hN = projDireta(pbN, pts);
        if (!h0 || !hN) return [];
        const limiar = 80 / scale;
        if (h0.d > limiar || hN.d > limiar) return [];
        const arr = [h0, hN].sort((a,b) => a.segIdx!==b.segIdx ? a.segIdx-b.segIdx : a.t-b.t);
        if (arr[0].segIdx===arr[1].segIdx && Math.abs(arr[0].t-arr[1].t)<0.005) return [];
        return arr;
    }

    const caminhos = getCaminhos();
    let melhorCi = -1, melhorHits = null, melhorDist = Infinity;
    for (let ci = 0; ci < caminhos.length; ci++) {
        const pts = caminhos[ci].pontos;
        if (pts.length < 2) continue;
        const hits = hitsComFallback(pts);
        if (hits.length < 2) continue;
        const dist = distMediaAoTraco(pts);
        if (dist < melhorDist) { melhorDist = dist; melhorCi = ci; melhorHits = hits; }
    }

    if (melhorCi >= 0 && melhorHits) {
        const cam = caminhos[melhorCi];
        const resultado = construir(cam.pontos, melhorHits);
        if (resultado) {
            const { fA, fD } = resultado;
            caminhos.splice(melhorCi, 1);
            let ins = melhorCi;
            if (fA.length >= 2) caminhos.splice(ins++, 0, {
                pontos:fA, fechado:false,
                stroke:cam.stroke, width:cam.width,
                opacity:cam.opacity, tipo:cam.tipo
            });
            if (fD.length >= 2) caminhos.splice(ins++, 0, {
                pontos:fD, fechado:false,
                stroke:cam.stroke, width:cam.width,
                opacity:cam.opacity, tipo:cam.tipo
            });
        }
    }

    let melhorEl = null, melhorHitsL = null, melhorDistL = Infinity;
    let melhorElGrupo = null;
    function _processarPathEl(el, grupoRaiz) {
        const d = el.getAttribute('d') || '';
        const livPts = [];
        d.trim().split(/(?=[ML])/).forEach(tok => {
            const vals = tok.trim().replace(/^[ML]\s*/,'').split(/[\s,]+/);
            if (vals.length >= 2) livPts.push({x:parseFloat(vals[0]),y:parseFloat(vals[1])});
        });
        if (livPts.length < 2) return;
        const hits = hitsComFallback(livPts);
        if (hits.length < 2) return;
        const dist = distMediaAoTraco(livPts);
        if (dist < melhorDistL) {
            melhorDistL = dist; melhorEl = el;
            melhorHitsL = hits; melhorEl._livPts = livPts;
            melhorElGrupo = grupoRaiz || null;
        }
    }
    [...livreLayer.children].forEach(el => {
        if (el.tagName === 'g' || el.tagName === 'G') {
            let pathPrincipal = null, maxW = -1;
            [...el.querySelectorAll('path')].forEach(p => {
                const w = parseFloat(p.getAttribute('stroke-width') || '0');
                const d = p.getAttribute('d') || '';
                const nPts = (d.match(/[ML]/g)||[]).length;
                if (nPts > maxW) { maxW = nPts; pathPrincipal = p; }
            });
            if (pathPrincipal) _processarPathEl(pathPrincipal, el);
        } else if (el.tagName === 'path') {
            _processarPathEl(el, null);
        }
    });

    if (melhorEl && melhorHitsL) {
        const livPts = melhorEl._livPts;
        if (melhorElGrupo) {
            melhorElGrupo.remove();
            if (camadas[camadaAtiva]) camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
        } else {
            const resultado = construir(livPts, melhorHitsL);
            if (resultado) {
                const { fA, fD } = resultado;
                const st = melhorEl.getAttribute('stroke')||'#000';
                const sw = melhorEl.getAttribute('stroke-width')||'2';
                const so = melhorEl.getAttribute('stroke-opacity')||'1';
                const lc = melhorEl.getAttribute('stroke-linecap')||'round';
                const lj = melhorEl.getAttribute('stroke-linejoin')||'round';
                const fi = melhorEl.getAttribute('filter')||'';
                const da = melhorEl.getAttribute('stroke-dasharray')||'';
                function mkPath(pontos) {
                    if (pontos.length < 2) return;
                    const np = document.createElementNS('http://www.w3.org/2000/svg','path');
                    let nd = `M ${pontos[0].x} ${pontos[0].y}`;
                    pontos.slice(1).forEach(p => nd += ` L ${p.x} ${p.y}`);
                    np.setAttribute('d',nd); np.setAttribute('stroke',st);
                    np.setAttribute('stroke-width',sw); np.setAttribute('stroke-opacity',so);
                    np.setAttribute('stroke-linecap',lc); np.setAttribute('stroke-linejoin',lj);
                    np.setAttribute('fill','none');
                    if(fi) np.setAttribute('filter',fi);
                    if(da) np.setAttribute('stroke-dasharray',da);
                    livreLayer.appendChild(np);
                }
                melhorEl.remove();
                mkPath(fA);
                mkPath(fD);
            }
        }
    }

    caminhoAtivo = -1; pontosPen = []; penLayer.innerHTML = '';
    renderizarTodos();
    pontosBorracha = []; borrachaLayer.innerHTML = '';
}

function segmentosSeIntersectam(a, b, c, d2) {
    const dx1 = b.x-a.x, dy1 = b.y-a.y;
    const dx2 = d2.x-c.x, dy2 = d2.y-c.y;
    const denom = dx1*dy2 - dy1*dx2;
    if (Math.abs(denom) < 0.0001) return false;
    const t = ((c.x-a.x)*dy2 - (c.y-a.y)*dx2) / denom;
    const u = ((c.x-a.x)*dy1 - (c.y-a.y)*dx1) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
let hasMovedTap = false, isNewPoint = false, tapStartX = 0, tapStartY = 0;
let modoPen = false, modoEditar = false;
let caminhoAtivo = -1, pontosPen = [], pathFechado = false;
let noArrastado = null;
// Apenas variáveis restantes e funções auxiliares que estavam no final do 01-estado.js
// (Obs: no original, o 01-estado.js termina aqui, o resto é dos outros arquivos)
// Por garantia, coloco as últimas definições que estavam no final do original.
// Se você perceber que faltou algo, avise, mas o restante está nos próximos arquivos.
console.log('Estado inicial carregado.');
