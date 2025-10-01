"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { getSupabase, type Record, isMockMode, mockRecords } from "@/lib/supabase"

export function RecentRecords() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [dbNotSetup, setDbNotSetup] = useState(false)

  useEffect(() => {
    loadRecords()

    const handleRecordAdded = () => {
      loadRecords()
    }

    window.addEventListener("recordAdded", handleRecordAdded)

    return () => {
      window.removeEventListener("recordAdded", handleRecordAdded)
    }
  }, [])

  const loadRecords = async () => {
    try {
      if (isMockMode()) {
        setRecords(mockRecords)
        setLoading(false)
        return
      }

      const supabase = getSupabase()

      const { data, error } = await supabase
        .from("records")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(5)

      if (error) {
        if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
          setDbNotSetup(true)
          setRecords(mockRecords)
        }
        setLoading(false)
        return
      }

      setRecords(data || [])
    } catch (error) {
      setDbNotSetup(true)
      setRecords(mockRecords)
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
