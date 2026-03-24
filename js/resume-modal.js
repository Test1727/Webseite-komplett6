// JavaScript für das Lebenslauf-Modal mit PDF.js Integration und Papierschnipsel-Zerfall

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
            loadPdfWithBlurAndPaperShred('assets/pdf/Lebenslauf_AstridKraft.pdf', pdfJsContainer);
            pdfJsContainer.setAttribute('data-loaded', 'true');
        }
    });
    
    // PDF laden mit kurz unscharf + Papierschnipsel-Zerfall
    function loadPdfWithBlurAndPaperShred(url, container) {
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
            pagesWrapper.style.backgroundColor = '#f0f0f0';
            
            container.appendChild(pagesWrapper);
            
            const pageImages = [];
            const loadPromises = [];
            
            // Alle PDF-Seiten laden
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                loadPromises.push(
                    pdf.getPage(pageNum).then(function(page) {
                        const viewport = page.getViewport({ scale: 1.8 });
                        
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
                            pageImages.push({
                                canvas: canvas,
                                container: pageContainer,
                                width: canvas.width,
                                height: canvas.height,
                                rect: null
                            });
                        });
                    })
                );
            }
            
            Promise.all(loadPromises).then(() => {
                // Kurz unscharf machen
                pageImages.forEach(img => {
                    img.canvas.style.filter = 'blur(12px)';
                });
                
                // Nach 0.5 Sekunden: Papierschnipsel-Zerfall
                setTimeout(() => {
                    startPaperShredEffect(pagesWrapper, pageImages, container);
                }, 500);
            });
            
        }).catch(function(error) {
            container.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">
                Fehler beim Laden der PDF: ${error.message || error}<br>
                <a href="assets/pdf/Lebenslauf_AstridKraft.pdf" target="_blank" style="color:blue;">PDF direkt öffnen</a>
            </p>`;
        });
    }
    
    // Papierschnipsel-Zerfall-Effekt mit zufälligen gezackten Formen
    function startPaperShredEffect(wrapper, pageImages, container) {
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Verschiedene gezackte Papierriss-Formen
        const paperShapes = [
            'polygon(0% 5%, 8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%)',
            'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
            'polygon(0% 10%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 90%)',
            'polygon(5% 0%, 95% 0%, 100% 10%, 100% 90%, 95% 100%, 5% 100%, 0% 90%, 0% 10%)',
            'polygon(0% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)',
            'polygon(10% 0%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 10% 100%, 0% 80%, 0% 20%)',
            'polygon(0% 8%, 12% 0%, 88% 0%, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0% 92%)',
            'polygon(3% 0%, 97% 0%, 100% 5%, 100% 95%, 97% 100%, 3% 100%, 0% 95%, 0% 5%)'
        ];
        
        pageImages.forEach((page, pageIndex) => {
            const canvas = page.canvas;
            const canvasRect = canvas.getBoundingClientRect();
            const relativeTop = canvasRect.top - wrapperRect.top;
            const relativeLeft = canvasRect.left - wrapperRect.left;
            
            // Original-Canvas ausblenden
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 0.2s';
            
            // Bilddaten vom Canvas holen
            const imageData = canvas.toDataURL('image/png');
            
            // Schnipsel-Container
            const shredContainer = document.createElement('div');
            shredContainer.style.position = 'absolute';
            shredContainer.style.top = relativeTop + 'px';
            shredContainer.style.left = relativeLeft + 'px';
            shredContainer.style.width = canvasRect.width + 'px';
            shredContainer.style.height = canvasRect.height + 'px';
            shredContainer.style.overflow = 'visible';
            shredContainer.style.pointerEvents = 'none';
            shredContainer.style.zIndex = '15';
            wrapper.appendChild(shredContainer);
            
            // Schnipsel erzeugen (wie zerrissene Papierstücke)
            const shredCount = 32; // Mehr Schnipsel für dynamischeren Effekt
            const shreds = [];
            
            // Bild laden für Schnipsel
            const img = new Image();
            img.onload = function() {
                // Temporäres Canvas für Bilddaten
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Zufällige Schnipsel-Positionen und -Größen
                for (let i = 0; i < shredCount; i++) {
                    // Zufällige Größe (35-110px breit, 25-70px hoch)
                    const shredWidth = 35 + Math.random() * 75;
                    const shredHeight = 25 + Math.random() * 45;
                    
                    // Zufällige Position im Dokument
                    const posX = Math.random() * (canvasRect.width - shredWidth);
                    const posY = Math.random() * (canvasRect.height - shredHeight);
                    
                    // Entsprechende Position im Original-Canvas
                    const srcX = Math.floor((posX / canvasRect.width) * canvas.width);
                    const srcY = Math.floor((posY / canvasRect.height) * canvas.height);
                    const srcW = Math.floor((shredWidth / canvasRect.width) * canvas.width);
                    const srcH = Math.floor((shredHeight / canvasRect.height) * canvas.height);
                    
                    // Schnipsel-Bild aus dem Canvas extrahieren
                    const shredCanvas = document.createElement('canvas');
                    shredCanvas.width = srcW;
                    shredCanvas.height = srcH;
                    const shredCtx = shredCanvas.getContext('2d');
                    shredCtx.drawImage(tempCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
                    
                    // Zufällige gezackte Form auswählen
                    const randomShape = paperShapes[Math.floor(Math.random() * paperShapes.length)];
                    
                    // Zufällige Anfangsrotation (damit Schnipsel unregelmäßig liegen)
                    const initialRotation = (Math.random() - 0.5) * 12;
                    
                    // DOM-Element für Schnipsel
                    const shred = document.createElement('div');
                    shred.style.position = 'absolute';
                    shred.style.left = posX + 'px';
                    shred.style.top = posY + 'px';
                    shred.style.width = shredWidth + 'px';
                    shred.style.height = shredHeight + 'px';
                    shred.style.backgroundImage = `url(${shredCanvas.toDataURL()})`;
                    shred.style.backgroundSize = 'cover';
                    shred.style.backgroundPosition = 'center';
                    shred.style.boxShadow = '2px 3px 8px rgba(0,0,0,0.25)';
                    shred.style.borderRadius = '1px';
                    shred.style.clipPath = randomShape;
                    shred.style.transformOrigin = 'center center';
                    shred.style.transform = `rotate(${initialRotation}deg)`;
                    shred.style.transition = 'all 1.5s cubic-bezier(0.3, 0.8, 0.4, 1.1)';
                    
                    // Zufällige Flugrichtung und Rotation
                    const angle = Math.random() * Math.PI * 2;
                    const distanceX = (Math.random() - 0.5) * 280 + (Math.random() - 0.5) * 120;
                    const distanceY = (Math.random() - 0.5) * 200 - 100;
                    const flyRotation = (Math.random() - 0.5) * 720 + (Math.random() - 0.5) * 180;
                    const delay = Math.random() * 0.5;
                    
                    shred.style.setProperty('--dx', distanceX + 'px');
                    shred.style.setProperty('--dy', distanceY + 'px');
                    shred.style.setProperty('--rot', flyRotation + 'deg');
                    shred.style.setProperty('--delay', delay + 's');
                    
                    shredContainer.appendChild(shred);
                    shreds.push({ shred, delay, distanceX, distanceY, flyRotation });
                }
                
                // Animation starten: Schnipsel fliegen weg
                setTimeout(() => {
                    shreds.forEach(({ shred, delay, distanceX, distanceY, flyRotation }) => {
                        setTimeout(() => {
                            shred.style.transform = `translate(${distanceX}px, ${distanceY}px) rotate(${flyRotation}deg)`;
                            shred.style.opacity = '0';
                        }, delay * 1000);
                    });
                }, 50);
                
                // Nach Animation: Container entfernen und Platzhalter anzeigen
                setTimeout(() => {
                    shredContainer.remove();
                    if (pageIndex === pageImages.length - 1) {
                        showPlaceholder(container);
                    }
                }, 2200); // Längere Wartezeit (2,2 Sekunden)
            };
            
            img.src = imageData;
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
            <div style="font-size: 4rem; margin-bottom: 1rem;">📄✨</div>
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
