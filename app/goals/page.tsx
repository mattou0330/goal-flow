"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { GoalsTree } from "@/components/goals-tree"
import { GoalDetail } from "@/components/goal-detail"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

export default function GoalsPage() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>("goal-1")

  return (
    <div className="min-h-screen bg-background dark">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ゴール管理</h2>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            新規ゴール
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Left: Goals Tree */}
          <div className="lg:col-span-1">
            <GoalsTree selectedGoalId={selectedGoalId} onSelectGoal={setSelectedGoalId} />
          </div>

          {/* Right: Goal Detail */}
          <div className="lg:col-span-1">
            {selectedGoalId ? (
              <GoalDetail goalId={selectedGoalId} />
            ) : (
              <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground">ゴールを選択してください</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
