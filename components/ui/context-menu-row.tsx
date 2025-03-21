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
  asChild, // Extract asChild prop to prevent it from being passed to DOM elements
  ...props
}: ContextMenuRowProps<TData>) {
  // Pass through all props except asChild to the underlying element
  return children ? (
    React.cloneElement(React.Children.only(children) as React.ReactElement, props)
  ) : (
    <TableRow {...props}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.column.columnDef.cell ? 
            flexRender(cell.column.columnDef.cell, cell.getContext()) : null}
        </TableCell>
      ))}
    </TableRow>
  )
} 