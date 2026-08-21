"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FormSection,
  FormFieldRow,
} from "../form-step-container";
import { FileUpload, UploadedFile } from "../file-upload";
import {
  FileCheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  CalendarIcon,
  UploadIcon,
  ShieldIcon,
  BuildingIcon,
  SaveIcon,
  CheckCircle2Icon,
  ClockIcon,
  InfoIcon,
} from "lucide-react";

// Types for STR/SIP data
export interface StrSipData {
  // STR Data
  nomorStr: string;
  tanggalTerbitStr: string;
  tanggalBerakhirStr: string;
  strFile: UploadedFile[];

  // SIP Data
  nomorSip: string;
  tanggalTerbitSip: string;
  tanggalBerakhirSip: string;
  sipFile: UploadedFile[];
}

export interface StepStrSipProps {
  data: Partial<StrSipData>;
  onChange: (data: Partial<StrSipData>) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
}

// Document status types
type DocumentStatus = "valid" | "warning" | "invalid" | "empty" | "pending";

// Initial state
const initialData: StrSipData = {
  nomorStr: "",
  tanggalTerbitStr: "",
  tanggalBerakhirStr: "",
  strFile: [],

  nomorSip: "",
  tanggalTerbitSip: "",
  tanggalBerakhirSip: "",
  sipFile: [],
};

// Helper function to calculate document status based on expiry date and file upload
const calculateDocumentStatus = (
  expiryDate: string | undefined,
  files: UploadedFile[] | undefined
): DocumentStatus => {
  // No file uploaded
  if (!files || files.length === 0) {
    if (!expiryDate) return "empty";
    return "warning"; // Has date but no file
  }

  // Check if any file has error status
  const hasError = files.some((f) => f.status === "error");
  if (hasError) return "invalid";

  // Check if all files are valid
  const allValid = files.every((f) => f.status === "valid");
  if (!allValid && !hasError) return "warning";

  // Check expiry date
  if (expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    
    // Already expired
    if (expiry < today) {
      return "invalid";
    }

    // Calculate days until expiry
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Less than 6 months (180 days)
    if (diffDays <= 180) {
      return allValid ? "warning" : "empty";
    }

    // Valid with more than 6 months
    return allValid ? "valid" : "warning";
  }

  // Has file but no date
  return allValid ? "valid" : "warning";
};

// Get status config
const getStatusConfig = (
  status: DocumentStatus
): {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} => {
  switch (status) {
    case "valid":
      return {
        icon: <CheckCircle2Icon className="h-5 w-5" />,
        label: "Dokumen valid",
        colorClass: "text-emerald-600 dark:text-emerald-400",
        bgClass: "bg-emerald-50 dark:bg-emerald-900/20",
        borderClass: "border-emerald-200 dark:border-emerald-800",
      };
    case "warning":
      return {
        icon: <AlertTriangleIcon className="h-5 w-5" />,
        label:
          "Dokumen belum diupload / akan segera berakhir",
        colorClass: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-50 dark:bg-amber-900/20",
        borderClass: "border-amber-200 dark:border-amber-800",
      };
    case "invalid":
      return {
        icon: <XCircleIcon className="h-5 w-5" />,
        label: "Dokumen tidak valid / sudah berakhir",
        colorClass: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200 dark:border-red-800",
      };
    case "empty":
    default:
      return {
        icon: <InfoIcon className="h-5 w-5" />,
        label: "Belum diisi",
        colorClass: "text-slate-500 dark:text-slate-400",
        bgClass: "bg-slate-50 dark:bg-slate-800",
        borderClass: "border-slate-200 dark:border-slate-700",
      }
  }
};

