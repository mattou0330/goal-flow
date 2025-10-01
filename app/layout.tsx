import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { ColorThemeProvider } from "@/components/color-theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GoalFlow",
  description: "目標達成を支援するダッシュボード",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" data-theme="blue">
      <body className={`font-sans ${inter.variable}`}>
        <ColorThemeProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </ColorThemeProvider>
      </body>
    </html>
  )
}
