import { DashboardHeader } from "@/components/dashboard-header"
import { QuickRecord } from "@/components/quick-record"
import { RecentRecords } from "@/components/recent-records"
import { WeeklyGoals } from "@/components/weekly-goals"
import { ActivePlans } from "@/components/active-plans"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <WeeklyGoals />
            </div>
            <div>
              <ActivePlans />
            </div>
          </div>

          <div>
            <QuickRecord />
          </div>

          <div>
            <RecentRecords />
          </div>
        </div>
      </main>
    </div>
  )
}
