// Content script — passive metadata collector
// Responds to messages from the service worker requesting page metadata

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "COLLECT_METADATA") {
    let localStorageKeys = [];
    try {
      localStorageKeys = Object.keys(localStorage);
    } catch (e) {
      // Access may be blocked by site policy
    }

    let cookieCount = 0;
    try {
      cookieCount = document.cookie ? document.cookie.split(";").length : 0;
    } catch (e) {
      // Access may be blocked
    }

    const nav = navigator;
    const connectionType =
      nav.connection && nav.connection.effectiveType
        ? nav.connection.effectiveType
        : "unknown";

    sendResponse({
      url: location.href,
      pageTitle: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      localStorageKeys: localStorageKeys,
      cookieCount: cookieCount,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      connectionType: connectionType,
    });
  }
  return true; // Keep message channel open for async response
});
