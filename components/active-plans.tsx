"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useCallback, memo } from "react"
import { useToast } from "@/hooks/use-toast"
import { getActivePlans, type Plan, type Goal } from "@/app/actions/goals"
import { Badge } from "@/components/ui/badge"

type PlanWithGoal = Plan & { goals: Goal }

export const ActivePlans = memo(function ActivePlans() {
  const [plans, setPlans] = useState<PlanWithGoal[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getActivePlans()
      setPlans(data)
    } catch (error) {
      console.error("Failed to load active plans:", error)
      toast({
        title: "エラー",
        description: "プランの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPlans()

    const handleRecordAdded = () => {
      loadPlans()
    }

    window.addEventListener("recordAdded", handleRecordAdded)

    return () => {
      window.removeEventListener("recordAdded", handleRecordAdded)
    }
  }, [loadPlans])

  const handleDragStart = (e: React.DragEvent, plan: PlanWithGoal) => {
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "plan",
        id: plan.id,
        title: plan.title,
        unit: plan.unit,
        goalTitle: plan.goals.title,
      }),
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">プラン</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">プラン</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {plans.length > 0 ? (
          plans.map((plan) => (
            <div
              key={plan.id}
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
              className="p-3 rounded-lg bg-muted/50 cursor-move hover:bg-muted transition-colors group border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{plan.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{plan.goals.title}</div>
                </div>
                {plan.unit && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {plan.unit}
                  </Badge>
                )}
              </div>
              {plan.target_value && (
                <div className="text-xs text-muted-foreground mt-2">
                  目標: {Math.round((plan.current_value || 0) * 10) / 10} / {Math.round(plan.target_value * 10) / 10}{" "}
                  {plan.unit}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>アクティブなプランがありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
