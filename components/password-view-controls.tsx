'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { List, Grid, SlidersHorizontal } from 'lucide-react'

type ViewMode = 'list' | 'grid'
type SortCriteria = 'title' | 'createdAt' | 'updatedAt'

interface PasswordViewControlsProps {
  viewMode: ViewMode
  sortCriteria: SortCriteria
  onViewModeChange: (mode: ViewMode) => void
  onSortCriteriaChange: (criteria: SortCriteria) => void
}

export function PasswordViewControls({
  viewMode,
  sortCriteria,
  onViewModeChange,
  onSortCriteriaChange,
}: PasswordViewControlsProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('list')}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        aria-label="Grid view"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Sort options">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortCriteriaChange('title')}>
            Sort by Title {sortCriteria === 'title' && '✔'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortCriteriaChange('createdAt')}>
            Sort by Created {sortCriteria === 'createdAt' && '✔'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortCriteriaChange('updatedAt')}>
            Sort by Modified {sortCriteria === 'updatedAt' && '✔'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
