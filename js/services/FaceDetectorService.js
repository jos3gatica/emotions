import { CONFIG } from '../config.js';

export class FaceDetectorService {
  constructor() {
    this.modelsLoaded = false;
  }

  async loadModels(onProgress) {
    try {
      if (onProgress) onProgress('Cargando SSD MobileNet...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(CONFIG.MODEL_URL);
      
      if (onProgress) onProgress('Cargando Puntos Faciales...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(CONFIG.MODEL_URL);
      
      if (onProgress) onProgress('Cargando Reconocimiento de Emociones...');
      await faceapi.nets.faceExpressionNet.loadFromUri(CONFIG.MODEL_URL);
      
      this.modelsLoaded = true;
      return true;
    } catch (error) {
      console.error('Error al cargar modelos de face-api:', error);
      throw error;
    }
  }

  async detectFaces(videoElement) {
    if (!this.modelsLoaded || videoElement.paused || videoElement.ended) {
      return [];
    }

    return await faceapi
      .detectAllFaces(videoElement)
      .withFaceLandmarks()
      .withFaceExpressions();
  }
}