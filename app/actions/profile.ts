"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type Profile = {
  id: string
  user_id: string | null
  name: string
  avatar_url: string | null
  birth_date: string | null
  created_at: string
  updated_at: string
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()

  if (error) {
    console.error("プロフィール取得エラー:", error)
    return null
  }

  return data
}

export async function updateProfile(formData: {
  name: string
  avatar_url?: string | null
  birth_date?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証が必要です" }

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()

  if (existingProfile) {
    // 更新
    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        avatar_url: formData.avatar_url,
        birth_date: formData.birth_date,
      })
      .eq("id", existingProfile.id)

    if (error) {
      console.error("プロフィール更新エラー:", error)
      return { success: false, error: error.message }
    }
  } else {
    // 新規作成
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: formData.name,
      avatar_url: formData.avatar_url,
      birth_date: formData.birth_date,
    })

    if (error) {
      console.error("プロフィール作成エラー:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/profile")
  return { success: true }
}
