import * as THREE from 'three';

export class SnowEffect {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 1000;
    this.createSnow();
  }

  createSnow() {
    const textureLoader = new THREE.TextureLoader();
    const snowTexture = textureLoader.load('/snowflake.png');

    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 20 - 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      map: snowTexture,
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  animate() {
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] -= 0.05;
      if (positions[i * 3 + 1] < -10) {
        positions[i * 3 + 1] = 10;
      }
      // Add slight horizontal movement
      positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.01;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.rotation.y += 0.0001;
  }
}