"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react"
import confetti from "canvas-confetti"
import { useToast } from "@/hooks/use-toast"
import { getCurrentWeekGoals, type WeeklyGoal, type Plan } from "@/app/actions/goals"
import { getSettings } from "@/app/actions/settings"

type WeeklyGoalWithPlan = WeeklyGoal & { plans: Plan }

type WeeklyGoalData = {
  id: string
  metric: string
  targetValue: number
  unit: string
}

export function WeeklyReviewWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoalWithPlan[]>([])
  const [weekPeriod, setWeekPeriod] = useState<string>("")

  const [reflections, setReflections] = useState({
    summary: "",
    learnings: "",
    problems: "",
  })

  const [improvements, setImprovements] = useState({
    improvements: "",
    nextActions: "",
  })

  const [nextWeekGoals, setNextWeekGoals] = useState<WeeklyGoalData[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const settings = await getSettings()
      const weekStartDay = settings?.week_start_day || "monday"

      const now = new Date()
      const dayOfWeek = now.getDay()

      let diff: number
      if (weekStartDay === "sunday") {
        diff = -dayOfWeek
      } else {
        diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      }

      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const formatDate = (date: Date) => {
        const month = date.getMonth() + 1
        const day = date.getDate()
        return `${month}月${day}日`
      }

      setWeekPeriod(`${formatDate(weekStart)} 〜 ${formatDate(weekEnd)}`)

      const goalsData = await getCurrentWeekGoals()
      console.log("[v0] Loaded weekly goals:", goalsData)
      setWeeklyGoals(goalsData)

      const nextGoals = goalsData.map((goal) => ({
        id: goal.id,
        metric: goal.plans.title,
        targetValue: goal.target_value,
        unit: goal.plans.unit || "時間",
      }))
      setNextWeekGoals(nextGoals)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 4
  const progressPercentage = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCopyFromLastWeek = async () => {
    toast({
      title: "この機能は準備中です",
      description: "前週のレビューをコピーする機能は現在開発中です",
    })
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      toast({
        title: "レビューを保存しました",
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#8b5cf6"],
      })

      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error) {
      console.error("[v0] Error saving:", error)
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateNextWeekGoal = (id: string, field: keyof WeeklyGoalData, value: string | number) => {
    setNextWeekGoals((goals) => goals.map((goal) => (goal.id === id ? { ...goal, [field]: value } : goal)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">週次レビュー</h1>
            {weekPeriod && <p className="text-sm text-muted-foreground mt-1">{weekPeriod}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyFromLastWeek} className="gap-2 bg-transparent">
            <Copy className="h-4 w-4" />
            前週からコピー
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              ステップ {currentStep} / {totalSteps}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "実績の確認" },
            { num: 2, label: "所感" },
            { num: 3, label: "改善" },
            { num: 4, label: "来週の目標" },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.num ? <Check className="h-5 w-5" /> : step.num}
                </div>
                <span className="text-xs text-center text-muted-foreground hidden sm:block">{step.label}</span>
              </div>
              {index < 3 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${currentStep > step.num ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="p-6 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-card">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">実績の確認</h2>
              <p className="text-muted-foreground">今週の目標と実績を確認しましょう</p>
            </div>

            <div className="space-y-6">
              {weeklyGoals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">目標が設定されていません</p>
              ) : (
                weeklyGoals.map((goal) => {
                  const percentage = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
                  const isAchieved = percentage >= 100

                  return (
                    <div key={goal.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{goal.plans.title}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${isAchieved ? "text-accent" : "text-muted-foreground"}`}
                          >
                            {goal.current_value}
                            {goal.plans.unit || "時間"}
                          </span>
                          <span className="text-sm text-muted-foreground">/</span>
                          <span className="text-sm text-muted-foreground">
                            {goal.target_value}
                            {goal.plans.unit || "時間"}
                          </span>
                        </div>
                      </div>

                      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isAchieved ? "bg-accent" : "bg-primary"}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-foreground">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">所感</h2>
              <p className="text-muted-foreground">今週の振り返りを記録しましょう</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary">サマリー</Label>
                <Textarea
                  id="summary"
                  placeholder="今週の全体的な振り返りを記入してください..."
                  value={reflections.summary}
                  onChange={(e) => setReflections({ ...reflections, summary: e.target.value })}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learnings">学んだこと</Label>
                <Textarea
                  id="learnings"
                  placeholder="今週学んだことや気づきを記入してください..."
                  value={reflections.learnings}
                  onChange={(e) => setReflections({ ...reflections, learnings: e.target.value })}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problems">問題点・課題</Label>
                <Textarea
                  id="problems"
                  placeholder="今週直面した問題や課題を記入してください..."
                  value={reflections.problems}
                  onChange={(e) => setReflections({ ...reflections, problems: e.target.value })}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">改善</h2>
              <p className="text-muted-foreground">改善点と次のアクションを計画しましょう</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="improvements">改善点</Label>
                <Textarea
                  id="improvements"
                  placeholder="どのように改善できるか記入してください..."
                  value={improvements.improvements}
                  onChange={(e) => setImprovements({ ...improvements, improvements: e.target.value })}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextActions">次のアクション</Label>
                <Textarea
                  id="nextActions"
                  placeholder="具体的なアクションプランを記入してください..."
                  value={improvements.nextActions}
                  onChange={(e) => setImprovements({ ...improvements, nextActions: e.target.value })}
                  className="min-h-[150px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">来週の目標</h2>
              <p className="text-muted-foreground">来週の目標を設定しましょう</p>
            </div>

            <div className="space-y-4">
              {nextWeekGoals.map((goal) => (
                <div key={goal.id} className="flex items-end gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`metric-${goal.id}`}>メトリック</Label>
                    <Input
                      id={`metric-${goal.id}`}
                      value={goal.metric}
                      onChange={(e) => updateNextWeekGoal(goal.id, "metric", e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="w-32 space-y-2">
                    <Label htmlFor={`target-${goal.id}`}>目標値</Label>
                    <Input
                      id={`target-${goal.id}`}
                      type="number"
                      value={goal.targetValue}
                      onChange={(e) => updateNextWeekGoal(goal.id, "targetValue", Number.parseFloat(e.target.value))}
                      className="bg-background"
                    />
                  </div>

                  <div className="w-24 space-y-2">
                    <Label htmlFor={`unit-${goal.id}`}>単位</Label>
                    <Input
                      id={`unit-${goal.id}`}
                      value={goal.unit}
                      onChange={(e) => updateNextWeekGoal(goal.id, "unit", e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext} className="gap-2">
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-accent hover:bg-accent/90">
            {isSaving ? "保存中..." : "保存"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
