"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getSupabase, getWeekStartDate } from "@/lib/supabase"

export function WeeklyProgressComponent() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const supabase = getSupabase()
      const weekStart = getWeekStartDate()

      const { data, error } = await supabase.rpc("get_weekly_progress", {
        p_week_start_date: weekStart,
      })

      if (error) {
        console.error("[v0] Error loading weekly progress:", error)
        return
      }

      setProgress(data || [])
    } catch (error) {
      console.error("[v0] Error loading weekly progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalTarget = progress.reduce((sum, p) => sum + p.target_value, 0)
  const totalActual = progress.reduce((sum, p) => sum + p.actual_value, 0)
  const percentage = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0

  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = mounted ? circumference - (percentage / 100) * circumference : circumference

  if (loading) {
    return (
      <Card className="rounded-lg shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">今週の進捗</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-lg shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">今週の進捗</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-8">
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{percentage}%</span>
            <span className="text-sm text-muted-foreground mt-1">達成率</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {progress.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">目標が設定されていません</p>
          ) : (
            progress.map((item, index) => (
              <div key={index} className="flex justify-between items-center px-4 py-3 rounded-lg bg-muted/50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{item.metric_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.actual_value} / {item.target_value} {item.unit}
                  </span>
                </div>
                <span className="text-lg font-semibold text-primary">{Math.round(item.achievement_rate)}%</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
