// pages/games/12-taani.js
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";

export default function TaaniGame() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4"
      style={{ backgroundColor: "var(--white)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl text-center"
        style={{
          backgroundColor: "var(--white)",
          border: "1px solid var(--darkgray, #333)",
          color: "var(--black)",
        }}
      >
        <h1 className="text-4xl font-bold mb-4">🎲 12 Taani</h1>
        <p className="text-lg mb-6" style={{ color: "var(--gray, #aaa)" }}>
          Coming Soon
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--gray, #aaa)" }}>
          This game is under development. Please check back later!
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/games")}
          className="px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
          style={{
            backgroundColor: "var(--red, #3b82f6)",
            color: "var(--black)",
          }}
        >
          <FaArrowLeft /> Back to Games
        </motion.button>
      </motion.div>
    </div>
  );
}