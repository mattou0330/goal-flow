"use server"

import { createServerClient } from "@/lib/supabase"

export type UserSettings = {
  week_start_day: string
}

export async function getSettings(): Promise<UserSettings | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("week_start_day").eq("user_id", user.id).maybeSingle()

  if (error) {
    console.error("設定取得エラー:", error)
    return null
  }

  return data || { week_start_day: "monday" }
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
