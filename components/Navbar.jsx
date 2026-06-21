// components/Navbar.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaHome, FaThLarge, FaGamepad, FaBlog, FaInfoCircle, FaEnvelope, FaArrowRight } from "react-icons/fa";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [router.pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Home", path: "/", icon: <FaHome size={14} /> },
    { name: "Features", path: "/features", icon: <FaThLarge size={14} /> },
    { name: "Games", path: "/games", icon: <FaGamepad size={14} /> },
    { name: "Blog", path: "/blog", icon: <FaBlog size={14} /> },
    { name: "About", path: "/about", icon: <FaInfoCircle size={14} /> },
    { name: "Contact", path: "/contact", icon: <FaEnvelope size={14} /> },
  ];

  const isActive = (path) => {
    if (path === "/") return router.pathname === "/";
    return router.pathname.startsWith(path);
  };

  return (
    <>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
        style={{
          width: scrolled ? "95%" : "95%",
          maxWidth: scrolled ? "1200px" : "1200px",
        }}
      >
        <div
          className="rounded-full border backdrop-blur-md transition-all duration-500"
          style={{
            backgroundColor: scrolled ? "var(--white)" : "var(--white)",
            borderColor: scrolled ? "var(--border)" : "var(--border)",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0, 0, 0, 0.08)"
              : "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex justify-between items-center h-14 px-4 md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: -5, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--blue)" }}
              >
                <span className="text-sm font-bold" style={{ color: "var(--white)" }}>AR</span>
              </motion.div>
              <span
                className="text-lg font-bold tracking-tight hidden sm:block"
                style={{ color: "var(--black)" }}
              >
                AR Studio
              </span>
            </Link>

            {/* Desktop links */}
            <div className="sm:hidden t:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="relative px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    color: isActive(link.path) ? "var(--white)" : "var(--black)",
                    backgroundColor: isActive(link.path) ? "var(--blue)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(link.path)) {
                      e.currentTarget.style.backgroundColor = "var(--lightgray)";
                      e.currentTarget.style.color = "var(--black)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(link.path)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--black)";
                    }
                  }}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>

           

            {/* Mobile hamburger */}
            <motion.button
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-lg focus:outline-none"
              style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <FaTimes />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <FaBars />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 z-40 w-72 h-full md:hidden shadow-2xl"
            style={{ backgroundColor: "var(--white)" }}
          >
            <div className="flex flex-col h-full pt-20 px-6">
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
              >
                <FaTimes />
              </button>

              {/* Links */}
              <nav className="flex flex-col gap-2 mb-8 space-y-5">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
                      style={{
                        color: isActive(link.path) ? "var(--white)" : "var(--black)",
                        backgroundColor: isActive(link.path) ? "var(--blue)" : "var(--lightgray)",
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: isActive(link.path) ? "var(--white)" : "var(--white)",
                          color: isActive(link.path) ? "var(--blue)" : "var(--blue)",
                          opacity: isActive(link.path) ? 1 : 0.8,
                        }}
                      >
                        {link.icon}
                      </span>
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              

            
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}