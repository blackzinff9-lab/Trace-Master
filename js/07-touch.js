// ── TOUCH START ───────────────────────────────────────────────────────────
    vp.addEventListener('touchstart', (e) => {
        e.preventDefault();

        if (e.touches.length >= 2) {
            const texLayer2 = document.getElementById('texto-layer');
            const t0 = e.touches[0], t1 = e.touches[1];
            const p0 = clientParaCanvas(t0.clientX, t0.clientY);
            const p1 = clientParaCanvas(t1.clientX, t1.clientY);
            let dedosSobreTexto = false;
            for (const elT of [...texLayer2.querySelectorAll('text')]) {
                try {
                    const bb = elT.getBBox();
                    const margem = 30 / scale;
                    const emCima = (px, py) =>
                        px >= bb.x - margem && px <= bb.x + bb.width + margem &&
                        py >= bb.y - margem && py <= bb.y + bb.height + margem;
                    if (emCima(p0.x, p0.y) || emCima(p1.x, p1.y)) {
                        dedosSobreTexto = true; break;
                    }
                } catch(e2) {}
            }
            if (dedosSobreTexto) {
                pinching = false; isDragging = false; _txtDrag = null;
                return;
            }
            if ((modoPen || modoEditar) && _penPontosCriados > 0) {
                if (_penUndoIdx >= 0 && _penUndoIdx < pontosPen.length) {
                    pontosPen.splice(_penUndoIdx, 1);
                } else {
                    pontosPen.pop();
                }
                _penPontosCriados = 0; _penUndoIdx = -1;
                noArrastado = null; isNewPoint = false;
                renderizarPen();
            }
            if (_txtDrag) { _txtDrag = null; _textoEditando = null; }
            pinchDistIni  = Math.hypot(t0.clientX-t1.clientX, t0.clientY-t1.clientY);
            pinchCxIni    = (t0.clientX + t1.clientX) / 2;
            pinchCyIni    = (t0.clientY + t1.clientY) / 2;
            pinchScaleIni = scale;
            pinchPosXIni  = posX;
            pinchPosYIni  = posY;
            pinchAnguloIni  = Math.atan2(t1.clientY-t0.clientY, t1.clientX-t0.clientX);
            pinchRotacaoIni = rotacao;
            pinching  = true;
            isDragging = false;
            noArrastado = null;
            isNewPoint  = false;
            return;
        }

        isDragging = true; hasMovedTap = false; isNewPoint = false;
        tapStartX = e.touches[0].clientX; tapStartY = e.touches[0].clientY;
        lastX = e.touches[0].clientX;     lastY = e.touches[0].clientY;

        const {x, y} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);

        if (document.getElementById('btnTexto').style.background === 'rgb(3, 218, 198)') {
            textoPosX=x; textoPosY=y;
            document.getElementById('btnTexto').style.background='#333';
            document.getElementById('btnTexto').style.color='white';
            abrirModalTexto(); isDragging=false; return;
        }

        if (!modoSelecao && !modoLivre && !modoBorracha && !modoDegrade &&
            !modoFormas && !modoPen && !modoEditar && !modoContaGotas) {
            const texLayer2 = document.getElementById('texto-layer');
            const elsTxt = [...texLayer2.querySelectorAll('text')].reverse();
            for (const elT of elsTxt) {
                try {
                    const bb = elT.getBBox();
                    const margem = 20 / scale;
                    if (x >= bb.x - margem && x <= bb.x + bb.width + margem &&
                        y >= bb.y - margem && y <= bb.y + bb.height + margem) {
                        _textoEditando = elT;
                        _txtDrag = {
                            el: elT,
                            offX: x - parseFloat(elT.getAttribute('x')||0),
                            offY: y - parseFloat(elT.getAttribute('y')||0),
                            moved: false
                        };
                        isDragging = false;
                        return;
                    }
                } catch(e2) {}
            }
            document.getElementById('btn-editar-texto').style.display = 'none';
            _textoEditando = null;
            _txtDrag = null;
        } else {
            document.getElementById('btn-editar-texto').style.display = 'none';
            _textoEditando = null;
            _txtDrag = null;
        }

        if (modoSelecao) {
            tentarSelecionar(x, y);
            selecaoOffX = x; selecaoOffY = y;
            return;
        }

        if (modoLivre)    { iniciarPincel(x, y); return; }
        if (modoBorracha) {
            const agora = Date.now(), intervalo = agora-(window._ultimoToqueBorracha||0);
            window._ultimoToqueBorracha = agora;
            if (intervalo<400 && pontosBorracha.length>=2) { aplicarBorracha(); return; }
            pontosBorracha.push({x,y}); renderizarBorracha(); return;
        }
        if (modoDegrade)  { degradeStart={x,y}; atualizarPreviewDegradeLayer(x,y,x,y); return; }
        if (modoFormas)   { formaStart={x,y}; return; }
        if (modoEditar) {
            _penPontosCriados = 0; _penUndoIdx = -1;
            if (caminhoAtivo >= 0) {
                noArrastado = null;
                for (let i=0;i<pontosPen.length;i++) {
                    if (Math.hypot(pontosPen[i].x-x,pontosPen[i].y-y)<30/scale){noArrastado=i;break;}
                }
                if (noArrastado!==null) return;
                if (pontosPen.length>=2) {
                    const limiar=20/scale; let mD=Infinity,mI=-1;
                    for (let i=0;i<pontosPen.length-1;i++) {
                        const a=pontosPen[i],b=pontosPen[i+1];
                        const ddx=b.x-a.x,ddy=b.y-a.y,lq=ddx*ddx+ddy*ddy;
                        let t=lq>0?((x-a.x)*ddx+(y-a.y)*ddy)/lq:0;
                        t=Math.max(0,Math.min(1,t));
                        const dd=Math.hypot(x-(a.x+t*ddx),y-(a.y+t*ddy));
                        if(dd<limiar&&dd<mD){mD=dd;mI=i;}
                    }
                    if(mI>=0){const a=pontosPen[mI],b=pontosPen[mI+1];pontosPen.splice(mI+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,tipo:'curva'});noArrastado=mI+1;isNewPoint=true;_penPontosCriados=1;_penUndoIdx=mI+1;renderizarPen();return;}
                }
                const idxOutro = hitTestCaminhos(x, y);
                if (idxOutro >= 0 && idxOutro !== caminhoAtivo) { _editarCaminho(idxOutro); return; }
            } else {
                const caminhos = getCaminhos();
                let melhorIdx = -1, melhorDist = Infinity;
                caminhos.forEach((cam, ci) => {
                    if (!cam.pontos || cam.pontos.length < 2) return;
                    const xs = cam.pontos.map(p=>p.x), ys = cam.pontos.map(p=>p.y);
                    const cx = xs.reduce((a,b)=>a+b,0)/xs.length;
                    const cy = ys.reduce((a,b)=>a+b,0)/ys.length;
                    const d = Math.hypot(x-cx, y-cy);
                    let dSeg = Infinity;
                    for (let i=0;i<cam.pontos.length-1;i++) {
                        const a=cam.pontos[i],b=cam.pontos[i+1];
                        const ddx=b.x-a.x,ddy=b.y-a.y,lq=ddx*ddx+ddy*ddy;
                        let t=lq>0?((x-a.x)*ddx+(y-a.y)*ddy)/lq:0;
                        t=Math.max(0,Math.min(1,t));
                        dSeg=Math.min(dSeg,Math.hypot(x-(a.x+t*ddx),y-(a.y+t*ddy)));
                    }
                    const dist = Math.min(d, dSeg);
                    if (dist < melhorDist) { melhorDist = dist; melhorIdx = ci; }
                });
                if (melhorIdx >= 0 && melhorDist < 60/scale) { _editarCaminho(melhorIdx); }
            }
            return;
        }
        if (modoPen) {
            _penPontosCriados = 0; _penUndoIdx = -1;
            noArrastado=null;
            for(let i=0;i<pontosPen.length;i++){if(Math.hypot(pontosPen[i].x-x,pontosPen[i].y-y)<30/scale){noArrastado=i;break;}}
            if(noArrastado===null&&pontosPen.length>=2){const limiar=20/scale;let mD=Infinity,mI=-1;for(let i=0;i<pontosPen.length-1;i++){const a=pontosPen[i],b=pontosPen[i+1];const ddx=b.x-a.x,ddy=b.y-a.y,lq=ddx*ddx+ddy*ddy;let t=lq>0?((x-a.x)*ddx+(y-a.y)*ddy)/lq:0;t=Math.max(0,Math.min(1,t));const dd=Math.hypot(x-(a.x+t*ddx),y-(a.y+t*ddy));if(dd<limiar&&dd<mD){mD=dd;mI=i;}}if(mI>=0){const a=pontosPen[mI],b=pontosPen[mI+1];pontosPen.splice(mI+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2,tipo:'curva'});noArrastado=mI+1;isNewPoint=true;_penPontosCriados=1;_penUndoIdx=mI+1;}}
            if(noArrastado===null){const snapped=aplicarSnap(x,y);pontosPen.push({x:snapped.x,y:snapped.y,tipo:'ancora'});noArrastado=pontosPen.length-1;isNewPoint=true;_penPontosCriados=1;_penUndoIdx=pontosPen.length-1;}
            renderizarPen();
        }
    }, {passive: false});

    function _aplicarRotacao(angleDeg) {
        if (selecaoCaminhoInfo) {
            const cam = camadas[selecaoCaminhoInfo.camadaIdx];
            const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
            if (!c._origPontos) c._origPontos = c.pontos.map(p=>({...p}));
            const xs0=c._origPontos.map(p=>p.x), ys0=c._origPontos.map(p=>p.y);
            const ocx=(Math.min(...xs0)+Math.max(...xs0))/2;
            const ocy=(Math.min(...ys0)+Math.max(...ys0))/2;
            const rad = (angleDeg - _selRotOrigAngle) * Math.PI / 180;
            const cos = Math.cos(rad), sin = Math.sin(rad);
            c.pontos = c._origPontos.map(p => {
                const dx = p.x - ocx, dy = p.y - ocy;
                return {...p, x: ocx + dx*cos - dy*sin, y: ocy + dx*sin + dy*cos};
            });
            renderizarTodos();
            const xs=c.pontos.map(p=>p.x), ys=c.pontos.map(p=>p.y);
            const minX=Math.min(...xs), maxX=Math.max(...xs);
            const minY=Math.min(...ys), maxY=Math.max(...ys);
            desenharHandlesSelecao(null, {x:minX, y:minY, width:maxX-minX, height:maxY-minY});
        } else if (_selRealEl && _selBBox) {
            const cx = _selBBox.x + _selBBox.w/2 + selecaoTransX;
            const cy = _selBBox.y + _selBBox.h/2 + selecaoTransY;
            _selRealEl.setAttribute('transform',
                `translate(${cx},${cy}) rotate(${angleDeg}) scale(${_selCurrentScale}) translate(${-(_selBBox.x+_selBBox.w/2)},${-(_selBBox.y+_selBBox.h/2)})`
            );
            const hw = (_selBBox.w * _selCurrentScale) / 2;
            const hh = (_selBBox.h * _selCurrentScale) / 2;
            desenharHandlesSelecao(_selRealEl, {x: cx-hw, y: cy-hh, width: hw*2, height: hh*2});
        }
    }

    function _aplicarResize(fator) {
        _selCurrentScale = fator;
        const {x:bx, y:by, w:bw, h:bh} = _selBBox;
        if (selecaoCaminhoInfo) {
            const cam = camadas[selecaoCaminhoInfo.camadaIdx];
            const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
            const xs0=c._origPontos.map(p=>p.x), ys0=c._origPontos.map(p=>p.y);
            const ocx=(Math.min(...xs0)+Math.max(...xs0))/2;
            const ocy=(Math.min(...ys0)+Math.max(...ys0))/2;
            c.pontos = c._origPontos.map(p => ({
                ...p,
                x: ocx + (p.x - ocx) * fator,
                y: ocy + (p.y - ocy) * fator
            }));
            renderizarTodos();
            const xs=c.pontos.map(p=>p.x), ys=c.pontos.map(p=>p.y);
            const minX=Math.min(...xs), maxX=Math.max(...xs);
            const minY=Math.min(...ys), maxY=Math.max(...ys);
            desenharHandlesSelecao(null, {x:minX,y:minY,width:maxX-minX,height:maxY-minY});
        } else if (_selRealEl) {
            const cx = bx + bw/2 + selecaoTransX;
            const cy = by + bh/2 + selecaoTransY;
            _selRealEl.setAttribute('transform',
                `translate(${cx},${cy}) scale(${fator}) translate(${-(bx+bw/2)},${-(by+bh/2)})`);
            desenharHandlesSelecao(_selRealEl, {
                x: cx-(bw/2)*fator, y: cy-(bh/2)*fator,
                width: bw*fator, height: bh*fator
            });
        }
              }
