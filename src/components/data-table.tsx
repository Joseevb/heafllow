import type { ColumnDef } from '@tanstack/react-table'

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type DataTableColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  tooltip?:
    | string
    | ((context: { row: TData; cell: ReturnType<typeof flexRender>; value: TValue }) => string)
}

interface DataTableProps<TData, TValue> {
  columns: Array<DataTableColumnDef<TData, TValue>>
  data: Array<TData>
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table className={cn('w-full min-w-full table-fixed', className)}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => {
                  const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                  const rawValue = cell.getValue()
                  const columnDef = cell.column.columnDef as DataTableColumnDef<TData, TValue>
                  const tooltipText = columnDef.tooltip
                    ? typeof columnDef.tooltip === 'string'
                      ? columnDef.tooltip
                      : columnDef.tooltip({
                          row: row.original,
                          cell: content,
                          value: rawValue as TValue,
                        })
                    : null

                  return (
                    <TableCell key={cell.id} className="truncate whitespace-nowrap">
                      {tooltipText ? (
                        <Tooltip>
                          <TooltipTrigger className="block truncate">{content}</TooltipTrigger>
                          <TooltipContent>{tooltipText}</TooltipContent>
                        </Tooltip>
                      ) : (
                        content
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
