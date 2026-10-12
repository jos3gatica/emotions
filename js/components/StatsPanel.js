import { CONFIG } from '../config.js';

export class StatsPanel {
  constructor() {
    this.faceCountEl = document.getElementById('face-count');
    this.fpsEl = document.getElementById('fps-counter');
    this.emotionsContainerEl = document.getElementById('emotions-container');
  }

  updateMetrics(faceCount, fps) {
    this.faceCountEl.textContent = faceCount;
    this.fpsEl.textContent = Math.round(fps);
  }

  renderEmotions(detections) {
    if (!detections || detections.length === 0) {
      this.emotionsContainerEl.innerHTML = `
        <div class="text-center text-xs text-slate-500 py-8">
          No se detectan rostros
        </div>`;
      return;
    }

    // Promediar las expresiones de todos los rostros visibles
    const emotionSums = {};
    Object.keys(CONFIG.EMOTION_TRANSLATIONS).forEach(e => emotionSums[e] = 0);

    detections.forEach(det => {
      Object.entries(det.expressions).forEach(([emotion, value]) => {
        if (emotionSums[emotion] !== undefined) {
          emotionSums[emotion] += value;
        }
      });
    });

    const count = detections.length;
    const sortedEmotions = Object.entries(emotionSums)
      .map(([emotion, val]) => ({ emotion, score: val / count }))
      .sort((a, b) => b.score - a.score);

    this.emotionsContainerEl.innerHTML = sortedEmotions.map(({ emotion, score }) => {
      const percentage = Math.round(score * 100);
      const label = CONFIG.EMOTION_TRANSLATIONS[emotion] || emotion;
      const color = CONFIG.EMOTION_COLORS[emotion] || '#06b6d4';

      return `
        <div>
          <div class="flex justify-between text-xs font-mono mb-1">
            <span class="text-slate-300 font-medium">${label}</span>
            <span class="text-slate-400">${percentage}%</span>
          </div>
          <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div class="h-full transition-all-fast rounded-full" 
                 style="width: ${percentage}%; background-color: ${color}"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}