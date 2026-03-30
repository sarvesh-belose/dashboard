import type { ReactNode } from 'react'
import { useRbac } from '@/hooks/useRbac'
import type { Widget } from '@/types'

interface Props {
  widget: Widget
  children: ReactNode
  fallback?: ReactNode
}

export function RbacGate({ widget, children, fallback = null }: Props) {
  const { canViewWidget } = useRbac()
  return canViewWidget(widget) ? <>{children}</> : <>{fallback}</>
}
