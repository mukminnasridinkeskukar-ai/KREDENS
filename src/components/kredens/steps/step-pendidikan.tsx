"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormSection,
  FormFieldRow,
} from "../form-step-container";
import {
  GraduationCapIcon,
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  BrainIcon,
  StarIcon,
  StethoscopeIcon,
  SaveIcon,
} from "lucide-react";

// Types for education data
export interface PendidikanData {
  jenjangPendidikan: string;
  programStudi: string;
  institusiPendidikan: string;
  tahunLulus: string;
  kompetensiUtama: string;
  kompetensiKhusus: string;
  keahlianKlinis: string;
}

export interface StepPendidikanProps {
  data: Partial<PendidikanData>;
  onChange: (data: Partial<PendidikanData>) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
}

// Master Data - Jenjang Pendidikan
const JENJANG_PENDIDIKAN = [
  { value: "d3", label: "Diploma III (D3)" },
  { value: "d4", label: "Diploma IV (D4)" },
  { value: "s1", label: "Sarjana (S1)" },
  { value: "profesi", label: "Profesi" },
  { value: "sp1", label: "Spesialis I (Sp.1)" },
  { value: "s2", label: "Magister (S2)" },
  { value: "sp2", label: "Spesialis II (Sp.2)" },
  { value: "s3", label: "Doktor (S3)" },
];

// Generate year options for Tahun Lulus
const generateYearOptions = (): { value: string; label: string }[] => {
  const currentYear = new Date().getFullYear();
  const years: { value: string; label: string }[] = [];
  
  // From current year back to 1970
  for (let year = currentYear; year >= 1970; year--) {
    years.push({ value: String(year), label: String(year) });
  }
  
  return years;
};

const YEAR_OPTIONS = generateYearOptions();

// Initial state
const initialData: PendidikanData = {
  jenjangPendidikan: "",
  programStudi: "",
  institusiPendidikan: "",
  tahunLulus: "",
  kompetensiUtama: "",
  kompetensiKhusus: "",
  keahlianKlinis: "",
};

