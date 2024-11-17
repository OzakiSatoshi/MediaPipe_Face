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
    this.modelsLoaded = false;
  }

  async initialize() {
    try {
      await this.setupWebcam();
      await this.faceDetector.initialize();
      await this.loadModels();
      this.snowEffect = new SnowEffect(this.sceneManager.scene);
      this.setupCaptureButton();
      this.animate();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  setupCaptureButton() {
    const captureButton = document.querySelector('.capture-button');
    captureButton.addEventListener('click', () => {
      requestAnimationFrame(() => this.captureImage());
    });
  }

  async captureImage() {
    this.sceneManager.render();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const threeCanvas = this.sceneManager.renderer.domElement;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(threeCanvas, 0, 0);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('JIET X\'mas party 2024', canvas.width / 2, 40);

    const imageData = canvas.toDataURL('image/png');
    this.shareManager.showShareMenu(imageData);
  }

  async setupWebcam() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = stream;
      
      return new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      throw error;
    }
  }

  async loadModels() {
    const loader = new GLTFLoader();
    const loadModel = (url) => {
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 1.0;
                child.material.side = THREE.DoubleSide;
                child.material.depthTest = true;
                child.material.depthWrite = true;
                if (child.material.map) {
                  child.material.map.encoding = THREE.sRGBEncoding;
                }
              }
            });
            resolve(gltf);
          },
          undefined,
          reject
        );
      });
    };

    try {
      const [hatGltf, tonakaiGltf] = await Promise.all([
        loadModel('https://cdn.jsdelivr.net/gh/OzakiSatoshi/MediaPipe_Face@c91e2a2a16704610d72d8d4d81739855d869565a/hat.glb'),
        loadModel('https://cdn.jsdelivr.net/gh/OzakiSatoshi/MediaPipe_Face@c91e2a2a16704610d72d8d4d81739855d869565a/tonakai.glb')
      ]);

      this.models.hat = hatGltf.scene.clone();
      this.models.tonakai = tonakaiGltf.scene.clone();

      Object.entries(this.models).forEach(([key, model]) => {
        const scale = this.modelParams[key].scale;
        model.scale.set(scale, scale, scale);
        model.rotation.set(Math.PI / 2, Math.PI, 0);
      });

      this.modelsLoaded = true;
    } catch (error) {
      console.error('Error loading models:', error);
      this.modelsLoaded = false;
    }
  }

  updateModelTransform(model, position, rotation) {
    if (!model) return;
    
    model.position.set(position.x, position.y, position.z);
    model.rotation.order = 'YXZ';
    model.rotation.set(
      rotation.x + Math.PI / 2,
      rotation.y + Math.PI,
      rotation.z
    );
  }

  async handleFaceDetection() {
    if (!this.modelsLoaded) return;

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
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.handleFaceDetection();
      if (this.snowEffect) this.snowEffect.animate();
      this.sceneManager.render();
    }
    requestAnimationFrame(this.animate);
  }
}