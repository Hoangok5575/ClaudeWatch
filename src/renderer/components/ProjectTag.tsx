import { Folder } from 'lucide-react'
import { cn } from '../lib/utils'

interface ProjectTagProps {
  projectName: string
  projectPath: string
  className?: string
}

export function ProjectTag({ projectName, projectPath, className }: ProjectTagProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-[180px] items-center gap-1.5 truncate text-sm text-text-primary',
        className
      )}
      title={projectPath}
      aria-label={`Project: ${projectPath}`}
    >
      <Folder className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
      <span className="truncate">{projectName}</span>
    </span>
  )
}
