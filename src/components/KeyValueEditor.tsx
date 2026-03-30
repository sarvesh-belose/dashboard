import { Table, TextInput, ActionIcon, Button, Group } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'

interface Props {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({ value, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }: Props) {
  const entries = Object.entries(value)

  const update = (idx: number, field: 'key' | 'val', text: string) => {
    const next = [...entries]
    if (field === 'key') next[idx] = [text, next[idx][1]]
    else next[idx] = [next[idx][0], text]
    onChange(Object.fromEntries(next.filter(([k]) => k)))
  }

  const remove = (idx: number) => {
    const next = entries.filter((_, i) => i !== idx)
    onChange(Object.fromEntries(next))
  }

  const add = () => {
    onChange({ ...value, '': '' })
  }

  return (
    <div>
      {entries.length > 0 && (
        <Table fz="xs" mb="xs">
          <Table.Tbody>
            {entries.map(([k, v], idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <TextInput
                    placeholder={keyPlaceholder}
                    value={k}
                    onChange={(e) => update(idx, 'key', e.currentTarget.value)}
                    size="xs"
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder={valuePlaceholder}
                    value={v}
                    onChange={(e) => update(idx, 'val', e.currentTarget.value)}
                    size="xs"
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon variant="subtle" color="red" size="xs" onClick={() => remove(idx)}>
                    <IconTrash size={12} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      <Group>
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={add}>
          Add
        </Button>
      </Group>
    </div>
  )
}
