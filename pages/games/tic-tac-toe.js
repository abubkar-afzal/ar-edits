// pages/games/tic-tac-toe.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaRobot,
  FaRedo,
  FaExpand,
  FaCompress,
  FaArrowLeft,
  FaBars,
  FaTimes,
  FaCircle,
} from "react-icons/fa";

// ─── Predefined colours ────────────────────────────────
const COLORS = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Red", color: "#ef4444" },
  { name: "Green", color: "#22c55e" },
  { name: "Purple", color: "#a855f7" },
  { name: "Orange", color: "#f97316" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Pink", color: "#ec4899" },
  { name: "White", color: "#f8fafc" },
];

// ─── Symbol sets for up to 4 players ───────────────────
const SYMBOLS_ICONS = {
  "X": FaTimes,
  "O": FaCircle,
  "Δ": (props) => <span {...props}>Δ</span>,
  "□": (props) => <span {...props}>□</span>,
};
const DEFAULT_SYMBOLS = ["X", "O", "Δ", "□"];

// ─── Win detection (any line of winLength) ─────────────
function getWinner(board, size, winLength) {
  const checkLine = (cells) => {
    const first = cells[0];
    if (!first) return false;
    return cells.every((c) => c === first) ? first : false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line = [];
      for (let i = 0; i < winLength; i++) line.push(board[r][c + i]);
      const winner = checkLine(line);
      if (winner) return winner;
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      const line = [];
      for (let i = 0; i < winLength; i++) line.push(board[r + i][c]);
      const winner = checkLine(line);
      if (winner) return winner;
    }
  }
  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line = [];
      for (let i = 0; i < winLength; i++) line.push(board[r + i][c + i]);
      const winner = checkLine(line);
      if (winner) return winner;
    }
  }
  for (let r = winLength - 1; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      const line = [];
      for (let i = 0; i < winLength; i++) line.push(board[r - i][c + i]);
      const winner = checkLine(line);
      if (winner) return winner;
    }
  }
  return null;
}

// ─── AI (minimax) for 2-player 3×3 only ────────────────
function minimax(board, depth, isMaximizing, aiSymbol, humanSymbol) {
  const winLength = 3;
  const winner = getWinner(board, 3, winLength);
  if (winner === aiSymbol) return { score: 10 - depth };
  if (winner === humanSymbol) return { score: depth - 10 };
  if (board.flat().every((s) => s !== null)) return { score: 0 };
  if (depth >= 5) return { score: 0 };

  if (isMaximizing) {
    let best = -Infinity, bestMove = -1;
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      if (board[r][c]) continue;
      board[r][c] = aiSymbol;
      const result = minimax(board, depth + 1, false, aiSymbol, humanSymbol);
      board[r][c] = null;
      if (result.score > best) { best = result.score; bestMove = i; }
    }
    return { score: best, move: bestMove };
  } else {
    let best = Infinity, bestMove = -1;
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      if (board[r][c]) continue;
      board[r][c] = humanSymbol;
      const result = minimax(board, depth + 1, true, aiSymbol, humanSymbol);
      board[r][c] = null;
      if (result.score < best) { best = result.score; bestMove = i; }
    }
    return { score: best, move: bestMove };
  }
}

