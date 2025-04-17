'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Search, Download, Upload } from 'lucide-react'

// We keep the Dialog logic separate for now, triggered by a button here.
// Or should the DialogTrigger be here directly? Let's keep it simple first.
// The parent component (app/page.tsx) will control the dialog state.

interface PasswordActionBarProps {
  searchTerm: string
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAddClick: () => void // Triggers the dialog opening in the parent
  onImportClick: () => void // Placeholder
  onExportClick: () => void // Placeholder
}

export function PasswordActionBar({
  searchTerm,
  onSearchChange,
  onAddClick,
  onImportClick,
  onExportClick,
}: PasswordActionBarProps) {
  return (
    <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
      <div className="relative w-full md:flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search passwords..."
          className="w-full pl-10"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImportClick}>
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>
        <Button variant="outline" size="sm" onClick={onExportClick}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        {/* This button will trigger the dialog in the parent component */}
        <Button size="sm" onClick={onAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Password
        </Button>
      </div>
    </div>
  )
}
