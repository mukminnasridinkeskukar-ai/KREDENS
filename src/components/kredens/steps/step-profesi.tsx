"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormSection,
  FormFieldRow,
} from "../form-step-container";
import {
  BriefcaseIcon,
  BuildingIcon,
  StethoscopeIcon,
  UserCogIcon,
  MapPinIcon,
  HospitalIcon,
  SaveIcon,
} from "lucide-react";

// Types for profession data
export interface ProfesiData {
  jenisSdmk: string;
  jenisProfesi: string;
  jabatanFungsional: string;
  statusKepegawaian: string;
  pangkatGolongan: string;
  unitKerja: string;
  puskesmasId: string;
}

export interface StepProfesiProps {
  data: Partial<ProfesiData>;
  onChange: (data: Partial<ProfesiData>) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
  // Master data options
  puskesmasList?: { id: string; nama: string }[];
}

// Master Data - Jenis SDMK
const JENIS_SDMK = [
  { value: "tenaga_kesehatan", label: "Tenaga Kesehatan" },
  { value: "tenaga_medis", label: "Tenaga Medis" },
];

// Master Data - Jenis Profesi based on SDMK type
const PROFESI_BY_SDMK: Record<string, { value: string; label: string }[]> = {
  tenaga_kesehatan: [
    { value: "perawat", label: "Perawat" },
    { value: "bidan", label: "Bidan" },
    { value: "farmasi", label: "Tenaga Farmasi" },
    { value: "gizi", label: "Ahli Gizi" },
    { value: "kesmas", label: "Promotor Kesehatan" },
    { value: "keperawatan", label: "Tenaga Keperawatan" },
    { value: "kebidanan", label: "Tenaga Kebidanan" },
    { value: "fisioterapi", label: "Fisioterapis" },
    { value: "okupasi_terapi", label: "Terapis Okupasi" },
    { value: "terapi_wicara", label: "Terapis Wicara" },
    { value: "elektromedik", label: "Tenaga Elektromedik" },
    { value: "teknologi_laboratorium", label: "Teknologi Laboratorium Medik" },
    { value: "ortotik_prostetik", label: "Ortotis Prostetis" },
    { value: "rekam_medik", label: "Perekam Medis" },
    { value: "refraksi_optisi", label: "Refraksi Optisien" },
    { value: "transfusi_darah", label: "Tenaga Transfusi Darah" },
    { value: "sanitarian", label: "Sanitarian" },
    { value: "akupunktur", label: "Akupuntur" },
    { value: "lingkungan", label: "Teknik Kesehatan Lingkungan" },
    { value: "kedokteran_hewan", label: "Medik Veteriner" },
    { value: "psikolog_klinis", label: "Psikolog Klinis" },
    { value: "lainnya_tk", label: "Lainnya (Tenaga Kesehatan)" },
  ],
  tenaga_medis: [
    { value: "dokter_umum", label: "Dokter Umum" },
    { value: "dokter_spesialis", label: "Dokter Spesialis" },
    { value: "dokter_subspesialis", label: "Dokter Sub-Spesialis (Konsultan)" },
    { value: "dokter_gigi", label: "Dokter Gigi" },
    { value: "dokter_gigi_spesialis", label: "Dokter Gigi Spesialis" },
    { value: "lainnya_tm", label: "Lainnya (Tenaga Medis)" },
  ],
};

// Status Kepegawaian Options
const STATUS_KEPEGAWAIAN = [
  { value: "pns", label: "PNS" },
  { value: "pppk", label: "PPPK" },
  { value: "non_asn", label: "Non-ASN" },
  { value: "lainnya", label: "Lainnya" },
];

// Mock Puskesmas List (in real app, this would come from API/master data)
const MOCK_PUSKESMAS_LIST = [
  { id: "", nama: "-- Pilih Puskesmas --" },
  { id: "pus001", nama: "Puskesmas Pembantu Sukajadi" },
  { id: "pus002", nama: "Puskesmas Pasir Endau" },
  { id: "pus003", nama: "Puskesmas Cibadak" },
  { id: "pus004", nama: "Puskesmas Jati" },
  { id: "pus005", nama: "Puskesmas Pamulang" },
  { id: "pus006", nama: "Puskesmas Ciputat Timur" },
  { id: "pus007", nama: "Puskesmas Serpong Utara" },
  { id: "pus008", nama: "Puskesmas Pondok Aren" },
  { id: "pus009", nama: "Puskesmas Cilengsi" },
  { id: "pus010", nama: "Puskesmas Ciawi" },
];

