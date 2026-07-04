// pages/games/ludo.js
import { useState, useEffect, useCallback } from "react";
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
} from "react-icons/fa";

// ─── Default colours (plain hex) ──────────────────────────
const DEFAULT_COLORS = {
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
};

const COLOR_OPTIONS = [
  "#22c55e", "#ef4444", "#3b82f6", "#eab308",
  "#a855f7", "#f97316", "#06b6d4", "#ec4899",
  "#f8fafc", "#84cc16", "#14b8a6", "#8b5cf6",
];

// ─── Board grid (15×15) ──────────────────────────────────
const ludoBoard = [
  [20,20,20,20,20,20,23,23,23,20,20,20,20,20,20],
  [20,21,21,21,21,20,23,38,38,20,21,21,21,21,20],
  [20,21,22,22,21,20,25,38,23,20,21,28,28,21,20],
  [20,21,22,22,21,20,23,38,23,20,21,28,28,21,20],
  [20,21,21,21,21,20,23,38,23,20,21,21,21,21,20],
  [20,20,20,20,20,20,23,38,23,20,20,20,20,20,20],
  [23,32,23,23,23,23,40,40,40,23,23,23,25,23,23],
  [23,32,32,32,32,32,40,40,40,36,36,36,36,36,23],
  [23,23,25,23,23,23,40,40,40,23,23,23,23,36,23],
  [20,20,20,20,20,20,23,34,23,20,20,20,20,20,20],
  [20,21,21,21,21,20,23,34,23,20,21,21,21,21,20],
  [20,21,24,24,21,20,23,34,23,20,21,26,26,21,20],
  [20,21,24,24,21,20,23,34,25,20,21,26,26,21,20],
  [20,21,21,21,21,20,34,34,23,20,21,21,21,21,20],
  [20,20,20,20,20,20,23,23,23,20,20,20,20,20,20],
];

// ─── Movement paths (58 steps) ──────────────────────────────
const GreenMoves = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
  [6,1],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]
];
const RedMoves = [
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]
];
const BlueMoves = [
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]
];
const YellowMoves = [
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]
];

const MAX_DISTANCE = 58;
const SAFE_ZONES = new Set(["6,1","2,6","1,8","6,12","8,13","12,8","13,6","8,2"]);

function getMoves(color) {
  switch (color) {
    case "green": return GreenMoves;
    case "red": return RedMoves;
    case "blue": return BlueMoves;
    case "yellow": return YellowMoves;
    default: return [];
  }
}

