// t.me/SentinelLinks

// t.me/SentinelLinks
"use client"

import type { User } from "@/lib/auth"

interface FooterProps {
  user: User | null
}

// t.me/SentinelLinks
export function Footer({ user }: FooterProps) {
  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-background/80 backdrop-blur-sm border-t flex items-center justify-center gap-3 text-[10px] text-muted-foreground z-50">
      <div className="flex items-center gap-1">
        <span>Пользователь: {user.username}</span>
      </div>
    </div>
  )
}

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
