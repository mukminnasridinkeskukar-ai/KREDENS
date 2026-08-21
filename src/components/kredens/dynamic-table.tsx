"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
} from "lucide-react";

// Types
export interface ColumnConfig<T> {
  key: keyof T | string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "file";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  width?: string;
  editable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DynamicTableProps<T extends Record<string, unknown>> {
  /** Column configuration */
  columns: ColumnConfig<T>[];
  /** Initial data */
  data?: T[];
  /** Callback when data changes */
  onChange?: (data: T[]) => void;
  /** Table title */
  title?: string;
  /** Description text */
  description?: string;
  /** Whether table is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Minimum number of rows (enforced) */
  minRows?: number;
  /** Maximum number of rows */
  maxRows?: number;
  /** Validation function per row */
  validateRow?: (row: T) => Record<string, string> | null;
  /** Empty state message */
  emptyMessage?: string;
  /** Add button label */
  addLabel?: string;
}

export type RowData = Record<string, unknown>;

const generateId = (): string => `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function DynamicTableInner<T extends RowData>({
  columns,
  data: externalData = [],
  onChange,
  title,
  description,
  disabled = false,
  className,
  minRows = 0,
  maxRows = 10,
  validateRow,
  emptyMessage = "Belum ada data. Klik tombol di bawah untuk menambahkan.",
  addLabel = "Tambah Data",
}: DynamicTableProps<T>) {
  const [rows, setRows] = useState<(T & { _id?: string; _isEditing?: boolean })[]>(
    () => externalData.map((item) => ({ ...item, _id: generateId(), _isEditing: false }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  // Sync external data
  const updateExternalData = useCallback(
    (newRows: (T & { _id?: string; _isEditing?: boolean })[]) => {
      const cleanData = newRows.map(({ _id, _isEditing, ...rest }) => rest as T);
      onChange?.(cleanData);
    },
    [onChange]
  );

  const handleAddRow = useCallback(() => {
    if (rows.length >= maxRows) return;

    const newRow = {} as T & { _id: string; _isEditing: boolean };
    newRow._id = generateId();
    newRow._isEditing = true;

    // Set default values for each column
    columns.forEach((col) => {
      if (col.type === "number") {
        (newRow as Record<string, unknown>)[String(col.key)] = 0;
      } else if (col.type === "select" && col.options?.length) {
        (newRow as Record<string, unknown>)[String(col.key)] = col.options[0].value;
      } else {
        (newRow as Record<string, unknown>)[String(col.key)] = "";
      }
    });

    const newRows = [...rows, newRow];
    setRows(newRows);
    setEditingId(newRow._id);
    updateExternalData(newRows);
  }, [columns, maxRows, rows, updateExternalData]);

  const handleRemoveRow = useCallback(
    (index: number) => {
      if (disabled || rows.length <= minRows) return;

      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[rows[index]._id || ""];
        return newErrors;
      });
      updateExternalData(newRows);
    },
    [disabled, minRows, rows, updateExternalData]
  );

  const handleEditRow = useCallback((index: number) => {
    if (disabled) return;
    setEditingId(rows[index]._id || null);
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, _isEditing: true } : row))
    );
  }, [disabled, rows]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setRows((prev) =>
      prev.map((row) => ({ ...row, _isEditing: false }))
    );
    setErrors({});
  }, []);

  const handleSaveRow = useCallback(
    (index: number) => {
      const row = rows[index];
      
      // Validate row
      let rowErrors: Record<string, string> | null = null;
      if (validateRow) {
        rowErrors = validateRow(row);
      }

      // Check required fields
      const requiredErrors: Record<string, string> = {};
      columns.forEach((col) => {
        if (col.required && !row[String(col.key)]) {
          requiredErrors[String(col.key)] = `${col.label} wajib diisi`;
        }
      });

      const allErrors = { ...(rowErrors || {}), ...requiredErrors };

      if (Object.keys(allErrors).length > 0) {
        setErrors((prev) => ({ ...prev, [row._id || ""]: allErrors }));
        return;
      }

      // Save successful
      const newRows = rows.map((r, i) =>
        i === index ? { ...r, _isEditing: false } : r
      );
      setRows(newRows);
      setEditingId(null);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[row._id || ""];
        return newErrors;
      });
      updateExternalData(newRows);
    },
    [columns, rows, updateExternalData, validateRow]
  );

  const handleCellChange = useCallback(
    (index: number, key: string, value: unknown) => {
      const newRows = [...rows];
      newRows[index] = { ...newRows[index], [key]: value };
      setRows(newRows);

      // Clear error for this field on change
      if (errors[newRows[index]._id || ""]?.[key]) {
        setErrors((prev) => ({
          ...prev,
          [newRows[index]._id || ""]: {
            ...(prev[newRows[index]._id || ""] || {}),
            [key]: "",
          },
        }));
      }
    },
    [rows, errors]
  );

  const renderInput = (
    column: ColumnConfig<T>,
    value: unknown,
    rowIndex: number,
    isEditing: boolean
  ) => {
    const key = String(column.key);
    const rowErrors = errors[rows[rowIndex]?._id || ""] || {};
    const hasError = !!rowErrors[key];

    if (!isEditing) {
      // Display mode
      if (column.render) {
        return column.render(value, rows[rowIndex], rowIndex);
      }
      return <span className="text-slate-700 dark:text-slate-300">{String(value ?? "-")}</span>;
    }

    // Edit mode
    switch (column.type) {
      case "textarea":
        return (
          <textarea
            value={String(value ?? "")}
            onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50",
              hasError ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-600"
            )}
            rows={2}
            disabled={disabled}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={String(value ?? "")}
            onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50",
              hasError ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-600"
            )}
            disabled={disabled}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={Number(value ?? 0)}
            onChange={(e) => handleCellChange(rowIndex, key, Number(e.target.value))}
            placeholder={column.placeholder}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50",
              hasError ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-600"
            )}
            disabled={disabled}
          />
        );

      case "select":
        return (
          <select
            value={String(value ?? "")}
            onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50",
              hasError ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-600"
            )}
            disabled={disabled}
          >
            <option value="">Pilih...</option>
            {column.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => handleCellChange(rowIndex, key, e.target.value)}
            placeholder={column.placeholder}
            className={cn(
              "h-9 text-sm",
              hasError && "border-red-300 dark:border-red-600"
            )}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-base font-semibold text-[#1e3a5f] dark:text-teal-400">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                <TableHead className="w-12 text-center">#</TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className="font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {column.label}
                    {column.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 2}
                    className="text-center py-12 text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircleIcon className="h-8 w-8 text-slate-400" />
                      <p>{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, rowIndex) => {
                  const isEditing = editingId === row._id;
                  const rowErrors = errors[row._id || ""] || {};

                  return (
                    <TableRow
                      key={row._id || rowIndex}
                      className={
                        isEditing
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : ""
                      }
                    >
                      <TableCell className="text-center text-slate-500 font-medium">
                        {rowIndex + 1}
                      </TableCell>

                      {columns.map((column) => {
                        const key = String(column.key);
                        return (
                          <TableCell key={key} className="relative">
                            {renderInput(
                              column,
                              row[key],
                              rowIndex,
                              isEditing
                            )}
                            {/* Error message */}
                            {isEditing && rowErrors[key] && (
                              <p className="absolute left-0 top-full mt-1 text-xs text-red-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                {rowErrors[key]}
                              </p>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveRow(rowIndex)}
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Simpan"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                title="Batal"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRow(rowIndex)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit"
                                disabled={disabled}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRow(rowIndex)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Hapus"
                                disabled={disabled || rows.length <= minRows}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Button */}
      {!disabled && rows.length < maxRows && (
        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            className="gap-2 border-dashed border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-teal-50 dark:hover:bg-teal-900/20"
          >
            <PlusIcon className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>
      )}

      {/* Row count info */}
      <p className="mt-2 text-xs text-slate-500">
        {rows.length} dari maksimal {maxRows} baris
        {minRows > 0 && ` (minimal ${minRows} baris)`}
      </p>
    </div>
  );
}

// Export with generic support
export function DynamicTable<T extends RowData>(props: DynamicTableProps<T>) {
  return <DynamicTableInner {...props} />;
}

// Preset configurations for common use cases
export const WORK_HISTORY_COLUMNS: ColumnConfig<any>[] = [
  { key: "namaInstansi", label: "Nama Instansi", type: "text", required: true, placeholder: "Nama rumah sakit/klinik/fasilitas kesehatan" },
  { key: "jabatan", label: "Jabatan", type: "text", required: true, placeholder: "Jabatan/posisi" },
  { key: "periodeMulai", label: "Periode Mulai", type: "date", required: true },
  { key: "periodeSelesai", label: "Periode Selesai", type: "date", required: false },
  { key: "deskripsi", label: "Deskripsi Pekerjaan", type: "textarea", placeholder: "Deskripsi singkat tugas dan tanggung jawab" },
];

export const TRAINING_COLUMNS: ColumnConfig<any>[] = [
  { key: "namaPelatihan", label: "Nama Pelatihan", type: "text", required: true, placeholder: "Nama pelatihan/sertifikasi" },
  { key: "penyelenggara", label: "Penyelenggara", type: "text", required: true, placeholder: "Lembaga penyelenggara" },
  { key: "tahun", label: "Tahun", type: "date", required: true },
  { key: "jumlahJam", label: "Jumlah Jam", type: "number", placeholder: "Jumlah jam pelatihan" },
  { key: "sertifikat", label: "No. Sertifikat", type: "text", placeholder: "Nomor sertifikat (jika ada)" },
];

export const PORTOFOLIO_COLUMNS: ColumnConfig<any>[] = [
  { key: "judul", label: "Judul Portofolio", type: "text", required: true, placeholder: "Judul karya/portofolio" },
  { key: "kategori", label: "Kategori", type: "select", options: [
    { value: "penelitian", label: "Penelitian" },
    { value: "publikasi", label: "Publikasi Ilmiah" },
    { value: "presentasi", label: "Presentasi/Seminar" },
    { value: "inovasi", label: "Inovasi/Karya Cipta" },
    { value: "lainnya", label: "Lainnya" },
  ]},
  { key: "tahun", label: "Tahun", type: "date", required: true },
  { key: "deskripsi", label: "Deskripsi", type: "textarea", placeholder: "Deskripsi singkat portofolio" },
];

export default DynamicTable;
