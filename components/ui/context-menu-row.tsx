"use client"

import * as React from "react"
import { Row, flexRender } from "@tanstack/react-table"
import { TableRow, TableCell } from "../ui/table"

interface ContextMenuRowProps<TData> {
  row: Row<TData>
  renderContextMenu: (row: Row<TData>) => React.ReactNode
  children?: React.ReactNode
  [key: string]: any
}

export function ContextMenuRow<TData>({
  row,
  renderContextMenu,
  children,
  ...props
}: ContextMenuRowProps<TData>) {
  return (
    <TableRow {...props}>
      {children || 
        row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {cell.column.columnDef.cell ? 
              flexRender(cell.column.columnDef.cell, cell.getContext()) : null}
          </TableCell>
        ))
      }
    </TableRow>
  )
} 