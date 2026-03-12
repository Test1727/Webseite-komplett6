// JavaScript für das Lebenslauf-Modal mit PDF.js Integration für iOS-Kompatibilität

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
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }
    }
    
    // Übersetzungsfunktion für das Modal
    function updateModalTranslations(lang) {
        if (modalTitle && translations && translations[lang]) {
            modalTitle.textContent = translations[lang]['resume_title'];
        }
        if (downloadText && translations && translations[lang]) {
            downloadText.textContent = translations[lang]['resume_download'];
        }
        if (iosHint && translations && translations[lang]) {
            iosHint.textContent = translations[lang]['resume_ios_hint'];
        }
    }
    
    // Event-Listener für Sprachänderungen
    document.addEventListener('languageChanged', function(e) {
        updateModalTranslations(e.detail.language);
    });
    
    // Modal öffnen, wenn auf den Lebenslauf-Button geklickt wird
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            const currentLang = document.documentElement.getAttribute('lang') || 'de';
            updateModalTranslations(currentLang);
            
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // PDF immer mit PDF.js laden (für alle Browser)
            pdfIframe.style.display = 'none';
            pdfJsContainer.style.display = 'block';
            
            if (!pdfJsContainer.hasAttribute('data-loaded')) {
                loadPdfWithPdfJs('assets/pdf/Lebenslauf_AstridKraft.pdf', pdfJsContainer);
                pdfJsContainer.setAttribute('data-loaded', 'true');
            }
        });
    }
    
    // PDF mit PDF.js laden
    function loadPdfWithPdfJs(url, container) {
        if (typeof pdfjsLib === 'undefined') {
            container.innerHTML = '<p style="padding:2rem; text-align:center; color:red;">PDF.js Bibliothek nicht geladen.</p>';
            return;
        }
        
        container.innerHTML = '<p style="padding:2rem; text-align:center;">PDF wird geladen...</p>';
        
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(function(pdf) {
            container.innerHTML = '';
            
            // Für bessere Darstellung: Canvas stylen
            const loadPage = function(pageNum) {
                pdf.getPage(pageNum).then(function(page) {
                    const viewport = page.getViewport({ scale: 1.3 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.style.marginBottom = '15px';
                    canvas.style.border = '1px solid #ddd';
                    canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    canvas.style.borderRadius = '4px';
                    
                    const pageContainer = document.createElement('div');
                    pageContainer.className = 'pdf-page';
                    pageContainer.style.marginBottom = '20px';
                    pageContainer.style.textAlign = 'center';
                    pageContainer.appendChild(canvas);
                    container.appendChild(pageContainer);
                    
                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise.then(function() {
                        // Nächste Seite laden, wenn vorhanden
                        if (pageNum < pdf.numPages) {
                            loadPage(pageNum + 1);
                        }
                    });
                });
            };
            
            // Erste Seite laden
            loadPage(1);
            
        }).catch(function(error) {
            container.innerHTML = `<p style="padding:2rem; text-align:center; color:red;">
                Fehler beim Laden der PDF: ${error.message || error}<br>
                <a href="assets/pdf/Lebenslauf_AstridKraft.pdf" target="_blank" style="color:blue; text-decoration:underline;">PDF direkt öffnen</a>
            </p>`;
        });
    }
    
    // Modal schließen
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
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
    
    // VERBESSERTE Download-Funktion für Safari-Kompatibilität
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const pdfUrl = 'assets/pdf/Lebenslauf_AstridKraft.pdf';
            const fileName = 'Lebenslauf_AstridKraft.pdf';
            
            // iOS-Hinweis anzeigen
            if (isIOS || isSafari) {
                iosHint.style.display = 'block';
                
                // Spezielle Behandlung für iOS/Safari
                if (isIOS) {
                    // iOS: Erstelle einen speziellen Download-Link mit Anleitung
                    iosHint.innerHTML = '<p>📱 Tippe und halte auf den folgenden Link, dann wähle "Download verknüpfter Datei":</p>';
                    
                    // Zusätzlichen direkten Link für iOS anzeigen
                    const directLink = document.createElement('a');
                    directLink.href = pdfUrl;
                    directLink.textContent = '📄 Lebenslauf_AstridKraft.pdf';
                    directLink.style.display = 'block';
                    directLink.style.padding = '10px';
                    directLink.style.background = '#f0f0f0';
                    directLink.style.margin = '10px 0';
                    directLink.style.borderRadius = '4px';
                    directLink.style.color = '#0a3d62';
                    directLink.style.fontWeight = 'bold';
                    directLink.target = '_blank';
                    
                    // Vorherigen Inhalt leeren und neuen Link einfügen
                    iosHint.innerHTML = '';
                    iosHint.appendChild(directLink);
                } else {
                    // Safari auf macOS: Verschiedene Methoden testen
                    iosHint.innerHTML = '<p>💾 Versuche Download...</p>';
                    
                    // Methode 1: Blob-URL erstellen (funktioniert oft besser in Safari)
                    fetch(pdfUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                            
                            iosHint.innerHTML = '<p>✅ Download gestartet!</p>';
                        })
                        .catch(() => {
                            // Methode 2: Fallback
                            window.open(pdfUrl, '_blank');
                            iosHint.innerHTML = '<p>📄 PDF im neuen Tab geöffnet.</p>';
                        });
                }
                
                // Hinweis nach 8 Sekunden ausblenden (länger wegen iOS)
                setTimeout(() => {
                    iosHint.style.display = 'none';
                    // iOS-Hinweis zurücksetzen
                    if (isIOS) {
                        iosHint.innerHTML = '<p>Auf iOS-Geräten: Tippen und halten Sie auf dem PDF und wählen Sie "Zu Bücher hinzufügen" oder "In Dateien speichern".</p>';
                    } else {
                        iosHint.innerHTML = '<p>Auf iOS-Geräten: Tippen und halten Sie auf dem PDF und wählen Sie "Zu Bücher hinzufügen" oder "In Dateien speichern".</p>';
                    }
                }, 8000);
                
            } else {
                // Für andere Browser: Standard-Download
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
});
