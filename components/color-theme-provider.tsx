"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-client"

const THEME_STORAGE_KEY = "goalflow-theme-color"

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (cachedTheme) {
      document.documentElement.setAttribute("data-theme", cachedTheme)
    }

    async function loadTheme() {
      const supabase = getSupabase()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase.from("profiles").select("theme_color").eq("user_id", user.id).maybeSingle()

      const themeColor = data?.theme_color || "blue"

      document.documentElement.setAttribute("data-theme", themeColor)
      localStorage.setItem(THEME_STORAGE_KEY, themeColor)
    }

    loadTheme()
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
