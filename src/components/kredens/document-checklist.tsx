"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  XIcon,
  UploadIcon,
  FileIcon,
  EyeIcon,
  RefreshCwIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import type { UploadedFile } from "./file-upload";

// Types
export type DocumentStatus = "LENGKAP" | "BELUM_UPLOAD" | "TIDAK_VALID" | "DIVERIFIKASI" | "PERBAIKAN";

export interface DocumentItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  required: boolean;
  acceptTypes: string[];
  maxSize: number; // in bytes
  status: DocumentStatus;
  file?: UploadedFile;
  catatanVerifikasi?: string;
}

export interface DocumentChecklistProps {
  /** List of documents to check */
  documents: DocumentItem[];
  /** Callback when document changes */
  onChange?: (documents: DocumentItem[]) => void;
  /** Whether checklist is disabled (read-only mode) */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Show verification mode (for admin/verifikator) */
  verificationMode?: boolean;
  /** Show detailed status info */
  showDetails?: boolean;
}

// Status configuration
export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}> = {
  LENGKAP: {
    label: "Lengkap",
    icon: <CheckCircle2Icon className="h-4 w-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-300 dark:border-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-300",
    description: "Dokumen telah diunggah dan lengkap",
  },
  BELUM_UPLOAD: {
    label: "Belum Upload",
    icon: <UploadIcon className="h-4 w-4" />,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
    textColor: "text-slate-600 dark:text-slate-400",
    description: "Dokumen belum diunggah",
  },
  TIDAK_VALID: {
    label: "Tidak Valid",
    icon: <XCircleIcon className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-300 dark:border-red-600",
    textColor: "text-red-700 dark:text-red-300",
    description: "Dokumen tidak memenuhi persyaratan",
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    icon: <CheckCircle2Icon className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-600",
    textColor: "text-blue-700 dark:text-blue-300",
    description: "Dokumen telah diverifikasi oleh verifikator",
  },
  PERBAIKAN: {
    label: "Perlu Perbaikan",
    icon: <AlertTriangleIcon className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-300",
    description: "Dokumen perlu diperbaiki sesuai catatan",
  },
};

