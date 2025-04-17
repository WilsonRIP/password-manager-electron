'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Key, Clock, FileText, Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { label: 'Passwords', href: '/', icon: <Key className="h-5 w-5" /> },
    {
      label: 'Authenticator',
      href: '/authenticator',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      label: 'Secure Notes',
      href: '/notes',
      icon: <FileText className="h-5 w-5" />,
    },
  ]

  return (
    <div>
      {/* Mobile menu button */}
      <div className="p-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      {/* Sidebar links */}
      <nav
        className={`bg-background border-border space-y-2 border-r p-4 ${
          open ? 'block' : 'hidden'
        } md:block`}
      >
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                active ? 'bg-muted/10' : 'hover:bg-muted/10'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