export default function LudoGame() {
  const router = useRouter();

  // UI state
  const [phase, setPhase] = useState("setup");
  const [playerCount, setPlayerCount] = useState(4);
  const [mode, setMode] = useState("friend");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Game state
  const [pieces, setPieces] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("green");
  const [diceValue, setDiceValue] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const [playerColors, setPlayerColors] = useState({ ...DEFAULT_COLORS });

  const [spinning, setSpinning] = useState(false);
  const [diceFaces, setDiceFaces] = useState([1,2,3,4,5,6]);

  // Initialize game
  const initGame = useCallback(() => {
    const colors = ["green", "red", "blue", "yellow"].slice(0, playerCount);
    const baseCoords = {
      green: [[2,2],[2,3],[3,2],[3,3]],
      red: [[2,11],[2,12],[3,11],[3,12]],
      yellow: [[11,2],[11,3],[12,2],[12,3]],
      blue: [[11,11],[11,12],[12,11],[12,12]],
    };
    const newPieces = [];
    colors.forEach((color) => {
      baseCoords[color].forEach((pos, idx) => {
        newPieces.push({
          id: `${color}-${idx}`,
          position: pos,
          player: color,
          distance: -1,
        });
      });
    });
    setPieces(newPieces);
    setPlayers(colors);
    setCurrentPlayer(colors[0]);
    setDiceValue(null);
    setHighlight(false);
    setGameOver(false);
    setWinner(null);
    setLastMove(null);
    setSpinning(false);
    setDiceFaces([1,2,3,4,5,6]);
  }, [playerCount]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getYardSpaces = (color) => ({
    green: [[2,2],[2,3],[3,2],[3,3]],
    red: [[2,11],[2,12],[3,11],[3,12]],
    yellow: [[11,2],[11,3],[12,2],[12,3]],
    blue: [[11,11],[11,12],[12,11],[12,12]],
  }[color]);

  const switchTurn = useCallback(() => {
    setPieces(prev => {
      const idx = players.indexOf(currentPlayer);
      const nextIdx = (idx + 1) % players.length;
      const stillRacing = prev.some(p => p.player === currentPlayer && p.distance !== MAX_DISTANCE);
      if (!stillRacing) {
        const newPlayers = players.filter(p => p !== currentPlayer);
        setPlayers(newPlayers);
        if (newPlayers.length === 1) {
          setGameOver(true);
          setWinner(newPlayers[0]);
          return prev;
        }
        setCurrentPlayer(newPlayers[nextIdx % newPlayers.length]);
      } else {
        setCurrentPlayer(players[nextIdx]);
      }
      setDiceValue(null);
      setHighlight(false);
      return prev;
    });
  }, [players, currentPlayer]);

  const movePiece = useCallback((piece, dice) => {
    if (dice === null) return;
    const moves = getMoves(piece.player);
    let newDist = piece.distance === -1 ? 0 : piece.distance + dice;
    if (newDist > MAX_DISTANCE) return;

    setPieces(prev => {
      const newPieces = prev.map(p => ({...p}));
      const idx = newPieces.findIndex(p => p.id === piece.id);
      if (idx === -1) return prev;
      const moving = newPieces[idx];

      if (piece.distance === -1) {
        const startPos = { green: [6,1], red: [1,8], blue: [8,13], yellow: [13,6] };
        moving.position = startPos[moving.player];
        moving.distance = 0;
      } else {
        moving.position = moves[newDist];
        moving.distance = newDist;
      }

      // Capture
      if (moving.distance > 0 && moving.distance <= 51) {
        const posKey = moving.position.join(",");
        if (!SAFE_ZONES.has(posKey)) {
          newPieces.forEach((p, i) => {
            if (p.player !== moving.player && p.distance > 0 && p.distance <= 51) {
              const pKey = p.position.join(",");
              if (pKey === posKey) {
                const yardSpaces = getYardSpaces(p.player);
                const emptyYard = yardSpaces.find(yard =>
                  !newPieces.some(op => op.player === p.player && op.distance === -1 && op.position[0] === yard[0] && op.position[1] === yard[1])
                );
                if (emptyYard) {
                  newPieces[i].position = emptyYard;
                  newPieces[i].distance = -1;
                }
              }
            }
          });
        }
      }

      setLastMove({ player: moving.player, dice });
      setDiceValue(null);
      setHighlight(false);

      if (moving.distance === MAX_DISTANCE) {
        const allHome = newPieces.filter(p => p.player === moving.player).every(p => p.distance === MAX_DISTANCE);
        if (allHome) {
          setGameOver(true);
          setWinner(moving.player);
        }
      }

      if (dice !== 6) switchTurn();
      return newPieces;
    });
  }, [switchTurn]);

  const rollDice = useCallback(() => {
    if (gameOver || spinning || diceValue !== null) return;
    setSpinning(true);
    const spinInterval = setInterval(() => {
      setDiceFaces(Array.from({length:6}, () => Math.floor(Math.random()*6)+1));
    }, 80);
    setTimeout(() => {
      clearInterval(spinInterval);
      const dice = Math.floor(Math.random() * 6) + 1;
      const faces = [dice, ...Array.from({length:5}, () => Math.floor(Math.random()*6)+1)];
      setDiceFaces(faces);
      setDiceValue(dice);
      setSpinning(false);

      const currentPieces = pieces.filter(p => p.player === currentPlayer);
      const valid = currentPieces.filter(p => {
        if (p.distance === -1) return dice === 6;
        return p.distance + dice <= MAX_DISTANCE;
      });
      if (valid.length === 0) {
        setTimeout(() => switchTurn(), 1000);
        return;
      }
      setHighlight(true);
      if (valid.length === 1 && !(valid[0].distance === -1 && currentPieces.some(p => p.distance === 0 && p.player === currentPlayer))) {
        setTimeout(() => movePiece(valid[0], dice), 500);
      }
    }, 1600);
  }, [gameOver, spinning, diceValue, pieces, currentPlayer, switchTurn, movePiece]);

  const handlePieceClick = useCallback((piece) => {
    if (!highlight || piece.player !== currentPlayer || diceValue === null || gameOver) return;
    const canMove = (piece.distance === -1 && diceValue === 6) || (piece.distance !== -1 && piece.distance + diceValue <= MAX_DISTANCE);
    if (canMove) movePiece(piece, diceValue);
  }, [highlight, currentPlayer, diceValue, gameOver, movePiece]);

  useEffect(() => {
    if (phase !== "playing" || mode !== "ai" || gameOver) return;
    if (currentPlayer === "green") return;
    if (diceValue === null && !spinning) {
      const timer = setTimeout(() => rollDice(), 1000);
      return () => clearTimeout(timer);
    }
    if (highlight && currentPlayer !== "green" && diceValue !== null) {
      const currentPieces = pieces.filter(p => p.player === currentPlayer);
      const valid = currentPieces.filter(p => {
        if (p.distance === -1) return diceValue === 6;
        return p.distance + diceValue <= MAX_DISTANCE;
      });
      if (valid.length > 0) {
        const chosen = valid[Math.floor(Math.random() * valid.length)];
        const timer = setTimeout(() => movePiece(chosen, diceValue), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, mode, currentPlayer, diceValue, spinning, highlight, gameOver, pieces, rollDice, movePiece]);

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

  // ─── Dice 3D Component ─────────────────────────────────
  const Dice3D = ({ color, active }) => {
    const dotStyle = {
      width: '0.4rem',
      height: '0.4rem',
      borderRadius: '9999px',
      backgroundColor: 'var(--dot, #1f2937)',
    };
    const facesElements = [
      <div key="1" className="flex items-center justify-center"><div style={dotStyle} /></div>,
      <div key="2" className="flex items-center justify-center gap-1"><div style={dotStyle} /><div style={dotStyle} /></div>,
      <div key="3" className="flex items-center justify-center gap-1 -rotate-45"><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /></div>,
      <div key="4" className="grid grid-cols-2 gap-1"><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /></div>,
      <div key="5" className="relative flex items-center justify-center">
        <div className="absolute flex items-center justify-center gap-1 -rotate-45"><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /></div>
        <div className="absolute flex gap-1 items-center justify-between rotate-45"><div style={dotStyle} /><div style={{...dotStyle, backgroundColor: 'transparent'}} /><div style={dotStyle} /></div>
      </div>,
      <div key="6" className="grid grid-cols-3 gap-y-1 gap-x-0.5"><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /><div style={dotStyle} /></div>,
    ];

    return (
      <div className="flex flex-col items-center gap-0.5">
        {active ? (
          <button
            onClick={rollDice}
            disabled={spinning}
            className="relative w-12 h-12 md:w-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: `${color}44`,
              boxShadow: `0 3px 10px rgba(0,0,0,0.6), inset 0 0 12px ${color}77`,
              border: `2px solid ${color}88`,
            }}
          >
            <div className={`cube ${spinning ? "is-spinning" : ""}`}>
              {["front","back","right","left","up","down"].map((face, i) => (
                <div
                  key={face}
                  className={`cube__face cube__face--${face}`}
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    boxShadow: "inset 0 0 4px rgba(0,0,0,0.15)",
                  }}
                >
                  {facesElements[diceFaces[i]-1]}
                </div>
              ))}
            </div>
          </button>
        ) : (
          <div className="w-12 h-12 md:w-16 lg:w-20 lg:h-20 rounded-full opacity-30" style={{ backgroundColor: color }} />
        )}
        {active && diceValue !== null && (
          <span className="text-[10px] md:text-xs font-bold" style={{ color }}>{diceValue}</span>
        )}
      </div>
    );
  };

  // ─── Setup screen ───────────────────────────────────────
  if (phase === "setup") {
    const activeColors = ["green", "red", "blue", "yellow"].slice(0, playerCount);
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4" style={{ backgroundColor: "var(--white)" }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md p-4 sm:p-6 rounded-2xl shadow-2xl h-[90vh] overflow-y-scroll" style={{ backgroundColor:"var(--white)", border:"1px solid var(--darkgray, #333)", color:"var(--black)" }}>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">🎲 Ludo</h2>
          <div className="mb-4 sm:mb-5">
            <p className="text-xs sm:text-sm mb-2 font-medium" style={{ color:"var(--black)" }}>Players</p>
            <div className="flex gap-2">
              {[2,3,4].map(n => (
                <motion.button key={n} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={()=>setPlayerCount(n)} className="flex-1 py-2 sm:py-2.5 rounded-xl font-medium text-sm cursor-pointer" style={{ backgroundColor: playerCount===n ? "var(--red, #3b82f6)" : "var(--white)", color:playerCount===n ? "var(--black)" : "var(--black)" }}>
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="mb-4 sm:mb-5">
            <p className="text-xs sm:text-sm mb-2 font-medium" style={{ color:"var(--black)" }}>Mode</p>
            <div className="flex gap-2">
              {["friend","ai"].map(m => (
                <motion.button key={m} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={()=>setMode(m)} className="flex-1 py-2 sm:py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer" style={{ backgroundColor: mode===m ? "var(--red, #3b82f6)" : "var(--white)", color:"var(--black, #fff)" }}>
                  {m==="friend" ? <FaUserFriends/> : <FaRobot/>}
                  {m==="friend" ? "Friend" : "Computer"}
                </motion.button>
              ))}
            </div>
          </div>
          {activeColors.map(color => (
            <div key={color} className="mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm mb-1 font-medium" style={{ color:"var(--black)" }}>{color.charAt(0).toUpperCase()+color.slice(1)} color</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => {
                  const isSelected = playerColors[color] === c;
                  return (
                    <motion.button key={c} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={()=>setPlayerColors(prev=>({...prev,[color]:c}))} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 cursor-pointer" style={{ backgroundColor:c, borderColor: isSelected ? "var(--white, #fff)" : "transparent", boxShadow: isSelected ? `0 0 8px ${c}` : "none" }} />
                  );
                })}
              </div>
            </div>
          ))}
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.95 }} onClick={()=>{ initGame(); setPhase("playing"); }} className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg cursor-pointer" style={{ backgroundColor:"var(--green, #22c55e)", color:"var(--black, #fff)" }}>Start Game</motion.button>
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

  // ─── Board rendering (used in both layouts) ────────────
  const getCellColor = (cell) => {
    switch (cell) {
      case 20: return "var(--gray-900)";
      case 21: return "var(--gray-800)";
      case 22: return playerColors.green;
      case 24: return playerColors.yellow;
      case 26: return playerColors.blue;
      case 28: return playerColors.red;
      case 25: return "var(--safe-star, #f1c40f55)";
      case 32: return playerColors.green + "88";
      case 34: return playerColors.yellow + "88";
      case 36: return playerColors.blue + "88";
      case 38: return playerColors.red + "88";
      case 23: return "var(--track, #2d2d2d)";
      case 40: return "var(--center, #666)";
      default: return "transparent";
    }
  };

  // ─── Playing view ───────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden p-2 md:p-4" style={{ backgroundColor: "var(--white)" }}>
      {/* Top bar */}
      <div className="w-full flex justify-between items-center mb-1 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--black)" }}>
          {gameOver ? `🏆 ${winner} wins!` : (
            <>
              <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-lg" style={{ backgroundColor: playerColors[currentPlayer] }} />
              {diceValue !== null && <span>Dice: {diceValue}</span>}
            </>
          )}
        </div>
        <motion.div className="relative">
          <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={()=>setShowMenu(!showMenu)} className="p-1.5 sm:p-2 rounded-full" style={{ backgroundColor:"var(--gray-800, #2a2a2a)", color:"var(--white, #fff)" }}><FaBars size={16} className="sm:w-5 sm:h-5"/></motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity:0, scale:0.9, y:-10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:-10 }} className="absolute right-0 mt-2 w-40 sm:w-48 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ backgroundColor:"var(--gray-800, #2a2a2a)", border:"1px solid var(--darkgray, #333)" }}>
                <button onClick={()=>{ setShowMenu(false); setPhase("setup"); }} className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3" style={{ color:"var(--white, #fff)" }}><FaRedo size={14} className="sm:w-4 sm:h-4"/> New Game</button>
                <button onClick={()=>{ toggleFullscreen(); setShowMenu(false); }} className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3" style={{ color:"var(--white, #fff)" }}>{isFullscreen?<FaCompress size={14} className="sm:w-4 sm:h-4"/>:<FaExpand size={14} className="sm:w-4 sm:h-4"/>}{isFullscreen?"Exit Fullscreen":"Fullscreen"}</button>
                <button onClick={()=>router.push("/games")} className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3" style={{ color:"var(--white, #fff)" }}><FaArrowLeft size={14} className="sm:w-4 sm:h-4"/> Back to Games</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* MOBILE layout (below md) */}
      <div className="md:hidden flex flex-col items-center justify-center flex-1 w-full overflow-hidden gap-2">
        {/* Top row: green left, red right */}
        <div className="flex flex-row items-center justify-between w-full px-4">
          {players.includes("green") && <Dice3D color={playerColors.green} active={currentPlayer==="green" && !gameOver} />}
          {players.includes("red") && <Dice3D color={playerColors.red} active={currentPlayer==="red" && !gameOver} />}
        </div>

        {/* Board */}
        <div
          className="bg-[var(--board-bg, var(--gray-800))] p-1 rounded-2xl shadow-2xl border-2 border-[var(--darkgray)] flex-shrink-0"
          style={{ width: "min(85vw, 65vh)", height: "min(85vw, 65vh)" }}
        >
          <div className="grid w-full h-full" style={{ gridTemplateColumns:"repeat(15,1fr)", gridTemplateRows:"repeat(15,1fr)", gap:"1px" }}>
            {ludoBoard.map((row, r) =>
              row.map((cell, c) => {
                const pieceHere = pieces.find(p => p.position[0]===r && p.position[1]===c);
                const canMove = highlight && pieceHere && pieceHere.player === currentPlayer && (
                  (pieceHere.distance === -1 && diceValue === 6) ||
                  (pieceHere.distance !== -1 && pieceHere.distance + (diceValue||0) <= MAX_DISTANCE)
                );
                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative flex items-center justify-center cursor-pointer"
                    style={{ aspectRatio:"1/1" }}
                    onClick={() => pieceHere && handlePieceClick(pieceHere)}
                  >
                    <div
                      className="absolute inset-0 rounded-[1px]"
                      style={{
                        backgroundColor: getCellColor(cell),
                        border: cell !== 20 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}
                    >
                      {cell === 25 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[0.4rem]" style={{ color: "var(--safe-star-icon, gold)" }}>
                          ⭐
                        </span>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {pieceHere && (
                        <motion.div
                          key={pieceHere.id + (pieceHere.position.join(','))}
                          initial={{ scale:0, opacity:0 }}
                          animate={{
                            scale: canMove ? 1.15 : 1,
                            opacity: 1,
                            boxShadow: canMove ? `0 0 12px 3px ${playerColors[pieceHere.player]}` : "0 0 3px rgba(0,0,0,0.3)",
                          }}
                          exit={{ scale:0, opacity:0 }}
                          transition={{ type:"spring", stiffness:300, damping:20 }}
                          className="absolute w-[60%] h-[60%] rounded-full border-2 border-white shadow-lg"
                          style={{
                            backgroundColor: playerColors[pieceHere.player],
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), ${playerColors[pieceHere.player]})`,
                            zIndex:2,
                          }}
                        >
                          <div className="absolute top-1 left-1 w-1/3 h-1/3 bg-white rounded-full opacity-40" />
                          {canMove && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-white"
                              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom row: yellow left, blue right */}
        <div className="flex flex-row items-center justify-between w-full px-4">
          {players.includes("yellow") && <Dice3D color={playerColors.yellow} active={currentPlayer==="yellow" && !gameOver} />}
          {players.includes("blue") && <Dice3D color={playerColors.blue} active={currentPlayer==="blue" && !gameOver} />}
        </div>
      </div>

      {/* DESKTOP layout (md and up) */}
      <div className="sm:hidden t:flex flex-row items-center justify-center flex-1 w-full overflow-hidden gap-4">
        {/* Left column: green + yellow */}
        <div className="flex flex-col items-center gap-6">
          {players.includes("green") && <Dice3D color={playerColors.green} active={currentPlayer==="green" && !gameOver} />}
          {players.includes("yellow") && <Dice3D color={playerColors.yellow} active={currentPlayer==="yellow" && !gameOver} />}
        </div>

        {/* Board */}
        <div
          className="bg-[var(--board-bg, var(--gray-800))] p-3 rounded-2xl shadow-2xl border-2 border-[var(--darkgray)] flex-shrink-0"
          style={{ width: "min(80vh, 80vw, 800px)", height: "min(80vh, 80vw, 800px)" }}
        >
          <div className="grid w-full h-full" style={{ gridTemplateColumns:"repeat(15,1fr)", gridTemplateRows:"repeat(15,1fr)", gap:"1px" }}>
            {ludoBoard.map((row, r) =>
              row.map((cell, c) => {
                const pieceHere = pieces.find(p => p.position[0]===r && p.position[1]===c);
                const canMove = highlight && pieceHere && pieceHere.player === currentPlayer && (
                  (pieceHere.distance === -1 && diceValue === 6) ||
                  (pieceHere.distance !== -1 && pieceHere.distance + (diceValue||0) <= MAX_DISTANCE)
                );
                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative flex items-center justify-center cursor-pointer"
                    style={{ aspectRatio:"1/1" }}
                    onClick={() => pieceHere && handlePieceClick(pieceHere)}
                  >
                    <div
                      className="absolute inset-0 rounded-[1px]"
                      style={{
                        backgroundColor: getCellColor(cell),
                        border: cell !== 20 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}
                    >
                      {cell === 25 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[0.5rem] md:text-xs" style={{ color: "var(--safe-star-icon, gold)" }}>
                          ⭐
                        </span>
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {pieceHere && (
                        <motion.div
                          key={pieceHere.id + (pieceHere.position.join(','))}
                          initial={{ scale:0, opacity:0 }}
                          animate={{
                            scale: canMove ? 1.15 : 1,
                            opacity: 1,
                            boxShadow: canMove ? `0 0 12px 3px ${playerColors[pieceHere.player]}` : "0 0 3px rgba(0,0,0,0.3)",
                          }}
                          exit={{ scale:0, opacity:0 }}
                          transition={{ type:"spring", stiffness:300, damping:20 }}
                          className="absolute w-[65%] h-[65%] rounded-full border-2 border-white shadow-lg"
                          style={{
                            backgroundColor: playerColors[pieceHere.player],
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), ${playerColors[pieceHere.player]})`,
                            zIndex:2,
                          }}
                        >
                          <div className="absolute top-1 left-1 w-1/3 h-1/3 bg-white rounded-full opacity-40" />
                          {canMove && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-white"
                              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: red + blue */}
        <div className="flex flex-col items-center gap-6">
          {players.includes("red") && <Dice3D color={playerColors.red} active={currentPlayer==="red" && !gameOver} />}
          {players.includes("blue") && <Dice3D color={playerColors.blue} active={currentPlayer==="blue" && !gameOver} />}
        </div>
      </div>

      {lastMove && (
        <div className="mt-1 text-[10px] sm:text-xs font-medium text-center" style={{ color:"var(--black)" }}>
          Last: {lastMove.player} rolled {lastMove.dice}
        </div>
      )}

      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor:"rgba(0,0,0,0.6)" }}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }} className="bg-[var(--gray-800)] p-6 rounded-2xl shadow-2xl border border-[var(--darkgray)] text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color:"var(--white)" }}>🏆 {winner} Wins!</h2>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.95 }} onClick={()=>{ setPhase("setup"); setGameOver(false); }} className="px-5 py-2 sm:px-6 sm:py-2 rounded-xl bg-[var(--red)] text-white font-bold">Play Again</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Dice CSS */}
      <style jsx global>{`
        .cube { width: 26px; height: 26px; position: relative; transform-style: preserve-3d; transform: translateZ(-13px); }
        .cube__face { position: absolute; width: 26px; height: 26px; background: white; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
        .cube__face--front { transform: rotateY(0deg) translateZ(13px); }
        .cube__face--back { transform: rotateY(180deg) translateZ(13px); }
        .cube__face--right { transform: rotateY(90deg) translateZ(13px); }
        .cube__face--left { transform: rotateY(-90deg) translateZ(13px); }
        .cube__face--up { transform: rotateX(90deg) translateZ(13px); }
        .cube__face--down { transform: rotateX(-90deg) translateZ(13px); }
        .cube.is-spinning { animation: spinCube 1.6s cubic-bezier(0.22, 0.61, 0.36, 1); }
        @keyframes spinCube {
          0% { transform: translateZ(-13px) rotateX(0deg) rotateY(0deg); }
          100% { transform: translateZ(-13px) rotateX(900deg) rotateY(900deg); }
        }
        @media (min-width: 640px) {
          .cube { width: 34px; height: 34px; transform: translateZ(-17px); }
          .cube__face { width: 34px; height: 34px; }
          .cube__face--front { transform: rotateY(0deg) translateZ(17px); }
          .cube__face--back { transform: rotateY(180deg) translateZ(17px); }
          .cube__face--right { transform: rotateY(90deg) translateZ(17px); }
          .cube__face--left { transform: rotateY(-90deg) translateZ(17px); }
          .cube__face--up { transform: rotateX(90deg) translateZ(17px); }
          .cube__face--down { transform: rotateX(-90deg) translateZ(17px); }
          @keyframes spinCube {
            0% { transform: translateZ(-17px) rotateX(0deg) rotateY(0deg); }
            100% { transform: translateZ(-17px) rotateX(900deg) rotateY(900deg); }
          }
        }
        @media (min-width: 768px) {
          .cube { width: 40px; height: 40px; transform: translateZ(-20px); }
          .cube__face { width: 40px; height: 40px; }
          .cube__face--front { transform: rotateY(0deg) translateZ(20px); }
          .cube__face--back { transform: rotateY(180deg) translateZ(20px); }
          .cube__face--right { transform: rotateY(90deg) translateZ(20px); }
          .cube__face--left { transform: rotateY(-90deg) translateZ(20px); }
          .cube__face--up { transform: rotateX(90deg) translateZ(20px); }
          .cube__face--down { transform: rotateX(-90deg) translateZ(20px); }
          @keyframes spinCube {
            0% { transform: translateZ(-20px) rotateX(0deg) rotateY(0deg); }
            100% { transform: translateZ(-20px) rotateX(900deg) rotateY(900deg); }
          }
        }
      `}</style>
    </div>
  );
}