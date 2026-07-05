// pages/blog/index.js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import blogs from "../../data/blogs.json";
import {
  FiArrowRight, FiClock, FiCalendar, FiSearch,
  FiTag, FiSend, FiBookOpen, FiStar,
} from "react-icons/fi";

export default function BlogIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const sortedBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  const featuredPost = sortedBlogs[0];
  const regularPosts = sortedBlogs.slice(1);

  const filteredPosts = searchQuery
    ? sortedBlogs.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : regularPosts;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const estimateReadTime = (text) => {
    const words = text?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200)) + " min read";
  };

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
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--red)" }}
            >
              Learn & Explore
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--black)" }}>
              All Articles
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--gray)" }}>
              Tips, tutorials, and creative inspiration from the AR Edits team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Featured Post ─────────────────────────────────── */}
      {featuredPost && (
        <section className="py-12 px-4" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-6xl mx-auto">
            <Link href={`/blog/${featuredPost.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="rounded-2xl overflow-hidden shadow-sm border cursor-pointer transition-all duration-300 group"
                style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image side */}
                  <div className="md:w-2/5 h-48 md:h-auto overflow-hidden">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Content side */}
                  <div className="md:w-3/5 p-6 md:p-8 flex flex-col justify-center">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold inline-block w-fit mb-3"
                      style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                    >
                      <FiStar size={12} className="inline mr-1" /> Featured
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:opacity-80 transition" style={{ color: "var(--black)" }}>
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--gray)" }}>
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--gray)" }}>
                      <span className="flex items-center gap-1"><FiCalendar size={14} /> {new Date(featuredPost.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><FiClock size={14} /> {estimateReadTime(featuredPost.content)}</span>
                      <span className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--red)" }}>
                        Read more <FiArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* ─── Search Bar ────────────────────────────────────── */}
      <section className="pb-8 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-6xl mx-auto flex sm:flex-col l:flex-row gap-4 justify-between items-start sm:items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--black)" }}>
            <FiBookOpen size={20} style={{ color: "var(--red)" }} />
            Latest Articles
          </h2>
          <div className="relative w-full sm:w-64">
            <FiSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--gray)" }}
            />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--lightgray)",
                borderColor: "var(--border)",
                color: "var(--black)",
                "--tw-ring-color": "var(--red)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── Posts Grid ────────────────────────────────────── */}
      <section className="py-8 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <FiSearch size={48} className="mx-auto mb-4" style={{ color: "var(--gray)" }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>No articles found</h3>
              <p style={{ color: "var(--gray)" }}>Try adjusting your search query.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, idx) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -6 }}
                    className="rounded-2xl overflow-hidden shadow-sm border cursor-pointer transition-all duration-300 h-full flex flex-col group"
                    style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
                  >
                    {/* Image */}
                    <div className="h-44 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:opacity-80 transition" style={{ color: "var(--black)" }}>
                        {post.title}
                      </h3>
                      <p className="text-sm mb-4 line-clamp-2 flex-1" style={{ color: "var(--gray)" }}>
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs mt-auto" style={{ color: "var(--gray)" }}>
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock size={12} />
                          {estimateReadTime(post.content)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium mt-3" style={{ color: "var(--red)" }}>
                        Read more <FiArrowRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Newsletter ────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FiSend size={36} className="mx-auto mb-4" style={{ color: "var(--red)" }} />
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--black)" }}>
              {subscribed ? "Thanks for Subscribing!" : "Stay Updated"}
            </h2>
            <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--gray)" }}>
              {subscribed
                ? "You'll receive our latest tips and tutorials in your inbox."
                : "Get the latest tips, tutorials, and updates delivered to your inbox."}
            </p>
            {!subscribed && (
              <form onSubmit={handleSubscribe} className="flex sm:flex-col l:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-full border text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--white)",
                    borderColor: "var(--border)",
                    color: "var(--black)",
                    "--tw-ring-color": "var(--red)",
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 text-center"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  Subscribe <FiArrowRight size={16} />
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}