"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createWeeklyGoal, createCustomWeeklyGoal, getActivePlans, type Plan, type Goal } from "@/app/actions/goals"
import { useEffect } from "react"

type PlanWithGoal = Plan & { goals: Goal }

interface CreateWeeklyGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
  weekStartDate: string
  onSuccess: () => void
}

export function CreateWeeklyGoalDialog({
  open,
  onOpenChange,
  plan: initialPlan,
  weekStartDate,
  onSuccess,
}: CreateWeeklyGoalDialogProps) {
  const [plans, setPlans] = useState<PlanWithGoal[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [customTitle, setCustomTitle] = useState("")
  const [customUnit, setCustomUnit] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadPlans()
      if (initialPlan) {
        setSelectedPlanId(initialPlan.id)
        setIsCustom(false)
      }
    }
  }, [open, initialPlan])

  const loadPlans = async () => {
    try {
      const data = await getActivePlans()
      setPlans(data)
    } catch (error) {
      console.error("Failed to load plans:", error)
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const target = Number.parseFloat(targetValue)
    if (Number.isNaN(target) || target <= 0) {
      toast({
        title: "エラー",
        description: "有効な目標値を入力してください",
        variant: "destructive",
      })
      return
    }

    if (isCustom) {
      if (!customTitle.trim()) {
        toast({
          title: "エラー",
          description: "目標名を入力してください",
          variant: "destructive",
        })
        return
      }

      if (!customUnit.trim()) {
        toast({
          title: "エラー",
          description: "単位を入力してください",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      try {
        await createCustomWeeklyGoal({
          title: customTitle,
          unit: customUnit,
          week_start_date: weekStartDate,
          target_value: target,
          notes: notes || undefined,
        })

        toast({
          title: "作成しました",
          description: "カスタム目標を作成しました",
        })

        // リセット
        setSelectedPlanId("")
        setCustomTitle("")
        setCustomUnit("")
        setTargetValue("")
        setNotes("")
        setIsCustom(false)
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        console.error("Failed to create custom weekly goal:", error)
        toast({
          title: "エラー",
          description: "カスタム目標の作成に失敗しました",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
      return
    }

    if (!selectedPlanId) {
      toast({
        title: "エラー",
        description: "プランを選択してください",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await createWeeklyGoal({
        plan_id: selectedPlanId,
        week_start_date: weekStartDate,
        target_value: target,
        notes: notes || undefined,
      })

      toast({
        title: "作成しました",
        description: "今週の目標を作成しました",
      })

      // リセット
      setSelectedPlanId("")
      setCustomTitle("")
      setCustomUnit("")
      setTargetValue("")
      setNotes("")
      setIsCustom(false)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to create weekly goal:", error)
      toast({
        title: "エラー",
        description: "今週の目標の作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>今週の目標を作成</DialogTitle>
          <DialogDescription>プランを選択するか、カスタム目標を作成してください</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>目標タイプ</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isCustom ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsCustom(false)}
              >
                プランから選択
              </Button>
              <Button
                type="button"
                variant={isCustom ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsCustom(true)}
              >
                カスタム目標
              </Button>
            </div>
          </div>

          {!isCustom ? (
            <div className="space-y-2">
              <Label htmlFor="plan">プラン</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="プランを選択" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title} ({plan.goals.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="customTitle">目標名</Label>
                <Input
                  id="customTitle"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="例: 毎日ランニング"
                  required={isCustom}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customUnit">単位</Label>
                <Input
                  id="customUnit"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="例: 回、時間、km"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="target">目標値</Label>
            <div className="flex gap-2">
              <Input
                id="target"
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="10"
                required
              />
              {!isCustom && selectedPlan?.unit && (
                <span className="flex items-center text-sm text-muted-foreground">{selectedPlan.unit}</span>
              )}
              {isCustom && customUnit && (
                <span className="flex items-center text-sm text-muted-foreground">{customUnit}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">メモ（任意）</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="今週の目標についてのメモ"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
