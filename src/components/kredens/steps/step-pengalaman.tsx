"use client";

import React, { useCallback } from "react";
import { DynamicTable, WORK_HISTORY_COLUMNS, TRAINING_COLUMNS } from "../dynamic-table";
import { FormStepContainer, FormSection } from "../form-step-container";
import {
  BriefcaseIcon,
  GraduationCapIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";

// Types
export interface RiwayatPekerjaan {
  namaInstansi: string;
  jabatan: string;
  periodeMulai: string;
  periodeSelesai: string;
  deskripsi: string;
}

export interface Pelatihan {
  namaPelatihan: string;
  penyelenggara: string;
  tahun: string;
  jumlahJam: number;
  sertifikat: string;
}

export interface StepPengalamanData {
  riwayatPekerjaan: RiwayatPekerjaan[];
  pelatihan: Pelatihan[];
}

export interface StepPengalamanProps {
  data: Partial<StepPengalamanData>;
  onChange: (data: StepPengalamanData) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
}

// Custom columns for work history with specific requirements
const CUSTOM_WORK_HISTORY_COLUMNS = [
  { key: "namaInstansi", label: "Fasilitas", type: "text" as const, required: true, placeholder: "Nama rumah sakit/klinik/fasilitas kesehatan", width: "200px" },
  { key: "jabatan", label: "Jabatan/Profesi", type: "text" as const, required: true, placeholder: "Jabatan/posisi profesi", width: "180px" },
  { key: "periodeMulai", label: "Tanggal Mulai", type: "date" as const, required: true, width: "140px" },
  { key: "periodeSelesai", label: "Tanggal Selesai", type: "date" as const, required: false, width: "140px" },
  { key: "deskripsi", label: "Keterangan", type: "textarea" as const, placeholder: "Deskripsi singkat pekerjaan..." },
];

// Custom columns for training with specific requirements
const CUSTOM_TRAINING_COLUMNS = [
  { key: "namaPelatihan", label: "Nama Pelatihan", type: "text" as const, required: true, placeholder: "Nama pelatihan/sertifikasi", width: "180px" },
  { key: "penyelenggara", label: "Penyelenggara", type: "text" as const, required: true, placeholder: "Lembaga penyelenggara", width: "160px" },
  { key: "tahun", label: "Tanggal", type: "date" as const, required: true, width: "130px" },
  { key: "jumlahJam", label: "Jumlah JP/SKP", type: "number" as const, placeholder: "Jumlah JP/SKP", width: "110px" },
  { key: "sertifikat", label: "No. Sertifikat", type: "text" as const, placeholder: "Nomor sertifikat", width: "140px" },
];

export function StepPengalaman({
  data = {},
  onChange,
  errors,
  onSaveDraft,
}: StepPengalamanProps) {
  // Handle work history changes
  const handleWorkHistoryChange = useCallback(
    (riwayatPekerjaan: RiwayatPekerjaan[]) => {
      onChange({
        ...data,
        riwayatPekerjaan,
      } as StepPengalamanData);
    },
    [data, onChange]
  );

  // Handle training changes
  const handleTrainingChange = useCallback(
    (pelatihan: Pelatihan[]) => {
      onChange({
        ...data,
        pelatihan,
      } as StepPengalamanData);
    },
    [data, onChange]
  );

  return (
    <FormStepContainer
      stepNumber={5}
      totalSteps={8}
      title="Riwayat Pengalaman & Pengembangan Kompetensi"
      description="Masukkan riwayat pekerjaan dan pelatihan yang telah Anda ikuti"
      onSaveDraft={onSaveDraft}
      icon={<BriefcaseIcon className="h-5 w-5" />}
    >
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">Informasi Penting</p>
          <p className="mt-1">
            Lengkapi data riwayat pekerjaan dan pelatihan untuk mendukung proses verifikasi kredensial Anda.
            Pastikan semua informasi yang dimasukkan akurat dan dapat dibuktikan dengan dokumen pendukung.
          </p>
        </div>
      </div>

      {/* Section 1: Riwayat Pekerjaan */}
      <FormSection
        title="Riwayat Pekerjaan"
        description="Daftar tempat kerja dan pengalaman profesional Anda"
      >
        <DynamicTable<RiwayatPekerjaan>
          columns={CUSTOM_WORK_HISTORY_COLUMNS}
          data={data.riwayatPekerjaan || []}
          onChange={handleWorkHistoryChange}
          title=""
          description=""
          addLabel="+ Tambah Riwayat"
          emptyMessage="Belum ada riwayat pekerjaan. Klik tombol di bawah untuk menambahkan."
          maxRows={15}
          minRows={0}
          validateRow={(row) => {
            const rowErrors: Record<string, string> = {};
            
            if (!row.namaInstansi || row.namaInstansi.trim() === "") {
              rowErrors.namaInstansi = "Nama fasilitas wajib diisi";
            }
            if (!row.jabatan || row.jabatan.trim() === "") {
              rowErrors.jabatan = "Jabatan/profesi wajib diisi";
            }
            if (!row.periodeMulai) {
              rowErrors.periodeMulai = "Tanggal mulai wajib diisi";
            }
            
            // Check date validity
            if (row.periodeMulai && row.periodeSelesai) {
              if (new Date(row.periodeSelesai) < new Date(row.periodeMulai)) {
                rowErrors.periodeSelesai = "Tanggal selesai harus setelah tanggal mulai";
              }
            }

            return Object.keys(rowErrors).length > 0 ? rowErrors : null;
          }}
        />

        {/* Error message for this section */}
        {errors?.riwayatPekerjaan && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {errors.riwayatPekerjaan}
          </div>
        )}
      </FormSection>

      {/* Section 2: Pengembangan Kompetensi (Pelatihan) */}
      <FormSection
        title="Pengembangan Kompetensi (Pelatihan)"
        description="Daftar pelatihan dan sertifikasi yang telah Anda ikuti"
      >
        <DynamicTable<Pelatihan>
          columns={CUSTOM_TRAINING_COLUMNS}
          data={data.pelatihan || []}
          onChange={handleTrainingChange}
          title=""
          description=""
          addLabel="+ Tambah Pelatihan"
          emptyMessage="Belum ada data pelatihan. Klik tombol di bawah untuk menambahkan."
          maxRows={20}
          minRows={0}
          validateRow={(row) => {
            const rowErrors: Record<string, string> = {};
            
            if (!row.namaPelatihan || row.namaPelatihan.trim() === "") {
              rowErrors.namaPelatihan = "Nama pelatihan wajib diisi";
            }
            if (!row.penyelenggara || row.penyelenggara.trim() === "") {
              rowErrors.penyelenggara = "Penyelenggara wajib diisi";
            }
            if (!row.tahun) {
              rowErrors.tahun = "Tanggal/tahun wajib diisi";
            }

            return Object.keys(rowErrors).length > 0 ? rowErrors : null;
          }}
        />

        {/* Error message for this section */}
        {errors?.pelatihan && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {errors.pelatihan}
          </div>
        )}

        {/* Note about certificate upload */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Catatan:</strong> Sertifikat pelatihan dapat diunggah pada bagian Dokumen Checklist 
              (Langkah 8). Pastikan Anda memiliki salinan digital dari setiap sertifikat yang dicantumkan.
            </span>
          </p>
        </div>
      </FormSection>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{data.riwayatPekerjaan?.length || 0}</p>
          <p className="text-xs text-slate-500">Riwayat Pekerjaan</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{data.pelatihan?.length || 0}</p>
          <p className="text-xs text-slate-500">Pelatihan/Sertifikasi</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#0d9488]">
            {data.pelatihan?.reduce((total, p) => total + (p.jumlahJam || 0), 0) || 0}
          </p>
          <p className="text-xs text-slate-500">Total JP/SKP</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {(() => {
              const years = new Set(data.pelatihan?.map(p => new Date(p.tahun).getFullYear()).filter(Boolean));
              return years.size || 0;
            })()}
          </p>
          <p className="text-xs text-slate-500">Tahun Aktif</p>
        </div>
      </div>
    </FormStepContainer>
  );
}

export default StepPengalaman;
