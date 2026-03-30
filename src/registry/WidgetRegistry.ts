import type { ComponentType } from 'react'
import type { ZodSchema } from 'zod'
import type { WidgetType, Widget, WidgetRenderProps } from '@/types'
import type { WizardStep } from '@/constants/widget.constants'

export interface WidgetRegistryEntry {
  type: WidgetType
  label: string
  icon: ComponentType<{ size?: number; stroke?: number }>
  component: ComponentType<WidgetRenderProps>
  wizardSteps: WizardStep[]
  defaultConfig: () => Partial<Widget>
  configValidator: ZodSchema
}

class WidgetRegistryClass {
  private readonly map = new Map<WidgetType, WidgetRegistryEntry>()

  register(entry: WidgetRegistryEntry): void {
    this.map.set(entry.type, entry)
  }

  get(type: WidgetType): WidgetRegistryEntry | undefined {
    return this.map.get(type)
  }

  getAll(): WidgetRegistryEntry[] {
    return Array.from(this.map.values())
  }

  has(type: WidgetType): boolean {
    return this.map.has(type)
  }
}

export const WidgetRegistry = new WidgetRegistryClass()