// Calculate days until expiry
const getDaysUntilExpiry = (expiryDate: string): number | null => {
  if (!expiryDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format date to Indonesian locale
const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return "-";
  
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function StepStrSip({
  data = initialData,
  onChange,
  errors = {},
  onSaveDraft,
}: StepStrSipProps) {
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<StrSipData>>({
    ...initialData,
    ...data,
  });

  // Validation state
  const [validationErrors, setValidationErrors] =
    useState<Record<string, string>>(errors);

  // Auto-save draft timer
  const [draftSaved, setDraftSaved] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Calculate document statuses
  const strStatus = calculateDocumentStatus(
    formData.tanggalBerakhirStr,
    formData.strFile
  );
  const sipStatus = calculateDocumentStatus(
    formData.tanggalBerakhirSip,
    formData.sipFile
  );

  // Sync external data changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  // Sync external errors
  useEffect(() => {
    setValidationErrors(errors);
  }, [errors]);

  // Auto-save draft functionality
  const triggerAutoSave = useCallback(
    (newData: Partial<StrSipData>) => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        onChange(newData);
        if (onSaveDraft) {
          onSaveDraft();
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000);
        }
      }, 1500);

      setAutoSaveTimer(timer);
    },
    [autoSaveTimer, onChange, onSaveDraft]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Handle field change
  const handleChange = useCallback(
    (field: keyof StrSipData, value: string | UploadedFile[]) => {
      const newData = { ...formData, [field]: value };
      setFormData(newData);

      // Clear validation error on change
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }

      // Trigger auto-save
      triggerAutoSave(newData);
    },
    [formData, validationErrors, triggerAutoSave]
  );

  // Validate specific field
  const validateField = useCallback(
    (field: keyof StrSipData, value: string): string | null => {
      switch (field) {
        case "nomorStr":
          if (!value || value.trim() === "") return "Nomor STR wajib diisi";
          return null;
        case "nomorSip":
          if (!value || value.trim() === "") return "Nomor SIP wajib diisi";
          return null;
        case "tanggalTerbitStr":
          if (!value) return "Tanggal terbit STR wajib diisi";
          return null;
        case "tanggalBerakhirStr":
          if (!value) return "Tanggal berakhir STR wajib diisi";
          return null;
        case "tanggalTerbitSip":
          if (!value) return "Tanggal terbit SIP wajib diisi";
          return null;
        case "tanggalBerakhirSip":
          if (!value) return "Tanggal berakhir SIP wajib diisi";
          return null;
        default:
          return null;
      }
    },
    []
  );

  // Handle blur for inline validation
  const handleBlur = useCallback(
    (field: keyof StrSipData, value: string) => {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [validateField]
  );

  // Get field error or empty string
  const getFieldError = (field: string): string => {
    return validationErrors[field] || "";
  };

  // Check if field has error
  const hasError = (field: string): boolean => {
    return !!validationErrors[field];
  };

  // Status indicator component
  const StatusIndicator = ({
    status,
    daysUntilExpiry,
  }: {
    status: DocumentStatus;
    daysUntilExpiry: number | null;
  }) => {
    const config = getStatusConfig(status);

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          config.bgClass,
          config.borderClass,
          "border"
        )}
      >
        <span className={config.colorClass}>{config.icon}</span>
        <span className={cn("font-medium", config.colorClass)}>
          {config.label}
        </span>
        {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
          <span className={cn("ml-auto text-xs", config.colorClass)}>
            <ClockIcon className="inline h-3.5 w-3.5 mr-1" />
            {daysUntilExpiry} hari lagi
          </span>
        )}
        {daysUntilExpiry !== null && daysUntilExpiry < 0 && (
          <span className="ml-auto text-xs text-red-600 font-medium">
            Berlalu {Math.abs(daysUntilExpiry)} hari yang lalu
          </span>
        )}
      </div>
    );
  };

  // Expiry warning component
  const ExpiryWarning = ({ days }: { days: number | null }) => {
    if (days === null || days > 180) return null;

    return (
      <div
        className={cn(
          "mt-2 p-3 rounded-lg flex items-start gap-2 text-sm",
          days < 0
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
        )}
      >
        <AlertTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          {days < 0 ? (
            <>
              <p className="font-medium">Dokumen Sudah Berakhir!</p>
              <p className="text-xs mt-0.5">
                Dokumen ini telah berakhir{" "}
                <strong>{Math.abs(days)} hari</strong> yang lalu.
                Segera perbarui dokumen Anda.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">Peringatan Masa Berlaku</p>
              <p className="text-xs mt-0.5">
                Dokumen ini akan berakhir dalam{" "}
                <strong>{days} hari</strong> (kurang dari 6 bulan).
                Segera lakukan perpanjangan jika diperlukan.
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* STR Section */}
      <FormSection
        title={
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-[#1e3a5f]" />
            Surat Tanda Registrasi (STR)
          </div>
        }
        description="Upload dokumen STR yang masih berlaku dari Kemenkes"
        className={cn(
          strStatus === "invalid" && "ring-2 ring-red-300 dark:ring-red-800",
          strStatus === "warning" && "ring-2 ring-amber-300 dark:ring-amber-800"
        )}
      >
        {/* STR Number & Status Row */}
        <div className="space-y-4">
          {/* Nomor STR */}
          <div className="space-y-2">
            <Label htmlFor="nomorStr">
              Nomor STR
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="nomorStr"
              placeholder="Contoh: 1234567890123456"
              value={formData.nomorStr || ""}
              onChange={(e) => handleChange("nomorStr", e.target.value)}
              onBlur={() => handleBlur("nomorStr", formData.nomorStr || "")}
              className={cn(
                hasError("nomorStr") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {hasError("nomorStr") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <XCircleIcon className="h-4 w-4" />
                {getFieldError("nomorStr")}
              </p>
            )}
          </div>

          {/* Date Fields */}
          <FormFieldRow columns={2}>
            {/* Tanggal Terbit STR */}
            <div className="space-y-2">
              <Label htmlFor="tanggalTerbitStr">
                Tanggal Terbit
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="tanggalTerbitStr"
                  type="date"
                  value={formData.tanggalTerbitStr || ""}
                  onChange={(e) =>
                    handleChange("tanggalTerbitStr", e.target.value)
                  }
                  onBlur={() =>
                    handleBlur(
                      "tanggalTerbitStr",
                      formData.tanggalTerbitStr || ""
                    )
                  }
                  className={cn(
                    "pl-10",
                    hasError("tanggalTerbitStr") &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              {hasError("tanggalTerbitStr") && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {getFieldError("tanggalTerbitStr")}
                </p>
              )}
            </div>

            {/* Tanggal Berakhir STR */}
            <div className="space-y-2">
              <Label htmlFor="tanggalBerakhirStr">
                Tanggal Berakhir
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="tanggalBerakhirStr"
                  type="date"
                  value={formData.tanggalBerakhirStr || ""}
                  onChange={(e) =>
                    handleChange("tanggalBerakhirStr", e.target.value)
                  }
                  onBlur={() =>
                    handleBlur(
                      "tanggalBerakhirStr",
                      formData.tanggalBerakhirStr || ""
                    )
                  }
                  className={cn(
                    "pl-10",
                    hasError("tanggalBerakhirStr") &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  min={
                    formData.tanggalTerbitStr ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              {hasError("tanggalBerakhirStr") && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {getFieldError("tanggalBerakhirStr")}
                </p>
              )}
            </div>
          </FormFieldRow>

          {/* Expiry Warning */}
          <ExpiryWarning days={getDaysUntilExpiry(formData.tanggalBerakhirStr || "")} />

          {/* STR File Upload */}
          <div className="mt-4">
            <FileUpload
              label="Unggah Dokumen STR"
              description="Format: PDF, JPG, JPEG, PNG. Maksimal 10MB. Pastikan dokumen jelas dan terbaca."
              value={formData.strFile || []}
              onChange={(files) => handleChange("strFile", files)}
              accept={[
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
              ]}
              maxSize={10 * 1024 * 1024}
              multiple={false}
              required
              error={errors?.strFile}
            />
          </div>

          {/* STR Status Indicator */}
          <StatusIndicator
            status={strStatus}
            daysUntilExpiry={getDaysUntilExpiry(formData.tanggalBerakhirStr || "")}
          />
        </div>
      </FormSection>

      {/* SIP Section */}
      <FormSection
        title={
          <div className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5 text-[#1e3a5f]" />
            Izin Praktik (SIP)
          </div>
        }
        description="Upload dokumen SIP yang diterbitkan oleh Dinkes/Dinas Kesehatan setempat"
        className={cn(
          sipStatus === "invalid" && "ring-2 ring-red-300 dark:ring-red-800",
          sipStatus === "warning" && "ring-2 ring-amber-300 dark:ring-amber-800"
        )}
      >
        {/* SIP Number & Status Row */}
        <div className="space-y-4">
          {/* Nomor SIP */}
          <div className="space-y-2">
            <Label htmlFor="nomorSip">
              Nomor SIP
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="nomorSip"
              placeholder="Contoh: SIP.001/2024/DINKES"
              value={formData.nomorSip || ""}
              onChange={(e) => handleChange("nomorSip", e.target.value)}
              onBlur={() => handleBlur("nomorSip", formData.nomorSip || "")}
              className={cn(
                hasError("nomorSip") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {hasError("nomorSip") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <XCircleIcon className="h-4 w-4" />
                {getFieldError("nomorSip")}
              </p>
            )}
          </div>

          {/* Date Fields */}
          <FormFieldRow columns={2}>
            {/* Tanggal Terbit SIP */}
            <div className="space-y-2">
              <Label htmlFor="tanggalTerbitSip">
                Tanggal Terbit
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="tanggalTerbitSip"
                  type="date"
                  value={formData.tanggalTerbitSip || ""}
                  onChange={(e) =>
                    handleChange("tanggalTerbitSip", e.target.value)
                  }
                  onBlur={() =>
                    handleBlur(
                      "tanggalTerbitSip",
                      formData.tanggalTerbitSip || ""
                    )
                  }
                  className={cn(
                    "pl-10",
                    hasError("tanggalTerbitSip") &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              {hasError("tanggalTerbitSip") && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {getFieldError("tanggalTerbitSip")}
                </p>
              )}
            </div>

            {/* Tanggal Berakhir SIP */}
            <div className="space-y-2">
              <Label htmlFor="tanggalBerakhirSip">
                Tanggal Berakhir
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="tanggalBerakhirSip"
                  type="date"
                  value={formData.tanggalBerakhirSip || ""}
                  onChange={(e) =>
                    handleChange("tanggalBerakhirSip", e.target.value)
                  }
                  onBlur={() =>
                    handleBlur(
                      "tanggalBerakhirSip",
                      formData.tanggalBerakhirSip || ""
                    )
                  }
                  className={cn(
                    "pl-10",
                    hasError("tanggalBerakhirSip") &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  min={
                    formData.tanggalTerbitSip ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
              {hasError("tanggalBerakhirSip") && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4" />
                  {getFieldError("tanggalBerakhirSip")}
                </p>
              )}
            </div>
          </FormFieldRow>

          {/* Expiry Warning */}
          <ExpiryWarning days={getDaysUntilExpiry(formData.tanggalBerakhirSip || "")} />

          {/* SIP File Upload */}
          <div className="mt-4">
            <FileUpload
              label="Unggah Dokumen SIP"
              description="Format: PDF, JPG, JPEG, PNG. Maksimal 10MB. Pastikan dokumen jelas dan terbaca."
              value={formData.sipFile || []}
              onChange={(files) => handleChange("sipFile", files)}
              accept={[
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
              ]}
              maxSize={10 * 1024 * 1024}
              multiple={false}
              required
              error={errors?.sipFile}
            />
          </div>

          {/* SIP Status Indicator */}
          <StatusIndicator
            status={sipStatus}
            daysUntilExpiry={getDaysUntilExpiry(formData.tanggalBerakhirSip || "")}
          />
        </div>
      </FormSection>

      {/* Summary Section */}
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <h4 className="font-semibold text-sm text-[#1e3a5f] dark:text-teal-400 mb-4 flex items-center gap-2">
          <FileCheckIcon className="h-5 w-5" />
          Ringkasan Status Dokumen
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* STR Summary */}
          <div
            className={cn(
              "p-4 rounded-lg border",
              getStatusConfig(strStatus).bgClass,
              getStatusConfig(strStatus).borderClass
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Surat Tanda Registrasi</span>
              <span className={getStatusConfig(strStatus).colorClass}>
                {getStatusConfig(strStatus).icon}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-slate-600 dark:text-slate-400">
                Nomor: <strong>{formData.nomorStr || "-"}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Berlaku s/d: <strong>{formatDateIndo(formData.tanggalBerakhirStr || "")}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Dokumen: <strong>{formData.strFile?.length ? `${formData.strFile.length} file` : "Belum upload"}</strong>
              </p>
            </div>
          </div>

          {/* SIP Summary */}
          <div
            className={cn(
              "p-4 rounded-lg border",
              getStatusConfig(sipStatus).bgClass,
              getStatusConfig(sipStatus).borderClass
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Izin Praktik</span>
              <span className={getStatusConfig(sipStatus).colorClass}>
                {getStatusConfig(sipStatus).icon}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-slate-600 dark:text-slate-400">
                Nomor: <strong>{formData.nomorSip || "-"}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Berlaku s/d: <strong>{formatDateIndo(formData.tanggalBerakhirSip || "")}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Dokumen: <strong>{formData.sipFile?.length ? `${formData.sipFile.length} file` : "Belum upload"}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 md:p-6">
        <div className="flex gap-3">
          <InfoIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-2">
              Penting!
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1.5 list-disc list-inside">
              <li>Pastikan dokumen STR dan SIP masih berlaku saat pengajuan kredensial</li>
              <li>Dokumen yang akan segera berakhir (&lt; 6 bulan) akan ditandai dengan peringatan</li>
              <li>Upload dokumen dalam format yang jelas dan mudah dibaca</li>
              <li>Dokumen palsu atau dimanipulasi akan menyebabkan penolakan kredensial</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium",
          draftSaved
            ? "bg-emerald-500 text-white translate-y-0 opacity-100"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <SaveIcon className="h-4 w-4" />
        Draft tersimpan
      </div>
    </div>
  );
}

export default StepStrSip;
