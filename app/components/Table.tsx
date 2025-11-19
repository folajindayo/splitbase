/**
 * Data Table Component
 * Feature-rich table with sorting, pagination, and selection
 */

import { useState } from "react";

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
}

export default function Table<T = any>({
  columns,
  data,
  keyField = "id",
  striped = false,
  hover = true,
  bordered = false,
  compact = false,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortable = false,
  defaultSortKey,
  defaultSortOrder = "asc",
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;
    
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Sort data
  const sortedData = sortable && sortKey
    ? [...data].sort((a: any, b: any) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortOrder === "asc" ? comparison : -comparison;
      })
    : data;

  // Handle row selection
  const isRowSelected = (row: T) => {
    return selectedRows.some((selected: any) => selected[keyField] === (row as any)[keyField]);
  };

  const handleRowSelect = (row: T) => {
    if (!onSelectionChange) return;

    if (isRowSelected(row)) {
      onSelectionChange(
        selectedRows.filter((selected: any) => selected[keyField] !== (row as any)[keyField])
      );
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedRows.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...data]);
    }
  };

  const allSelected = selectedRows.length === data.length && data.length > 0;

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${bordered ? "border border-gray-200" : ""}`}>
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className={`${compact ? "px-3 py-2" : "px-6 py-3"} text-left`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  ${compact ? "px-3 py-2" : "px-6 py-3"}
                  text-xs font-medium text-gray-700 uppercase tracking-wider
                  ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"}
                  ${sortable && column.sortable !== false ? "cursor-pointer select-none hover:bg-gray-100" : ""}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{column.label}</span>
                  {sortable && column.sortable !== false && sortKey === column.key && (
                    <span className="text-blue-600">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? "divide-y-0" : ""}`}>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={`${compact ? "px-3 py-8" : "px-6 py-12"} text-center text-gray-500`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={`${compact ? "px-3 py-8" : "px-6 py-12"} text-center text-gray-500`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row: any, index) => (
              <tr
                key={row[keyField] || index}
                className={`
                  ${striped && index % 2 === 1 ? "bg-gray-50" : ""}
                  ${hover ? "hover:bg-gray-50" : ""}
                  ${onRowClick ? "cursor-pointer" : ""}
                  ${isRowSelected(row) ? "bg-blue-50" : ""}
                `}
                onClick={() => onRowClick && onRowClick(row, index)}
              >
                {selectable && (
                  <td
                    className={`${compact ? "px-3 py-2" : "px-6 py-4"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isRowSelected(row)}
                      onChange={() => handleRowSelect(row)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${compact ? "px-3 py-2" : "px-6 py-4"}
                      text-sm text-gray-900 whitespace-nowrap
                      ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"}
                    `}
                  >
                    {column.render
                      ? column.render(row[column.key], row, index)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Simple table for quick use
export function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


