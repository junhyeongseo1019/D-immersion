// platform.js — AI-HUB 호스트 API 어댑터 (스타터 호환)
// 규칙 108-183에 명시된 platform.* API의 최소 호환 셋.
// 게시된 앱: 호스트가 hash의 nonce를 검증한 뒤 MessageChannel port를 줌 → RPC.
// 로컬 단독 실행: port 없이 동기 fallback (메모리 only, 영속 X).
// 검수 R-STORAGE 회피: 어떤 경우에도 raw 브라우저 저장소를 만지지 않는다.

(function () {
  "use strict";

  const handlers = new Map();
  let pendingId = 1;
  let port = null;
  const inflight = new Map();
  const memStore = new Map();

  function send(method, params) {
    if (!port) return Promise.reject(new Error("platform_unavailable"));
    const id = pendingId++;
    return new Promise((resolve, reject) => {
      inflight.set(id, { resolve, reject });
      try { port.postMessage({ id: id, method: method, params: params || {} }); }
      catch (e) { inflight.delete(id); reject(e); }
    });
  }

  function setupPort(p) {
    port = p;
    port.onmessage = (ev) => {
      const msg = ev.data || {};
      if (msg.id && inflight.has(msg.id)) {
        const { resolve, reject } = inflight.get(msg.id);
        inflight.delete(msg.id);
        if (msg.error) {
          const err = new Error(msg.error.code || "platform_error");
          err.code = msg.error.code;
          reject(err);
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  // 호스트가 postMessage로 platform-handshake 보내면 port 받음
  window.addEventListener("message", (ev) => {
    if (ev.data && ev.data.type === "platform-handshake" && ev.ports && ev.ports[0]) {
      setupPort(ev.ports[0]);
    }
  });

  const platform = {
    user: {
      get() {
        if (port) return send("user.get", {});
        return Promise.resolve({ id: "local", name: "게스트" });
      }
    },
    storage: {
      set(key, value) {
        if (port) return send("storage.set", { key: key, value: value });
        memStore.set(key, value);
        return Promise.resolve({ ok: true });
      },
      get(key) {
        if (port) return send("storage.get", { key: key });
        return Promise.resolve(memStore.has(key) ? memStore.get(key) : null);
      },
      remove(key) {
        if (port) return send("storage.remove", { key: key });
        memStore.delete(key);
        return Promise.resolve({ ok: true });
      }
    },
    notify: { send: () => Promise.reject(new Error("notify_disabled")) },
    files: {
      list:   () => Promise.reject(new Error("files_disabled")),
      get:    () => Promise.reject(new Error("files_disabled")),
      upload: () => Promise.reject(new Error("files_disabled")),
      remove: () => Promise.reject(new Error("files_disabled"))
    },
    data: {
      list:   () => Promise.reject(new Error("data_disabled")),
      create: () => Promise.reject(new Error("data_disabled")),
      update: () => Promise.reject(new Error("data_disabled")),
      remove: () => Promise.reject(new Error("data_disabled"))
    },
    llm:        { chat:    () => Promise.reject(new Error("llm_disabled")) },
    submissions: {
      list:   () => Promise.reject(new Error("submissions_disabled")),
      create: () => Promise.reject(new Error("submissions_disabled")),
      update: () => Promise.reject(new Error("submissions_disabled")),
      remove: () => Promise.reject(new Error("submissions_disabled"))
    },
    report: () => Promise.reject(new Error("report_disabled"))
  };

  window.platform = platform;
})();
