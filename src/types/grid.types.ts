export interface GridColumnDef {
  field: string
  headerName: string
  width?: number
  flex?: number
  sortable: boolean
  filterable: boolean
  pinned?: 'left' | 'right'
  valueFormatter?: 'currency' | 'date' | 'percent' | 'number'
}

export interface GridConfig {
  columnDefs: GridColumnDef[]
  pagination: boolean
  pageSize: number
  serverSidePagination: boolean
  rowSelection: 'single' | 'multiple' | 'none'
  enableExport: boolean
}
