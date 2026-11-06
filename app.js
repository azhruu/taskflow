/* TaskFlow — Kanban board, vanilla JS + localStorage. */
"use strict";

const KEY = "taskflow-v1";
const COLS = ["todo", "doing", "done"];
const $ = (id) => document.getElementById(id);

let board = load();

function load() {
  try {
    const b = JSON.parse(localStorage.getItem(KEY));
    if (b && COLS.every((c) => Array.isArray(b[c]))) return b;
  } catch { /* fall through */ }
  return { todo: [], doing: [], done: [] };
}
function save() { localStorage.setItem(KEY, JSON.stringify(board)); }

function findTask(id) {
  for (const col of COLS) {
    const i = board[col].findIndex((t) => t.id === id);
    if (i !== -1) return { col, i, task: board[col][i] };
  }
  return null;
}

function moveTask(id, toCol) {
  const found = findTask(id);
  if (!found || found.col === toCol) return;
  board[found.col].splice(found.i, 1);
  board[toCol].push(found.task);
  save(); render();
}

function render() {
  for (const col of COLS) {
    const wrap = $("col-" + col);
    wrap.innerHTML = "";
    $("count-" + col).textContent = board[col].length;
    for (const t of board[col]) {
      const el = document.createElement("div");
      el.className = "card";
      el.draggable = true;
      el.dataset.id = t.id;
      const span = document.createElement("span");
      span.textContent = t.title;
      const del = document.createElement("button");
      del.className = "del"; del.textContent = "✕"; del.title = "Delete";
      del.addEventListener("click", () => {
        const f = findTask(t.id);
        if (f) { board[f.col].splice(f.i, 1); save(); render(); }
      });
      el.append(span, del);
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        el.classList.add("dragging");
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
      wrap.appendChild(el);
    }
  }
}

document.querySelectorAll(".col").forEach((colEl) => {
  const col = colEl.dataset.col;
  colEl.addEventListener("dragover", (e) => { e.preventDefault(); colEl.classList.add("dragover"); });
  colEl.addEventListener("dragleave", () => colEl.classList.remove("dragover"));
  colEl.addEventListener("drop", (e) => {
    e.preventDefault(); colEl.classList.remove("dragover");
    moveTask(Number(e.dataTransfer.getData("text/plain")), col);
  });
});

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("taskTitle").value.trim();
  if (!title) return;
  board[$("taskCol").value].push({ id: Date.now(), title });
  save(); render();
  $("taskTitle").value = "";
});

render();
