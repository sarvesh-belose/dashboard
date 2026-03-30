import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table,
  ScrollArea,
  Group,
  Text,
  ActionIcon,
  Pagination,
  Center,
  Box,
} from '@mantine/core'
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react'
import { useWidgetData } from '@/hooks/useWidgetData'
import { WidgetLoadingState } from '../base/WidgetLoadingState'
import { WidgetEmptyState } from '../base/WidgetEmptyState'
import type { WidgetRenderProps, GridWidget as GridWidgetType } from '@/types'

export function GridWidget({ widget }: WidgetRenderProps) {
  const gridWidget = widget as GridWidgetType
  const { data, isLoading, isError, error } = useWidgetData(widget.id)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const rows = useMemo(() => {
    if (!data) return []
    const result = data as { rows: Record<string, unknown>[] }
    return result.rows ?? []
  }, [data])

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      gridWidget.gridConfig.columnDefs.map((col) => ({
        accessorKey: col.field,
        header: col.headerName,
        size: col.width,
        enableSorting: col.sortable,
        enableColumnFilter: col.filterable,
      })),
    [gridWidget.gridConfig.columnDefs],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: gridWidget.gridConfig.pagination
      ? getPaginationRowModel()
      : undefined,
    initialState: {
      pagination: { pageSize: gridWidget.gridConfig.pageSize || 10 },
    },
  })

  if (isLoading) return <WidgetLoadingState />
  if (isError) {
    return (
      <Center h="100%">
        <Text size="sm" c="red">
          {(error as Error)?.message ?? 'Failed to load data'}
        </Text>
      </Center>
    )
  }
  if (!rows.length) return <WidgetEmptyState />

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ScrollArea style={{ flex: 1 }}>
        <Table striped highlightOnHover withTableBorder withColumnBorders fz="xs">
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Group gap={4} wrap="nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <ActionIcon variant="transparent" size="xs">
                          {header.column.getIsSorted() === 'asc' ? (
                            <IconChevronUp size={12} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <IconChevronDown size={12} />
                          ) : (
                            <IconSelector size={12} />
                          )}
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.map((row) => (
              <Table.Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {gridWidget.gridConfig.pagination && (
        <Group justify="center" mt="xs">
          <Pagination
            total={table.getPageCount()}
            value={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            size="xs"
          />
        </Group>
      )}
    </Box>
  )
}
