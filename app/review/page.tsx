import { DashboardHeader } from "@/components/dashboard-header"
import { WeeklyReviewWizard } from "@/components/weekly-review-wizard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <WeeklyReviewWizard />
      </main>
    </div>
  )
}
