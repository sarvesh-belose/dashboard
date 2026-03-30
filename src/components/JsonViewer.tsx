import { useState, type ReactNode } from 'react'
import { Box, Text, ActionIcon, Group, Code } from '@mantine/core'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'

interface Props {
  data: unknown
  depth?: number
}

export function JsonViewer({ data, depth = 0 }: Props) {
  if (data === null) return <Text span c="gray" size="xs">null</Text>
  if (typeof data === 'boolean') return <Text span c="green" size="xs">{String(data)}</Text>
  if (typeof data === 'number') return <Text span c="blue" size="xs">{data}</Text>
  if (typeof data === 'string') return <Text span c="red" size="xs">&quot;{data}&quot;</Text>

  if (Array.isArray(data)) {
    return (
      <CollapsibleNode label={`Array[${data.length}]`} depth={depth}>
        {data.map((item, i) => (
          <Group key={i} gap={4} align="flex-start" ml={depth * 12 + 8}>
            <Text size="xs" c="dimmed">{i}:</Text>
            <JsonViewer data={item} depth={depth + 1} />
          </Group>
        ))}
      </CollapsibleNode>
    )
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as object)
    return (
      <CollapsibleNode label={`Object{${keys.length}}`} depth={depth}>
        {keys.map((key) => (
          <Group key={key} gap={4} align="flex-start" ml={depth * 12 + 8}>
            <Code fz="xs">{key}:</Code>
            <JsonViewer data={(data as Record<string, unknown>)[key]} depth={depth + 1} />
          </Group>
        ))}
      </CollapsibleNode>
    )
  }

  return <Text size="xs">{String(data)}</Text>
}

function CollapsibleNode({
  label,
  children,
  depth,
}: {
  label: string
  children: ReactNode
  depth: number
}) {
  const [open, setOpen] = useState(depth < 2)
  return (
    <Box>
      <Group gap={2} style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <ActionIcon variant="transparent" size="xs">
          {open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
        </ActionIcon>
        <Text size="xs" c="dimmed">{label}</Text>
      </Group>
      {open && <Box>{children}</Box>}
    </Box>
  )
}
