"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

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
  user_id: string // ユーザー認証を追加
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
  user_id: string // ユーザー認証を追加
}

export type GoalLog = {
  id: string
  goal_id: string
  content: string
  log_type: "note" | "milestone" | "issue" | "decision"
  created_at: string
  user_id: string // ユーザー認証を追加
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
  user_id: string // ユーザー認証を追加
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
  user_id: string // ユーザー認証を追加
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
  user_id: string // ユーザー認証を追加
}

export type Record = {
  id: string
  quantity: number
  unit: string
  memo: string | null
  performed_at: string
  created_at: string
  weekly_goal_id: string | null
  plan_id: string | null
  user_id: string // ユーザー認証を追加
}

export type RecordWithRelations = Record & {
  weekly_goals?: WeeklyGoal & { plans: Plan & { goals: Goal } }
  plans?: Plan & { goals: Goal }
}

// ゴールの取得
export async function getGoals() {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })

  if (error) throw error
  return data as Goal[]
}

// 特定のゴールを取得
export async function getGoal(id: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase.from("goals").select("*").eq("id", id).eq("user_id", user.id).single()

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
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goals")
    .insert({ ...goal, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/goals")
  return data as Goal
}

// ゴールの更新
export async function updateGoal(id: string, updates: Partial<Goal>) {
  try {
    const supabase = createServerClient(await cookies())
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
  const supabase = createServerClient(await cookies())

  // 関連するプランを取得
  const { data: plans } = await supabase.from("plans").select("id").eq("goal_id", id)

  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id)

    // 各プランに関連する週次目標を削除
    await supabase.from("weekly_goals").delete().in("plan_id", planIds)

    // 各プランに関連する記録を削除
    await supabase.from("records").delete().in("plan_id", planIds)

    // プランの履歴を削除
    await supabase.from("plan_history").delete().in("plan_id", planIds)

    // プランを削除
    await supabase.from("plans").delete().in("id", planIds)
  }

  // ゴールに関連する記録を削除
  await supabase.from("goal_logs").delete().eq("goal_id", id)

  // ゴールに関連する週次目標を削除
  await supabase.from("goal_weekly_targets").delete().eq("goal_id", id)

  // ゴールに関連するレビューを削除
  await supabase.from("goal_reviews").delete().eq("goal_id", id)

  // ゴールを削除
  const { error } = await supabase.from("goals").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
  revalidatePath("/")
}

// プランの取得
export async function getPlans(goalId: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Plan[]
}

// 全てのプランの取得
export async function getAllPlans() {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id)
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
  target_value?: number
  current_value?: number
  unit?: string
}) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("plans")
    .insert({ ...plan, user_id: user.id })
    .select()
    .single()

  if (error) throw error

  await recordPlanHistory(data.id, "created", [{ field: "作成", oldValue: null, newValue: "プランが作成されました" }])

  revalidatePath("/goals")
  return data as Plan
}

// プランの更新
export async function updatePlan(id: string, updates: Partial<Plan>) {
  const supabase = createServerClient(await cookies())

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
  const supabase = createServerClient(await cookies())

  await recordPlanHistory(id, "deleted", [{ field: "削除", oldValue: "存在", newValue: null }])

  const { error } = await supabase.from("plans").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
}

