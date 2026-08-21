"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { FormStepContainer, FormSection } from "../form-step-container";
import { FileUpload } from "../file-upload";
import { SelfAssessmentTable, CompetencyAssessment } from "../self-assessment-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  Trash2Icon,
  FolderOpenIcon,
  BrainIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  UploadIcon,
} from "lucide-react";

// Types
export interface PortofolioEntry {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  deskripsi: string;
  file?: {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    status: "valid" | "uploading" | "error" | "idle";
    progress: number;
  };
  statusVerifikasi: "BELUM_DIVERIFIKASI" | "DIVERIFIKASI" | "DITOLAK" | "PENDING";
}

export interface StepKompetensiData {
  portofolio: PortofolioEntry[];
  kompetensi: CompetencyAssessment[];
}

export interface StepKompetensiProps {
  data: Partial<StepKompetensiData>;
  onChange: (data: StepKompetensiData) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  // Context data from previous steps
  jenisSdmk?: string;
  jenisProfesi?: string;
}

// Portofolio categories
const PORTOFOLIO_KATEGORIES = [
  { value: "penelitian", label: "Penelitian" },
  { value: "publikasi_ilmiah", label: "Publikasi Ilmiah" },
  { value: "presentasi_seminar", label: "Presentasi/Seminar" },
  { value: "inovasi_karya_cipta", label: "Inovasi/Karya Cipta" },
  { value: "pengabdian_masyarakat", label: "Pengabdian Masyarakat" },
  { value: "organisasi_profesi", label: "Organisasi Profesi" },
  { value: "penghargaan", label: "Penghargaan/Prestasi" },
  { value: "lainnya", label: "Lainnya" },
];

// Verification status config
const VERIFIKASI_STATUS_CONFIG = {
  BELUM_DIVERIFIKASI: {
    label: "Belum Diverifikasi",
    color: "bg-slate-100 text-slate-600 border-slate-300",
    icon: <ClockIcon className="h-3 w-3" />,
  },
  PENDING: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: <ClockIcon className="h-3 w-3" />,
  },
  DIVERIFIKASI: {
    label: "Diverifikasi",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    icon: <CheckCircle2Icon className="h-3 w-3" />,
  },
  DITOLAK: {
    label: "Ditolak",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <AlertCircleIcon className="h-3 w-3" />,
  },
};

