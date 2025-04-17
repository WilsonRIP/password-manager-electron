'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useClerkSupabaseClient } from '@/lib/clerkSupabaseClient'
import {
  deriveMasterKey,
  encryptField,
  decryptField,
  uint8ArrayToBase64,
} from '@/lib/crypto' // Re-use crypto functions
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea' // Use Textarea for content
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { PlusCircle, Edit2, Trash2, Loader2 } from 'lucide-react'

// Define Note type (matching Supabase table, plus decrypted fields)
export type SecureNote = {
  id: string
  user_id?: string // From Supabase
  created_at?: string
  updated_at?: string
  title: string // Decrypted
  content: string // Decrypted
  // Raw encrypted fields from Supabase (optional, for debugging/reference)
  raw?: {
    salt: string
    title_iv: string
    title_ciphertext: string
    content_iv: string
    content_ciphertext: string
  }
}

// Define form data type
type NoteFormData = {
  title: string
  content: string
}

// Placeholder passphrase (replace with secure method)
const PLACEHOLDER_PASSPHRASE = 'temporary_insecure_password'

export default function SecureNotesPage() {
  const supabase = useClerkSupabaseClient()
  const [notes, setNotes] = useState<SecureNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<SecureNote | null>(null)
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: '',
  })
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null)

  // --- Initialise Crypto Key --- (Similar to usePasswordManager)
  useEffect(() => {
    ;(async () => {
      try {
        const { masterKey: key } = await deriveMasterKey(PLACEHOLDER_PASSPHRASE)
        setMasterKey(key)
      } catch (err) {
        console.error('Failed to derive master key for notes:', err)
        toast.error('Failed to initialise encryption module.')
      }
    })()
  }, [])

  // --- Decrypt Helper ---
  const decryptNoteField = useCallback(
    async (
      encrypted: { iv: string; ciphertext: string },
      salt: string
    ): Promise<string> => {
      if (!masterKey) throw new Error('Master key not available')
      if (!encrypted.iv || !encrypted.ciphertext || !salt) return ''
      try {
        return await decryptField(
          { version: 2, ...encrypted, salt },
          PLACEHOLDER_PASSPHRASE // Using passphrase directly for decryption helper
        )
      } catch (err) {
        console.error('Decryption failed:', err)
        return '[Decryption Error]'
      }
    },
    [masterKey] // Depend on masterKey
  )

  // --- Fetch Notes ---*
  const fetchNotes = useCallback(async () => {
    if (!supabase || !masterKey) return // Wait for client and key
    setIsLoading(true)
    try {
      const { data: items, error } = await supabase
        .from('secure_notes')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      if (!items) {
        setNotes([])
        return
      }

      const decryptedNotes: SecureNote[] = await Promise.all(
        items.map(async (item) => ({
          id: item.id,
          title: await decryptNoteField(
            { iv: item.title_iv, ciphertext: item.title_ciphertext },
            item.salt
          ),
          content: await decryptNoteField(
            { iv: item.content_iv, ciphertext: item.content_ciphertext },
            item.salt
          ),
          created_at: item.created_at,
          updated_at: item.updated_at,
          raw: item, // Keep raw data if needed
        }))
      )
      setNotes(decryptedNotes)
    } catch (err) {
      console.error('Error fetching notes:', err)
      toast.error('Failed to load secure notes.')
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, masterKey, decryptNoteField])

  useEffect(() => {
    if (supabase && masterKey) {
      fetchNotes()
    }
  }, [fetchNotes, supabase, masterKey]) // Rerun if client or key changes

  // --- Form Handling ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const openAddForm = () => {
    setCurrentNoteId(null)
    setFormData({ title: '', content: '' })
    setIsFormOpen(true)
  }

  const openEditForm = (note: SecureNote) => {
    setCurrentNoteId(note.id)
    setFormData({ title: note.title, content: note.content })
    setIsFormOpen(true)
  }

  // --- Save Note (Add/Edit) ---
  const handleSaveNote = useCallback(async () => {
    if (!supabase || !masterKey) {
      toast.error('Client or encryption key not ready.')
      return
    }
    if (!formData.title || !formData.content) {
      toast.error('Title and Content are required.')
      return
    }

    setIsSubmitting(true)
    try {
      // Derive key and salt *for this save operation* to ensure fresh salt per note/update
      const { masterKey: derivedKey, salt } = await deriveMasterKey(
        PLACEHOLDER_PASSPHRASE
      )
      const encrypt = (plain: string) => encryptField(plain, derivedKey, salt)

      const [titleEnc, contentEnc] = await Promise.all([
        encrypt(formData.title),
        encrypt(formData.content),
      ])

      const payload = {
        salt: uint8ArrayToBase64(salt),
        title_iv: titleEnc.iv,
        title_ciphertext: titleEnc.ciphertext,
        content_iv: contentEnc.iv,
        content_ciphertext: contentEnc.ciphertext,
      }

      let error
      if (currentNoteId) {
        // Update existing note
        ;({ error } = await supabase
          .from('secure_notes')
          .update(payload)
          .eq('id', currentNoteId))
        if (!error) toast.success('Note updated.')
      } else {
        // Insert new note (user_id is handled by DB default/RLS)
        ;({ error } = await supabase.from('secure_notes').insert(payload))
        if (!error) toast.success('Note added.')
      }

      if (error) throw error

      setIsFormOpen(false)
      await fetchNotes() // Refresh list
    } catch (err) {
      console.error('Error saving note:', err)
      toast.error('Failed to save note.')
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase, masterKey, formData, currentNoteId, fetchNotes])

  // --- Delete Note Logic ---
  const openDeleteDialog = (note: SecureNote) => {
    setNoteToDelete(note)
    setIsDeleteOpen(true)
  }

  const cancelDelete = () => {
    setNoteToDelete(null)
    setIsDeleteOpen(false)
  }

  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDelete || !supabase) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('secure_notes')
        .delete()
        .eq('id', noteToDelete.id)

      if (error) throw error

      toast.success(`Note "${noteToDelete.title}" deleted.`)
      setIsDeleteOpen(false)
      setNoteToDelete(null)
      await fetchNotes() // Refresh list
    } catch (err) {
      console.error('Error deleting note:', err)
      toast.error('Failed to delete note.')
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase, noteToDelete, fetchNotes])

  // --- Render Logic ---
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Secure Notes</h1>
        <Button onClick={openAddForm} disabled={isLoading || !masterKey}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Note
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Notes</CardTitle>
          <CardDescription>Encrypted notes only you can read.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>
                      {note.updated_at
                        ? new Date(note.updated_at).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(note)}
                        className="mr-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(note)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No notes found. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentNoteId ? 'Edit Secure Note' : 'Add Secure Note'}
            </DialogTitle>
            <DialogDescription>
              Your note content will be encrypted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleFormChange}
                rows={6}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={isSubmitting || !masterKey}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={cancelDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the note &quot;
              {noteToDelete?.title}&quot;? This action cannot be undone.
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
              onClick={confirmDeleteNote}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
