"use client";

import React, { ReactNode } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * DataTable Component
 * Reusable table with sorting and custom rendering
 */
export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${
                onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
              }`}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="whitespace-nowrap px-6 py-4">
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

