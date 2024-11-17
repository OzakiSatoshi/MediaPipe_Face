import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class FaceDetector {
  constructor() {
    this.faceLandmarker = null;
  }

  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    } catch (error) {
      console.error('FaceDetector initialization error:', error);
      throw error;
    }
  }

  async detectFace(video) {
    if (!this.faceLandmarker) return null;
    try {
      const startTimeMs = performance.now();
      return this.faceLandmarker.detectForVideo(video, startTimeMs);
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  calculateFaceRotation(landmarks) {
    try {
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const nose = landmarks[1];
      const mouthTop = landmarks[13];

      const eyeDistance = Math.abs(rightEye.x - leftEye.x);
      const yaw = Math.asin((rightEye.z - leftEye.z) / eyeDistance);
      const pitch = Math.atan2(nose.y - mouthTop.y, nose.z - mouthTop.z);
      const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      return { yaw, pitch, roll };
    } catch (error) {
      console.error('Face rotation calculation error:', error);
      return { yaw: 0, pitch: 0, roll: 0 };
    }
  }
}