vp.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length >= 2 && pinching) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const d  = Math.hypot(t0.clientX-t1.clientX, t0.clientY-t1.clientY);
        const cx = (t0.clientX + t1.clientX) / 2;
        const cy = (t0.clientY + t1.clientY) / 2;

        const novaEscala = Math.min(Math.max(pinchScaleIni * (d / pinchDistIni), 0.05), 8);

        const anguloAtual = Math.atan2(t1.clientY-t0.clientY, t1.clientX-t0.clientX);
        const deltaAngulo = (anguloAtual - pinchAnguloIni) * (180 / Math.PI);
        let novaRotacao = pinchRotacaoIni + deltaAngulo;

        const arredondado = Math.round(novaRotacao / 90) * 90;
        if (Math.abs(novaRotacao - arredondado) < 8) novaRotacao = arredondado;

        const rIni = pinchRotacaoIni * Math.PI / 180;
        const dx0 = pinchCxIni - pinchPosXIni, dy0 = pinchCyIni - pinchPosYIni;
        const ancX = ( dx0 * Math.cos(-rIni) - dy0 * Math.sin(-rIni)) / pinchScaleIni;
        const ancY = ( dx0 * Math.sin(-rIni) + dy0 * Math.cos(-rIni)) / pinchScaleIni;

        const rNov = novaRotacao * Math.PI / 180;
        scale   = novaEscala;
        rotacao = novaRotacao;
        posX    = cx - (ancX * novaEscala * Math.cos(rNov) - ancY * novaEscala * Math.sin(rNov));
        posY    = cy - (ancX * novaEscala * Math.sin(rNov) + ancY * novaEscala * Math.cos(rNov));

        const posXantes = posX, posYantes = posY;
        _clampPos();
        if (posX !== posXantes || posY !== posYantes) {
            pinchPosXIni = posX;
            pinchPosYIni = posY;
            pinchCxIni   = cx;
            pinchCyIni   = cy;
            pinchScaleIni = scale;
        }

        update();
        _atualizarIndicadorRotacao();
        return;
    }

    if (_dgBolhaDrag && _dgAjuste) {
        const {x: cx, y: cy} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
        if (_dgBolhaDrag === 'a') { _dgAjuste.x1=cx; _dgAjuste.y1=cy; }
        else                      { _dgAjuste.x2=cx; _dgAjuste.y2=cy; }
        _reconstruirDegrade();
        _atualizarBolinhasDegrade();
        return;
    }

    if (_txtDrag) {
        const {x: tx, y: ty} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
        const nx = tx - _txtDrag.offX;
        const ny = ty - _txtDrag.offY;
        _txtDrag.el.setAttribute('x', nx);
        _txtDrag.el.setAttribute('y', ny);
        _txtDrag.moved = true;
        const degId = _txtDrag.el.getAttribute('data-deg-id');
        if (degId) {
            const grad = document.getElementById(degId);
            if (grad) {
                const tam2 = parseFloat(_txtDrag.el.getAttribute('font-size')||32);
                if (grad.tagName === 'linearGradient') {
                    grad.setAttribute('x1', nx - tam2*2); grad.setAttribute('y1', ny);
                    grad.setAttribute('x2', nx + tam2*2); grad.setAttribute('y2', ny);
                } else {
                    grad.setAttribute('cx', nx); grad.setAttribute('cy', ny);
                    grad.setAttribute('fx', nx); grad.setAttribute('fy', ny);
                }
            }
        }
        document.getElementById('btn-editar-texto').style.display = 'none';
        return;
    }

    if (!isDragging) return;
    const ddx = e.touches[0].clientX-tapStartX, ddy = e.touches[0].clientY-tapStartY;
    if (Math.hypot(ddx,ddy) > 10) hasMovedTap = true;
    const {x, y} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);

    if (modoLivre)  { continuarPincel(x,y); return; }
    if (modoDegrade && degradeStart) {
        atualizarPreviewDegradeLayer(degradeStart.x,degradeStart.y,x,y);
        const {x: _sx1Live, y: _sy1Live} = canvasParaClient(degradeStart.x, degradeStart.y);
        const {x: _sx2Live, y: _sy2Live} = canvasParaClient(x, y);
        const bALive = document.getElementById('dg-bolinha-a');
        const bBLive = document.getElementById('dg-bolinha-b');
        const coresDgLive = getDegradeCores();
        bALive.style.background = coresDgLive[0] || '#03dac6';
        bALive.style.boxShadow  = `0 0 0 2px ${coresDgLive[0]||'#03dac6'},0 3px 10px rgba(0,0,0,0.6)`;
        bBLive.style.background = coresDgLive[coresDgLive.length-1] || '#ff00ff';
        bBLive.style.boxShadow  = `0 0 0 2px ${coresDgLive[coresDgLive.length-1]||'#ff00ff'},0 3px 10px rgba(0,0,0,0.6)`;
        bALive.style.left = (_sx1Live - 26)+'px'; bALive.style.top = (_sy1Live - 26)+'px'; bALive.style.display='flex';
        bBLive.style.left = (_sx2Live - 26)+'px'; bBLive.style.top = (_sy2Live - 26)+'px'; bBLive.style.display='flex';
        document.getElementById('btn-confirmar-degrade').style.display='block';
        return;
    }

    if (modoSelecao && selecaoEl && hasMovedTap && !_selResizing && !_selRotating) {
        const dx=x-selecaoOffX, dy=y-selecaoOffY;
        if (selecaoCaminhoInfo) {
            const cam = camadas[selecaoCaminhoInfo.camadaIdx];
            const c = cam.caminhos[selecaoCaminhoInfo.caminhoIdx];
            c.pontos.forEach(p => { p.x+=dx; p.y+=dy; });
            if (c._origPontos) c._origPontos.forEach(p => { p.x+=dx; p.y+=dy; });
            renderizarTodos();
            const xs=c.pontos.map(p=>p.x), ys=c.pontos.map(p=>p.y);
            const minX=Math.min(...xs), maxX=Math.max(...xs);
            const minY=Math.min(...ys), maxY=Math.max(...ys);
            desenharHandlesSelecao(null, {x:minX,y:minY,width:maxX-minX,height:maxY-minY});
            selecaoEl = document.getElementById('selecao-layer').querySelector('rect');
        } else if (_selRealEl) {
            selecaoTransX+=dx; selecaoTransY+=dy;
            const cur = _selRealEl.getAttribute('transform')||'';
            const hasScale = cur.includes('scale(');
            if (hasScale) {
                const bx2 = _selBBox ? _selBBox.x+_selBBox.w/2 : 0;
                const by2 = _selBBox ? _selBBox.y+_selBBox.h/2 : 0;
                const bw2 = _selBBox ? _selBBox.w : 0;
                const bh2 = _selBBox ? _selBBox.h : 0;
                _selRealEl.setAttribute('transform',
                    `translate(${bx2+dx},${by2+dy}) scale(${_selCurrentScale}) translate(${-bx2},${-by2})`);
            } else {
                _selRealEl.setAttribute('transform',`translate(${selecaoTransX},${selecaoTransY})`);
            }
            desenharHandlesSelecao(_selRealEl);
        }
        selecaoOffX=x; selecaoOffY=y; return;
    }
    if (modoContaGotas) { const cur=document.getElementById('conta-gotas-cursor'); cur.style.left=e.touches[0].clientX+'px'; cur.style.top=e.touches[0].clientY+'px'; return; }
    if (modoFormas && formaStart) { atualizarPreviewForma(x,y); }
    if (modoBorracha) return;
    if ((modoPen||modoEditar) && noArrastado!==null && hasMovedTap && !pinching) {
            mostrarLupa(e.touches[0].clientX, e.touches[0].clientY);
        const {x: px2, y: py2} = clientParaCanvas(e.touches[0].clientX, e.touches[0].clientY);
        pontosPen[noArrastado].x = px2;
        pontosPen[noArrastado].y = py2;
        renderizarPen();
    } else if (!modoPen&&!modoEditar&&!modoFormas&&!modoLivre&&!modoBorracha&&!modoDegrade&&!modoContaGotas) {
        if (hasMovedTap&&!folhaTravada) {
            posX += e.touches[0].clientX - lastX;
            posY += e.touches[0].clientY - lastY;
            _clampPos();
            update();
        }
    }
    lastX=e.touches[0].clientX; lastY=e.touches[0].clientY;
}, {passive: false});

