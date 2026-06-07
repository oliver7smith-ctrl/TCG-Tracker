
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: { default: "Collectible Tracker", template: "%s | Collectible Tracker" },
  description: "The collector's operating system. Track stock, manage your collection, and invest smarter across every TCG and collectible category.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CT" },
}

export const viewport: Viewport = {
  themeColor: "#7c3aed", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem("ct_theme") || "system"
            const d = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
            if (d) document.documentElement.classList.add("dark")
          } catch(e){}
        `}} />
      </head>
      <body className={inter.variable + " font-sans antialiased"}>{children}</body>
    </html>
  )
}
