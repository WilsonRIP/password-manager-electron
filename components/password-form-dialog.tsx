'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Define a type for the form data to make props clearer
export type PasswordFormData = {
  title: string
  username: string
  password: string
  url: string
}

interface PasswordFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editId: string | null
  formData: PasswordFormData
  onFormChange: (field: keyof PasswordFormData, value: string) => void
  onSave: () => void
}

// Helper to generate a random password of given length
function generatePassword(length = 16): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~'
  let result = ''
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length]
  }
  return result
}

export function PasswordFormDialog({
  isOpen,
  onOpenChange,
  editId,
  formData,
  onFormChange,
  onSave,
}: PasswordFormDialogProps) {
  // Toggle to show/hide password text
  const [showPassword, setShowPassword] = useState(false)
  const handleInputChange =
    (field: keyof PasswordFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFormChange(field, e.target.value)
    }

  // Handler to generate and populate a random password
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(16)
    onFormChange('password', newPassword)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* DialogTrigger is now handled by the Add button in PasswordActionBar */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editId ? 'Edit Password' : 'Add New Password'}
          </DialogTitle>
          <DialogDescription>
            {editId
              ? 'Modify your password details'
              : 'Enter the details for your new password'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="title">
              Title*
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleInputChange('title')}
              className="col-span-3"
              placeholder="e.g. Gmail Account"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="username">
              Username*
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={handleInputChange('username')}
              className="col-span-3"
              placeholder="e.g. your.email@gmail.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="password">
              Password*
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                className="flex-grow"
                placeholder="Enter your password"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPassword((prev) => !prev)}
                type="button" // Prevent form submission
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGeneratePassword}
                type="button"
              >
                {' '}
                {/* Prevent form submission */}
                Generate
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="url">
              Website URL
            </Label>
            <Input
              id="url"
              value={formData.url}
              onChange={handleInputChange('url')}
              className="col-span-3"
              placeholder="e.g. https://gmail.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)} // Close dialog on Cancel
          >
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editId ? 'Save Changes' : 'Save Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
