"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile, uploadAvatar, type Profile } from "@/app/actions/profile"
import { Upload, Loader2 } from "lucide-react"

type ProfileFormProps = {
  profile: Profile | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(profile?.name || "")
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 画像ファイルのみ許可
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください")
      return
    }

    // ファイルサイズ制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert("ファイルサイズは5MB以下にしてください")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadAvatar(formData)

      if (result.success && result.url) {
        setAvatarUrl(result.url)
      } else {
        alert(result.error || "画像のアップロードに失敗しました")
      }
    } catch (error) {
      console.error("アップロードエラー:", error)
      alert("画像のアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("名前を入力してください")
      return
    }

    setIsSaving(true)

    const result = await updateProfile({
      name: name.trim(),
      avatar_url: avatarUrl || null,
      birth_date: birthDate || null,
    })

    setIsSaving(false)

    if (result.success) {
      alert("プロフィールを保存しました")
      router.refresh()
    } else {
      alert(`保存に失敗しました: ${result.error}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール情報</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* アイコン */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={name} />
              <AvatarFallback className="text-2xl">{name.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById("avatar")?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      画像をアップロード
                    </>
                  )}
                </Button>
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">JPG、PNG、GIF形式（最大5MB）</p>
          </div>

          {/* 名前 */}
          <div className="space-y-2">
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田太郎"
              required
            />
          </div>

          {/* 生年月日 */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          {/* 保存ボタン */}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
