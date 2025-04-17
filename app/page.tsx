'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PasswordActionBar } from '@/components/password-action-bar'
import { PasswordViewControls } from '@/components/password-view-controls'
import { PasswordListView } from '@/components/password-list-view'
import { PasswordGridView } from '@/components/password-grid-view'
import { PasswordFormDialog } from '@/components/password-form-dialog'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { usePasswordManager } from '@/hooks/usePasswordManager'

export default function Home() {
  const {
    searchTerm,
    setSearchTerm,
    showPasswordMap,
    togglePasswordVisibility,
    copyToClipboard,
    sortCriteria,
    setSortCriteria,
    filteredPasswords,
    formData,
    isFormDialogOpen,
    editId,
    viewMode,
    setViewMode,
    isDeleteDialogOpen,
    setIsFormDialogOpen,
    setIsDeleteDialogOpen,
    handleFormChange,
    openAddDialog,
    openEditDialog,
    handleSavePassword,
    confirmDelete,
    cancelDelete,
    handleDelete,
    handleShowHistory,
    handleImport,
    handleExport,
  } = usePasswordManager()

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-2xl">Password Manager</CardTitle>
          <CardDescription>
            Securely store and manage your passwords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordActionBar
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onAddClick={openAddDialog}
            onImportClick={handleImport}
            onExportClick={handleExport}
          />

          <div className="mb-4 flex justify-end">
            <PasswordViewControls
              viewMode={viewMode}
              sortCriteria={sortCriteria}
              onViewModeChange={setViewMode}
              onSortCriteriaChange={setSortCriteria}
            />
          </div>

          {viewMode === 'list' ? (
            <PasswordListView
              passwords={filteredPasswords}
              showPasswordMap={showPasswordMap}
              onCopy={copyToClipboard}
              onToggleVisibility={togglePasswordVisibility}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onShowHistory={handleShowHistory}
            />
          ) : (
            <PasswordGridView
              passwords={filteredPasswords}
              showPasswordMap={showPasswordMap}
              onCopy={copyToClipboard}
              onToggleVisibility={togglePasswordVisibility}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onShowHistory={handleShowHistory}
            />
          )}
        </CardContent>
      </Card>

      <PasswordFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        editId={editId}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSavePassword}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
