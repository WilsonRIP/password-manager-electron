import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useClerkSupabaseClient } from '@/lib/clerkSupabaseClient'
import {
  EncryptedPayload,
  deriveMasterKey,
  encryptField,
  decryptField,
  uint8ArrayToBase64,
} from '@/lib/crypto'
import type { Password } from '@/app/types/password'
import type { PasswordFormData } from '@/components/password-form-dialog'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type ViewMode = 'list' | 'grid'
type SortCriteria = 'title' | 'createdAt' | 'updatedAt'

/**
 * TODO: replace with a user‑supplied pass‑phrase obtained at sign‑in or via
 * biometric / secure element. Hard‑coded here **only** for demonstration.
 */
const PLACEHOLDER_PASSPHRASE = 'temporary_insecure_password'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function usePasswordManager() {
  const supabase = useClerkSupabaseClient()

  // ----------------------- state -------------------------------------------
  const [passwords, setPasswords] = useState<Password[]>([])
  const [showPasswordMap, setShowPasswordMap] = useState<
    Record<string, boolean>
  >({})
  const [formData, setFormData] = useState<PasswordFormData>({
    title: '',
    username: '',
    password: '',
    url: '',
  })
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('updatedAt')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [passwordToDeleteId, setPasswordToDeleteId] = useState<string | null>(
    null
  )
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null)

  // ----------------------- initialise crypto -------------------------------
  useEffect(() => {
    ;(async () => {
      try {
        const { masterKey: key } = await deriveMasterKey(PLACEHOLDER_PASSPHRASE)
        setMasterKey(key)
      } catch (err) {
        console.error(err)
        toast.error('Failed to initialise encryption module.')
      }
    })()
  }, [])

  // ----------------------- helpers -----------------------------------------
  const decryptPocketbaseField = useCallback(
    async (
      payload: Partial<EncryptedPayload> & { salt?: string }
    ): Promise<string> => {
      const { iv, ciphertext, salt } = payload
      if (!iv || !ciphertext || !salt) return ''
      return decryptField(
        { version: 2, iv, ciphertext, salt } as EncryptedPayload,
        PLACEHOLDER_PASSPHRASE
      )
    },
    []
  )

  // ----------------------- fetch passwords ---------------------------------
  const fetchPasswords = useCallback(async () => {
    if (!supabase || !masterKey) return

    try {
      const mapSort: Record<SortCriteria, string> = {
        title: 'created_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
      const ascending = sortCriteria === 'title'
      const sortField = mapSort[sortCriteria]

      const { data: items, error } = await supabase
        .from('passwords')
        .select('*')
        .order(sortField, { ascending })

      if (error) throw error
      if (!items) throw new Error('No data returned from Supabase')

      const decrypted: Password[] = await Promise.all(
        items.map(async (item) => ({
          id: item.id,
          title: await decryptPocketbaseField({
            iv: item.title_iv,
            ciphertext: item.title_ciphertext,
            salt: item.salt,
          }),
          username: await decryptPocketbaseField({
            iv: item.username_iv,
            ciphertext: item.username_ciphertext,
            salt: item.salt,
          }),
          password: await decryptPocketbaseField({
            iv: item.password_iv,
            ciphertext: item.password_ciphertext,
            salt: item.salt,
          }),
          url: await decryptPocketbaseField({
            iv: item.url_iv,
            ciphertext: item.url_ciphertext,
            salt: item.salt,
          }),
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          history: [],
        }))
      )

      setPasswords(decrypted)
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Supabase fetch error:', err)
        toast.error('Unable to retrieve passwords.')
      }
    }
  }, [decryptPocketbaseField, masterKey, sortCriteria, supabase])

  useEffect(() => {
    if (masterKey && supabase) {
      fetchPasswords()
    }
  }, [fetchPasswords, masterKey, supabase])

  // ----------------------- derived -----------------------------------------
  const filteredPasswords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return passwords
    return passwords.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term) ||
        (p.url ?? '').toLowerCase().includes(term)
    )
  }, [passwords, searchTerm])

  // ----------------------- form helpers ------------------------------------
  const handleFormChange = useCallback(
    (field: keyof PasswordFormData, value: string) =>
      setFormData((prev) => ({ ...prev, [field]: value })),
    []
  )

  const resetForm = () => {
    setFormData({ title: '', username: '', password: '', url: '' })
    setEditId(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (password: Password) => {
    setEditId(password.id)
    setFormData({
      title: password.title,
      username: password.username,
      password: password.password,
      url: password.url,
    })
    setIsFormDialogOpen(true)
  }

  const handleSavePassword = useCallback(async () => {
    if (!supabase || !masterKey) {
      toast.error('Initialisation incomplete.')
      return
    }
    const { title, username, password } = formData
    if (!title || !username || !password) {
      toast.error('Title, username and password are required.')
      return
    }

    try {
      const { masterKey: key, salt } = await deriveMasterKey(
        PLACEHOLDER_PASSPHRASE
      )
      const encrypt = (plain: string) => encryptField(plain, key, salt)

      const [titleEnc, userEnc, passEnc, urlEnc] = await Promise.all([
        encrypt(title),
        encrypt(username),
        encrypt(password),
        encrypt(formData.url ?? ''),
      ])

      const payload = {
        salt: uint8ArrayToBase64(salt),
        title_iv: titleEnc.iv,
        title_ciphertext: titleEnc.ciphertext,
        username_iv: userEnc.iv,
        username_ciphertext: userEnc.ciphertext,
        password_iv: passEnc.iv,
        password_ciphertext: passEnc.ciphertext,
        url_iv: urlEnc.iv,
        url_ciphertext: urlEnc.ciphertext,
      }

      if (editId) {
        const { error } = await supabase
          .from('passwords')
          .update(payload)
          .eq('id', editId)
        if (error) throw error
        toast.success('Entry updated.')
      } else {
        const { error } = await supabase.from('passwords').insert(payload)
        if (error) throw error
        toast.success('Entry added.')
      }

      resetForm()
      setIsFormDialogOpen(false)
      fetchPasswords()
    } catch (err) {
      console.error(err)
      toast.error('Could not save entry.')
    }
  }, [editId, formData, masterKey, fetchPasswords, supabase])

  // ----------------------- delete helpers ----------------------------------
  const openDeleteDialog = (id: string) => {
    setPasswordToDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = useCallback(async () => {
    if (!passwordToDeleteId || !supabase) return
    try {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', passwordToDeleteId)

      if (error) throw error

      setPasswords((prev) => prev.filter((p) => p.id !== passwordToDeleteId))
      toast.success('Entry deleted.')
    } catch (err) {
      console.error(err)
      toast.error('Could not delete entry.')
    } finally {
      setPasswordToDeleteId(null)
      setIsDeleteDialogOpen(false)
    }
  }, [passwordToDeleteId, supabase])

  // Add cancelDelete function back
  const cancelDelete = useCallback(() => {
    setPasswordToDeleteId(null)
    setIsDeleteDialogOpen(false)
  }, [])

  // ----------------------- list actions ------------------------------------
  const togglePasswordVisibility = (id: string) =>
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }))

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied.`))
  }

  const handleDelete = (id: string) => {
    openDeleteDialog(id)
  }

  const handleShowHistory = (password: Password) => {
    const history = (password.history ?? [])
      .map((h) => `${new Date(h.updatedAt).toLocaleString()}: ********`)
      .join('\n')
    alert(history || 'No history available')
  }

  const handleImport = () => toast.info('Import not implemented yet.')
  const handleExport = () => toast.info('Export not implemented yet.')

  // ----------------------- public api --------------------------------------
  return {
    // state
    passwords,
    filteredPasswords,
    showPasswordMap,
    formData,
    isFormDialogOpen,
    editId,
    searchTerm,
    viewMode,
    sortCriteria,
    isDeleteDialogOpen,
    passwordToDeleteId,
    masterKey,

    // setters
    setSearchTerm,
    setViewMode,
    setSortCriteria,
    setIsFormDialogOpen,
    setIsDeleteDialogOpen,

    // handlers
    handleFormChange,
    openAddDialog,
    openEditDialog,
    handleSavePassword,
    openDeleteDialog,
    confirmDelete,
    togglePasswordVisibility,
    copyToClipboard,
    handleDelete,
    handleShowHistory,
    handleImport,
    handleExport,
    // Expose cancelDelete again
    cancelDelete,
  }
}
