export class ShareManager {
  constructor() {
    this.shareMenu = document.querySelector('.share-menu');
    this.setupShareButtons();
  }

  setupShareButtons() {
    const buttons = document.querySelectorAll('.share-button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const platform = button.dataset.platform;
        if (this.currentImageData) {
          this.shareImage(platform, this.currentImageData);
        }
      });
    });
  }

  showShareMenu(imageData) {
    this.currentImageData = imageData;
    this.shareMenu.classList.add('visible');
    
    // 5秒後に自動的に非表示
    setTimeout(() => {
      this.shareMenu.classList.remove('visible');
    }, 5000);
  }

  async shareImage(platform, imageData) {
    switch (platform) {
      case 'x':
        this.shareToX(imageData);
        break;
      case 'facebook':
        this.shareToFacebook(imageData);
        break;
      case 'download':
        this.downloadImage(imageData);
        break;
    }
    this.shareMenu.classList.remove('visible');
  }

  async shareToX(imageData) {
    try {
      // 画像をBlobに変換
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Web Share APIが利用可能な場合
      if (navigator.share) {
        const file = new File([blob], 'jiet-xmas-2024.png', { type: 'image/png' });
        await navigator.share({
          text: 'JIET X\'mas party 2024 #JIET #Xmas',
          files: [file]
        });
      } else {
        // フォールバック: 画像をダウンロードしてXの投稿画面を開く
        const text = encodeURIComponent('JIET X\'mas party 2024 #JIET #Xmas');
        this.downloadImage(imageData);
        window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
      }
    } catch (error) {
      console.error('Error sharing to X:', error);
    }
  }

  async shareToFacebook(imageData) {
    try {
      // 画像をBlobに変換
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Web Share APIが利用可能な場合
      if (navigator.share) {
        const file = new File([blob], 'jiet-xmas-2024.png', { type: 'image/png' });
        await navigator.share({
          text: 'JIET X\'mas party 2024',
          files: [file]
        });
      } else {
        // フォールバック: 画像をダウンロードしてFacebookの共有画面を開く
        this.downloadImage(imageData);
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
      }
    } catch (error) {
      console.error('Error sharing to Facebook:', error);
    }
  }

  downloadImage(imageData) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'jiet-xmas-2024.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}