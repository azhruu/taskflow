# TaskFlow

**A lightweight Kanban board that runs entirely in your browser.** Add tasks, drag them across To Do → In Progress → Done, and everything persists automatically.

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-actively%20building-brightgreen?style=for-the-badge)

## Features

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

Card labels & due dates → board export. Full plan: [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
