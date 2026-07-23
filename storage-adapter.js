// storage-adapter.js — appStorage 동기 API
// 규칙 326줄 권장 패턴을 따르되, 검수 스캐너의 R-STORAGE 경고를 피하기 위해
// raw browser storage (LS/SS)는 일절 사용하지 않고, BaaS platform.storage 또는
// in-memory cache만 사용한다.
//
// - 게시된 앱: window.platform.storage (서버 영속, 앱×사용자 격리)
// - 그 외(미리보기·로컬 단독): 메모리 캐시만 (세션 한정)
//
// 어디서 호출해도 동일한 동기 API:
//   await appStorage.ready;
//   appStorage.getItem(k) / setItem(k, v) / removeItem(k)

(function () {
  "use strict";

  const cache = new Map();
  let readyResolved = false;
  const readyPromise = (async () => {
    // platform.storage 사용 가능 + 호스트에 연결된 경우에만 hydrate 시도
    try {
      if (window.platform && window.platform.storage &&
          typeof window.platform.storage.get === "function" &&
          /platform=/.test(location.hash || "")) {
        // BaaS 모드 — 서버에서 hydrate (best-effort, 실패해도 무관)
        try {
          const v = await window.platform.storage.get("dimmersion_state_v1");
          if (v != null) cache.set("dimmersion_state_v1", v);
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
    readyResolved = true;
  })();

  const appStorage = {
    get ready() { return readyPromise; },
    _isReady() { return readyResolved; },
    getItem(key) {
      if (cache.has(key)) return JSON.stringify(cache.get(key));
      return null;
    },
    setItem(key, value) {
      let parsed;
      try { parsed = JSON.parse(value); } catch (e) { parsed = value; }
      cache.set(key, parsed);
      // BaaS 영속 (게시된 앱 한정, best-effort)
      try {
        if (window.platform && window.platform.storage &&
            /platform=/.test(location.hash || "")) {
          window.platform.storage.set(key, parsed).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    },
    removeItem(key) {
      cache.delete(key);
      try {
        if (window.platform && window.platform.storage &&
            /platform=/.test(location.hash || "")) {
          window.platform.storage.remove(key).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    }
  };

  window.appStorage = appStorage;
})();
