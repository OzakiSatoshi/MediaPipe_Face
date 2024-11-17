import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class FaceDetector {
  constructor() {
    this.faceLandmarker = null;
  }

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1
    });
  }

  calculateFaceRotation(landmarks) {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const mouthTop = landmarks[13];
    const leftFace = landmarks[234];
    const rightFace = landmarks[454];

    // Calculate yaw (left-right rotation)
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const yaw = Math.asin((rightEye.z - leftEye.z) / eyeDistance);

    // Calculate pitch (up-down rotation)
    const pitch = Math.atan2(nose.y - mouthTop.y, nose.z - mouthTop.z);

    // Calculate roll (tilt)
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

    return { yaw, pitch, roll };
  }

  async detectFace(video) {
    if (!this.faceLandmarker) return null;
    return await this.faceLandmarker.detectForVideo(video, performance.now());
  }
}