vp.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) pinching = false;

    if (_txtDrag) {
        if (!_txtDrag.moved) {
            const elT = _txtDrag.el;
            try {
                const bb = elT.getBBox();
                const rad = rotacao * Math.PI / 180;
                const cos = Math.cos(rad), sin = Math.sin(rad);
                const cx = bb.x + bb.width/2, cy = bb.y + bb.height/2;
                const screenX = posX + (cx * cos - cy * sin) * scale;
                const screenY = posY + (cx * sin + cy * cos) * scale;
                const btnEl = document.getElementById('btn-editar-texto');
                btnEl.style.left = '8px';
                btnEl.style.top  = Math.max(60, Math.min(screenY - 19, window.innerHeight - 100)) + 'px';
                btnEl.style.display = 'flex';
            } catch(e2) {}
        } else {
            salvarHistorico();
            document.getElementById('btn-editar-texto').style.display = 'none';
            _textoEditando = null;
        }
        _txtDrag = null;
        return;
    }

    if (_dgBolhaDrag) { _dgBolhaDrag = null; return; }

    if ((modoPen||modoEditar) && noArrastado!==null) {
        if (hasMovedTap) {
            const p=pontosPen[noArrastado],ultimo=pontosPen.length-1; let tratado=false;
            for(let i=0;i<pontosPen.length;i++){
                if(i===noArrastado) continue;
                if(Math.hypot(pontosPen[i].x-p.x,pontosPen[i].y-p.y)<40/scale){
                    const eInicio=(noArrastado===0&&i===ultimo)||(noArrastado===ultimo&&i===0);
                    if(!pathFechado&&eInicio&&pontosPen.length>=3){pathFechado=true;document.getElementById('btnFechar').style.background='#03dac6';}
                    else{pontosPen.splice(noArrastado,1);if(pontosPen.length<3){pathFechado=false;document.getElementById('btnFechar').style.background='#333';}}
                    renderizarPen();tratado=true;break;
                }
            }
            if(tratado){isDragging=false;noArrastado=null;isNewPoint=false;return;}
        } else if(!isNewPoint&&!hasMovedTap){
            pontosPen[noArrastado].tipo=pontosPen[noArrastado].tipo==='ancora'?'curva':'ancora';
            renderizarPen();
        }
    }
    if (modoLivre)    { finalizarPincel(); if(modoEspelho&&pincelGrupoAtual) aplicarEspelho(pincelGrupoAtual); return; }
    if (modoBorracha) { isDragging=false; return; }
    if (modoContaGotas && !hasMovedTap) {
        capturarCor(e.changedTouches[0].clientX, e.changedTouches[0].clientY); return;
    }
    if (modoDegrade && degradeStart) {
        const {x: x2, y: y2} = clientParaCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        const dist=Math.hypot(x2-degradeStart.x,y2-degradeStart.y);
        if(dist>5){
            salvarHistorico();
            let el;
            if(degradeTipo==='linear'){el=criarDegradeLinear(degradeStart.x,degradeStart.y,x2,y2,degradeFill);}
            else{el=criarDegradeRadialSVG(degradeStart.x,degradeStart.y,dist,degradeFill);}
            let refNode = null;
            for (const child of livreLayer.children) {
                if (child.tagName.toLowerCase() !== 'defs') { refNode = child; break; }
            }
            if (refNode) livreLayer.insertBefore(el, refNode);
            else livreLayer.appendChild(el);
            _dgAjuste = {
                el: el,
                x1: degradeStart.x, y1: degradeStart.y,
                x2: x2, y2: y2,
                tipo: degradeTipo, fill: degradeFill
            };
            _atualizarBolinhasDegrade();
            document.getElementById('btn-confirmar-degrade').style.display='block';
        }
        document.getElementById('degrade-preview-layer').innerHTML='';
        document.getElementById('dg-bolinha-a').style.display = _dgAjuste ? 'flex' : 'none';
        document.getElementById('dg-bolinha-b').style.display = _dgAjuste ? 'flex' : 'none';
        degradeStart=null; isDragging=false; noArrastado=null; isNewPoint=false; return;
    }
    if (modoFormas && formaStart) {
        const {x: x2, y: y2} = clientParaCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if(Math.hypot(x2-formaStart.x,y2-formaStart.y)>5) desenharForma(formaStart.x,formaStart.y,x2,y2);
        formaStart=null;
    }
    isDragging=false; noArrastado=null; isNewPoint=false; _penPontosCriados=0; _penUndoIdx=-1;
    esconderLupa();
}, {passive: false});

