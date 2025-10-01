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
import { getSupabase, getWeekStartDate, type WeeklyProgress, type WeeklyTarget } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type WeeklyGoal = {
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

  const [metrics, setMetrics] = useState<WeeklyProgress[]>([])

  const [reflections, setReflections] = useState({
    summary: "",
    learnings: "",
    problems: "",
  })

  const [improvements, setImprovements] = useState({
    improvements: "",
    nextActions: "",
  })

  const [nextWeekGoals, setNextWeekGoals] = useState<WeeklyGoal[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()

      // 週次進捗を取得
      const { data: progressData, error: progressError } = await supabase.rpc("get_weekly_progress", {
        p_week_start_date: weekStart,
      })

      if (progressError) {
        console.error("[v0] Error loading progress:", progressError)
      } else {
        setMetrics(progressData || [])
      }

      // 今週の目標を取得して来週の目標の初期値とする
      const { data: targetsData, error: targetsError } = await supabase
        .from("weekly_targets")
        .select("*")
        .eq("week_start_date", weekStart)

      if (targetsError) {
        console.error("[v0] Error loading targets:", targetsError)
      } else {
        const goals = (targetsData || []).map((t: WeeklyTarget) => ({
          id: t.id,
          metric: t.metric_name,
          targetValue: t.target_value,
          unit: t.unit,
        }))
        setNextWeekGoals(goals)
      }

      // 前週のレビューを取得
      const lastWeekStart = new Date(weekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekStartStr = lastWeekStart.toISOString().split("T")[0]

      const { data: reviewData, error: reviewError } = await supabase
        .from("weekly_reviews")
        .select("*")
        .eq("week_start_date", lastWeekStartStr)
        .single()

      if (!reviewError && reviewData) {
        // 前週のレビューがあれば、改善点を次のアクションとして表示
        setImprovements({
          improvements: reviewData.improvements || "",
          nextActions: "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
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
    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()
      const lastWeekStart = new Date(weekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekStartStr = lastWeekStart.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("weekly_reviews")
        .select("*")
        .eq("week_start_date", lastWeekStartStr)
        .single()

      if (error) {
        toast({
          title: "前週のレビューが見つかりません",
          variant: "destructive",
        })
        return
      }

      setReflections({
        summary: data.summary || "",
        learnings: data.learnings || "",
        problems: data.problems || "",
      })
      setImprovements({
        improvements: data.improvements || "",
        nextActions: "",
      })

      toast({
        title: "前週のレビューをコピーしました",
      })
    } catch (error) {
      console.error("[v0] Error copying from last week:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()

      // 週次レビューを保存
      const { error: reviewError } = await supabase.from("weekly_reviews").insert({
        week_start_date: weekStart,
        summary: reflections.summary || null,
        learnings: reflections.learnings || null,
        problems: reflections.problems || null,
        improvements: improvements.improvements || null,
      })

      if (reviewError) {
        console.error("[v0] Error saving review:", reviewError)
        toast({
          title: "エラー",
          description: "レビューの保存に失敗しました",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // 来週の目標を保存
      const nextWeekStart = new Date(weekStart)
      nextWeekStart.setDate(nextWeekStart.getDate() + 7)
      const nextWeekStartStr = nextWeekStart.toISOString().split("T")[0]

      const targetsToInsert = nextWeekGoals.map((goal) => ({
        week_start_date: nextWeekStartStr,
        metric_name: goal.metric,
        target_value: goal.targetValue,
        unit: goal.unit,
      }))

      const { error: targetsError } = await supabase.from("weekly_targets").insert(targetsToInsert)

      if (targetsError) {
        console.error("[v0] Error saving targets:", targetsError)
        toast({
          title: "警告",
          description: "来週の目標の保存に失敗しました",
          variant: "destructive",
        })
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#10b981", "#3b82f6", "#8b5cf6"],
      })

      toast({
        title: "レビューを保存しました",
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

  const updateNextWeekGoal = (id: string, field: keyof WeeklyGoal, value: string | number) => {
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
          <h1 className="text-3xl font-bold text-foreground">週次レビュー</h1>
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

      <Card className="p-6 rounded-2xl border-border bg-card">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">実績の確認</h2>
              <p className="text-muted-foreground">今週の目標と実績を確認しましょう</p>
            </div>

            <div className="space-y-6">
              {metrics.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">目標が設定されていません</p>
              ) : (
                metrics.map((metric, index) => {
                  const percentage = metric.achievement_rate
                  const isAchieved = percentage >= 100

                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{metric.metric_name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${isAchieved ? "text-accent" : "text-muted-foreground"}`}
                          >
                            {metric.actual_value}
                            {metric.unit}
                          </span>
                          <span className="text-sm text-muted-foreground">/</span>
                          <span className="text-sm text-muted-foreground">
                            {metric.target_value}
                            {metric.unit}
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
