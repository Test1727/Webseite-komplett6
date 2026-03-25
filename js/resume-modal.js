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
    
    // Modal öffnen - Button verschwindet SOFORT bei Klick
    resumeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Download-Button sofort ausblenden
        const downloadBtnElem = document.getElementById('download-resume');
        if (downloadBtnElem) {
            downloadBtnElem.style.display = 'none';
        }
        
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
                // Zuerst scharf anzeigen (kein Blur)
                pageImages.forEach(img => {
                    img.canvas.style.filter = 'blur(0px)';
                    img.canvas.style.transition = 'filter 0.8s ease';
                });
                
                // Nach 0.3 Sekunden: langsam unscharf werden
                setTimeout(() => {
                    pageImages.forEach(img => {
                        img.canvas.style.filter = 'blur(12px)';
                    });
                }, 300);
                
                // Nach 1.8 Sekunden (0.3 + 1.5): Papierschnipsel-Zerfall
                setTimeout(() => {
                    startPaperShredEffect(pagesWrapper, pageImages, container);
                }, 1800);
            });
            
        }).catch(function(error) {
            container.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">
                Fehler beim Laden der PDF: ${error.message || error}<br>
                <a href="assets/pdf/Lebenslauf_AstridKraft.pdf" target="_blank" style="color:blue;">PDF direkt öffnen</a>
            </p>`;
        });
    }
    
    // Papierschnipsel-Zerfall-Effekt mit gezackten Rändern (wie echtes zerrissenes Papier)
    function startPaperShredEffect(wrapper, pageImages, container) {
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Verschiedene gezackte Papierriss-Formen (echte Papierkanten)
        const paperShapes = [
            'polygon(0% 3%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 97%)',
            'polygon(0% 8%, 12% 0%, 88% 0%, 100% 10%, 100% 90%, 88% 100%, 12% 100%, 0% 92%)',
            'polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)',
            'polygon(0% 5%, 10% 0%, 90% 0%, 100% 8%, 100% 92%, 90% 100%, 10% 100%, 0% 95%)',
            'polygon(0% 12%, 18% 0%, 82% 0%, 100% 15%, 100% 85%, 82% 100%, 18% 100%, 0% 88%)',
            'polygon(0% 0%, 85% 0%, 100% 20%, 100% 80%, 85% 100%, 15% 100%, 0% 80%, 0% 20%)',
            'polygon(0% 7%, 7% 0%, 93% 0%, 100% 7%, 100% 93%, 93% 100%, 7% 100%, 0% 93%)',
            'polygon(0% 0%, 100% 0%, 100% 85%, 90% 100%, 10% 100%, 0% 85%)'
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
            const shredCount = 80;
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
                    shred.style.boxShadow = '2px 3px 8px rgba(0,0,0,0.3)';
                    shred.style.transformOrigin = 'center center';
                    shred.style.transform = `rotate(${initialRotation}deg)`;
                    shred.style.transition = 'all 5.0s cubic-bezier(0.3, 0.8, 0.4, 1.1)';
                    // WICHTIG: clipPath nach dem backgroundImage setzen
                    shred.style.clipPath = randomShape;
                    shred.style.webkitClipPath = randomShape;
                    
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
                }, 3500);
            };
            
            img.src = imageData;
        });
        
        if (pageImages.length === 0) {
            showPlaceholder(container);
        }
    }
    
    // Platzhalter nach Zerfall anzeigen mit SVG-Schloss
    function showPlaceholder(container) {
        container.innerHTML = '';
        
        // Container für den Platzhalter
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-container';
        placeholder.style.height = '100%';
        placeholder.style.minHeight = '100%';
        
        // Inhalt (mit CSS-Klassen)
        const content = document.createElement('div');
        content.className = 'placeholder-content';
        
        content.innerHTML = `
    <svg class="lock-icon" width="80" height="80" viewBox="0 0 50 50" fill="currentColor" stroke="currentColor" stroke-width="1.5">
        <path d="M 25 3 C 18.363281 3 13 8.363281 13 15 L 13 20 L 9 20 C 7.355469 20 6 21.355469 6 23 L 6 47 C 6 48.644531 7.355469 50 9 50 L 41 50 C 42.644531 50 44 48.644531 44 47 L 44 23 C 44 21.355469 42.644531 20 41 20 L 37 20 L 37 15 C 37 8.363281 31.636719 3 25 3 Z M 25 5 C 30.566406 5 35 9.433594 35 15 L 35 20 L 15 20 L 15 15 C 15 9.433594 19.433594 5 25 5 Z M 9 22 L 41 22 C 41.554688 22 42 22.445313 42 23 L 42 47 C 42 47.554688 41.554688 48 41 48 L 9 48 C 8.445313 48 8 47.554688 8 47 L 8 23 C 8 22.445313 8.445313 22 9 22 Z M 25 30 C 23.300781 30 22 31.300781 22 33 C 22 33.898438 22.398438 34.6875 23 35.1875 L 23 38 C 23 39.101563 23.898438 40 25 40 C 26.101563 40 27 39.101563 27 38 L 27 35.1875 C 27.601563 34.6875 28 33.898438 28 33 C 28 31.300781 26.699219 30 25 30 Z"/>
    </svg>
    <h3>Zugriff eingeschränkt.</h3>
    <p>Relevante Informationen werden kontextbasiert bereitgestellt.</p>
`;





        
        
        placeholder.appendChild(content);
        container.appendChild(placeholder);
        
        // ========== GLITZER EFFEKT AUSKOMMENTIERT ==========
        /*
        // Glitzer-Effekt (nur ✨ in Cyan)
        const glitzerContainer = document.createElement('div');
        glitzerContainer.className = 'glitzer-container';
        placeholder.appendChild(glitzerContainer);
        
        const glitzerShapes = ['✨'];
        
        function createGlitzer() {
            const glitzer = document.createElement('div');
            const randomShape = glitzerShapes[Math.floor(Math.random() * glitzerShapes.length)];
            const size = 14 + Math.random() * 18;
            const posX = Math.random() * placeholder.offsetWidth;
            const posY = Math.random() * placeholder.offsetHeight;
            
            glitzer.innerHTML = randomShape;
            glitzer.style.position = 'absolute';
            glitzer.style.left = posX + 'px';
            glitzer.style.top = posY + 'px';
            glitzer.style.fontSize = size + 'px';
            glitzer.style.setProperty('color', '#00ffff', 'important');
            glitzer.style.textShadow = `0 0 ${6 + Math.random() * 10}px rgba(0,255,255,0.9)`;
            glitzer.style.opacity = '0';
            glitzer.style.transition = 'opacity 0.3s ease';
            glitzer.style.pointerEvents = 'none';
            
            glitzerContainer.appendChild(glitzer);
            
            setTimeout(() => {
                glitzer.style.opacity = 0.5 + Math.random() * 0.5;
                setTimeout(() => {
                    glitzer.style.opacity = '0';
                    setTimeout(() => {
                        glitzer.remove();
                    }, 300);
                }, 400 + Math.random() * 600);
            }, 50);
        }
        
        setTimeout(() => {
            let glitzerInterval = setInterval(() => {
                if (placeholder.isConnected) {
                    createGlitzer();
                } else {
                    clearInterval(glitzerInterval);
                }
            }, 350);
        }, 100);
        
        const modalElement = document.getElementById('resume-modal');
        let glitzerIntervalId = null;
        
        const closeModalHandler = function() {
            if (glitzerIntervalId) {
                clearInterval(glitzerIntervalId);
            }
        };
        
        const modalCloseBtn = document.querySelector('.close-modal');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModalHandler);
        }
        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) closeModalHandler();
        });
        */
        // ========== ENDE AUSKOMMENTIERTER GLITZER ==========
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
    
    // Download-Funktion (wird durch das Ausblenden des Buttons nicht mehr benötigt, aber bleibt für die Struktur)
    downloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const iosHintElem = document.getElementById('ios-download-hint');
        if (iosHintElem) {
            iosHintElem.style.display = 'block';
            iosHintElem.innerHTML = '<p style="color:#0a3d62;">📋 Der vollständige Lebenslauf ist nur auf persönliche Anfrage verfügbar. Kontaktieren Sie mich gerne!</p>';
            setTimeout(() => {
                iosHintElem.style.display = 'none';
                iosHintElem.innerHTML = '';
            }, 4000);
        }
    });
});
