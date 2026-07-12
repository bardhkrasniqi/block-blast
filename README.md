# Block Blast

A small color-block puzzle game — drag pieces onto an 8×8 grid, fill a full row or column, and it blasts away. The game ends when none of your three pieces can fit anywhere.

Built with plain **HTML / CSS / JavaScript** — no build step, no dependencies.

## Play

Open `index.html` in any browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Works with mouse (drag) and touch (drag; the piece lifts above your finger).

## How it works

- **Board**: 8×8 grid.
- **Pieces**: three shapes at a time in the tray; refills when all three are used.
- **Scoring**: +1 per placed cell, +10 per cleared line, with bonuses for multi-line blasts and combo streaks.
- **Best score** is saved in the browser via `localStorage`.

## Files

| File         | Purpose                          |
|--------------|----------------------------------|
| `index.html` | Markup and layout                |
| `style.css`  | Tokyo Night themed styling       |
| `game.js`    | Game logic, drag & drop, scoring |

## License

MIT — do whatever you like.
