const video = document.getElementById("video");
const outputCanvas = document.getElementById("outputCanvas");
const captureCanvas = document.getElementById("captureCanvas");
const webcamButton = document.getElementById("webcamButton");
const captureBtn = document.getElementById("capture-btn");
const outputContext = outputCanvas.getContext("2d");
let faceLandmarker;
let isWebcamRunning = false;

async function initializeFaceLandmarker() {
  const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3");
  const filesetResolver = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

async function enableWebcam() {
  if (!faceLandmarker) {
    console.error("FaceLandmarkerがまだロードされていません。");
    return;
  }
  
  if (!isWebcamRunning) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    isWebcamRunning = true;
    webcamButton.innerText = "DISABLE WEBCAM";
    video.addEventListener("loadeddata", predictWebcam);
  } else {
    video.pause();
    video.srcObject.getTracks().forEach(track => track.stop());
    isWebcamRunning = false;
    webcamButton.innerText = "ENABLE WEBCAM";
  }
}

async function predictWebcam() {
  outputCanvas.width = video.videoWidth;
  outputCanvas.height = video.videoHeight;

  if (isWebcamRunning && faceLandmarker) {
    const faceLandmarkerResult = await faceLandmarker.detectForVideo(video, performance.now());
    
    outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputContext.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);

    if (faceLandmarkerResult.faceLandmarks) {
      for (const landmarks of faceLandmarkerResult.faceLandmarks) {
        drawLandmarks(landmarks);
      }
    }
    requestAnimationFrame(predictWebcam);
  }
}

function drawLandmarks(landmarks) {
  outputContext.fillStyle = "red";
  for (const point of landmarks) {
    const x = point.x * outputCanvas.width;
    const y = point.y * outputCanvas.height;
    outputContext.beginPath();
    outputContext.arc(x, y, 2, 0, 2 * Math.PI);
    outputContext.fill();
  }
}

// キャプチャボタン機能
captureBtn.addEventListener("click", () => {
  captureCanvas.width = outputCanvas.width;
  captureCanvas.height = outputCanvas.height;
  const captureContext = captureCanvas.getContext("2d");
  
  // ビデオ映像を描画
  captureContext.drawImage(outputCanvas, 0, 0);
  
  // 画像を保存
  const imageData = captureCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "capture.png";
  link.click();
});

webcamButton.addEventListener("click", enableWebcam);

// 初期化処理
initializeFaceLandmarker();
