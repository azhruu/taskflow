# TaskFlow — Build Roadmap

Each item lands as one complete, tested change.

- [x] Core board: 3 columns, add/delete cards, drag & drop, localStorage
- [x] Edit a card's title inline
- [x] Custom columns (add/rename/delete boards columns)
- [x] Card labels (color tags: bug, feature, urgent)
- [x] Due dates with overdue highlighting
- [x] Search/filter cards by text
- [x] Export/import board as JSON
- [x] Card counter stats header (done % progress bar)
- [x] Keyboard shortcut: N for new task — press N anywhere (except while typing) to jump to the new-task box; Esc leaves it again
- [x] Sample board button for first-time users
- [x] Polish: / focuses the search box — same anywhere-but-typing rule as the N shortcut, so filtering the board never needs the mouse
- [x] Polish: click a label chip on a card to filter the board by that label — it fills the search box with the label name, so the existing search does the filtering
- [x] Polish: ◀ ▶ move buttons on each card shift it to the neighbouring column without dragging — for touch and keyboard users, disabled at the board's edges
- [x] Polish: clear completed — one button empties the Done column (with a confirm naming how many cards go), disabled while there is nothing completed
- [x] Polish: deleting a card asks first — it was the only destructive action without a confirm, so it now names the card and says it cannot be undone
- [x] Polish: due-date chips show a relative day count — "in 2 days", "tomorrow", "due today", "yesterday", "3 days overdue" — so a card says how far away its date is, not just the calendar date (cards in Done stay neutral, as before)
- [x] Polish: Esc closes an open label menu or due-date editor, and clicking outside an open label menu closes it — the menu previously only closed by toggling the same card's 🏷 button again
- [x] Polish: drag a card onto another card to drop it just before that card — reorder within a column, or place it at a position in another column, instead of always landing at the end
- [x] Polish: column header counts show "X of Y" while searching — so each column says how many of its cards match the filter, not just its total
- [x] Polish: empty columns show a "No cards yet — drag one here" placeholder — a blank column looked broken and hid that it is a drop target for cards dragged from elsewhere
