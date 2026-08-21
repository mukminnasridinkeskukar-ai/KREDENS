"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  UploadIcon,
  FileIcon,
  XIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  InfoIcon,
  ShieldCheckIcon,
  EyeOffIcon,
  MinusIcon,
} from "lucide-react";

// Types
export type KewenanganLevel = "MANDIRI" | "DENGAN_SUPERVISI" | "TIDAK_DIAJUKAN";

export interface KewenanganKlinis {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  kategori?: string;
  level: KewenanganLevel;
  alasan: string;
  buktiFile?: File | null;
  buktiFileName?: string;
}

export interface KewenanganKlinisTableProps {
  /** List of kewenangan klinis */
  kewenanganList: KewenanganKlinis[];
  /** Callback when data changes */
  onChange?: (data: KewenanganKlinis[]) => void;
  /** Whether table is disabled (read-only mode) */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Show expandable descriptions */
  expandable?: boolean;
  /** Accept file types for upload */
  accept?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
}

// Level configuration
export const KEWENANGAN_LEVEL_CONFIG: Record<KewenanganLevel, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  MANDIRI: {
    label: "Mandiri",
    description: "Dapat melaksanakan tindakan secara mandiri tanpa pengawasan",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-300 dark:border-emerald-600",
  },
  DENGAN_SUPERVISI: {
    label: "Dengan Supervisi",
    description: "Dapat melaksanakan dengan pengawasan/bimbingan tenaga kesehatan senior",
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-300 dark:border-amber-600",
  },
  TIDAK_DIAJUKAN: {
    label: "Tidak Diajukan",
    description: "Tidak mengajukan kewenangan ini saat ini",
    icon: <EyeOffIcon className="h-4 w-4" />,
    color: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
  },
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function KewenanganKlinisTable({
  kewenanganList = [],
  onChange,
  disabled = false,
  className,
  expandable = true,
  accept = ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: KewenanganKlinisTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toggle row expansion
  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle level change
  const handleLevelChange = useCallback(
    (id: string, level: KewenanganLevel) => {
      if (disabled) return;

      const updatedList = kewenanganList.map((item) =>
        item.id === id ? { ...item, level } : item
      );
      onChange?.(updatedList);

      // Clear error
      if (errors[id]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    },
    [kewenanganList, disabled, onChange, errors]
  );

  // Handle reason change
  const handleAlasanChange = useCallback(
    (id: string, alasan: string) => {
      if (disabled) return;

      const updatedList = kewenanganList.map((item) =>
        item.id === id ? { ...item, alasan } : item
      );
      onChange?.(updatedList);
    },
    [kewenanganList, disabled, onChange]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (id: string, file: File) => {
      if (disabled) return;

      // Validate file type
      if (!accept.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [id]: `Tipe file tidak didukung. Gunakan: PDF, JPG, PNG`,
        }));
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setErrors((prev) => ({
          ...prev,
          [id]: `Ukuran file terlalu besar. Maksimal ${formatFileSize(maxFileSize)}`,
        }));
        return;
      }

      const updatedList = kewenanganList.map((item) =>
        item.id === id
          ? { ...item, buktiFile: file, buktiFileName: file.name }
          : item
      );
      onChange?.(updatedList);

      // Clear error
      if (errors[id]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    },
    [accept, disabled, errors, kewenanganList, maxFileSize, onChange]
  );

  // Handle file removal
  const handleFileRemove = useCallback(
    (id: string) => {
      if (disabled) return;

      const updatedList = kewenanganList.map((item) =>
        item.id === id ? { ...item, buktiFile: null, buktiFileName: undefined } : item
      );
      onChange?.(updatedList);
    },
    [disabled, kewenanganList, onChange]
  );

  // Get summary statistics
  const getSummary = () => {
    const total = kewenanganList.length;
    const mandiri = kewenanganList.filter((k) => k.level === "MANDIRI").length;
    const supervisi = kewenanganList.filter((k) => k.level === "DENGAN_SUPERVISI").length;
    const tidakDiajukan = kewenanganList.filter((k) => k.level === "TIDAK_DIAJUKAN").length;
    const withBukti = kewenanganList.filter((k) => k.buktiFile).length;

    return { total, mandiri, supervisi, tidakDiajukan, withBukti };
  };

  const summary = getSummary();

  // Group by category
  const groupedByCategory = kewenanganList.reduce(
    (acc, item) => {
      const category = item.kategori || "Umum";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, KewenanganKlinis[]>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{summary.total}</p>
          <p className="text-xs text-slate-500">Total Kewenangan</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", KEWENANGAN_LEVEL_CONFIG.MANDIRI.bgColor, KEWENANGAN_LEVEL_CONFIG.MANDIRI.borderColor)}>
          <p className={cn("text-2xl font-bold", KEWENANGAN_LEVEL_CONFIG.MANDIRI.color)}>{summary.mandiri}</p>
          <p className="text-xs text-slate-600">Mandiri</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", KEWENANGAN_LEVEL_CONFIG.DENGAN_SUPERVISI.bgColor, KEWENANGAN_LEVEL_CONFIG.DENGAN_SUPERVISI.borderColor)}>
          <p className={cn("text-2xl font-bold", KEWENANGAN_LEVEL_CONFIG.DENGAN_SUPERVISI.color)}>{summary.supervisi}</p>
          <p className="text-xs text-slate-600">Supervisi</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", KEWENANGAN_LEVEL_CONFIG.TIDAK_DIAJUKAN.bgColor, KEWENANGAN_LEVEL_CONFIG.TIDAK_DIAJUKAN.borderColor)}>
          <p className={cn("text-2xl font-bold", KEWENANGAN_LEVEL_CONFIG.TIDAK_DIAJUKAN.color)}>{summary.tidakDiajukan}</p>
          <p className="text-xs text-slate-600">Tidak Diajukan</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-[#0d9488]">{summary.withBukti}</p>
          <p className="text-xs text-slate-500">Ada Bukti</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[220px]">Kewenangan Klinis</TableHead>
                <TableHead className="min-w-[250px]">Usulan Level</TableHead>
                <TableHead className="min-w-[200px]">Alasan / Justifikasi</TableHead>
                <TableHead className="min-w-[180px]">Bukti Pendukung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kewenanganList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <InfoIcon className="h-8 w-8 text-slate-400" />
                      <p>Belum ada data kewenangan klinis</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                kewenanganList.map((item, index) => {
                  const isExpanded = expandedRows.has(item.id);
                  const hasError = !!errors[item.id];
                  const levelConfig = KEWENANGAN_LEVEL_CONFIG[item.level];

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        hasError && "bg-red-50/50 dark:bg-red-900/10",
                        !disabled && "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {/* Row Number */}
                      <TableCell className="font-medium text-slate-500">
                        {index + 1}
                      </TableCell>

                      {/* Kewenangan Info */}
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-[#0d9488] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                              {item.kode}
                            </span>
                            {item.kategori && (
                              <Badge variant="secondary" className="text-xs">
                                {item.kategori}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {item.nama}
                          </p>

                          {/* Expand/Collapse Button */}
                          {expandable && item.deskripsi && (
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(item.id)}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#0d9488] transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUpIcon className="h-3 w-3" />
                                  Sembunyikan deskripsi
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="h-3 w-3" />
                                  Lihat deskripsi
                                </>
                              )}
                            </button>
                          )}

                          {/* Description */}
                          {isExpanded && item.deskripsi && (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {item.deskripsi}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Level Selector */}
                      <TableCell>
                        {hasError && (
                          <div className="flex items-center gap-1 text-xs text-red-500 mb-2">
                            <AlertTriangleIcon className="h-3 w-3" />
                            {errors[item.id]}
                          </div>
                        )}

                        <RadioGroup
                          value={item.level || ""}
                          onValueChange={(value) =>
                            handleLevelChange(item.id, value as KewenanganLevel)
                          }
                          disabled={disabled}
                          className="gap-2"
                        >
                          {(Object.entries(KEWENANGAN_LEVEL_CONFIG) as [KewenanganLevel, typeof KEWENANGAN_LEVEL_CONFIG[KewenanganLevel]][]).map(
                            ([level, config]) => (
                              <Label
                                key={level}
                                htmlFor={`${item.id}-level-${level}`}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                  item.level === level
                                    ? `${config.bgColor} ${config.color} ${config.borderColor}`
                                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                              >
                                <RadioGroupItem
                                  id={`${item.id}-level-${level}`}
                                  value={level}
                                  className="sr-only"
                                />
                                <span className="shrink-0">{config.icon}</span>
                                <span className="text-xs font-medium">
                                  {config.label}
                                </span>
                              </Label>
                            )
                          )}
                        </RadioGroup>
                      </TableCell>

                      {/* Alasan Textarea */}
                      <TableCell>
                        <Textarea
                          value={item.alasan}
                          onChange={(e) => handleAlasanChange(item.id, e.target.value)}
                          placeholder={
                            item.level === "TIDAK_DIAJUKAN"
                              ? "Alasan tidak mengajukan..."
                              : item.level === "DENGAN_SUPERVISI"
                              ? "Justifikasi kebutuhan supervisi..."
                              : "Justifikasi kemampuan mandiri..."
                          }
                          disabled={disabled}
                          className="min-h-[80px] max-h-[120px] resize-y text-sm"
                          rows={3}
                        />
                      </TableCell>

                      {/* Bukti Pendukung Upload */}
                      <TableCell>
                        <div className="space-y-2">
                          {!item.buktiFile ? (
                            <label
                              className={cn(
                                "flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                                disabled
                                  ? "border-slate-200 cursor-not-allowed opacity-60"
                                  : "border-slate-300 hover:border-[#0d9488] hover:bg-teal-50/50 dark:hover:bg-teal-900/10"
                              )}
                            >
                              <input
                                type="file"
                                accept={accept.join(",")}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(item.id, file);
                                  e.target.value = "";
                                }}
                                disabled={disabled}
                                className="sr-only"
                              />
                              <UploadIcon className={cn("h-5 w-5", disabled ? "text-slate-400" : "text-slate-500")} />
                              <span className="text-xs text-slate-500 text-center">
                                Upload Bukti
                              </span>
                            </label>
                          ) : (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                              <FileIcon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                                  {item.buktiFileName}
                                </p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  {item.buktiFile.size && formatFileSize(item.buktiFile.size)}
                                </p>
                              </div>
                              {!disabled && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleFileRemove(item.id)}
                                  className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                >
                                  <XIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
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

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Keterangan Usulan Kewenangan:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.entries(KEWENANGAN_LEVEL_CONFIG) as [KewenanganLevel, typeof KEWENANGAN_LEVEL_CONFIG[KewenanganLevel]][]).map(
            ([level, config]) => (
              <div
                key={level}
                className={cn("flex items-start gap-3 p-3 rounded-lg border", config.bgColor, config.borderColor)}
              >
                <span className="shrink-0">{config.icon}</span>
                <div>
                  <p className={cn("text-sm font-semibold", config.color)}>
                    {config.label}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {config.description}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default KewenanganKlinisTable;
