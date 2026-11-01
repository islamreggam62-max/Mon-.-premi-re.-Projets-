"use strict";

/* ----------------------------- i18n ----------------------------- */
const I18N = {
  fr: {
    overview: "Vue d'ensemble", contracts: "Contrats", analyzer: "Analyseur IA",
    comparison: "Comparaison", risk: "Risques", research: "Recherche juridique",
    assistant: "Assistant juridique", generator: "Generateur de documents",
    settings: "Parametres", admin: "Administration",
    logout: "Deconnexion", run: "Lancer l'analyse", compare: "Comparer",
    newContract: "Nouveau contrat", upload: "Televerser", search: "Rechercher",
    send: "Envoyer", generate: "Generer", loadSamples: "Charger les contrats de demonstration",
    docA: "Document (version A)", docB: "Document (version B)", selectDoc: "Choisir un document",
    llmLocal: "LLM : local", llmOn: "LLM : externe actif",
  },
  ar: {
    overview: "نظرة عامة", contracts: "العقود", analyzer: "محلّل الذكاء الاصطناعي",
    comparison: "المقارنة", risk: "المخاطر", research: "البحث القانوني",
    assistant: "المساعد القانوني", generator: "مولّد الوثائق",
    settings: "الإعدادات", admin: "الإدارة",
    logout: "تسجيل الخروج", run: "بدء التحليل", compare: "قارن",
    newContract: "عقد جديد", upload: "رفع", search: "بحث",
    send: "إرسال", generate: "توليد", loadSamples: "تحميل عقود تجريبية",
    docA: "الوثيقة (النسخة أ)", docB: "الوثيقة (النسخة ب)", selectDoc: "اختر وثيقة",
    llmLocal: "الذكاء الاصطناعي: محلي", llmOn: "الذكاء الاصطناعي: خارجي مفعّل",
  },
};
let LANG = localStorage.getItem("naftal_lang") || "fr";
const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.fr[k] || k;

/* ----------------------------- state ----------------------------- */
const state = { user: null, docs: [], contracts: [], section: "overview", chat: [], lastComparisonId: null };

