"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Edit2, Trash2, History, Target, CheckCircle2, Pause, Play } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useState, useEffect } from "react"
import {
  type Goal,
  type Plan,
  type GoalLog,
  type GoalWeeklyTarget,
  type GoalReview,
  type PlanHistory,
  type WeeklyGoal,
  getGoal,
  getPlans,
  getPlanHistory,
  updateGoal,
  createPlan,
  updatePlan,
  deletePlan,
  createWeeklyGoal,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  deleteGoal,
  getGoalDeletionInfo,
} from "@/app/actions/goals"

interface GoalDetailProps {
  goalId?: string | null
}

export function GoalDetail({ goalId }: GoalDetailProps) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [logs, setLogs] = useState<GoalLog[]>([])
  const [weeklyTargets, setWeeklyTargets] = useState<GoalWeeklyTarget[]>([])
  const [reviews, setReviews] = useState<GoalReview[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<(WeeklyGoal & { plans: Plan })[]>([])
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editGoalTitle, setEditGoalTitle] = useState("")
  const [editGoalDescription, setEditGoalDescription] = useState("")
  const [editGoalTargetDate, setEditGoalTargetDate] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)

  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false)
  const [newPlanTitle, setNewPlanTitle] = useState("")
  const [newPlanTargetValue, setNewPlanTargetValue] = useState("")
  const [newPlanUnit, setNewPlanUnit] = useState("")
  const [newPlanDueDate, setNewPlanDueDate] = useState("")
  const [newPlanPriority, setNewPlanPriority] = useState<"low" | "medium" | "high">("medium")

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false)
  const [editPlanTitle, setEditPlanTitle] = useState("")
  const [editPlanTargetValue, setEditPlanTargetValue] = useState("")
  const [editPlanCurrentValue, setEditPlanCurrentValue] = useState("")
  const [editPlanUnit, setEditPlanUnit] = useState("")
  const [editPlanDueDate, setEditPlanDueDate] = useState("")
  const [editPlanPriority, setEditPlanPriority] = useState<"low" | "medium" | "high">("medium")

  const [viewingPlanHistory, setViewingPlanHistory] = useState<Plan | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [planHistory, setPlanHistory] = useState<PlanHistory[]>([])

  const [isAddWeeklyGoalOpen, setIsAddWeeklyGoalOpen] = useState(false)
  const [selectedPlanForWeekly, setSelectedPlanForWeekly] = useState<Plan | null>(null)
  const [weeklyGoalValue, setWeeklyGoalValue] = useState("")
  const [weeklyGoalNotes, setWeeklyGoalNotes] = useState("")

  const [isDeleteGoalOpen, setIsDeleteGoalOpen] = useState(false)
  const [deletionInfo, setDeletionInfo] = useState<{
    plansCount: number
    weeklyGoalsCount: number
    recordsCount: number
  } | null>(null)

  useEffect(() => {
    if (!goalId) {
      setLoading(false)
      return
    }

    const loadGoalData = async () => {
      try {
        setLoading(true)
        const [goalData, plansData] = await Promise.all([getGoal(goalId), getPlans(goalId)])

        setGoal(goalData)
        setTitle(goalData.title)
        setDescription(goalData.description || "")
        setPlans(plansData)
      } catch (error) {
        console.error("Failed to load goal data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGoalData()
  }, [goalId])

  const openEditGoalDialog = () => {
    if (!goal) return
    setEditGoalTitle(goal.title)
    setEditGoalDescription(goal.description || "")
    setEditGoalTargetDate(goal.target_date || "")
    setIsEditingGoal(true)
  }

  const handleUpdateGoal = async () => {
    if (!goalId || !editGoalTitle.trim()) return
    try {
      const updatedGoal = await updateGoal(goalId, {
        title: editGoalTitle,
        description: editGoalDescription,
        target_date: editGoalTargetDate || null,
      })
      setGoal(updatedGoal)
      setTitle(updatedGoal.title)
      setDescription(updatedGoal.description || "")
      setIsEditingGoal(false)
    } catch (error) {
      console.error("Failed to update goal:", error)
      alert("ゴールの更新に失敗しました")
    }
  }

  const handleTitleUpdate = async () => {
    if (!goalId || !title.trim()) return
    try {
      await updateGoal(goalId, { title })
      setIsEditingTitle(false)
    } catch (error) {
      console.error("Failed to update title:", error)
    }
  }

  const handleDescriptionUpdate = async () => {
    if (!goalId) return
    try {
      await updateGoal(goalId, { description })
    } catch (error) {
      console.error("Failed to update description:", error)
    }
  }

  const resetPlanForm = () => {
    setNewPlanTitle("")
    setNewPlanTargetValue("")
    setNewPlanUnit("")
    setNewPlanDueDate("")
    setNewPlanPriority("medium")
  }

  const handleCreatePlan = async () => {
    if (!newPlanTitle.trim()) return

    try {
      const newPlan = await createPlan({
        goal_id: goalId,
        title: newPlanTitle,
        priority: newPlanPriority,
        due_date: newPlanDueDate || undefined,
        target_value: newPlanTargetValue ? Number.parseFloat(newPlanTargetValue) : undefined,
        current_value: 0,
        unit: newPlanUnit || undefined,
      })
      setPlans([newPlan, ...plans])
      resetPlanForm()
      setIsAddPlanOpen(false)
    } catch (error) {
      console.error("Failed to create plan:", error)
    }
  }

  const openEditPlanDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setEditPlanTitle(plan.title)
    setEditPlanTargetValue(plan.target_value?.toString() || "")
    setEditPlanCurrentValue(plan.current_value?.toString() || "")
    setEditPlanUnit(plan.unit || "")
    setEditPlanDueDate(plan.due_date || "")
    setEditPlanPriority(plan.priority)
    setIsEditPlanOpen(true)
  }

  const resetEditPlanForm = () => {
    setEditingPlan(null)
    setEditPlanTitle("")
    setEditPlanTargetValue("")
    setEditPlanCurrentValue("")
    setEditPlanUnit("")
    setEditPlanDueDate("")
    setEditPlanPriority("medium")
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan || !editPlanTitle.trim()) return

    try {
      const updatedPlan = await updatePlan(editingPlan.id, {
        title: editPlanTitle,
        priority: editPlanPriority,
        due_date: editPlanDueDate || null,
        target_value: editPlanTargetValue ? Number.parseFloat(editPlanTargetValue) : null,
        current_value: editPlanCurrentValue ? Number.parseFloat(editPlanCurrentValue) : null,
        unit: editPlanUnit || null,
      })
      setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)))
      resetEditPlanForm()
      setIsEditPlanOpen(false)
    } catch (error) {
      console.error("Failed to update plan:", error)
    }
  }

  const openPlanHistory = async (plan: Plan) => {
    setViewingPlanHistory(plan)
    setIsHistoryOpen(true)
    try {
      const history = await getPlanHistory(plan.id)
      setPlanHistory(history)
    } catch (error) {
      console.error("Failed to load plan history:", error)
      setPlanHistory([])
    }
  }

  const openAddWeeklyGoalDialog = (plan: Plan) => {
    setSelectedPlanForWeekly(plan)
    setWeeklyGoalValue("")
    setWeeklyGoalNotes("")
    setIsAddWeeklyGoalOpen(true)
  }

  const handleCreateWeeklyGoal = async () => {
    if (!selectedPlanForWeekly || !weeklyGoalValue.trim()) return

    console.log("[v0] handleCreateWeeklyGoal called")
    console.log("[v0] Selected plan:", selectedPlanForWeekly)
    console.log("[v0] Weekly goal value:", weeklyGoalValue)

    try {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diff)
      monday.setHours(0, 0, 0, 0)
      const weekStart = monday.toISOString().split("T")[0]

      console.log("[v0] Week start date:", weekStart)

      await createWeeklyGoal({
        plan_id: selectedPlanForWeekly.id,
        week_start_date: weekStart,
        target_value: Number.parseFloat(weeklyGoalValue),
        notes: weeklyGoalNotes || undefined,
      })

      console.log("[v0] Weekly goal created successfully")

      setIsAddWeeklyGoalOpen(false)
      setSelectedPlanForWeekly(null)
      setWeeklyGoalValue("")
      setWeeklyGoalNotes("")

      window.location.reload()
    } catch (error) {
      console.error("[v0] Failed to create weekly goal:", error)
      alert(`今週の目標の追加に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  const handleUpdateWeeklyGoalProgress = async (weeklyGoalId: string, newValue: number) => {
    try {
      const updatedGoal = await updateWeeklyGoal(weeklyGoalId, {
        current_value: newValue,
      })

      setWeeklyGoals(weeklyGoals.map((wg) => (wg.id === weeklyGoalId ? { ...wg, current_value: newValue } : wg)))
    } catch (error) {
      console.error("Failed to update weekly goal progress:", error)
      alert("進捗の更新に失敗しました")
    }
  }

  const handleDeleteWeeklyGoal = async (weeklyGoalId: string) => {
    if (!confirm("この週次目標を削除しますか？")) return

    try {
      await deleteWeeklyGoal(weeklyGoalId)
      setWeeklyGoals(weeklyGoals.filter((wg) => wg.id !== weeklyGoalId))
    } catch (error) {
      console.error("Failed to delete weekly goal:", error)
      alert("週次目標の削除に失敗しました")
    }
  }

  const openDeleteGoalDialog = async () => {
    if (!goalId) return
    try {
      const info = await getGoalDeletionInfo(goalId)
      setDeletionInfo(info)
      setIsDeleteGoalOpen(true)
    } catch (error) {
      console.error("Failed to get deletion info:", error)
      alert("削除情報の取得に失敗しました")
    }
  }

  const handleDeleteGoal = async () => {
    if (!goalId) return
    try {
      await deleteGoal(goalId)
      setIsDeleteGoalOpen(false)
      window.location.href = "/"
    } catch (error) {
      console.error("Failed to delete goal:", error)
      alert("ゴールの削除に失敗しました")
    }
  }

  const handleUpdateGoalStatus = async (newStatus: "active" | "completed" | "archived") => {
    if (!goalId) return
    try {
      const updatedGoal = await updateGoal(goalId, { status: newStatus })
      setGoal(updatedGoal)
    } catch (error) {
      console.error("Failed to update goal status:", error)
      alert(`ステータスの更新に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  if (!goalId) {
    return (
      <Card className="p-6 rounded-2xl bg-card border-border shadow-sm">
        <div className="text-center py-12 text-muted-foreground">ゴールを選択してください</div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="p-6 rounded-2xl bg-card border-border shadow-sm">
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      </Card>
    )
  }

  if (!goal) {
    return (
      <Card className="p-6 rounded-2xl bg-card border-border shadow-sm">
        <div className="text-center py-12 text-muted-foreground">ゴールが見つかりません</div>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-accent/10 text-accent-foreground border-accent/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "進行中"
      case "completed":
        return "完了"
      case "archived":
        return "一時休止"
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return priority
    }
  }

  return (
    <Card className="p-6 rounded-2xl bg-card border-border shadow-sm">
      <div className="space-y-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleUpdate}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleUpdate()
              }}
              className="text-2xl font-bold h-auto py-2"
              autoFocus
            />
          ) : (
            <h2
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h2>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={openEditGoalDialog}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openDeleteGoalDialog}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionUpdate}
          className="min-h-[80px] resize-none"
          placeholder="ゴールの説明を入力..."
        />

        {/* Status buttons */}
        <div className="flex flex-wrap gap-2">
          {goal.status === "active" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                onClick={() => handleUpdateGoalStatus("completed")}
              >
                <CheckCircle2 className="h-4 w-4" />
                達成にする
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => handleUpdateGoalStatus("archived")}
              >
                <Pause className="h-4 w-4" />
                一時休止にする
              </Button>
            </>
          )}
          {goal.status === "archived" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
              onClick={() => handleUpdateGoalStatus("active")}
            >
              <Play className="h-4 w-4" />
              再開する
            </Button>
          )}
          {goal.status === "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => handleUpdateGoalStatus("active")}
            >
              <Play className="h-4 w-4" />
              進行中に戻す
            </Button>
          )}
          <Badge
            variant="secondary"
            className={cn(
              "self-center",
              goal.status === "completed" && "bg-accent/20 text-accent border-accent/20",
              goal.status === "archived" && "bg-muted text-muted-foreground border-border",
            )}
          >
            {getStatusLabel(goal.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {goal.target_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>期限: {goal.target_date}</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ゴールを編集</DialogTitle>
            <DialogDescription>ゴールの情報を更新します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-title">タイトル</Label>
              <Input
                id="edit-goal-title"
                value={editGoalTitle}
                onChange={(e) => setEditGoalTitle(e.target.value)}
                placeholder="ゴールのタイトル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-goal-description">説明</Label>
              <Textarea
                id="edit-goal-description"
                value={editGoalDescription}
                onChange={(e) => setEditGoalDescription(e.target.value)}
                placeholder="ゴールの説明"
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-goal-target-date">期日</Label>
              <Input
                id="edit-goal-target-date"
                type="date"
                value={editGoalTargetDate}
                onChange={(e) => setEditGoalTargetDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingGoal(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateGoal}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <div className="flex justify-end mb-2">
          <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                プラン追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新規プラン</DialogTitle>
                <DialogDescription>このゴールに関連するプランを追加します</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-title">タイトル</Label>
                  <Input
                    id="plan-title"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="例: TOEIC模試を解く"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        handleCreatePlan()
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-target-value">目標値</Label>
                    <Input
                      id="plan-target-value"
                      type="number"
                      step="0.01"
                      value={newPlanTargetValue}
                      onChange={(e) => setNewPlanTargetValue(e.target.value)}
                      placeholder="例: 900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-unit">単位</Label>
                    <Input
                      id="plan-unit"
                      value={newPlanUnit}
                      onChange={(e) => setNewPlanUnit(e.target.value)}
                      placeholder="例: 点"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-due-date">期日</Label>
                  <Input
                    id="plan-due-date"
                    type="date"
                    value={newPlanDueDate}
                    onChange={(e) => setNewPlanDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-priority">優先度</Label>
                  <Select
                    value={newPlanPriority}
                    onValueChange={(value: "low" | "medium" | "high") => setNewPlanPriority(value)}
                  >
                    <SelectTrigger id="plan-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePlan}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {plans.length > 0 ? (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Badge className={cn("rounded-full", getPriorityColor(plan.priority))}>
                    {getPriorityLabel(plan.priority)}
                  </Badge>
                  <span className="text-sm font-medium">{plan.title}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {plan.target_value && plan.unit && (
                    <span>
                      目標: {plan.current_value || 0} / {plan.target_value} {plan.unit}
                    </span>
                  )}
                  {plan.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      期日: {plan.due_date}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openAddWeeklyGoalDialog(plan)}
                  title="今週の目標に追加"
                >
                  <Target className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openPlanHistory(plan)}
                  title="編集履歴を表示"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPlanDialog(plan)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={async () => {
                    try {
                      await deletePlan(plan.id)
                      setPlans(plans.filter((p) => p.id !== plan.id))
                    } catch (error) {
                      console.error("Failed to delete plan:", error)
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">プランがありません</div>
        )}
      </div>

      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>プランを編集</DialogTitle>
            <DialogDescription>プランの内容を更新します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan-title">タイトル</Label>
              <Input
                id="edit-plan-title"
                value={editPlanTitle}
                onChange={(e) => setEditPlanTitle(e.target.value)}
                placeholder="例: TOEIC模試を解く"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plan-target-value">目標値</Label>
                <Input
                  id="edit-plan-target-value"
                  type="number"
                  step="0.01"
                  value={editPlanTargetValue}
                  onChange={(e) => setEditPlanTargetValue(e.target.value)}
                  placeholder="例: 900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plan-current-value">現在値</Label>
                <Input
                  id="edit-plan-current-value"
                  type="number"
                  step="0.01"
                  value={editPlanCurrentValue}
                  onChange={(e) => setEditPlanCurrentValue(e.target.value)}
                  placeholder="例: 750"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan-unit">単位</Label>
              <Input
                id="edit-plan-unit"
                value={editPlanUnit}
                onChange={(e) => setEditPlanUnit(e.target.value)}
                placeholder="例: 点"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan-due-date">期日</Label>
              <Input
                id="edit-plan-due-date"
                type="date"
                value={editPlanDueDate}
                onChange={(e) => setEditPlanDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan-priority">優先度</Label>
              <Select
                value={editPlanPriority}
                onValueChange={(value: "low" | "medium" | "high") => setEditPlanPriority(value)}
              >
                <SelectTrigger id="edit-plan-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdatePlan}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編集履歴</DialogTitle>
            <DialogDescription>{viewingPlanHistory?.title}の編集履歴</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {planHistory.length > 0 ? (
              planHistory.map((history) => (
                <div key={history.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{history.change_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(history.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  {history.field_name && (
                    <div className="text-sm">
                      <span className="font-medium">{history.field_name}</span>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-muted-foreground line-through">{history.old_value || "なし"}</span>
                        <span>→</span>
                        <span className="text-foreground font-medium">{history.new_value || "なし"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">編集履歴がありません</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddWeeklyGoalOpen} onOpenChange={setIsAddWeeklyGoalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>今週の目標に追加</DialogTitle>
            <DialogDescription>{selectedPlanForWeekly?.title}の今週の目標値を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-goal-value">今週の目標値</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="weekly-goal-value"
                  type="number"
                  step="0.01"
                  value={weeklyGoalValue}
                  onChange={(e) => setWeeklyGoalValue(e.target.value)}
                  placeholder={`例: ${selectedPlanForWeekly?.target_value ? Math.floor(selectedPlanForWeekly.target_value / 10) : "10"}`}
                  className="flex-1"
                />
                {selectedPlanForWeekly?.unit && (
                  <span className="text-sm text-muted-foreground">{selectedPlanForWeekly.unit}</span>
                )}
              </div>
              {selectedPlanForWeekly?.target_value && (
                <p className="text-xs text-muted-foreground">
                  全体目標: {selectedPlanForWeekly.target_value} {selectedPlanForWeekly.unit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-goal-notes">メモ（任意）</Label>
              <Textarea
                id="weekly-goal-notes"
                value={weeklyGoalNotes}
                onChange={(e) => setWeeklyGoalNotes(e.target.value)}
                placeholder="今週の目標についてのメモ..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWeeklyGoalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateWeeklyGoal}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteGoalOpen} onOpenChange={setIsDeleteGoalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">ゴールを削除</DialogTitle>
            <DialogDescription>
              このゴールを削除すると、関連するすべてのデータも削除されます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          {deletionInfo && (
            <div className="py-4 space-y-2">
              <p className="text-sm font-medium">削除されるデータ:</p>
              <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                <li>• プラン: {deletionInfo.plansCount}件</li>
                <li>• 週次目標: {deletionInfo.weeklyGoalsCount}件</li>
                <li>• 記録: {deletionInfo.recordsCount}件</li>
              </ul>
              <p className="text-sm text-destructive font-medium pt-2">本当に削除しますか？</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteGoalOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
