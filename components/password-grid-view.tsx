'use client'

import { PasswordCard } from '@/components/ui/password-card'
import { Password } from '@/app/types/password'

interface PasswordGridViewProps {
  passwords: Password[]
  showPasswordMap: Record<string, boolean>
  onCopy: (text: string, type: string) => void
  onToggleVisibility: (id: string) => void
  onEdit: (password: Password) => void
  onDelete: (id: string) => void // Note: Grid view uses a confirmation, so this might trigger the confirmation dialog in parent
  onShowHistory: (password: Password) => void
}

export function PasswordGridView({
  passwords,
  showPasswordMap,
  onCopy,
  onToggleVisibility,
  onEdit,
  onDelete, // This handler likely triggers the confirmation dialog in page.tsx
  onShowHistory,
}: PasswordGridViewProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {passwords.map((password) => (
        <PasswordCard
          key={password.id}
          password={password}
          showPasswordMap={showPasswordMap}
          onCopy={onCopy}
          onToggleVisibility={onToggleVisibility}
          onEdit={onEdit}
          onDelete={onDelete} // Pass the handler down
          onShowHistory={onShowHistory}
        />
      ))}
    </div>
  )
}
