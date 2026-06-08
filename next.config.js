const config = {
  serverExternalPackages: ["twilio", "resend", "stripe", "web-push"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.pokemoncenter.com" },
      { protocol: "https", hostname: "**.smythstoys.com" },
      { protocol: "https", hostname: "assets.pokemon.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ]
  },
}

module.exports = config
