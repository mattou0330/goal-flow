"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Pencil, Trash2, X, Check, ChevronRight, ChevronLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { isMockMode, mockRecords } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTimeDisplay } from "@/lib/format-time"
import { getRecentRecords, updateRecord, deleteRecord, type RecordWithRelations } from "@/app/actions/goals"
import { Badge } from "@/components/ui/badge"

export function RecentRecords() {
  const [records, setRecords] = useState<RecordWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [dbNotSetup, setDbNotSetup] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordWithRelations | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editUnit, setEditUnit] = useState("")
  const [editMemo, setEditMemo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const RECORDS_PER_PAGE = 5
  const { toast } = useToast()

  useEffect(() => {
    loadRecords()

    const handleRecordAdded = () => {
      console.log("[v0] Record added event received")
      setOffset(0)
      loadRecords(0)
    }

    window.addEventListener("recordAdded", handleRecordAdded)

    return () => {
      window.removeEventListener("recordAdded", handleRecordAdded)
    }
  }, [])

  const loadRecords = async (currentOffset = offset) => {
    try {
      if (isMockMode()) {
        const start = currentOffset
        const end = currentOffset + RECORDS_PER_PAGE
        setRecords(mockRecords.slice(start, end))
        setHasMore(end < mockRecords.length)
        setLoading(false)
        return
      }

      const data = await getRecentRecords(RECORDS_PER_PAGE + 1, currentOffset)

      console.log("[v0] Loaded records:", data)

      if (data && data.length > RECORDS_PER_PAGE) {
        setHasMore(true)
        setRecords(data.slice(0, RECORDS_PER_PAGE))
      } else {
        setHasMore(false)
        setRecords(data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading records:", error)
      setDbNotSetup(true)
      setRecords(mockRecords.slice(0, RECORDS_PER_PAGE))
      setHasMore(mockRecords.length > RECORDS_PER_PAGE)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreRecords = async () => {
    setLoadingMore(true)
    const newOffset = offset + RECORDS_PER_PAGE
    setOffset(newOffset)
    await loadRecords(newOffset)
  }

  const loadPreviousRecords = async () => {
    setLoadingMore(true)
    const newOffset = Math.max(0, offset - RECORDS_PER_PAGE)
    setOffset(newOffset)
    await loadRecords(newOffset)
  }

  const handleEditClick = (record: RecordWithRelations) => {
    setEditingRecord(record)
    setEditQuantity(record.quantity.toString())
    setEditUnit(record.unit)
    setEditMemo(record.memo || "")
  }

  const handleEditCancel = () => {
    setEditingRecord(null)
    setEditQuantity("")
    setEditUnit("")
    setEditMemo("")
  }

  const handleEditSubmit = async () => {
    if (!editingRecord || !editQuantity || !editUnit) {
      toast({
        title: "入力エラー",
        description: "数量と単位を入力してください",
        variant: "destructive",
      })
      return
    }

    if (isMockMode()) {
      toast({
        title: "モックモード",
        description: "環境変数を設定すると実際のデータベースに保存できます",
        variant: "default",
      })
      handleEditCancel()
      return
    }

    setIsSubmitting(true)

    try {
      await updateRecord(editingRecord.id, {
        quantity: Number.parseFloat(editQuantity),
        unit: editUnit,
        memo: editMemo || undefined,
      })

      toast({
        title: "更新完了",
        description: "記録を更新しました",
      })

      handleEditCancel()
      loadRecords()
    } catch (error) {
      console.error("[v0] Error updating record:", error)
      toast({
        title: "エラー",
        description: "記録の更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm("この記録を削除しますか？")) {
      return
    }

    if (isMockMode()) {
      toast({
        title: "モックモード",
        description: "環境変数を設定すると実際のデータベースに保存できます",
        variant: "default",
      })
      return
    }

    try {
      await deleteRecord(recordId)

      toast({
        title: "削除完了",
        description: "記録を削除しました",
      })

      loadRecords()
    } catch (error) {
      console.error("[v0] Error deleting record:", error)
      toast({
        title: "エラー",
        description: "記録の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const timeStr = date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (isToday) {
      return `今日 ${timeStr}`
    }

    if (isYesterday) {
      return `昨日 ${timeStr}`
    }

    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRecordTitle = (record: RecordWithRelations) => {
    if (record.weekly_goals?.plans) {
      return record.weekly_goals.plans.title
    }
    if (record.plans) {
      return record.plans.title
    }
    return null
  }

  const getRecordGoalTitle = (record: RecordWithRelations) => {
    if (record.weekly_goals?.plans?.goals) {
      return record.weekly_goals.plans.goals.title
    }
    if (record.plans?.goals) {
      return record.plans.goals.title
    }
    return null
  }

  if (loading) {
    return (
      <Card className="rounded-lg shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">最近の記録</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-lg shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            最近の記録
            {dbNotSetup && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">デモモード</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbNotSetup && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <p className="font-medium mb-1">データベースのセットアップが必要です</p>
              <p className="text-xs">
                scriptsフォルダ内のSQLスクリプトを実行してください。現在はサンプルデータを表示しています。
              </p>
            </div>
          )}

          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">記録がありません</p>
          ) : (
            <>
              <div className="space-y-3">
                {records.map((record) => {
                  const planTitle = getRecordTitle(record)
                  const goalTitle = getRecordGoalTitle(record)

                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-muted/50 transition-colors border border-border"
                    >
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">
                            {formatTimeDisplay(record.quantity, record.unit)}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(record.performed_at)}
                          </span>
                        </div>
                        {(planTitle || goalTitle) && (
                          <div className="flex items-center gap-2 mb-1">
                            {planTitle && (
                              <Badge variant="secondary" className="text-xs">
                                {planTitle}
                              </Badge>
                            )}
                            {goalTitle && <span className="text-xs text-muted-foreground">{goalTitle}</span>}
                          </div>
                        )}
                        {record.memo && <p className="text-sm text-muted-foreground truncate">{record.memo}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {(offset > 0 || hasMore) && (
                <div className="flex justify-between items-center mt-4">
                  <div>
                    {offset > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPreviousRecords}
                        disabled={loadingMore}
                        className="gap-2 bg-transparent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {loadingMore ? "読み込み中..." : "前の5件を表示"}
                      </Button>
                    )}
                  </div>
                  <div>
                    {hasMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMoreRecords}
                        disabled={loadingMore}
                        className="gap-2 bg-transparent"
                      >
                        {loadingMore ? "読み込み中..." : "次の5件を表示"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && handleEditCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>記録を編集</DialogTitle>
            <DialogDescription>記録の内容を編集できます。</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">数量</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unit">単位</Label>
              <Input
                id="edit-unit"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                placeholder="時間、回、円など"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-memo">メモ</Label>
              <Textarea
                id="edit-memo"
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="メモを入力（任意）"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              キャンセル
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