// Default document list for KREDENS
export const DEFAULT_DOCUMENTS: Omit<DocumentItem, "id" | "status">[] = [
  {
    kode: "KTP",
    nama: "KTP (Kartu Tanda Penduduk)",
    deskripsi: "Fotokopi KTP yang masih berlaku",
    required: true,
    acceptTypes: ["image/jpeg", "image/jpg", "image/png"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  {
    kode: "IJAZAH",
    nama: "Ijazah Pendidikan Keperawatan",
    deskripsi: "Ijazah D3/S1/S2 Ners atau sederajat",
    required: true,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
  {
    kode: "STR",
    nama: "Surat Tanda Registrasi (STR)",
    deskripsi: "STR yang masih berlaku dari Kemenkes",
    required: true,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
  {
    kode: "SIP",
    nama: "Surat Izin Praktik (SIP)",
    deskripsi: "SIP yang diterbitkan oleh Dinkes Kab/Kota",
    required: true,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
  {
    kode: "SERTIFIKAT_KOMPETENSI",
    nama: "Sertifikat Kompetensi",
    deskripsi: "Sertifikat kompetensi klinis (jika ada)",
    required: false,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
  {
    kode: "SERTIFIKAT_PELATIHAN",
    nama: "Sertifikat Pelatihan",
    deskripsi: "Sertifikat pelatihan/sertifikasi terkait",
    required: false,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
  {
    kode: "SURAT_SEHAT",
    nama: "Surat Keterangan Sehat",
    deskripsi: "Surat keterangan sehat dari dokter",
    required: true,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 5 * 1024 * 1024,
  },
  {
    kode: "CV",
    nama: "Curriculum Vitae (CV)",
    deskripsi: "Daftar riwayat hidup terbaru",
    required: true,
    acceptTypes: ["application/pdf"],
    maxSize: 5 * 1024 * 1024,
  },
  {
    kode: "PORTOFOLIO",
    nama: "Portofolio",
    deskripsi: "Dokumentasi portofolio kegiatan/pengalaman",
    required: false,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 15 * 1024 * 1024,
  },
  {
    kode: "KEWENANGAN_SEBELUMNYA",
    nama: "Kewenangan Klinis Sebelumnya",
    deskripsi: "SK penetapan kewenangan klinis sebelumnya (jika ada)",
    required: false,
    acceptTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: 10 * 1024 * 1024,
  },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function DocumentChecklist({
  documents = [],
  onChange,
  disabled = false,
  className,
  verificationMode = false,
  showDetails = true,
}: DocumentChecklistProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Toggle document expansion
  const toggleExpansion = useCallback((id: string) => {
    setExpandedDoc((prev) => (prev === id ? null : id));
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (docId: string, file: File) => {
      if (disabled) return;

      const docIndex = documents.findIndex((d) => d.id === docId);
      if (docIndex === -1) return;

      const doc = documents[docIndex];

      // Validate file type
      if (!doc.acceptTypes.includes(file.type)) {
        console.error("Invalid file type");
        return;
      }

      // Validate file size
      if (file.size > doc.maxSize) {
        console.error("File too large");
        return;
      }

      const newFile: UploadedFile = {
        id: `file-${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "valid",
        progress: 100,
      };

      const updatedDocs = documents.map((d) =>
        d.id === docId
          ? { ...d, file: newFile, status: "LENGKAP" as DocumentStatus }
          : d
      );

      onChange?.(updatedDocs);
    },
    [documents, disabled, onChange]
  );

  // Handle file removal
  const handleFileRemove = useCallback(
    (docId: string) => {
      if (disabled) return;

      const updatedDocs = documents.map((d) =>
        d.id === docId
          ? { ...d, file: undefined, status: "BELUM_UPLOAD" as DocumentStatus }
          : d
      );

      onChange?.(updatedDocs);
    },
    [documents, disabled, onChange]
  );

  // Handle status change (verification mode)
  const handleStatusChange = useCallback(
    (docId: string, newStatus: DocumentStatus, catatan?: string) => {
      const updatedDocs = documents.map((d) =>
        d.id === docId
          ? { ...d, status: newStatus, catatanVerifikasi: catatan }
          : d
      );

      onChange?.(updatedDocs);
    },
    [documents, onChange]
  );

  // Get summary statistics
  const getSummary = () => {
    const total = documents.length;
    const required = documents.filter((d) => d.required).length;
    const lengkap = documents.filter((d) => d.status === "LENGKAP" || d.status === "DIVERIFIKASI").length;
    const belumUpload = documents.filter((d) => d.status === "BELUM_UPLOAD").length;
    const tidakValid = documents.filter((d) => d.status === "TIDAK_VALID" || d.status === "PERBAIKAN").length;
    const requiredLengkap = documents.filter(
      (d) => d.required && (d.status === "LENGKAP" || d.status === "DIVERIFIKASI")
    ).length;

    return { total, required, lengkap, belumUpload, tidakValid, requiredLengkap };
  };

  const summary = getSummary();
  const isComplete = summary.requiredLengkap === summary.required;

  return (
    <div className={cn("w-full", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className={cn("p-4 text-center", isComplete && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10")}>
          <CardContent className="p-0">
            <p className={cn("text-2xl font-bold", isComplete ? "text-emerald-600" : "text-[#1e3a5f]")}>
              {summary.requiredLengkap}/{summary.required}
            </p>
            <p className="text-xs text-slate-500">Wajib Lengkap</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-emerald-600">{summary.lengkap}</p>
            <p className="text-xs text-slate-500">Dokumen Lengkap</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-slate-200 bg-white dark:bg-slate-800">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-slate-500">{summary.belumUpload}</p>
            <p className="text-xs text-slate-500">Belum Upload</p>
          </CardContent>
        </Card>
        <Card className={cn("p-4 text-center", summary.tidakValid > 0 && "border-red-200 bg-red-50 dark:bg-red-900/10")}>
          <CardContent className="p-0">
            <p className={cn("text-2xl font-bold", summary.tidakValid > 0 ? "text-red-600" : "text-slate-400")}>
              {summary.tidakValid}
            </p>
            <p className="text-xs text-slate-500">Perlu Perbaikan</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Kelengkapan Dokumen Wajib
          </span>
          <span className="text-sm font-bold text-[#0d9488]">
            {Math.round((summary.requiredLengkap / summary.required) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-[#1e3a5f] to-[#0d9488]"
            )}
            style={{
              width: `${summary.required > 0 ? (summary.requiredLengkap / summary.required) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const config = DOCUMENT_STATUS_CONFIG[doc.status];
          const isExpanded = expandedDoc === doc.id;

          return (
            <Card
              key={doc.id}
              className={cn(
                "overflow-hidden transition-all duration-200",
                config.borderColor,
                doc.status === "BELUM_UPLOAD" && "opacity-80"
              )}
            >
              <CardContent className="p-0">
                {/* Main Row */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    !disabled && "cursor-pointer"
                  )}
                  onClick={() => toggleExpansion(doc.id)}
                >
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      config.bgColor,
                      config.color
                    )}
                  >
                    {config.icon}
                  </div>

                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-[#0d9488] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                        {doc.kode}
                      </span>
                      {doc.required && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                          WAJIB
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {doc.nama}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      config.bgColor,
                      config.textColor,
                      config.borderColor,
                      "shrink-0"
                    )}
                  >
                    {config.label}
                  </Badge>

                  {/* Expand/Collapse Icon */}
                  <button
                    type="button"
                    className="shrink-0 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpansion(doc.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Description */}
                    {doc.deskripsi && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 mt-3">
                        {doc.deskripsi}
                      </p>
                    )}

                    {/* File Info */}
                    <div className="space-y-3">
                      {!doc.file ? (
                        /* Upload Area */
                        !disabled && (
                          <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-[#0d9488] hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                            <input
                              type="file"
                              accept={doc.acceptTypes.join(",")}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(doc.id, file);
                                e.target.value = "";
                              }}
                              disabled={disabled}
                              className="sr-only"
                            />
                            <UploadIcon className="h-6 w-6 text-slate-400" />
                            <div className="text-center">
                              <p className="text-sm font-medium text-slate-600">
                                Klik untuk upload dokumen
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Format: {doc.acceptTypes.map(t => t.split("/")[1].toUpperCase()).join(", ")}
                                {" • Maks "}
                                {formatFileSize(doc.maxSize)}
                              </p>
                            </div>
                          </label>
                        )
                      ) : (
                        /* File Preview */
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <FileIcon className="h-8 w-8 text-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-emerald-800 dark:text-emerald-300 truncate">
                              {doc.file.name}
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              {formatFileSize(doc.file.size)}
                            </p>

                            {/* Verification Notes */}
                            {verificationMode && doc.catatanVerifikasi && (
                              <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  <strong>Catatan:</strong> {doc.catatanVerifikasi}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {doc.file.preview && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.file.preview, "_blank")}
                                className="h-8 w-8 text-blue-600"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {!disabled && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFileRemove(doc.id)}
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Verification Mode - Status Selector */}
                      {verificationMode && !disabled && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(Object.entries(DOCUMENT_STATUS_CONFIG) as [DocumentStatus, typeof DOCUMENT_STATUS_CONFIG[DocumentStatus]][]).map(
                            ([status, cfg]) => (
                              <Button
                                key={status}
                                type="button"
                                variant={doc.status === status ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(doc.id, status);
                                }}
                                className={cn(
                                  "gap-1.5 text-xs",
                                  doc.status !== status && cfg.color
                                )}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      {showDetails && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Keterangan Status Dokumen:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.entries(DOCUMENT_STATUS_CONFIG) as [DocumentStatus, typeof DOCUMENT_STATUS_CONFIG[DocumentStatus]][]).map(
              ([status, config]) => (
                <div
                  key={status}
                  className={cn("flex items-center gap-2 p-2 rounded-lg", config.bgColor)}
                >
                  <span className={config.color}>{config.icon}</span>
                  <div>
                    <p className={cn("text-xs font-semibold", config.textColor)}>
                      {config.label}
                    </p>
                    <p className="text-[10px] text-slate-500 hidden sm:block">
                      {config.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Completion Warning */}
      {!isComplete && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Dokumen Belum Lengkap
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Masih ada{" "}
              <strong>{summary.required - summary.requiredLengkap} dokumen wajib</strong> yang perlu diunggah sebelum dapat mengajukan kredensial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentChecklist;
