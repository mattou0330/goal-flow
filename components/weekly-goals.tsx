"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Plus } from "lucide-react"
import { useEffect, useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  getCurrentWeekGoals,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  getActivePlans,
  type WeeklyGoal,
  type Plan,
  type Goal,
} from "@/app/actions/goals"
import { getProfile } from "@/app/profile/actions"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CreateWeeklyGoalDialog } from "@/components/create-weekly-goal-dialog"

type WeeklyGoalWithPlan = WeeklyGoal & { plans: Plan }
type PlanWithGoal = Plan & { goals: Goal }

export const WeeklyGoals = memo(function WeeklyGoals() {
  const [goals, setGoals] = useState<WeeklyGoalWithPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanWithGoal | null>(null)
  const [plans, setPlans] = useState<PlanWithGoal[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [weekStartDate, setWeekStartDate] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  const calculateWeekStartDate = useCallback(async () => {
    try {
      const profile = await getProfile()
      const weekStartDay = profile?.week_start_day || "monday"

      const now = new Date()
      const dayOfWeek = now.getDay()

      let diff: number
      if (weekStartDay === "sunday") {
        diff = -dayOfWeek
      } else {
        diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      }

      const startDay = new Date(now)
      startDay.setDate(now.getDate() + diff)
      startDay.setHours(0, 0, 0, 0)

      const year = startDay.getFullYear()
      const month = String(startDay.getMonth() + 1).padStart(2, "0")
      const day = String(startDay.getDate()).padStart(2, "0")
      const weekStart = `${year}-${month}-${day}`

      console.log("[v0] Client calculated week start date:", weekStart)
      return weekStart
    } catch (error) {
      console.error("Failed to calculate week start date:", error)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      monday.setHours(0, 0, 0, 0)

      const year = monday.getFullYear()
      const month = String(monday.getMonth() + 1).padStart(2, "0")
      const day = String(monday.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
  }, [])

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCurrentWeekGoals()
      console.log("[v0] Loaded weekly goals:", data)
      setGoals(data)
    } catch (error) {
      console.error("Failed to load weekly goals:", error)
      toast({
        title: "エラー",
        description: "今週の目標の読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadPlans = useCallback(async () => {
    try {
      const data = await getActivePlans()
      setPlans(data)
    } catch (error) {
      console.error("Failed to load plans:", error)
    }
  }, [])

  useEffect(() => {
    const initWeekStartDate = async () => {
      const date = await calculateWeekStartDate()
      setWeekStartDate(date)
    }
    initWeekStartDate()
  }, [calculateWeekStartDate])

  useEffect(() => {
    loadGoals()
    loadPlans()

    const handleRecordAdded = () => {
      loadGoals()
    }

    window.addEventListener("recordAdded", handleRecordAdded)

    return () => {
      window.removeEventListener("recordAdded", handleRecordAdded)
    }
  }, [loadGoals, loadPlans])

  const handleUpdateCurrentValue = async (id: string, currentValue: number) => {
    try {
      const roundedValue = Math.round(currentValue * 100) / 100
      await updateWeeklyGoal(id, { current_value: roundedValue })
      router.refresh()
      await loadGoals()
      setEditingGoal(null)
      toast({
        title: "更新しました",
        description: "進捗を更新しました",
      })
    } catch (error) {
      console.error("Failed to update weekly goal:", error)
      toast({
        title: "エラー",
        description: "進捗の更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleRemoveGoal = async (id: string) => {
    try {
      await deleteWeeklyGoal(id)
      router.refresh()
      await loadGoals()
      toast({
        title: "削除しました",
        description: "今週の目標を削除しました",
      })
    } catch (error) {
      console.error("Failed to delete weekly goal:", error)
      toast({
        title: "エラー",
        description: "目標の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const startEditing = (goal: WeeklyGoalWithPlan) => {
    setEditingGoal(goal.id)
    setEditValue(goal.current_value.toString())
  }

  const cancelEditing = () => {
    setEditingGoal(null)
    setEditValue("")
  }

  const saveEdit = (id: string) => {
    const value = Number.parseFloat(editValue)
    if (!Number.isNaN(value)) {
      handleUpdateCurrentValue(id, value)
    }
  }

  const handleDragStart = (e: React.DragEvent, goal: WeeklyGoalWithPlan) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "weekly_goal",
        id: goal.id,
        title: goal.plans.title,
        unit: goal.plans.unit,
        planId: goal.plan_id,
      }),
    )
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))

      if (data.type === "plan") {
        const plan = plans.find((p) => p.id === data.id)
        if (plan) {
          setSelectedPlan(plan)
          setCreateDialogOpen(true)
        }
      }
    } catch (error) {
      console.error("Failed to parse drop data:", error)
    }
  }

  const handleAddClick = () => {
    if (plans.length === 0) {
      toast({
        title: "プランがありません",
        description: "まずゴール管理ページでプランを作成してください",
        variant: "destructive",
      })
      return
    }

    setSelectedPlan(plans[0])
    setCreateDialogOpen(true)
  }

  const handleGoalCreated = useCallback(async () => {
    router.refresh()
    await loadGoals()
  }, [loadGoals, router])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">今週の目標</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={isDragOver ? "ring-2 ring-primary" : ""}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">今週の目標</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddClick}
              className="h-8 w-8 hover:bg-primary/10"
              title="今週の目標を追加"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.length > 0 ? (
            goals.map((goal) => {
              const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
              const isEditing = editingGoal === goal.id

              const displayCurrentValue = Math.round(goal.current_value * 10) / 10
              const displayTargetValue = Math.round(goal.target_value * 10) / 10

              return (
                <div
                  key={goal.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, goal)}
                  className="p-3 rounded-lg bg-muted/50 space-y-2 group cursor-move hover:bg-muted transition-colors border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{goal.plans.title}</div>
                        {goal.plans.unit && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {goal.plans.unit}
                          </Badge>
                        )}
                      </div>
                      {goal.notes && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.notes}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRemoveGoal(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {isEditing ? (
                      <>
                        <Input
                          type="number"
                          step="0.1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 w-16 text-xs text-center"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEdit(goal.id)
                            } else if (e.key === "Escape") {
                              cancelEditing()
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">/ {displayTargetValue}</span>
                        {goal.plans.unit && <span className="text-xs text-muted-foreground">{goal.plans.unit}</span>}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => saveEdit(goal.id)}
                        >
                          保存
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={cancelEditing}>
                          キャンセル
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium">
                          {displayCurrentValue} / {displayTargetValue}
                        </span>
                        {goal.plans.unit && <span className="text-xs text-muted-foreground">{goal.plans.unit}</span>}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => startEditing(goal)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <div className="text-xs text-muted-foreground shrink-0 w-10 text-right">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>今週の目標がありません</p>
              <p className="text-xs mt-2">
                右側の「プラン」からドラッグするか、
                <br />
                上の＋ボタンから目標を追加してください
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {weekStartDate && (
        <CreateWeeklyGoalDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          plan={selectedPlan}
          weekStartDate={weekStartDate}
          onSuccess={handleGoalCreated}
        />
      )}
    </>
  )
})
