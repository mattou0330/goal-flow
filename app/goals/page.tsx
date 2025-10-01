"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { GoalsTree } from "@/components/goals-tree"
import { GoalDetail } from "@/components/goal-detail"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { getGoals, createGoal, type Goal } from "@/app/actions/goals"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const data = await getGoals()
        setGoals(data)
        if (data.length > 0 && !selectedGoalId) {
          setSelectedGoalId(data[0].id)
        }
      } catch (error) {
        console.error("Failed to load goals:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [])

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get("goal-title") as string
    const description = formData.get("goal-description") as string
    const parentId = formData.get("goal-parent") as string | null

    if (!title.trim()) return

    try {
      const newGoal = await createGoal({
        title,
        description: description || undefined,
        parent_id: parentId === "none" ? null : parentId,
        status: "active",
        progress: 0,
      })

      // 楽観的UI更新：新しいゴールをリストに追加
      setGoals([...goals, newGoal])
      setSelectedGoalId(newGoal.id)
      setIsDialogOpen(false)

      // フォームをリセット
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create goal:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ゴール管理</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新規ゴール
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ゴール</DialogTitle>
                <DialogDescription>新しいゴールを作成します</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGoal}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-title">タイトル</Label>
                    <Input id="goal-title" name="goal-title" placeholder="ゴールのタイトル" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-description">説明</Label>
                    <Textarea
                      id="goal-description"
                      name="goal-description"
                      placeholder="ゴールの説明（任意）"
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-parent">親ゴール</Label>
                    <Select name="goal-parent" defaultValue="none">
                      <SelectTrigger id="goal-parent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし（トップレベル）</SelectItem>
                        {goals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">作成</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Left: Goals Tree */}
          <div className="lg:col-span-1">
            <GoalsTree goals={goals} selectedGoalId={selectedGoalId} onSelectGoal={setSelectedGoalId} />
          </div>

          {/* Right: Goal Detail */}
          <div className="lg:col-span-1">
            <GoalDetail goalId={selectedGoalId} />
          </div>
        </div>
      </main>
    </div>
  )
}
