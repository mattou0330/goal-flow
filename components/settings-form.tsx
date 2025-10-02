"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateEmail, updatePassword } from "@/app/actions/settings"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function SettingsForm({
  userEmail,
}: {
  userEmail: string
}) {
  const router = useRouter()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return

    setIsLoading(true)
    setMessage(null)
    const result = await updateEmail(newEmail)
    setIsLoading(false)

    if (result.success) {
      setMessage({ type: "success", text: "確認メールを送信しました。メールを確認してください。" })
      setNewEmail("")
    } else {
      setMessage({ type: "error", text: result.error || "更新に失敗しました" })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) return

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "パスワードが一致しません" })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "パスワードは6文字以上である必要があります" })
      return
    }

    setIsLoading(true)
    setMessage(null)
    const result = await updatePassword(newPassword)
    setIsLoading(false)

    if (result.success) {
      setMessage({ type: "success", text: "パスワードを更新しました" })
      setNewPassword("")
      setConfirmPassword("")
    } else {
      setMessage({ type: "error", text: result.error || "更新に失敗しました" })
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>メールアドレス変更</CardTitle>
          <CardDescription>現在のメールアドレス: {userEmail}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">新しいメールアドレス</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !newEmail} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              メールアドレスを変更
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
          <CardDescription>新しいパスワードを設定します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">パスワード確認</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !newPassword || !confirmPassword} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              パスワードを変更
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
