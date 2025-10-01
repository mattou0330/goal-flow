"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type Goal = {
  id: string
  title: string
  description: string | null
  parent_id: string | null
  status: "active" | "completed" | "archived"
  progress: number
  start_date: string | null
  target_date: string | null
  completed_date: string | null
  display_order: number // 順序フィールドを追加
  created_at: string
  updated_at: string
}

export type Plan = {
  id: string
  goal_id: string
  title: string
  description: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  due_date: string | null
  completed_date: string | null
  target_value: number | null // 数値化フィールドを追加
  current_value: number | null // 数値化フィールドを追加
  unit: string | null // 数値化フィールドを追加
  created_at: string
  updated_at: string
}

export type GoalLog = {
  id: string
  goal_id: string
  content: string
  log_type: "note" | "milestone" | "issue" | "decision"
  created_at: string
}

export type GoalWeeklyTarget = {
  id: string
  goal_id: string
  week_start: string
  target: string
  status: "pending" | "in_progress" | "completed" | "missed"
  completed_date: string | null
  created_at: string
  updated_at: string
}

export type GoalReview = {
  id: string
  goal_id: string
  review_date: string
  what_went_well: string | null
  what_to_improve: string | null
  next_actions: string | null
  rating: number | null
  created_at: string
}

export type PlanHistory = {
  id: string
  plan_id: string
  changed_by: string | null
  change_type: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  created_at: string
}

// 新しい週次目標の型定義
export type WeeklyGoal = {
  id: string
  plan_id: string
  week_start_date: string
  target_value: number
  current_value: number
  status: "active" | "completed" | "failed"
  notes: string | null
  created_at: string
  updated_at: string
}

// ゴールの取得
export async function getGoals() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goals").select("*").order("display_order", { ascending: true })

  if (error) throw error
  return data as Goal[]
}

// 特定のゴールを取得
export async function getGoal(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goals").select("*").eq("id", id).single()

  if (error) throw error
  return data as Goal
}

// ゴールの作成
export async function createGoal(goal: {
  title: string
  description?: string
  parent_id?: string
  start_date?: string
  target_date?: string
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goals").insert(goal).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as Goal
}

// ゴールの更新
export async function updateGoal(id: string, updates: Partial<Goal>) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("goals").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`ゴールの更新に失敗しました: ${error.message}`)
    }

    revalidatePath("/goals")
    return data as Goal
  } catch (error) {
    console.error("Update goal error:", error)
    throw error
  }
}

// ゴールの削除
export async function deleteGoal(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("goals").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
}

// プランの取得
export async function getPlans(goalId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Plan[]
}

