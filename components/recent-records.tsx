"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { getSupabase, type Record } from "@/lib/supabase"

export function RecentRecords() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const supabase = getSupabase()

      const { data, error } = await supabase
        .from("records")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("[v0] Error loading records:", error)
        return
      }

      setRecords(data || [])
    } catch (error) {
      console.error("[v0] Error loading records:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "たった今"
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays === 1) return "昨日"
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString("ja-JP")
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
    <Card className="rounded-lg shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">最近の記録</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">記録がありません</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
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
                      {record.quantity}
                      {record.unit}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getRelativeTime(record.performed_at)}
                    </span>
                  </div>
                  {record.memo && <p className="text-sm text-muted-foreground truncate">{record.memo}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
