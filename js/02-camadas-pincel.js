// ── SISTEMA DE CAMADAS ────────────────────────────────────────────────────
    let camadaFoto = { opacidade: 1, visivel: true, svgHTML: '' };
    let fotoOrdem = -1;
    let camadas    = [];
    let camadaAtiva = 0;
    let idCounter   = 1;

    function criarCamada(nome) {
        return { id: idCounter++, nome: nome || `Camada ${idCounter-1}`,
                 opacidade: 1, visivel: true, caminhos: [], livreHTML: '' };
    }

    camadas.push(criarCamada('Camada 1'));

    function getCaminhos() { return camadas[camadaAtiva].caminhos; }

    function desativarTodos() {
        modoPen = false; modoEditar = false; modoLivre = false;
        modoBorracha = false; modoFormas = false;
        if (modoDegrade) desativarDegrade();
        document.getElementById('btnFerramentas').style.background = '#ff00ff';
        document.getElementById('btnEditar').style.background      = '#333';
        document.getElementById('btnFormas').style.background      = '#333';
        document.getElementById('modal-formas').style.display      = 'none';
        document.getElementById('menu-ferramentas').style.display  = 'none';
        menuFerraberto  = false;
        ferramentaAtiva = 'pen';
        mostrarDicaEditar(false);
    }

    window.toggleLivre    = () => {
        if (modoLivre) {
            modoLivre = false; ferramentaAtiva = '';
            document.getElementById('fBtn-livre').style.background = '#333';
            const _ficEl = document.getElementById('ferr-icon');
            const _flbEl = document.getElementById('ferr-label');
            if (_ficEl) _ficEl.textContent = '🖊';
            if (_flbEl) _flbEl.textContent = 'PEN';
            document.getElementById('menu-ferramentas').style.display = 'none';
            menuFerraberto = false;
        } else { selecionarFerramenta('livre'); }
    };
    window.toggleBorracha = () => {
        if (modoBorracha) {
            modoBorracha = false; ferramentaAtiva = '';
            pontosBorracha = []; borrachaLayer.innerHTML = '';
            document.getElementById('fBtn-borracha').style.background = '#333';
            const _ficEl = document.getElementById('ferr-icon');
            const _flbEl = document.getElementById('ferr-label');
            if (_ficEl) _ficEl.textContent = '🖊';
            if (_flbEl) _flbEl.textContent = 'PEN';
            document.getElementById('menu-ferramentas').style.display = 'none';
            menuFerraberto = false;
        } else { selecionarFerramenta('borracha'); }
    };

    window.toggleFormas = () => {
        const ativo = modoFormas;
        desativarTodos();
        if (!ativo) {
            modoFormas = true;
            document.getElementById('btnFormas').style.background = '#aa00ff';
            document.getElementById('modal-formas').style.display = 'flex';
        }
    };

    window.fecharFormas = () => {
        modoFormas = false;
        document.getElementById('btnFormas').style.background  = '#333';
        document.getElementById('modal-formas').style.display  = 'none';
    };

    window.selecionarForma = (f) => {
        formaAtual = f;
        ['circulo','retangulo','triangulo','linha'].forEach(n => {
            document.getElementById('fBtn-' + n).style.background =
                n === f ? '#03dac6' : '#333';
        });
    };

    function criarElementoForma(ns, x1, y1, x2, y2) {
        let el;
        if (formaAtual === 'circulo') {
            el = document.createElementNS(ns, 'ellipse');
            el.setAttribute('cx', (x1+x2)/2); el.setAttribute('cy', (y1+y2)/2);
            el.setAttribute('rx', Math.abs(x2-x1)/2); el.setAttribute('ry', Math.abs(y2-y1)/2);
        } else if (formaAtual === 'retangulo') {
            el = document.createElementNS(ns, 'rect');
            el.setAttribute('x', Math.min(x1,x2)); el.setAttribute('y', Math.min(y1,y2));
            el.setAttribute('width', Math.abs(x2-x1)); el.setAttribute('height', Math.abs(y2-y1));
        } else if (formaAtual === 'triangulo') {
            el = document.createElementNS(ns, 'polygon');
            el.setAttribute('points', `${(x1+x2)/2},${y1} ${x1},${y2} ${x2},${y2}`);
        } else if (formaAtual === 'linha') {
            el = document.createElementNS(ns, 'line');
            el.setAttribute('x1', x1); el.setAttribute('y1', y1);
            el.setAttribute('x2', x2); el.setAttribute('y2', y2);
        }
        return el;
    }

    function aplicarEstiloForma(el) {
        const cor = document.getElementById('col-main').value;
        const tam = document.getElementById('brush-size').value;
        const op  = document.getElementById('brush-opacity').value;
        el.setAttribute('stroke', cor);
        el.setAttribute('stroke-width', tam);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke-opacity', op);
        el.setAttribute('stroke-linecap', 'round');
    }

    function atualizarPreviewForma(x2, y2) {
        formaPreview.innerHTML = '';
        if (!formaStart) return;
        const ns = 'http://www.w3.org/2000/svg';
        const el = criarElementoForma(ns, formaStart.x, formaStart.y, x2, y2);
        if (!el) return;
        aplicarEstiloForma(el);
        el.setAttribute('stroke-dasharray', '8,4');
        formaPreview.appendChild(el);
    }

    function desenharForma(x1, y1, x2, y2) {
        formaPreview.innerHTML = '';
        const ns = 'http://www.w3.org/2000/svg';
        const el = criarElementoForma(ns, x1, y1, x2, y2);
        if (!el) return;
        aplicarEstiloForma(el);
        salvarHistorico();
        livreLayer.appendChild(el);
        if (camadas[camadaAtiva]) {
            camadas[camadaAtiva].livreHTML = livreLayer.innerHTML;
        }
    }
