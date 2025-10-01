import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return supabaseClient
}

export type WeeklyTarget = {
  id: string
  user_id: string
  week_start_date: string
  metric_name: string
  target_value: number
  unit: string
  goal_id?: string
  created_at: string
}

export type Record = {
  id: string
  user_id: string
  performed_at: string
  quantity: number
  unit: string
  memo?: string
  goal_id?: string
  plan_id?: string
  created_at: string
}

export type WeeklyReview = {
  id: string
  user_id: string
  week_start_date: string
  summary?: string
  learnings?: string
  problems?: string
  improvements?: string
  self_rating?: number
  created_at: string
}

export type WeeklyProgress = {
  metric_name: string
  target_value: number
  actual_value: number
  unit: string
  achievement_rate: number
}

export function getWeekStartDate(date: Date = new Date()): string {
  const jstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
  const day = jstDate.getDay()
  const diff = day === 0 ? -6 : 1 - day // 月曜日を週の開始とする
  const weekStart = new Date(jstDate)
  weekStart.setDate(jstDate.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart.toISOString().split("T")[0]
}
