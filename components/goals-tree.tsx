"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronRight, ChevronDown, GripVertical, Target, TrendingUp, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Goal } from "@/app/actions/goals"
import { updateGoal } from "@/app/actions/goals"

interface GoalsTreeProps {
  goals: Goal[]
  selectedGoalId?: string | null
  onSelectGoal?: (id: string) => void
}

type DropPosition = "before" | "after" | "inside"

interface DropIndicator {
  goalId: string
  position: DropPosition
}

export function GoalsTree({
  goals: initialGoals,
  selectedGoalId: initialSelectedGoalId,
  onSelectGoal,
}: GoalsTreeProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialSelectedGoalId || null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initialGoals.map((g) => g.id)))
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  const handleSelectGoal = (id: string) => {
    setSelectedGoalId(id)
    if (onSelectGoal) {
      onSelectGoal(id)
    }
  }

  const buildTree = (goals: Goal[]): (Goal & { children?: Goal[] })[] => {
    const goalMap = new Map<string, Goal & { children?: Goal[] }>()
    const rootGoals: (Goal & { children?: Goal[] })[] = []

    goals.forEach((goal) => {
      goalMap.set(goal.id, { ...goal, children: [] })
    })

    goals.forEach((goal) => {
      const node = goalMap.get(goal.id)!
      if (goal.parent_id) {
        const parent = goalMap.get(goal.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        } else {
          rootGoals.push(node)
        }
      } else {
        rootGoals.push(node)
      }
    })

    const sortByDisplayOrder = (nodes: (Goal & { children?: Goal[] })[]) => {
      nodes.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortByDisplayOrder(node.children)
        }
      })
    }

    sortByDisplayOrder(rootGoals)
    return rootGoals
  }

  const treeData = buildTree(goals)

  const getIcon = (goal: Goal) => {
    if (goal.status === "completed") {
      return <Target className="h-4 w-4" />
    }
    if (goal.progress > 50) {
      return <TrendingUp className="h-4 w-4" />
    }
    return <BookOpen className="h-4 w-4" />
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, goalId: string) => {
    e.stopPropagation()
    setDraggedGoalId(goalId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", goalId)
  }

  const handleDragOver = (e: React.DragEvent, goalId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedGoalId === goalId) {
      setDropIndicator(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height

    let position: DropPosition
    if (y < height * 0.25) {
      position = "before"
    } else if (y > height * 0.75) {
      position = "after"
    } else {
      position = "inside"
    }

    setDropIndicator({ goalId, position })
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return
    }
    setDropIndicator(null)
  }

  const handleDrop = async (e: React.DragEvent, targetGoalId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedGoalId || !dropIndicator) {
      setDraggedGoalId(null)
      setDropIndicator(null)
      return
    }

    const isDescendant = (parentId: string, childId: string): boolean => {
      const goal = goals.find((g) => g.id === childId)
      if (!goal) return false
      if (goal.parent_id === parentId) return true
      if (goal.parent_id) return isDescendant(parentId, goal.parent_id)
      return false
    }

    const targetGoal = goals.find((g) => g.id === targetGoalId)
    if (!targetGoal) {
      setDraggedGoalId(null)
      setDropIndicator(null)
      return
    }

    const previousGoals = [...goals]
    let newParentId: string | null
    let newDisplayOrder: number

    try {
      if (dropIndicator.position === "inside") {
        if (isDescendant(draggedGoalId, targetGoalId)) {
          alert("親ゴールを子ゴールの下に移動することはできません")
          setDraggedGoalId(null)
          setDropIndicator(null)
          return
        }

        const siblings = goals.filter((g) => g.parent_id === targetGoalId)
        const maxOrder = siblings.length > 0 ? Math.max(...siblings.map((g) => g.display_order ?? 0)) : -1
        newParentId = targetGoalId
        newDisplayOrder = maxOrder + 1
      } else if (dropIndicator.position === "before") {
        newParentId = targetGoal.parent_id
        newDisplayOrder = (targetGoal.display_order ?? 0) - 0.5
      } else {
        newParentId = targetGoal.parent_id
        newDisplayOrder = (targetGoal.display_order ?? 0) + 0.5
      }

      // ローカル状態を即座に更新
      setGoals((prevGoals) =>
        prevGoals.map((g) =>
          g.id === draggedGoalId ? { ...g, parent_id: newParentId, display_order: newDisplayOrder } : g,
        ),
      )

      // バックグラウンドでデータベースを更新
      await updateGoal(draggedGoalId, {
        parent_id: newParentId,
        display_order: newDisplayOrder,
      })
    } catch (error) {
      console.error("階層の更新に失敗しました:", error)
      // エラーが発生した場合は元の状態に戻す
      setGoals(previousGoals)
      alert("階層の更新に失敗しました。もう一度お試しください。")
    } finally {
      setDraggedGoalId(null)
      setDropIndicator(null)
    }
  }

  const handleDropAsRoot = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedGoalId) return

    const previousGoals = [...goals]

    try {
      const rootGoals = goals.filter((g) => !g.parent_id)
      const maxOrder = rootGoals.length > 0 ? Math.max(...rootGoals.map((g) => g.display_order ?? 0)) : -1
      const newDisplayOrder = maxOrder + 1

      // ローカル状態を即座に更新
      setGoals((prevGoals) =>
        prevGoals.map((g) => (g.id === draggedGoalId ? { ...g, parent_id: null, display_order: newDisplayOrder } : g)),
      )

      // バックグラウンドでデータベースを更新
      await updateGoal(draggedGoalId, {
        parent_id: null,
        display_order: newDisplayOrder,
      })
    } catch (error) {
      console.error("階層の更新に失敗しました:", error)
      // エラーが発生した場合は元の状態に戻す
      setGoals(previousGoals)
      alert("階層の更新に失敗しました。もう一度お試しください。")
    } finally {
      setDraggedGoalId(null)
      setDropIndicator(null)
    }
  }

  const renderGoal = (goal: Goal & { children?: Goal[] }, level = 0) => {
    const hasChildren = goal.children && goal.children.length > 0
    const isExpanded = expandedIds.has(goal.id)
    const isSelected = selectedGoalId === goal.id
    const isDragging = draggedGoalId === goal.id
    const showDropBefore = dropIndicator?.goalId === goal.id && dropIndicator.position === "before"
    const showDropAfter = dropIndicator?.goalId === goal.id && dropIndicator.position === "after"
    const showDropInside = dropIndicator?.goalId === goal.id && dropIndicator.position === "inside"

    return (
      <div key={goal.id} className="relative">
        {showDropBefore && (
          <div
            className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10"
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative",
            "hover:bg-accent/50",
            isSelected && "bg-primary/10 hover:bg-primary/15",
            isDragging && "opacity-30",
            showDropInside && "bg-primary/20 ring-2 ring-primary ring-inset",
            level > 0 && "ml-6",
          )}
          onClick={() => handleSelectGoal(goal.id)}
          onDragOver={(e) => handleDragOver(e, goal.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, goal.id)}
        >
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, goal.id)}
            className="cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </div>

          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(goal.id)
              }}
              className="p-0.5 hover:bg-accent rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div
            className={cn(
              "p-1.5 rounded-lg",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {getIcon(goal)}
          </div>

          <span className={cn("text-sm font-medium flex-1", isSelected ? "text-foreground" : "text-foreground/90")}>
            {goal.title}
          </span>

          <span className="text-xs text-muted-foreground">{goal.progress}%</span>
        </div>

        {showDropAfter && (
          <div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10"
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full" />
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1">{goal.children!.map((child) => renderGoal(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <Card
      className="p-4 rounded-2xl bg-card border-border shadow-sm"
      onDragOver={(e) => {
        e.preventDefault()
        if (draggedGoalId) {
          setDropIndicator(null)
        }
      }}
      onDrop={handleDropAsRoot}
    >
      <h3 className="text-lg font-semibold mb-4 text-foreground">ゴールツリー</h3>
      {treeData.length > 0 ? (
        <div className="space-y-1">{treeData.map((goal) => renderGoal(goal))}</div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          ゴールがありません。新規ゴールを作成してください。
        </div>
      )}
    </Card>
  )
}