// 記録の取得
export async function getGoalLogs(goalId: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_logs")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
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
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_logs")
    .insert({ ...log, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalLog
}

// 週次目標の取得
export async function getGoalWeeklyTargets(goalId: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_weekly_targets")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
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
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_weekly_targets")
    .insert({ ...target, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalWeeklyTarget
}

// 週次目標の更新
export async function updateGoalWeeklyTarget(id: string, updates: Partial<GoalWeeklyTarget>) {
  const supabase = createServerClient(await cookies())
  const { data, error } = await supabase.from("goal_weekly_targets").update(updates).eq("id", id).select().single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalWeeklyTarget
}

// レビューの取得
export async function getGoalReviews(goalId: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_reviews")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
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
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("goal_reviews")
    .insert({ ...review, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/goals")
  return data as GoalReview
}

export async function reorderGoal(goalId: string, newParentId: string | null, targetPosition: number) {
  try {
    const supabase = createServerClient(await cookies())

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
  const supabase = createServerClient(await cookies())

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
    const supabase = createServerClient(await cookies())
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
  const supabase = createServerClient(await cookies())
  const { data, error } = await supabase
    .from("weekly_goals")
    .select("*")
    .eq("plan_id", planId)
    .order("week_start_date", { ascending: false })

  if (error) throw error
  return data as (WeeklyGoal & { plans: Plan })[]
}

// 週次目標の取得（今週分）
export async function getCurrentWeekGoals(weekOffset = 0) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data: settings } = await supabase.from("profiles").select("week_start_day").eq("user_id", user.id).single()

  const weekStartDay = settings?.week_start_day || "monday"

  // 指定された週の開始日を計算
  const now = new Date()
  const dayOfWeek = now.getDay()

  let diff: number
  if (weekStartDay === "sunday") {
    diff = -dayOfWeek
  } else {
    // 月曜始まり
    diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  }

  const monday = new Date(now)
  monday.setDate(now.getDate() + diff + weekOffset * 7)
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
    .eq("user_id", user.id)
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
    const supabase = createServerClient(await cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("認証が必要です")

    const { data, error } = await supabase
      .from("weekly_goals")
      .insert({
        ...weeklyGoal,
        user_id: user.id,
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
    revalidatePath("/")
    revalidatePath("/goals")
    revalidatePath("/review")
    return data as WeeklyGoal
  } catch (error) {
    console.error("[v0] Error in createWeeklyGoal:", error)
    throw error
  }
}

// カスタム週次目標の作成（プランなしで作成する場合）
export async function createCustomWeeklyGoal(customGoal: {
  title: string
  unit: string
  week_start_date: string
  target_value: number
  notes?: string
}) {
  console.log("[v0] Creating custom weekly goal:", customGoal)

  try {
    const supabase = createServerClient(await cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("認証が必要です")

    let customGoalId: string

    // "カスタム目標"という名前のゴールを探す
    const { data: existingGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", "カスタム目標")
      .single()

    if (existingGoal) {
      customGoalId = existingGoal.id
    } else {
      // カスタム目標用のゴールを作成
      const { data: newGoal, error: goalError } = await supabase
        .from("goals")
        .insert({
          title: "カスタム目標",
          description: "プランに紐付かない単発の目標",
          status: "active",
          user_id: user.id,
        })
        .select()
        .single()

      if (goalError) throw goalError
      customGoalId = newGoal.id
    }

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .insert({
        goal_id: customGoalId,
        title: customGoal.title,
        description: "カスタム週次目標",
        status: "in_progress",
        priority: "medium",
        unit: customGoal.unit,
        user_id: user.id,
      })
      .select()
      .single()

    if (planError) throw planError

    const { data: weeklyGoal, error: weeklyGoalError } = await supabase
      .from("weekly_goals")
      .insert({
        plan_id: plan.id,
        week_start_date: customGoal.week_start_date,
        target_value: customGoal.target_value,
        current_value: 0,
        status: "active",
        notes: customGoal.notes || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (weeklyGoalError) throw weeklyGoalError

    console.log("[v0] Custom weekly goal created successfully:", weeklyGoal)
    revalidatePath("/goals")
    revalidatePath("/")
    revalidatePath("/review")
    return weeklyGoal as WeeklyGoal
  } catch (error) {
    console.error("[v0] Error in createCustomWeeklyGoal:", error)
    throw error
  }
}

// 週次目標の更新
export async function updateWeeklyGoal(id: string, updates: Partial<WeeklyGoal>) {
  const supabase = createServerClient(await cookies())
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
  const supabase = createServerClient(await cookies())
  const { error } = await supabase.from("weekly_goals").delete().eq("id", id)

  if (error) throw error
  revalidatePath("/goals")
}

// 週次目標の取得（ゴール別）
export async function getWeeklyGoalsByGoal(goalId: string) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data: plans } = await supabase.from("plans").select("id").eq("goal_id", goalId).eq("user_id", user.id)

  let weeklyGoalsCount = 0
  let recordsCount = 0

  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id)

    const { count: wgCount } = await supabase
      .from("weekly_goals")
      .select("*", { count: "exact", head: true })
      .in("plan_id", planIds)

    const { count: recCount } = await supabase
      .from("records")
      .select("*", { count: "exact", head: true })
      .in("plan_id", planIds)

    weeklyGoalsCount = wgCount || 0
    recordsCount = recCount || 0
  }

  const { data, error } = await supabase
    .from("weekly_goals")
    .select(`
      *,
      plans:plan_id (
        id,
        title,
        unit,
        goal_id,
        goals:goal_id (
          id,
          title
        )
      )
    `)
    .eq("goal_id", goalId)
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false })

  if (error) throw error
  return data as (WeeklyGoal & { plans: Plan & { goals: Goal } })[]
}

export async function getActivePlans() {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("plans")
    .select(`
      *,
      goals:goal_id (
        id,
        title
      )
    `)
    .in("status", ["pending", "in_progress"])
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) throw error
  return data as (Plan & { goals: Goal })[]
}

// 記録の取得
export async function getRecentRecords(limit = 10, offset = 0) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  // 1回のクエリで全ての関連データを取得
  const { data: records, error } = await supabase
    .from("records")
    .select(`
      *,
      weekly_goals:weekly_goal_id (
        id,
        target_value,
        current_value,
        plan_id,
        plans:plan_id (
          id,
          title,
          unit,
          goal_id,
          goals:goal_id (
            id,
            title
          )
        )
      ),
      plans:plan_id (
        id,
        title,
        unit,
        goal_id,
        goals:goal_id (
          id,
          title
        )
      )
    `)
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("[v0] Error loading records:", error)
    throw error
  }

  return (records || []) as RecordWithRelations[]
}

export async function addRecord(record: {
  quantity: number
  unit: string
  memo?: string
  weekly_goal_id?: string
  plan_id?: string
  performed_at?: string
}) {
  const supabase = createServerClient(await cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("認証が必要です")

  const { data, error } = await supabase
    .from("records")
    .insert({
      quantity: record.quantity,
      unit: record.unit,
      memo: record.memo || null,
      weekly_goal_id: record.weekly_goal_id || null,
      plan_id: record.plan_id || null,
      performed_at: record.performed_at || new Date().toISOString(),
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error

  if (record.weekly_goal_id) {
    const { data: weeklyGoalData } = await supabase
      .from("weekly_goals")
      .select("current_value, target_value, plan_id")
      .eq("id", record.weekly_goal_id)
      .single()

    if (weeklyGoalData) {
      const { data: planData } = await supabase.from("plans").select("unit").eq("id", weeklyGoalData.plan_id).single()

      if (planData) {
        let quantityToAdd = record.quantity
        const recordUnit = record.unit
        const planUnit = planData.unit

        if (recordUnit === "分" && planUnit === "時間") {
          quantityToAdd = record.quantity / 60
        } else if (recordUnit === "時間" && planUnit === "分") {
          quantityToAdd = record.quantity * 60
        }

        const newCurrentValue = (weeklyGoalData.current_value || 0) + quantityToAdd
        const newStatus = newCurrentValue >= weeklyGoalData.target_value ? "completed" : "active"

        await supabase
          .from("weekly_goals")
          .update({
            current_value: newCurrentValue,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.weekly_goal_id)
      }
    }
  }

  if (record.plan_id) {
    const { data: planData } = await supabase
      .from("plans")
      .select("current_value, unit")
      .eq("id", record.plan_id)
      .single()

    if (planData) {
      let quantityToAdd = record.quantity
      const recordUnit = record.unit
      const planUnit = planData.unit

      if (recordUnit === "分" && planUnit === "時間") {
        quantityToAdd = record.quantity / 60
      } else if (recordUnit === "時間" && planUnit === "分") {
        quantityToAdd = record.quantity * 60
      }

      const newCurrentValue = (planData.current_value || 0) + quantityToAdd

      await supabase
        .from("plans")
        .update({
          current_value: newCurrentValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.plan_id)
    }
  }

  revalidatePath("/")
  return data as Record
}

export async function updateRecord(
  id: string,
  updates: {
    quantity?: number
    unit?: string
    memo?: string
    performed_at?: string
  },
) {
  const supabase = createServerClient(await cookies())

  const { data: oldRecord } = await supabase.from("records").select("*").eq("id", id).single()

  const { data, error } = await supabase.from("records").update(updates).eq("id", id).select().single()

  if (error) throw error

  if (oldRecord && oldRecord.weekly_goal_id && updates.quantity !== undefined) {
    const { data: weeklyGoalData } = await supabase
      .from("weekly_goals")
      .select("current_value, target_value, plan_id")
      .eq("id", oldRecord.weekly_goal_id)
      .single()

    if (weeklyGoalData) {
      const { data: planData } = await supabase.from("plans").select("unit").eq("id", weeklyGoalData.plan_id).single()

      if (planData) {
        let oldQuantity = oldRecord.quantity
        let newQuantity = updates.quantity
        const recordUnit = oldRecord.unit
        const planUnit = planData.unit

        if (recordUnit === "分" && planUnit === "時間") {
          oldQuantity = oldRecord.quantity / 60
          newQuantity = updates.quantity / 60
        } else if (recordUnit === "時間" && planUnit === "分") {
          oldQuantity = oldRecord.quantity * 60
          newQuantity = updates.quantity * 60
        }

        const quantityDiff = newQuantity - oldQuantity
        const newCurrentValue = (weeklyGoalData.current_value || 0) + quantityDiff
        const newStatus = newCurrentValue >= weeklyGoalData.target_value ? "completed" : "active"

        await supabase
          .from("weekly_goals")
          .update({
            current_value: newCurrentValue,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", oldRecord.weekly_goal_id)
      }
    }
  }

  if (oldRecord && oldRecord.plan_id && updates.quantity !== undefined) {
    const { data: planData } = await supabase
      .from("plans")
      .select("current_value, unit")
      .eq("id", oldRecord.plan_id)
      .single()

    if (planData) {
      let oldQuantity = oldRecord.quantity
      let newQuantity = updates.quantity
      const recordUnit = oldRecord.unit
      const planUnit = planData.unit

      if (recordUnit === "分" && planUnit === "時間") {
        oldQuantity = oldRecord.quantity / 60
        newQuantity = updates.quantity / 60
      } else if (recordUnit === "時間" && planUnit === "分") {
        oldQuantity = oldRecord.quantity * 60
        newQuantity = updates.quantity * 60
      }

      const quantityDiff = newQuantity - oldQuantity
      const newCurrentValue = (planData.current_value || 0) + quantityDiff

      await supabase
        .from("plans")
        .update({
          current_value: newCurrentValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", oldRecord.plan_id)
    }
  }

  revalidatePath("/")
  return data as Record
}

export async function deleteRecord(id: string) {
  const supabase = createServerClient(await cookies())

  const { data: record } = await supabase.from("records").select("*").eq("id", id).single()

  const { error } = await supabase.from("records").delete().eq("id", id)

  if (error) throw error

  if (record && record.weekly_goal_id) {
    const { data: weeklyGoalData } = await supabase
      .from("weekly_goals")
      .select("current_value, target_value, plan_id")
      .eq("id", record.weekly_goal_id)
      .single()

    if (weeklyGoalData) {
      const { data: planData } = await supabase.from("plans").select("unit").eq("id", weeklyGoalData.plan_id).single()

      if (planData) {
        let quantityToSubtract = record.quantity
        const recordUnit = record.unit
        const planUnit = planData.unit

        if (recordUnit === "分" && planUnit === "時間") {
          quantityToSubtract = record.quantity / 60
        } else if (recordUnit === "時間" && planUnit === "分") {
          quantityToSubtract = record.quantity * 60
        }

        const newCurrentValue = Math.max(0, (weeklyGoalData.current_value || 0) - quantityToSubtract)
        const newStatus = newCurrentValue >= weeklyGoalData.target_value ? "completed" : "active"

        await supabase
          .from("weekly_goals")
          .update({
            current_value: newCurrentValue,
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", record.weekly_goal_id)
      }
    }
  }

  if (record && record.plan_id) {
    const { data: planData } = await supabase
      .from("plans")
      .select("current_value, unit")
      .eq("id", record.plan_id)
      .single()

    if (planData) {
      let quantityToSubtract = record.quantity
      const recordUnit = record.unit
      const planUnit = planData.unit

      if (recordUnit === "分" && planUnit === "時間") {
        quantityToSubtract = record.quantity / 60
      } else if (recordUnit === "時間" && planUnit === "分") {
        quantityToSubtract = record.quantity * 60
      }

      const newCurrentValue = Math.max(0, (planData.current_value || 0) - quantityToSubtract)

      await supabase
        .from("plans")
        .update({
          current_value: newCurrentValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.plan_id)
    }
  }

  revalidatePath("/")
}

export async function getGoalDeletionInfo(id: string) {
  const supabase = createServerClient(await cookies())

  const { data: plans } = await supabase.from("plans").select("id").eq("goal_id", id)

  let weeklyGoalsCount = 0
  let recordsCount = 0

  if (plans && plans.length > 0) {
    const planIds = plans.map((p) => p.id)

    const { count: wgCount } = await supabase
      .from("weekly_goals")
      .select("*", { count: "exact", head: true })
      .in("plan_id", planIds)

    const { count: recCount } = await supabase
      .from("records")
      .select("*", { count: "exact", head: true })
      .in("plan_id", planIds)

    weeklyGoalsCount = wgCount || 0
    recordsCount = recCount || 0
  }

  const { count: logsCount } = await supabase
    .from("goal_logs")
    .select("*", { count: "exact", head: true })
    .eq("goal_id", id)

  const { count: targetsCount } = await supabase
    .from("goal_weekly_targets")
    .select("*", { count: "exact", head: true })
    .eq("goal_id", id)

  const { count: reviewsCount } = await supabase
    .from("goal_reviews")
    .select("*", { count: "exact", head: true })
    .eq("goal_id", id)

  return {
    plansCount: plans?.length || 0,
    weeklyGoalsCount,
    recordsCount,
    logsCount: logsCount || 0,
    targetsCount: targetsCount || 0,
    reviewsCount: reviewsCount || 0,
  }
}
