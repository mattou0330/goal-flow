"use client"

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

interface UserAvatarProps {
  avatarUrl?: string | null
  name?: string | null
}

export function UserAvatar({ avatarUrl, name }: UserAvatarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all">
          <AvatarImage src={avatarUrl || "/placeholder.svg?height=36&width=36"} alt={name || "ユーザー"} />
          <AvatarFallback className="bg-primary text-primary-foreground">{name?.charAt(0) || "U"}</AvatarFallback>
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
  )
}
