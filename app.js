// app.js - D-immersion web app main logic
// Minimal, journal-like UI: serif titles, generous whitespace, subtle dividers.

(function () {
  "use strict";

  const STORE_KEY = "dimmersion_state_v1";

  function defaultState() {
    return {
      papers: JSON.parse(JSON.stringify(D.papers)),
      meetings: JSON.parse(JSON.stringify(D.labMeetings)),
      schedule: JSON.parse(JSON.stringify(D.defaultSchedule)),
      activeTab: "papers",
      paperSort: "saved_desc",
      activeProjectId: "all",
      paperSearch: "",
      notifications: [],
      uploadingMeetingId: null,
      activeMeetingId: null
    };
  }
  // storage-adapter.js (window.appStorage) — 동기 API, 비동기 영속
  // 게시된 앱에선 platform.storage(BaaS) 경유, 로컬에선 동기 어댑터 캐시 + 비동기 영속
  function loadState() {
    try {
      const raw = window.appStorage && window.appStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }
  function saveState() {
    try {
      if (window.appStorage) window.appStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {}
  }
  const state = loadState();

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function fmtDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }
  function relTime(ts) {
    if (!ts) return "";
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return "방금";
    if (diff < 3600) return Math.floor(diff / 60) + "분 전";
    if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + "일 전";
    return fmtDate(ts);
  }
  function escapeHTML(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function displayName(member) {
    if (!member) return "?";
    return member.alias || member.name;
  }
  function initials(name) { return (name || "?").slice(0, 1); }

  // ----- Tab switching -------------------------------------------------
  function switchTab(tab) {
    state.activeTab = tab;
    saveState();
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    ["papers", "meetings", "paper-detail", "meeting-detail"].forEach((v) => {
      const el = $("#view-" + v);
      if (el) el.classList.toggle("active", v === tab);
    });
  }
  $$(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      const tab = t.dataset.tab;
      if (tab === "papers") switchTab("papers");
      if (tab === "meetings") switchTab("meetings");
    });
  });

  // ----- Papers ---------------------------------------------------------
  function getFilteredPapers() {
    let list = state.papers.slice();
    if (state.activeProjectId !== "all") {
      list = list.filter((p) => p.projectId === state.activeProjectId);
    }
    if (state.paperSearch.trim()) {
      const q = state.paperSearch.toLowerCase();
      list = list.filter((p) =>
        (p.title + " " + (p.authors || "") + " " + (p.journal || "")).toLowerCase().includes(q)
      );
    }
    if (state.paperSort === "saved_desc") {
      list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    } else {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return list;
  }

  function renderProjectChips() {
    const row = $("#project-chips");
    const items = [{ id: "all", name: "전체", count: state.papers.length }];
    for (const p of D.projects) {
      items.push({ id: p.id, name: p.short, count: state.papers.filter((x) => x.projectId === p.id).length });
    }
    row.innerHTML = items.map((p) => `
      <button class="chip ${state.activeProjectId === p.id ? "active" : ""}" data-project="${p.id}">
        ${escapeHTML(p.name)}<span class="count">${p.count}</span>
      </button>
    `).join("");
    row.querySelectorAll(".chip").forEach((c) => {
      c.addEventListener("click", () => {
        state.activeProjectId = c.dataset.project;
        renderPapers();
        renderProjectChips();
        saveState();
      });
    });
  }

  function renderPapers() {
    const list = getFilteredPapers();
    const container = $("#paper-list");
    if (!list.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="icon">📚</div>
          <p class="empty-title">아직 저장된 논문이 없어요</p>
          <p>오른쪽 아래 + 버튼으로 첫 논문을 추가해 보세요</p>
        </div>`;
      return;
    }
    container.innerHTML = list.map((p) => {
      const proj = projectById(p.projectId);
      return `
        <article class="paper-card" data-id="${p.id}">
          <h3>${escapeHTML(p.title)}</h3>
          <div class="meta">
            <span class="project-tag">${escapeHTML(proj ? proj.short : "?")}</span>
            <span class="journal">${escapeHTML(p.journal || "")}</span>
            <span class="year">${p.year || ""}</span>
            <span class="ai-tag">AI</span>
          </div>
          <div class="authors">${escapeHTML(p.authors || "")}</div>
          <div class="footer">
            <div class="status-pills">
              <button class="status-pill ${p.readStatus === "unread"  ? "active" : ""}" data-status="unread"  data-id="${p.id}">안읽음</button>
              <button class="status-pill ${p.readStatus === "reading" ? "active" : ""}" data-status="reading" data-id="${p.id}">읽는중</button>
              <button class="status-pill ${p.readStatus === "done"    ? "active" : ""}" data-status="done"    data-id="${p.id}">읽음</button>
            </div>
            <span class="time">${relTime(p.savedAt)}</span>
            <button class="paper-delete-btn" data-delete="${p.id}" type="button" title="논문 삭제" aria-label="논문 삭제">🗑</button>
          </div>
        </article>`;
    }).join("");

    container.querySelectorAll(".paper-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".status-pill") || e.target.closest(".paper-delete-btn")) return;
        openPaperDetail(card.dataset.id);
      });
    });
    container.querySelectorAll(".paper-delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        confirmDeletePaper(btn.dataset.delete);
      });
    });
    container.querySelectorAll(".status-pill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const paper = state.papers.find((p) => p.id === id);
        if (paper) {
          paper.readStatus = btn.dataset.status;
          paper.updatedAt = Date.now();
          saveState();
          renderPapers();
        }
      });
    });
  }

  $("#sort-toggle").addEventListener("click", () => {
    state.paperSort = state.paperSort === "saved_desc" ? "updated_desc" : "saved_desc";
    $("#sort-label").textContent = state.paperSort === "saved_desc" ? "최신 저장순" : "최신 수정순";
    $("#sort-arrow").textContent = state.paperSort === "saved_desc" ? "↓" : "↑";
    saveState();
    renderPapers();
  });
  $("#paper-search").addEventListener("input", (e) => {
    state.paperSearch = e.target.value;
    saveState();
    renderPapers();
  });

  function openPaperDetail(id) {
    const p = state.papers.find((x) => x.id === id);
    if (!p) return;
    const proj = projectById(p.projectId);
    const body = $("#paper-detail-body");
    body.innerHTML = `
      <h2>${escapeHTML(p.title)}</h2>
      <div class="meta">
        <div class="authors">${escapeHTML(p.authors || "")}</div>
        <div><em>${escapeHTML(p.journal || "")}</em> ${p.year || ""}</div>
        ${p.doi ? `<div style="font-family: monospace; font-size: 11px; color: var(--muted); margin-top: 2px;">${escapeHTML(p.doi)}</div>` : ""}
      </div>

      <div class="section-title">Project</div>
      <div class="change-project">
        <select id="change-project-select" data-id="${p.id}">
          ${D.projects.map((pr) => `<option value="${pr.id}" ${pr.id === p.projectId ? "selected" : ""}>${escapeHTML(pr.short)}</option>`).join("")}
        </select>
        <span class="ai-meta">AI auto-classified</span>
      </div>

      <div class="ai-comment-block">
        <div class="ai-comment-head">
          <span class="ai-comment-tag">AI 첨언</span>
          <span class="ai-comment-project">${escapeHTML(proj ? proj.short : "?")}</span>
        </div>
        <div class="ai-comment-body">${escapeHTML((proj && proj.aiComment) || "이 프로젝트에 대한 AI 첨언이 아직 없어요.")}</div>
      </div>

      <div class="section-title">Status</div>
      <select id="change-read-status" data-id="${p.id}">
        <option value="unread"  ${p.readStatus === "unread"  ? "selected" : ""}>안읽음</option>
        <option value="reading" ${p.readStatus === "reading" ? "selected" : ""}>읽는중</option>
        <option value="done"    ${p.readStatus === "done"    ? "selected" : ""}>읽음</option>
      </select>

      <div class="section-title">Abstract</div>
      <div class="abstract">${escapeHTML(p.abstract || "초록 정보가 없습니다.")}</div>

      <div class="section-title">My Notes</div>
      <div class="notes-box ${p.notes ? "" : "empty"}">${p.notes ? escapeHTML(p.notes) : "아직 메모가 없습니다."}</div>

      <div class="section-title">Saved</div>
      <div style="font-size: 12px; color: var(--secondary); font-style: italic;">
        ${fmtDate(p.savedAt)}  ·  modified ${relTime(p.updatedAt)}
      </div>

      <div class="actions" style="margin-top: 28px;">
        <button class="btn btn-secondary" id="paper-delete-btn" type="button">이 논문 삭제</button>
      </div>
    `;

    $("#change-project-select").addEventListener("change", (e) => {
      p.projectId = e.target.value;
      p.updatedAt = Date.now();
      saveState();
      renderPapers();
      renderProjectChips();
      openPaperDetail(p.id);
    });
    $("#change-read-status").addEventListener("change", (e) => {
      p.readStatus = e.target.value;
      p.updatedAt = Date.now();
      saveState();
      renderPapers();
      openPaperDetail(p.id);
    });
    const delBtn = $("#paper-delete-btn");
    if (delBtn) delBtn.addEventListener("click", () => confirmDeletePaper(p.id));
    switchTab("paper-detail");
  }
  $("#paper-back-btn").addEventListener("click", () => switchTab("papers"));

  // ----- Paper delete (with in-page confirm) ---------------------------
  function confirmDeletePaper(id) {
    const p = state.papers.find((x) => x.id === id);
    if (!p) return;
    const overlay = document.createElement("div");
    overlay.className = "modal-back active";
    overlay.innerHTML = (
      '<div class="modal confirm-modal">' +
      '<h3>논문을 삭제할까요?</h3>' +
      '<p class="confirm-desc">' + escapeHTML(p.title) + '</p>' +
      '<p class="confirm-sub">이 논문은 라이브러리에서 영구적으로 제거돼요. 되돌릴 수 없어요.</p>' +
      '<div class="actions">' +
      '<button class="btn btn-secondary" data-confirm-cancel type="button">취소</button>' +
      '<button class="btn btn-primary confirm-delete-go" data-confirm-go type="button">삭제</button>' +
      '</div>' +
      '</div>'
    );
    document.body.appendChild(overlay);
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector("[data-confirm-cancel]").addEventListener("click", close);
    overlay.querySelector("[data-confirm-go]").addEventListener("click", () => {
      deletePaper(id);
      close();
    });
  }
  function deletePaper(id) {
    const p = state.papers.find((x) => x.id === id);
    if (!p) return;
    const wasInDetail = state.activeTab === "paper-detail";
    state.papers = state.papers.filter((x) => x.id !== id);
    saveState();
    renderPapers();
    renderProjectChips();
    pushNotification("논문이 삭제됐어요: " + p.title.slice(0, 30) + (p.title.length > 30 ? "…" : ""));
    if (wasInDetail) switchTab("papers");
  }

  // ----- Add paper modal ------------------------------------------------
  function openAddPaper() {
    $("#ap-title").value = "";
    $("#ap-authors").value = "";
    $("#ap-journal").value = "";
    $("#ap-year").value = "";
    $("#ap-abstract").value = "";
    $("#ap-notes").value = "";
    $("#ap-ai-result").style.display = "none";
    $("#add-paper-modal").classList.add("active");
  }
  function closeAddPaper() { $("#add-paper-modal").classList.remove("active"); }
  $("#add-paper-btn").addEventListener("click", openAddPaper);
  $("#ap-cancel").addEventListener("click", closeAddPaper);

  function updateAIPreview() {
    const title = $("#ap-title").value;
    if (!title.trim()) { $("#ap-ai-result").style.display = "none"; return; }
    const c = D.classifyPaper({
      title, abstract: $("#ap-abstract").value, authors: $("#ap-authors").value
    });
    const proj = projectById(c.projectId);
    $("#ap-ai-result").innerHTML = `
      <strong>AI 자동 분류</strong>
      → <b>${escapeHTML(proj ? proj.name : "분류 불가")}</b>
    `;
    $("#ap-ai-result").style.display = "block";
  }
  ["ap-title", "ap-abstract", "ap-authors"].forEach((id) => {
    $("#" + id).addEventListener("input", updateAIPreview);
  });

  $("#ap-save").addEventListener("click", () => {
    const title = $("#ap-title").value.trim();
    if (!title) { pushNotification("제목을 입력하세요"); return; }
    const c = D.classifyPaper({
      title,
      abstract: $("#ap-abstract").value,
      authors: $("#ap-authors").value
    });
    const newPaper = {
      id: "paper_" + Date.now(),
      title,
      authors: $("#ap-authors").value,
      journal: $("#ap-journal").value,
      year: parseInt($("#ap-year").value, 10) || new Date().getFullYear(),
      abstract: $("#ap-abstract").value,
      notes: $("#ap-notes").value,
      savedAt: Date.now(),
      updatedAt: Date.now(),
      readStatus: "unread",
      tags: [],
      projectId: c.projectId,
      aiSuggestedProjectId: c.projectId,
      aiConfidence: c.confidence
    };
    state.papers.unshift(newPaper);
    saveState();
    closeAddPaper();
    renderPapers();
    renderProjectChips();
    const proj = projectById(c.projectId);
    pushNotification(`AI 분류됨: ${proj ? proj.short : "?"}`);
  });

  // ----- Notifications --------------------------------------------------
  function pushNotification(text, durationMs) {
    state.notifications.push({ id: "n_" + Date.now(), text, until: Date.now() + (durationMs || 5000) });
    saveState();
    renderNotifications();
  }
  function renderNotifications() {
    const area = $("#notif-area");
    const now = Date.now();
    state.notifications = state.notifications.filter((n) => n.until > now);
    if (!state.notifications.length) { area.innerHTML = ""; return; }
    area.innerHTML = state.notifications.map((n) => `
      <div class="notif-banner" data-id="${n.id}">
        <div class="dot"></div>
        <span>${escapeHTML(n.text)}</span>
        <button data-dismiss="${n.id}">닫기</button>
      </div>
    `).join("");
    area.querySelectorAll("[data-dismiss]").forEach((b) => {
      b.addEventListener("click", () => {
        state.notifications = state.notifications.filter((n) => n.id !== b.dataset.dismiss);
        saveState();
        renderNotifications();
      });
    });
  }

  // ----- Schedule setting ----------------------------------------------
  function renderSchedule() {
    $("#sched-day").value = state.schedule.day;
    $("#sched-time").value = state.schedule.time;
  }
  $("#sched-day").addEventListener("change", (e) => {
    state.schedule.day = e.target.value; saveState(); renderMeetings();
  });
  $("#sched-time").addEventListener("change", (e) => {
    state.schedule.time = e.target.value; saveState(); renderMeetings();
  });

  // ----- Lab meetings ---------------------------------------------------
  function renderMeetings() {
    const sorted = state.meetings.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!sorted.length) {
      $("#lm-week-chips").innerHTML = "";
      $("#lm-list").innerHTML = `<div class="empty"><div class="icon">🐕</div><p class="empty-title">예정된 랩미팅이 없어요</p><p>위에서 요일·시간을 정하면 알림이 와요</p></div>`;
      return;
    }
    // Default to most recent meeting
    if (!state.activeMeetingId || !sorted.find((m) => m.id === state.activeMeetingId)) {
      state.activeMeetingId = sorted[0].id;
      saveState();
    }
    const activeId = state.activeMeetingId;
    const activeM = sorted.find((m) => m.id === activeId);

    // Render week chips
    const chips = $("#lm-week-chips");
    chips.innerHTML = sorted.map((m) => {
      const isActive = m.id === activeId;
      const shortLabel = m.title.replace(/Lab Meeting/i, "").trim() || m.date;
      return `<button class="week-chip ${isActive ? "active" : ""}" data-week="${m.id}">${escapeHTML(shortLabel)}</button>`;
    }).join("");
    chips.querySelectorAll(".week-chip").forEach((c) => {
      c.addEventListener("click", () => {
        state.activeMeetingId = c.dataset.week;
        saveState();
        renderMeetings();
      });
    });

    // Render only the active meeting card
    const list = $("#lm-list");
    const m = activeM;
    const isUploading = state.uploadingMeetingId === m.id;
    const uploadLabel = isUploading ? "분석 중..." : (m.status === "completed" ? "노트 다시 업로드" : "📎 노트 업로드");
    list.innerHTML = `
      <article class="lm-card ${m.status === "scheduled" ? "upcoming" : ""}" data-id="${m.id}">
        <div class="lm-head">
          <div class="lm-date">${m.date}  (${m.scheduledDay})</div>
          <div class="lm-badge ${m.status}">${m.status === "scheduled" ? "Upcoming" : m.status === "in_progress" ? "Live" : "Done"}</div>
        </div>
        <h3>${escapeHTML(m.title)}</h3>
        <div class="lm-time">${m.scheduledTime}  ·  ${m.duration} min  ·  ${m.attendees.length} attendees</div>
        ${m.entries && m.entries.length ? `
          <div class="lm-students">
            ${m.entries.map((e) => {
              const mem = teamById(e.memberId);
              const color = mem ? mem.color : "#999";
              const progress = typeof e.progress === "number" ? e.progress : null;
              return `
                <div class="lm-student-mini" data-member="${e.memberId}">
                  <div class="lm-student-mini-avatar" style="background: ${color};">${escapeHTML(initials(displayName(mem)))}</div>
                  <div class="lm-student-mini-info">
                    <div class="lm-student-mini-name">
                      ${escapeHTML(displayName(mem))}
                      <span class="lm-student-mini-role">${escapeHTML(mem ? mem.roleLabel : "")}</span>
                    </div>
                    ${progress !== null ? `
                      <div class="lm-student-mini-progress">
                        <div class="lm-student-mini-track"><div class="lm-student-mini-fill" style="width: ${progress}%; background: ${color};"></div></div>
                        <span>${progress}%</span>
                      </div>
                    ` : `<div class="lm-student-mini-progress-empty">노트 업로드 전</div>`}
                  </div>
                  <button class="lm-student-mini-btn" data-student-detail="${e.memberId}">상세보기</button>
                </div>`;
            }).join("")}
          </div>
        ` : `<div class="lm-entry-empty">📋 아직 기록된 summary/feedback이 없어요.<br/><b>노트 업로드 → AI 분석</b>을 누르면 자동 생성됩니다.</div>`}
        ${(m.uploadedFiles && m.uploadedFiles.length) ? `
          <div class="lm-uploaded-files">업로드된 노트: ${m.uploadedFiles.map((f) => escapeHTML(f.name)).join(", ")}</div>
        ` : ""}
        <div class="lm-card-actions">
          <button class="lm-detail-btn" data-detail="${m.id}">전체 상세 보기</button>
          <button class="lm-rec-btn ${isUploading ? "uploading" : ""}" data-upload="${m.id}" ${isUploading ? "disabled" : ""}>
            ${uploadLabel}
          </button>
        </div>
      </article>`;

    list.querySelectorAll("[data-upload]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerNoteUpload(btn.dataset.upload);
      });
    });
    list.querySelectorAll("[data-detail]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openMeetingDetail(btn.dataset.detail);
      });
    });
    list.querySelectorAll("[data-student-detail]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openStudentDetail(btn.dataset.studentDetail);
      });
    });
  }

  function openMeetingDetail(id) {
    const m = state.meetings.find((x) => x.id === id);
    if (!m) return;
    $("#lm-detail-title").textContent = m.title;
    $("#lm-detail-eyebrow").textContent = m.date;
    const body = $("#lm-detail-body");

    body.innerHTML = `
      <div class="lm-hero">
        <div class="lm-info">${m.date} (${m.scheduledDay})  ·  ${m.scheduledTime}  ·  ${m.duration} min  ·  ${m.attendees.length} attendees</div>
      </div>

      <div class="lm-section">
        <h4>Attendees</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; line-height: 1.6;">
          ${m.attendees.map((aid) => {
            const mem = teamById(aid);
            return `<span style="font-size: 13px;"><strong>${escapeHTML(displayName(mem))}</strong> <span style="color: var(--secondary); font-style: italic; font-size: 11px;">${escapeHTML(mem ? mem.roleLabel : "")}</span></span>`;
          }).join(" · ")}
        </div>
      </div>

      ${(m.entries && m.entries.length) ? `
        <div class="lm-section">
          <h4>AI Summary · by participant</h4>
          ${m.entries.map((e) => {
            const mem = teamById(e.memberId);
            const progress = typeof e.progress === "number" ? e.progress : null;
            return `
              <article class="lm-entry" data-mid="${e.memberId}">
                <div class="head">
                  <div class="avatar" style="background: ${mem ? mem.color : "#999"};">${escapeHTML(initials(displayName(mem)))}</div>
                  <div>
                    <span class="name">${escapeHTML(displayName(mem))}</span>
                    <span class="role">${escapeHTML(mem ? mem.roleLabel : "")}</span>
                  </div>
                </div>
                ${progress !== null ? `
                  <div class="progress-row">
                    <div class="progress-track"><div class="progress-fill" style="width: ${progress}%; background: ${mem ? mem.color : "var(--accent)"};"></div></div>
                    <span class="progress-label">${progress}%</span>
                  </div>
                ` : ""}

                <div class="headline">
                  <span class="headline-label">🔬 실험 상황</span>
                  <p class="summary">${escapeHTML(e.summary)}</p>
                </div>

                ${e.challenges ? `
                  <div class="headline headline-challenge">
                    <span class="headline-label">⚠️ Challenge</span>
                    <p class="challenges">${escapeHTML(e.challenges)}</p>
                  </div>
                ` : ""}

                <div class="headline headline-feedback">
                  <span class="headline-label">💬 교수님 Feedback</span>
                  <p class="feedback">${escapeHTML(e.feedback)}</p>
                </div>

                ${(e.highlights && e.highlights.length) || (e.nextSteps && e.nextSteps.length) ? `
                  <div class="entry-minor">
                    ${(e.highlights && e.highlights.length) ? `
                      <ul class="highlights">${e.highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join("")}</ul>
                    ` : ""}
                    ${(e.nextSteps && e.nextSteps.length) ? `
                      <div class="next-steps">다음 주 → ${e.nextSteps.map(escapeHTML).join(" · ")}</div>
                    ` : ""}
                  </div>
                ` : ""}
              </article>`;
          }).join("")}
        </div>
      ` : ""}

      ${m.transcript ? `
        <div class="lm-section">
          <h4>상세 회의 기록 · 업로드 노트 기반</h4>
          <div class="transcript">
            ${m.transcript.map((turn) => {
              const mem = teamById(turn.speaker);
              return `
                <div class="turn speaker-${turn.speaker}">
                  <div class="meta">
                    <span>${turn.t}</span>
                    <span class="speaker">${escapeHTML(displayName(mem))}${mem && mem.role === "professor" ? " · Supervisor" : ""}</span>
                  </div>
                  <div>${escapeHTML(turn.text)}</div>
                </div>`;
            }).join("")}
          </div>
        </div>
      ` : ""}
    `;
    switchTab("meeting-detail");
  }
  $("#lm-back-btn").addEventListener("click", () => switchTab("meetings"));

  // ----- AI follow-up check: did this week's upload address last week's ask? --
  // Splits a feedback/next-step sentence into keywords and checks how many of
  // them show up in the following week's uploaded note (summary/highlights/
  // challenges). This is the same kind of keyword matching used for paper
  // auto-classification — a mock stand-in for a real NLP diff.
  function tokenize(text) {
    return String(text || "")
      .split(/[\s,()·\/\-–:;→"'.]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
  }
  function checkFollowUp(askText, laterText) {
    const tokens = tokenize(askText);
    if (!tokens.length) return null;
    const hay = laterText.toLowerCase();
    const matched = tokens.filter((t) => hay.includes(t.toLowerCase()));
    const ratio = matched.length / tokens.length;
    return ratio >= 0.3;
  }
  function computeFollowUp(prevWeek, currentWeek) {
    if (!prevWeek || !prevWeek.nextSteps || !prevWeek.nextSteps.length) return null;
    if (!currentWeek) return null;
    const laterText = [currentWeek.summary, (currentWeek.highlights || []).join(" "), currentWeek.challenges]
      .filter(Boolean).join(" ");
    return prevWeek.nextSteps.map((step) => ({ text: step, done: checkFollowUp(step, laterText) }));
  }

  // ----- Student detail (modal sheet) ----------------------------------
  function aggregateStudentHistory(memberId) {
    const out = {
      memberId,
      weekly: [],
      totalMeetings: 0,
      avgProgress: null,
      latestProgress: null,
      paperCount: 0,
      projectCount: 0
    };
    const projs = new Set();
    for (const m of state.meetings) {
      const e = m.entries && m.entries.find((x) => x.memberId === memberId);
      if (!e) continue;
      out.totalMeetings += 1;
      out.weekly.push({
        meetingId: m.id,
        meetingTitle: m.title,
        date: m.date,
        progress: typeof e.progress === "number" ? e.progress : null,
        summary: e.summary || "",
        feedback: e.feedback || "",
        highlights: e.highlights || [],
        challenges: e.challenges || "",
        nextSteps: e.nextSteps || []
      });
    }
    out.weekly.sort((a, b) => (a.date < b.date ? 1 : -1));
    // weekly is newest-first, so weekly[idx+1] is the meeting before weekly[idx]
    out.weekly.forEach((w, idx) => {
      w.followUp = computeFollowUp(out.weekly[idx + 1], w);
    });
    const progresses = out.weekly.map((w) => w.progress).filter((v) => typeof v === "number");
    if (progresses.length) {
      out.avgProgress = Math.round(progresses.reduce((s, v) => s + v, 0) / progresses.length);
      out.latestProgress = out.weekly[0].progress;
    }
    for (const p of state.papers) {
      const mem = teamById(memberId);
      if (p.projectId) projs.add(p.projectId);
    }
    out.paperCount = projs.size ? state.papers.length : 0; // 단순 카운트
    out.projectCount = projs.size;
    return out;
  }

  function openStudentDetail(memberId) {
    const mem = teamById(memberId);
    if (!mem) return;
    const h = aggregateStudentHistory(memberId);
    const body = $("#student-modal-body");

    const weeklyHTML = h.weekly.length ? h.weekly.map((w, idx) => `
      <div class="sm-week">
        <div class="sm-week-head">
          <span class="sm-week-label">${idx === 0 ? "이번 주" : `${idx + 1}주 전`}</span>
          <span class="sm-week-date">${w.date}</span>
        </div>
        ${w.progress !== null ? `
          <div class="sm-progress-row">
            <div class="sm-progress-track"><div class="sm-progress-fill" style="width: ${w.progress}%; background: ${mem.color};"></div></div>
            <span class="sm-progress-label">${w.progress}%</span>
          </div>
        ` : ""}

        ${(w.followUp && w.followUp.length) ? `
          <div class="sm-followup">
            <span class="sm-headline-label">📋 지난주 피드백 반영 현황 · AI 자동 대조</span>
            <ul class="sm-followup-list">
              ${w.followUp.map((f) => `
                <li class="${f.done ? "done" : "pending"}">
                  <span class="sm-followup-text">${f.done ? "✅" : "⚠️"} ${escapeHTML(f.text)}</span>
                  <span class="sm-followup-tag">${f.done ? "반영함" : "아직 안 함"}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : ""}

        <div class="sm-headline">
          <span class="sm-headline-label">🔬 실험 상황</span>
          <p class="sm-summary">${escapeHTML(w.summary || "(summary 없음)")}</p>
        </div>

        ${w.challenges ? `
          <div class="sm-headline sm-headline-challenge">
            <span class="sm-headline-label">⚠️ Challenge</span>
            <p class="sm-challenge">${escapeHTML(w.challenges)}</p>
          </div>
        ` : ""}

        <div class="sm-headline sm-headline-feedback">
          <span class="sm-headline-label">💬 교수님 Feedback</span>
          <p class="sm-feedback">${escapeHTML(w.feedback || "(feedback 없음)")}</p>
        </div>

        ${(w.highlights && w.highlights.length) || (w.nextSteps && w.nextSteps.length) ? `
          <div class="sm-minor">
            ${(w.highlights && w.highlights.length) ? `
              <ul class="sm-highlights">${w.highlights.map((x) => `<li>${escapeHTML(x)}</li>`).join("")}</ul>
            ` : ""}
            ${(w.nextSteps && w.nextSteps.length) ? `
              <div class="sm-next">다음 주 → ${w.nextSteps.map(escapeHTML).join(" · ")}</div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    `).join("") : `<div class="lm-entry-empty">아직 랩미팅 기록이 없어요.</div>`;

    body.innerHTML = `
      <div class="sm-hero">
        <div class="sm-avatar" style="background: ${mem.color};">${escapeHTML(mem.character || "🐕")}</div>
        <div class="sm-info">
          <div class="sm-name">${escapeHTML(mem.name)}</div>
          <div class="sm-role">${escapeHTML(mem.roleLabel)}${mem.alias ? " · " + escapeHTML(mem.alias) : ""}</div>
          <div class="sm-char-label">${escapeHTML(mem.characterLabel || "")}</div>
        </div>
      </div>

      <div class="sm-stats">
        <div class="sm-stat">
          <div class="sm-stat-num">${h.totalMeetings}</div>
          <div class="sm-stat-label">참석 랩미팅</div>
        </div>
        <div class="sm-stat">
          <div class="sm-stat-num">${h.latestProgress !== null ? h.latestProgress + "%" : "—"}</div>
          <div class="sm-stat-label">최근 진척도</div>
        </div>
        <div class="sm-stat">
          <div class="sm-stat-num">${h.avgProgress !== null ? h.avgProgress + "%" : "—"}</div>
          <div class="sm-stat-label">평균 진척도</div>
        </div>
        <div class="sm-stat">
          <div class="sm-stat-num">${h.projectCount}</div>
          <div class="sm-stat-label">관련 프로젝트</div>
        </div>
      </div>

      <div class="sm-section-title">주차별 기록</div>
      ${weeklyHTML}

      <div class="actions" style="margin-top: 24px;">
        <button class="btn btn-primary" id="sm-close">닫기</button>
      </div>
    `;

    $("#student-modal").classList.add("active");
    $("#sm-close").addEventListener("click", () => $("#student-modal").classList.remove("active"));
    // 바깥 영역 탭으로도 닫힘
    $("#student-modal").addEventListener("click", (e) => {
      if (e.target.id === "student-modal") $("#student-modal").classList.remove("active");
    }, { once: true });
  }

  // ----- Note upload (replaces the old audio-recording flow) -----------
  // Students + supervisor upload their meeting notes (Word / 한글 / txt / 손글씨 사진)
  // after the lab meeting; AI reads them and produces per-student summary/feedback.
  let pendingUploadMeetingId = null;
  const noteUploadInput = $("#note-upload-input");
  if (noteUploadInput) {
    noteUploadInput.addEventListener("change", (e) => {
      const meetingId = pendingUploadMeetingId;
      const files = Array.from(e.target.files || []);
      e.target.value = ""; // allow re-selecting the same file next time
      if (!meetingId || !files.length) return;
      handleNoteUpload(meetingId, files);
    });
  }

  function triggerNoteUpload(meetingId) {
    if (!noteUploadInput || state.uploadingMeetingId) return;
    pendingUploadMeetingId = meetingId;
    noteUploadInput.click();
  }

  function handleNoteUpload(meetingId, files) {
    const m = state.meetings.find((x) => x.id === meetingId);
    if (!m) return;
    m.uploadedFiles = files.map((f) => ({ name: f.name, uploadedAt: Date.now() }));
    state.uploadingMeetingId = meetingId;
    saveState();
    renderMeetings();
    pushNotification(`노트 업로드됨 (${files.length}개) · AI가 정리 중`);
    setTimeout(() => {
      state.uploadingMeetingId = null;
      simulateAIAnalysis(meetingId);
      saveState();
      renderMeetings();
      pushNotification("AI 분석 완료 · summary · feedback 생성됨");
    }, 3000);
  }

  function simulateAIAnalysis(meetingId) {
    const m = state.meetings.find((x) => x.id === meetingId);
    if (!m) return;
    if (!m.entries || !m.entries.length) {
      const students = m.attendees.filter((id) => id !== "hodonghae");
      m.entries = students.map((sid) => {
        const mem = teamById(sid);
        const name = displayName(mem);
        return {
          memberId: sid,
          progress: 20 + Math.floor(Math.random() * 50),
          summary: `${name}이(가) 업로드한 정리본과 교수님 정리본을 AI가 함께 읽고 정리한 이번 주 진행 상황 요약입니다.`,
          highlights: [
            `${name}의 노트에서 추출한 주요 진행 사항 (AI 추출 항목 1)`,
            `${name}의 노트에서 추출한 주요 진행 사항 (AI 추출 항목 2)`
          ],
          challenges: `${name}이(가) 노트에 적은 어려움/블로커 (AI 추출)`,
          nextSteps: [
            `${name}의 노트에 적힌 다음 주 계획 (AI 추출)`
          ],
          feedback: `교수님이 업로드한 정리본에서 ${name}에게 해당하는 feedback을 AI가 찾아 정리한 내용이 여기에 들어갑니다.`
        };
      });
      m.status = "completed";
    } else {
      m.entries.forEach((e) => { e.progress = Math.min(100, (e.progress || 0) + 5); });
      m.status = "completed";
    }
  }

  function checkScheduleNotification() {
    const now = new Date();
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (dayMap[now.getDay()] !== state.schedule.day) return;
    const [hh, mm] = state.schedule.time.split(":").map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const targetMin = hh * 60 + mm;
    if (Math.abs(nowMin - (targetMin - 30)) < 1) {
      pushNotification("30분 뒤 lab meeting이 시작됩니다");
    }
  }

  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    $("#status-time").textContent = `${hh}:${mm}`;
  }

  function init() {
    $("#sort-label").textContent = state.paperSort === "saved_desc" ? "최신 저장순" : "최신 수정순";
    $("#sort-arrow").textContent = state.paperSort === "saved_desc" ? "↓" : "↑";
    $("#paper-search").value = state.paperSearch || "";

    renderProjectChips();
    renderPapers();
    renderSchedule();
    renderMeetings();
    renderNotifications();
    tickClock();
    setInterval(tickClock, 30000);
    setInterval(renderNotifications, 1000);
    setInterval(checkScheduleNotification, 60000);

    const hash = window.location.hash.replace("#", "");
    if (hash === "meetings") state.activeTab = "meetings";
    if (state.activeTab === "meetings") switchTab("meetings");
    // Deep link: #meeting=lm_004 -> open meeting detail
    const meetMatch = hash.match(/meeting=([\w_]+)/);
    if (meetMatch) {
      setTimeout(() => openMeetingDetail(meetMatch[1]), 50);
    }
    // Deep link: #student=<memberId> -> open student detail modal
    const studMatch = hash.match(/student=([\w]+)/);
    if (studMatch) {
      setTimeout(() => openStudentDetail(studMatch[1]), 80);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
