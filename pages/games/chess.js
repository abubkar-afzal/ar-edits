// pages/games/chess.js
import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaRobot,
  FaRedo,
  FaExpand,
  FaCompress,
  FaArrowLeft,
  FaChessKing,
  FaChessQueen,
  FaChessRook,
  FaChessBishop,
  FaChessKnight,
  FaChessPawn,
  FaBars,
} from "react-icons/fa";

// ─── AI evaluation ────────────────────────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 };

function evaluateBoard(board) {
  let score = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type.toLowerCase()] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }
  return score;
}

function minimax(game, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || game.isGameOver()) return { score: evaluateBoard(game.board()) };
  const moves = game.moves({ verbose: true });
  let bestMove = null;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      const result = minimax(newGame, depth - 1, alpha, beta, false);
      if (result.score > maxEval) { maxEval = result.score; bestMove = move; }
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      const result = minimax(newGame, depth - 1, alpha, beta, true);
      if (result.score < minEval) { minEval = result.score; bestMove = move; }
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

// ─── Piece icon mapping ──────────────────────────────────
const PIECE_ICONS = {
  w: {
    k: FaChessKing,
    q: FaChessQueen,
    r: FaChessRook,
    b: FaChessBishop,
    n: FaChessKnight,
    p: FaChessPawn,
  },
  b: {
    k: FaChessKing,
    q: FaChessQueen,
    r: FaChessRook,
    b: FaChessBishop,
    n: FaChessKnight,
    p: FaChessPawn,
  },
};

// ─── Visual colours for pieces ────────────────────────────
const PIECE_COLOR_MAP = {
  w: "var(--piece-white, #ffe4b5)",
  b: "var(--piece-black, #2d2d2d)",
};
const PIECE_SHADOW_MAP = {
  w: "drop-shadow(0 0 2px var(--piece-black, #2d2d2d))",
  b: "drop-shadow(0 0 2px var(--piece-white, #ffe4b5))",
};

