// pages/games/index.js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaGamepad, FaChess, FaCircle, FaDice, FaDiceD6, FaPlaystation, FaGolfBall } from "react-icons/fa";

const games = [
  {
    slug: "snake",
    title: "Snake",
    icon: <FaGamepad size={36} />,
    desc: "Classic snake game with glowing effects and smooth controls.",
    color: "var(--green)",
    bg: "var(--green)",
    players: "1 Player",
    difficulty: "Easy",
  },
  {
    slug: "chess",
    title: "Chess",
    icon: <FaChess size={36} />,
    desc: "Play chess with friends or against our smart AI opponent.",
    color: "var(--blue)",
    bg: "var(--blue)",
    players: "1-2 Players",
    difficulty: "Hard",
  },
  {
    slug: "tic-tac-toe",
    title: "Tic Tac Toe",
    icon: <FaCircle size={36} />,
    desc: "Classic tic-tac-toe with an unbeatable AI challenge.",
    color: "var(--orange)",
    bg: "var(--orange)",
    players: "1-2 Players",
    difficulty: "Easy",
  },
  {
    slug: "ludo",
    title: "Ludo",
    icon: <FaDice size={36} />,
    desc: "Play Ludo with AI or friends in this classic board game.",
    color: "var(--red)",
    bg: "var(--red)",
    players: "2-4 Players",
    difficulty: "Medium",
  },
  {
    slug: "12-taani",
    title: "12 Taani",
    icon: <FaDiceD6 size={36} />,
    desc: "Traditional Pakistani board game with strategic gameplay.",
    color: "var(--purple)",
    bg: "var(--purple)",
    players: "2 Players",
    difficulty: "Medium",
  },
  {
    slug: "tennis",
    title: "Tennis",
    icon: <FaPlaystation size={36} />,
    desc: "Hit the ball and score points in this exciting tennis game.",
    color: "var(--pink)",
    bg: "var(--pink)",
    players: "1-2 Players",
    difficulty: "Medium",
  },
  {
    slug: "golf",
    title: "Mini Golf",
    icon: <FaGolfBall size={36} />,
    desc: "Putt your way through challenging mini golf courses.",
    color: "var(--cyan)",
    bg: "var(--cyan)",
    players: "1 Player",
    difficulty: "Easy",
  },
];

export default function Games() {
  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />

      {/* ─── Hero Header ──────────────────────────────────── */}
      <section className="pt-28 pb-12 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-4"
            >
              <FaGamepad size={48} style={{ color: "var(--blue)" }} />
            </motion.div>
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--blue)" }}
            >
              Take a Break
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--black)" }}>
              Games Arcade
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--gray)" }}>
              Relax and enjoy our collection of free browser games. No downloads needed — just pick and play!
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Games Grid ────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-1 t:grid-cols-2 l:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game, idx) => (
              <Link key={game.slug} href={`/games/${game.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl p-6 cursor-pointer shadow-sm border transition-all duration-300 group relative overflow-hidden h-full flex flex-col"
                  style={{
                    backgroundColor: "var(--white)",
                    borderColor: "var(--border)",
                  }}
                >
                  {/* Glowing background on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundColor: game.bg }}
                  />

                  {/* Top section */}
                  <div className="relative z-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${game.color} 15%, transparent)`,
                        color: game.color,
                      }}
                    >
                      {game.icon}
                    </div>

                    <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>
                      {game.title}
                    </h3>
                    <p className="text-sm mb-5 line-clamp-2" style={{ color: "var(--gray)" }}>
                      {game.desc}
                    </p>
                  </div>

                  {/* Bottom section – stats */}
                  <div className="mt-auto relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${game.color} 12%, transparent)`,
                          color: game.color,
                        }}
                      >
                        {game.players}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "var(--lightgray)",
                          color: "var(--gray)",
                        }}
                      >
                        {game.difficulty}
                      </span>
                    </div>

                    {/* Play button */}
                    <div
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all duration-300 group-hover:shadow-md flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: game.color,
                        color: "var(--white)",
                      }}
                    >
                      <FaGamepad size={14} /> Play Now
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FaGamepad size={36} className="mx-auto mb-4" style={{ color: "var(--blue)" }} />
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--black)" }}>
              More Coming Soon!
            </h2>
            <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--gray)" }}>
              We're constantly adding new games to the arcade. Check back often for new additions!
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 mx-auto"
              style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
            >
              <FaGamepad size={16} /> Browse Games
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}