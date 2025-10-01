"use client"

import type React from "react"
import { addRecord } from "@/app/actions/goals"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, MousePointerClick } from "lucide-react"
import { useState } from "react"
import { isMockMode } from "@/lib/supabase-client" // lib/supabase-clientからインポートするように変更
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

type DroppedItem = {
  type: "plan" | "weekly_goal"
  id: string
  title: string
  unit: string | null
  planId?: string
  goalTitle?: string
}

export function QuickRecord() {
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [droppedItem, setDroppedItem] = useState<DroppedItem | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">("minutes")
  const [performedAt, setPerformedAt] = useState(() => {
    const now = new Date()
    return format(now, "yyyy-MM-dd'T'HH:mm")
  })
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      console.log("[v0] Dropped item:", data)

      if (data.type === "plan" || data.type === "weekly_goal") {
        setDroppedItem(data)
        setQuantity("")
        setNote("")
        setTimeUnit("minutes")
        const now = new Date()
        setPerformedAt(format(now, "yyyy-MM-dd'T'HH:mm"))
      }
    } catch (error) {
      console.error("[v0] Failed to parse dropped data:", error)
    }
  }

  const handleClearDroppedItem = () => {
    setDroppedItem(null)
    setQuantity("")
    setNote("")
    setTimeUnit("minutes")
    const now = new Date()
    setPerformedAt(format(now, "yyyy-MM-dd'T'HH:mm"))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!droppedItem) {
      toast({
        title: "入力エラー",
        description: "上部の目標またはプランをドラッグしてください",
        variant: "destructive",
      })
      return
    }

    if (!quantity) {
      toast({
        title: "入力エラー",
        description: "数量を入力してください",
        variant: "destructive",
      })
      return
    }

    const unit = droppedItem.unit || ""

    if (isMockMode()) {
      toast({
        title: "モックモード",
        description: "環境変数を設定すると実際のデータベースに保存できます",
        variant: "default",
      })
      setQuantity("")
      setNote("")
      setDroppedItem(null)
      return
    }

    setIsSubmitting(true)

    try {
      let finalQuantity = Number.parseFloat(quantity)
      let finalUnit = unit

      if (unit === "時間") {
        if (timeUnit === "hours") {
          finalQuantity = finalQuantity * 60
        }
        finalUnit = "分"
      }

      await addRecord({
        quantity: finalQuantity,
        unit: finalUnit,
        memo: note || undefined,
        weekly_goal_id: droppedItem.type === "weekly_goal" ? droppedItem.id : undefined,
        plan_id: droppedItem.planId,
        performed_at: new Date(performedAt).toISOString(),
      })

      toast({
        title: "記録完了",
        description: "記録を追加しました",
      })

      setQuantity("")
      setNote("")
      setDroppedItem(null)
      setTimeUnit("minutes")
      const now = new Date()
      setPerformedAt(format(now, "yyyy-MM-dd'T'HH:mm"))

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("recordAdded"))
      }, 100)
    } catch (error) {
      console.error("[v0] Error submitting record:", error)
      toast({
        title: "エラー",
        description: "記録の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const unit = droppedItem?.unit || ""
  const isTimeUnit = unit === "時間" || unit === "分"

  return (
    <Card
      className={`rounded-lg shadow-sm transition-all ${
        isDragOver
          ? "border-primary border-2 bg-primary/5 shadow-lg"
          : droppedItem
            ? "border-border"
            : "border-dashed border-2 border-muted-foreground/30"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          クイック記録追加
          {isDragOver && <span className="text-sm text-primary font-normal">ここにドロップ</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!droppedItem && !isDragOver && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <MousePointerClick className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">目標またはプランをドラッグ</p>
            <p className="text-xs text-muted-foreground">
              上部の「今週の目標」または「プラン」からドラッグしてください
            </p>
          </div>
        )}

        {droppedItem && (
          <>
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {droppedItem.type === "plan" ? "プラン" : "週次目標"}
                    </Badge>
                    <span className="text-sm font-medium">{droppedItem.title}</span>
                  </div>
                  {droppedItem.goalTitle && (
                    <div className="text-xs text-muted-foreground mt-1">{droppedItem.goalTitle}</div>
                  )}
                  {unit && <div className="text-xs text-muted-foreground mt-1">単位: {unit}</div>}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClearDroppedItem}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">数量</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    required
                    className="w-32"
                  />
                  {isTimeUnit ? (
                    <Select value={timeUnit} onValueChange={(value: "minutes" | "hours") => setTimeUnit(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">分</SelectItem>
                        <SelectItem value="hours">時間</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{unit}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedAt">日時</Label>
                <Input
                  id="performedAt"
                  type="datetime-local"
                  value={performedAt}
                  onChange={(e) => setPerformedAt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">メモ</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="メモを入力（任意）"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "保存中..." : "記録を追加"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
