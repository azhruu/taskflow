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

const DEFAULT_COLUMNS = [
  { id: "todo", name: "To Do" },
  { id: "doing", name: "In Progress" },
  { id: "done", name: "Done" },
];

let board = load();

/* Tasks gained a `labels` array (subset of LABELS keys); older saves lack it. */
for (const c of board.columns)
  for (const t of board.tasks[c.id])
    t.labels = Array.isArray(t.labels) ? t.labels.filter((l) => LABELS[l]) : [];

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
    for (const t of board.tasks[c.id]) {
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
      const del = document.createElement("button");
      del.className = "del"; del.textContent = "✕"; del.title = "Delete";
      del.addEventListener("click", () => {
        const f = findTask(t.id);
        if (f) { board.tasks[f.col].splice(f.i, 1); save(); render(); }
      });
      main.append(span, tagBtn, del);
      el.appendChild(main);

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
  board.tasks[col].push({ id: Date.now(), title, labels: [] });
  save(); render();
  $("taskTitle").value = "";
});

$("addColForm").addEventListener("submit", (e) => {
  e.preventDefault();
  addColumn($("colName").value);
  $("colName").value = "";
});

render();