export default function ChessGame() {
  const router = useRouter();
  const [phase, setPhase] = useState('setup');
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [turn, setTurn] = useState('w');
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState('ai');
  const [difficulty, setDifficulty] = useState('normal');
  const [status, setStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const isAiThinkingRef = useRef(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [captureFlash, setCaptureFlash] = useState(null);
  const animationTimer = useRef(null);

  const aiColor = mode === 'ai' ? (playerColor === 'w' ? 'b' : 'w') : null;

  const friendlyStatus = () => {
    if (isAiThinking) return '🤔 Opponent is thinking…';
    if (gameOver) return status;
    if (mode === 'friend') return status;
    const isMyTurn = turn === playerColor;
    const colorName = turn === 'w' ? 'White' : 'Black';
    if (isMyTurn) return `Your turn (${colorName})`;
    return `Opponent's turn (${colorName})`;
  };

  const updateStatus = (g) => {
    if (g.isGameOver()) {
      setGameOver(true);
      if (g.isCheckmate()) setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins!`);
      else if (g.isDraw()) setStatus('Draw!');
      else if (g.isStalemate()) setStatus('Stalemate!');
      else setStatus('Game Over');
    } else if (g.isCheck()) {
      setStatus(`Check! ${g.turn() === 'w' ? 'White' : 'Black'} to move`);
    } else {
      setStatus(`${g.turn() === 'w' ? 'White' : 'Black'} to move`);
    }
    setTurn(g.turn());
  };

  // Cleanup animation timers
  useEffect(() => {
    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, []);

  const startGame = (finalColor) => {
    setPlayerColor(finalColor);
    const newGame = new Chess();
    setGame(newGame);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameOver(false);
    setIsAiThinking(false);
    isAiThinkingRef.current = false;
    setCaptureFlash(null);
    updateStatus(newGame);
    setPhase('playing');
  };

  const goToSetup = () => {
    setPhase('setup');
    setPlayerColor(null);
    setGameOver(false);
    setIsAiThinking(false);
    isAiThinkingRef.current = false;
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setCaptureFlash(null);
  };

  const confirmAction = () => {
    if (showConfirm?.action === 'reset') goToSetup();
    else if (showConfirm?.action === 'switchMode') {
      setMode(showConfirm.value);
      goToSetup();
    }
    setShowConfirm(null);
    setShowMenu(false);
  };

  const handleResetClick = () => {
    if (moveHistory.length > 0) setShowConfirm({ action: 'reset' });
    else goToSetup();
    setShowMenu(false);
  };

  const handleModeSwitch = (newMode) => {
    if (moveHistory.length > 0 && newMode !== mode) setShowConfirm({ action: 'switchMode', value: newMode });
    else { setMode(newMode); goToSetup(); }
    setShowMenu(false);
  };

  // ─── Commit a move after a delay for animation ───────────
  const commitMove = (newGameFen, moveObj, isCapture) => {
    const newGame = new Chess(newGameFen);
    setGame(newGame);
    setLastMove({ from: moveObj.from, to: moveObj.to, capture: isCapture });
    setLegalMoves([]);
    setMoveHistory(prev => [...prev, moveObj.san]);
    updateStatus(newGame);
    if (isCapture) {
      // Trigger capture flash after board has updated
      setTimeout(() => setCaptureFlash(moveObj.to), 50);
      setTimeout(() => setCaptureFlash(null), 600);
    }
    isAiThinkingRef.current = false;
    setIsAiThinking(false);
  };

  // ─── AI move ─────────────────────────────────────────────
  const makeAIMove = useCallback(() => {
    if (isAiThinkingRef.current || gameOver || !aiColor || turn !== aiColor) return;
    isAiThinkingRef.current = true;
    setIsAiThinking(true);

    setTimeout(() => {
      const depthMap = { easy: 0, normal: 1, hard: 2, pro: 3 };
      let depth = depthMap[difficulty] || 1;
      let move = null;

      if (depth === 0) {
        const moves = game.moves({ verbose: true });
        if (moves.length > 0) move = moves[Math.floor(Math.random() * moves.length)];
      } else {
        const result = minimax(game, depth, -Infinity, Infinity, true);
        move = result.move;
      }

      if (move) {
        const destPiece = game.get(move.to);
        const isCapture = destPiece && destPiece.color !== turn;
        const newGame = new Chess(game.fen());
        newGame.move(move);

        // Delay to allow piece exit animation
        animationTimer.current = setTimeout(() => {
          commitMove(newGame.fen(), move, isCapture);
        }, 250);
      } else {
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
      }
    }, 800);
  }, [game, gameOver, aiColor, turn, difficulty]);

  useEffect(() => {
    if (phase === 'playing' && aiColor && turn === aiColor && !gameOver) makeAIMove();
  }, [turn, phase, aiColor, gameOver, makeAIMove]);

  // ─── Human move ──────────────────────────────────────────
  const handleSquareClick = (row, col) => {
    if (phase !== 'playing' || gameOver) return;
    if (aiColor && turn === aiColor) return;
    if (isAiThinking) return;

    const flipped = playerColor === 'b';
    const boardRow = flipped ? 7 - row : row;
    const boardCol = flipped ? 7 - col : col;
    const square = String.fromCharCode(97 + boardCol) + (8 - boardRow);
    const piece = game.get(square);

    if (selected) {
      if (legalMoves.some(m => m.to === square)) {
        try {
          const targetPiece = game.get(square);
          const isCapture = targetPiece && targetPiece.color !== turn;
          const move = game.move({ from: selected, to: square, promotion: 'q' });
          if (move) {
            const newFen = new Chess(game.fen()).fen(); // fen after move
            setSelected(null);
            // Clear legal moves immediately to hide dots
            setLegalMoves([]);
            // Delay board update for smooth exit animation
            animationTimer.current = setTimeout(() => {
              commitMove(newFen, move, isCapture);
            }, 250);
            return;
          }
        } catch (e) {}
      }

      if (piece && piece.color === turn) {
        setSelected(square);
        setLegalMoves(game.moves({ square, verbose: true }));
        return;
      }

      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === turn) {
      setSelected(square);
      setLegalMoves(game.moves({ square, verbose: true }));
    }
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
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const lightSquareBg = "var(--lightgray, #f0d9b5)";
  const darkSquareBg = "var(--darkgray, #b58863)";

  // ─── Setup Screen ──────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4"
           style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-md p-6 rounded-2xl shadow-2xl"
                    style={{ backgroundColor: "var(--white)", border: "1px solid var(--darkgray, #333)" }}>
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: "var(--black)" }}>⚔️ New Game</h2>

          <div className="mb-5">
            <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>Game Mode</p>
            <div className="flex gap-2">
              {['friend', 'ai'].map(m => (
                <motion.button key={m} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                               onClick={() => setMode(m)}
                               className="flex-1 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                               style={{
                                 backgroundColor: mode === m ? "var(--blue, #3b82f6)" : "var(--white)",
                                 color: "var(--black)",
                                 border: mode === m ? "2px solid var(--blue, #3b82f6)" : "2px solid transparent",
                               }}>
                  {m === 'friend' ? <FaUserFriends /> : <FaRobot />}
                  {m === 'friend' ? 'Friend' : 'Computer'}
                </motion.button>
              ))}
            </div>
          </div>

          {mode === 'ai' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5">
              <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>Difficulty</p>
              <div className="grid grid-cols-2 gap-2">
                {['easy', 'normal', 'hard', 'pro'].map(d => (
                  <motion.button key={d} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                 onClick={() => setDifficulty(d)}
                                 className="py-2 rounded-xl text-sm font-medium"
                                 style={{
                                   backgroundColor: difficulty === d ? "var(--blue, #3b82f6)" : "var(--white)",
                                   color: "var(--black)",
                                   border: difficulty === d ? "2px solid var(--blue, #3b82f6)" : "2px solid transparent",
                                 }}>
                    {d === 'easy' ? '🟢 Easy' : d === 'normal' ? '🟡 Normal' : d === 'hard' ? '🟠 Hard' : '🔴 Pro'}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mb-6">
            <p className="text-sm mb-2 font-medium" style={{ color: "var(--black)" }}>Your Color</p>
            <div className="flex gap-2">
              {[
                { value: 'w', label: 'White', icon: <FaChessPawn style={{ color: PIECE_COLOR_MAP.w }} /> },
                { value: 'b', label: 'Black', icon: <FaChessPawn style={{ color: PIECE_COLOR_MAP.b }} /> },
                { value: 'random', label: 'Random', icon: '🎲' },
              ].map(c => (
                <motion.button key={c.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                               onClick={() => setPlayerColor(c.value)}
                               className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                               style={{
                                 backgroundColor: playerColor === c.value ? "var(--blue, #3b82f6)" : "var(--white)",
                                 color: "var(--black)",
                                 border: playerColor === c.value ? "2px solid var(--blue, #3b82f6)" : "2px solid transparent",
                               }}>
                  {c.icon} {c.label}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                         onClick={() => {
                           let finalColor = playerColor;
                           if (finalColor === 'random') finalColor = Math.random() < 0.5 ? 'w' : 'b';
                           startGame(finalColor);
                         }}
                         disabled={!playerColor}
                         className="w-full py-3 rounded-xl font-bold text-lg shadow-lg"
                         style={{
                           backgroundColor: playerColor ? "var(--green, #22c55e)" : "var(--white)",
                           color: "var(--black)",
                           opacity: playerColor ? 1 : 0.5,
                         }}>
            Start Game
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Playing view ──────────────────────────────────────
  const flipped = playerColor === 'b';
  const board = game.board();
  const displayBoard = flipped
    ? board.map(row => [...row].reverse()).reverse()
    : board;

  return (
    <div className="flex flex-col items-center h-screen p-4 overflow-hidden relative"
         style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
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
                {status.includes('Checkmate') ? '🏆' : status.includes('Stalemate') ? '🤝' : '🎉'}
              </motion.div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--black)" }}>
                Game Over
              </h2>
              <p className="text-lg mb-6" style={{ color: "var(--gray, #ccc)" }}>
                {status}
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToSetup}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg"
                  style={{ backgroundColor: "var(--blue, #3b82f6)", color: "var(--black)" }}
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/games")}
                  className="px-6 py-3 rounded-xl font-bold shadow-lg"
                  style={{ backgroundColor: "var(--gray, #777)", color: "var(--black)" }}
                >
                  Back to Games
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mb-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold" style={{ color: "var(--black)" }}>
          <FaChessPawn style={{
            color: mode === 'ai' ? PIECE_COLOR_MAP[playerColor] : (turn === 'w' ? PIECE_COLOR_MAP.w : PIECE_COLOR_MAP.b),
            filter: mode === 'ai' ? PIECE_SHADOW_MAP[playerColor] : (turn === 'w' ? PIECE_SHADOW_MAP.w : PIECE_SHADOW_MAP.b),
            fontSize: '1.4rem',
          }} />
          <span>{friendlyStatus()}</span>
        </div>

        {/* Menu */}
        <motion.div className="relative">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowMenu(!showMenu)}
                         className="p-2 rounded-full"
                         style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
            <FaBars size={20} />
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-50 overflow-hidden"
                          style={{ backgroundColor: "var(--white)", border: "1px solid var(--darkgray, #333)" }}>
                <button onClick={() => handleModeSwitch('friend')} className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3"
                        style={{ color: "var(--black)", backgroundColor: mode === 'friend' ? "var(--blue, #3b82f6)" : "transparent" }}>
                  <FaUserFriends /> Friend
                </button>
                <button onClick={() => handleModeSwitch('ai')} className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3"
                        style={{ color: "var(--black)", backgroundColor: mode === 'ai' ? "var(--blue, #3b82f6)" : "transparent" }}>
                  <FaRobot /> Computer
                </button>
                {mode === 'ai' && (
                  <div className="border-t" style={{ borderColor: "var(--darkgray, #333)" }}>
                    <p className="px-4 pt-3 pb-1 text-xs font-medium" style={{ color: "var(--black)" }}>Difficulty</p>
                    <div className="px-2 pb-2 grid grid-cols-2 gap-1">
                      {['easy', 'normal', 'hard', 'pro'].map(d => (
                        <button key={d} onClick={() => { setDifficulty(d); setShowMenu(false); }}
                                className="py-1.5 rounded-lg text-xs font-medium"
                                style={{ backgroundColor: difficulty === d ? "var(--blue, #3b82f6)" : "var(--white)", color: "var(--black)" }}>
                          {d === 'easy' ? '🟢' : d === 'normal' ? '🟡' : d === 'hard' ? '🟠' : '🔴'} {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t" style={{ borderColor: "var(--darkgray, #333)" }}>
                  <button onClick={handleResetClick} className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3" style={{ color: "var(--black)" }}>
                    <FaRedo /> New Game
                  </button>
                  <button onClick={() => { toggleFullscreen(); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3" style={{ color: "var(--black)" }}>
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                  <button onClick={() => router.push("/games")} className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3" style={{ color: "var(--black)" }}>
                    <FaArrowLeft /> Back to Games
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Board */}
      <div className="flex-1 w-full flex flex-row items-stretch justify-center gap-4 min-h-0">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="relative w-full max-w-2xl aspect-square shadow-2xl rounded-lg overflow-hidden border"
               style={{ borderColor: "var(--darkgray, #333)" }}>
            {/* Labels */}
            <div className="absolute inset-0 pointer-events-none text-xs font-bold opacity-70"
                 style={{ color: "var(--gray, #777)" }}>
              <div className="absolute bottom-0 left-0 w-full flex justify-around pb-1">
                {[...Array(8)].map((_, i) => {
                  const fileIndex = flipped ? 7 - i : i;
                  return <span key={`file-${i}`}>{String.fromCharCode(97 + fileIndex)}</span>;
                })}
              </div>
              <div className="absolute top-0 right-0 h-full flex flex-col justify-around pr-1">
                {[...Array(8)].map((_, i) => {
                  const rankIndex = flipped ? 1 + i : 8 - i;
                  return <span key={`rank-${i}`}>{rankIndex}</span>;
                })}
              </div>
            </div>

            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {displayBoard.map((row, i) =>
                row.map((piece, j) => {
                  const origRow = flipped ? 7 - i : i;
                  const origCol = flipped ? 7 - j : j;
                  const isLight = (origRow + origCol) % 2 === 0;
                  const square = String.fromCharCode(97 + origCol) + (8 - origRow);
                  const isSelected = selected === square;
                  const isLastMoveFrom = lastMove && lastMove.from === square;
                  const isLastMoveTo = lastMove && lastMove.to === square;
                  const isKingInCheck = game.inCheck() && piece && piece.type === 'k' && piece.color === turn;
                  const isLegalMove = legalMoves.some(m => m.to === square);
                  const PieceIcon = piece ? PIECE_ICONS[piece.color]?.[piece.type] : null;

                  // Is this square receiving a capture move?
                  const isCaptureSquare = lastMove?.capture && lastMove?.to === square;

                  return (
                    <motion.div
                      key={`${i}-${j}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center cursor-pointer transition-all relative"
                      style={{
                        backgroundColor: isSelected ? "var(--yellow, #ffeb3b)" : isLight ? lightSquareBg : darkSquareBg,
                        boxShadow: isKingInCheck ? 'inset 0 0 30px var(--red, #f00)' : 'none',
                      }}
                      onClick={() => handleSquareClick(i, j)}
                    >
                      {/* Capture shockwave */}
                      <AnimatePresence>
                        {captureFlash === square && (
                          <motion.div
                            initial={{ opacity: 0.9, scale: 0.3 }}
                            animate={{ opacity: 0, scale: 2.8 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 pointer-events-none rounded-full z-10"
                            style={{ backgroundColor: "var(--red, #ff0000)" }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Piece */}
                      <AnimatePresence mode="wait">
                        {piece && PieceIcon && (
                          <motion.div
                            key={square + piece.color + piece.type}
                            initial={isCaptureSquare
                              ? { scale: 0.2, opacity: 0, y: -20 }
                              : { scale: 0.3, opacity: 0 }
                            }
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }}
                            transition={
                              isCaptureSquare
                                ? { type: "spring", stiffness: 200, damping: 15, mass: 1 }
                                : { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }
                            }
                            className="flex items-center justify-center"
                          >
                            <PieceIcon
                              style={{
                                width: 'clamp(2rem, 6.5vw, 3.8rem)',
                                height: 'clamp(2rem, 6.5vw, 3.8rem)',
                                color: PIECE_COLOR_MAP[piece.color],
                                filter: PIECE_SHADOW_MAP[piece.color],
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Legal move dot */}
                      {isLegalMove && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 pointer-events-none flex items-center justify-center"
                        >
                          <div className="w-1/4 h-1/4 rounded-full"
                               style={{ backgroundColor: 'var(--gray, #777)', opacity: 0.3, boxShadow: '0 0 10px var(--gray, #777)' }} />
                        </motion.div>
                      )}

                      {/* Last move highlight */}
                      {(isLastMoveFrom || isLastMoveTo) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 pointer-events-none"
                          style={{ backgroundColor: 'rgba(255, 235, 59, 0.25)', border: '2px solid rgba(255, 235, 59, 0.4)', borderRadius: 'inherit' }}
                        />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Move History */}
        <div className="w-48 flex-shrink-0 rounded-lg border p-3 overflow-y-auto hidden lg:block"
             style={{ backgroundColor: "var(--white)", borderColor: "var(--darkgray, #333)", color: "var(--black)" }}>
          <h3 className="text-sm font-semibold mb-2 text-center" style={{ color: "var(--black)" }}>Move History</h3>
          <div className="space-y-1 text-xs font-mono">
            {moveHistory.length === 0 && <div style={{ color: "var(--gray, #777)" }} className="text-center">No moves yet</div>}
            {moveHistory.map((move, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span style={{ color: "var(--gray, #777)" }}>{idx + 1}.</span>
                <span style={{ color: "var(--black)" }}>{move}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}