let pincelAtual = 'normal';
let menuPinceisAberto = false;
let pincelDesenhando = false;
let pincelUltX = null, pincelUltY = null;
let pincelGrupoAtual = null;
let pincelPathPrincipal = null;
let pincelPathD = '';
let pincelPontosAcum = [];

const NS = 'http://www.w3.org/2000/svg';
function mkEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}
function getCor()  { return document.getElementById('col-main').value; }
function getTam()  { return parseFloat(document.getElementById('brush-size').value); }
function getTamReal() { return getTam() / scale; }
function getOpac() { return parseFloat(document.getElementById('brush-opacity').value); }
function hexToRgb(hex) {
    return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}
function corMais(hex, d) {
    const {r,g,b} = hexToRgb(hex);
    const c = v => Math.min(255,Math.max(0,v+d)).toString(16).padStart(2,'0');
    return '#'+c(r)+c(g)+c(b);
}

function svgLine(x1,y1,x2,y2,cor,w,op,linecap,dash) {
    return mkEl('line',{x1,y1,x2,y2,stroke:cor,'stroke-width':w,
        'stroke-opacity':op??1,'stroke-linecap':linecap||'round',
        'stroke-dasharray':dash||'','fill':'none'});
}
function svgCircle(cx,cy,r,fill,op) {
    return mkEl('circle',{cx,cy,r,fill,opacity:op??1});
}
function svgPath(d,cor,w,op,linecap,dash,linejoin) {
    return mkEl('path',{d,stroke:cor,'stroke-width':w,'stroke-opacity':op??1,
        'stroke-linecap':linecap||'round','stroke-linejoin':linejoin||'round',
        'stroke-dasharray':dash||'','fill':'none'});
}

function pontosParaPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x} ${pts[0].y}`;
    const n = pts.length;
    const step = n > 200 ? Math.floor(n / 150) : 1;
    for (let i = step; i < n; i += (i < n - 2 ? step : 1)) {
        const prev = pts[Math.max(0, i - step)], curr = pts[i];
        if (i <= step) {
            d += ` L${curr.x} ${curr.y}`;
        } else {
            const prev2 = pts[Math.max(0, i - step * 2)];
            const next  = pts[Math.min(n - 1, i + step)];
            const cpx  = prev.x + (curr.x - prev2.x) / 6;
            const cpy  = prev.y + (curr.y - prev2.y) / 6;
            const cp2x = curr.x - (next.x - prev.x) / 6;
            const cp2y = curr.y - (next.y - prev.y) / 6;
            d += ` C${cpx} ${cpy} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
        }
    }
    const last = pts[n - 1];
    if (n > 1) d += ` L${last.x} ${last.y}`;
    return d;
}

function garantirFiltroBlur(id, desvio) {
    let defs = livreLayer.querySelector('defs');
    if (!defs) { defs = mkEl('defs',{}); livreLayer.prepend(defs); }
    if (!defs.querySelector('#'+id)) {
        const f = mkEl('filter',{id, x:'-30%', y:'-30%', width:'160%', height:'160%'});
        f.appendChild(mkEl('feGaussianBlur',{in:'SourceGraphic', stdDeviation:desvio}));
        defs.appendChild(f);
    }
}