window.togglePenMode = () => {
    if (modoPen) {
        modoPen = false;
        ferramentaAtiva = '';
        if (pontosPen.length >= 2) salvarCaminhoAtivo();
        else if (caminhoAtivo >= 0) getCaminhos().splice(caminhoAtivo, 1);
        caminhoAtivo = -1; pontosPen = []; pathFechado = false;
        penLayer.innerHTML = '';
        renderizarTodos();
        const _ficEl = document.getElementById('ferr-icon');
        const _flbEl = document.getElementById('ferr-label');
        if (_ficEl) _ficEl.textContent = '🖊';
        if (_flbEl) _flbEl.textContent = 'PEN';
        document.getElementById('fBtn-pen').style.background = '#333';
        document.getElementById('menu-ferramentas').style.display = 'none';
        menuFerraberto = false;
    } else {
        selecionarFerramenta('pen');
    }
};

window.toggleEditarMode = () => {
    if (modoPen || modoLivre || modoBorracha) {
        modoPen = false; modoLivre = false; modoBorracha = false;
        const bFerr = document.getElementById('btnFerramentas');
        if (bFerr) { bFerr.textContent = '🖊 PEN ▾'; bFerr.style.background = '#ff00ff'; }
        if (pontosPen.length >= 2) salvarCaminhoAtivo();
        else if (caminhoAtivo >= 0) getCaminhos().splice(caminhoAtivo, 1);
        caminhoAtivo = -1; pontosPen = []; pathFechado = false;
        penLayer.innerHTML = '';
        renderizarTodos();
    }
    modoEditar = !modoEditar;
    document.getElementById('btnEditar').style.background = modoEditar ? '#ffaa00' : '#333';
    if (modoEditar) {
        const caminhos = getCaminhos();
        if (caminhos.length === 0) {
            mostrarNotificacao('⚠️ Nenhum caminho na camada ativa');
            modoEditar = false;
            document.getElementById('btnEditar').style.background = '#333';
            return;
        }
        if (caminhos.length === 1) {
            _editarCaminho(0);
        } else {
            mostrarDicaEditar(true);
            _renderizarTodosEditaveis();
        }
    } else {
        mostrarDicaEditar(false);
        encerrarEdicao();
    }
};

