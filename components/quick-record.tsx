"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function QuickRecord() {
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quantity || !unit) {
      toast({
        title: "入力エラー",
        description: "数量と単位を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      const { error } = await supabase.from("records").insert({
        performed_at: new Date().toISOString(),
        quantity: Number.parseFloat(quantity),
        unit,
        memo: note || null,
      })

      if (error) {
        console.error("[v0] Error inserting record:", error)
        toast({
          title: "エラー",
          description: "記録の保存に失敗しました",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "記録完了",
        description: "記録を追加しました",
      })

      // フォームをリセット
      setQuantity("")
      setUnit("")
      setNote("")

      // ページをリロードして最新データを表示
      window.location.reload()
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

  return (
    <Card className="rounded-lg shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">クイック記録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">単位</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="時間、回、円など"
                required
              />
            </div>
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
      </CardContent>
    </Card>
  )
}
