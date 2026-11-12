/* TaskFlow — Kanban board, vanilla JS + localStorage. */
"use strict";

const KEY = "taskflow-v1";
const $ = (id) => document.getElementById(id);

/* Card labels: fixed set of color tags a card can carry (any combination). */
const LABELS = {
  bug: { name: "bug" },
  feature: { name: "feature" },
  urgent: { name: "urgent" },
};

let openLabelFor = null; // id of the card whose label menu is open, null = none
let openDueFor = null; // id of the card whose due-date editor is open, null = none
let searchQuery = ""; // live card filter text, "" = show every card

const DEFAULT_COLUMNS = [
  { id: "todo", name: "To Do" },
  { id: "doing", name: "In Progress" },
  { id: "done", name: "Done" },
];

let board = load();

/* Tasks gained a `labels` array (subset of LABELS keys); older saves lack it. */
for (const c of board.columns)
  for (const t of board.tasks[c.id]) {
    t.labels = Array.isArray(t.labels) ? t.labels.filter((l) => LABELS[l]) : [];
    /* Tasks also gained a `due` date ("YYYY-MM-DD" or null); older saves lack it. */
    t.due = parseDue(t.due) ? t.due : null;
  }

/* Due dates are plain "YYYY-MM-DD" strings, compared as local dates. */
function parseDue(due) {
  if (typeof due !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
function dueStatus(due, now) {
  const d = parseDue(due);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d.getTime() < today.getTime()) return "overdue";
  if (d.getTime() === today.getTime()) return "today";
  return "future";
}
function formatDue(due) {
  const d = parseDue(due);
  return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

/*
 * Stats header: how much of the board is done, as a progress bar.
 * The "done" column is the column with id "done", or — for boards whose
 * columns were renamed — one named done / complete / completed / finished.
 * Overdue counts cards outside the done column whose due date has passed.
 */
const DONE_COLUMN_NAMES = ["done", "complete", "completed", "finished"];
function doneColumnId(b) {
  const byId = b.columns.find((c) => c.id === "done");
  if (byId) return byId.id;
  const byName = b.columns.find((c) => DONE_COLUMN_NAMES.includes(c.name.trim().toLowerCase()));
  return byName ? byName.id : null;
}
function computeStats(b, now) {
  let total = 0, done = 0, overdue = 0;
  const doneId = doneColumnId(b);
  for (const c of b.columns)
    for (const t of b.tasks[c.id] || []) {
      total++;
      if (c.id === doneId) done++;
      else if (dueStatus(t.due, now) === "overdue") overdue++;
    }
  return { total, done, active: total - done, overdue, pct: total ? Math.round((done / total) * 100) : 0 };
}
function renderStats() {
  const s = computeStats(board, new Date());
  $("statsSummary").textContent = s.total
    ? s.done + " of " + s.total + " done · " + s.pct + "%"
    : "No cards yet — add your first task";
  $("statsDetail").textContent = s.total
    ? s.active + " active" + (s.overdue ? " · " + s.overdue + " overdue" : "")
    : "";
  $("statsBar").style.width = s.pct + "%";
  $("statsBarWrap").setAttribute("aria-valuenow", String(s.pct));
  $("statsBarWrap").setAttribute("aria-valuetext", s.pct + "% done");
}
function setDue(id, due) {
  const f = findTask(id);
  if (!f) return;
  f.task.due = parseDue(due) ? due : null;
  save(); render();
}

/* Search: a card matches when its title or any of its label names contains the query. */
function matchesSearch(task, query) {
  if (!query) return true;
  const hay = [task.title]
    .concat((task.labels || []).map((l) => (LABELS[l] ? LABELS[l].name : l)))
    .join(" ").toLowerCase();
  return hay.includes(query);
}

/*
 * Board shape (v2): { columns: [{id, name}], tasks: { [colId]: [{id, title}] } }
 * Older saves were a plain { todo: [...], doing: [...], done: [...] } map;
 * load() migrates those to v2 so existing boards keep their cards.
 */
function load() {
  try {
    const b = JSON.parse(localStorage.getItem(KEY));
    if (b && Array.isArray(b.columns) && b.tasks && typeof b.tasks === "object") {
      const valid = b.columns.filter((c) => c && typeof c.id === "string" && typeof c.name === "string");
      if (valid.length) {
        const tasks = {};
        for (const c of valid) tasks[c.id] = Array.isArray(b.tasks[c.id]) ? b.tasks[c.id] : [];
        return { columns: valid, tasks };
      }
    }
    if (b && ["todo", "doing", "done"].every((c) => Array.isArray(b[c]))) {
      const tasks = {};
      for (const c of DEFAULT_COLUMNS) tasks[c.id] = b[c.id];
      return { columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), tasks };
    }
  } catch { /* fall through */ }
  const tasks = {};
  for (const c of DEFAULT_COLUMNS) tasks[c.id] = [];
  return { columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), tasks };
}
function save() { localStorage.setItem(KEY, JSON.stringify(board)); }

