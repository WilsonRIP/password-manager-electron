'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Trash2, Edit2, History } from 'lucide-react'

// Re-define or import Password type if not globally available
type Password = {
  id: string
  title: string
  username: string
  password: string
  url: string
  createdAt: string
  updatedAt: string
  history: { password: string; updatedAt: string }[]
}

interface PasswordCardProps {
  password: Password
  showPasswordMap: Record<string, boolean>
  onCopy: (text: string, type: string) => void
  onToggleVisibility: (id: string) => void
  onEdit: (password: Password) => void
  onDelete: (id: string) => void
  onShowHistory: (password: Password) => void
}

export function PasswordCard({
  password,
  showPasswordMap,
  onCopy,
  onToggleVisibility,
  onEdit,
  onDelete,
  onShowHistory,
}: PasswordCardProps) {
  const isPasswordVisible = showPasswordMap[password.id]

  // Placeholder for favicon - replace with actual logic if available
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null // Or a default icon
    }
  }

  const faviconSrc = password.url ? getFavicon(password.url) : null

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        {faviconSrc ? (
          <img
            src={faviconSrc}
            alt=""
            width={24}
            height={24}
            className="rounded"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded text-xs">
            {password.title.substring(0, 1).toUpperCase()}
          </div>
        )}
        <CardTitle className="flex-1 truncate text-base" title={password.title}>
          {password.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col items-center justify-center py-4">
        <span
          className="text-muted-foreground mb-1 text-xs break-all"
          title={password.username}
        >
          {password.username}
        </span>
        <span className="font-mono text-lg tracking-wider break-all">
          {isPasswordVisible ? password.password : '•'.repeat(8)}
        </span>
      </CardContent>
      <CardFooter className="grid grid-cols-5 gap-1 pt-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show history"
          onClick={() => onShowHistory(password)}
          disabled={!password.history || password.history.length === 0}
        >
          <History className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          onClick={() => onToggleVisibility(password.id)}
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copy password"
          onClick={() => onCopy(password.password, 'Password')}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit password"
          onClick={() => onEdit(password)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          aria-label="Delete password"
          onClick={() => onDelete(password.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
