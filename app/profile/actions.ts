"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"

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
  const supabase = createServerClient(await cookies())
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
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証が必要です" }

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle()

  if (existingProfile) {
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
    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      name: formData.name,
      avatar_url: formData.avatar_url,
      birth_date: formData.birth_date,
      week_start_day: "monday",
    })

    if (error) {
      console.error("プロフィール作成エラー:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/profile")
  return { success: true }
}

export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "ファイルが選択されていません" }
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "画像ファイルを選択してください" }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "ファイルサイズは5MB以下にしてください" }
    }

    const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("画像アップロードエラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "画像のアップロードに失敗しました" }
  }
}
