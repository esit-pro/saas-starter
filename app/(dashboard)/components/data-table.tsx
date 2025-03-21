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
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
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
  
  // Row being deleted state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Track swipe actions
  const [swipeStates, setSwipeStates] = useState<{[key: number]: number}>({});
  
  // Handle row deletion
  const handleDelete = async (id: number) => {
    if (!onDelete) return;
    
    // Mark this row as deleting
    setDeletingId(id);
    
    // Allow time for the exit animation
    setTimeout(async () => {
      try {
        // Actually delete the item after animation
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting item:', error);
      } finally {
        // Always reset the deleting state
        setDeletingId(null);
        // Reset the swipe state
        setSwipeStates(prev => {
          const updated = {...prev};
          delete updated[id];
          return updated;
        });
      }
    }, 600); // Match the duration of our animation
  };

  // Handle swipe
  const handleSwipeEnd = (id: number, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // If swiped far enough left or with enough velocity, delete
    if (offset < -100 || velocity < -500) {
      handleDelete(id);
    } else {
      // Reset swipe position
      setSwipeStates(prev => ({
        ...prev,
        [id]: 0
      }));
    }
  };
  
  // Handle swipe update
  const handleSwipeUpdate = (id: number, info: any) => {
    const x = info.point.x;
    setSwipeStates(prev => ({
      ...prev,
      [id]: Math.min(0, x) // Only allow negative values (leftward swipe)
    }));
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
              <LayoutGroup>
                {table.getRowModel().rows?.length ? (
                  <AnimatePresence initial={false} mode="popLayout">
                    {table.getRowModel().rows.map((row) => {
                      const rowData = row.original as TData;
                      const isDeleting = deletingId === rowData.id;
                      const swipeX = swipeStates[rowData.id] || 0;
                      
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
                          disabled={isDeleting}
                          title={onDelete ? "Swipe left to delete" : ""}
                        >
                          <motion.tr
                            layout
                            initial={{ opacity: 1, x: 0 }}
                            exit={{ 
                              x: "-100%", // First slide left out of view
                              opacity: 0,  // Fade out while sliding
                              height: 0,   // Then collapse height
                              marginTop: 0,
                              marginBottom: 0,
                              transition: {
                                duration: 0.6,
                                times: [0, 0.4, 1], // Control timing of each phase
                                x: { duration: 0.3, ease: "easeOut" },
                                opacity: { duration: 0.3 },
                                height: { 
                                  delay: 0.3, // Delay height collapse to create brief empty space
                                  duration: 0.3,
                                  ease: [0.33, 1, 0.68, 1] // Custom cubic bezier for "gravity" feeling
                                }
                              }
                            }}
                            animate={isDeleting ? {
                              x: "-100%",
                              opacity: 0,
                              height: 0,
                              marginTop: 0,
                              marginBottom: 0,
                              transition: {
                                duration: 0.6,
                                times: [0, 0.4, 1],
                                x: { duration: 0.3, ease: "easeOut" },
                                opacity: { duration: 0.3 },
                                height: { 
                                  delay: 0.3,
                                  duration: 0.3,
                                  ease: [0.33, 1, 0.68, 1] 
                                }
                              }
                            } : {
                              opacity: 1,
                              x: swipeX,
                              height: "auto"
                            }}
                            drag="x"
                            dragDirectionLock
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={(_, info) => handleSwipeEnd(rowData.id, info)}
                            dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                            className="border-b border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-primary/5 relative"
                            onClick={(e) => {
                              // Stop the event from propagating up and causing a redirect
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // More comprehensive check for dropdown menu elements
                              // Check if click is on dropdown menu, button, or any menu-related element
                              const target = e.target as HTMLElement;
                              const isDropdownMenuClick = 
                                target.closest('[role="menuitem"]') || 
                                target.closest('[data-state="open"]') || 
                                target.closest('[data-radix-popper-content-wrapper]') ||
                                // Check for the action cell content by class
                                target.closest('.action-cell-content') ||
                                // Check for the MoreHorizontal icon or its container button
                                target.closest('button:has(svg[data-lucide="more-horizontal"])') ||
                                target.closest('svg[data-lucide="more-horizontal"]');
                                
                              // Only trigger click handler if not clicking on dropdown elements
                              if (onRowClick && !isDropdownMenuClick) {
                                onRowClick(row.original);
                              }
                            }}
                          >
                            <div 
                              className="absolute inset-y-0 right-0 flex items-center pr-4 bg-red-500 text-white -mr-16 w-16 justify-center"
                              style={{ opacity: swipeX < -20 ? Math.min(1, Math.abs(swipeX) / 100) : 0 }}
                            >
                              Delete
                            </div>
                            
                            {row.getVisibleCells().map((cell) => (
                              <td 
                                key={cell.id} 
                                className={`p-4 align-middle whitespace-nowrap ${
                                  cell.column.id === 'actions' ? 'text-right w-[60px]' : ''
                                }`}
                              >
                                <div 
                                  className={`${
                                    cell.column.id === 'actions' 
                                      ? 'flex justify-end action-cell-content' 
                                      : 'flex items-center min-w-0'
                                  }`}
                                  onClick={cell.column.id === 'actions' ? (e) => {
                                    // Stop propagation for actions cell content
                                    e.stopPropagation();
                                  } : undefined}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                              </td>
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
              </LayoutGroup>
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