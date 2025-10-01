"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronRight, ChevronDown, GripVertical, Target, TrendingUp, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface Goal {
  id: string
  title: string
  icon: "target" | "trending" | "book"
  children?: Goal[]
}

const mockGoals: Goal[] = [
  {
    id: "goal-1",
    title: "キャリア成長",
    icon: "trending",
    children: [
      { id: "goal-1-1", title: "プログラミングスキル向上", icon: "target" },
      { id: "goal-1-2", title: "英語力強化", icon: "book" },
    ],
  },
  {
    id: "goal-2",
    title: "健康管理",
    icon: "target",
    children: [{ id: "goal-2-1", title: "週3回の運動", icon: "target" }],
  },
  {
    id: "goal-3",
    title: "資産形成",
    icon: "trending",
  },
]

interface GoalsTreeProps {
  selectedGoalId: string | null
  onSelectGoal: (id: string) => void
}

export function GoalsTree({ selectedGoalId, onSelectGoal }: GoalsTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["goal-1", "goal-2"]))

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "trending":
        return <TrendingUp className="h-4 w-4" />
      case "book":
        return <BookOpen className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const renderGoal = (goal: Goal, level = 0) => {
    const hasChildren = goal.children && goal.children.length > 0
    const isExpanded = expandedIds.has(goal.id)
    const isSelected = selectedGoalId === goal.id

    return (
      <div key={goal.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group",
            "hover:bg-accent/50",
            isSelected && "bg-primary/10 hover:bg-primary/15",
            level > 0 && "ml-6",
          )}
          onClick={() => onSelectGoal(goal.id)}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

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
            {getIcon(goal.icon)}
          </div>

          <span className={cn("text-sm font-medium flex-1", isSelected ? "text-foreground" : "text-foreground/90")}>
            {goal.title}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{goal.children!.map((child) => renderGoal(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4 rounded-2xl bg-card border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground">ゴールツリー</h3>
      <div className="space-y-1">{mockGoals.map((goal) => renderGoal(goal))}</div>
    </Card>
  )
}
