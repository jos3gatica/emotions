import { FaceDetectorService } from './services/FaceDetectorService.js';
import { StatsPanel } from './components/StatsPanel.js';
import { UIController } from './components/UIController.js';

class App {
  constructor() {
    this.detector = new FaceDetectorService();
    this.stats = new StatsPanel();
    this.ui = new UIController();

    this.isStreaming = false;
    this.stream = null;
    this.animFrameId = null;

    // Métricas de FPS
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.currentFps = 0;
  }

  async init() {
    if (window.lucide) lucide.createIcons();

    try {
      this.ui.updateLoader('Cargando modelos de IA...');
      await this.detector.loadModels((msg) => this.ui.updateLoader(msg));
      
      this.ui.updateLoader('', false);
      this.ui.setStatus('Listo para iniciar', true);
      this.ui.enableControls(() => this.toggleCamera());
    } catch (err) {
      this.ui.updateLoader('Error al cargar modelos neurales', true);
      this.ui.setStatus('Error de Inicialización', false);
    }
  }

  async toggleCamera() {
    if (this.isStreaming) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      this.ui.videoEl.srcObject = this.stream;
      this.ui.videoEl.classList.remove('hidden');
      this.isStreaming = true;
      this.ui.updateCamButton(true);
      this.ui.setStatus('Cámara activa', true);

      this.ui.videoEl.onloadedmetadata = () => {
        this.startDetectionLoop();
      };
    } catch (err) {
      console.error('Error al acceder a la webcam:', err);
      alert('No se pudo acceder a la cámara web. Asegúrate de otorgar permisos.');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    this.ui.videoEl.classList.add('hidden');
    this.isStreaming = false;
    this.ui.updateCamButton(false);
    this.ui.setStatus('Cámara detenida', false);
    
    // Resetear UI de estadisticas
    this.stats.updateMetrics(0, 0);
    this.stats.renderEmotions([]);
  }

  startDetectionLoop() {
    const video = this.ui.videoEl;
    const canvas = this.ui.canvasEl;

    const displaySize = {
      width: video.clientWidth || video.videoWidth,
      height: video.clientHeight || video.videoHeight
    };

    faceapi.matchDimensions(canvas, displaySize);

    const processFrame = async () => {
      if (!this.isStreaming) return;

      // Cálculo FPS
      const now = performance.now();
      this.frameCount++;
      if (now - this.lastFrameTime >= 1000) {
        this.currentFps = (this.frameCount * 1000) / (now - this.lastFrameTime);
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      // Detección
      const detections = await this.detector.detectFaces(video);

      // Renderizado de UI y Overlay
      this.ui.drawOverlays(detections, displaySize);
      this.stats.updateMetrics(detections.length, this.currentFps);
      this.stats.renderEmotions(detections);

      this.animFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});