// Generate competency list based on profesi and SDMK type
const getCompetenciesByProfesi = (
  jenisSdmk?: string,
  jenisProfesi?: string
): CompetencyAssessment[] => {
  const baseId = jenisProfesi?.toLowerCase().replace(/\s+/g, "_") || "default";

  // Define competencies based on profesi type
  const competencyMap: Record<string, Omit<CompetencyAssessment, "level" | "evidence" | "catatan">[]> = {
    // Perawat competencies
    perawat: [
      { id: `${baseId}-1`, kode: "KMP.01", nama: "Asuhan Keperawatan Dasar", deskripsi: "Kemampuan memberikan asuhan keperawatan dasar meliputi pemeriksaan fisik, vital sign, dan dokumentasi keperawatan" },
      { id: `${baseId}-2`, kode: "KMP.02", nama: "Pemberian Obat dan Terapi", deskripsi: "Kemampuan memberikan obat oral, injeksi, IV therapy sesuai prosedur dan standar" },
      { id: `${baseId}-3`, kode: "KMP.03", nama: "Perawatan Luka", deskripsi: "Kemampuan melakukan perawatan luka akut dan kronis, wound care modern" },
      { id: `${baseId}-4`, kode: "KMP.04", nama: "Resusitasi Jantung Paru (RJP/BLS)", deskripsi: "Kemampuan melakukan resusitasi dasar sesuai standar AHA/JNC" },
      { id: `${baseId}-5`, kode: "KMP.05", nama: "Pendidikan Kesehatan Pasien", deskripsi: "Kemampuan memberikan edukasi kesehatan kepada pasien dan keluarga" },
      { id: `${baseId}-6`, kode: "KMP.06", nama: "Manajemen Nyeri", deskripsi: "Kemampuan melakukan penilaian dan manajemen nyeri secara komprehensif" },
      { id: `${baseId}-7`, kode: "KMP.07", nama: "Infeksi Kontrol", deskripsi: "Kemampuan menerapkan prinsip pencegahan dan pengendalian infeksi" },
      { id: `${baseId}-8`, kode: "KMP.08", nama: "Dokumentasi Keperawatan", deskripsi: "Kemampuan mendokumentasikan asuhan keperawatan dengan tepat dan lengkap" },
    ],
    // Dokter competencies
    dokter: [
      { id: `${baseId}-1`, kode: "KMD.01", nama: "Anamnesis dan Pemeriksaan Fisik", deskripsi: "Kemampuan melakukan anamnesis komprehensif dan pemeriksaan fisik sistematis" },
      { id: `${baseId}-2`, kode: "KMD.02", nama: "Diagnosis Klinis", deskripsi: "Kemampuan membuat diagnosis diferensial dan diagnosis kerja berdasarkan data klinis" },
      { id: `${baseId}-3`, kode: "KMD.03", nama: "Penatalaksanaan Medis", deskripsi: "Kemampuan merencanakan dan melaksanakan tata laksana medis yang tepat" },
      { id: `${baseId}-4`, kode: "KMD.04", nama: "Tindakan Prosedur Medis", deskripsi: "Kemampuan melakukan prosedur medis sesuai kompetensi dan izin" },
      { id: `${baseId}-5`, kode: "KMD.05", nama: "Resusitasi Lanjutan (ACLS)", deskripsi: "Kemampuan melakukan resusitasi jantung paru lanjutan" },
      { id: `${baseId}-6`, kode: "KMD.06", nama: "Interpretasi Hasil Pemeriksaan Penunjang", deskripsi: "Kemampuan menginterpretasikan hasil lab, radiologi, dan penunjang lainnya" },
      { id: `${baseId}-7`, kode: "KMD.07", nama: "Manajemen Gawat Darurat", deskripsi: "Kemampuan menangani kondisi gawat darurat di IGD/IGD" },
      { id: `${baseId}-8`, kode: "KMD.08", nama: "Rujukan dan Konsultasi", deskripsi: "Kemampuan menentukan kebutuhan rujukan dan melakukan konsultasi" },
      { id: `${baseId}-9`, kode: "KMD.09", nama: "Etika Kedokteran", deskripsi: "Kemampuan menerapkan prinsip etika kedokteran dalam praktik" },
      { id: `${baseId}-10`, kode: "KMD.10", nama: "Informed Consent", deskripsi: "Kemampuan mendapatkan persetujuan tindakan yang sah" },
    ],
    // Bidan competencies
    bidan: [
      { id: `${baseId}-1`, kode: "KMB.01", nama: "Pemeriksaan Kehamilan", deskripsi: "Kemampuan melakukan pemeriksaan antenatal care rutin dan risiko tinggi" },
      { id: `${baseId}-2`, kode: "KMB.02", nama: "Persalinan Normal", deskripsi: "Kemampuan menolong persalinan normal dan mendeteksi komplikasi" },
      { id: `${baseId}-3`, kode: "KMB.03", nama: "Pelayanan Nifas", deskripsi: "Kemampuan memberikan asuhan nifas dan menyusui" },
      { id: `${baseId}-4`, kode: "KMB.04", nama: "Pelayanan KB", deskripsi: "Kemampuan memberikan konseling dan layanan kontrasepsi" },
      { id: `${baseId}-5`, kode: "KMB.05", nama: "Deteksi Dini Komplikasi Obstetri", deskripsi: "Kemampuan mendeteksi dan merujuk komplikasi kehamilan dan persalinan" },
      { id: `${baseId}-6`, kode: "KMB.06", nama: "Asuhan Neonatus", deskripsi: "Kemampuan memberikan asuhan bayi baru lahir termasuk resusitasi bayi" },
    ],
    // Farmasi/Apoteker competencies
    farmasi: [
      { id: `${baseId}-1`, kode: "KMF.01", nama: "Verifikasi Resep", deskripsi: "Kemampuan memveriksi resep obat sesuai regulasi" },
      { id: `${baseId}-2`, kode: "KMF.02", nama: "Compounding dan Dispensing", deskripsi: "Kemampuan meracik dan menyerahkan obat dengan benar" },
      { id: `${baseId}-3`, kode: "KMF.03", nama: "Drug Information", deskripsi: "Kemampuan memberikan informasi obat kepada tenaga kesehatan lain" },
      { id: `${baseId}-4`, kode: "KMF.04", nama: "Monitoring Terapi Obat", deskripsi: "Kemampuan monitoring efektivitas dan keamanan terapi obat" },
      { id: `${baseId}-5`, kode: "KMF.05", nama: "Manajemen Efek Samping Obat", deskripsi: "Kemampuan mengidentifikasi dan menangani efek samping obat" },
      { id: `${baseId}-6`, kode: "KMF.06", nama: "Farmakologi Klinik", deskripsi: "Pemahaman farmakokinetik dan farmakodinamik dalam praktik" },
    ],
    // Default/generic competencies for other professions
    default: [
      { id: `${baseId}-1`, kode: "KOM.01", nama: "Kompetensi Teknis Bidang Keahlian", deskripsi: "Kemampuan teknis sesuai bidang profesi masing-masing" },
      { id: `${baseId}-2`, kode: "KOM.01", nama: "Komunikasi Efektif", deskripsi: "Kemampuan berkomunikasi efektif dengan pasien, keluarga, dan tim kesehatan" },
      { id: `${baseId}-3`, kode: "KOM.01", nama: "Kerja Tim Interprofesi", deskripsi: "Kemampuan bekerja sama dalam tim interprofesi kesehatan" },
      { id: `${baseId}-4`, kode: "KOM.01", nama: "Etika dan Hukum Kesehatan", deskripsi: "Penerapan etika profesi dan hukum kesehatan dalam praktik" },
      { id: `${baseId}-5`, kode: "KOM.01", nama: "Pendidikan Kesehatan", deskripsi: "Kemampuan memberikan edukasi kesehatan kepada masyarakat" },
      { id: `${baseId}-6`, kode: "KOM.01", nama: "Pencatatan dan Pelaporan", deskripsi: "Kemampuan mencatat dan melaporkan data kesehatan dengan benar" },
    ],
  };

  // Determine which competency set to use based on profesi
  const profesiKey = jenisProfesi?.toLowerCase() || "default";
  
  if (profesiKey.includes("perawat") || profesiKey.includes("nurse")) {
    return competencyMap.perawat.map((c) => ({
      ...c,
      level: "BELUM_KOMPETEN" as const,
      evidence: [] as string[],
      catatan: "",
    }));
  }
  if (profesiKey.includes("dokter") || profesiKey.includes("doctor") || profesiKey.includes("dr.") || profesiKey.includes("sp.")) {
    return competencyMap.dokter.map((c) => ({
      ...c,
      level: "BELUM_KOMPETEN" as const,
      evidence: [] as string[],
      catatan: "",
    }));
  }
  if (profesiKey.includes("bidan") || profesiKey.includes("midwife")) {
    return competencyMap.bidan.map((c) => ({
      ...c,
      level: "BELUM_KOMPETEN" as const,
      evidence: [] as string[],
      catatan: "",
    }));
  }
  if (profesiKey.includes("farmasi") || profesiKey.includes("apoteker") || profesiKey.includes("pharmacist")) {
    return competencyMap.farmasi.map((c) => ({
      ...c,
      level: "BELUM_KOMPETEN" as const,
      evidence: [] as string[],
      catatan: "",
    }));
  }

  // Return default competencies
  return competencyMap.default.map((c) => ({
    ...c,
    level: "BELUM_KOMPETEN" as const,
    evidence: [] as string[],
    catatan: "",
  }));
};

