"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { GoalsTree } from "@/components/goals-tree"
import { GoalDetail } from "@/components/goal-detail"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { getGoals, getAllPlans, createGoal, type Goal, type Plan } from "@/app/actions/goals"
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
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const [goalsData, plansData] = await Promise.all([getGoals(), getAllPlans()])

        setGoals(goalsData)
        setPlans(plansData)

        if (goalsData.length > 0) {
          if (!selectedGoalId || !goalsData.find((g) => g.id === selectedGoalId)) {
            setSelectedGoalId(goalsData[0].id)
          }
        } else {
          setSelectedGoalId(null)
        }
      } catch (error) {
        console.error("Failed to load goals:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()

    const handleGoalDeleted = () => {
      setRefreshKey((prev) => prev + 1)
      loadGoals()
    }

    window.addEventListener("goalDeleted", handleGoalDeleted)

    return () => {
      window.removeEventListener("goalDeleted", handleGoalDeleted)
    }
  }, [refreshKey])

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get("goal-title") as string
    const description = formData.get("goal-description") as string
    const parentId = formData.get("goal-parent") as string | null
    const startDate = formData.get("goal-start-date") as string | null
    const targetDate = formData.get("goal-target-date") as string | null

    if (!title.trim()) return

    try {
      const newGoal = await createGoal({
        title,
        description: description || undefined,
        parent_id: parentId === "none" ? null : parentId,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        status: "active",
        progress: 0,
      })

      setGoals([...goals, newGoal])
      setSelectedGoalId(newGoal.id)
      setIsDialogOpen(false)

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
                  <div className="space-y-2">
                    <Label htmlFor="goal-start-date">開始日</Label>
                    <Input id="goal-start-date" name="goal-start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-target-date">期日</Label>
                    <Input id="goal-target-date" name="goal-target-date" type="date" />
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
          <div className="lg:col-span-1">
            <GoalsTree
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={setSelectedGoalId}
              allPlans={plans}
            />
          </div>

          <div className="lg:col-span-1">
            <GoalDetail key={`${selectedGoalId}-${refreshKey}`} goalId={selectedGoalId} />
          </div>
        </div>
      </main>
    </div>
  )
}