const PINCEIS = {

    normal: {
        iniciar(x,y) {
            pincelPathD = `M${x} ${y}`;
            pincelPathPrincipal = svgPath(pincelPathD,getCor(),getTam(),getOpac(),'round');
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            pincelPathD = pontosParaPath(pincelPontosAcum);
            pincelPathPrincipal.setAttribute('d', pincelPathD);
        },
        finalizar() {}
    },

    marcador: {
        iniciar(x,y) {
            pincelPathD = `M${x} ${y}`;
            pincelPathPrincipal = svgPath(pincelPathD,getCor(),getTam()*1.8,1,'square','','miter');
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            pincelPathD = pontosParaPath(pincelPontosAcum);
            pincelPathPrincipal.setAttribute('d', pincelPathD);
        },
        finalizar() {}
    },

    tracejado: {
        iniciar(x,y) {
            const t = getTam();
            pincelPathD = `M${x} ${y}`;
            pincelPathPrincipal = svgPath(pincelPathD,getCor(),t,getOpac(),'round',`${t*2} ${t*1.5}`);
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            pincelPathD = pontosParaPath(pincelPontosAcum);
            pincelPathPrincipal.setAttribute('d', pincelPathD);
        },
        finalizar() {}
    },

    caligrafia: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y,px,py) {
            const t=getTam(), op=getOpac(), cor=getCor();
            const dx=x-px, dy=y-py;
            const ang = Math.atan2(dy,dx);
            const fator = Math.abs(Math.sin(ang - Math.PI/4));
            const esp = Math.max(0.5, t*0.25 + t*1.75*fator);
            pincelGrupoAtual.appendChild(svgLine(px,py,x,y,cor,esp,op,'round'));
            pincelPontosAcum.push({x,y});
        },
        finalizar() {}
    },

    aquarela: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
            const t=getTam(), cor=getCor();
            pincelGrupoAtual._camadas = Array.from({length:4}, (_,i) => {
                const ox=(Math.random()-0.5)*t*0.5, oy=(Math.random()-0.5)*t*0.5;
                const p = svgPath(`M${x+ox} ${y+oy}`, cor,
                    t*(0.6+Math.random()*1.0), 0.018+Math.random()*0.035, 'round');
                p._ox=ox; p._oy=oy;
                p._pts=[{x:x+ox,y:y+oy}];
                pincelGrupoAtual.appendChild(p);
                return p;
            });
            pincelGrupoAtual._centro = svgPath(`M${x} ${y}`,cor,t*0.12,0.04,'round');
            pincelGrupoAtual._centroPts = [{x,y}];
            pincelGrupoAtual.appendChild(pincelGrupoAtual._centro);
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            pincelGrupoAtual._camadas.forEach(p => {
                p._pts.push({x: x+p._ox, y: y+p._oy});
                p.setAttribute('d', pontosParaPath(p._pts));
            });
            pincelGrupoAtual._centroPts.push({x,y});
            pincelGrupoAtual._centro.setAttribute('d', pontosParaPath(pincelGrupoAtual._centroPts));
        },
        finalizar() {}
    },
    carvao: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual._elCount = 0;
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
            pincelPathPrincipal = svgPath(`M${x} ${y}`,getCor(),getTam(),getOpac()*0.45,'round');
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
        },
        continuar(x,y,px,py) {
            const t=getTam(), cor=getCor();
            pincelPontosAcum.push({x,y});
            pincelPathPrincipal.setAttribute('d', pontosParaPath(pincelPontosAcum));
            const dist = Math.hypot(x-px,y-py);
            if (dist > 4 && pincelGrupoAtual._elCount < 2000) {
                const n = Math.min(Math.floor(t * 0.4), 8);
                for (let j=0;j<n;j++) {
                    const ox=(Math.random()-0.5)*t*1.6, oy=(Math.random()-0.5)*t*1.6;
                    pincelGrupoAtual.appendChild(
                        svgCircle(x+ox,y+oy,Math.random()*1.0+0.2,cor,Math.random()*0.2));
                    pincelGrupoAtual._elCount++;
                }
            }
        },
        finalizar() {}
    },

    giz: {
        iniciar(x,y) {
            garantirFiltroBlur('giz-blur','0.9');
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual._elCount = 0;
            const gGlow = mkEl('g',{filter:'url(#giz-blur)', opacity:'0.7'});
            pincelPathPrincipal = svgPath(`M${x} ${y}`,getCor(),getTam()*1.8,0.18,'round');
            gGlow.appendChild(pincelPathPrincipal);
            const gGraos = mkEl('g',{});
            pincelGrupoAtual._gGlow = gGlow;
            pincelGrupoAtual._gGraos = gGraos;
            pincelGrupoAtual.appendChild(gGlow);
            pincelGrupoAtual.appendChild(gGraos);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y,px,py) {
            const t=getTam(), cor=getCor();
            pincelPontosAcum.push({x,y});
            pincelPathPrincipal.setAttribute('d', pontosParaPath(pincelPontosAcum));
            const dist = Math.hypot(x-px,y-py);
            if (dist > 5 && pincelGrupoAtual._elCount < 1500) {
                for (let j=0;j<2;j++) {
                    pincelGrupoAtual._gGraos.appendChild(
                        svgCircle(x+(Math.random()-0.5)*t*1.2, y+(Math.random()-0.5)*t*1.2,
                            Math.random()*1.2+0.3, cor, Math.random()*0.09));
                    pincelGrupoAtual._elCount++;
                }
            }
        },
        finalizar() {}
    },

    oleo: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            const t=getTam(), cor=getCor(), op=getOpac();
            pincelPathPrincipal = svgPath(`M${x} ${y}`,cor,t,op*0.9,'round');
            const hl = svgPath(`M${x} ${y}`,corMais(cor,70),t*0.28,op*0.2,'round');
            pincelGrupoAtual._hl = hl;
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
            pincelGrupoAtual.appendChild(hl);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            const d = pontosParaPath(pincelPontosAcum);
            pincelPathPrincipal.setAttribute('d',d);
            pincelGrupoAtual._hl.setAttribute('d',d);
        },
        finalizar() {}
    },

    neon: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            const cor=getCor(), t=getTam(), op=getOpac();
            const d = `M${x} ${y}`;
            const g1 = svgPath(d,cor,t*7,op*0.04,'round');
            const g2 = svgPath(d,cor,t*4,op*0.09,'round');
            const g3 = svgPath(d,cor,t*2,op*0.22,'round');
            const g4 = svgPath(d,cor,t*1,op*0.55,'round');
            const g5 = svgPath(d,corMais(cor,120),t*0.35,1,'round');
            pincelGrupoAtual._els = [g1,g2,g3,g4,g5];
            [g1,g2,g3,g4,g5].forEach(el => pincelGrupoAtual.appendChild(el));
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            const d = pontosParaPath(pincelPontosAcum);
            pincelGrupoAtual._els.forEach(el => el.setAttribute('d',d));
        },
        finalizar() {}
    },

    spray: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual._elCount = 0;
            livreLayer.appendChild(pincelGrupoAtual);
        },
        continuar(x,y,px,py) {
            const t=getTam(), op=getOpac(), cor=getCor();
            const dist = Math.hypot(x-px,y-py);
            if (pincelGrupoAtual._elCount > 3000) return;
            const steps = Math.max(1, Math.floor(dist/8));
            for (let s=0;s<steps;s++) {
                const tt=s/steps, bx=px+tt*(x-px), by=py+tt*(y-py);
                const qtd = Math.min(Math.floor(t*1.2), 20);
                for (let i=0;i<qtd;i++) {
                    const ang=Math.random()*Math.PI*2;
                    const rad=Math.random()*t*1.5;
                    const fade=1-rad/(t*1.5);
                    pincelGrupoAtual.appendChild(
                        svgCircle(bx+Math.cos(ang)*rad, by+Math.sin(ang)*rad,
                            Math.random()*1.0+0.2, cor, op*(0.08+Math.random()*0.3)*fade));
                    pincelGrupoAtual._elCount++;
                }
            }
        },
        finalizar() {}
    },

    pelo: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
            const t=getTam(), cor=getCor(), op=getOpac();
            const nFilos = Math.max(4, Math.floor(t/2));
            pincelGrupoAtual._filos = Array.from({length:nFilos}, (_,i) => {
                const frac = i/(nFilos-1);
                const offset = (frac-0.5)*t;
                const bordaFator = 1 - Math.abs(frac-0.5)*1.6;
                const espessura = Math.max(0.3, (0.3+Math.random()*0.8)*bordaFator);
                const opacidade = op * Math.max(0.1, (0.25+Math.random()*0.55)*bordaFator);
                const desvioX = (Math.random()-0.5)*t*0.15;
                const desvioY = (Math.random()-0.5)*t*0.15;
                const p = svgPath(`M${x} ${y}`, cor, espessura, opacidade, 'round');
                p._offset = offset;
                p._desvioX = desvioX;
                p._desvioY = desvioY;
                p._pts = [{x,y}];
                pincelGrupoAtual.appendChild(p);
                return p;
            });
        },
        continuar(x,y,px,py) {
            const dx=x-px, dy=y-py, len=Math.hypot(dx,dy)||1;
            const nx=-dy/len, ny=dx/len;
            pincelPontosAcum.push({x,y});
            pincelGrupoAtual._filos.forEach(filo => {
                const ox = nx*filo._offset + filo._desvioX;
                const oy = ny*filo._offset + filo._desvioY;
                const jx = (Math.random()-0.5)*0.8;
                const jy = (Math.random()-0.5)*0.8;
                filo._pts.push({x: x+ox+jx, y: y+oy+jy});
                filo.setAttribute('d', pontosParaPath(filo._pts));
            });
        },
        finalizar() {}
    },

    estrela: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPathPrincipal = svgPath(`M${x} ${y}`,getCor(),getTam()*0.2,getOpac()*0.2,'round');
            pincelGrupoAtual.appendChild(pincelPathPrincipal);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y,px,py) {
            const t=getTam(), op=getOpac(), cor=getCor();
            pincelPontosAcum.push({x,y});
            pincelPathPrincipal.setAttribute('d', pontosParaPath(pincelPontosAcum));
            const dist=Math.hypot(x-px,y-py);
            if (dist > 8 && Math.random()<0.4) {
                const sz=(0.5+Math.random()*1.2)*t*0.28;
                const bright=corMais(cor,90);
                const bx=x+(Math.random()-0.5)*t*0.6, by=y+(Math.random()-0.5)*t*0.6;
                for (let k=0;k<4;k++) {
                    const ang=k*Math.PI/4;
                    pincelGrupoAtual.appendChild(svgLine(
                        bx-Math.cos(ang)*sz,by-Math.sin(ang)*sz,
                        bx+Math.cos(ang)*sz,by+Math.sin(ang)*sz,
                        bright,0.6,op*(0.5+Math.random()*0.5),'round'));
                }
            }
        },
        finalizar() {}
    },

    lasso: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            const cor=getCor(), op=getOpac();
            const fill = mkEl('path',{
                d:`M${x} ${y}`, fill:cor,
                'fill-opacity': op, stroke:'none'
            });
            const contorno = mkEl('path',{
                d:`M${x} ${y}`, fill:'none',
                stroke:cor, 'stroke-width': 1/scale,
                'stroke-opacity':0.5,
                'stroke-dasharray':`${4/scale} ${3/scale}`,
                'stroke-linecap':'round'
            });
            pincelGrupoAtual._fill = fill;
            pincelGrupoAtual._contorno = contorno;
            pincelGrupoAtual.appendChild(fill);
            pincelGrupoAtual.appendChild(contorno);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y) {
            pincelPontosAcum.push({x,y});
            const d = pontosParaPath(pincelPontosAcum) + ' Z';
            pincelGrupoAtual._fill.setAttribute('d', d);
            pincelGrupoAtual._contorno.setAttribute('d', d);
        },
        finalizar() {
            if (pincelGrupoAtual && pincelGrupoAtual._contorno)
                pincelGrupoAtual._contorno.remove();
        }
    },

    pontilhismo: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
            pincelGrupoAtual.appendChild(svgCircle(x,y,getTam()*0.48,getCor(),getOpac()));
        },
        continuar(x,y,px,py) {
            const t=getTam(), op=getOpac(), cor=getCor();
            const dist=Math.hypot(x-px,y-py);
            if (dist >= t*0.9) {
                pincelGrupoAtual.appendChild(svgCircle(x,y,t*0.48,cor,op*(0.6+Math.random()*0.4)));
                pincelPontosAcum.push({x,y});
            }
        },
        finalizar() {}
    },

    risco: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            pincelGrupoAtual._elCount = 0;
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y,px,py) {
            const t=getTam(), op=getOpac(), cor=getCor();
            const dist=Math.hypot(x-px,y-py);
            if (dist > 4 && pincelGrupoAtual._elCount < 2000) {
                const n=Math.min(Math.max(2,Math.floor(t/3)), 10);
                for (let i=0;i<n;i++) {
                    const ox=(Math.random()-0.5)*t, oy=(Math.random()-0.5)*t;
                    pincelGrupoAtual.appendChild(svgLine(
                        px+ox,py+oy,x+ox,y+oy,
                        cor,0.4+Math.random()*0.8,op*(0.12+Math.random()*0.3),'round'));
                    pincelGrupoAtual._elCount++;
                }
                pincelPontosAcum.push({x,y});
            }
        },
        finalizar() {}
    },

    duplo: {
        iniciar(x,y) {
            pincelGrupoAtual = mkEl('g',{});
            const t=getTam(), cor=getCor(), op=getOpac();
            const l1 = svgPath(`M${x} ${y}`,cor,Math.max(0.5,t*0.35),op,'round');
            const l2 = svgPath(`M${x} ${y}`,cor,Math.max(0.5,t*0.35),op,'round');
            pincelGrupoAtual._l1=l1; pincelGrupoAtual._l2=l2;
            pincelGrupoAtual._d1=`M${x} ${y}`; pincelGrupoAtual._d2=`M${x} ${y}`;
            pincelGrupoAtual.appendChild(l1); pincelGrupoAtual.appendChild(l2);
            livreLayer.appendChild(pincelGrupoAtual);
            pincelPontosAcum = [{x,y}];
        },
        continuar(x,y,px,py) {
            const t=getTam();
            const dx=x-px, dy=y-py, len=Math.hypot(dx,dy)||1;
            const nx=-dy/len*t*0.65, ny=dx/len*t*0.65;
            pincelGrupoAtual._d1+=` L${x+nx} ${y+ny}`;
            pincelGrupoAtual._d2+=` L${x-nx} ${y-ny}`;
            pincelGrupoAtual._l1.setAttribute('d',pincelGrupoAtual._d1);
            pincelGrupoAtual._l2.setAttribute('d',pincelGrupoAtual._d2);
            pincelPontosAcum.push({x,y});
        },
        finalizar() {}
    },
};