export function StepKompetensi({
  data = {},
  onChange,
  errors,
  onSaveDraft,
  jenisSdmk,
  jenisProfesi,
}: StepKompetensiProps) {
  const [newPortofolio, setNewPortofolio] = useState<Partial<PortofolioEntry>>({
    judul: "",
    kategori: "",
    tanggal: "",
    deskripsi: "",
    statusVerifikasi: "BELUM_DIVERIFIKASI",
  });

  // Initialize competencies if not exists
  React.useEffect(() => {
    if (!data.kompetensi || data.kompetensi.length === 0) {
      const initialCompetencies = getCompetenciesByProfesi(jenisSdmk, jenisProfesi);
      onChange({
        ...data,
        kompetensi: initialCompetencies,
      } as StepKompetensiData);
    }
  }, [jenisSdmk, jenisProfesi]);

  // Handle add portofolio
  const handleAddPortofolio = useCallback(() => {
    if (!newPortofolio.judul || !newPortofolio.kategori || !newPortofolio.tanggal) {
      return; // Validation failed
    }

    const entry: PortofolioEntry = {
      id: `port-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      judul: newPortofolio.judul || "",
      kategori: newPortofolio.kategori || "",
      tanggal: newPortofolio.tanggal || "",
      deskripsi: newPortofolio.deskripsi || "",
      file: newPortofolio.file,
      statusVerifikasi: "BELUM_DIVERIFIKASI",
    };

    onChange({
      ...data,
      portofolio: [...(data.portofolio || []), entry],
    } as StepKompetensiData);

    // Reset form
    setNewPortofolio({
      judul: "",
      kategori: "",
      tanggal: "",
      deskripsi: "",
      statusVerifikasi: "BELUM_DIVERIFIKASI",
    });
  }, [newPortofolio, data, onChange]);

  // Handle remove portofolio
  const handleRemovePortofolio = useCallback(
    (id: string) => {
      onChange({
        ...data,
        portofolio: (data.portofolio || []).filter((p) => p.id !== id),
      } as StepKompetensiData);
    },
    [data, onChange]
  );

  // Handle portofolio field change
  const handlePortofolioFieldChange = useCallback(
    (field: keyof PortofolioEntry, value: unknown) => {
      setNewPortofolio((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle competency changes
  const handleCompetencyChange = useCallback(
    (kompetensi: CompetencyAssessment[]) => {
      onChange({
        ...data,
        kompetensi,
      } as StepKompetensiData);
    },
    [data, onChange]
  );

  // Handle file upload for portofolio
  const handleFileChange = useCallback(
    (files: typeof newPortofolio.file extends infer T ? T[] : never) => {
      if (files && files.length > 0) {
        setNewPortofolio((prev) => ({ ...prev, file: files[0] }));
      }
    },
    []
  );

  const isPortofolioFormValid =
    newPortofolio.judul?.trim() &&
    newPortofolio.kategori &&
    newPortofolio.tanggal;

  return (
    <FormStepContainer
      stepNumber={6}
      totalSteps={8}
      title="Portofolio & Self Assessment"
      description="Dokumentasikan portofolio dan lakukan penilaian mandiri kompetensi Anda"
      onSaveDraft={onSaveDraft}
      icon={<BrainIcon className="h-5 w-5" />}
    >
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium">Informasi Penting</p>
          <p className="mt-1">
            Bagian ini mencakup portofolio profesional dan self-assessment kompetensi yang disesuaikan 
            dengan profesi <strong>{jenisProfesi || "yang dipilih"}</strong>. 
            Lakukan penilaian yang jujur dan objektif.
          </p>
        </div>
      </div>

      {/* Section 1: Portofolio */}
      <FormSection
        title="Portofolio Profesional"
        description="Dokumentasikan karya, prestasi, dan kontribusi profesional Anda"
      >
        {/* Existing Portofolio List */}
        {(data.portofolio && data.portofolio.length > 0) && (
          <div className="space-y-3 mb-6">
            {data.portofolio.map((portofolio) => {
              const statusConfig = VERIFIKASI_STATUS_CONFIG[portofolio.statusVerifikasi];
              const kategoriLabel = PORTOFOLIO_KATEGORIES.find(
                (k) => k.value === portofolio.kategori
              )?.label || portofolio.kategori;

              return (
                <Card
                  key={portofolio.id}
                  className="overflow-hidden border-slate-200 dark:border-slate-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                            {portofolio.judul}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {kategoriLabel}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {new Date(portofolio.tanggal).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                            })}
                          </span>
                        </div>

                        {portofolio.deskripsi && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {portofolio.deskripsi}
                          </p>
                        )}

                        {/* File info */}
                        {portofolio.file && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md w-fit">
                            <FileTextIcon className="h-3.5 w-3.5" />
                            {portofolio.file.name}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Verification Status Badge */}
                        <Badge
                          variant="outline"
                          className={cn("gap-1 text-xs", statusConfig.color)}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePortofolio(portofolio.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add New Portofolio Form */}
        <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpenIcon className="h-5 w-5 text-[#0d9488]" />
            <h4 className="font-semibold text-[#1e3a5f] dark:text-teal-400">
              Tambah Portofolio Baru
            </h4>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Judul */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portofolio-judul">
                Judul Portofolio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="portofolio-judul"
                placeholder="Masukkan judul portofolio..."
                value={newPortofolio.judul || ""}
                onChange={(e) => handlePortofolioFieldChange("judul", e.target.value)}
              />
            </div>

            {/* Kategori & Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="portofolio-kategori">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newPortofolio.kategori || ""}
                onValueChange={(value) => handlePortofolioFieldChange("kategori", value)}
              >
                <SelectTrigger id="portofolio-kategori">
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {PORTOFOLIO_KATEGORIES.map((kat) => (
                    <SelectItem key={kat.value} value={kat.value}>
                      {kat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portofolio-tanggal">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="portofolio-tanggal"
                type="date"
                value={newPortofolio.tanggal || ""}
                onChange={(e) => handlePortofolioFieldChange("tanggal", e.target.value)}
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portofolio-deskripsi">Deskripsi</Label>
              <Textarea
                id="portofolio-deskripsi"
                placeholder="Deskripsikan portofolio Anda..."
                rows={3}
                value={newPortofolio.deskripsi || ""}
                onChange={(e) => handlePortofolioFieldChange("deskripsi", e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2 md:col-span-2">
              <Label>Upload Dokumen Pendukung</Label>
              <FileUpload
                accept={["application/pdf", "image/jpeg", "image/png"]}
                maxSize={10 * 1024 * 1024}
                label=""
                description="PDF, JPG, PNG - Maksimal 10MB"
                onChange={handleFileChange}
                value={newPortofolio.file ? [newPortofolio.file] : []}
              />
            </div>
          </div>

          {/* Add Button */}
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleAddPortofolio}
              disabled={!isPortofolioFormValid}
              className="gap-2 bg-[#0d9488] hover:bg-teal-700 text-white disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Portofolio
            </Button>
          </div>
        </div>

        {/* Error message */}
        {errors?.portofolio && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {errors.portofolio}
          </div>
        )}
      </FormSection>

      {/* Section 2: Self Assessment */}
      <FormSection
        title="Self Assessment Kompetensi"
        description={`Nilai tingkat kompetensi Anda (${data.kompetensi?.length || 0} kompetensi untuk ${jenisProfesi || "profesi Anda"})`}
      >
        <SelfAssessmentTable
          competencies={data.kompetensi || []}
          onChange={handleCompetencyChange}
          expandable={true}
          showValidation={true}
        />

        {/* Error message */}
        {errors?.kompetensi && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {errors.kompetensi}
          </div>
        )}
      </FormSection>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{data.portofolio?.length || 0}</p>
          <p className="text-xs text-slate-500">Total Portofolio</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{data.kompetensi?.length || 0}</p>
          <p className="text-xs text-slate-500">Total Kompetensi</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {data.kompetensi?.filter((k) => k.level === "KOMPETEN_MANDIRI").length || 0}
          </p>
          <p className="text-xs text-slate-500">Kompeten Mandiri</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {data.kompetensi?.filter((k) => k.level === "KOMPETEN_SUPERVISI").length || 0}
          </p>
          <p className="text-xs text-slate-500">Perlu Supervisi</p>
        </div>
      </div>
    </FormStepContainer>
  );
}

export default StepKompetensi;
