// src/permission_page/requestPermission.js

/**
 * Kullanıcıdan mikrofon erişimi için izin ister.
 * @returns {Promise<void>} İzin verildiğinde çözülen veya hata ile reddedilen bir Promise.
 */
async function requestMicrophonePermission() {
  console.log("Attempting to request microphone permission from iframe script...");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Microphone access GRANTED via iframe.");

    // Tarayıcı sekmesindeki kayıt göstergesinin sürekli görünmemesi için
    // alınan ses akışının izlerini hemen durdur.
    stream.getTracks().forEach(function (track) {
      track.stop();
    });

    // İzin başarıyla alındıktan sonra iframe'i kapatabilir veya bir mesaj gönderebiliriz.
    // Şimdilik sadece konsola log yazıyoruz.
    // İsteğe bağlı: window.close(); // iframe kendini kapatmaya çalışabilir, ancak güvenlik kısıtlamaları olabilir.
    // Veya ana pencereye (content script) mesaj gönder:
    // window.parent.postMessage({ type: 'PERMISSION_GRANTED', success: true }, '*');
  } catch (error) {
    console.error("Error requesting microphone permission via iframe:", error.name, error.message);
    // İsteğe bağlı: ana pencereye (content script) hata mesajı gönder:
    // window.parent.postMessage({ type: 'PERMISSION_DENIED', success: false, error: error.name }, '*');
  }
}

// Sayfa yüklendiğinde izin isteme fonksiyonunu çağır
requestMicrophonePermission();