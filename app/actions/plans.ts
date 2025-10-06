"use server"

import { createServerClient } from "@/lib/supabase/server"

export type Plan = {
  id: string
  goal_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string
  start_date: string
  target_date: string
  status: "active" | "completed" | "paused"
  created_at: string
  updated_at: string
}

export async function getAllPlans(): Promise<Plan[]> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("プラン取得エラー:", error)
    throw new Error("プランの取得に失敗しました")
  }

  return data || []
}
