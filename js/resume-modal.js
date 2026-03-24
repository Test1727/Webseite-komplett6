// JavaScript für das Lebenslauf-Modal mit PDF.js Integration und Zerfallseffekt

document.addEventListener('DOMContentLoaded', function() {
    // Referenzen zu den Elementen
    const resumeBtn = document.querySelector('.resume-btn');
    const modal = document.getElementById('resume-modal');
    const closeBtn = document.querySelector('.close-modal');
    const downloadBtn = document.getElementById('download-resume');
    const pdfContainer = document.getElementById('pdf-container');
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfJsContainer = document.getElementById('pdfjs-container');
    const modalTitle = document.querySelector('#resume-modal .modal-title');
    const downloadText = document.querySelector('#download-resume span');
    const iosHint = document.getElementById('ios-download-hint');
    
    // Erkennung von iOS/Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // PDF.js Worker konfigurieren
    if (isIOS || isSafari) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
    
    // Übersetzungsfunktion für das Modal
    function updateModalTranslations(lang) {
        if (modalTitle) modalTitle.textContent = translations[lang]['resume_title'];
        if (downloadText) downloadText.textContent = translations[lang]['resume_download'];
        if (iosHint) iosHint.textContent = translations[lang]['resume_ios_hint'];
    }
    
    // Event-Listener für Sprachänderungen
    document.addEventListener('languageChanged', function(e) {
        updateModalTranslations(e.detail.language);
    });
    
    // Modal öffnen
    resumeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const currentLang = document.documentElement.getAttribute('lang') || 'de';
        updateModalTranslations(currentLang);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        pdfIframe.style.display = 'none';
        pdfJsContainer.style.display = 'block';
        
        if (!pdfJsContainer.hasAttribute('data-loaded')) {
            loadPdfWithBlurAndDissolve('assets/pdf/Lebenslauf_AstridKraft.pdf', pdfJsContainer);
            pdfJsContainer.setAttribute('data-loaded', 'true');
        }
    });
    
    // PDF laden mit kurz unscharf + Pixel-Zerfall (aus tatsächlichem Bild)
    function loadPdfWithBlurAndDissolve(url, container) {
        container.innerHTML = '<p style="padding:2rem; text-align:center;">PDF wird geladen...</p>';
        
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function(pdf) {
            container.innerHTML = '';
            
            // Wrapper für alle Seiten
            const pagesWrapper = document.createElement('div');
            pagesWrapper.style.position = 'relative';
            pagesWrapper.style.width = '100%';
            pagesWrapper.style.maxHeight = '70vh';
            pagesWrapper.style.overflowY = 'auto';
            pagesWrapper.style.overflowX = 'hidden';
            pagesWrapper.style.borderRadius = '8px';
            pagesWrapper.style.backgroundColor = '#f5f5f5';
            
            container.appendChild(pagesWrapper);
            
            const pageImages = []; // Speichert die Bilder der Seiten
            const loadPromises = [];
            
            // Alle PDF-Seiten laden und als Bilder speichern
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                loadPromises.push(
                    pdf.getPage(pageNum).then(function(page) {
                        const viewport = page.getViewport({ scale: 1.5 }); // Höhere Auflösung für Pixel
                        
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        canvas.style.width = '100%';
                        canvas.style.height = 'auto';
                        canvas.style.marginBottom = '10px';
                        canvas.style.border = '1px solid #e0e0e0';
                        canvas.style.borderRadius = '4px';
                        canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        canvas.style.transition = 'filter 0.3s ease';
                        
                        const pageContainer = document.createElement('div');
                        pageContainer.className = 'pdf-page';
                        pageContainer.style.position = 'relative';
                        pageContainer.appendChild(canvas);
                        pagesWrapper.appendChild(pageContainer);
                        
                        return page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise.then(() => {
                            // Nach dem Rendern: Bilddaten speichern
                            const imageData = canvas.toDataURL('image/png');
                            pageImages.push({
                                canvas: canvas,
                                imageData: imageData,
                                container: pageContainer,
                                width: canvas.width,
                                height: canvas.height
                            });
                        });
                    })
                );
            }
            
            // Nachdem alle Seiten geladen sind: kurz unscharf zeigen, dann Zerfall
            Promise.all(loadPromises).then(() => {
                // 1. Kurz unscharf machen (0.5 Sekunde)
                pageImages.forEach(img => {
                    img.canvas.style.filter = 'blur(12px)';
                });
                
                // 2. Nach 0.5 Sekunden: Zerfall mit echten Pixeln starten
                setTimeout(() => {
                    startRealPixelDissolve(pagesWrapper, pageImages, container);
                }, 500);
            });
            
        }).catch(function(error) {
            container.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">
                Fehler beim Laden der PDF: ${error.message || error}<br>
                <a href="assets/pdf/Lebenslauf_AstridKraft.pdf" target="_blank" style="color:blue;">PDF direkt öffnen</a>
            </p>`;
        });
    }
    
    // Pixel-Zerfall mit echten Bildpixeln aus dem PDF
    function startRealPixelDissolve(wrapper, pageImages, container) {
        // Position des Wrappers ermitteln
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Für jede Seite
        pageImages.forEach((page, pageIndex) => {
            const canvas = page.canvas;
            const canvasRect = canvas.getBoundingClientRect();
            const relativeTop = canvasRect.top - wrapperRect.top;
            const relativeLeft = canvasRect.left - wrapperRect.left;
            
            // Original-Canvas ausblenden
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 0.2s';
            
            // Pixel-Container für diese Seite
            const pixelContainer = document.createElement('div');
            pixelContainer.style.position = 'absolute';
            pixelContainer.style.top = relativeTop + 'px';
            pixelContainer.style.left = relativeLeft + 'px';
            pixelContainer.style.width = canvasRect.width + 'px';
            pixelContainer.style.height = canvasRect.height + 'px';
            pixelContainer.style.overflow = 'hidden';
            pixelContainer.style.pointerEvents = 'none';
            pixelContainer.style.zIndex = '10';
            wrapper.appendChild(pixelContainer);
            
            // Pixel-Größe: 12x12 Pixel
            const pixelSize = 14;
            const cols = Math.ceil(canvasRect.width / pixelSize);
            const rows = Math.ceil(canvasRect.height / pixelSize);
            
            // Canvas als Bild für Pixel-Farben verwenden
            const img = new Image();
            img.onload = function() {
                // Temporäres Canvas für Farbextraktion
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const pixels = [];
                
                // Pixel-Elemente mit tatsächlichen Farben erzeugen
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        // Berechne die entsprechende Position im Original-Canvas
                        const srcX = Math.floor(col * (canvas.width / cols));
                        const srcY = Math.floor(row * (canvas.height / rows));
                        const srcW = Math.ceil(canvas.width / cols);
                        const srcH = Math.ceil(canvas.height / rows);
                        
                        // Farbe aus dem Bild holen (Durchschnitt)
                        let r = 0, g = 0, b = 0, count = 0;
                        for (let y = 0; y < srcH && srcY + y < canvas.height; y++) {
                            for (let x = 0; x < srcW && srcX + x < canvas.width; x++) {
                                const pixelData = tempCtx.getImageData(srcX + x, srcY + y, 1, 1).data;
                                r += pixelData[0];
                                g += pixelData[1];
                                b += pixelData[2];
                                count++;
                            }
                        }
                        if (count > 0) {
                            r = Math.floor(r / count);
                            g = Math.floor(g / count);
                            b = Math.floor(b / count);
                        }
                        
                        const pixel = document.createElement('div');
                        pixel.style.position = 'absolute';
                        pixel.style.width = pixelSize + 'px';
                        pixel.style.height = pixelSize + 'px';
                        pixel.style.left = (col * pixelSize) + 'px';
                        pixel.style.top = (row * pixelSize) + 'px';
                        pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                        pixel.style.opacity = '1';
                        pixel.style.transform = 'scale(1)';
                        pixel.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                        pixel.style.borderRadius = '1px';
                        pixel.style.boxShadow = 'inset 0 0 0 0.5px rgba(255,255,255,0.3)';
                        
                        // Zufällige Flugrichtung
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 80 + Math.random() * 100;
                        const xOffset = Math.cos(angle) * distance;
                        const yOffset = Math.sin(angle) * distance - 30;
                        const rotation = (Math.random() - 0.5) * 720;
                        
                        pixel.style.setProperty('--x', xOffset + 'px');
                        pixel.style.setProperty('--y', yOffset + 'px');
                        pixel.style.setProperty('--rot', rotation + 'deg');
                        
                        pixelContainer.appendChild(pixel);
                        pixels.push(pixel);
                    }
                }
                
                // Animation starten: Pixel fliegen weg
                setTimeout(() => {
                    pixels.forEach((pixel, idx) => {
                        const delay = Math.random() * 0.3;
                        setTimeout(() => {
                            pixel.style.transform = `translate(var(--x), var(--y)) rotate(var(--rot)) scale(0.2)`;
                            pixel.style.opacity = '0';
                        }, delay * 1000);
                    });
                }, 50);
                
                // Nach der Animation: Pixel-Container entfernen
                setTimeout(() => {
                    pixelContainer.remove();
                    
                    // Wenn letzte Seite, Platzhalter anzeigen
                    if (pageIndex === pageImages.length - 1) {
                        showPlaceholder(container);
                    }
                }, 800);
            };
            
            img.src = page.imageData;
        });
        
        if (pageImages.length === 0) {
            showPlaceholder(container);
        }
    }
    
    // Platzhalter nach Zerfall anzeigen
    function showPlaceholder(container) {
        container.innerHTML = '';
        
        const placeholder = document.createElement('div');
        placeholder.style.padding = '3rem 2rem';
        placeholder.style.textAlign = 'center';
        placeholder.style.backgroundColor = '#f8f9fa';
        placeholder.style.borderRadius = '12px';
        placeholder.style.border = '2px dashed #0a3d62';
        placeholder.style.margin = '1rem';
        placeholder.style.animation = 'fadeIn 0.5s ease';
        
        placeholder.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
            <h3 style="color: #0a3d62; margin-bottom: 1rem;">Lebenslauf auf persönliche Anfrage</h3>
            <p style="color: #555; margin-bottom: 0.5rem;">Aus Datenschutzgründen wird der vollständige Lebenslauf</p>
            <p style="color: #555; margin-bottom: 1.5rem;">nur im persönlichen Gespräch zur Verfügung gestellt.</p>
            <div style="background: #e9ecef; padding: 1rem; border-radius: 8px; display: inline-block;">
                <span style="font-family: monospace; font-size: 1.1rem;">📧 astridkraft.business@gmail.com</span>
            </div>
            <p style="color: #888; font-size: 0.85rem; margin-top: 1.5rem;">
                <span style="display: inline-block; margin-right: 0.5rem;">🔍</span> 
                Vorschau kurzzeitig unscharf eingeblendet
            </p>
        `;
        
        container.appendChild(placeholder);
        
        // Download-Button deaktivieren
        const downloadBtn = document.getElementById('download-resume');
        if (downloadBtn) {
            downloadBtn.style.opacity = '0.5';
            downloadBtn.style.pointerEvents = 'none';
            downloadBtn.title = 'Lebenslauf nur auf persönliche Anfrage';
        }
    }
    
    // Modal schließen
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
    
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
    
    // Download-Funktion
    downloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const iosHint = document.getElementById('ios-download-hint');
        if (iosHint) {
            iosHint.style.display = 'block';
            iosHint.innerHTML = '<p style="color:#0a3d62;">📋 Der vollständige Lebenslauf ist nur auf persönliche Anfrage verfügbar. Kontaktieren Sie mich gerne!</p>';
            setTimeout(() => {
                iosHint.style.display = 'none';
                iosHint.innerHTML = '';
            }, 4000);
        }
    });
});
