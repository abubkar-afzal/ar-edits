// pages/games/index.js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaGamepad, FaChess } from "react-icons/fa";

const games = [
  {
    slug: "snake",
    title: "Snake",
    icon: <FaGamepad />,
    desc: "Classic snake game in with glowing effects.",
    color: "#22c55e",
  },
  {
    slug: "chess",
    title: "Chess",
    icon: <FaChess />,
    desc: "Play chess in with friends or against AI.",
    color: "#3b82f6",
  },
  {
    slug: "tic-tac-toe",
    title: "Tic Tac Toe",
    icon: <FaGamepad />,
    desc: "Classic tic-tac-toe in with AI.",
    color: "#f59e0b",
  },
  {
    slug: "ludo",
    title: "Ludo",
    icon: <FaGamepad />,
    desc: "Play Ludo with AI or friends.",
    color: "#ef4444",
  },
  {
    slug: "12-taani",
    title: "12 Taani",
    icon: <FaGamepad />,
    desc: "Traditional Pakistani board game.",
    color: "#8b5cf6",
  },
  {
    slug: "tennis",
    title: "Tennis",
    icon: <FaGamepad />,
    desc: "Hit the ball in tennis.",
    color: "#ec4899",
  },
  {
    slug: "golf",
    title: "Golf",
    icon: <FaGamepad />,
    desc: "Mini golf in with putter.",
    color: "#06b6d4",
  },
];

export default function Games() {
  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--black)" }}> Games</h1>
        <p className="text-lg mb-10" style={{ color: "var(--gray)" }}>
          Take a break and play games.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link key={game.slug} href={`/games/${game.slug}`}>
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-6 cursor-pointer shadow-lg transition-all duration-300 border hover:shadow-xl"
                style={{
                  backgroundColor: "var(--white)",
                  borderColor: "var(--border)",
                  color: "var(--black)",
                }}
              >
                <div className="text-5xl mb-3" style={{ color: game.color }}>
                  {game.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-2">{game.title}</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>{game.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}