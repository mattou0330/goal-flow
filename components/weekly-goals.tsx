"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getCurrentWeekGoals,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  type WeeklyGoal,
  type Plan,
} from "@/app/actions/goals"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type WeeklyGoalWithPlan = WeeklyGoal & { plans: Plan }

export function WeeklyGoals() {
  const [goals, setGoals] = useState<WeeklyGoalWithPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadGoals()

    const handleRecordAdded = () => {
      console.log("[v0] Record added event received in WeeklyGoals")
      loadGoals()
    }

    window.addEventListener("recordAdded", handleRecordAdded)

    return () => {
      window.removeEventListener("recordAdded", handleRecordAdded)
    }
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const data = await getCurrentWeekGoals()
      setGoals(data)
    } catch (error) {
      console.error("[v0] Failed to load weekly goals:", error)
      toast({
        title: "エラー",
        description: "今週の目標の読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCurrentValue = async (id: string, currentValue: number) => {
    try {
      await updateWeeklyGoal(id, { current_value: currentValue })
      setGoals(goals.map((goal) => (goal.id === id ? { ...goal, current_value: currentValue } : goal)))
      setEditingGoal(null)
      toast({
        title: "更新しました",
        description: "進捗を更新しました",
      })
    } catch (error) {
      console.error("[v0] Failed to update weekly goal:", error)
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
      setGoals(goals.filter((goal) => goal.id !== id))
      toast({
        title: "削除しました",
        description: "今週の目標を削除しました",
      })
    } catch (error) {
      console.error("[v0] Failed to delete weekly goal:", error)
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

  if (loading) {
    return (
      <Card className="rounded-lg shadow-sm border-border">
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
    <Card className="rounded-lg shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">今週の目標</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
            const isEditing = editingGoal === goal.id

            return (
              <div
                key={goal.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, goal)}
                className="p-3 rounded-lg bg-muted/50 space-y-2 group cursor-move hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{goal.plans.title}</div>
                      {goal.plans.unit && (
                        <Badge variant="secondary" className="text-xs">
                          {goal.plans.unit}
                        </Badge>
                      )}
                    </div>
                    {goal.notes && <div className="text-xs text-muted-foreground mt-1">{goal.notes}</div>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-20 text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveEdit(goal.id)
                          } else if (e.key === "Escape") {
                            cancelEditing()
                          }
                        }}
                      />
                      <span className="text-sm text-muted-foreground">/ {goal.target_value}</span>
                      {goal.plans.unit && <span className="text-sm text-muted-foreground">{goal.plans.unit}</span>}
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => saveEdit(goal.id)}>
                        保存
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={cancelEditing}>
                        キャンセル
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {goal.current_value} / {goal.target_value}
                      </span>
                      {goal.plans.unit && <span className="text-sm text-muted-foreground">{goal.plans.unit}</span>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => startEditing(goal)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>

                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>今週の目標がありません</p>
            <p className="text-xs mt-2">ゴール管理ページのプランから目標を追加してください</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
