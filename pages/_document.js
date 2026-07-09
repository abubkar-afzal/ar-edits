// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-theme="light">
      <Head>
        

        {/* ─── Application Info ────────────────────────────── */}
        <meta name="application-name" content="AR Edits" />
        <meta name="apple-mobile-web-app-title" content="AR Edits" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* ─── Author & Copyright ──────────────────────────── */}
        <meta name="author" content="Hafiz Abubakar Afzal" />
        <meta name="copyright" content={`© ${new Date().getFullYear()} AR Edits. All rights reserved.`} />
        <meta name="designer" content="Hafiz Abubakar Afzal" />
        <meta name="developer" content="Hafiz Abubakar Afzal" />

        {/* ─── Favicon & Icons ─────────────────────────────── */}
        <link rel="icon" type="image/png" sizes="16x16" href="/my_logo_no_bg.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/my_logo_no_bg.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/my_logo_no_bg.png" />
        <link rel="icon" type="image/x-icon" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/my_logo_no_bg.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/my_logo_no_bg.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/my_logo_no_bg.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* ─── Preconnect for Performance ──────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* ─── Default SEO (will be overridden by pages) ───── */}
        <meta
          name="description"
          content="AR Edits is a free, browser-based creative suite with powerful tools for photo editing, video combining, audio editing, collage making, and file compression. No signup required — edit instantly."
        />
        <meta
          name="keywords"
          content="photo editor, video editor, audio editor, video combiner, photo collage, video collage, media compressor, free editor, online editor, browser editor, no signup, AR Edits, Hafiz Abubakar Afzal"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@arstudio" />
        <meta name="twitter:creator" content="@hafizabubakarafzal" />
        <meta name="twitter:title" content="AR Edits – Free Browser-Based Creative Suite" />
        <meta
          name="twitter:description"
          content="Edit photos, videos, and audio directly in your browser. No downloads, no signups, completely free."
        />
        <meta name="twitter:image" content="https://www.aredits.app/my_logo.jpg" />
        <meta name="twitter:image:alt" content="AR Edits – Free Creative Tools" />

        {/* ─── Open Graph / Facebook ────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AR Edits" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content="AR Edits – Free Browser-Based Creative Suite" />
        <meta
          property="og:description"
          content="Powerful photo, video, and audio editing tools that run entirely in your browser. No signup required, no files uploaded — 100% private and free."
        />
        <meta property="og:url" content="https://www.aredits.app" />
        <meta property="og:image" content="https://www.aredits.app/my_logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AR Edits – Free Browser-Based Creative Suite" />
        <meta property="og:image:type" content="image/png" />

        {/* ─── Structured Data / JSON-LD ────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "AR Edits",
              url: "https://www.aredits.app",
              description:
                "Free browser-based creative suite with photo editor, video combiner, audio editor, collage makers, and file compressor. No signup required.",
              applicationCategory: "Multimedia",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Hafiz Abubakar Afzal",
                url: "https://hafizabubakarafzal.vercel.app",
                jobTitle: "Full-Stack Developer",
                sameAs: [
                  "https://github.com/abubkar-afzal",
                  "https://www.linkedin.com/in/hafiz-abubakar-afzal-b77a46354/",
                ],
              },
              publisher: {
                "@type": "Organization",
                name: "AR Edits",
                url: "https://www.aredits.app",
              },
              browserRequirements: "Requires JavaScript. Works best on Chrome, Firefox, Edge, and Safari.",
              featureList: [
                "Photo Editor",
                "Video Combiner",
                "Audio Editor",
                "Video to Audio Converter",
                "Photo Collage Maker",
                "Video Collage Maker",
                "Media Compressor",
              ],
            }),
          }}
        />

        {/* ─── Organization Structured Data ────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AR Edits",
              url: "https://www.aredits.app",
              logo: "https://www.aredits.app/my_logo_no_bg.png",
              sameAs: [
                "https://github.com/abubkar-afzal",
                "https://www.linkedin.com/in/hafiz-abubakar-afzal-b77a46354/",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+92-327-0972423",
                contactType: "customer service",
                availableLanguage: ["English", "Urdu"],
              },
            }),
          }}
        />

        {/* ─── Breadcrumb Structured Data ──────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://www.aredits.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Tools",
                  item: "https://www.aredits.app/tools",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Games",
                  item: "https://www.aredits.app/games",
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: "Blog",
                  item: "https://www.aredits.app/blog",
                },
                {
                  "@type": "ListItem",
                  position: 5,
                  name: "About",
                  item: "https://www.aredits.app/about",
                },
                {
                  "@type": "ListItem",
                  position: 6,
                  name: "Contact",
                  item: "https://www.aredits.app/contact",
                },
              ],
            }),
          }}
        />
      </Head>

      <body style={{ backgroundColor: "var(--white)", margin: 0, minHeight: "100vh" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}