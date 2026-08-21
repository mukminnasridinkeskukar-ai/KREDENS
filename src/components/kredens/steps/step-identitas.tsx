"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  FormSection,
  FormFieldRow,
} from "../form-step-container";
import {
  UserIcon,
  IdCardIcon,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";

// Types
export interface IdentitasData {
  nik: string;
  namaLengkap: string;
  gelarDepan: string;
  gelarBelakang: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P" | "";
  nomorWhatsApp: string;
  email: string;
}

export interface StepIdentitasProps {
  data: Partial<IdentitasData>;
  onChange: (data: Partial<IdentitasData>) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
}

// Validation functions
const validateNIK = (nik: string): string | null => {
  if (!nik) return "NIK wajib diisi";
  if (!/^\d+$/.test(nik)) return "NIK hanya boleh berisi angka";
  if (nik.length !== 16) return "NIK harus 16 digit";
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email) return null; // Email optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Format email tidak valid";
  return null;
};

const validateWhatsApp = (phone: string): string | null => {
  if (!phone) return null; // Optional
  const cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) {
    return "Nomor WhatsApp tidak valid";
  }
  return null;
};

const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === "") {
    return `${fieldName} wajib diisi`;
  }
  return null;
};

// Initial state
const initialData: IdentitasData = {
  nik: "",
  namaLengkap: "",
  gelarDepan: "",
  gelarBelakang: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  nomorWhatsApp: "",
  email: "",
};