// プランの作成
export async function createPlan(plan: {
  goal_id: string
  title: string
  description?: string
  priority?: "low" | "medium" | "high"
  due_date?: string
  target_value?: number // 数値化フィールドを追加
  current_value?: number // 数値化フィールドを追加
  unit?: string // 数値化フィールドを追加
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("plans").insert(plan).select().single()

  if (error) throw error

  await recordPlanHistory(data.id, "created", [{ field: "作成", oldValue: null, newValue: "プランが作成されました" }])

  revalidatePath("/goals")
  return data as Plan
}

// プランの更新
export async function updatePlan(id: string, updates: Partial<Plan>) {
  const supabase = createServerClient()

  const { data: oldPlan } = await supabase.from("plans").select("*").eq("id", id).single()

  const { data, error } = await supabase.from("plans").update(updates).eq("id", id).select().single()

  if (error) throw error

  if (oldPlan && data) {
    const changes: { field: string; oldValue: any; newValue: any }[] = []

    const fieldLabels: Record<string, string> = {
      title: "タイトル",
      priority: "優先度",
      due_date: "期日",
      target_value: "目標値",
      current_value: "現在値",
      unit: "単位",
    }

    for (const [key, label] of Object.entries(fieldLabels)) {
      if (updates[key as keyof Plan] !== undefined && oldPlan[key] !== data[key]) {
        changes.push({
          field: label,
          oldValue: oldPlan[key],
          newValue: data[key],
        })
      }
    }

    if (changes.length > 0) {
      await recordPlanHistory(id, "updated", changes)
    }
  }

  revalidatePath("/goals")
  return data as Plan
}

// プランの削除
export async function deletePlan(id: string) {
  const supabase = createServerClient()

  await recordPlanHistory(id, "deleted", [{ field: "削除", oldValue: "存在", newValue: null }])

  const { error } = await supabase.from("plans").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
}

// 記録の取得
export async function getGoalLogs(goalId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("goal_logs")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as GoalLog[]
}

// 記録の作成
export async function createGoalLog(log: {
  goal_id: string
  content: string
  log_type?: "note" | "milestone" | "issue" | "decision"
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goal_logs").insert(log).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalLog
}

// 週次目標の取得
export async function getGoalWeeklyTargets(goalId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("goal_weekly_targets")
    .select("*")
    .eq("goal_id", goalId)
    .order("week_start", { ascending: false })

  if (error) throw error
  return data as GoalWeeklyTarget[]
}

// 週次目標の作成
export async function createGoalWeeklyTarget(target: {
  goal_id: string
  week_start: string
  target: string
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goal_weekly_targets").insert(target).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalWeeklyTarget
}

// 週次目標の更新
export async function updateGoalWeeklyTarget(id: string, updates: Partial<GoalWeeklyTarget>) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goal_weekly_targets").update(updates).eq("id", id).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalWeeklyTarget
}

// レビューの取得
export async function getGoalReviews(goalId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("goal_reviews")
    .select("*")
    .eq("goal_id", goalId)
    .order("review_date", { ascending: false })

  if (error) throw error
  return data as GoalReview[]
}

// レビューの作成
export async function createGoalReview(review: {
  goal_id: string
  review_date: string
  what_went_well?: string
  what_to_improve?: string
  next_actions?: string
  rating?: number
}) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("goal_reviews").insert(review).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalReview
}

export async function reorderGoal(goalId: string, newParentId: string | null, targetPosition: number) {
  try {
    const supabase = createServerClient()

    // reorder_goals関数を呼び出す
    const { error } = await supabase.rpc("reorder_goals", {
      goal_id: goalId,
      new_parent_id: newParentId,
      target_position: targetPosition,
    })

    if (error) {
      console.error("Supabase RPC error:", error)
      throw new Error(`ゴールの順序更新に失敗しました: ${error.message}`)
    }

    revalidatePath("/goals")
  } catch (error) {
    console.error("Reorder goal error:", error)
    throw error
  }
}

async function recordPlanHistory(
  planId: string,
  changeType: string,
  changes: { field: string; oldValue: any; newValue: any }[],
) {
  const supabase = createServerClient()

  const historyRecords = changes.map((change) => ({
    plan_id: planId,
    change_type: changeType,
    field_name: change.field,
    old_value: change.oldValue?.toString() || null,
    new_value: change.newValue?.toString() || null,
  }))

  const { error } = await supabase.from("plan_history").insert(historyRecords)

  if (error) {
    console.error("Failed to record plan history:", error)
  }
}

export async function getPlanHistory(planId: string) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("plan_history")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at", { ascending: false })

    if (error) {
      // テーブルが存在しない場合は空の配列を返す
      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        console.log("[v0] plan_history table does not exist, returning empty array")
        return []
      }
      throw error
    }
    return data as PlanHistory[]
  } catch (error) {
    console.error("[v0] Failed to get plan history:", error)
    return []
  }
}

// 週次目標のCRUD関数

// 週次目標の取得（プラン別）
export async function getWeeklyGoalsByPlan(planId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("plan_id", planId)
    .order("week_start_date", { ascending: false })

  if (error) throw error
  return data as WeeklyGoal[]
}

// 週次目標の取得（今週分）
export async function getCurrentWeekGoals() {
  const supabase = createServerClient()

  // 今週の月曜日を計算
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 日曜日の場合は前週の月曜日
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const weekStart = monday.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("weekly_goals")
    .select(`
      *,
      plans:plan_id (
        id,
        title,
        unit,
        target_value,
        goal_id
      )
    `)
    .eq("week_start_date", weekStart)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as (WeeklyGoal & { plans: Plan })[]
}

// 週次目標の作成
export async function createWeeklyGoal(weeklyGoal: {
  plan_id: string
  week_start_date: string
  target_value: number
  notes?: string
}) {
  console.log("[v0] Creating weekly goal:", weeklyGoal)

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("weekly_goals")
      .insert({
        ...weeklyGoal,
        current_value: 0,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create weekly goal:", error)
      throw error
    }

    console.log("[v0] Weekly goal created successfully:", data)
    revalidatePath("/goals")
    return data as WeeklyGoal
  } catch (error) {
    console.error("[v0] Error in createWeeklyGoal:", error)
    throw error
  }
}

// 週次目標の更新
export async function updateWeeklyGoal(id: string, updates: Partial<WeeklyGoal>) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("weekly_goals")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  revalidatePath("/goals")
  return data as WeeklyGoal
}

// 週次目標の削除
export async function deleteWeeklyGoal(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("weekly_goals").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
}