/*
 * Export/import: the whole board travels as one JSON file so it can be
 * backed up, moved to another browser, or shared.
 * { app, version, exportedAt, board } — validateBoardData also accepts a
 * bare board object, and normalises it (drops unknown labels, bad dates,
 * over-long titles) so a hand-edited file can't corrupt the board.
 */
function serializeBoard() {
  return JSON.stringify({ app: "taskflow", version: 1, exportedAt: new Date().toISOString(), board }, null, 2);
}
function validateBoardData(data) {
  const b = data && data.board ? data.board : data;
  if (!b || !Array.isArray(b.columns) || !b.tasks || typeof b.tasks !== "object") return null;
  const valid = b.columns.filter((c) => c && typeof c.id === "string" && typeof c.name === "string");
  if (!valid.length) return null;
  const tasks = {};
  for (const c of valid) {
    const list = Array.isArray(b.tasks[c.id]) ? b.tasks[c.id] : [];
    tasks[c.id] = list
      .filter((t) => t && typeof t.title === "string" && t.title.trim())
      .map((t) => ({
        id: typeof t.id === "number" ? t.id : Date.now(),
        title: t.title.trim().slice(0, 80),
        labels: Array.isArray(t.labels) ? t.labels.filter((l) => LABELS[l]) : [],
        due: parseDue(t.due) ? t.due : null,
      }));
  }
  return { columns: valid.map((c) => ({ id: c.id, name: c.name.trim().slice(0, 30) })), tasks };
}
function exportBoard() {
  const blob = new Blob([serializeBoard()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "taskflow-board-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBoard(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); }
    catch { alert("That file is not valid JSON."); return; }
    const next = validateBoardData(data);
    if (!next) { alert("That file is not a TaskFlow board export."); return; }
    const cards = Object.values(next.tasks).reduce((n, l) => n + l.length, 0);
    if (!confirm(`Import this board? It replaces your current board (${next.columns.length} columns, ${cards} cards).`)) return;
    board = next;
    save(); render();
  };
  reader.readAsText(file);
}

function colName(id) {
  const c = board.columns.find((x) => x.id === id);
  return c ? c.name : id;
}

function findTask(id) {
  for (const c of board.columns) {
    const i = board.tasks[c.id].findIndex((t) => t.id === id);
    if (i !== -1) return { col: c.id, i, task: board.tasks[c.id][i] };
  }
  return null;
}

function toggleLabel(id, label) {
  const f = findTask(id);
  if (!f || !LABELS[label]) return;
  if (!Array.isArray(f.task.labels)) f.task.labels = [];
  const i = f.task.labels.indexOf(label);
  if (i === -1) f.task.labels.push(label);
  else f.task.labels.splice(i, 1);
  save(); render();
}

function moveTask(id, toCol) {
  const found = findTask(id);
  if (!found || found.col === toCol || !board.tasks[toCol]) return;
  board.tasks[found.col].splice(found.i, 1);
  board.tasks[toCol].push(found.task);
  save(); render();
}

function addColumn(name) {
  const clean = name.trim().slice(0, 30);
  if (!clean) return;
  const id = "c" + Date.now().toString(36);
  board.columns.push({ id, name: clean });
  board.tasks[id] = [];
  save(); render();
}

function renameColumn(id, name) {
  const clean = name.trim().slice(0, 30);
  const c = board.columns.find((x) => x.id === id);
  if (!c || !clean) return;
  c.name = clean;
  save(); render();
}

function deleteColumn(id) {
  if (board.columns.length <= 1) return;
  const c = board.columns.find((x) => x.id === id);
  if (!c) return;
  const cards = board.tasks[id].length;
  const note = cards ? ` and its ${cards} card${cards === 1 ? "" : "s"}` : "";
  if (!confirm(`Delete column "${c.name}"${note}? This cannot be undone.`)) return;
  board.columns = board.columns.filter((x) => x.id !== id);
  delete board.tasks[id];
  save(); render();
}

function render() {
  renderStats();

  /* Rebuild the column picker from the current columns. */
  const picker = $("taskCol");
  picker.innerHTML = "";
  for (const c of board.columns) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    picker.appendChild(opt);
  }

  const main = $("board");
  main.innerHTML = "";

  /* Live search: count matches first so the status line is exact. */
  const q = searchQuery.trim().toLowerCase();
  let total = 0, shown = 0;
  for (const c of board.columns)
    for (const t of board.tasks[c.id]) {
      total++;
      if (matchesSearch(t, q)) shown++;
    }
  $("searchCount").textContent = q
    ? (shown ? shown + " of " + total + " card" + (total === 1 ? "" : "s")
             : "No cards match \"" + searchQuery.trim() + "\"")
    : "";

  for (const c of board.columns) {
    const section = document.createElement("section");
    section.className = "col";
    section.dataset.col = c.id;

    const h2 = document.createElement("h2");
    const title = document.createElement("span");
    title.className = "col-title";
    title.textContent = c.name;
    title.title = "Double-click to rename";
    title.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.className = "col-rename";
      input.value = c.name;
      input.maxLength = 30;
      input.setAttribute("aria-label", "Rename column");
      title.replaceWith(input);
      input.focus(); input.select();
      let done = false;
      const commit = (saveIt) => {
        if (done) return; done = true;
        if (saveIt) renameColumn(c.id, input.value);
        else render();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commit(true);
        else if (e.key === "Escape") commit(false);
      });
      input.addEventListener("blur", () => commit(true));
    });

    const actions = document.createElement("span");
    actions.className = "col-actions";
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = board.tasks[c.id].length;
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "iconbtn";
    renameBtn.textContent = "✎";
    renameBtn.title = "Rename column";
    renameBtn.setAttribute("aria-label", "Rename column " + c.name);
    renameBtn.addEventListener("click", () => title.dispatchEvent(new Event("dblclick")));
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "iconbtn danger";
    delBtn.textContent = "✕";
    delBtn.title = board.columns.length <= 1 ? "Cannot delete the last column" : "Delete column";
    delBtn.disabled = board.columns.length <= 1;
    delBtn.setAttribute("aria-label", "Delete column " + c.name);
    delBtn.addEventListener("click", () => deleteColumn(c.id));
    actions.append(count, renameBtn, delBtn);
    h2.append(title, actions);

    const wrap = document.createElement("div");
    wrap.className = "cards";
    let shownInCol = 0;
    for (const t of board.tasks[c.id]) {
      if (!matchesSearch(t, q)) continue;
      shownInCol++;
      const el = document.createElement("div");
      el.className = "card";
      el.draggable = true;
      el.dataset.id = t.id;

      if (t.labels && t.labels.length) {
        const row = document.createElement("div");
        row.className = "labels";
        for (const key of t.labels) {
          const chip = document.createElement("span");
          chip.className = "label label-" + key;
          chip.textContent = LABELS[key].name;
          row.appendChild(chip);
        }
        el.appendChild(row);
      }

      const main = document.createElement("div");
      main.className = "card-main";
      const span = document.createElement("span");
      span.textContent = t.title;
      span.title = "Double-click to edit";
      span.addEventListener("dblclick", () => {
        el.draggable = false;
        const input = document.createElement("input");
        input.className = "edit";
        input.value = t.title;
        input.maxLength = 80;
        input.setAttribute("aria-label", "Edit task title");
        span.replaceWith(input);
        input.focus(); input.select();
        let done = false;
        const commit = (saveIt) => {
          if (done) return; done = true;
          const f = findTask(t.id);
          if (saveIt && f) {
            const next = input.value.trim();
            if (next) { f.task.title = next; save(); }
          }
          render();
        };
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") commit(true);
          else if (e.key === "Escape") commit(false);
        });
        input.addEventListener("blur", () => commit(true));
      });
      const tagBtn = document.createElement("button");
      tagBtn.type = "button";
      tagBtn.className = "labelbtn"; tagBtn.textContent = "🏷"; tagBtn.title = "Card labels";
      tagBtn.setAttribute("aria-label", "Card labels for " + t.title);
      tagBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openLabelFor = openLabelFor === t.id ? null : t.id;
        render();
      });
      const dueBtn = document.createElement("button");
      dueBtn.type = "button";
      dueBtn.className = "labelbtn"; dueBtn.textContent = "📅"; dueBtn.title = t.due ? "Due " + formatDue(t.due) + " — click to change" : "Set due date";
      dueBtn.setAttribute("aria-label", "Set due date for " + t.title);
      dueBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDueFor = openDueFor === t.id ? null : t.id;
        render();
      });
      const del = document.createElement("button");
      del.className = "del"; del.textContent = "✕"; del.title = "Delete";
      del.addEventListener("click", () => {
        const f = findTask(t.id);
        if (f) { board.tasks[f.col].splice(f.i, 1); save(); render(); }
      });
      main.append(span, tagBtn, dueBtn, del);
      el.appendChild(main);

      /* Due date: a chip (red when overdue, amber when due today), or a date picker. */
      if (openDueFor === t.id) {
        const row = document.createElement("div");
        row.className = "due-edit";
        const input = document.createElement("input");
        input.type = "date";
        input.className = "due-input";
        input.value = t.due || "";
        input.setAttribute("aria-label", "Due date for " + t.title);
        input.addEventListener("change", () => { openDueFor = null; setDue(t.id, input.value); });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Escape") { openDueFor = null; render(); }
        });
        input.addEventListener("blur", () => { openDueFor = null; render(); });
        row.appendChild(input);
        if (t.due) {
          const clear = document.createElement("button");
          clear.type = "button";
          clear.className = "due-clear";
          clear.textContent = "Clear";
          clear.addEventListener("mousedown", (e) => { e.preventDefault(); openDueFor = null; setDue(t.id, ""); });
          row.appendChild(clear);
        }
        el.appendChild(row);
        input.focus();
      } else if (t.due) {
        const status = dueStatus(t.due, new Date());
        const chip = document.createElement("button");
        chip.type = "button";
        /* Cards already in Done stay neutral — the work is finished, not late. */
        chip.className = "due" + (c.id === "done" ? " due-done" : status ? " due-" + status : "");
        chip.textContent = "📅 " + formatDue(t.due) + (c.id !== "done" && status === "overdue" ? " · overdue" : status === "today" ? " · due today" : "");
        chip.title = "Click to change the due date";
        chip.addEventListener("click", () => { openDueFor = t.id; render(); });
        el.appendChild(chip);
      }

      if (openLabelFor === t.id) {
        const menu = document.createElement("div");
        menu.className = "label-menu";
        for (const key of Object.keys(LABELS)) {
          const on = t.labels.includes(key);
          const b = document.createElement("button");
          b.type = "button";
          b.className = "label-opt" + (on ? " on" : "");
          const dot = document.createElement("span");
          dot.className = "dot label-" + key;
          const txt = document.createElement("span");
          txt.textContent = LABELS[key].name;
          const tick = document.createElement("span");
          tick.className = "tick";
          tick.textContent = on ? "✓" : "";
          b.append(dot, txt, tick);
          b.addEventListener("click", () => toggleLabel(t.id, key));
          menu.appendChild(b);
        }
        el.appendChild(menu);
      }
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        el.classList.add("dragging");
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
      wrap.appendChild(el);
    }

    /* While searching, say so in columns where nothing matches. */
    if (q && shownInCol === 0) {
      const empty = document.createElement("p");
      empty.className = "no-match";
      empty.textContent = "No matching cards";
      wrap.appendChild(empty);
    }

    section.addEventListener("dragover", (e) => { e.preventDefault(); section.classList.add("dragover"); });
    section.addEventListener("dragleave", () => section.classList.remove("dragover"));
    section.addEventListener("drop", (e) => {
      e.preventDefault(); section.classList.remove("dragover");
      moveTask(Number(e.dataTransfer.getData("text/plain")), c.id);
    });

    section.append(h2, wrap);
    main.appendChild(section);
  }
}

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("taskTitle").value.trim();
  if (!title) return;
  const col = $("taskCol").value;
  if (!board.tasks[col]) return;
  const due = $("taskDue").value;
  board.tasks[col].push({ id: Date.now(), title, labels: [], due: parseDue(due) ? due : null });
  save(); render();
  $("taskTitle").value = "";
  $("taskDue").value = "";
});

$("addColForm").addEventListener("submit", (e) => {
  e.preventDefault();
  addColumn($("colName").value);
  $("colName").value = "";
});

/* Live search: filter as you type; Escape clears the filter. */
$("search").addEventListener("input", () => { searchQuery = $("search").value; render(); });
$("search").addEventListener("keydown", (e) => {
  if (e.key === "Escape") { searchQuery = ""; $("search").value = ""; render(); }
});

/* Export/import: download the board as JSON, or load one back in. */
$("exportBtn").addEventListener("click", exportBoard);
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importBoard(file);
  e.target.value = "";
});

render();
