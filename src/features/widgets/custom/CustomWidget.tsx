import type { ComponentType } from 'react'
import { Center, Text } from '@mantine/core'
import type { WidgetRenderProps, CustomWidget as CustomWidgetType } from '@/types'

// Secondary registry for custom components
const customComponentRegistry = new Map<string, ComponentType<Record<string, unknown>>>()

export function registerCustomComponent(
  key: string,
  component: ComponentType<Record<string, unknown>>,
): void {
  customComponentRegistry.set(key, component)
}

export function CustomWidget({ widget }: WidgetRenderProps) {
  const customWidget = widget as CustomWidgetType
  const Component = customComponentRegistry.get(customWidget.componentKey)

  if (!Component) {
    return (
      <Center h="100%">
        <Text size="sm" c="dimmed">
          Component &quot;{customWidget.componentKey}&quot; not registered.
        </Text>
      </Center>
    )
  }

  return <Component {...customWidget.componentProps} />
}
