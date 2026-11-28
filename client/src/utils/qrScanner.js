export async function startQrCamera(videoElement, onCode) {
  if (!videoElement) {
    throw new Error('Elemen video kamera belum siap.');
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('Browser ini tidak menyediakan akses kamera.');
    error.name = 'NotSupportedError';
    throw error;
  }

  const [{ BrowserQRCodeReader }, jsQrModule] = await Promise.all([
    import('@zxing/browser'),
    import('jsqr')
  ]);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Browser tidak dapat memproses frame kamera.');
  }

  const reader = new BrowserQRCodeReader();
  const controls = await reader.decodeFromConstraints(
    { video: { facingMode: { ideal: 'environment' } } },
    videoElement,
    (result) => {
      if (result) onCode(result.getText());
    }
  );

  const fallbackInterval = window.setInterval(() => {
    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const sourceWidth = videoElement.videoWidth;
    const sourceHeight = videoElement.videoHeight;
    if (!sourceWidth || !sourceHeight) return;

    const scale = Math.min(1, 1280 / Math.max(sourceWidth, sourceHeight));
    canvas.width = Math.max(1, Math.floor(sourceWidth * scale));
    canvas.height = Math.max(1, Math.floor(sourceHeight * scale));
    context.imageSmoothingEnabled = false;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQrModule.default(pixels.data, pixels.width, pixels.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (result) onCode(result.data);
  }, 350);

  return {
    stop() {
      window.clearInterval(fallbackInterval);
      controls.stop();
    }
  };
}

export async function decodeQrFromImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Pilih file gambar yang berisi QR.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran gambar QR maksimal 10 MB.');
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const jsQrModule = await import('jsqr');
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    const scale = Math.min(2, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Browser tidak dapat memproses gambar QR.');
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = jsQrModule.default(pixels.data, pixels.width, pixels.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (qrResult) return qrResult.data;

    const { BrowserQRCodeReader } = await import('@zxing/browser');
    const reader = new BrowserQRCodeReader();
    const result = await reader.decodeFromImageUrl(imageUrl);
    return result.getText();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function getQrCameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Izin kamera ditolak. Izinkan akses kamera di browser lalu coba lagi.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'Kamera tidak ditemukan. Gunakan scan dari gambar QR atau masukkan kode manual.';
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.';
  }
  return error?.message || 'Kamera tidak dapat dibuka. Gunakan scan dari gambar QR atau masukkan kode manual.';
}

export function getQrImageErrorMessage(error) {
  if (typeof error?.name === 'string' && error.name.startsWith('NotFoundException')) {
    return 'QR tidak ditemukan di gambar. Pastikan gambar jelas, tidak terpotong, dan hanya memuat QR.';
  }
  return error?.message || 'Gambar QR tidak dapat dibaca.';
}
