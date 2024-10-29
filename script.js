document.addEventListener('DOMContentLoaded', function () {
    const captureBtn = document.getElementById('capture-btn');
    const canvas = document.getElementById('arCanvas');
    const video = document.getElementById('video');
    const outputCanvas = document.getElementById('outputCanvas');
    const context = outputCanvas.getContext('2d');
  
    // MediaPipe FaceMesh の設定
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  
    faceMesh.onResults(onResults);
  
    // カメラ映像の取得
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", async () => {
          await faceMesh.send({ image: video });
        });
      })
      .catch((error) => console.error('Error accessing the camera:', error));
  
    // 顔検出結果の処理
    function onResults(results) {
      context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      context.drawImage(results.image, 0, 0, outputCanvas.width, outputCanvas.height);
  
      results.multiFaceLandmarks.forEach((landmarks) => {
        context.beginPath();
        landmarks.forEach((landmark) => {
          const x = landmark.x * outputCanvas.width;
          const y = landmark.y * outputCanvas.height;
          context.arc(x, y, 2, 0, 2 * Math.PI);
        });
        context.fillStyle = "red";
        context.fill();
      });
    }
  
    // ウィンドウサイズ変更時の対応
    function resizeScene() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      outputCanvas.width = width;
      outputCanvas.height = height;
    }
    window.addEventListener('resize', resizeScene);
    window.addEventListener('orientationchange', resizeScene);
    resizeScene();
  
    // 撮影ボタンを押した際に現在のカメラ映像とランドマークをキャプチャする機能
    captureBtn.addEventListener('click', () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const logoImg = document.getElementById('logo-img');
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = outputCanvas.width;
        captureCanvas.height = outputCanvas.height;
        const captureContext = captureCanvas.getContext('2d');
  
        // カメラ映像を描画
        captureContext.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
  
        // ロゴをキャンバスに描画（中央下部に配置）
        const logoWidth = logoImg.width;
        const logoHeight = logoImg.height;
        const x = (captureCanvas.width - logoWidth) / 2;
        const y = captureCanvas.height - logoHeight - 20;
        captureContext.drawImage(logoImg, x, y);
  
        // キャプチャ画像を生成してダウンロード
        const imageData = captureCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'capture.png';
        link.click();
      }
    });
  });
  