function _renderizarTodosEditaveis() {
    penLayer.innerHTML = '';
    const caminhos = getCaminhos();
    caminhos.forEach((cam, ci) => {
        if (!cam.pontos || cam.pontos.length < 2) return;
        const d = buildPathD(cam.pontos, cam.fechado);
        const sel = document.createElementNS(NS, 'path');
        sel.setAttribute('d', d);
        sel.setAttribute('fill', 'none');
        sel.setAttribute('stroke', '#ffaa00');
        sel.setAttribute('stroke-width', 8/scale);
        sel.setAttribute('stroke-opacity', '0.4');
        sel.setAttribute('stroke-linecap', 'round');
        penLayer.appendChild(sel);
        const xs = cam.pontos.map(p=>p.x), ys = cam.pontos.map(p=>p.y);
        const cx = xs.reduce((a,b)=>a+b,0)/xs.length;
        const cy = ys.reduce((a,b)=>a+b,0)/ys.length;
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
        dot.setAttribute('r', 16/scale);
        dot.setAttribute('fill', '#ffaa00');
        dot.setAttribute('stroke', 'white');
        dot.setAttribute('stroke-width', 2/scale);
        penLayer.appendChild(dot);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', cx); txt.setAttribute('y', cy);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('fill', '#000');
        txt.setAttribute('font-size', 12/scale);
        txt.setAttribute('font-weight', 'bold');
        txt.textContent = ci + 1;
        penLayer.appendChild(txt);
    });
}

function _editarCaminho(idx) {
    const caminhos = getCaminhos();
    const cam = caminhos[idx];
    if (!cam) return;
    mostrarDicaEditar(false);
    encerrarEdicao();
    caminhoAtivo = idx;
    pontosPen = cam.pontos.map(p => ({...p}));
    pathFechado = cam.fechado;
    document.getElementById('col-main').value = cam.stroke || '#000000';
    document.getElementById('brush-size').value = cam.width || 2;
    document.getElementById('brush-opacity').value = cam.opacity ?? 1;
    if (document.getElementById('pincel-tipo')) document.getElementById('pincel-tipo').value = cam.tipo || 'normal';
    document.getElementById('btnFechar').style.background = pathFechado ? '#03dac6' : '#333';
    renderizarTodos();
    renderizarPen();
    mostrarNotificacao('✏️ Arraste os pontos para editar');
    }
