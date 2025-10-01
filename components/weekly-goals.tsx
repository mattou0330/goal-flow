"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getSupabase, getWeekStartDate, type WeeklyTarget } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function WeeklyGoals() {
  const [goals, setGoals] = useState<WeeklyTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newGoal, setNewGoal] = useState({
    metric_name: "",
    target_value: "",
    unit: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()

      const { data, error } = await supabase
        .from("weekly_targets")
        .select("*")
        .eq("week_start_date", weekStart)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading goals:", error)
        return
      }

      setGoals(data || [])
    } catch (error) {
      console.error("[v0] Error loading goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!newGoal.metric_name || !newGoal.target_value || !newGoal.unit) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()

      const { data, error } = await supabase
        .from("weekly_targets")
        .insert({
          week_start_date: weekStart,
          metric_name: newGoal.metric_name,
          target_value: Number.parseFloat(newGoal.target_value),
          unit: newGoal.unit,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error adding goal:", error)
        toast({
          title: "エラー",
          description: "目標の追加に失敗しました",
          variant: "destructive",
        })
        return
      }

      setGoals([...goals, data])
      setNewGoal({ metric_name: "", target_value: "", unit: "" })
      setIsAdding(false)

      toast({
        title: "目標を追加しました",
      })
    } catch (error) {
      console.error("[v0] Error adding goal:", error)
    }
  }

  const handleRemoveGoal = async (id: string) => {
    try {
      const supabase = getSupabase()

      const { error } = await supabase.from("weekly_targets").delete().eq("id", id)

      if (error) {
        console.error("[v0] Error removing goal:", error)
        toast({
          title: "エラー",
          description: "目標の削除に失敗しました",
          variant: "destructive",
        })
        return
      }

      setGoals(goals.filter((goal) => goal.id !== id))

      toast({
        title: "目標を削除しました",
      })
    } catch (error) {
      console.error("[v0] Error removing goal:", error)
    }
  }

  const handleUpdateGoal = async (id: string, field: keyof WeeklyTarget, value: string | number) => {
    try {
      const supabase = getSupabase()

      const updateData: any = { [field]: value }
      if (field === "target_value") {
        updateData[field] = Number.parseFloat(value as string)
      }

      const { error } = await supabase.from("weekly_targets").update(updateData).eq("id", id)

      if (error) {
        console.error("[v0] Error updating goal:", error)
        return
      }

      setGoals(goals.map((goal) => (goal.id === id ? { ...goal, [field]: value } : goal)))
    } catch (error) {
      console.error("[v0] Error updating goal:", error)
    }
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
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 group">
            <div className="flex-1 grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <Input
                value={goal.metric_name}
                onChange={(e) => handleUpdateGoal(goal.id, "metric_name", e.target.value)}
                onBlur={(e) => handleUpdateGoal(goal.id, "metric_name", e.target.value)}
                className="bg-transparent border-none focus-visible:ring-1 h-8 px-2"
                placeholder="目標名"
              />
              <Input
                type="number"
                value={goal.target_value}
                onChange={(e) => handleUpdateGoal(goal.id, "target_value", e.target.value)}
                onBlur={(e) => handleUpdateGoal(goal.id, "target_value", e.target.value)}
                className="bg-transparent border-none focus-visible:ring-1 h-8 w-16 px-2 text-center"
                placeholder="0"
              />
              <Input
                value={goal.unit}
                onChange={(e) => handleUpdateGoal(goal.id, "unit", e.target.value)}
                onBlur={(e) => handleUpdateGoal(goal.id, "unit", e.target.value)}
                className="bg-transparent border-none focus-visible:ring-1 h-8 w-16 px-2"
                placeholder="単位"
              />
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
        ))}

        {isAdding ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border-2 border-primary/20">
            <div className="flex-1 grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <Input
                value={newGoal.metric_name}
                onChange={(e) => setNewGoal({ ...newGoal, metric_name: e.target.value })}
                className="bg-background/50 h-8 px-2"
                placeholder="目標名"
                autoFocus
              />
              <Input
                type="number"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                className="bg-background/50 h-8 w-16 px-2 text-center"
                placeholder="0"
              />
              <Input
                value={newGoal.unit}
                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="bg-background/50 h-8 w-16 px-2"
                placeholder="単位"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
                onClick={handleAddGoal}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsAdding(false)
                  setNewGoal({ metric_name: "", target_value: "", unit: "" })
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full rounded-lg border-dashed bg-transparent"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            目標を追加
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
