import { DashboardHeader } from "@/components/dashboard-header"
import { WeeklyProgressComponent } from "@/components/weekly-progress"
import { QuickRecord } from "@/components/quick-record"
import { RecentRecords } from "@/components/recent-records"
import { WeeklyGoals } from "@/components/weekly-goals"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 今週の進捗 - spans 1 column */}
          <div className="lg:col-span-1">
            <WeeklyProgressComponent />
          </div>

          {/* クイック記録 - spans 1 column on md, 2 on lg */}
          <div className="md:col-span-1 lg:col-span-2">
            <QuickRecord />
          </div>

          {/* 最近の記録 - spans full width on mobile, 1 col on md, 2 on lg */}
          <div className="md:col-span-2 lg:col-span-2">
            <RecentRecords />
          </div>

          {/* 今週の目標 - spans 1 column */}
          <div className="md:col-span-2 lg:col-span-1">
            <WeeklyGoals />
          </div>
        </div>
      </main>
    </div>
  )
}
