import { getSettings } from "@/app/actions/settings"
import { SettingsForm } from "@/components/settings-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase"

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const settings = await getSettings()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">設定</h1>
          <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
        </div>

        <SettingsForm
          initialSettings={settings || { theme_color: "blue", week_start_day: "monday" }}
          userEmail={user.email || ""}
        />
      </main>
    </div>
  )
}
