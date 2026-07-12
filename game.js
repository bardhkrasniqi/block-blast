/* ============================================================
   Block Blast — a small color-block puzzle
   Drag one of three pieces onto the 8x8 grid. Complete a full
   row or column and it blasts away. Game ends when none of the
   three pieces can fit anywhere.
   ============================================================ */

(() => {
  "use strict";

  const N = 8;                        // board is N x N
  const BEST_KEY = "blockBlast.best";

  // Bright block colors.
  const COLORS = [
    "#f7768e", // red
    "#ff9e64", // orange
    "#e0af68", // yellow
    "#9ece6a", // green
    "#73daca", // teal
    "#7dcfff", // cyan
    "#7aa2f7", // blue
    "#bb9af7", // purple
    "#ff6bcb", // pink
  ];

  // Piece shapes as [row, col] offsets (top-left normalized).
  const SHAPES = [
    [[0,0]],                                            // •
    [[0,0],[0,1]],                                      // 2 wide
    [[0,0],[1,0]],                                      // 2 tall
    [[0,0],[0,1],[0,2]],                                // 3 wide
    [[0,0],[1,0],[2,0]],                                // 3 tall
    [[0,0],[0,1],[0,2],[0,3]],                          // 4 wide
    [[0,0],[1,0],[2,0],[3,0]],                          // 4 tall
    [[0,0],[0,1],[0,2],[0,3],[0,4]],                    // 5 wide
    [[0,0],[1,0],[2,0],[3,0],[4,0]],                    // 5 tall
    [[0,0],[0,1],[1,0],[1,1]],                          // 2x2 square
    [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], // 3x3 square
    // small L / corner (3 cells) x4
    [[0,0],[1,0],[1,1]],
    [[0,1],[1,0],[1,1]],
    [[0,0],[0,1],[1,0]],
    [[0,0],[0,1],[1,1]],
    // big L (4 cells) x4
    [[0,0],[1,0],[2,0],[2,1]],
    [[0,0],[0,1],[0,2],[1,0]],
    [[0,0],[0,1],[1,1],[2,1]],
    [[0,2],[1,0],[1,1],[1,2]],
    // T (4 cells) x4
    [[0,0],[0,1],[0,2],[1,1]],
    [[0,1],[1,0],[1,1],[2,1]],
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,0],[1,0],[1,1],[2,0]],
    // S / Z (4 cells)
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,0],[0,1],[1,1],[1,2]],
  ];

  // ---- DOM refs ----
  const boardEl   = document.getElementById("board");
  const trayEl    = document.getElementById("tray");
  const scoreEl   = document.getElementById("score");
  const bestEl    = document.getElementById("best");
  const comboEl   = document.getElementById("combo");
  const overlayEl = document.getElementById("gameover");
  const finalScoreEl = document.getElementById("final-score");
  const finalBestEl  = document.getElementById("final-best");

  // ---- State ----
  let board;          // N*N array of color string or null
  let cellEls;        // N*N array of cell DOM nodes
  let tray;           // array of {shape, color} | null (length 3)
  let score;
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;
  let combo;          // consecutive placements that cleared a line

  // ---- Helpers ----
  const idx = (r, c) => r * N + c;
  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function newPiece() {
    return { shape: rnd(SHAPES), color: rnd(COLORS) };
  }

  function pieceBounds(shape) {
    let maxR = 0, maxC = 0;
    for (const [r, c] of shape) { if (r > maxR) maxR = r; if (c > maxC) maxC = c; }
    return { rows: maxR + 1, cols: maxC + 1 };
  }

  // ---- Board build ----
  function buildBoard() {
    boardEl.style.setProperty("--n", N);
    boardEl.innerHTML = "";
    cellEls = new Array(N * N);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const d = document.createElement("div");
        d.className = "cell";
        d.dataset.r = r; d.dataset.c = c;
        boardEl.appendChild(d);
        cellEls[idx(r, c)] = d;
      }
    }
  }

  function renderBoard() {
    for (let i = 0; i < N * N; i++) {
      const el = cellEls[i];
      el.classList.remove("ghost", "ghost-bad");
      if (board[i]) {
        el.classList.add("filled");
        el.style.setProperty("--c", board[i]);
      } else {
        el.classList.remove("filled");
        el.style.removeProperty("--c");
      }
    }
  }

  function clearGhost() {
    for (const el of cellEls) el.classList.remove("ghost", "ghost-bad");
  }

  // ---- Tray render ----
  function renderTray() {
    trayEl.innerHTML = "";
    tray.forEach((piece, i) => {
      const wrap = document.createElement("div");
      wrap.className = "piece";
      wrap.dataset.index = i;
      if (!piece) { wrap.classList.add("used"); trayEl.appendChild(wrap); return; }

      const { rows, cols } = pieceBounds(piece.shape);
      wrap.style.gridTemplateColumns = `repeat(${cols}, var(--ps, 22px))`;
      const set = new Set(piece.shape.map(([r, c]) => r * cols + c));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement("div");
          if (set.has(r * cols + c)) {
            cell.className = "pcell";
            cell.style.setProperty("--c", piece.color);
          } else {
            cell.className = "pcell empty";
          }
          wrap.appendChild(cell);
        }
      }
      attachDrag(wrap, i);
      trayEl.appendChild(wrap);
    });
  }

  // ---- Placement logic ----
  function canPlaceAt(shape, top, left) {
    for (const [dr, dc] of shape) {
      const r = top + dr, c = left + dc;
      if (r < 0 || r >= N || c < 0 || c >= N) return false;
      if (board[idx(r, c)]) return false;
    }
    return true;
  }

  function canPlaceAnywhere(shape) {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (canPlaceAt(shape, r, c)) return true;
    return false;
  }

  function place(piece, top, left) {
    for (const [dr, dc] of piece.shape) board[idx(top + dr, left + dc)] = piece.color;
    score += piece.shape.length;               // points for each cell placed
    renderBoard();
    resolveClears();
    updateScore();
  }

  // ---- Line clears ----
  function resolveClears() {
    const fullRows = [], fullCols = [];
    for (let r = 0; r < N; r++) {
      let full = true;
      for (let c = 0; c < N; c++) if (!board[idx(r, c)]) { full = false; break; }
      if (full) fullRows.push(r);
    }
    for (let c = 0; c < N; c++) {
      let full = true;
      for (let r = 0; r < N; r++) if (!board[idx(r, c)]) { full = false; break; }
      if (full) fullCols.push(c);
    }

    const lines = fullRows.length + fullCols.length;
    if (lines === 0) { combo = 0; return; }

    // Mark cells for the blast animation, then clear.
    const toClear = new Set();
    for (const r of fullRows) for (let c = 0; c < N; c++) toClear.add(idx(r, c));
    for (const c of fullCols) for (let r = 0; r < N; r++) toClear.add(idx(r, c));
    for (const i of toClear) cellEls[i].classList.add("clearing");

    combo += 1;
    // Scoring: 10 per line, quadratic bonus for multi-line blasts, plus combo streak.
    let gained = lines * 10 + (lines > 1 ? lines * lines * 5 : 0);
    if (combo > 1) gained += combo * 5;
    score += gained;

    if (lines >= 2 || combo > 1) showCombo(lines, combo);

    setTimeout(() => {
      for (const i of toClear) { board[i] = null; cellEls[i].classList.remove("clearing"); }
      renderBoard();
    }, 280);
  }

  function showCombo(lines, streak) {
    let txt = lines >= 2 ? `${lines}× BLAST!` : "COMBO!";
    if (streak > 1) txt = `COMBO ×${streak}`;
    comboEl.textContent = txt;
    comboEl.classList.remove("show");
    void comboEl.offsetWidth;      // restart animation
    comboEl.classList.add("show");
  }

  // ---- Score ----
  function updateScore() {
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, best);
    }
    bestEl.textContent = best;
  }

  // ---- Turn flow ----
  function refillIfEmpty() {
    if (tray.every((p) => p === null)) {
      tray = [newPiece(), newPiece(), newPiece()];
      renderTray();
    }
  }

  function checkGameOver() {
    const alive = tray.filter(Boolean);
    if (alive.length === 0) return false;
    for (const p of alive) if (canPlaceAnywhere(p.shape)) return false;
    return true;
  }

  function endGame() {
    finalScoreEl.textContent = score;
    finalBestEl.textContent = best;
    overlayEl.classList.remove("hidden");
  }

  // ---- Drag & drop (pointer events: mouse + touch) ----
  let drag = null;

  function attachDrag(el, index) {
    el.addEventListener("pointerdown", (e) => startDrag(e, el, index));
  }

  function startDrag(e, el, index) {
    if (!tray[index]) return;
    e.preventDefault();

    const piece = tray[index];
    const { rows, cols } = pieceBounds(piece.shape);

    // Which sub-cell of the piece was grabbed (for a natural anchor).
    const rect = el.getBoundingClientRect();
    const psInner = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ps")) || 22;
    // fall back: infer from element size
    const approxPS = (rect.width - 8) / cols;
    const ps = approxPS > 8 ? approxPS : psInner;
    let grabDC = Math.floor((e.clientX - rect.left - 4) / (ps + 4));
    let grabDR = Math.floor((e.clientY - rect.top - 8) / (ps + 4));
    grabDC = Math.max(0, Math.min(cols - 1, grabDC));
    grabDR = Math.max(0, Math.min(rows - 1, grabDR));

    // Build a floating clone sized to the board's cells.
    const cellRect = cellEls[0].getBoundingClientRect();
    const cs = cellRect.width;
    const gap = parseFloat(getComputedStyle(boardEl).gap) || 6;
    const float = document.createElement("div");
    float.className = "float";
    float.style.gridTemplateColumns = `repeat(${cols}, ${cs}px)`;
    const set = new Set(piece.shape.map(([r, c]) => r * cols + c));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = document.createElement("div");
        d.className = set.has(r * cols + c) ? "pcell" : "pcell empty";
        d.style.width = cs + "px";
        d.style.height = cs + "px";
        if (set.has(r * cols + c)) d.style.setProperty("--c", piece.color);
        float.appendChild(d);
      }
    }
    document.body.appendChild(float);
    el.classList.add("dragging");

    const lift = e.pointerType === "touch" ? cs * 1.35 : 0;

    drag = { index, piece, rows, cols, grabDR, grabDC, float, cs, gap, lift, el };
    moveDrag(e);

    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  function targetCell(e) {
    // Anchor point = pointer, lifted up on touch, offset back to piece top-left.
    const { grabDR, grabDC, cs, gap, lift } = drag;
    const ax = e.clientX;
    const ay = e.clientY - lift;
    const boardRect = boardEl.getBoundingClientRect();
    const pad = gap; // board inner padding equals gap
    // position of the piece's top-left cell center
    const cellCenterX = ax - grabDC * (cs + gap);
    const cellCenterY = ay - grabDR * (cs + gap);
    const col = Math.round((cellCenterX - boardRect.left - pad - cs / 2) / (cs + gap));
    const row = Math.round((cellCenterY - boardRect.top - pad - cs / 2) / (cs + gap));
    return { row, col, ax, ay, cellCenterX, cellCenterY };
  }

  function moveDrag(e) {
    if (!drag) return;
    const { float, grabDR, grabDC, cs, gap } = drag;
    const t = targetCell(e);
    // place the floating clone so its top-left cell aligns to the grid mentally
    float.style.left = (t.cellCenterX - cs / 2) + "px";
    float.style.top  = (t.cellCenterY - cs / 2) + "px";

    clearGhost();
    drag.valid = false;
    drag.top = t.row; drag.left = t.col;
    if (canPlaceAt(drag.piece.shape, t.row, t.col)) {
      drag.valid = true;
      for (const [dr, dc] of drag.piece.shape) {
        const el = cellEls[idx(t.row + dr, t.col + dc)];
        el.classList.add("ghost");
        el.style.setProperty("--c", drag.piece.color);
      }
    } else {
      // show a soft red hint if within the board area
      for (const [dr, dc] of drag.piece.shape) {
        const r = t.row + dr, c = t.col + dc;
        if (r >= 0 && r < N && c >= 0 && c < N) cellEls[idx(r, c)].classList.add("ghost-bad");
      }
    }
  }

  function endDrag() {
    if (!drag) return;
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);

    const d = drag;
    d.float.remove();
    d.el.classList.remove("dragging");
    clearGhost();

    if (d.valid && canPlaceAt(d.piece.shape, d.top, d.left)) {
      tray[d.index] = null;
      place(d.piece, d.top, d.left);
      renderTray();
      refillIfEmpty();
      if (checkGameOver()) endGame();
    } else {
      renderBoard(); // restore any --c set on ghost cells
    }
    drag = null;
  }

  // ---- New game ----
  function reset() {
    board = new Array(N * N).fill(null);
    tray = [newPiece(), newPiece(), newPiece()];
    score = 0;
    combo = 0;
    overlayEl.classList.add("hidden");
    renderBoard();
    renderTray();
    updateScore();
  }

  document.getElementById("restart").addEventListener("click", reset);
  document.getElementById("play-again").addEventListener("click", reset);

  buildBoard();
  bestEl.textContent = best;
  reset();
})();
