"use client"

import { cn } from "@/lib/utils"

import Link from "next/link"

import { usePathname } from "next/navigation"

import { Home, Target, Calendar, User } from "lucide-react"

export function Nav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "ダッシュボード", icon: Home },
    { href: "/goals", label: "ゴール", icon: Target },
    { href: "/weekly", label: "週次目標", icon: Calendar },
    { href: "/profile", label: "プロフィール", icon: User },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              GoalFlow
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
