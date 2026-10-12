export class UIController {
  constructor() {
    this.loaderEl = document.getElementById('loader');
    this.loaderTextEl = document.getElementById('loader-text');
    this.statusBadgeEl = document.getElementById('status-badge');
    this.btnToggleCam = document.getElementById('btn-toggle-cam');
    this.videoEl = document.getElementById('webcam');
    this.canvasEl = document.getElementById('overlay');
    this.chkLandmarks = document.getElementById('chk-landmarks');
    this.chkExpressions = document.getElementById('chk-expressions');
  }

  updateLoader(text, show = true) {
    if (this.loaderTextEl) this.loaderTextEl.textContent = text;
    if (show) {
      this.loaderEl.classList.remove('hidden');
    } else {
      this.loaderEl.classList.add('hidden');
    }
  }

  setStatus(message, isReady = true) {
    const dotClass = isReady ? 'bg-emerald-400' : 'bg-amber-400';
    this.statusBadgeEl.innerHTML = `
      <span class="w-2 h-2 rounded-full ${dotClass} animate-pulse"></span>
      <span>${message}</span>
    `;
  }

  enableControls(onClickCam) {
    this.btnToggleCam.disabled = false;
    this.btnToggleCam.addEventListener('click', onClickCam);
  }

  updateCamButton(isStreaming) {
    if (isStreaming) {
      this.btnToggleCam.innerHTML = `
        <i data-lucide="camera-off" class="w-4 h-4"></i>
        <span>Detener Cámara</span>
      `;
      this.btnToggleCam.classList.replace('from-cyan-600', 'from-red-600');
      this.btnToggleCam.classList.replace('to-emerald-600', 'to-rose-600');
    } else {
      this.btnToggleCam.innerHTML = `
        <i data-lucide="camera" class="w-4 h-4"></i>
        <span>Iniciar Cámara</span>
      `;
      this.btnToggleCam.classList.replace('from-red-600', 'from-cyan-600');
      this.btnToggleCam.classList.replace('to-rose-600', 'to-emerald-600');
    }
    if (window.lucide) lucide.createIcons();
  }

  drawOverlays(detections, displaySize) {
    const ctx = this.canvasEl.getContext('2d');
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // 1. Dibujar Puntos Faciales (Landmarks) con el canvas invertido (espejo)
    if (this.chkLandmarks.checked) {
      faceapi.draw.drawFaceLandmarks(this.canvasEl, resizedDetections);
    }

    // 2. Dibujar las etiquetas de emociones de forma correcta (sin espejo para el texto)
    if (this.chkExpressions.checked) {
      resizedDetections.forEach(detection => {
        // Obtenemos el recuadro de detección
        const { x, y, width, height } = detection.detection.box;

        // Buscamos la emoción con mayor puntuación
        if (detection.expressions) {
          const activeEmotions = Object.entries(detection.expressions)
            .filter(([_, val]) => val > 0.1) // filtro de confianza mínima
            .sort((a, b) => b[1] - a[1]);

          if (activeEmotions.length > 0) {
            const [emotion, confidence] = activeEmotions[0];
            
            // Traducción al español usando el config (si está disponible en tu entorno global)
            // o fallback directo si config no se importó en este archivo
            const emotionLabel = (typeof CONFIG !== 'undefined' && CONFIG.EMOTION_TRANSLATIONS[emotion]) 
              ? CONFIG.EMOTION_TRANSLATIONS[emotion] 
              : emotion;
            
            const text = `${emotionLabel} (${Math.round(confidence * 100)}%)`;

            // Configuración del canvas para texto no especular
            ctx.save();
            
            // Volvemos a aplicar la transformación espejo horizontal pero solo para esta caja
            // Esto cancela el espejo para el renderizado del texto y la caja de texto
            ctx.scale(-1, 1);
            
            // Dado que el canvas principal está invertido en el HTML (con transform: scaleX(-1)),
            // para que un texto se lea bien, debemos calcular su posición en base al eje X invertido.
            const posX = -(x + width); 
            const posY = y > 30 ? y - 10 : y + 20;

            // Estilos del badge / etiqueta
            ctx.font = 'bold 14px monospace';
            const textWidth = ctx.measureText(text).width;
            
            // Fondo de la etiqueta
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Fondo oscuro cyber
            ctx.fillRect(posX - 4, posY - 18, textWidth + 8, 24);
            
            // Borde de la etiqueta (un cyan brillante)
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(posX - 4, posY - 18, textWidth + 8, 24);

            // Texto de la emoción
            ctx.fillStyle = '#06b6d4'; // Cyan
            ctx.fillText(text, posX, posY);

            // También podemos opcionalmente dibujar un borde tradicional alrededor del rostro,
            // de igual forma invertido en x para compensar el reflejo del HTML
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.strokeRect(-x - width, y, width, height);

            ctx.restore();
          }
        }
      });
    }
  }
}