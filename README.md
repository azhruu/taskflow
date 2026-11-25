# TaskFlow

**A lightweight Kanban board that runs entirely in your browser.** Add tasks, drag them across To Do → In Progress → Done, and everything persists automatically.

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-actively%20building-brightgreen?style=for-the-badge)

## Features

- 🌓 Dark/light theme toggle — switch the whole board between dark and light; your choice is remembered, otherwise it follows your OS setting
- 🎲 Sample board — one click loads a small realistic board (labels, due dates, a card in each state) so first-time users can explore; an empty board loads straight away, a board with cards asks first since it replaces the board
- ⌨️ Keyboard shortcut — press **N** anywhere (except while typing) to jump to the new-task box; Esc leaves it again. Press **/** anywhere to jump to the search box
- 📊 Card counter stats header — live count of done vs total cards with a progress bar and overdue count, updated on every change
- 🧹 Clear completed — one click empties the Done column (asks first, naming how many cards go); disabled while nothing is completed
- 📦 Export/import — download the whole board as one JSON file, or import one back (invalid files are rejected, unknown labels and bad dates are dropped, import confirms before replacing the board)
- 🔎 Search/filter — live text search across card titles and label names, with a match count and Esc to clear; while filtering, each column header shows how many of its cards match ("X of Y"); click a label chip on any card to filter by that label
- 🗂️ Custom columns — add, rename, and delete board columns (with live card counts)
- 🏷️ Card labels — tag any card **bug** (red), **feature** (green) or **urgent** (amber) from the 🏷 button; labels persist with the board. Esc closes the open label menu or due-date editor, and clicking outside an open label menu closes it
- 📅 Due dates — pick one in the add form or with the 📅 button on any card; overdue cards turn red, due-today amber (cards in Done stay neutral), and the chip shows a relative day count ("in 2 days", "tomorrow", "3 days overdue"); click the date to change or clear it
- 🪧 Empty-column placeholder — a column with no cards says "No cards yet — drag one here" instead of sitting blank, so it reads as a drop target
- 🖱️ Drag & drop cards between columns (HTML5 drag events) — drop a card on another card to place it just before that card and reorder within a column, or use the ◀ ▶ buttons on a card to move it to the neighbouring column without dragging
- ✏️ Double-click any card to edit its title inline (Enter saves, Esc cancels)
- ➕ Quick-add form, one-click delete (asks first — deleting a card cannot be undone)
- 💾 Auto-save to `localStorage` — refresh-proof
- 🌑 Clean dark UI (light theme one click away), responsive grid

## Run it

Open `index.html` in any browser, or:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Roadmap

Keyboard shortcut (N for new task) → sample board button. The roadmap is now complete — full plan: [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