/* ----------------------------- helpers ----------------------------- */
const $ = (sel) => document.querySelector(sel);
function h(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

async function api(method, path, body, isForm) {
  const opts = { method, credentials: "same-origin", headers: {} };
  if (body !== undefined) {
    if (isForm) { opts.body = body; }
    else { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  }
  const res = await fetch(path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const msg = (data && data.detail) ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function docLabel(d) {
  const v = d.version_label ? ` — ${d.version_label}` : "";
  const ok = d.extraction_ok ? "" : " ⚠";
  return `#${d.id} ${d.filename}${v}${ok}`;
}
function sevLabel(s) { return ({ CRITICAL: "Critique", HIGH: "Eleve", MEDIUM: "Moyen", LOW: "Faible", INFO: "Info" }[s] || s); }
function canWrite() { return state.user && (state.user.role === "admin" || state.user.role === "juriste"); }

/* ----------------------------- auth ----------------------------- */
async function doLogin(e) {
  e.preventDefault();
  const err = $("#login-error");
  err.classList.add("hidden");
  try {
    state.user = await api("POST", "/api/auth/login", { email: $("#login-email").value, password: $("#login-password").value });
    await boot();
  } catch (ex) { err.textContent = ex.message; err.classList.remove("hidden"); }
}

async function doLogout() {
  try { await api("POST", "/api/auth/logout"); } catch (e) {}
  state.user = null;
  $("#app").classList.add("hidden");
  $("#login").classList.remove("hidden");
}

/* ----------------------------- shell ----------------------------- */
const NAV = [
  ["overview", "▣"], ["contracts", "▤"], ["analyzer", "⚖"], ["comparison", "⇄"],
  ["risk", "⚠"], ["research", "§"], ["assistant", "💬"], ["generator", "⬇"], ["settings", "⚙"],
];

function renderNav() {
  const items = NAV.slice();
  if (state.user && state.user.role === "admin") items.push(["admin", "👤"]);
  $("#nav").innerHTML = items.map(([key, ico]) =>
    `<button data-sec="${key}" class="${state.section === key ? "active" : ""}"><span class="ico">${ico}</span><span>${h(t(key))}</span></button>`
  ).join("");
  $("#nav").querySelectorAll("button").forEach((b) => b.onclick = () => { navigate(b.dataset.sec); $("#sidebar").classList.remove("open"); });
}

function navigate(sec) {
  state.section = sec;
  $("#page-title").textContent = t(sec);
  renderNav();
  const r = RENDERERS[sec];
  if (r) r();
}

function applyLang() {
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  $("#logout-btn").textContent = t("logout");
  $("#page-title").textContent = t(state.section);
  renderNav();
  const r = RENDERERS[state.section]; if (r) r();
}

async function boot() {
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#user-label").textContent = `${state.user.full_name || state.user.email} (${state.user.role})`;
  try {
    const s = await api("GET", "/api/settings");
    const badge = $("#llm-badge");
    if (s.llm && s.llm.enabled) { badge.textContent = t("llmOn"); badge.className = "badge-llm on"; }
    else { badge.textContent = t("llmLocal"); badge.className = "badge-llm off"; }
  } catch (e) {}
  navigate("overview");
}

/* ----------------------------- renderers ----------------------------- */
const C = () => $("#content");
function loading() { C().innerHTML = '<div class="card"><span class="spin" style="border-color:#ccc;border-top-color:var(--green)"></span> Chargement…</div>'; }
function errBox(msg) { return `<div class="error-box">${h(msg)}</div>`; }

async function refreshDocs() { state.docs = await api("GET", "/api/documents"); }

/* ---- Overview ---- */
async function renderOverview() {
  loading();
  try {
    const o = await api("GET", "/api/overview");
    const rd = o.risk_distribution;
    const expiring = o.expiring_soon.map((e) =>
      `<tr><td>${h(e.title)}</td><td>${h(e.reference)}</td><td>${h(e.expiry_date)}</td><td><span class="pill ${e.days < 30 ? "HIGH" : "MEDIUM"}">${e.days} j</span></td></tr>`
    ).join("") || `<tr><td colspan="4" class="muted">Aucune echeance dans les 90 jours.</td></tr>`;
    C().innerHTML = `
      <div class="grid cols-4">
        <div class="stat"><div class="n">${o.contracts}</div><div class="l">Contrats</div></div>
        <div class="stat"><div class="n">${o.documents}</div><div class="l">Documents</div></div>
        <div class="stat"><div class="n">${o.analyses}</div><div class="l">Analyses realisees</div></div>
        <div class="stat"><div class="n">${rd.critique + rd.eleve}</div><div class="l">Documents a risque eleve/critique</div></div>
      </div>
      <div class="card">
        <h2>Repartition des risques (derniere analyse par document)</h2>
        <div class="row">
          <span class="pill LOW">Faible : ${rd.faible}</span>
          <span class="pill MEDIUM">Moyen : ${rd.moyen}</span>
          <span class="pill HIGH">Eleve : ${rd.eleve}</span>
          <span class="pill CRITICAL">Critique : ${rd.critique}</span>
        </div>
      </div>
      <div class="card">
        <h2>Echeances a venir (90 jours)</h2>
        <table><thead><tr><th>Contrat</th><th>Reference</th><th>Expiration</th><th>Delai</th></tr></thead><tbody>${expiring}</tbody></table>
      </div>
      ${canWrite() ? `<div class="card"><h2>Demarrage rapide</h2><p class="muted">Chargez deux contrats de demonstration synthetiques pour tester l'analyse et la comparaison.</p><button class="btn" id="load-samples">${h(t("loadSamples"))}</button><span id="samples-msg"></span></div>` : ""}
    `;
    const ls = $("#load-samples");
    if (ls) ls.onclick = async () => {
      ls.disabled = true; $("#samples-msg").textContent = " Chargement…";
      try { await api("POST", "/api/documents/load-samples"); $("#samples-msg").innerHTML = ' <span class="ok-box" style="display:inline-block">Contrats de demonstration charges.</span>'; await refreshDocs(); }
      catch (e) { $("#samples-msg").innerHTML = errBox(e.message); }
      ls.disabled = false;
    };
  } catch (e) { C().innerHTML = errBox(e.message); }
}

/* ---- Contracts ---- */
async function renderContracts() {
  loading();
  try {
    const [contracts, filters] = await Promise.all([api("GET", "/api/contracts"), api("GET", "/api/contracts/filters")]);
    state.contracts = contracts;
    const rows = contracts.map((c) => `
      <tr>
        <td><strong>${h(c.title)}</strong><br><span class="muted">${h(c.contract_type || "")}</span></td>
        <td>${h(c.reference || "")}</td>
        <td>${h(c.counterparty || "")}</td>
        <td>${h(c.department || "")}</td>
        <td>${h(c.expiry_date || "")}</td>
        <td><span class="pill INFO">${c.document_count}</span></td>
        <td>
          <button class="btn ghost sm" data-docs="${c.id}">Documents</button>
          ${canWrite() ? `<button class="btn danger sm" data-del="${c.id}">Suppr.</button>` : ""}
        </td>
      </tr>`).join("") || `<tr><td colspan="7" class="muted">Aucun contrat. Creez-en un ou chargez la demonstration.</td></tr>`;

    C().innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div><label>${h(t("search"))}</label><input id="c-q" placeholder="titre, reference, partie…"></div>
          <div><label>Type</label><select id="c-type"><option value="">Tous</option>${filters.types.map((x) => `<option>${h(x)}</option>`).join("")}</select></div>
          <div><label>Departement</label><select id="c-dep"><option value="">Tous</option>${filters.departments.map((x) => `<option>${h(x)}</option>`).join("")}</select></div>
          <div><label>Statut</label><select id="c-stat"><option value="">Tous</option>${filters.statuses.map((x) => `<option>${h(x)}</option>`).join("")}</select></div>
          <button class="btn" id="c-search">${h(t("search"))}</button>
        </div>
        <table><thead><tr><th>Contrat</th><th>Reference</th><th>Partie</th><th>Departement</th><th>Expiration</th><th>Docs</th><th></th></tr></thead><tbody id="c-rows">${rows}</tbody></table>
      </div>
      ${canWrite() ? contractForm() : ""}
      <div id="docs-panel"></div>
    `;
    $("#c-search").onclick = applyContractFilter;
    $("#c-q").onkeydown = (e) => { if (e.key === "Enter") applyContractFilter(); };
    bindContractRows();
    if (canWrite()) bindContractForm();
  } catch (e) { C().innerHTML = errBox(e.message); }
}

function contractForm() {
  return `<div class="card"><h2>${h(t("newContract"))}</h2>
    <div class="grid cols-3">
      <div><label>Titre *</label><input id="nc-title"></div>
      <div><label>Reference</label><input id="nc-ref"></div>
      <div><label>Type</label><input id="nc-type" placeholder="Fourniture, prestation…"></div>
      <div><label>Partie co-contractante</label><input id="nc-cp"></div>
      <div><label>Departement</label><input id="nc-dep" value="Branche Carburants"></div>
      <div><label>Statut</label><select id="nc-stat"><option>actif</option><option>en negociation</option><option>expire</option><option>resilie</option></select></div>
      <div><label>Date d'effet</label><input id="nc-eff" placeholder="AAAA-MM-JJ"></div>
      <div><label>Date d'expiration</label><input id="nc-exp" placeholder="AAAA-MM-JJ"></div>
      <div><label>Date de renouvellement</label><input id="nc-ren" placeholder="AAAA-MM-JJ"></div>
    </div>
    <label>Notes</label><textarea id="nc-notes"></textarea>
    <div id="nc-msg"></div>
    <button class="btn" id="nc-save" style="margin-top:10px">Enregistrer</button>
  </div>`;
}

function bindContractForm() {
  $("#nc-save").onclick = async () => {
    const payload = {
      title: $("#nc-title").value.trim(), reference: $("#nc-ref").value.trim(),
      contract_type: $("#nc-type").value.trim(), counterparty: $("#nc-cp").value.trim(),
      department: $("#nc-dep").value.trim(), status: $("#nc-stat").value,
      effective_date: $("#nc-eff").value.trim() || null, expiry_date: $("#nc-exp").value.trim() || null,
      renewal_date: $("#nc-ren").value.trim() || null, notes: $("#nc-notes").value.trim(),
    };
    if (!payload.title) { $("#nc-msg").innerHTML = errBox("Le titre est obligatoire."); return; }
    try { await api("POST", "/api/contracts", payload); renderContracts(); }
    catch (e) { $("#nc-msg").innerHTML = errBox(e.message); }
  };
}

async function applyContractFilter() {
  const qs = new URLSearchParams({ query: $("#c-q").value, contract_type: $("#c-type").value, department: $("#c-dep").value, status: $("#c-stat").value });
  const rows = await api("GET", "/api/contracts?" + qs.toString());
  state.contracts = rows;
  $("#c-rows").innerHTML = rows.map((c) => `
    <tr><td><strong>${h(c.title)}</strong></td><td>${h(c.reference)}</td><td>${h(c.counterparty)}</td><td>${h(c.department)}</td><td>${h(c.expiry_date || "")}</td><td><span class="pill INFO">${c.document_count}</span></td>
    <td><button class="btn ghost sm" data-docs="${c.id}">Documents</button>${canWrite() ? `<button class="btn danger sm" data-del="${c.id}">Suppr.</button>` : ""}</td></tr>`).join("");
  bindContractRows();
}

function bindContractRows() {
  C().querySelectorAll("[data-docs]").forEach((b) => b.onclick = () => showDocsPanel(parseInt(b.dataset.docs)));
  C().querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    if (!confirm("Supprimer ce contrat et ses documents ?")) return;
    await api("DELETE", "/api/contracts/" + b.dataset.del); renderContracts();
  });
}

async function showDocsPanel(contractId) {
  const panel = $("#docs-panel");
  panel.innerHTML = '<div class="card">Chargement des documents…</div>';
  const docs = await api("GET", "/api/documents?contract_id=" + contractId);
  const rows = docs.map((d) => `
    <tr><td>${h(d.filename)} ${d.extraction_ok ? "" : '<span class="pill HIGH">extraction ?</span>'}</td>
    <td>${h(d.version_label || "")}</td><td>${d.char_count} car.</td>
    <td>
      <button class="btn ghost sm" data-an="${d.id}">Analyser</button>
    </td></tr>`).join("") || `<tr><td colspan="4" class="muted">Aucun document.</td></tr>`;
  panel.innerHTML = `<div class="card"><h2>Documents du contrat #${contractId}</h2>
    <table><thead><tr><th>Fichier</th><th>Version</th><th>Texte</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${canWrite() ? `<h3>Televerser un document (PDF, DOCX, TXT)</h3>
      <div class="row"><input type="file" id="up-file" accept=".pdf,.docx,.txt" style="flex:2">
      <input id="up-ver" placeholder="Libelle de version (ex. Version 2)" style="flex:1">
      <button class="btn" id="up-btn">${h(t("upload"))}</button></div><div id="up-msg"></div>` : ""}
  </div>`;
  panel.querySelectorAll("[data-an]").forEach((b) => b.onclick = () => { state.pendingDoc = parseInt(b.dataset.an); navigate("analyzer"); });
  const up = $("#up-btn");
  if (up) up.onclick = async () => {
    const f = $("#up-file").files[0];
    if (!f) { $("#up-msg").innerHTML = errBox("Choisissez un fichier."); return; }
    const fd = new FormData(); fd.append("file", f); fd.append("contract_id", contractId); fd.append("version_label", $("#up-ver").value);
    up.disabled = true; $("#up-msg").textContent = " Televersement…";
    try { const r = await api("POST", "/api/documents/upload", fd, true); await refreshDocs(); showDocsPanel(contractId); if (r.warning) alert("Avertissement : " + r.warning); }
    catch (e) { $("#up-msg").innerHTML = errBox(e.message); up.disabled = false; }
  };
}

/* ---- shared doc selector ---- */
async function docSelector(id, label) {
  if (!state.docs.length) await refreshDocs();
  const opts = state.docs.map((d) => `<option value="${d.id}">${h(docLabel(d))}</option>`).join("");
  return `<label>${h(label || t("selectDoc"))}</label><select id="${id}"><option value="">—</option>${opts}</select>`;
}

/* ---- Analyzer ---- */
async function renderAnalyzer() {
  loading();
  await refreshDocs();
  const sel = await docSelector("an-doc", t("selectDoc"));
  C().innerHTML = `<div class="card"><h2>${h(t("analyzer"))}</h2>
    <p class="muted">Analyse deterministe : chaque constat renvoie a un article et a un extrait reels ; les provisions absentes sont signalees comme telles.</p>
    <div class="toolbar"><div>${sel}</div>${canWrite() ? `<button class="btn" id="an-run">${h(t("run"))}</button>` : ""}
    <button class="btn ghost" id="an-latest">Derniere analyse</button></div>
    <div id="an-result"></div></div>`;
  if (state.pendingDoc) { $("#an-doc").value = state.pendingDoc; state.pendingDoc = null; }
  const run = $("#an-run");
  if (run) run.onclick = async () => {
    const id = $("#an-doc").value; if (!id) return;
    run.disabled = true; $("#an-result").innerHTML = '<span class="spin" style="border-color:#ccc;border-top-color:var(--green)"></span> Analyse en cours…';
    try { const a = await api("POST", "/api/analysis/run", { document_id: parseInt(id) }); showAnalysis(a); }
    catch (e) { $("#an-result").innerHTML = errBox(e.message); }
    run.disabled = false;
  };
  $("#an-latest").onclick = async () => {
    const id = $("#an-doc").value; if (!id) return;
    try { const a = await api("GET", `/api/analysis/document/${id}/latest`); showAnalysis(a); }
    catch (e) { $("#an-result").innerHTML = errBox(e.message); }
  };
}

function findingCard(f) {
  return `<div class="finding">
    <div class="head"><span class="pill ${f.severity}">${sevLabel(f.severity)}</span>
    <span class="cat">${h(f.category)}</span><span class="ref">${h(f.article_ref)}</span>
    ${f.present ? "" : '<span class="pill HIGH">ABSENTE</span>'}</div>
    <div>${h(f.problem)}</div>
    ${f.excerpt ? `<div class="excerpt">${h(f.excerpt)}</div>` : ""}
    ${f.legal_significance ? `<div class="meta"><b>Portee :</b> ${h(f.legal_significance)}</div>` : ""}
    ${f.commercial_consequence ? `<div class="meta"><b>Consequence :</b> ${h(f.commercial_consequence)}</div>` : ""}
    ${f.recommendation ? `<div class="reco"><b>Recommandation :</b> ${h(f.recommendation)}</div>` : ""}
    ${f.proposed_wording ? `<div class="meta"><b>Proposition :</b> ${h(f.proposed_wording)}</div>` : ""}
  </div>`;
}

function showAnalysis(a) {
  const issues = a.findings.filter((f) => f.severity !== "INFO");
  const present = a.findings.filter((f) => f.severity === "INFO");
  const c = a.counts || {};
  C_setResult("an-result", `
    <div class="ok-box">Score de risque : <b>${a.risk_score}/100</b> — ${a.structure.length} clause(s).</div>
    <h3>Synthese</h3><div style="white-space:pre-wrap">${h(a.summary)}</div>
    <div class="row" style="margin:12px 0">
      ${["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => `<span class="pill ${s}">${sevLabel(s)} : ${c[s] || 0}</span>`).join("")}
    </div>
    ${a.parties && a.parties.length ? `<h3>Parties identifiees</h3><div>${a.parties.map(h).join(" • ")}</div>` : ""}
    ${a.references && a.references.length ? `<h3>References detectees</h3><div>${a.references.map(h).join(" • ")}</div>` : ""}
    ${a.dates && a.dates.length ? `<h3>Dates detectees</h3><div>${a.dates.map(h).join(" • ")}</div>` : ""}
    <h3>Points d'attention (${issues.length})</h3>${issues.map(findingCard).join("") || '<p class="muted">Aucun point d\'attention.</p>'}
    <h3>Provisions presentes (${present.length})</h3>${present.map(findingCard).join("")}
    ${canWrite() ? reportButtons("analysis", a.document_id) : ""}
  `);
}

function C_setResult(id, html) { const el = $("#" + id); if (el) el.innerHTML = html; bindReportButtons(); }

function reportButtons(kind, sourceId) {
  return `<h3>Generer un rapport</h3><div class="row" data-rk="${kind}" data-rid="${sourceId}">
    <button class="btn ghost sm rpt" data-fmt="docx">DOCX</button>
    <button class="btn ghost sm rpt" data-fmt="pdf">PDF</button>
    ${kind !== "risk" ? '<button class="btn ghost sm rpt" data-fmt="xlsx">XLSX</button>' : ""}
    <span class="rpt-msg"></span></div>`;
}

function bindReportButtons() {
  document.querySelectorAll(".rpt").forEach((b) => b.onclick = async () => {
    const box = b.closest("[data-rk]"); const kind = box.dataset.rk; const rid = parseInt(box.dataset.rid); const fmt = b.dataset.fmt;
    const msg = box.querySelector(".rpt-msg"); msg.textContent = " Generation…";
    try {
      let r;
      if (kind === "analysis") r = await api("POST", "/api/reports/analysis", { document_id: rid, fmt });
      else if (kind === "risk") r = await api("POST", "/api/reports/risk", { document_id: rid, fmt });
      else r = await api("POST", "/api/reports/comparison", { comparison_id: rid, fmt });
      msg.innerHTML = ` <a href="${r.url}" target="_blank">Telecharger ${h(r.filename)}</a>`;
    } catch (e) { msg.innerHTML = errBox(e.message); }
  });
}

/* ---- Comparison ---- */
async function renderComparison() {
  loading();
  await refreshDocs();
  C().innerHTML = `<div class="card"><h2>${h(t("comparison"))}</h2>
    <p class="muted">Comparaison clause par clause avec alignement par contenu (robuste a la renumerotation).</p>
    <div class="grid cols-2">
      <div>${await docSelector("cmp-a", t("docA"))}</div>
      <div>${await docSelector("cmp-b", t("docB"))}</div>
    </div>
    ${canWrite() ? `<button class="btn" id="cmp-run" style="margin-top:12px">${h(t("compare"))}</button>` : '<p class="muted">Role lecture seule.</p>'}
    <div id="cmp-result"></div></div>`;
  const run = $("#cmp-run");
  if (run) run.onclick = async () => {
    const a = $("#cmp-a").value, b = $("#cmp-b").value;
    if (!a || !b) { $("#cmp-result").innerHTML = errBox("Choisissez deux documents."); return; }
    run.disabled = true; $("#cmp-result").innerHTML = '<span class="spin" style="border-color:#ccc;border-top-color:var(--green)"></span> Comparaison…';
    try { const r = await api("POST", "/api/comparison/run", { doc_a_id: parseInt(a), doc_b_id: parseInt(b) }); state.lastComparisonId = r.id; showComparison(r); }
    catch (e) { $("#cmp-result").innerHTML = errBox(e.message); }
    run.disabled = false;
  };
}

function showComparison(r) {
  const changes = r.changes.map((ch) => `
    <div class="finding">
      <div class="head"><span class="pill ${ch.risk}">${sevLabel(ch.risk)}</span>
      <span class="cat">${h(ch.kind.toUpperCase())}</span>
      <span class="ref">${h(ch.ref_a)} → ${h(ch.ref_b)}</span>
      <span class="pill INFO">${h(ch.change_class)}</span></div>
      <div>${h(ch.explanation)}</div>
      <div class="meta"><b>Impact :</b> ${h(ch.legal_impact)}</div>
      ${(ch.before || ch.after) ? `<div class="before-after">
        <div class="ba-box del"><b>Avant</b><br>${h(ch.before || "(aucune)")}</div>
        <div class="ba-box add"><b>Apres</b><br>${h(ch.after || "(aucune)")}</div></div>` : ""}
      <div class="reco"><b>Action :</b> ${h(ch.recommended_action)}</div>
    </div>`).join("");
  $("#cmp-result").innerHTML = `<div class="ok-box">${h(r.summary)}</div><h3>Changements (${r.changes.length})</h3>${changes}
    ${canWrite() ? reportButtons("comparison", r.id) : ""}`;
  bindReportButtons();
}

/* ---- Risk ---- */
async function renderRisk() {
  loading();
  await refreshDocs();
  C().innerHTML = `<div class="card"><h2>${h(t("risk"))}</h2>
    <div class="toolbar"><div>${await docSelector("rk-doc")}</div><button class="btn" id="rk-run">Evaluer</button></div>
    <div id="rk-result"></div></div>`;
  $("#rk-run").onclick = async () => {
    const id = $("#rk-doc").value; if (!id) return;
    $("#rk-result").innerHTML = '<span class="spin" style="border-color:#ccc;border-top-color:var(--green)"></span>';
    try {
      const r = await api("GET", "/api/risk/document/" + id);
      const domains = r.domains.map((d) => `<div class="card"><h3>${h(d.label)} — ${d.count} point(s) ${d.count ? `<span class="pill ${d.level}">${sevLabel(d.level)}</span>` : ""}</h3>
        ${d.findings.map(findingCard).join("") || '<p class="muted">Aucun.</p>'}</div>`).join("");
      $("#rk-result").innerHTML = `<div class="ok-box">Niveau global : <span class="pill ${r.overall_level}">${sevLabel(r.overall_level)}</span> — score ${r.risk_score}/100 — ${r.total_issues} point(s).</div>${domains}
        ${canWrite() ? reportButtons("risk", parseInt(id)) : ""}`;
      bindReportButtons();
    } catch (e) { $("#rk-result").innerHTML = errBox(e.message); }
  };
}

/* ---- Research ---- */
async function renderResearch() {
  loading();
  try {
    const r = await api("GET", "/api/research");
    const rows = r.references.map((x) => `<tr>
      <td><strong>${h(x.title)}</strong><br><span class="muted">${h(x.note)}</span></td>
      <td>${h(x.number)}<br><span class="muted">${h(x.publication_date)}</span></td>
      <td>${h(x.domain)}</td>
      <td><span class="pill ${x.status}">${x.status === "verifie" ? "Verifie" : "A verifier"}</span></td>
      ${canWrite() ? `<td><button class="btn ghost sm" data-toggle="${x.id}" data-st="${x.status}">${x.status === "verifie" ? "Marquer a verifier" : "Marquer verifie"}</button>
      <button class="btn danger sm" data-delref="${x.id}">Suppr.</button></td>` : "<td></td>"}
    </tr>`).join("");
    C().innerHTML = `<div class="notice">${h(r.disclosure)}</div>
      <div class="card"><div class="toolbar"><div><label>${h(t("search"))}</label><input id="rs-q"></div>
      <div><label>Domaine</label><input id="rs-dom" placeholder="hydrocarbures, droit civil…"></div>
      <button class="btn" id="rs-search">${h(t("search"))}</button></div>
      <table><thead><tr><th>Texte</th><th>Reference</th><th>Domaine</th><th>Statut</th><th></th></tr></thead><tbody id="rs-rows">${rows}</tbody></table></div>
      ${canWrite() ? refForm() : ""}`;
    $("#rs-search").onclick = async () => {
      const qs = new URLSearchParams({ query: $("#rs-q").value, domain: $("#rs-dom").value });
      const rr = await api("GET", "/api/research?" + qs); renderRefRows(rr.references);
    };
    bindRefRows();
    if (canWrite()) $("#rf-save").onclick = async () => {
      const payload = { title: $("#rf-title").value.trim(), number: $("#rf-num").value.trim(), publication_date: $("#rf-date").value.trim(), article: $("#rf-art").value.trim(), source: $("#rf-src").value.trim(), domain: $("#rf-dom").value.trim(), note: $("#rf-note").value.trim(), status: $("#rf-status").value };
      if (!payload.title) { $("#rf-msg").innerHTML = errBox("Titre obligatoire."); return; }
      try { await api("POST", "/api/research", payload); renderResearch(); } catch (e) { $("#rf-msg").innerHTML = errBox(e.message); }
    };
  } catch (e) { C().innerHTML = errBox(e.message); }
}
function renderRefRows(refs) {
  $("#rs-rows").innerHTML = refs.map((x) => `<tr><td><strong>${h(x.title)}</strong></td><td>${h(x.number)}</td><td>${h(x.domain)}</td><td><span class="pill ${x.status}">${x.status === "verifie" ? "Verifie" : "A verifier"}</span></td>
    ${canWrite() ? `<td><button class="btn ghost sm" data-toggle="${x.id}" data-st="${x.status}">${x.status === "verifie" ? "Marquer a verifier" : "Marquer verifie"}</button><button class="btn danger sm" data-delref="${x.id}">Suppr.</button></td>` : "<td></td>"}</tr>`).join("");
  bindRefRows();
}
function bindRefRows() {
  C().querySelectorAll("[data-delref]").forEach((b) => b.onclick = async () => { if (confirm("Supprimer ?")) { await api("DELETE", "/api/research/" + b.dataset.delref); renderResearch(); } });
  C().querySelectorAll("[data-toggle]").forEach((b) => b.onclick = async () => {
    const id = b.dataset.toggle;
    const cur = await api("GET", "/api/research?query=");
    const ref = cur.references.find((x) => x.id == id); if (!ref) return;
    ref.status = ref.status === "verifie" ? "a_verifier" : "verifie";
    await api("PUT", "/api/research/" + id, ref); renderResearch();
  });
}
function refForm() {
  return `<div class="card"><h2>Ajouter une reference</h2>
    <div class="grid cols-3">
      <div><label>Titre *</label><input id="rf-title"></div>
      <div><label>Numero</label><input id="rf-num" placeholder="Loi n° ..."></div>
      <div><label>Date de publication</label><input id="rf-date"></div>
      <div><label>Article</label><input id="rf-art"></div>
      <div><label>Source</label><input id="rf-src" placeholder="JORADP n° ..."></div>
      <div><label>Domaine</label><input id="rf-dom"></div>
      <div><label>Statut</label><select id="rf-status"><option value="a_verifier">A verifier</option><option value="verifie">Verifie (sur source)</option></select></div>
    </div><label>Note</label><textarea id="rf-note"></textarea><div id="rf-msg"></div>
    <button class="btn" id="rf-save" style="margin-top:8px">Ajouter</button></div>`;
}

/* ---- Assistant ---- */
async function renderAssistant() {
  loading();
  await refreshDocs();
  const sel = await docSelector("as-doc", "Document de reference");
  let statusLine = "";
  try { const s = await api("GET", "/api/assistant/status"); statusLine = s.note; } catch (e) {}
  C().innerHTML = `<div class="card"><h2>${h(t("assistant"))}</h2>
    <p class="muted">${h(statusLine)} Les reponses sont fondees sur le document selectionne et citent les articles.</p>
    <div>${sel}</div>
    <div class="chat" id="as-chat" style="margin-top:14px"></div>
    <div class="row" style="margin-top:10px"><input id="as-q" placeholder="Ex. Explique l'article 5 / Quels sont les risques ? / Quelles protections manquent ?" style="flex:1" onkeydown="if(event.key==='Enter')document.getElementById('as-send').click()">
    <button class="btn" id="as-send">${h(t("send"))}</button></div></div>`;
  renderChat();
  $("#as-send").onclick = async () => {
    const q = $("#as-q").value.trim(); if (!q) return;
    const docId = $("#as-doc").value ? parseInt($("#as-doc").value) : null;
    state.chat.push({ who: "user", text: q }); $("#as-q").value = ""; renderChat();
    try {
      const r = await api("POST", "/api/assistant", { question: q, document_id: docId });
      let cites = (r.citations || []).map((c) => `${c.document} — ${c.article}`).join(" ; ");
      state.chat.push({ who: "bot", text: r.answer, cite: cites });
    } catch (e) { state.chat.push({ who: "bot", text: "Erreur : " + e.message }); }
    renderChat();
  };
}
function renderChat() {
  const box = $("#as-chat"); if (!box) return;
  box.innerHTML = state.chat.map((m) => `<div class="msg ${m.who === "user" ? "user" : "bot"}">${h(m.text)}${m.cite ? `<span class="cite">📎 ${h(m.cite)}</span>` : ""}</div>`).join("");
  box.scrollTop = box.scrollHeight;
}

/* ---- Generator ---- */
async function renderGenerator() {
  loading();
  await refreshDocs();
  C().innerHTML = `<div class="card"><h2>${h(t("generator"))}</h2>
    <p class="muted">Generez des rapports professionnels (DOCX, PDF, XLSX) a partir d'une analyse, d'un risque ou d'une comparaison.</p>
    <div class="grid cols-2">
      <div class="card"><h3>Rapport d'analyse / de risques</h3>${await docSelector("gen-doc")}
        <div class="row" style="margin-top:10px">
          <div data-rk="analysis" data-rid="" id="gen-an"><button class="btn ghost sm rptg" data-kind="analysis" data-fmt="docx">Analyse DOCX</button><button class="btn ghost sm rptg" data-kind="analysis" data-fmt="pdf">Analyse PDF</button><button class="btn ghost sm rptg" data-kind="analysis" data-fmt="xlsx">Analyse XLSX</button>
          <button class="btn ghost sm rptg" data-kind="risk" data-fmt="docx">Risques DOCX</button><button class="btn ghost sm rptg" data-kind="risk" data-fmt="pdf">Risques PDF</button></div>
        </div><div id="gen-msg"></div>
      </div>
      <div class="card"><h3>Rapport de comparaison</h3>
        <label>ID de comparaison ${state.lastComparisonId ? `(derniere : ${state.lastComparisonId})` : ""}</label>
        <input id="gen-cmp" type="number" value="${state.lastComparisonId || ""}">
        <div class="row" style="margin-top:10px"><button class="btn ghost sm cmpg" data-fmt="docx">DOCX</button><button class="btn ghost sm cmpg" data-fmt="pdf">PDF</button><button class="btn ghost sm cmpg" data-fmt="xlsx">XLSX</button></div>
        <div id="gen-cmsg"></div>
      </div>
    </div></div>`;
  document.querySelectorAll(".rptg").forEach((b) => b.onclick = async () => {
    const id = $("#gen-doc").value; if (!id) { $("#gen-msg").innerHTML = errBox("Choisissez un document."); return; }
    $("#gen-msg").textContent = " Generation…";
    try { const path = b.dataset.kind === "risk" ? "/api/reports/risk" : "/api/reports/analysis"; const r = await api("POST", path, { document_id: parseInt(id), fmt: b.dataset.fmt }); $("#gen-msg").innerHTML = ` <a href="${r.url}" target="_blank">Telecharger ${h(r.filename)}</a>`; }
    catch (e) { $("#gen-msg").innerHTML = errBox(e.message); }
  });
  document.querySelectorAll(".cmpg").forEach((b) => b.onclick = async () => {
    const id = $("#gen-cmp").value; if (!id) { $("#gen-cmsg").innerHTML = errBox("Saisissez un ID de comparaison."); return; }
    $("#gen-cmsg").textContent = " Generation…";
    try { const r = await api("POST", "/api/reports/comparison", { comparison_id: parseInt(id), fmt: b.dataset.fmt }); $("#gen-cmsg").innerHTML = ` <a href="${r.url}" target="_blank">Telecharger ${h(r.filename)}</a>`; }
    catch (e) { $("#gen-cmsg").innerHTML = errBox(e.message); }
  });
}

/* ---- Settings ---- */
async function renderSettings() {
  loading();
  try {
    const s = await api("GET", "/api/settings");
    C().innerHTML = `<div class="card"><h2>${h(t("settings"))}</h2>
      <table>
        <tr><th>Version</th><td>${h(s.version)} (moteur ${h(s.engine_version)})</td></tr>
        <tr><th>Base de donnees</th><td>${h(s.database)}</td></tr>
        <tr><th>Taille max. de televersement</th><td>${s.max_upload_mb} Mo</td></tr>
        <tr><th>Formats acceptes</th><td>${s.allowed_extensions.join(", ")}</td></tr>
        <tr><th>Mode local (aucun envoi externe)</th><td>${s.local_only ? "Oui ✅" : "Non ⚠ (LLM externe actif)"}</td></tr>
        <tr><th>Couche LLM</th><td>${h(s.llm.note)}</td></tr>
      </table>
      <div class="notice" style="margin-top:14px">Confidentialite : par defaut, aucun document n'est transmis a un service externe. L'activation de la couche LLM (variables d'environnement) envoie le texte analyse au fournisseur configure et doit etre autorisee pour des documents confidentiels. Cette application n'est pas approuvee pour un usage officiel NAFTAL sans validation des equipes informatique et securite.</div>
    </div>`;
  } catch (e) { C().innerHTML = errBox(e.message); }
}

/* ---- Admin ---- */
async function renderAdmin() {
  loading();
  try {
    const [users, audit] = await Promise.all([api("GET", "/api/users"), api("GET", "/api/audit?limit=60")]);
    const urows = users.map((u) => `<tr><td>${h(u.email)}</td><td>${h(u.full_name)}</td><td><span class="pill INFO">${h(u.role)}</span></td><td>${u.is_active ? "actif" : "inactif"}</td></tr>`).join("");
    const arows = audit.map((a) => `<tr><td>${h(a.created_at)}</td><td>${h(a.user_email)}</td><td>${h(a.action)}</td><td>${h(a.detail)}</td></tr>`).join("");
    C().innerHTML = `<div class="card"><h2>Utilisateurs</h2>
      <table><thead><tr><th>E-mail</th><th>Nom</th><th>Role</th><th>Etat</th></tr></thead><tbody>${urows}</tbody></table>
      <h3>Creer un utilisateur</h3>
      <div class="grid cols-3"><div><label>E-mail</label><input id="u-email"></div><div><label>Nom</label><input id="u-name"></div>
      <div><label>Role</label><select id="u-role"><option>juriste</option><option>lecteur</option><option>admin</option></select></div>
      <div><label>Mot de passe (min. 8)</label><input id="u-pass" type="password"></div></div><div id="u-msg"></div>
      <button class="btn" id="u-save" style="margin-top:8px">Creer</button></div>
      <div class="card"><h2>Journal d'audit (60 dernieres actions)</h2>
      <table><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Detail</th></tr></thead><tbody>${arows}</tbody></table></div>`;
    $("#u-save").onclick = async () => {
      try { await api("POST", "/api/users", { email: $("#u-email").value.trim(), full_name: $("#u-name").value.trim(), role: $("#u-role").value, password: $("#u-pass").value }); renderAdmin(); }
      catch (e) { $("#u-msg").innerHTML = errBox(e.message); }
    };
  } catch (e) { C().innerHTML = errBox(e.message); }
}

const RENDERERS = {
  overview: renderOverview, contracts: renderContracts, analyzer: renderAnalyzer,
  comparison: renderComparison, risk: renderRisk, research: renderResearch,
  assistant: renderAssistant, generator: renderGenerator, settings: renderSettings, admin: renderAdmin,
};

/* ----------------------------- init ----------------------------- */
$("#login-form").addEventListener("submit", doLogin);
$("#logout-btn").addEventListener("click", doLogout);
$("#menu-toggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#lang").value = LANG;
$("#lang").addEventListener("change", (e) => { LANG = e.target.value; localStorage.setItem("naftal_lang", LANG); applyLang(); });

(async function init() {
  document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = LANG;
  try { state.user = await api("GET", "/api/auth/me"); await boot(); }
  catch (e) { $("#login").classList.remove("hidden"); }
})();
