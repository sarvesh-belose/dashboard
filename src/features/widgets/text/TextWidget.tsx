import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea, Text } from '@mantine/core'
import { useFilterStore } from '@/store/filter.store'
import type { WidgetRenderProps, TextWidget as TextWidgetType } from '@/types'

export function TextWidget({ widget }: WidgetRenderProps) {
  const textWidget = widget as TextWidgetType
  const filters = useFilterStore((s) => s.filters)

  const content = useMemo(() => {
    let result = textWidget.textConfig.content
    for (const filter of filters) {
      if (filter.value !== null) {
        const val = Array.isArray(filter.value)
          ? filter.value.join(', ')
          : typeof filter.value === 'object'
            ? `${(filter.value as { from: string; to: string }).from} – ${(filter.value as { from: string; to: string }).to}`
            : String(filter.value)
        result = result.replaceAll(`{{${filter.id}}}`, val)
      }
    }
    return result
  }, [textWidget.textConfig.content, filters])

  if (!content) {
    return (
      <Text size="sm" c="dimmed">
        No content configured.
      </Text>
    )
  }

  return (
    <ScrollArea h="100%">
      <ReactMarkdown>{content}</ReactMarkdown>
    </ScrollArea>
  )
}
