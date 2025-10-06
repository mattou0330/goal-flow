import Link from "next/link"
import { UserAvatar } from "@/components/user-avatar"

interface DashboardHeaderProps {
  avatarUrl?: string | null
  name?: string | null
}

export function DashboardHeader({ avatarUrl, name }: DashboardHeaderProps) {
  return (
    <header className="border-b-4 border-black bg-card shadow-[0px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded bg-primary border-2 border-black flex items-center justify-center">
                <span className="text-primary-foreground font-black text-lg">G</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-wide">GoalFlow</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors uppercase tracking-wide"
              >
                ダッシュボード
              </Link>
              <Link
                href="/goals"
                className="px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wide"
              >
                ゴール
              </Link>
              <Link
                href="/review"
                className="px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wide"
              >
                週次レビュー
              </Link>
            </nav>
          </div>

          <UserAvatar avatarUrl={avatarUrl} name={name} />
        </div>
      </div>
    </header>
  )
}