// Initial state
const initialData: ProfesiData = {
  jenisSdmk: "",
  jenisProfesi: "",
  jabatanFungsional: "",
  statusKepegawaian: "",
  pangkatGolongan: "",
  unitKerja: "",
  puskesmasId: "",
};

export function StepProfesi({
  data = initialData,
  onChange,
  errors = {},
  onSaveDraft,
  puskesmasList = MOCK_PUSKESMAS_LIST,
}: StepProfesiProps) {
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<ProfesiData>>({
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

  // Get available profesi options based on selected SDMK
  const availableProfesi = formData.jenisSdmk
    ? PROFESI_BY_SDMK[formData.jenisSdmk] || []
    : [];

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

  // Reset jenis profesi when jenis sdmk changes
  useEffect(() => {
    if (formData.jenisSdmk) {
      setFormData((prev) => ({
        ...prev,
        jenisProfesi: "", // Reset profesi when SDMK changes
      }));
    }
  }, [formData.jenisSdmk]);

  // Auto-save draft functionality
  const triggerAutoSave = useCallback(
    (newData: Partial<ProfesiData>) => {
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
    (field: keyof ProfesiData, value: string) => {
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
    (field: keyof ProfesiData, value: string): string | null => {
      switch (field) {
        case "jenisSdmk":
          if (!value) return "Jenis SDMK wajib dipilih";
          return null;
        case "jenisProfesi":
          if (!value) return "Jenis Profesi wajib dipilih";
          return null;
        case "statusKepegawaian":
          if (!value) return "Status Kepegawaian wajib dipilih";
          return null;
        default:
          return null;
      }
    },
    []
  );

  // Handle blur for inline validation
  const handleBlur = useCallback(
    (field: keyof ProfesiData, value: string) => {
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

  return (
    <div className="space-y-6">
      {/* SDMK & Profesi Section */}
      <FormSection
        title="Klasifikasi Profesi"
        description="Pilih klasifikasi dan jenis profesi Anda"
      >
        <FormFieldRow columns={2}>
          {/* Jenis SDMK */}
          <div className="space-y-2">
            <Label htmlFor="jenisSdmk">
              Jenis SDMK
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.jenisSdmk || ""}
              onValueChange={(value) => handleChange("jenisSdmk", value)}
            >
              <SelectTrigger
                id="jenisSdmk"
                className={cn(
                  hasError("jenisSdmk") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              >
                <SelectValue placeholder="Pilih Jenis SDMK" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_SDMK.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError("jenisSdmk") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <StethoscopeIcon className="h-4 w-4" />
                {getFieldError("jenisSdmk")}
              </p>
            )}
          </div>

          {/* Jenis Profesi - Dynamic based on SDMK */}
          <div className="space-y-2">
            <Label htmlFor="jenisProfesi">
              Jenis Profesi
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.jenisProfesi || ""}
              onValueChange={(value) =>
                handleChange("jenisProfesi", value)
              }
              disabled={!formData.jenisSdmk}
            >
              <SelectTrigger
                id="jenisProfesi"
                className={cn(
                  !formData.jenisSdmk && "opacity-60 cursor-not-allowed",
                  hasError("jenisProfesi") &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              >
                <SelectValue
                  placeholder={
                    formData.jenisSdmk
                      ? "Pilih Jenis Profesi"
                      : "Pilih Jenis SDMK terlebih dahulu"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableProfesi.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError("jenisProfesi") && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <BriefcaseIcon className="h-4 w-4" />
                {getFieldError("jenisProfesi")}
              </p>
            )}
          </div>
        </FormFieldRow>

        {/* Info about dynamic selection */}
        {!formData.jenisSdmk && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <StethoscopeIcon className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              Pilih Jenis SDMK terlebih dahulu untuk melihat pilihan Jenis
              Profesi yang tersedia.
            </span>
          </div>
        )}

        {/* Jabatan Fungsional */}
        <div className="space-y-2">
          <Label htmlFor="jabatanFungsional">Jabatan Fungsional</Label>
          <div className="relative">
            <UserCogIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="jabatanFungsional"
              placeholder="Contoh: Dokter Pelaksana, Perawat Ahli Muda, dll."
              value={formData.jabatanFungsional || ""}
              onChange={(e) =>
                handleChange("jabatanFungsional", e.target.value)
              }
              className="pl-10 placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500">Opsional</p>
        </div>
      </FormSection>

      {/* Employment Status Section */}
      <FormSection
        title="Status Kepegawaian"
        description="Informasi status kepegawaian dan pangkat/golongan"
      >
        {/* Status Kepegawaian */}
        <div className="space-y-3 mb-6">
          <Label>
            Status Kepegawaian
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <RadioGroup
            value={formData.statusKepegawaian || ""}
            onValueChange={(value) =>
              handleChange("statusKepegawaian", value)
            }
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {STATUS_KEPEGAWAIAN.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <RadioGroupItem value={item.value} id={`status-${item.value}`} />
                <Label
                  htmlFor={`status-${item.value}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {hasError("statusKepegawaian") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <BriefcaseIcon className="h-4 w-4" />
              {getFieldError("statusKepegawaian")}
            </p>
          )}
        </div>

        {/* Pangkat/Golongan - Show only for PNS/PPPK */}
        {(formData.statusKepegawaian === "pns" ||
          formData.statusKepegawaian === "pppk") && (
          <FormFieldRow columns={2}>
            <div className="space-y-2">
              <Label htmlFor="pangkatGolongan">Pangkat / Golongan</Label>
              <Input
                id="pangkatGolongan"
                placeholder="Contoh: Penata Muda Tk.I / III/b"
                value={formData.pangkatGolongan || ""}
                onChange={(e) =>
                  handleChange("pangkatGolongan", e.target.value)
                }
                className="placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500">
                Untuk PNS/PPPK
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitKerja">Unit Kerja</Label>
              <Input
                id="unitKerja"
                placeholder="Contoh: Dinas Kesehatan Kab. Bogor"
                value={formData.unitKerja || ""}
                onChange={(e) => handleChange("unitKerja", e.target.value)}
                className="placeholder:text-slate-400"
              />
            </div>
          </FormFieldRow>
        )}

        {/* For Non-ASN/Lainnya - Show only Unit Kerja */}
        {(formData.statusKepegawaian === "non_asn" ||
          formData.statusKepegawaian === "lainnya") && (
          <div className="space-y-2">
            <Label htmlFor="unitKerjaNonAsn">Instansi / Tempat Kerja</Label>
            <div className="relative">
              <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="unitKerjaNonAsn"
                placeholder="Contoh: RSUD Kota Bogor, Klinik Pratama Sehat, dll."
                value={formData.unitKerja || ""}
                onChange={(e) => handleChange("unitKerja", e.target.value)}
                className="pl-10 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}
      </FormSection>

      {/* Assignment Section */}
      <FormSection
        title="Penempatan Kerja"
        description="Informasi tempat penugasan saat ini"
      >
        {/* Puskesmas Selection */}
        <div className="space-y-2">
          <Label htmlFor="puskesmasId">
            <HospitalIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Puskesmas Penugasan
          </Label>
          <Select
            value={formData.puskesmasId || ""}
            onValueChange={(value) => handleChange("puskesmasId", value)}
          >
            <SelectTrigger id="puskesmasId">
              <SelectValue placeholder="Pilih Puskesmas penugasan" />
            </SelectTrigger>
            <SelectContent>
              {puskesmasList.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Pilih Puskesmas tempat Anda ditugaskan. Kosongkan jika tidak
            ditugaskan di Puskesmas.
          </p>
        </div>

        {/* Additional Location Info */}
        <div className="mt-4 space-y-2">
          <Label htmlFor="lokasiDetail">
            <MapPinIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Detail Lokasi (Opsional)
          </Label>
          <Input
            id="lokasiDetail"
            placeholder="Contoh: Polindes Desa Sukamaju, Kec. Cibitung"
            value="" // Optional field, not in main form data
            readOnly
            className="bg-slate-50 dark:bg-slate-800 placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-500">
            Informasi detail lokasi dapat ditambahkan jika diperlukan.
          </p>
        </div>
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

export default StepProfesi;
