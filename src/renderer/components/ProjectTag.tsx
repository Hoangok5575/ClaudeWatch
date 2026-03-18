import { cn } from '../lib/utils'

interface ProjectTagProps {
  projectName: string
  projectPath: string
  className?: string
}

export function ProjectTag({ projectName, projectPath, className }: ProjectTagProps) {
  return (
    <span
      className={cn('inline-flex min-w-0 flex-1 truncate text-sm text-text-primary', className)}
      title={projectPath}
      aria-label={`Project: ${projectPath}`}
    >
      <span className="truncate">{projectName}</span>
    </span>
  )
}
