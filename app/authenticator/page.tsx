'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { totp } from 'otplib'
import { useClerkSupabaseClient } from '@/lib/clerkSupabaseClient'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import './authenticator.css'

// Define OTP token type (matching Supabase table)
export type Token = {
  id: string // UUID from Supabase
  label: string
  secret: string
  digits: number
  period: number
  created_at?: string // Optional, from Supabase
  updated_at?: string // Optional, from Supabase
}

// OTP card component
function OTPCard({
  token,
  onDeleteClick,
}: {
  token: Token
  onDeleteClick: (id: string) => void
}) {
  const { label, secret, digits, period } = token
  const [code, setCode] = useState('------')
  const [ttl, setTtl] = useState(period)

  useEffect(() => {
    totp.options = { step: period, digits }
    const generateCode = () => {
      try {
        const newCode = totp.generate(secret)
        setCode(newCode)
        const now = Math.floor(Date.now() / 1000)
        const remainder = period - (now % period)
        setTtl(remainder)
      } catch (error) {
        console.error('Error generating TOTP:', error)
        setCode('Error')
        setTtl(0)
      }
    }
    generateCode()
    const iv = setInterval(generateCode, 1000)
    return () => clearInterval(iv)
  }, [secret, period, digits])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied ${label} code - expires in ${ttl}s`)
  }

  return (
    <Card className="flex flex-col p-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center">
        <span className="mb-2 font-mono text-3xl tracking-widest">{code}</span>
        <div className="bg-border h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full"
            style={{ width: `${(ttl / period) * 100}%` }}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-center pt-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copy code"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          aria-label="Delete token"
          onClick={() => onDeleteClick(token.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// Main authenticator page
export default function AuthenticatorPage() {
  const supabase = useClerkSupabaseClient()
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null)
  const [newToken, setNewToken] = useState({ label: '', secret: '' })

  // --- Fetch Tokens ---
  const fetchTokens = useCallback(async () => {
    if (!supabase) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('authenticator_tokens')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setTokens(data || [])
    } catch (err) {
      console.error('Error fetching tokens:', err)
      toast.error('Failed to load authenticator tokens.')
      setTokens([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // --- Add Token Logic ---
  const handleAddToken = useCallback(async () => {
    if (!supabase) return
    if (!newToken.label || !newToken.secret) {
      toast.error('Label and Secret are required.')
      return
    }
    try {
      totp.generate(newToken.secret) // Validate secret before saving
    } catch {
      toast.error('Invalid Base32 Secret.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('authenticator_tokens').insert({
        label: newToken.label,
        secret: newToken.secret,
        // digits and period will use DB defaults (6, 30)
      })
      if (error) throw error

      setNewToken({ label: '', secret: '' }) // Reset form
      setIsAddDialogOpen(false)
      toast.success('Token added successfully!')
      await fetchTokens() // Refresh list
    } catch (err) {
      console.error('Error adding token:', err)
      toast.error('Failed to add token.')
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase, newToken, fetchTokens])

  // --- Delete Token Logic ---
  const handleDeleteClick = (id: string) => {
    const token = tokens.find((t) => t.id === id)
    if (token) {
      setTokenToDelete(token)
      setIsDeleteDialogOpen(true)
    }
  }

  const confirmDeleteToken = useCallback(async () => {
    if (!tokenToDelete || !supabase) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('authenticator_tokens')
        .delete()
        .eq('id', tokenToDelete.id)

      if (error) throw error

      setIsDeleteDialogOpen(false)
      toast.success(`Token "${tokenToDelete.label}" deleted.`)
      setTokenToDelete(null)
      await fetchTokens() // Refresh list
    } catch (err) {
      console.error('Error deleting token:', err)
      toast.error('Failed to delete token.')
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase, tokenToDelete, fetchTokens])

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setTokenToDelete(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Authenticator</h1>
        {/* Add Token Dialog Trigger */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Authenticator Token</DialogTitle>
              <DialogDescription>
                Enter the label and Base32 secret for the new token.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right">
                  Label
                </Label>
                <Input
                  id="label"
                  value={newToken.label}
                  onChange={(e) =>
                    setNewToken({ ...newToken, label: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="e.g., My Website"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="secret" className="text-right">
                  Secret (Base32)
                </Label>
                <Input
                  id="secret"
                  value={newToken.secret}
                  onChange={(e) =>
                    setNewToken({ ...newToken, secret: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="JBSWY3DPEHPK3PXP..."
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleAddToken} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Token Grid or Loading State */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          <div className="text-muted-foreground col-span-full py-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p>Loading tokens...</p>
          </div>
        ) : tokens.length > 0 ? (
          tokens.map((t) => (
            <OTPCard key={t.id} token={t} onDeleteClick={handleDeleteClick} />
          ))
        ) : (
          <div className="text-muted-foreground col-span-full py-10 text-center">
            No authenticator tokens yet. Click &quot;Add Token&quot; to get
            started.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={cancelDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the token &quot;
              {tokenToDelete?.label}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteToken}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
