import { createBrowserClient, createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null
let useMockMode = false

export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === "" || supabaseAnonKey.trim() === "") {
    useMockMode = true
    return null as any
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set")
  }

  const cookieStore = cookies()

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Server Componentからのcookie設定エラーを無視
        }
      },
    },
  })
}

export function isMockMode(): boolean {
  return useMockMode
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
  const diff = day === 0 ? -6 : 1 - day
  const weekStart = new Date(jstDate)
  weekStart.setDate(jstDate.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart.toISOString().split("T")[0]
}

export const mockWeeklyTargets: WeeklyTarget[] = [
  {
    id: "mock-1",
    user_id: "mock-user",
    week_start_date: getWeekStartDate(),
    metric_name: "ランニング",
    target_value: 20,
    unit: "km",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    user_id: "mock-user",
    week_start_date: getWeekStartDate(),
    metric_name: "読書",
    target_value: 3,
    unit: "冊",
    created_at: new Date().toISOString(),
  },
]

export const mockRecords: Record[] = [
  {
    id: "mock-rec-1",
    user_id: "mock-user",
    performed_at: new Date().toISOString(),
    quantity: 5,
    unit: "km",
    memo: "朝のランニング",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-rec-2",
    user_id: "mock-user",
    performed_at: new Date(Date.now() - 86400000).toISOString(),
    quantity: 1,
    unit: "冊",
    memo: "ビジネス書を読了",
    created_at: new Date().toISOString(),
  },
]
