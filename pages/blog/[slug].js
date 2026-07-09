// pages/blog/[slug].js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import blogs from "../../data/blogs.json";
import {
  FiArrowLeft, FiCalendar, FiClock, FiShare2,
  FiLink, FiCheck, FiChevronRight,
} from "react-icons/fi";
import { FaTwitter, FaLinkedin, FaWhatsapp } from "react-icons/fa";

export async function getStaticPaths() {
  const paths = blogs.map((post) => ({
    params: { slug: post.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const post = blogs.find((p) => p.slug === params.slug);
  return {
    props: { post },
  };
}

// ─── Helper: estimate read time ────────────────────────────
function estimateReadTime(text) {
  const words = text?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(words / 200)) + " min read";
}

// ─── Share Button Component ────────────────────────────────
function ShareButtons({ title, slug }) {
  const [copied, setCopied] = useState(false);
  const url = `https://www.aredits.app/blog/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      icon: <FaTwitter size={18} />,
      label: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "var(--red)",
    },
    {
      icon: <FaLinkedin size={18} />,
      label: "LinkedIn",
      href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "var(--red)",
    },
    {
      icon: <FaWhatsapp size={18} />,
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      color: "var(--green)",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium mr-2" style={{ color: "var(--gray)" }}>
        <FiShare2 size={16} className="inline mr-1" /> Share
      </span>
      {shareLinks.map((link, idx) => (
        <motion.a
          key={idx}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--lightgray)", color: link.color }}
          title={link.label}
        >
          {link.icon}
        </motion.a>
      ))}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={copyLink}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: "var(--lightgray)", color: copied ? "var(--green)" : "var(--gray)" }}
        title="Copy link"
      >
        {copied ? <FiCheck size={16} /> : <FiLink size={16} />}
      </motion.button>
    </div>
  );
}

export default function BlogPost({ post }) {
  const [headings, setHeadings] = useState([]);

  // Extract headings for table of contents (if content has ## headings)
  useEffect(() => {
    if (post?.content) {
      const headingRegex = /^#{2,3}\s+(.+)$/gm;
      const matches = [];
      let match;
      while ((match = headingRegex.exec(post.content)) !== null) {
        matches.push({
          text: match[1].trim(),
          level: match[0].startsWith("###") ? 3 : 2,
        });
      }
      setHeadings(matches);
    }
  }, [post]);

  // Not found state
  if (!post) {
    return (
      <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--black)" }}>
            Post Not Found
          </h1>
          <p className="mb-6" style={{ color: "var(--gray)" }}>
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/blog">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-block px-6 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              ← Back to Blog
            </motion.span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const readTime = estimateReadTime(post.content);
  const paragraphs = post.content.split("\n").filter(p => p.trim());

  // Get related posts (same category or just other posts)
  const relatedPosts = blogs
    .filter(p => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />

      {/* ─── Hero Image ────────────────────────────────────── */}
      <section className="pt-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-56 sm:h-72 md:h-96 object-cover rounded-2xl shadow-sm"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── Article Content ───────────────────────────────── */}
      <article className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link href="/blog">
            <motion.span
              whileHover={{ x: -3 }}
              className="inline-flex items-center gap-1 text-sm font-medium mb-6 cursor-pointer"
              style={{ color: "var(--red)" }}
            >
              <FiArrowLeft size={16} /> Back to Blog
            </motion.span>
          </Link>

          {/* Title & Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: "var(--black)" }}>
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm" style={{ color: "var(--gray)" }}>
              <span className="flex items-center gap-1">
                <FiCalendar size={14} />
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <FiClock size={14} />
                {readTime}
              </span>
            </div>

            {/* Excerpt */}
            <div
              className="p-5 rounded-2xl border-l-4 mb-8 text-base italic"
              style={{
                backgroundColor: "var(--lightgray)",
                borderLeftColor: "var(--red)",
                color: "var(--black)",
              }}
            >
              {post.excerpt}
            </div>
          </motion.div>

          {/* Content + Sidebar layout */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1"
            >
              <div className="prose prose-lg max-w-none space-y-4">
                {paragraphs.map((para, i) => {
                  // Headings
                  if (para.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="text-2xl font-bold mt-10 mb-4"
                        style={{ color: "var(--black)" }}
                        id={`heading-${i}`}
                      >
                        {para.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (para.startsWith("### ")) {
                    return (
                      <h3
                        key={i}
                        className="text-xl font-semibold mt-8 mb-3"
                        style={{ color: "var(--black)" }}
                        id={`heading-${i}`}
                      >
                        {para.replace("### ", "")}
                      </h3>
                    );
                  }
                  // Regular paragraph
                  return (
                    <p
                      key={i}
                      className="text-base leading-relaxed"
                      style={{ color: "var(--black)" }}
                    >
                      {para}
                    </p>
                  );
                })}
              </div>

              {/* Share buttons */}
              <div className="mt-10 pt-8 border-t" style={{ borderColor: "var(--border)" }}>
                <ShareButtons title={post.title} slug={post.slug} />
              </div>
            </motion.div>

            {/* Sidebar – Table of Contents + Share (desktop) */}
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <div className="sticky top-24">
                {/* Table of Contents */}
                {headings.length > 0 && (
                  <div
                    className="rounded-2xl shadow-sm border p-5 mb-6"
                    style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
                  >
                    <h4 className="text-sm font-bold mb-3" style={{ color: "var(--black)" }}>
                      Table of Contents
                    </h4>
                    <nav className="space-y-1.5">
                      {headings.map((h, idx) => (
                        <a
                          key={idx}
                          href={`#heading-${idx}`}
                          className="block text-sm transition-colors hover:opacity-70 py-1"
                          style={{
                            color: h.level === 3 ? "var(--gray)" : "var(--black)",
                            paddingLeft: h.level === 3 ? "16px" : "0",
                          }}
                        >
                          {h.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Share on desktop */}
                <div
                  className="rounded-2xl shadow-sm border p-5"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
                >
                  <h4 className="text-sm font-bold mb-3" style={{ color: "var(--black)" }}>
                    Share This Article
                  </h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: <FaTwitter size={16} />, label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=https://www.aredits.app/blog/${post.slug}`, color: "var(--red)" },
                      { icon: <FaLinkedin size={16} />, label: "LinkedIn", href: `https://linkedin.com/sharing/share-offsite/?url=https://www.aredits.app/blog/${post.slug}`, color: "var(--red)" },
                      { icon: <FaWhatsapp size={16} />, label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(post.title + " https://www.aredits.app/blog/" + post.slug)}`, color: "var(--green)" },
                    ].map((link, idx) => (
                      <motion.a
                        key={idx}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 3 }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
                      >
                        <span style={{ color: link.color }}>{link.icon}</span>
                        {link.label}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </article>

      {/* ─── Related Posts ─────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--black)" }}>
                Related Articles
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related, idx) => (
                <Link key={related.id} href={`/blog/${related.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -6 }}
                    className="rounded-2xl overflow-hidden shadow-sm border cursor-pointer transition-all duration-300 group"
                    style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-semibold mb-2 line-clamp-2 group-hover:opacity-80 transition" style={{ color: "var(--black)" }}>
                        {related.title}
                      </h3>
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--gray)" }}>
                        {related.excerpt}
                      </p>
                      <span className="text-xs flex items-center gap-1 font-medium" style={{ color: "var(--red)" }}>
                        Read more <FiChevronRight size={14} />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}