// src/content/injectIframe.js

function injectPermissionIframe() {
  // iframe zaten enjekte edilmiş mi diye kontrol et
  if (document.getElementById("synonaPermissionsIFrame")) {
    console.log("Synona permission iframe already exists.");
    return;
  }

  console.log("Injecting Synona permission iframe...");
  const iframe = document.createElement("iframe");
  iframe.setAttribute("hidden", "hidden"); // iframe'i görünmez yap
  iframe.setAttribute("id", "synonaPermissionsIFrame");
  iframe.setAttribute("allow", "microphone"); // iframe'in mikrofon izni isteyebileceğini belirt

  // chrome.runtime.getURL ile eklenti içindeki dosyanın doğru URL'sini al
  iframe.src = chrome.runtime.getURL("permission.html");

  document.body.appendChild(iframe);

  // İsteğe bağlı: iframe'den mesaj dinle (izin durumu hakkında)
  // window.addEventListener('message', (event) => {
  //   if (event.source === iframe.contentWindow && event.data) {
  //     if (event.data.type === 'PERMISSION_GRANTED') {
  //       console.log('Permission granted message received from iframe');
  //       // iframe'i kaldırabiliriz
  //       iframe.remove();
  //     } else if (event.data.type === 'PERMISSION_DENIED') {
  //       console.log('Permission denied message received from iframe', event.data.error);
  //       iframe.remove();
  //     }
  //   }
  // });

  // Belirli bir süre sonra iframe'i otomatik kaldırmak da bir seçenek olabilir,
  // eğer kullanıcı hiç etkileşimde bulunmazsa.
  // setTimeout(() => {
  //   if (document.getElementById("synonaPermissionsIFrame")) {
  //     console.log("Removing Synona permission iframe due to timeout.");
  //     iframe.remove();
  //   }
  // }, 30000); // 30 saniye sonra
}

// İçerik betiği yüklendiğinde iframe'i enjekte etmeyi dene.
// Bu, eklenti ilk kez etkinleştirildiğinde veya bir sayfa ilk kez yüklendiğinde
// izin isteme diyalogunun görünmesine yardımcı olabilir.
// Ancak, kullanıcı deneyimi açısından bu her sayfada iframe enjekte etmek ideal olmayabilir.
// Daha iyi bir yaklaşım, popup'tan bir mesajla tetiklemek olabilir.

// Şimdilik, basitlik adına sayfa yüklendiğinde enjekte edelim.
// Kullanıcı eğer izin vermezse, bu iframe sayfada kalıcı olabilir.
// Bu yüzden iframe'in kendi kendini kaldırması veya mesajlaşma ile kaldırılması önemlidir.
injectPermissionIframe();


// --- Alternatif: Popup'tan Gelen Mesajla iframe'i Enjekte Etme ---
// Bu daha kontrollü bir yaklaşım olurdu.
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "requestMicPermissionViaIframe") {
//     injectPermissionIframe();
//     sendResponse({ status: "iframe injection initiated" });
//     return true; // Asenkron yanıt için
//   }
// });