export function StepIdentitas({
  data = initialData,
  onChange,
  errors = {},
  onSaveDraft,
}: StepIdentitasProps) {
  // Use data from props directly as the source of truth
  // This prevents infinite loops from state synchronization
  const formData = { ...initialData, ...data };

  // Validation state - use errors from props, allow local overrides
  const [localErrors, setLocalErrors] =
    useState<Record<string, string>>({});

  // NIK check states
  const [isCheckingNIK, setIsCheckingNIK] = useState(false);
  const [nikChecked, setNikChecked] = useState(false);
  const [nikExists, setNikExists] = useState(false);
  const [nikMessage, setNikMessage] = useState("");

  // Auto-save draft timer
  const [draftSaved, setDraftSaved] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Handle field change - immediately notify parent
  const handleChange = useCallback(
    (field: keyof IdentitasData, value: string) => {
      // Immediately update parent state
      const newData = { ...formData, [field]: value };
      onChange(newData);

      // Clear validation error on change
      const mergedErrors = { ...errors, ...localErrors };
      if (mergedErrors[field]) {
        setLocalErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }

      // Reset NIK check status when NIK changes
      if (field === "nik") {
        setNikChecked(false);
        setNikExists(false);
        setNikMessage("");
      }
      
      // Trigger auto-save after debounce
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        if (onSaveDraft) {
          onSaveDraft();
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000);
        }
      }, 1500);
      setAutoSaveTimer(timer);
    },
    [formData, errors, localErrors, onChange, onSaveDraft, autoSaveTimer]
  );

  // Validate specific field
  const validateField = useCallback(
    (field: keyof IdentitasData, value: string): string | null => {
      switch (field) {
        case "nik":
          return validateNIK(value);
        case "namaLengkap":
          return validateRequired(value, "Nama Lengkap");
        case "tempatLahir":
          return validateRequired(value, "Tempat Lahir");
        case "tanggalLahir":
          return validateRequired(value, "Tanggal Lahir");
        case "jenisKelamin":
          if (!value) return "Jenis Kelamin wajib dipilih";
          return null;
        case "email":
          return validateEmail(value);
        case "nomorWhatsApp":
          return validateWhatsApp(value);
        default:
          return null;
      }
    },
    []
  );

  // Handle blur for inline validation
  const handleBlur = useCallback(
    (field: keyof IdentitasData, value: string) => {
      const error = validateField(field, value);
      if (error) {
        setLocalErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [validateField]
  );

  // Simulate NIK check API call
  const handleCheckNIK = async () => {
    const nikError = validateNIK(formData.nik || "");
    if (nikError) {
      setLocalErrors((prev) => ({ ...prev, nik: nikError }));
      return;
    }

    setIsCheckingNIK(true);
    setNikMessage("");

    try {
      // Simulate API call to check NIK
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock response - in real implementation, this would be an API call
      const mockResponse = {
        found: formData.nik === "3201010101010001", // Demo: this NIK exists
        data:
          formData.nik === "3201010101010001"
            ? {
                namaLengkap: "Dr. Ahmad Sudrajat, Sp.PD",
                gelarDepan: "dr.",
                gelarBelakang: "Sp.PD",
                tempatLahir: "Jakarta",
                tanggalLahir: "1985-03-15",
                jenisKelamin: "L" as const,
                nomorWhatsApp: "6281234567890",
                email: "ahmad.sudrajat@email.com",
              }
            : null,
      };

      setNikChecked(true);

      if (mockResponse.found && mockResponse.data) {
        setNikExists(true);
        setNikMessage(
          "NIK ditemukan! Data akan diisi otomatis. Anda dapat melakukan rekredensial."
        );
        // Auto-fill form with existing data
        const autoFilledData = {
          ...formData,
          ...mockResponse.data,
        };
        setFormData(autoFilledData);
        onChange(autoFilledData);
      } else {
        setNikExists(false);
        setNikMessage(
          "NIK belum terdaftar. Silakan lengkapi data diri Anda untuk pendaftaran baru."
        );
      }
    } catch (error) {
      setNikMessage("Terjadi kesalahan saat memeriksa NIK. Silakan coba lagi.");
    } finally {
      setIsCheckingNIK(false);
    }
  };

  // Format WhatsApp input with +62 prefix
  const handleWhatsAppChange = (value: string) => {
    let formatted = value;

    // Add +62 prefix if not present and user starts typing
    if (value && !value.startsWith("+62") && !value.startsWith("62")) {
      if (value.startsWith("0")) {
        formatted = "+62" + value.slice(1);
      } else if (value.startsWith("8")) {
        formatted = "+62" + value;
      } else {
        formatted = value;
      }
    }

    handleChange("nomorWhatsApp", formatted);
  };

  // Format NIK to only accept numbers
  const handleNIKChange = (value: string) => {
    const numericOnly = value.replace(/\D/g, "").slice(0, 16);
    handleChange("nik", numericOnly);
  };

  // Get field error or empty string
  const getFieldError = (field: string): string => {
    return { ...errors, ...localErrors }[field] || "";
  };

  // Check if field has error
  const hasError = (field: string): boolean => {
    return !!{ ...errors, ...localErrors }[field];
  };

  return (
    <div className="space-y-6">
      {/* NIK Section with Check Button */}
      <FormSection
        title="Informasi NIK"
        description="Masukkan NIK 16 digit untuk verifikasi identitas"
      >
        <div className="space-y-4">
          {/* NIK Input Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="nik" className="mb-2 block">
                Nomor Induk Kependudukan (NIK)
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <IdCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="nik"
                  placeholder="Masukkan 16 digit NIK"
                  value={formData.nik || ""}
                  onChange={(e) => handleNIKChange(e.target.value)}
                  onBlur={() => handleBlur("nik", formData.nik || "")}
                  className={cn(
                    "pl-10",
                    hasError("nik") && "border-red-500 focus-visible:ring-red-500",
                    nikExists && "border-emerald-500"
                  )}
                  maxLength={16}
                  disabled={isCheckingNIK}
                />
              </div>
              {hasError("nik") && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircleIcon className="h-4 w-4" />
                  {getFieldError("nik")}
                </p>
              )}
            </div>

            {/* Check NIK Button */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckNIK}
                disabled={
                  !formData.nik ||
                  formData.nik.length !== 16 ||
                  isCheckingNIK
                }
                className={cn(
                  "gap-2 whitespace-nowrap h-11 px-4",
                  nikExists &&
                    "border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                )}
              >
                {isCheckingNIK ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Memeriksa...
                  </>
                ) : nikExists ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Terverifikasi
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-4 w-4" />
                    Cek Data Saya
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* NIK Status Message */}
          {nikMessage && (
            <div
              className={cn(
                "p-3 rounded-lg flex items-start gap-2 text-sm",
                nikExists
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              )}
            >
              {nikExists ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <span>{nikMessage}</span>
            </div>
          )}

          {/* Info about recredential */}
          {nikExists && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-start gap-2">
              <AlertCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
              <span>
                <strong>Rekredensial:</strong> NIK ini sudah pernah digunakan.
                Anda dapat melanjutkan untuk memperbarui data kredensial Anda.
              </span>
            </div>
          )}
        </div>
      </FormSection>

      {/* Personal Information Section */}
      <FormSection
        title="Data Pribadi"
        description="Lengkapi informasi data diri Anda dengan benar"
      >
        <FormFieldRow columns={2}>
          {/* Gelar Depan */}
          <div className="space-y-2">
            <Label htmlFor="gelarDepan">Gelar Depan</Label>
            <Input
              id="gelarDepan"
              placeholder="Contoh: dr., drg., etc."
              value={formData.gelarDepan || ""}
              onChange={(e) => handleChange("gelarDepan", e.target.value)}
              className="placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-500">Opsional</p>
          </div>

          {/* Gelar Belakang */}
          <div className="space-y-2">
            <Label htmlFor="gelarBelakang">Gelar Belakang</Label>
            <Input
              id="gelarBelakang"
              placeholder="Contoh: Sp.PD, M.Kes, etc."
              value={formData.gelarBelakang || ""}
              onChange={(e) => handleChange("gelarBelakang", e.target.value)}
              className="placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-500">Opsional</p>
          </div>
        </FormFieldRow>

        {/* Nama Lengkap */}
        <div className="space-y-2">
          <Label htmlFor="namaLengkap">
            Nama Lengkap
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="namaLengkap"
              placeholder="Masukkan nama lengkap sesuai KTP"
              value={formData.namaLengkap || ""}
              onChange={(e) => handleChange("namaLengkap", e.target.value)}
              onBlur={() =>
                handleBlur("namaLengkap", formData.namaLengkap || "")
              }
              className={cn(
                "pl-10",
                hasError("namaLengkap") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
          {hasError("namaLengkap") && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <AlertCircleIcon className="h-4 w-4" />
              {getFieldError("namaLengkap")}
            </p>
          )}
        </div>

        {/* Tempat & Tanggal Lahir */}
        <FormFieldRow columns={2}>
          {/* Tempat Lahir */}
          <div className="space-y-2">
            <Label htmlFor="tempatLahir">
              Tempat Lahir
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="tempatLahir"
              placeholder="Contoh: Jakarta"
              value={formData.tempatLahir || ""}
              onChange={(e) => handleChange("tempatLahir", e.target.value)}
              onBlur={() =>
                handleBlur("tempatLahir", formData.tempatLahir || "")
              }
              className={cn(
                hasError("tempatLahir") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {hasError("tempatLahir") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {getFieldError("tempatLahir")}
              </p>
            )}
          </div>

          {/* Tanggal Lahir */}
          <div className="space-y-2">
            <Label htmlFor="tanggalLahir">
              Tanggal Lahir
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="tanggalLahir"
                type="date"
                value={formData.tanggalLahir || ""}
                onChange={(e) => handleChange("tanggalLahir", e.target.value)}
                onBlur={() =>
                  handleBlur("tanggalLahir", formData.tanggalLahir || "")
                }
                className={cn(
                  "pl-10",
                  hasError("tanggalLahir") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            {hasError("tanggalLahir") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {getFieldError("tanggalLahir")}
              </p>
            )}
          </div>
        </FormFieldRow>

        {/* Jenis Kelamin */}
        <div className="space-y-3">
          <Label>
            Jenis Kelamin
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <RadioGroup
            value={formData.jenisKelamin || ""}
            onValueChange={(value) =>
              handleChange("jenisKelamin", value as "L" | "P")
            }
            className="flex flex-row gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="L" id="L" />
              <Label htmlFor="L" className="font-normal cursor-pointer">
                Laki-laki
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="P" id="P" />
              <Label htmlFor="P" className="font-normal cursor-pointer">
                Perempuan
              </Label>
            </div>
          </RadioGroup>
          {hasError("jenisKelamin") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircleIcon className="h-4 w-4" />
              {getFieldError("jenisKelamin")}
            </p>
          )}
        </div>
      </FormSection>

      {/* Contact Information Section */}
      <FormSection
        title="Informasi Kontak"
        description="Data kontak untuk komunikasi terkait kredensial"
      >
        <FormFieldRow columns={2}>
          {/* Nomor WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="nomorWhatsApp">
              Nomor WhatsApp
            </Label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="nomorWhatsApp"
                type="tel"
                placeholder="+62 812-3456-7890"
                value={formData.nomorWhatsApp || ""}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                onBlur={() =>
                  handleBlur(
                    "nomorWhatsApp",
                    formData.nomorWhatsApp || ""
                  )
                }
                className={cn(
                  "pl-10",
                  hasError("nomorWhatsApp") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {hasError("nomorWhatsApp") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {getFieldError("nomorWhatsApp")}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Format: +62 atau 62 diikuti nomor HP
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email", formData.email || "")}
                className={cn(
                  "pl-10",
                  hasError("email") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {hasError("email") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {getFieldError("email")}
              </p>
            )}
          </div>
        </FormFieldRow>
      </FormSection>

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

export default StepIdentitas;
