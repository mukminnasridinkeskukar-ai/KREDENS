"use client";

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FormStepContainer, FormSection } from "../form-step-container";
import { KewenanganKlinisTable, KewenanganKlinis } from "../kewenangan-klinis-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircle2Icon,
  FilterIcon,
  ListChecksIcon,
} from "lucide-react";

// Types
export interface StepKewenanganData {
  kewenanganKlinis: KewenanganKlinis[];
}

export interface StepKewenanganProps {
  data: Partial<StepKewenanganData>;
  onChange: (data: StepKewenanganData) => void;
  errors?: Record<string, string>;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  // Context data from previous steps
  jenisSdmk?: string;
  jenisProfesi?: string;
}

// Generate kewenangan klinis list based on profesi and SDMK type
const getKewenanganByProfesi = (
  jenisSdmk?: string,
  jenisProfesi?: string
): KewenanganKlinis[] => {
  const baseId = jenisProfesi?.toLowerCase().replace(/\s+/g, "_") || "default";

  // Define kewenangan based on profesi type
  const kewenanganMap: Record<string, Omit<KewenanganKlinis, "level" | "alasan" | "buktiFile" | "buktiFileName">[]> = {
    // Perawat kewenangan
    perawat: [
      { id: `${baseId}-kk-1`, kode: "KK.P.001", nama: "Pemeriksaan Fisik Dasar", deskripsi: "Melakukan pemeriksaan fisik dasar meliputi vital sign (TD, Nadi, RR, Suhu), tinggi badan, berat badan, dan pemeriksaan fisik sistematis", kategori: "Asuhan Dasar", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-2`, kode: "KK.P.002", nama: "Pemberian Obat Oral", deskripsi: "Memberikan obat melalui oral sesuai dengan 5 benar pemberian obat (pasien, obat, dosis, cara, waktu)", kategori: "Farmakologi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-3`, kode: "KK.P.003", nama: "Pemberian Obat Injeksi (IM/SC/ID)", deskripsi: "Memberikan obat melalui injeksi intramuskular, subkutan, intradermal dengan teknik yang benar", kategori: "Farmakologi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-4`, kode: "KK.P.004", nama: "Pemasangan dan Perawatan Infus", deskripsi: "Melakukan pemasangan infus, penggantian cairan infus, perawatan situs infus, dan monitoring komplikasi", kategori: "Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-5`, kode: "KK.P.005", nama: "Perawatan Luka Akut dan Kronis", deskripsi: "Melakukan perawatan luka akut (luka operasi, trauma) dan kronis (dekubitus, diabetes) termasuk teknik modern wound care", kategori: "Perawatan Luka", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-6`, kode: "KK.P.006", nama: "Resusitasi Jantung Paru Dasar (BLS)", deskripsi: "Melakukan resusitasi jantung paru dasar sesuai standar terbaru AHA/JNC termasuk penggunaan AED", kategori: "Gawat Darurat", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-7`, kode: "KK.P.007", nama: "Pengambilan Sampel Darah Vena", deskripsi: "Melakukan venipuncture untuk pengambilan sampel darah vena untuk pemeriksaan laboratorium", kategori: "Diagnostik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-8`, kode: "KK.P.008", nama: "Pemasangan Kateter Urine", deskripsi: "Melakukan kateterisasi urine dengan teknik aseptik dan antisepik untuk dewasa", kategori: "Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-9`, kode: "KK.P.009", nama: "Pemasangan NGT (Nasogastric Tube)", deskripsi: "Melakukan pemasangan selang nasogastrik untuk dekompresi atau pemberian nutrisi enteral", kategori: "Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-10`, kode: "KK.P.010", nama: "Oksigen Terapi dan Airway Management", deskripsi: "Memberikan oksigen terapi dengan berbagai metode (kanul nasal, masker, NRM) dan pemeliharaan jalan napas sederhana", kategori: "Respiratori", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
    ],
    // Dokter kewenangan
    dokter: [
      { id: `${baseId}-kk-1`, kode: "KK.D.001", nama: "Anamnesis Komprehensif", deskripsi: "Melakukan anamnesis menyeluruh termasuk riwayat penyakit sekarang, riwayat penyakit dahulu, riwayat keluarga, dan riwayat sosial", kategori: "Diagnostik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-2`, kode: "KK.D.002", nama: "Pemeriksaan Fisik Lengkap", deskripsi: "Melakukan pemeriksaan fisik sistematis dari kepala hingga ekstremitas dengan inspeksi, palpasi, perkusi, auskultasi", kategori: "Diagnostik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-3`, kode: "KK.D.003", nama: "Penegakan Diagnosis Klinis", deskripsi: "Menetapkan diagnosis kerja dan diagnosis diferensial berdasarkan data anamnesis, pemeriksaan fisik, dan penunjang", kategori: "Diagnostik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-4`, kode: "KK.D.004", nama: "Penatalaksanaan Medis Konservatif", deskripsi: "Merencanakan dan melaksanakan tata laksana medis non-operatif (farmakologis dan non-farmakologis)", kategori: "Terapeutik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-5`, kode: "KK.D.005", nama: "Tindakan Prosedur Minor", deskripsi: "Melakukan prosedur minor seperti: insisi abses, sutur luka, biopsi kulit, pelepasan jahitan, dan tindakan minor lainnya", kategori: "Prosedural", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-6`, kode: "KK.D.006", nama: "Resusitasi Lanjutan (ACLS)", deskripsi: "Melakukan resusitasi jantung paru lanjutan termasup defibrilasi, intubasi, dan pemberian obat resusitasi", kategori: "Gawat Darurat", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-7`, kode: "KK.D.007", nama: "Manajemen Gawat Darurat", deskripsi: "Menangani kondisi gawat darurat seperti syok, gagal napas, aritmia, stroke, dan kegawatan lainnya di IGD", kategori: "Gawat Darurat", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-8`, kode: "KK.D.008", nama: "Interpretasi EKG", deskripsi: "Membaca dan menginterpretasikan elektrokardiogram untuk deteksi aritmia, iskemia, dan gangguan konduksi", kategori: "Diagnostik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-9`, kode: "KK.D.009", nama: "Intubasi Endotrakeal", deskripsi: "Melakukan intubasi endotrakeal untuk pengamanan jalan napas dalam situasi emergensi dan elektif", kategori: "Prosedural Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-10`, kode: "KK.D.010", nama: "Defibrilasi/Kardioversi", deskripsi: "Melakukan defibrilasi/kardioversi untuk aritmia yang mengancam jiup (VF, VT tanpa nadi)", kategori: "Prosedural", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-11`, kode: "KK.D.011", nama: "Thoracentesis", deskripsi: "Melakukan aspirasi/cairan pleura untuk diagnostik atau terapeutik", kategori: "Prosedural Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-12`, kode: "KK.D.012", nama: "Paracentesis Abdomen", deskripsi: "Melakukan aspirasi cairan ascites untuk diagnostik atau terapeutik", kategori: "Prosedural Invasif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
    ],
    // Bidan kewenangan
    bidan: [
      { id: `${baseId}-kk-1`, kode: "KK.B.001", nama: "Pemeriksaan Antenatal Care (ANC)", deskripsi: "Melakukan pemeriksaan kehamilan rutin meliputi: penilaian status ibu dan janin, pemeriksaan laboratorium, dan edukasi kehamilan", kategori: "Antenatal", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-2`, kode: "KK.B.002", nama: "Persalinan Normal", deskripsi: "Menolong persalinan normal spontan dan membantu persalinan dengan induksi sesuai protap", kategori: "Intranatal", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-3`, kode: "KK.B.003", nama: "Episiotomi dan Jahitan", deskripsi: "Melakukan episiotomi median/mediolateral dan menjahitan luka episiotomi/robekan", kategori: "Intranatal", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-4`, kode: "KK.B.004", nama: "Pelayanan Nifas dan Menyusui", deskripsi: "Memberikan asuhan nifas normal dan konseling menyusui ASI eksklusif", kategori: "Postnatal", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-5`, kode: "KK.B.005", nama: "Pelayanan Keluarga Berencana", deskripsi: "Memberikan layanan KB: konseling, pemasangan/pencabutan AKDR, suntikan hormonal, dan metode barrier", kategori: "KB", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-6`, kode: "KK.B.006", nama: "Deteksi Dini Komplikasi Obstetri", deskripsi: "Mendeteksi tanda bahaya kehamilan dan persalinan serta melakukan rujukan tepat waktu", kategori: "Emergensi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-7`, kode: "KK.B.007", nama: "Asuhan Neonatus Normal", deskripsi: "Memberikan perawatan bayi baru lahir normal: inisiasi menyusu dini, vitamin K1, imunisasi HB0, dan screening", kategori: "Neonatus", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-8`, kode: "KK.B.008", nama: "Resusitasi Bayi Baru Lahir", deskripsi: "Melakukan resusitasi bayi baru lahir sesuai pedoman PPID (Penolong Persalinan Initial Dukungan)", kategori: "Emergensi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
    ],
    // Farmasi/Apoteker kewenangan
    farmasi: [
      { id: `${baseId}-kk-1`, kode: "KK.F.001", nama: "Verifikasi Resep Obat", deskripsi: "Memverifikasi legalitas, kelengkapan, rasionalitas, dan kesesuaian resep obat dengan regulasi", kategori: "Farmasi Klinik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-2`, kode: "KK.F.002", nama: "Compounding Non Steril", deskripsi: "Meracik sediaan farmasi non steril: kapsul, salep, larutan oral, dan sediaan lainnya", kategori: "Compounding", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-3`, kode: "KK.F.003", nama: "Drug Utilization Review (DUR)", deskripsi: "Melakukan review penggunaan obat untuk mengevaluasi kepatuhan, interaksi, dan duplikasi terapi", kategori: "Farmasi Klinik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-4`, kode: "KK.F.004", nama: "Monitoring Terapi Obat", deskripsi: "Melakukan TDM (Therapeutic Drug Monitoring) dan farmakovigilans", kategori: "Farmasi Klinik", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-5`, kode: "KK.F.005", nama: "Konseling Obat Pasien", deskripsi: "Memberikan informasi dan edukasi tentang penggunaan obat yang benar kepada pasien", kategori: "Layanan Farmasi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-6`, kode: "KK.F.006", nama: "Manajemen Efek Samping Obat", deskripsi: "Mengidentifikasi, melaporkan, dan menangani efek samping obat (pharmacovigilance)", kategori: "Keamanan Obat", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
    ],
    // Default/generic kewenangan for other professions
    default: [
      { id: `${baseId}-kk-1`, kode: "KK.G.001", nama: "Kompetensi Teknis Inti Profesi", deskripsi: "Pelaksanaan kompetensi teknis utama sesuai bidang profesi masing-masing", kategori: "Teknis", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-2`, kode: "KK.G.002", nama: "Assessment dan Evaluasi Awal", deskripsi: "Melakukan penilaian awal pasien/klien sesuai standar profesi", kategori: "Assessment", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-3`, kode: "KK.G.003", nama: "Intervensi/Penanganan", deskripsi: "Melakukan intervensi atau penanganan sesuai ruang lingkup praktik", kategori: "Intervensi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-4`, kode: "KK.G.004", nama: "Edukasi dan Konseling", deskripsi: "Memberikan edukasi dan konseling kepada pasien/keluarga", kategori: "Edukasi", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
      { id: `${baseId}-kk-5`, kode: "KK.G.005", nama: "Dokumentasi dan Pelaporan", deskripsi: "Melakukan pencatatan dan pelaporan sesuai standar yang berlaku", kategori: "Administratif", level: "TIDAK_DIAJUKAN", alasan: "", buktiFile: null },
    ],
  };

  // Determine which kewenangan set to use based on profesi
  const profesiKey = jenisProfesi?.toLowerCase() || "default";

  if (profesiKey.includes("perawat") || profesiKey.includes("nurse")) {
    return kewenanganMap.perawat;
  }
  if (profesiKey.includes("dokter") || profesiKey.includes("doctor") || profesiKey.includes("dr.") || profesiKey.includes("sp.")) {
    return kewenanganMap.dokter;
  }
  if (profesiKey.includes("bidan") || profesiKey.includes("midwife")) {
    return kewenanganMap.bidan;
  }
  if (profesiKey.includes("farmasi") || profesiKey.includes("apoteker") || profesiKey.includes("pharmacist")) {
    return kewenanganMap.farmasi;
  }

  // Return default kewenangan
  return kewenanganMap.default;
};

// Filter options for kewenangan
const FILTER_OPTIONS = [
  { value: "semua", label: "Semua" },
  { value: "MANDIRI", label: "Diajukan Mandiri" },
  { value: "DENGAN_SUPERVISI", label: "Diajukan Supervisi" },
  { value: "TIDAK_DIAJUKAN", label: "Tidak Diajukan" },
];

export function StepKewenangan({
  data = {},
  onChange,
  errors,
  onSaveDraft,
  jenisSdmk,
  jenisProfesi,
}: StepKewenanganProps) {
  const [filter, setFilter] = useState<string>("semua");

  // Initialize kewenangan if not exists
  useEffect(() => {
    if (!data.kewenanganKlinis || data.kewenanganKlinis.length === 0) {
      const initialKewenangan = getKewenanganByProfesi(jenisSdmk, jenisProfesi);
      onChange({
        ...data,
        kewenanganKlinis: initialKewenangan,
      } as StepKewenanganData);
    }
  }, [jenisSdmk, jenisProfesi]);

  // Handle kewenangan changes
  const handleKewenanganChange = useCallback(
    (kewenanganKlinis: KewenanganKlinis[]) => {
      onChange({
        ...data,
        kewenanganKlinis,
      } as StepKewenanganData);
    },
    [data, onChange]
  );

  // Filtered kewenangan based on selected filter
  const filteredKewenangan = React.useMemo(() => {
    if (!data.kewenanganKlinis || filter === "semua") {
      return data.kewenanganKlinis || [];
    }
    return (data.kewenanganKlinis || []).filter((k) => k.level === filter);
  }, [data.kewenanganKlinis, filter]);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const allKewenangan = data.kewenanganKlinis || [];
    return {
      total: allKewenangan.length,
      mandiri: allKewenangan.filter((k) => k.level === "MANDIRI").length,
      supervisi: allKewenangan.filter((k) => k.level === "DENGAN_SUPERVISI").length,
      tidakDiajukan: allKewenangan.filter((k) => k.level === "TIDAK_DIAJUKAN").length,
      withBukti: allKewenangan.filter((k) => k.buktiFile).length,
    };
  }, [data.kewenanganKlinis]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set((data.kewenanganKlinis || []).map((k) => k.kategori).filter(Boolean));
    return Array.from(cats);
  }, [data.kewenanganKlinis]);

  return (
    <FormStepContainer
      stepNumber={7}
      totalSteps={8}
      title="Usulan Kewenangan Klinis"
      description="Pilih dan ajukan kewenangan klinis yang Anda minta"
      onSaveDraft={onSaveDraft}
      icon={<ShieldCheckIcon className="h-5 w-5" />}
    >
      {/* Important Info Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
        <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">Penting!</p>
          <p className="mt-1">
            Pilihlah kewenangan klinis yang sesuai dengan kompetensi dan pengalaman Anda. 
            Setiap kewenangan yang diajukan harus dapat dibuktikan dengan bukti pendukung yang memadai. 
            Tim Ad Hoc Kredensial akan menelaah usulan Anda.
          </p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-[#1e3a5f]">{summaryStats.total}</p>
            <p className="text-xs text-slate-500">Total Kewenangan</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-emerald-600">{summaryStats.mandiri}</p>
            <p className="text-xs text-slate-500">Diajukan Mandiri</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-amber-600">{summaryStats.supervisi}</p>
            <p className="text-xs text-slate-500">Dengan Supervisi</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-slate-200 bg-slate-50 dark:bg-slate-800">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-slate-400">{summaryStats.tidakDiajukan}</p>
            <p className="text-xs text-slate-500">Tidak Diajukan</p>
          </CardContent>
        </Card>
        <Card className="p-4 text-center border-teal-200 bg-teal-50/30 dark:bg-teal-900/10">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-[#0d9488]">{summaryStats.withBukti}</p>
            <p className="text-xs text-slate-500">Ada Bukti</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Categories */}
      <FormSection title="" description="">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterIcon className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={filter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt.value)}
              className={
                filter === opt.value
                  ? "bg-[#0d9488] hover:bg-teal-700 text-white"
                  : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            >
              {opt.label}
              {opt.value !== "semua" && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                  {opt.value === "MANDIRI"
                    ? summaryStats.mandiri
                    : opt.value === "DENGAN_SUPERVISI"
                    ? summaryStats.supervisi
                    : summaryStats.tidakDiajukan}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Category Badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <ListChecksIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori:</span>
            {categories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Main Table */}
        <KewenanganKlinisTable
          kewenanganList={filteredKewenangan}
          onChange={handleKewenanganChange}
          expandable={true}
          accept={["application/pdf", "image/jpeg", "image/png"]}
          maxFileSize={10 * 1024 * 1024}
        />

        {/* Error message */}
        {errors?.kewenanganKlinis && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            {errors.kewenanganKlinis}
          </div>
        )}
      </FormSection>

      {/* Information Note */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
          <p className="font-medium">Informasi Usulan Kewenangan</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Mandiri:</strong> Anda dapat melaksanakan kewenangan ini secara mandiri tanpa pengawasan</li>
            <li><strong>Dengan Supervisi:</strong> Anda dapat melaksanakan dengan pengawasan/bimbingan tenaga senior</li>
            <li><strong>Tidak Diajukan:</strong> Anda tidak mengajukan kewenangan ini saat ini</li>
          </ul>
          <p className="mt-2 text-xs">
            * Daftar kewenangan disesuaikan dengan profesi <strong>{jenisProfesi || "yang dipilih"}</strong>. 
            Pastikan Anda mengunggah bukti pendukung untuk setiap kewenangan yang diajukan.
          </p>
        </div>
      </div>

      {/* Validation Warning */}
      {summaryStats.mandiri + summaryStats.supervisi === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Belum Ada Kewenangan Diajukan</p>
            <p className="mt-1">
              Pilih minimal satu kewenangan untuk diajukan (Mandiri atau Dengan Supervisi) sebelum melanjutkan.
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {summaryStats.mandiri + summaryStats.supervisi > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2Icon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800 dark:text-emerald-300">
            <p className="font-medium">Kewenangan Telah Dipilih</p>
            <p className="mt-1">
              Anda telah mengajukan{" "}
              <strong>{summaryStats.mandiri} kewenangan mandiri</strong> dan{" "}
              <strong>{summaryStats.supervisi} kewenangan dengan supervisi</strong>.
              {summaryStats.withBukti > 0 && ` (${summaryStats.withBukti} sudah ada bukti pendukung)`}
            </p>
          </div>
        </div>
      )}
    </FormStepContainer>
  );
}

export default StepKewenangan;