export default function TicTacToe() {
  const router = useRouter();
  const [phase, setPhase] = useState("setup");
  const [numPlayers, setNumPlayers] = useState(2);
  const [boardSize, setBoardSize] = useState(3);
  const winLength = boardSize;
  const maxPieces = boardSize;

  const [board, setBoard] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState("ai");
  const [difficulty, setDifficulty] = useState("medium");
  const [playerSymbol, setPlayerSymbol] = useState("X");
  const [colors, setColors] = useState({ "X": "#3b82f6", "O": "#ef4444", "Δ": "#a855f7", "□": "#f97316" });
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [removedPiece, setRemovedPiece] = useState(null);

  const moveOrders = useRef({});

  const symbols = DEFAULT_SYMBOLS.slice(0, numPlayers);
  const aiSymbol = mode === "ai" && numPlayers === 2 ? (playerSymbol === "X" ? "O" : "X") : null;
  const humanSymbol = numPlayers === 2 ? playerSymbol : null;

  useEffect(() => {
    const size = numPlayers + 1;
    setBoardSize(size);
    setBoard(Array(size).fill().map(() => Array(size).fill(null)));
    moveOrders.current = {};
    symbols.forEach(s => moveOrders.current[s] = []);
  }, [numPlayers]);

  const resetGame = () => {
    setBoard(Array(boardSize).fill().map(() => Array(boardSize).fill(null)));
    setTurnIndex(0);
    setWinner(null);
    setGameOver(false);
    setIsAiThinking(false);
    setRemovedPiece(null);
    moveOrders.current = {};
    symbols.forEach(s => moveOrders.current[s] = []);
  };

  const handleMove = useCallback((row, col, symbol) => {
    if (gameOver || winner) return;
    const newBoard = board.map(r => [...r]);
    const moveOrder = moveOrders.current[symbol] || [];

    if (moveOrder.length >= maxPieces) {
      const oldest = moveOrder.shift();
      if (newBoard[oldest.r][oldest.c] === symbol) {
        newBoard[oldest.r][oldest.c] = null;
        setRemovedPiece({ index: oldest.r * boardSize + oldest.c, symbol });
      }
    }

    newBoard[row][col] = symbol;
    moveOrder.push({ r: row, c: col });
    moveOrders.current[symbol] = moveOrder;

    setBoard(newBoard);

    const win = getWinner(newBoard, boardSize, winLength);
    if (win) {
      setWinner(win);
      setGameOver(true);
    } else if (newBoard.flat().every(cell => cell !== null)) {
      setGameOver(true);
    } else {
      const nextIndex = (turnIndex + 1) % symbols.length;
      setTurnIndex(nextIndex);
    }

    setTimeout(() => setRemovedPiece(null), 300);
  }, [board, gameOver, winner, turnIndex, symbols, boardSize, winLength, maxPieces]);

  const handleCellClick = (row, col) => {
    if (gameOver || winner) return;
    if (mode === "ai" && numPlayers === 2 && symbols[turnIndex] !== playerSymbol) return;
    if (board[row][col]) return;
    handleMove(row, col, symbols[turnIndex]);
  };

  useEffect(() => {
    if (
      phase !== "playing" ||
      numPlayers !== 2 ||
      mode !== "ai" ||
      gameOver ||
      winner ||
      symbols[turnIndex] !== aiSymbol
    ) return;

    setIsAiThinking(true);
    const timeout = setTimeout(() => {
      if (boardSize !== 3) {
        const emptyCells = [];
        for (let r = 0; r < boardSize; r++)
          for (let c = 0; c < boardSize; c++)
            if (!board[r][c]) emptyCells.push({ r, c });
        if (emptyCells.length > 0) {
          const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          handleMove(move.r, move.c, aiSymbol);
        }
      } else {
        let moveIndex = -1;
        if (difficulty === "easy") {
          const emptyIndices = [];
          for (let i = 0; i < 9; i++) {
            const r = Math.floor(i / 3), c = i % 3;
            if (!board[r][c]) emptyIndices.push(i);
          }
          if (emptyIndices.length > 0) moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        } else if (difficulty === "medium") {
          const b = board.map(r => [...r]);
          const result = minimax(b, 0, true, aiSymbol, humanSymbol);
          moveIndex = result.move;
        } else {
          const b = board.map(r => [...r]);
          const result = minimax(b, 0, true, aiSymbol, humanSymbol);
          moveIndex = result.move;
        }
        if (moveIndex !== -1) {
          const r = Math.floor(moveIndex / 3), c = moveIndex % 3;
          handleMove(r, c, aiSymbol);
        }
      }
      setIsAiThinking(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [turnIndex, phase, gameOver, board, symbols, aiSymbol, humanSymbol, boardSize, difficulty, winner, handleMove]);

  const startGame = () => {
    resetGame();
    setPhase("playing");
  };

  const goToSetup = () => {
    setPhase("setup");
    resetGame();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const getPlayerColor = (sym) => colors[sym] || "#fff";

  if (phase === "setup") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-4"
        style={{ backgroundColor: "var(--white)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-6 rounded-2xl shadow-2xl"
          style={{
            backgroundColor: "var(--white)",
            border: "1px solid var(--darkgray, #333)",
            color: "var(--black)",
          }}
        >
          <h2 className="text-2xl font-bold text-center mb-6">⭕❌ Tic Tac Toe</h2>

          <div className="mb-5">
            <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>
              Players
            </p>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <motion.button
                  key={n}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setNumPlayers(n); if (n > 2) setMode("friend"); }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm"
                  style={{
                    backgroundColor: numPlayers === n ? "var(--red, #3b82f6)" : "var(--white)",
                    color: "var(--black)",
                    border: numPlayers === n ? "2px solid var(--red, #3b82f6)" : "2px solid transparent",
                  }}
                >
                  {n} {n === 2 ? "Players" : "Players"}
                </motion.button>
              ))}
            </div>
          </div>

          {numPlayers === 2 && (
            <div className="mb-5">
              <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>
                Mode
              </p>
              <div className="flex gap-2">
                {["friend", "ai"].map((m) => (
                  <motion.button
                    key={m}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMode(m)}
                    className="flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: mode === m ? "var(--red, #3b82f6)" : "var(--white)",
                      color: "var(--black)",
                      border: mode === m ? "2px solid var(--red, #3b82f6)" : "2px solid transparent",
                    }}
                  >
                    {m === "friend" ? <FaUserFriends /> : <FaRobot />}
                    {m === "friend" ? "Friend" : "Computer"}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {numPlayers === 2 && (
            <div className="mb-5">
              <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>
                Your Symbol
              </p>
              <div className="flex gap-2">
                {["X", "O"].map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPlayerSymbol(s)}
                    className="flex-1 py-3 rounded-xl font-bold text-lg"
                    style={{
                      backgroundColor: playerSymbol === s ? "var(--red, #3b82f6)" : "var(--white)",
                      color: s === "X" ? colors.X : colors.O,
                      border: playerSymbol === s ? "2px solid var(--red, #3b82f6)" : "2px solid transparent",
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {numPlayers === 2 && mode === "ai" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5"
            >
              <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>
                Difficulty
              </p>
              <div className="grid grid-cols-3 gap-2">
                {["easy", "medium", "hard"].map((d) => (
                  <motion.button
                    key={d}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDifficulty(d)}
                    className="py-2 rounded-xl text-sm font-medium capitalize"
                    style={{
                      backgroundColor: difficulty === d ? "var(--red, #3b82f6)" : "var(--white)",
                      color: "var(--black)",
                      border: difficulty === d ? "2px solid var(--red, #3b82f6)" : "2px solid transparent",
                    }}
                  >
                    {d}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {symbols.map((sym) => (
            <div key={sym} className="mb-4">
              <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>
                {sym} Color
              </p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <motion.button
                    key={c.color}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setColors(prev => ({ ...prev, [sym]: c.color }))}
                    className="w-8 h-8 rounded-full border-2"
                    style={{
                      backgroundColor: c.color,
                      borderColor: colors[sym] === c.color ? "var(--white, #fff)" : "transparent",
                      boxShadow: colors[sym] === c.color ? `0 0 10px ${c.color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full py-3 rounded-xl font-bold text-lg shadow-lg mt-4 cursor-pointer"
            style={{ backgroundColor: "var(--green, #22c55e)", color: "var(--black)" }}
          >
            Start Game
          </motion.button>
          <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push("/games")}
                          className="w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center my-2 mt-4 cursor-pointer"
                          style={{
                            backgroundColor: "var(--red)",
                            color: "var(--white)",
                          }}
                        >
                          <FaArrowLeft className="mx-2"/> Back to Games
                        </motion.button>
        </motion.div>
      </div>
    );
  }

  const currentSymbol = symbols[turnIndex];
  const isMyTurn = mode === "ai" && numPlayers === 2 ? currentSymbol === playerSymbol : true;
  const statusText = winner
    ? `🏆 ${winner} wins!`
    : gameOver
    ? "🤝 Draw!"
    : isAiThinking
    ? "🤔 Opponent thinking…"
    : mode === "ai" && numPlayers === 2
    ? (isMyTurn ? `Your turn` : `Opponent's turn`)
    : `Turn: ${currentSymbol}`;

  const StatusIcon = SYMBOLS_ICONS[currentSymbol] || FaCircle;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4"
      style={{ backgroundColor: "var(--white)" }}
    >
      {/* Top bar – large status like chess */}
      <div className="w-full flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold" style={{ color: "var(--black)" }}>
          <StatusIcon
            style={{
              color: getPlayerColor(currentSymbol),
              filter: `drop-shadow(0 0 2px ${getPlayerColor(currentSymbol)})`,
              fontSize: "1.4rem",
            }}
          />
          <span>{statusText}</span>
        </div>

        <motion.div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full"
            style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
          >
            <FaBars size={20} />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-50 overflow-hidden"
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--darkgray, #333)",
                }}
              >
                <button onClick={() => { setShowMenu(false); goToSetup(); }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3"
                  style={{ color: "var(--black)" }}
                >
                  <FaRedo /> New Game
                </button>
                <button onClick={() => { toggleFullscreen(); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3"
                  style={{ color: "var(--black)" }}
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </button>
                <button onClick={() => router.push("/games")}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3"
                  style={{ color: "var(--black)" }}
                >
                  <FaArrowLeft /> Back to Games
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Board */}
      <div
        className="grid gap-3 w-full max-w-lg aspect-square"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const index = r * boardSize + c;
            const isRemoved = removedPiece?.index === index;
            const SymbolIcon = cell ? SYMBOLS_ICONS[cell] || FaCircle : null;
            return (
              <motion.button
                key={`${r}-${c}`}
                whileHover={{ scale: cell ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCellClick(r, c)}
                className="rounded-xl shadow-lg flex items-center justify-center text-5xl font-bold transition-all relative overflow-hidden"
                style={{
                  backgroundColor: cell
                    ? getPlayerColor(cell) + "22"
                    : "var(--gray-800, #1e293b)",
                  border: `2px solid ${
                    cell ? getPlayerColor(cell) : "var(--darkgray, #333)"
                  }`,
                  color: cell ? getPlayerColor(cell) : "transparent",
                  boxShadow: cell ? `0 0 15px ${getPlayerColor(cell)}55` : "none",
                  opacity: isRemoved ? 0 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <AnimatePresence>
                  {cell && !isRemoved && SymbolIcon && (
                    <motion.div
                      key={cell + r + c}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <SymbolIcon />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Win/Draw Modal */}
      <AnimatePresence>
        {(winner || gameOver) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4"
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--darkgray, #333)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-4xl mb-4"
              >
                {winner ? "🏆" : "🤝"}
              </motion.div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--black)" }}>
                {winner ? `${winner} Wins!` : "Draw!"}
              </h2>
              <p className="text-lg mb-6" style={{ color: "var(--gray, #ccc)" }}>
                {winner ? "Congratulations!" : "It's a tie."}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToSetup()}
                className="px-6 py-3 rounded-xl font-bold shadow-lg"
                style={{ backgroundColor: "var(--red, #3b82f6)", color: "var(--black)" }}
              >
                Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}