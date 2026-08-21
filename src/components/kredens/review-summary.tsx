"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserIcon,
  StethoscopeIcon,
  GraduationCapIcon,
  FileTextIcon,
  BriefcaseIcon,
  AwardIcon,
  ShieldCheckIcon,
  SendIcon,
  PencilIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  FileCheckIcon,
} from "lucide-react";

// Types
export interface ReviewSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown>;
  isComplete: boolean;
  onEdit?: () => void;
}

export interface ReviewSummaryProps {
  /** Sections to display */
  sections: ReviewSection[];
  /** Callback for final submission */
  onSubmit?: () => void;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Custom class name */
  className?: string;
  /** Show confirmation dialog */
  showConfirmation?: boolean;
  /** Confirmation dialog title */
  confirmTitle?: string;
  /** Confirmation dialog message */
  confirmMessage?: string;
}

export function ReviewSummary({
  sections = [],
  onSubmit,
  isSubmitting = false,
  className,
  showConfirmation = true,
  confirmTitle = "Konfirmasi Pengajuan",
  confirmMessage = "Apakah Anda yakin ingin mengajukan kredensial ini? Pastikan semua data yang Anda masukkan sudah benar dan lengkap.",
}: ReviewSummaryProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  // Toggle section expansion
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Check if all sections are complete
  const allComplete = sections.every((section) => section.isComplete);

  // Handle submit with optional confirmation
  const handleSubmit = () => {
    if (showConfirmation) {
      setShowConfirmDialog(true);
    } else {
      onSubmit?.();
    }
  };

  // Confirm submission
  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    onSubmit?.();
  };

  // Render value based on type
  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-400 italic">-</span>;
    }

    if (typeof value === "boolean") {
      return value ? (
        <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
          Ya
        </Badge>
      ) : (
        <Badge variant="outline" className="text-slate-500">
          Tidak
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-400 italic">Tidak ada data</span>;
      }
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 dark:text-slate-300">
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      // Check if it's a file object
      if ("name" in (value as object)) {
        return (
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-600">{(value as { name: string }).name}</span>
          </div>
        );
      }
      return <span className="text-sm">{JSON.stringify(value)}</span>;
    }

    return <span className="text-sm text-slate-700 dark:text-slate-300">{String(value)}</span>;
  };

  // Format label from key
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ");
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0d9488]/10 mb-4">
          <FileCheckIcon className="h-8 w-8 text-[#0d9488]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1e3a5f] dark:text-teal-400">
          Ringkasan Pengajuan Kredensial
        </h2>
        <p className="text-slate-500 mt-2">
          Periksa kembali semua data sebelum mengajukan kredensial Anda.
        </p>
      </div>

      {/* Completion Status */}
      <Card className={cn(
        "mb-6 border-2",
        allComplete ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10"
      )}>
        <CardContent className="flex items-center gap-4 p-4">
          {allComplete ? (
            <>
              <CheckCircle2Icon className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Semua Data Lengkap
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Semua bagian telah diisi dan siap untuk diajukan.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangleIcon className="h-8 w-8 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Ada Data yang Belum Lengkap
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Beberapa bagian perlu dilengkapi sebelum dapat diajukan.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards - Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <CardContent className="p-0">
            <p className="text-3xl font-bold text-[#1e3a5f]">{sections.length}</p>
            <p className="text-xs text-slate-500">Total Bagian</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-0">
            <p className="text-3xl font-bold text-emerald-600">
              {sections.filter((s) => s.isComplete).length}
            </p>
            <p className="text-xs text-slate-500">Lengkap</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-amber-200 bg-amber-50/30">
          <CardContent className="p-0">
            <p className="text-3xl font-bold text-amber-600">
              {sections.filter((s) => !s.isComplete).length}
            </p>
            <p className="text-xs text-slate-500">Perlu Dicek</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center">
          <CardContent className="p-0">
            <p className="text-3xl font-bold text-[#0d9488]">
              {Math.round((sections.filter((s) => s.isComplete).length / sections.length) * 100)}%
            </p>
            <p className="text-xs text-slate-500">Kelengkapan</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Cards */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const dataEntries = Object.entries(section.data);

          return (
            <Card
              key={section.id}
              className={cn(
                "overflow-hidden transition-all duration-200",
                !section.isComplete && "border-amber-200"
              )}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    section.isComplete
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                  )}
                >
                  {section.icon}
                </div>

                {/* Title & Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      {section.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        section.isComplete
                          ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                          : "border-amber-300 text-amber-600 bg-amber-50"
                      }
                    >
                      {section.isComplete ? "Lengkap" : "Belum Lengkap"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {dataEntries.length} item data
                  </p>
                </div>

                {/* Edit Button */}
                {section.onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      section.onEdit?.();
                    }}
                    className="gap-1.5 text-[#0d9488] hover:bg-teal-50 shrink-0"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}

                {/* Expand/Collapse Icon */}
                <button
                  type="button"
                  className="shrink-0 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(section.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-slate-500" />
                  )}
                </button>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4">
                  <Separator className="mb-4" />

                  {/* Data Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dataEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          {formatLabel(key)}
                        </p>
                        <div className="mt-1">{renderValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Submit Button Area */}
      <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] dark:from-[#0f2744] dark:to-[#1e3a5f]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <p className="font-semibold text-lg">Siap Mengajukan?</p>
            <p className="text-white/70 text-sm mt-1">
              Pastikan semua data yang Anda masukkan sudah benar dan lengkap.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!allComplete || isSubmitting}
            size="lg"
            className={cn(
              "gap-2 bg-gradient-to-r from-[#059669] to-[#0d9488] hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 px-8",
              (!allComplete || isSubmitting) && "opacity-60 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <SendIcon className="h-5 w-5" />
                Ajukan Kredensial Sekarang
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
            Informasi Penting
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
            <li>Pengajuan yang telah dikirim tidak dapat dibatalkan secara otomatis</li>
            <li>Anda dapat memantau status pengajuan melalui halaman tracking</li>
            <li>Hubungi admin jika ada kesalahan data setelah pengajuan</li>
          </ul>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#0d9488]/10 flex items-center justify-center">
                <SendIcon className="h-5 w-5 text-[#0d9488]" />
              </div>
              {confirmTitle}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                Dengan menekan tombol &quot;Konfirmasi Ajukan&quot;, Anda menyatakan bahwa:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1 list-disc list-inside">
                <li>Semua data yang dimasukkan adalah benar</li>
                <li>Dokumen yang diunggah adalah dokumen asli</li>
                <li>Bersedia menerima konsekuensi jika terbukti data palsu</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 sm:flex-none"
            >
              Batalkan
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-[#059669] to-[#0d9488] hover:from-emerald-600 hover:to-teal-600"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  Konfirmasi Ajukan
                  <ChevronRightIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReviewSummary;