function iniciarPincel(x,y) {
    pincelDesenhando=true;
    pincelUltX=x; pincelUltY=y;
    pincelPathD=''; pincelPathPrincipal=null; pincelGrupoAtual=null;
    const p=PINCEIS[pincelAtual]||PINCEIS.normal;
    p.iniciar(x,y);
}

let _pincelRAFPendente = false;
let _pincelPendX = 0, _pincelPendY = 0;
const PINCEL_MIN_DIST = 2;

function continuarPincel(x,y) {
    if (!pincelDesenhando) return;
    const dxMin = x - pincelUltX, dyMin = y - pincelUltY;
    if (Math.hypot(dxMin, dyMin) < PINCEL_MIN_DIST) return;
    _pincelPendX = x; _pincelPendY = y;
    if (_pincelRAFPendente) return;
    _pincelRAFPendente = true;
    requestAnimationFrame(() => {
        _pincelRAFPendente = false;
        if (!pincelDesenhando) return;
        const px = pincelUltX, py = pincelUltY;
        const p = PINCEIS[pincelAtual] || PINCEIS.normal;
        p.continuar(_pincelPendX, _pincelPendY, px, py);
        pincelUltX = _pincelPendX; pincelUltY = _pincelPendY;
    });
}

function finalizarPincel() {
    if (!pincelDesenhando) return;
    _pincelRAFPendente = false;
    const p=PINCEIS[pincelAtual]||PINCEIS.normal;
    if (_pincelPendX !== pincelUltX || _pincelPendY !== pincelUltY) {
        p.continuar(_pincelPendX, _pincelPendY, pincelUltX, pincelUltY);
        pincelUltX = _pincelPendX; pincelUltY = _pincelPendY;
    }
    p.finalizar();
    pincelDesenhando=false;
    const temMovimento = pincelPontosAcum && pincelPontosAcum.length > 1;
    if (pincelGrupoAtual && camadas[camadaAtiva] && temMovimento) {
        camadas[camadaAtiva].livreHTML = (camadas[camadaAtiva].livreHTML||'') + pincelGrupoAtual.outerHTML;
    } else if (pincelGrupoAtual && !temMovimento) {
        pincelGrupoAtual.remove();
    }
    pincelGrupoAtual=null; pincelPathPrincipal=null;
    if (temMovimento) salvarHistorico();
}

