"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type UserSettings = {
  theme_color: string
  week_start_day: string
}

export async function getSettings(): Promise<UserSettings | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("theme_color, week_start_day")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("設定取得エラー:", error)
    return null
  }

  return data || { theme_color: "blue", week_start_day: "monday" }
}

export async function updateSettings(settings: {
  theme_color?: string
  week_start_day?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証が必要です" }

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()

  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        theme_color: settings.theme_color,
        week_start_day: settings.week_start_day,
      })
      .eq("id", existingProfile.id)

    if (error) {
      console.error("設定更新エラー:", error)
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: user.email?.split("@")[0] || "ユーザー",
      theme_color: settings.theme_color || "blue",
      week_start_day: settings.week_start_day || "monday",
    })

    if (error) {
      console.error("プロフィール作成エラー:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/settings")
  return { success: true }
}

export async function updateEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証が必要です" }

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) {
    console.error("メールアドレス更新エラー:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証が必要です" }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error("パスワード更新エラー:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
