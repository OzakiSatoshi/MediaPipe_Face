import { SceneManager } from '../three/SceneManager.js';
import { SnowEffect } from '../three/SnowEffect.js';
import { FaceDetector } from '../face/FaceDetector.js';
import { ShareManager } from '../share/ShareManager.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class App {
  constructor() {
    this.videoElement = document.getElementById('webcam');
    this.sceneManager = new SceneManager();
    this.faceDetector = new FaceDetector();
    this.shareManager = new ShareManager();
    this.models = {};
    this.faceModels = {};
    this.modelParams = {
      hat: { scale: 0.5, positionOffset: { x: 0, y: 0.1, z: -0.5 } },
      tonakai: { scale: 0.8, positionOffset: { x: 0, y: -0.2, z: -0.5 } }
    };
  }

  async initialize() {
    await this.setupWebcam();
    await this.faceDetector.initialize();
    await this.loadModels();
    this.snowEffect = new SnowEffect(this.sceneManager.scene);
    this.setupCaptureButton();
    this.animate();
  }

  setupCaptureButton() {
    const captureButton = document.querySelector('.capture-button');
    captureButton.addEventListener('click', () => {
      requestAnimationFrame(() => this.captureImage());
    });
  }

  async captureImage() {
    // 現在のシーンを再レンダリング
    this.sceneManager.render();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 背景のビデオを描画（ミラー処理）
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Three.jsシーンを合成（アルファブレンディングを調整）
    const threeCanvas = this.sceneManager.renderer.domElement;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(threeCanvas, 0, 0);

    // タイトルテキストを描画
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('JIET X\'mas party 2024', canvas.width / 2, 40);

    // 画像データを生成してシェアメニューを表示
    const imageData = canvas.toDataURL('image/png');
    this.shareManager.showShareMenu(imageData);
  }

  async setupWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.srcObject = stream;
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const loadModel = (url) => new Promise((resolve) => loader.load(url, resolve));

    const [hatGltf, tonakaiGltf] = await Promise.all([
      loadModel('/hat.glb'),
      loadModel('/tonakai.glb')
    ]);

    this.models.hat = hatGltf.scene;
    this.models.tonakai = tonakaiGltf.scene;

    // モデルのマテリアル設定を調整
    Object.values(this.models).forEach(model => {
      model.rotation.set(Math.PI / 2, Math.PI, 0);
      model.traverse((child) => {
        if (child.isMesh) {
          // 透明度の設定を削除し、完全な不透明度に
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.side = THREE.DoubleSide;
          // デプステストを有効に
          child.material.depthTest = true;
          child.material.depthWrite = true;
        }
      });
    });
  }

  updateModelTransform(model, position, rotation) {
    model.position.set(position.x, position.y, position.z);
    model.rotation.order = 'YXZ';
    model.rotation.set(
      rotation.x + Math.PI / 2,
      rotation.y + Math.PI,
      rotation.z
    );
  }

  async handleFaceDetection() {
    const results = await this.faceDetector.detectFace(this.videoElement);
    if (!results?.faceLandmarks?.length) return;

    const landmarks = results.faceLandmarks[0];
    const forehead = landmarks[10];

    if (!this.faceModels[0]) {
      const modelType = Math.random() < 0.5 ? 'hat' : 'tonakai';
      this.faceModels[0] = {
        model: this.models[modelType].clone(),
        params: this.modelParams[modelType]
      };
      this.sceneManager.scene.add(this.faceModels[0].model);
    }

    const { model, params } = this.faceModels[0];
    const rotation = this.faceDetector.calculateFaceRotation(landmarks);

    // スケーリングファクターを調整して位置合わせを改善
    const scaleFactor = 2.0;
    const position = {
      x: (forehead.x - 0.5) * scaleFactor + params.positionOffset.x,
      y: -(forehead.y - 0.5) * scaleFactor + params.positionOffset.y,
      z: params.positionOffset.z
    };

    const finalRotation = {
      x: rotation.pitch,
      y: -rotation.yaw,
      z: -rotation.roll
    };

    this.updateModelTransform(model, position, finalRotation);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.handleFaceDetection();
    if (this.snowEffect) this.snowEffect.animate();
    this.sceneManager.render();
  }
}