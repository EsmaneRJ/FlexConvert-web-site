// Application FlexConvert - Convertisseur Audio vers Vidéo Lyrics
class FlexConvert {
    constructor() {
        this.currentFile = null;
        this.conversionProgress = 0;
        this.conversionSteps = [
            { id: 'step1', name: 'Analyse audio', duration: 20 },
            { id: 'step2', name: 'Transcription STT', duration: 40 },
            { id: 'step3', name: 'Génération paroles', duration: 25 },
            { id: 'step4', name: 'Création vidéo', duration: 15 }
        ];
        this.currentStep = 0;
        this.conversionTimer = null;
        this.startTime = null;
        this.theme = localStorage.getItem('flexconvert-theme') || 'light';
        this.connectionStatus = navigator.onLine;
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
        this.checkConnection();
        this.showWelcomeNotification();
        
        // Vérifier la connexion périodiquement
        setInterval(() => this.checkConnection(), 5000);
    }

    // Gestion du thème
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('flexconvert-theme', this.theme);
        this.applyTheme();
        this.showNotification('Thème ' + (this.theme === 'dark' ? 'sombre' : 'clair') + ' activé', 'info');
    }

    // Vérification de la connexion
    checkConnection() {
        const wasOnline = this.connectionStatus;
        this.connectionStatus = navigator.onLine;
        
        const statusElement = document.getElementById('connectionStatus');
        const icon = statusElement.querySelector('i');
        const text = statusElement.querySelector('span');
        
        if (this.connectionStatus) {
            statusElement.style.color = 'var(--success-color)';
            icon.className = 'fas fa-wifi';
            text.textContent = 'Connecté';
            
            if (!wasOnline) {
                this.showNotification('Connexion rétablie', 'success');
            }
        } else {
            statusElement.style.color = 'var(--error-color)';
            icon.className = 'fas fa-wifi-slash';
            text.textContent = 'Hors ligne';
            
            if (wasOnline) {
                this.showNotification('Connexion perdue - L\'application nécessite une connexion internet', 'error');
            }
        }
    }

    // Gestion des fichiers
    handleFileSelect(file) {
        if (!this.connectionStatus) {
            this.showNotification('Connexion internet requise pour la conversion', 'error');
            return;
        }

        if (!this.isAudioFile(file)) {
            this.showNotification('Format de fichier non supporté', 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB max
            this.showNotification('Fichier trop volumineux (maximum 100MB)', 'error');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);
        this.showSection('fileInfoSection');
        this.showNotification('Fichier audio chargé avec succès', 'success');
    }

    isAudioFile(file) {
        const supportedTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 
            'audio/flac', 'audio/ogg', 'audio/x-wav'
        ];
        return supportedTypes.includes(file.type) || 
               /\.(mp3|wav|aac|flac|ogg)$/i.test(file.name);
    }

    displayFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileFormat').textContent = this.getFileExtension(file.name).toUpperCase();
        
        // Simulation de la durée audio
        this.getAudioDuration(file).then(duration => {
            document.getElementById('fileDuration').textContent = this.formatDuration(duration);
        });
    }

    async getAudioDuration(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
                resolve(audio.duration || 180); // Valeur par défaut si erreur
            };
            audio.onerror = () => resolve(180); // Valeur par défaut
            audio.src = URL.createObjectURL(file);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getFileExtension(filename) {
        return filename.split('.').pop() || '';
    }

    // Gestion de la conversion
    /*
    startConversion() {
        if (!this.connectionStatus) {
            this.showNotification('Connexion internet requise pour la conversion', 'error');
            return;
        }

        if (!this.currentFile) {
            this.showNotification('Aucun fichier sélectionné', 'error');
            return;
        }

        this.showSection('conversionSection');
        this.conversionProgress = 0;
        this.currentStep = 0;
        this.startTime = Date.now();
        
        this.updateProgress(0);
        this.updateConversionStep(0);
        this.startConversionTimer();
        
        this.showNotification('Conversion démarrée', 'info');
    }
    */

    startConversion() {
        if (!this.currentFile) {
            this.showNotification('Aucun fichier sélectionné', 'error');
            return;
        }

        this.showSection('conversionSection');
        this.updateProgress(10);
        this.updateConversionStep(1);

        const formData = new FormData();
        formData.append("audio", this.currentFile);

        fetch("http://127.0.0.1:5000/convert", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("Erreur durant la conversion");
            return res.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "lyrics.txt";
            link.click();

            this.showSection("resultSection");
            this.showNotification("Téléchargement prêt !", "success");
            this.updateProgress(100);
            this.updateConversionStep(4);
        })
        .catch(err => {
            this.showSection("fileInfoSection");
            this.showNotification("Erreur: " + err.message, "error");
        });
    }




    startConversionTimer() {
        this.conversionTimer = setInterval(() => {
            this.updateConversionProgress();
        }, 100);
    }

    updateConversionProgress() {
        // Simulation de progression réaliste
        const totalDuration = this.conversionSteps.reduce((sum, step) => sum + step.duration, 0) * 1000;
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        
        this.conversionProgress = progress;
        this.updateProgress(progress);
        this.updateElapsedTime(elapsed);
        this.updateRemainingTime(totalDuration - elapsed);
        
        // Mise à jour des étapes
        let stepProgress = 0;
        let currentStepIndex = 0;
        
        for (let i = 0; i < this.conversionSteps.length; i++) {
            const stepDuration = this.conversionSteps[i].duration * 1000;
            if (elapsed > stepProgress + stepDuration) {
                stepProgress += stepDuration;
                currentStepIndex = i + 1;
            } else {
                break;
            }
        }
        
        if (currentStepIndex !== this.currentStep) {
            this.currentStep = currentStepIndex;
            this.updateConversionStep(currentStepIndex);
        }
        
        // Fin de conversion
        if (progress >= 100) {
            this.completeConversion();
        }
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        
        progressFill.style.width = percent + '%';
        progressPercent.textContent = Math.round(percent) + '%';
    }

    updateConversionStep(stepIndex) {
        // Marquer les étapes précédentes comme terminées
        for (let i = 0; i < stepIndex; i++) {
            const stepElement = document.getElementById(this.conversionSteps[i].id);
            stepElement.classList.remove('active');
            stepElement.classList.add('completed');
        }
        
        // Marquer l'étape actuelle comme active
        if (stepIndex < this.conversionSteps.length) {
            const currentStepElement = document.getElementById(this.conversionSteps[stepIndex].id);
            currentStepElement.classList.add('active');
            
            const statusElement = document.getElementById('conversionStage');
            statusElement.textContent = this.conversionSteps[stepIndex].name + '...';
        }
    }

    updateElapsedTime(elapsed) {
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('elapsedTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateRemainingTime(remaining) {
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            document.getElementById('remainingTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            document.getElementById('remainingTime').textContent = '00:00';
        }
    }

    completeConversion() {
        clearInterval(this.conversionTimer);
        
        // Marquer toutes les étapes comme terminées
        this.conversionSteps.forEach(step => {
            const stepElement = document.getElementById(step.id);
            stepElement.classList.remove('active');
            stepElement.classList.add('completed');
        });
        
        // Générer les informations du fichier de sortie
        this.generateOutputInfo();
        
        setTimeout(() => {
            this.showSection('resultSection');
            this.showNotification('Conversion terminée avec succès!', 'success');
        }, 1000);
    }

    generateOutputInfo() {
        const originalName = this.currentFile.name.replace(/\.[^/.]+$/, '');
        const outputName = originalName + '_lyrics.mp4';
        const outputSize = Math.round(this.currentFile.size * 3.2); // Estimation
        const wordCount = Math.floor(Math.random() * 100) + 100; // Simulation
        
        document.getElementById('videoFileName').textContent = outputName;
        document.getElementById('videoSize').textContent = this.formatFileSize(outputSize);
        document.getElementById('lyricsCount').textContent = wordCount + ' mots transcrits';
        
        // Durée identique au fichier original
        this.getAudioDuration(this.currentFile).then(duration => {
            document.getElementById('videoDuration').textContent = this.formatDuration(duration);
        });
    }

    cancelConversion() {
        if (this.conversionTimer) {
            clearInterval(this.conversionTimer);
        }
        
        this.showSection('fileInfoSection');
        this.showNotification('Conversion annulée', 'warning');
        
        // Réinitialiser les étapes
        this.conversionSteps.forEach(step => {
            const stepElement = document.getElementById(step.id);
            stepElement.classList.remove('active', 'completed');
        });
    }

    // Gestion du téléchargement
    downloadVideo() {
        if (!this.currentFile) return;
        
        const downloadBtn = document.getElementById('downloadBtn');
        const spinner = document.getElementById('downloadSpinner');
        const progressSpan = spinner.querySelector('span');
        
        // Afficher le spinner
        downloadBtn.style.position = 'relative';
        spinner.classList.remove('hidden');
        
        // Simulation du téléchargement
        let progress = 0;
        const downloadTimer = setInterval(() => {
            progress += Math.random() * 10 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(downloadTimer);
                
                // Masquer le spinner
                spinner.classList.add('hidden');
                
                // Simuler le téléchargement
                this.simulateDownload();
                this.showNotification('Téléchargement terminé', 'success');
            }
            
            progressSpan.textContent = Math.round(progress) + '%';
        }, 200);
    }

    simulateDownload() {
        // Créer un lien de téléchargement simulé
        const originalName = this.currentFile.name.replace(/\.[^/.]+$/, '');
        const outputName = originalName + '_lyrics.mp4';
        
        // Dans une vraie application, ceci téléchargerait le fichier généré
        const link = document.createElement('a');
        link.download = outputName;
        link.href = '#'; // Dans une vraie app, ce serait l'URL du fichier généré
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    saveToFolder() {
        this.showNotification('Ouverture de l\'explorateur de fichiers...', 'info');
        
        // Dans une vraie application desktop, ceci ouvrirait l'explorateur
        // Pour la démo, on simule juste l'action
        setTimeout(() => {
            this.showNotification('Fichier sauvegardé dans le dossier sélectionné', 'success');
        }, 1500);
    }

    previewVideo() {
        const modal = document.getElementById('previewModal');
        const video = document.getElementById('previewVideo');
        
        // Dans une vraie application, on chargerait la vraie vidéo
        // Pour la démo, on utilise une vidéo placeholder
        video.src = 'data:video/mp4;base64,'; // Placeholder
        
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closePreview() {
        const modal = document.getElementById('previewModal');
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    // Gestion des sections
    showSection(sectionId) {
        // Masquer toutes les sections
        const sections = ['uploadSection', 'fileInfoSection', 'conversionSection', 'resultSection'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
        
        // Afficher la section demandée
        document.getElementById(sectionId).classList.remove('hidden');
    }

    newConversion() {
        this.currentFile = null;
        this.conversionProgress = 0;
        this.currentStep = 0;
        
        if (this.conversionTimer) {
            clearInterval(this.conversionTimer);
        }
        
        // Réinitialiser les étapes
        this.conversionSteps.forEach(step => {
            const stepElement = document.getElementById(step.id);
            stepElement.classList.remove('active', 'completed');
        });
        
        this.showSection('uploadSection');
        this.showNotification('Prêt pour une nouvelle conversion', 'info');
    }

    // Gestion des paramètres
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('open');
    }

    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.remove('open');
    }

    // Notifications
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showWelcomeNotification() {
        setTimeout(() => {
            this.showNotification('Bienvenue dans FlexConvert! Glissez-déposez un fichier audio pour commencer.', 'info', 6000);
        }, 1000);
    }

    // Gestionnaire d'événements
    bindEvents() {
        // Upload de fichiers
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('audioFileInput');
        const browseBtn = document.getElementById('browseBtn');
        
        // Click pour parcourir
        uploadArea.addEventListener('click', () => fileInput.click());
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        
        // Sélection de fichier
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileSelect(file);
        });
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileSelect(file);
        });
        
        // Boutons d'action
        document.getElementById('changeFileBtn')?.addEventListener('click', () => {
            this.showSection('uploadSection');
        });
        
        document.getElementById('startConversionBtn')?.addEventListener('click', () => {
            this.startConversion();
        });
        
        document.getElementById('cancelConversionBtn')?.addEventListener('click', () => {
            this.cancelConversion();
        });
        
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.downloadVideo();
        });
        
        document.getElementById('saveToFolderBtn')?.addEventListener('click', () => {
            this.saveToFolder();
        });
        
        document.getElementById('previewBtn')?.addEventListener('click', () => {
            this.previewVideo();
        });
        
        document.getElementById('newConversionBtn')?.addEventListener('click', () => {
            this.newConversion();
        });
        
        // Contrôles de thème et paramètres
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.toggleSettings();
        });
        
        document.getElementById('closeSettings')?.addEventListener('click', () => {
            this.closeSettings();
        });
        
        // Modal
        document.getElementById('closePreview')?.addEventListener('click', () => {
            this.closePreview();
        });
        
        // Fermer modal en cliquant à l'extérieur
        document.getElementById('previewModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') {
                this.closePreview();
            }
        });
        
        // About button
        document.getElementById('aboutBtn')?.addEventListener('click', () => {
            this.showNotification('FlexConvert v1.0 - Convertisseur audio vers vidéo lyrics utilisant STT', 'info', 6000);
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                this.closePreview();
            }
            
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                fileInput.click();
            }
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.toggleSettings();
            }
        });
        
        // Gestion de la connexion
        window.addEventListener('online', () => this.checkConnection());
        window.addEventListener('offline', () => this.checkConnection());
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.flexConvert = new FlexConvert();
    
    // Informations de debug
    console.log('🎵 FlexConvert initialisé');
    console.log('📋 Raccourcis disponibles:');
    console.log('   • Ctrl+O: Ouvrir fichier');
    console.log('   • Ctrl+S: Paramètres');
    console.log('   • Escape: Fermer modals');
});



// Variable mitahiry ilay fichier teo aloha
let previousFile = null;

startConversion() {
    if (!this.currentFile) {
        this.showNotification('Aucun fichier sélectionné', 'error');
        return;
    }

    console.log("Envoi du fichier à Flask...");

    this.showSection('conversionSection');
    this.updateProgress(10);
    this.updateConversionStep(1);

    const formData = new FormData();
    formData.append("audio", this.currentFile);

    fetch("http://127.0.0.1:5000/convert", {
        method: "POST",
        body: formData
    })
    .then(res => {
        console.log("Réponse reçue depuis Flask:", res);
        if (!res.ok) throw new Error("Erreur durant la conversion");
        return res.blob();
    })
    .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "lyrics.txt";
        link.click();

        this.showSection("resultSection");
        this.showNotification("Téléchargement prêt !", "success");
        this.updateProgress(100);
        this.updateConversionStep(4);
    })
    .catch(err => {
        console.error("Erreur fetch:", err);
        this.showSection("fileInfoSection");
        this.showNotification("Erreur: " + err.message, "error");
    });
}

