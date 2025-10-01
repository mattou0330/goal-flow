import { getProfile } from "@/app/actions/profile"
import { ProfileForm } from "@/components/profile-form"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">プロフィール設定</h1>
        <ProfileForm profile={profile} />
      </main>
    </div>
  )
}
