'use client';

import React, { useState } from 'react';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Import, 
  Plus, 
  SlidersHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardAction } from '@/components/ui/card';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextMenuRow } from '@/components/ui/context-menu-row';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title: string;
  createRoute?: string;
  searchPlaceholder?: string;
  filterColumn?: string;
  onDelete?: (id: number) => Promise<void>;
  contextMenuItems?: React.ReactNode | ((row: any) => React.ReactNode);
  onRowClick?: (row: TData) => void;
}

// Expand table meta with custom properties
type CustomTableMeta = {
  handleDelete?: (id: number) => Promise<void>;
  contextMenuItems?: React.ReactNode | ((row: any) => React.ReactNode);
  onRowClick?: (row: any) => void;
};

export function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  title,
  createRoute,
  searchPlaceholder = 'Search...',
  filterColumn = 'name',
  onDelete,
  contextMenuItems,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  
  // Handle row deletion with animation
  const handleDelete = async (id: number) => {
    if (!onDelete) return;
    
    // Add the ID to the deleting list to trigger animation
    setDeletingIds((prev) => [...prev, id]);
    
    // Delay the actual deletion to allow the animation to complete
    setTimeout(async () => {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting item:', error);
        // Remove from deleting list if the deletion fails
        setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
      }
    }, 350); // Slightly longer than the animation duration
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      handleDelete, // Make the delete handler available to cell renderers
      contextMenuItems, // Add context menu items to meta
      onRowClick, // Add row click handler to meta
    } as any,
  });

  return (
    <Card className="w-full shadow-sm">
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">{title}</h2>
        
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="w-full sm:w-auto flex-1 sm:flex-none">
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(filterColumn)?.setFilterValue(event.target.value)
              }
              className="h-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllColumns().filter(
                (column) => column.getCanHide()
              ).map((column) => {
                return (
                  <DropdownMenuItem
                    key={column.id}
                    className="capitalize"
                    onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={() => column.toggleVisibility(!column.getIsVisible())}
                      className="mr-2"
                    />
                    {column.id}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" variant="outline" className="h-9">
            <Import className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          {createRoute && (
            <Button size="sm" className="h-9" asChild>
              <Link href={createRoute}>
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-border">
        <div className="table-container">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-transparent [&_tr]:border-b [&_tr]:dark:border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr 
                  key={headerGroup.id}
                  className="border-b dark:border-border transition-colors hover:bg-muted/50 dark:hover:bg-primary/5 data-[state=selected]:bg-muted"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <th 
                        key={header.id}
                        className={`h-12 px-4 align-middle font-medium text-gray-500 dark:text-muted-foreground ${
                          header.id === 'actions' ? 'text-right w-[60px]' : 'text-left'
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {table.getRowModel().rows?.length ? (
                <AnimatePresence>
                  {table.getRowModel().rows.map((row) => {
                    const rowData = row.original as TData;
                    const isDeleting = deletingIds.includes(rowData.id);
                    if (isDeleting) return null;
                    
                    // Extract the actions column to get its content
                    const actionsColumn = row.getVisibleCells().find(
                      cell => cell.column.id === 'actions'
                    );
                    
                    // Get the context menu content for the row
                    const renderContextMenu = (row: any) => {
                      // Get context menu items from table meta
                      const meta = table.options.meta as any;
                      if (meta?.contextMenuItems) {
                        try {
                          // If it's a function, call it with the row
                          if (typeof meta.contextMenuItems === 'function') {
                            return meta.contextMenuItems(row);
                          }
                          // Otherwise return directly
                          return meta.contextMenuItems;
                        } catch (e) {
                          console.error('Error rendering context menu:', e);
                        }
                      }
                      
                      // Fallback menu items if nothing is provided
                      return (
                        <>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem key="view">View details</DropdownMenuItem>
                          <DropdownMenuItem key="edit">Edit</DropdownMenuItem>
                          <DropdownMenuSeparator key="sep" />
                          <DropdownMenuItem key="delete" className="text-red-600">Delete</DropdownMenuItem>
                        </>
                      );
                    };
                    
                    return (
                      <ContextMenuRow
                        key={row.id}
                        row={row}
                        renderContextMenu={renderContextMenu}
                        asChild={true}
                      >
                        <motion.tr
                          layout
                          initial={{ opacity: 1, x: 0 }}
                          exit={{ 
                            opacity: 0, 
                            x: -100,
                            transition: { duration: 0.3 }
                          }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border-b border-gray-200 dark:border-border transition-colors hover:bg-gray-50 dark:hover:bg-primary/5 cursor-pointer"
                          onClick={(e) => {
                            // Stop the event from propagating up and causing a redirect
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // If there's a row click handler in meta, use it
                            if (onRowClick) {
                              onRowClick(row.original);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <motion.td 
                              layout
                              key={cell.id} 
                              className={`p-4 align-middle whitespace-nowrap ${
                                cell.column.id === 'actions' ? 'text-right w-[60px]' : ''
                              }`}
                            >
                              <div className={`${cell.column.id === 'actions' ? 'flex justify-end' : 'flex items-center min-w-0'}`}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </motion.td>
                          ))}
                        </motion.tr>
                      </ContextMenuRow>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center text-gray-500 dark:text-muted-foreground">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-border px-4 py-3 flex items-center justify-between">
        <div className="flex-1 text-sm text-gray-500 dark:text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}