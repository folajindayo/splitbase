import React, { useState, useMemo, ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from 'react-native';

export interface Column<T = any> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  headerRender?: () => ReactNode;
  footer?: (data: T[]) => ReactNode;
}

export interface DataGridProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (item: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  virtualized?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  rowHeight?: number;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  cellClassName?: string | ((column: Column<T>, row: T, value: any) => string);
}

export const DataGrid = <T extends Record<string, any>>({
  data,
  columns,
  keyExtractor = (item, index) => String(index),
  onRowClick,
  onRowDoubleClick,
  selectable = false,
  multiSelect = false,
  selectedRows = new Set(),
  onSelectionChange,
  sortable = true,
  filterable = true,
  resizable = false,
  paginated = false,
  pageSize = 10,
  virtualized = false,
  loading = false,
  emptyMessage = 'No data available',
  stickyHeader = true,
  rowHeight = 48,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
}: DataGridProps<T>) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;
    
    const column = columns.find(col => col.id === columnId);
    if (!column || column.sortable === false) return;

    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Handle filtering
  const handleFilter = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  // Process data (filter and sort)
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filterable) {
      Object.entries(filters).forEach(([columnId, filterValue]) => {
        if (!filterValue) return;
        
        const column = columns.find(col => col.id === columnId);
        if (!column) return;

        result = result.filter(row => {
          const cellValue = getCellValue(row, column);
          const stringValue = String(cellValue).toLowerCase();
          return stringValue.includes(filterValue.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortColumn && sortable) {
      const column = columns.find(col => col.id === sortColumn);
      if (column) {
        result.sort((a, b) => {
          const aValue = getCellValue(a, column);
          const bValue = getCellValue(b, column);

          if (aValue === bValue) return 0;

          const comparison = aValue < bValue ? -1 : 1;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, filters, sortColumn, sortDirection, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // Handle selection
  const handleRowSelection = (key: string) => {
    if (!selectable || !onSelectionChange) return;

    const newSelection = new Set(selectedRows);
    
    if (multiSelect) {
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
    } else {
      if (newSelection.has(key)) {
        newSelection.clear();
      } else {
        newSelection.clear();
        newSelection.add(key);
      }
    }

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange || !multiSelect) return;

    const allKeys = paginatedData.map((row, index) => keyExtractor(row, index));
    const newSelection = new Set(selectedRows);

    const allSelected = allKeys.every(key => newSelection.has(key));
    
    if (allSelected) {
      allKeys.forEach(key => newSelection.delete(key));
    } else {
      allKeys.forEach(key => newSelection.add(key));
    }

    onSelectionChange(newSelection);
  };

  // Render cell
  const renderCell = (column: Column<T>, row: T, index: number) => {
    const value = getCellValue(row, column);
    const cellContent = column.render ? column.render(value, row, index) : String(value);

    const alignClass =
      column.align === 'center'
        ? 'text-center'
        : column.align === 'right'
        ? 'text-right'
        : 'text-left';

    const cellClass = typeof cellClassName === 'function'
      ? cellClassName(column, row, value)
      : cellClassName;

    return (
      <View
        key={column.id}
        className={`px-4 py-3 ${alignClass} ${cellClass}`}
        style={{
          width: columnWidths[column.id] || column.width || 'auto',
          minWidth: column.minWidth,
          maxWidth: column.maxWidth,
        }}
      >
        {typeof cellContent === 'string' ? (
          <Text className="text-sm text-gray-900 dark:text-white">{cellContent}</Text>
        ) : (
          cellContent
        )}
      </View>
    );
  };

  // Render row
  const renderRow = (row: T, index: number) => {
    const key = keyExtractor(row, index);
    const isSelected = selectedRows.has(key);
    const isEven = index % 2 === 0;

    const rowClass = typeof rowClassName === 'function'
      ? rowClassName(row, index)
      : rowClassName;

    return (
      <Pressable
        key={key}
        onPress={() => {
          if (selectable) handleRowSelection(key);
          if (onRowClick) onRowClick(row, index);
        }}
        className={`flex-row border-b border-gray-200 dark:border-gray-700 ${
          striped && isEven ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
        } ${hoverable ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''} ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        } ${rowClass}`}
        style={{ height: rowHeight }}
      >
        {selectable && (
          <View className="px-4 py-3 items-center justify-center w-12">
            <View
              className={`w-5 h-5 border-2 rounded ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              } items-center justify-center`}
            >
              {isSelected && <Text className="text-white text-xs">✓</Text>}
            </View>
          </View>
        )}
        {columns.map(column => renderCell(column, row, index))}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center p-8 ${className}`}>
        <Text className="text-gray-500 dark:text-gray-400">Loading...</Text>
      </View>
    );
  }

  if (processedData.length === 0) {
    return (
      <View className={`flex-1 items-center justify-center p-8 ${className}`}>
        <Text className="text-gray-500 dark:text-gray-400">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${bordered ? 'border border-gray-200 dark:border-gray-700 rounded-lg' : ''} ${className}`}>
      {/* Header */}
      <View
        className={`flex-row bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 ${
          stickyHeader ? 'sticky top-0 z-10' : ''
        } ${headerClassName}`}
      >
        {selectable && multiSelect && (
          <View className="px-4 py-3 items-center justify-center w-12">
            <Pressable onPress={handleSelectAll}>
              <View
                className={`w-5 h-5 border-2 rounded ${
                  paginatedData.every((row, index) =>
                    selectedRows.has(keyExtractor(row, index))
                  )
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                } items-center justify-center`}
              >
                {paginatedData.every((row, index) =>
                  selectedRows.has(keyExtractor(row, index))
                ) && <Text className="text-white text-xs">✓</Text>}
              </View>
            </Pressable>
          </View>
        )}
        {selectable && !multiSelect && <View className="w-12" />}
        
        {columns.map(column => (
          <View
            key={column.id}
            className="px-4 py-3"
            style={{
              width: columnWidths[column.id] || column.width || 'auto',
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
          >
            <Pressable
              onPress={() => handleSort(column.id)}
              className="flex-row items-center"
            >
              {column.headerRender ? (
                column.headerRender()
              ) : (
                <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {column.header}
                </Text>
              )}
              {sortable && column.sortable !== false && (
                <Text className="ml-2 text-gray-500">
                  {sortColumn === column.id ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </Text>
              )}
            </Pressable>
            
            {filterable && column.filterable !== false && (
              <TextInput
                value={filters[column.id] || ''}
                onChangeText={text => handleFilter(column.id, text)}
                placeholder="Filter..."
                className="mt-2 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholderTextColor="#9CA3AF"
              />
            )}
          </View>
        ))}
      </View>

      {/* Body */}
      {virtualized ? (
        <FlatList
          data={paginatedData}
          renderItem={({ item, index }) => renderRow(item, index)}
          keyExtractor={keyExtractor}
          getItemLayout={(data, index) => ({
            length: rowHeight,
            offset: rowHeight * index,
            index,
          })}
        />
      ) : (
        <ScrollView>
          {paginatedData.map((row, index) => renderRow(row, index))}
        </ScrollView>
      )}

      {/* Footer */}
      {columns.some(col => col.footer) && (
        <View className="flex-row bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
          {selectable && <View className="w-12" />}
          {columns.map(column => (
            <View
              key={column.id}
              className="px-4 py-3"
              style={{
                width: columnWidths[column.id] || column.width || 'auto',
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
              }}
            >
              {column.footer && column.footer(processedData)}
            </View>
          ))}
        </View>
      )}

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Text className="text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of{' '}
            {processedData.length} results
          </Text>
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Text className={`text-sm ${currentPage === 1 ? 'text-gray-400' : 'text-white'}`}>
                Previous
              </Text>
            </Pressable>
            <Text className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </Text>
            <Pressable
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Text
                className={`text-sm ${
                  currentPage === totalPages ? 'text-gray-400' : 'text-white'
                }`}
              >
                Next
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

// Example Usage
export const ExampleDataGrid = () => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', amount: 1500 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', amount: 2300 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', amount: 890 },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', status: 'Inactive', amount: 4200 },
  ];

  const columns: Column<typeof data[0]>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <View className={`px-2 py-1 rounded ${
          value === 'Active' ? 'bg-green-100' : value === 'Pending' ? 'bg-yellow-100' : 'bg-gray-100'
        }`}>
          <Text className="text-xs font-medium">{value}</Text>
        </View>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'right',
      sortable: true,
      render: (value) => <Text>${value.toLocaleString()}</Text>,
      footer: (data) => (
        <Text className="font-bold">
          Total: ${data.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <DataGrid
      data={data}
      columns={columns}
      keyExtractor={(item) => String(item.id)}
      selectable
      multiSelect
      selectedRows={selectedRows}
      onSelectionChange={setSelectedRows}
      sortable
      filterable
      paginated
      pageSize={10}
      striped
      hoverable
      bordered
    />
  );
};

