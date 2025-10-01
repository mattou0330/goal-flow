"use client"

import { cn } from "@/lib/utils"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar, Tag, CheckCircle2, Plus, Edit2, Trash2 } from "lucide-react"
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
import { useState } from "react"

interface GoalDetailProps {
  goalId: string
}

const mockGoalData = {
  "goal-1": {
    title: "キャリア成長",
    description: "技術力とビジネススキルを向上させ、シニアエンジニアを目指す",
    dueDate: "2025-12-31",
    status: "進行中",
    tags: ["キャリア", "スキルアップ"],
  },
  "goal-1-1": {
    title: "プログラミングスキル向上",
    description: "React、TypeScript、Next.jsの深い理解と実践的なスキルを身につける",
    dueDate: "2025-06-30",
    status: "進行中",
    tags: ["技術", "学習"],
  },
}

const mockPlans = [
  { id: "1", title: "Next.js App Routerの学習", priority: "高" },
  { id: "2", title: "TypeScript型システムの理解", priority: "中" },
  { id: "3", title: "パフォーマンス最適化の実践", priority: "低" },
]

const mockLogs = [
  {
    id: "1",
    date: "2025-03-28",
    resource: "Next.js公式ドキュメント",
    quantity: "2時間",
    note: "App Routerの基礎を学習",
  },
  {
    id: "2",
    date: "2025-03-27",
    resource: "TypeScript Deep Dive",
    quantity: "1.5時間",
    note: "ジェネリクスの章を読了",
  },
  { id: "3", date: "2025-03-26", resource: "コーディング練習", quantity: "3時間", note: "個人プロジェクトでの実装" },
]

const mockWeeklyTargets = [
  { id: "1", metric: "学習時間", targetValue: "10", unit: "時間" },
  { id: "2", metric: "コード実装", targetValue: "5", unit: "回" },
]

const mockReviews = [
  { id: "1", week: "2025年第13週", excerpt: "Next.jsの学習が順調に進んでいる。App Routerの理解が深まった。" },
  { id: "2", week: "2025年第12週", excerpt: "TypeScriptの型システムについて新しい発見があった。実践で活用できそう。" },
]

export function GoalDetail({ goalId }: GoalDetailProps) {
  const goal = mockGoalData[goalId as keyof typeof mockGoalData] || mockGoalData["goal-1"]
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(goal.title)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "高":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "中":
        return "bg-accent/10 text-accent-foreground border-accent/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Card className="p-6 rounded-2xl bg-card border-border shadow-sm">
      {/* Goal Header */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false)
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
          <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        <Textarea
          defaultValue={goal.description}
          className="min-h-[80px] resize-none"
          placeholder="ゴールの説明を入力..."
        />

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>期限: {goal.dueDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span className="text-accent font-medium">{goal.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {goal.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="plan">プラン</TabsTrigger>
          <TabsTrigger value="logs">記録</TabsTrigger>
          <TabsTrigger value="targets">週目標</TabsTrigger>
          <TabsTrigger value="reviews">レビュー</TabsTrigger>
        </TabsList>

        {/* プラン Tab */}
        <TabsContent value="plan" className="space-y-3">
          <div className="flex justify-end mb-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  プラン追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規プラン</DialogTitle>
                  <DialogDescription>このゴールに関連するプランを追加します</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-title">タイトル</Label>
                    <Input id="plan-title" placeholder="プランのタイトル" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-priority">優先度</Label>
                    <Select defaultValue="中">
                      <SelectTrigger id="plan-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="高">高</SelectItem>
                        <SelectItem value="中">中</SelectItem>
                        <SelectItem value="低">低</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">追加</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {mockPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                <Badge className={cn("rounded-full", getPriorityColor(plan.priority))}>{plan.priority}</Badge>
                <span className="text-sm font-medium">{plan.title}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* 記録 Tab */}
        <TabsContent value="logs" className="space-y-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">日付</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">リソース</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">数量</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">メモ</th>
                </tr>
              </thead>
              <tbody>
                {mockLogs.map((log) => (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm">{log.date}</td>
                    <td className="p-3 text-sm font-medium">{log.resource}</td>
                    <td className="p-3 text-sm">{log.quantity}</td>
                    <td className="p-3 text-sm text-muted-foreground">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 週目標 Tab */}
        <TabsContent value="targets" className="space-y-3">
          <div className="flex justify-end mb-2">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              目標追加
            </Button>
          </div>

          {mockWeeklyTargets.map((target) => (
            <div
              key={target.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{target.metric}</div>
                <div className="text-xs text-muted-foreground">
                  目標: {target.targetValue} {target.unit}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* レビュー Tab */}
        <TabsContent value="reviews" className="space-y-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="text-sm font-medium text-primary mb-2">{review.week}</div>
              <p className="text-sm text-foreground/90 leading-relaxed">{review.excerpt}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
