// ═══════════════════════════════════════════════════════════════════════
// LAZY LIBS — carrega bibliotecas pesadas só quando realmente necessárias.
// OpenCV.js (~8MB) e jsPDF não são carregados no início: isso evita travar
// o app em celulares fracos com download/parse de coisas que talvez nunca
// sejam usadas na sessão.
// ═══════════════════════════════════════════════════════════════════════

(function () {
    const _cache = {};

    function _carregarScript(url) {
        if (_cache[url]) return _cache[url];
        _cache[url] = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => { delete _cache[url]; reject(new Error('Falha ao carregar ' + url)); };
            document.head.appendChild(s);
        });
        return _cache[url];
    }

    window.TM_carregarOpenCV = function () {
        if (window.cv && window._cvReady) return Promise.resolve();
        return _carregarScript('https://docs.opencv.org/4.8.0/opencv.js').then(() => {
            return new Promise(resolve => {
                const check = () => {
                    if (window.cv && window.cv.Mat) { window._cvReady = true; resolve(); }
                    else setTimeout(check, 100);
                };
                check();
            });
        });
    };

    window.TM_carregarJsPDF = function () {
        if (window.jspdf) return Promise.resolve();
        return _carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    };
})();
