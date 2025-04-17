'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Trash2, Edit2, History } from 'lucide-react'
import { Password } from '@/app/types/password' // Assuming you define Password type here

interface PasswordListViewProps {
  passwords: Password[]
  showPasswordMap: Record<string, boolean>
  onCopy: (text: string, type: string) => void
  onToggleVisibility: (id: string) => void
  onEdit: (password: Password) => void
  onDelete: (id: string) => void
  onShowHistory: (password: Password) => void
}

export function PasswordListView({
  passwords,
  showPasswordMap,
  onCopy,
  onToggleVisibility,
  onEdit,
  onDelete,
  onShowHistory,
}: PasswordListViewProps) {
  return (
    <Table className="divide-border [&_tbody_tr:nth-child(odd)]:bg-muted/10 divide-y">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Title</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Password</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {passwords.map((password) => {
          const isPasswordVisible = showPasswordMap[password.id]
          return (
            <TableRow key={password.id}>
              <TableCell className="font-medium">{password.title}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{password.username}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy username"
                    onClick={() => onCopy(password.username, 'Username')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>
                    {isPasswordVisible ? password.password : '•'.repeat(8)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      isPasswordVisible ? 'Hide password' : 'Show password'
                    }
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
                </div>
              </TableCell>
              <TableCell>
                {new Date(password.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(password.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
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
                  aria-label="Edit password"
                  onClick={() => onEdit(password)} // Use the passed onEdit handler
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  aria-label="Delete password"
                  onClick={() => onDelete(password.id)} // Use the passed onDelete handler
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