function desenharPreviews(lista) {
    const todos=['normal','marcador','tracejado','caligrafia','aquarela','carvao','giz','oleo','neon','spray','pelo','estrela','lasso','pontilhismo','risco','duplo'];
    (lista||todos).forEach(id=>{
        const c=document.getElementById('prev-'+id);
        if(!c) return;
        c.width=48; c.height=14;
        const ctx=c.getContext('2d');
        ctx.clearRect(0,0,48,14);
        ctx.fillStyle='#1e1e1e'; ctx.fillRect(0,0,48,14);
        const svg=document.createElementNS(NS,'svg');
        svg.setAttribute('width','48'); svg.setAttribute('height','14');
        svg.setAttribute('xmlns',NS);
        const defs=mkEl('defs',{});
        const f=mkEl('filter',{id:'neon-glow'});
        const fb=mkEl('feGaussianBlur',{stdDeviation:'2',result:'blur'});
        const fm=mkEl('feMerge',{});
        const fn1=mkEl('feMergeNode',{in:'blur'});
        const fn2=mkEl('feMergeNode',{in:'SourceGraphic'});
        fm.appendChild(fn1); fm.appendChild(fn2);
        f.appendChild(fb); f.appendChild(fm);
        defs.appendChild(f); svg.appendChild(defs);
        const corOrig=getCor(), tamOrig=getTam(), opOrig=getOpac();
        document.getElementById('col-main').value='#03dac6';
        document.getElementById('brush-size').value=3;
        document.getElementById('brush-opacity').value=1;
        const p=PINCEIS[id]||PINCEIS.normal;
        const origLivre=livreLayer;
        const origAppend=livreLayer.appendChild.bind(livreLayer);
        const addedEls=[];
        livreLayer.appendChild=el=>{addedEls.push(el); svg.appendChild(el);};
        livreLayer.querySelector=()=>null;
        livreLayer.prepend=()=>{};
        pincelGrupoAtual=null; pincelPathPrincipal=null; pincelPathD='';
        p.iniciar(4,7);
        for (let xi=6;xi<=44;xi+=3) p.continuar(xi,7,xi-3,7);
        p.finalizar();
        livreLayer.appendChild=origAppend;
        livreLayer.querySelector=origLivre.querySelector.bind(origLivre);
        livreLayer.prepend=origLivre.prepend.bind(origLivre);
        pincelGrupoAtual=null; pincelPathPrincipal=null; pincelPathD='';
        const svgStr=new XMLSerializer().serializeToString(svg);
        const blob=new Blob([svgStr],{type:'image/svg+xml'});
        const url=URL.createObjectURL(blob);
        const img=new Image();
        img.onload=()=>{ctx.drawImage(img,0,0,48,14); URL.revokeObjectURL(url);};
        img.src=url;
        document.getElementById('col-main').value=corOrig;
        document.getElementById('brush-size').value=tamOrig;
        document.getElementById('brush-opacity').value=opOrig;
    });
}

window.toggleMenuPinceis = () => {
    togglePopup('popup-pinceis-wrap');
    if (document.getElementById('popup-pinceis-wrap').classList.contains('aberto')) {
        trocarAba('basico');
    }
};

window.fecharMenuPinceis=()=>{
    fecharTodosPopups();
};

window.trocarAba=(aba)=>{
    ['basico','artistico','especial','textura'].forEach(g=>{
        document.getElementById('grupo-'+g).style.display=g===aba?'flex':'none';
        document.getElementById('aba-'+g).classList.toggle('ativa',g===aba);
    });
    const grupos={
        basico:['normal','marcador','tracejado'],
        artistico:['caligrafia','aquarela','carvao','giz','oleo'],
        especial:['neon','spray','pelo','estrela','lasso'],
        textura:['pontilhismo','risco','duplo']
    };
    desenharPreviews(grupos[aba]||[]);
};

window.selecionarPincel=(id,el)=>{
    document.querySelectorAll('#menu-pinceis .pincel-btn').forEach(b=>b.classList.remove('ativo'));
    if(el) el.classList.add('ativo');
    pincelAtual=id;
    fecharMenuPinceis();
};
