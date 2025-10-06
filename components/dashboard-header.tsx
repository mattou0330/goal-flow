import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/app/actions/auth"
import { getProfile } from "@/app/profile/actions"

export async function DashboardHeader() {
  const profile = await getProfile()

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

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
                <AvatarImage
                  src={profile?.avatar_url || "/placeholder.svg?height=36&width=36"}
                  alt={profile?.name || "ユーザー"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>プロフィール</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>設定</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex w-full items-center text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