export function StepPendidikan({
  data = initialData,
  onChange,
  errors = {},
  onSaveDraft,
}: StepPendidikanProps) {
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<PendidikanData>>({
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

  // Character count for textareas
  const [charCounts, setCharCounts] = useState<{
    kompetensiUtama: number;
    kompetensiKhusus: number;
    keahlianKlinis: number;
  }>({
    kompetensiUtama: 0,
    kompetensiKhusus: 0,
    keahlianKlinis: 0,
  });

  // Sync external data changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData((prev) => ({ ...prev, ...data }));
      // Update char counts if data has textarea values
      if (data.kompetensiUtama !== undefined) {
        setCharCounts((prev) => ({
          ...prev,
          kompetensiUtama: data.kompetensiUtama?.length || 0,
        }));
      }
      if (data.kompetensiKhusus !== undefined) {
        setCharCounts((prev) => ({
          ...prev,
          kompetensiKhusus: data.kompetensiKhusus?.length || 0,
        }));
      }
      if (data.keahlianKlinis !== undefined) {
        setCharCounts((prev) => ({
          ...prev,
          keahlianKlinis: data.keahlianKlinis?.length || 0,
        }));
      }
    }
  }, [data]);

  // Sync external errors
  useEffect(() => {
    setValidationErrors(errors);
  }, [errors]);

  // Auto-save draft functionality
  const triggerAutoSave = useCallback(
    (newData: Partial<PendidikanData>) => {
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
    (field: keyof PendidikanData, value: string) => {
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

      // Update character count for textareas
      if (
        field === "kompetensiUtama" ||
        field === "kompetensiKhusus" ||
        field === "keahlianKlinis"
      ) {
        setCharCounts((prev) => ({
          ...prev,
          [field]: value.length,
        }));
      }

      // Trigger auto-save
      triggerAutoSave(newData);
    },
    [formData, validationErrors, triggerAutoSave]
  );

  // Validate specific field
  const validateField = useCallback(
    (field: keyof PendidikanData, value: string): string | null => {
      switch (field) {
        case "jenjangPendidikan":
          if (!value) return "Jenjang Pendidikan wajib dipilih";
          return null;
        case "programStudi":
          if (!value) return "Program Studi wajib diisi";
          return null;
        case "institusiPendidikan":
          if (!value) return "Institusi Pendidikan wajib diisi";
          return null;
        case "tahunLulus":
          if (!value) return "Tahun Lulus wajib diisi";
          const yearNum = parseInt(value);
          if (isNaN(yearNum)) return "Format tahun tidak valid";
          if (yearNum < 1970 || yearNum > new Date().getFullYear()) {
            return `Tahun harus antara 1970 - ${new Date().getFullYear()}`;
          }
          return null;
        default:
          return null;
      }
    },
    []
  );

  // Handle blur for inline validation
  const handleBlur = useCallback(
    (field: keyof PendidikanData, value: string) => {
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

  // Max character limits for textareas
  const MAX_CHARS = {
    kompetensiUtama: 1000,
    kompetensiKhusus: 1000,
    keahlianKlinis: 1500,
  };

  return (
    <div className="space-y-6">
      {/* Formal Education Section */}
      <FormSection
        title="Pendidikan Formal"
        description="Informasi pendidikan formal terakhir Anda"
      >
        {/* Jenjang Pendidikan */}
        <div className="space-y-2">
          <Label htmlFor="jenjangPendidikan">
            Jenjang Pendidikan
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.jenjangPendidikan || ""}
            onValueChange={(value) =>
              handleChange("jenjangPendidikan", value)
            }
          >
            <SelectTrigger
              id="jenjangPendidikan"
              className={cn(
                hasError("jenjangPendidikan") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            >
              <SelectValue placeholder="Pilih Jenjang Pendidikan" />
            </SelectTrigger>
            <SelectContent>
              {JENJANG_PENDIDIKAN.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError("jenjangPendidikan") && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <GraduationCapIcon className="h-4 w-4" />
              {getFieldError("jenjangPendidikan")}
            </p>
          )}
        </div>

        {/* Program Studi & Institusi */}
        <FormFieldRow columns={2}>
          {/* Program Studi */}
          <div className="space-y-2">
            <Label htmlFor="programStudi">
              Program Studi
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <BookOpenIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="programStudi"
                placeholder="Contoh: Kedokteran Umum"
                value={formData.programStudi || ""}
                onChange={(e) => handleChange("programStudi", e.target.value)}
                onBlur={() =>
                  handleBlur("programStudi", formData.programStudi || "")
                }
                className={cn(
                  "pl-10 placeholder:text-slate-400",
                  hasError("programStudi") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
            </div>
            {hasError("programStudi") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircleIcon className="h-4 w-4" />
                {getFieldError("programStudi")}
              </p>
            )}
          </div>

          {/* Tahun Lulus */}
          <div className="space-y-2">
            <Label htmlFor="tahunLulus">
              Tahun Lulus
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Select
                value={formData.tahunLulus || ""}
                onValueChange={(value) => handleChange("tahunLulus", value)}
              >
                <SelectTrigger
                  id="tahunLahir"
                  className={cn(
                    "pl-10",
                    hasError("tahunLulus") &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                >
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasError("tahunLulus") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {getFieldError("tahunLulus")}
              </p>
            )}
          </div>
        </FormFieldRow>

        {/* Institusi Pendidikan */}
        <div className="space-y-2">
          <Label htmlFor="institusiPendidikan">
            Institusi Pendidikan
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="relative">
            <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="institusiPendidikan"
              placeholder="Contoh: Universitas Indonesia"
              value={formData.institusiPendidikan || ""}
              onChange={(e) =>
                handleChange("institusiPendidikan", e.target.value)
              }
              onBlur={() =>
                handleBlur(
                  "institusiPendidikan",
                  formData.institusiPendidikan || ""
                )
              }
              className={cn(
                "pl-10 placeholder:text-slate-400",
                hasError("institusiPendidikan") &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
          </div>
          {hasError("institusiPendidikan") && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <BuildingIcon className="h-4 w-4" />
              {getFieldError("institusiPendidikan")}
            </p>
          )}
        </div>
      </FormSection>

      {/* Competencies Section */}
      <FormSection
        title="Kompetensi & Keahlian"
        description="Deskripsikan kompetensi dan keahlian klinis yang Anda miliki"
      >
        {/* Kompetensi Utama */}
        <div className="space-y-2">
          <Label htmlFor="kompetensiUtama">
            <BrainIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Kompetensi Utama
          </Label>
          <Textarea
            id="kompetensiUtama"
            placeholder="Jelaskan kompetensi utama yang Anda kuasai dalam bidang profesi Anda. Contoh: Pemeriksaan fisik lengkap, diagnosis penyakit umum, manajemen pasien kronis, dll."
            value={formData.kompetensiUtama || ""}
            onChange={(e) => handleChange("kompetensiUtama", e.target.value)}
            rows={4}
            className={cn(
              "resize-none placeholder:text-slate-400",
              hasError("kompetensiUtama") &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-slate-500">
              Tuliskan minimal 3 kompetensi utama yang dikuasai
            </p>
            <span
              className={cn(
                "text-xs",
                charCounts.kompetensiUtama > MAX_CHARS.kompetensiUtama
                  ? "text-red-500 font-medium"
                  : "text-slate-400"
              )}
            >
              {charCounts.kompetensiUtama}/{MAX_CHARS.kompetensiUtama}
            </span>
          </div>
        </div>

        {/* Kompetensi Khusus */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="kompetensiKhusus">
            <StarIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Kompetensi Khusus / Subspesialisasi
          </Label>
          <Textarea
            id="kompetensiKhusus"
            placeholder="Sebutkan kompetensi khusus atau subspesialisasi yang Anda miliki. Contoh: Penanganan gawat darurat jantung, tindakan bedah minor, pemeriksaan USG dasar, dll."
            value={formData.kompetensiKhusus || ""}
            onChange={(e) => handleChange("kompetensiKhusus", e.target.value)}
            rows={4}
            className={cn(
              "resize-none placeholder:text-slate-400",
              hasError("kompetensiKhusus") &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-slate-500">
              Opsional - Isi jika memiliki kompetensi khusus tertentu
            </p>
            <span
              className={cn(
                "text-xs",
                charCounts.kompetensiKhusus > MAX_CHARS.kompetensiKhusus
                  ? "text-red-500 font-medium"
                  : "text-slate-400"
              )}
            >
              {charCounts.kompetensiKhusus}/{MAX_CHARS.kompetensiKhusus}
            </span>
          </div>
        </div>

        {/* Keahlian Klinis */}
        <div className="space-y-2 mt-6">
          <Label htmlFor="keahlianKlinis">
            <StethoscopeIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Keahlian Klinis
          </Label>
          <Textarea
            id="keahlianKlinis"
            placeholder="Deskripsikan keahlian klinis praktis yang Anda miliki berdasarkan pengalaman kerja. Contoh: Prosedur penanganan trauma, manajemen ICU, tindakan persalinan normal, pemasangan infus, dll."
            value={formData.keahlianKlinis || ""}
            onChange={(e) => handleChange("keahlianKlinis", e.target.value)}
            rows={5}
            className={cn(
              "resize-none placeholder:text-slate-400",
              hasError("keahlianKlinis") &&
                "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-slate-500">
              Sebutkan tindakan atau prosedur klinis yang dapat dilakukan secara mandiri
            </p>
            <span
              className={cn(
                "text-xs",
                charCounts.keahlianKlinis > MAX_CHARS.keahlianKlinis
                  ? "text-red-500 font-medium"
                  : "text-slate-400"
              )}
            >
              {charCounts.keahlianKlinis}/{MAX_CHARS.keahlianKlinis}
            </span>
          </div>
        </div>
      </FormSection>

      {/* Tips Section */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-200 dark:border-blue-800 p-4 md:p-6">
        <div className="flex gap-3">
          <GraduationCapIcon className="h-6 w-6 text-[#1e3a5f] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-[#1e3a5f] dark:text-teal-400 mb-1">
              Tips Pengisian Data Pendidikan
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Isi dengan data pendidikan formal terakhir yang relevan</li>
              <li>Untuk dokter spesialis, sertakan juga pendidikan profesi</li>
              <li>Jelaskan kompetensi sesuai standar kompetensi profesi</li>
              <li>Tuliskan keahlian klinis yang benar-benar dikuasai</li>
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

// Import AlertCircleIcon for use in component
import { AlertCircleIcon } from "lucide-react";

export default StepPendidikan;
