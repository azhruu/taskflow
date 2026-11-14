# TaskFlow

**A lightweight Kanban board that runs entirely in your browser.** Add tasks, drag them across To Do → In Progress → Done, and everything persists automatically.

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-actively%20building-brightgreen?style=for-the-badge)

## Features

- 🎲 Sample board — one click loads a small realistic board (labels, due dates, a card in each state) so first-time users can explore; an empty board loads straight away, a board with cards asks first since it replaces the board
- ⌨️ Keyboard shortcut — press **N** anywhere (except while typing) to jump to the new-task box; Esc leaves it again
- 📊 Card counter stats header — live count of done vs total cards with a progress bar and overdue count, updated on every change
- 📦 Export/import — download the whole board as one JSON file, or import one back (invalid files are rejected, unknown labels and bad dates are dropped, import confirms before replacing the board)
- 🔎 Search/filter — live text search across card titles and label names, with a match count and Esc to clear
- 🗂️ Custom columns — add, rename, and delete board columns (with live card counts)
- 🏷️ Card labels — tag any card **bug** (red), **feature** (green) or **urgent** (amber) from the 🏷 button; labels persist with the board
- 📅 Due dates — pick one in the add form or with the 📅 button on any card; overdue cards turn red, due-today amber (cards in Done stay neutral), click the date to change or clear it
- 🖱️ Drag & drop cards between columns (HTML5 drag events)
- ✏️ Double-click any card to edit its title inline (Enter saves, Esc cancels)
- ➕ Quick-add form, one-click delete
- 💾 Auto-save to `localStorage` — refresh-proof
- 🌑 Clean dark UI, responsive grid

## Run it

Open `index.html` in any browser, or:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Roadmap

Keyboard shortcut (N for new task) → sample board button. The roadmap is now complete — full plan: [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
