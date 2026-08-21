import { create } from "zustand";
import { persist } from "zustand/middleware";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Step 1: Identitas Data
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

// Step 2: Profesi Data
export interface ProfesiData {
  jenisSdmk: string;
  jenisProfesi: string;
  jabatanFungsional: string;
  statusKepegawaian: string;
  pangkatGolongan: string;
  unitKerja: string;
  puskesmasId: string;
}

// Step 3: Pendidikan Data
export interface PendidikanData {
  jenjangPendidikan: string;
  programStudi: string;
  institusiPendidikan: string;
  tahunLulus: string;
  kompetensiUtama: string;
  kompetensiKhusus: string;
  keahlianKlinis: string;
}

// Step 4: STR/SIP Data (simplified for store)
export interface StrSipData {
  nomorStr: string;
  tanggalTerbitStr: string;
  tanggalBerakhirStr: string;
  strFile: UploadedFile[];
  nomorSip: string;
  tanggalTerbitSip: string;
  tanggalBerakhirSip: string;
  sipFile: UploadedFile[];
}

// Step 5: Pengalaman Data
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

export interface PengalamanData {
  riwayatPekerjaan: RiwayatPekerjaan[];
  pelatihan: Pelatihan[];
}

// Step 6: Kompetensi Data
export interface CompetencyAssessment {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  level: "BELUM_KOMPETEN" | "KOMPETEN_SUPERVISI" | "KOMPETEN_MANDIRI";
  evidence: string[];
  catatan: string;
}

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

export interface KompetensiData {
  portofolio: PortofolioEntry[];
  kompetensi: CompetencyAssessment[];
}

// Step 7: Kewenangan Data
export interface KewenanganKlinis {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  level: "MANDIRI" | "DENGAN_SUPERVISI" | "TIDAK_DIAJUKAN";
  alasan: string;
  buktiFile: File | null;
  buktiFileName: string | null;
}

export interface KewenanganData {
  kewenanganKlinis: KewenanganKlinis[];
}

// Step 8: Dokumen & Pernyataan Data
export interface DocumentItem {
  id: string;
  nama: string;
  required: boolean;
  status: "BELUM_UPLOAD" | "UPLOADING" | "LENGKAP" | "DIVERIFIKASI" | "DITOLAK";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt?: string;
  catatan?: string;
}

export interface DeclarationItem {
  id: string;
  text: string;
  checked: boolean;
}

// Type aliases for document and declaration data
export type DokumenData = DocumentItem;
export type PernyataanData = DeclarationItem;

// Uploaded File type (used in STR/SIP)
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  status: "valid" | "uploading" | "error" | "idle";
  progress: number;
}

// Complete form data type
export interface CompleteFormData {
  step1Identitas: Partial<IdentitasData>;
  step2Profesi: Partial<ProfesiData>;
  step3Pendidikan: Partial<PendidikanData>;
  step4StrSip: Partial<StrSipData>;
  step5Pengalaman: Partial<PengalamanData>;
  step6Kompetensi: Partial<KompetensiData>;
  step7Kewenangan: KewenanganKlinis[];
  step8Dokumen: DocumentItem[];
  step8Pernyataan: DeclarationItem[];
}

// Draft data structure for API
export interface DraftPayload {
  pengajuanId?: string;
  userId: string;
  currentStep: number;
  // Identitas fields
  nik?: string;
  namaLengkap?: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  nomorWhatsapp?: string;
  email?: string;
  // Profesi fields
  jenisSdmk?: string;
  jenisProfesi?: string;
  jabatanFungsional?: string;
  statusKepegawaian?: string;
  pangkatGolongan?: string;
  unitKerja?: string;
  puskesmasId?: string;
  // Related data arrays
  pendidikan?: Record<string, unknown>[];
  riwayatPekerjaan?: RiwayatPekerjaan[];
  pelatihan?: Pelatihan[];
  portofolio?: PortofolioEntry[];
  selfAssessment?: CompetencyAssessment[];
  kewenanganDiajukan?: KewenanganKlinis[];
  dokumen?: DocumentItem[];
}

// Submit payload
export interface SubmitPayload {
  pengajuanId: string;
  userId: string;
}

// API Response types
export interface DraftResponse {
  success: boolean;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
}

export interface SubmitResponse {
  success: boolean;
  data?: {
    pengajuan: Record<string, unknown>;
    nomorPengajuan: string;
    warnings?: string[];
  };
  message?: string;
  error?: string;
  validationErrors?: string[];
}

// =============================================================================
// STORE STATE INTERFACE
// =============================================================================

interface KredensState {
  // Current step management
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Form data per step
  step1Identitas: Partial<IdentitasData> | null;
  setStep1Identitas: (data: Partial<IdentitasData>) => void;

  step2Profesi: Partial<ProfesiData> | null;
  setStep2Profesi: (data: Partial<ProfesiData>) => void;

  step3Pendidikan: Partial<PendidikanData> | null;
  setStep3Pendidikan: (data: Partial<PendidikanData>) => void;

  step4StrSip: Partial<StrSipData> | null;
  setStep4StrSip: (data: Partial<StrSipData>) => void;

  step5Pengalaman: Partial<PengalamanData> | null;
  setStep5Pengalaman: (data: Partial<PengalamanData>) => void;

  step6Kompetensi: Partial<KompetensiData> | null;
  setStep6Kompetensi: (data: Partial<KompetensiData>) => void;

  step7Kewenangan: KewenanganKlinis[] | null;
  setStep7Kewenangan: (data: KewenanganKlinis[]) => void;

  step8Dokumen: DocumentItem[] | null;
  step8Pernyataan: DeclarationItem[] | null;
  setStep8Dokumen: (data: DocumentItem[]) => void;
  setStep8Pernyataan: (data: DeclarationItem[]) => void;

  // Submission state
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  nomorPengajuan: string | null;
  setNomorPengajuan: (nomor: string) => void;
  submissionSuccess: boolean;
  setSubmissionSuccess: (val: boolean) => void;

  // Draft state
  isSavingDraft: boolean;
  setIsSavingDraft: (val: boolean) => void;
  draftId: string | null;
  setDraftId: (id: string) => void;
  lastSavedAt: Date | null;
  setLastSavedAt: (date: Date) => void;

  // Error handling
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;

  // Actions
  saveDraft: (userId: string) => Promise<{ success: boolean; error?: string }>;
  submitPengajuan: (userId: string) => Promise<{ success: boolean; error?: string; nomorPengajuan?: string }>;
  resetForm: () => void;
  loadFromDraft: (draftId: string, userId: string) => Promise<boolean>;

  // Computed helpers
  getProgressPercentage: () => number;
  getCompletedSteps: () => number;
  getAllFormData: () => CompleteFormData;
  validateCurrentStep: () => { valid: boolean; errors: Record<string, string> };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Current step
  currentStep: 1,
  totalSteps: 8,

  // Form data - all null initially
  step1Identitas: null as Partial<IdentitasData> | null,
  step2Profesi: null as Partial<ProfesiData> | null,
  step3Pendidikan: null as Partial<PendidikanData> | null,
  step4StrSip: null as Partial<StrSipData> | null,
  step5Pengalaman: null as Partial<PengalamanData> | null,
  step6Kompetensi: null as Partial<KompetensiData> | null,
  step7Kewenangan: null as KewenanganKlinis[] | null,
  step8Dokumen: null as DocumentItem[] | null,
  step8Pernyataan: null as DeclarationItem[] | null,

  // Submission state
  isSubmitting: false,
  nomorPengajuan: null as string | null,
  submissionSuccess: false,

  // Draft state
  isSavingDraft: false,
  draftId: null as string | null,
  lastSavedAt: null as Date | null,

  // Errors
  errors: {} as Record<string, string>,
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

const validateStep1 = (data: Partial<IdentitasData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.nik) {
    errors.nik = "NIK wajib diisi";
  } else if (!/^\d{16}$/.test(data.nik)) {
    errors.nik = "NIK harus 16 digit";
  }

  if (!data.namaLengkap || data.namaLengkap.trim() === "") {
    errors.namaLengkap = "Nama Lengkap wajib diisi";
  }

  if (!data.tempatLahir || data.tempatLahir.trim() === "") {
    errors.tempatLahir = "Tempat Lahir wajib diisi";
  }

  if (!data.tanggalLahir) {
    errors.tanggalLahir = "Tanggal Lahir wajib diisi";
  }

  if (!data.jenisKelamin || data.jenisKelamin === "") {
    errors.jenisKelamin = "Jenis Kelamin wajib dipilih";
  }

  return errors;
};

const validateStep2 = (data: Partial<ProfesiData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.jenisSdmk) {
    errors.jenisSdmk = "Jenis SDMK wajib dipilih";
  }

  if (!data.jenisProfesi) {
    errors.jenisProfesi = "Jenis Profesi wajib dipilih";
  }

  if (!data.statusKepegawaian) {
    errors.statusKepegawaian = "Status Kepegawaian wajib dipilih";
  }

  return errors;
};

const validateStep3 = (data: Partial<PendidikanData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.jenjangPendidikan) {
    errors.jenjangPendidikan = "Jenjang Pendidikan wajib dipilih";
  }

  if (!data.programStudi || data.programStudi.trim() === "") {
    errors.programStudi = "Program Studi wajib diisi";
  }

  if (!data.institusiPendidikan || data.institusiPendidikan.trim() === "") {
    errors.institusiPendidikan = "Institusi Pendidikan wajib diisi";
  }

  if (!data.tahunLulus) {
    errors.tahunLulus = "Tahun Lulus wajib diisi";
  }

  return errors;
};

const validateStep4 = (data: Partial<StrSipData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.nomorStr || data.nomorStr.trim() === "") {
    errors.nomorStr = "Nomor STR wajib diisi";
  }

  if (!data.tanggalTerbitStr) {
    errors.tanggalTerbitStr = "Tanggal Terbit STR wajib diisi";
  }

  if (!data.tanggalBerakhirStr) {
    errors.tanggalBerakhirStr = "Tanggal Berakhir STR wajib diisi";
  }

  return errors;
};

const validateStep5 = (data: Partial<PengalamanData>): Record<string, string> => {
  const errors: Record<string, string> = {};
  // Optional validation - work history and training are optional but recommended
  return errors;
};

const validateStep6 = (data: Partial<KompetensiData>): Record<string, string> => {
  const errors: Record<string, string> = {};
  // Optional validation - portfolio is optional
  return errors;
};

const validateStep7 = (data: KewenanganKlinis[] | null): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data || data.length === 0) {
    errors.kewenanganKlinis = "Pilih minimal satu kewenangan klinis";
  } else {
    const hasSelectedKewenangan = data.some(
      (k) => k.level === "MANDIRI" || k.level === "DENGAN_SUPERVISI"
    );
    if (!hasSelectedKewenangan) {
      errors.kewenanganKlinis = "Ajukan minimal satu kewenangan klinis";
    }
  }

  return errors;
};

const validateStep8 = (
  dokumen: DocumentItem[] | null,
  pernyataan: DeclarationItem[] | null
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate documents
  if (dokumen && dokumen.length > 0) {
    const requiredDocs = dokumen.filter((d) => d.required);
    const incompleteDocs = requiredDocs.filter(
      (d) => d.status !== "LENGKAP" && d.status !== "DIVERIFIKASI"
    );
    if (incompleteDocs.length > 0) {
      errors.dokumen = `${incompleteDocs.length} dokumen wajib belum lengkap`;
    }
  }

  // Validate declarations
  if (pernyataan && pernyataan.length > 0) {
    const allChecked = pernyataan.every((d) => d.checked);
    if (!allChecked) {
      errors.pernyataan = "Semua pernyataan wajib dicentang";
    }
  }

  return errors;
};

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useKredensStore = create<KredensState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // STEP NAVIGATION
      // =========================================================================

      setCurrentStep: (step: number) => {
        const { totalSteps } = get();
        const clampedStep = Math.max(1, Math.min(step, totalSteps));
        set({ currentStep: clampedStep });
      },

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 });
          // Scroll to top on step change
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
          // Scroll to top on step change
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      },

      goToStep: (step: number) => {
        const { currentStep, totalSteps } = get();
        // Only allow going to completed steps or next step
        if (step <= currentStep + 1 && step >= 1 && step <= totalSteps) {
          set({ currentStep: step });
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      },

      // =========================================================================
      // STEP DATA SETTERS
      // =========================================================================

      setStep1Identitas: (data: Partial<IdentitasData>) => {
        set({ step1Identitas: data });
      },

      setStep2Profesi: (data: Partial<ProfesiData>) => {
        set({ step2Profesi: data });
      },

      setStep3Pendidikan: (data: Partial<PendidikanData>) => {
        set({ step3Pendidikan: data });
      },

      setStep4StrSip: (data: Partial<StrSipData>) => {
        set({ step4StrSip: data });
      },

      setStep5Pengalaman: (data: Partial<PengalamanData>) => {
        set({ step5Pengalaman: data });
      },

      setStep6Kompetensi: (data: Partial<KompetensiData>) => {
        set({ step6Kompetensi: data });
      },

      setStep7Kewenangan: (data: KewenanganKlinis[]) => {
        set({ step7Kewenangan: data });
      },

      setStep8Dokumen: (data: DocumentItem[]) => {
        set({ step8Dokumen: data });
      },

      setStep8Pernyataan: (data: DeclarationItem[]) => {
        set({ step8Pernyataan: data });
      },

      // =========================================================================
      // SUBMISSION STATE
      // =========================================================================

      setIsSubmitting: (val: boolean) => {
        set({ isSubmitting: val });
      },

      setNomorPengajuan: (nomor: string) => {
        set({ nomorPengajuan: nomor });
      },

      setSubmissionSuccess: (val: boolean) => {
        set({ submissionSuccess: val });
      },

      // =========================================================================
      // DRAFT STATE
      // =========================================================================

      setIsSavingDraft: (val: boolean) => {
        set({ isSavingDraft: val });
      },

      setDraftId: (id: string) => {
        set({ draftId: id });
      },

      setLastSavedAt: (date: Date) => {
        set({ lastSavedAt: date });
      },

      // =========================================================================
      // ERROR HANDLING
      // =========================================================================

      setErrors: (errors: Record<string, string>) => {
        set({ errors });
      },

      clearErrors: () => {
        set({ errors: {} });
      },

      setError: (field: string, error: string) => {
        set((state) => ({
          errors: { ...state.errors, [field]: error },
        }));
      },

      clearError: (field: string) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];
          return { errors: newErrors };
        });
      },

      // =========================================================================
      // COMPUTED HELPERS
      // =========================================================================

      getProgressPercentage: () => {
        const { currentStep, totalSteps } = get();
        return Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
      },

      getCompletedSteps: () => {
        const { currentStep } = get();
        return currentStep - 1;
      },

      getAllFormData: (): CompleteFormData => {
        const state = get();
        return {
          step1Identitas: state.step1Identitas || {},
          step2Profesi: state.step2Profesi || {},
          step3Pendidikan: state.step3Pendidikan || {},
          step4StrSip: state.step4StrSip || {},
          step5Pengalaman: state.step5Pengalaman || {},
          step6Kompetensi: state.step6Kompetensi || {},
          step7Kewenangan: state.step7Kewenangan || [],
          step8Dokumen: state.step8Dokumen || [],
          step8Pernyataan: state.step8Pernyataan || [],
        };
      },

      validateCurrentStep: () => {
        const { currentStep, step1Identitas, step2Profesi, step3Pendidikan, step4StrSip, step5Pengalaman, step6Kompetensi, step7Kewenangan, step8Dokumen, step8Pernyataan } = get();

        switch (currentStep) {
          case 1:
            return { valid: Object.keys(validateStep1(step1Identitas || {})).length === 0, errors: validateStep1(step1Identitas || {}) };
          case 2:
            return { valid: Object.keys(validateStep2(step2Profesi || {})).length === 0, errors: validateStep2(step2Profesi || {}) };
          case 3:
            return { valid: Object.keys(validateStep3(step3Pendidikan || {})).length === 0, errors: validateStep3(step3Pendidikan || {}) };
          case 4:
            return { valid: Object.keys(validateStep4(step4StrSip || {})).length === 0, errors: validateStep4(step4StrSip || {}) };
          case 5:
            return { valid: true, errors: validateStep5(step5Pengalaman || {}) };
          case 6:
            return { valid: true, errors: validateStep6(step6Kompetensi || {}) };
          case 7:
            return { valid: Object.keys(validateStep7(step7Kewenangan)).length === 0, errors: validateStep7(step7Kewenangan) };
          case 8:
            return { valid: Object.keys(validateStep8(step8Dokumen, step8Pernyataan)).length === 0, errors: validateStep8(step8Dokumen, step8Pernyataan) };
          default:
            return { valid: true, errors: {} };
        }
      },

      // =========================================================================
      // ACTIONS
      // =========================================================================

      saveDraft: async (userId: string) => {
        const state = get();

        try {
          state.setIsSavingDraft(true);

          // Build payload from current state
          const payload: DraftPayload = {
            userId,
            currentStep: state.currentStep,
            // Identitas fields
            nik: state.step1Identitas?.nik,
            namaLengkap: state.step1Identitas?.namaLengkap,
            gelarDepan: state.step1Identitas?.gelarDepan,
            gelarBelakang: state.step1Identitas?.gelarBelakang,
            tempatLahir: state.step1Identitas?.tempatLahir,
            tanggalLahir: state.step1Identitas?.tanggalLahir,
            jenisKelamin: state.step1Identitas?.jenisKelamin,
            nomorWhatsapp: state.step1Identitas?.nomorWhatsApp,
            email: state.step1Identitas?.email,
            // Profesi fields
            jenisSdmk: state.step2Profesi?.jenisSdmk,
            jenisProfesi: state.step2Profesi?.jenisProfesi,
            jabatanFungsional: state.step2Profesi?.jabatanFungsional,
            statusKepegawaian: state.step2Profesi?.statusKepegawaian,
            pangkatGolongan: state.step2Profesi?.pangkatGolongan,
            unitKerja: state.step2Profesi?.unitKerja,
            puskesmasId: state.step2Profesi?.puskesmasId,
            // Include existing draft ID if available
            ...(state.draftId ? { pengajuanId: state.draftId } : {}),
          };

          // Add pendidikan as array
          if (state.step3Pendidikan) {
            payload.pendidikan = [{
              jenjang: state.step3Pendidikan.jenjangPendidikan,
              programStudi: state.step3Pendidikan.programStudi,
              institusi: state.step3Pendidikan.institusiPendidikan,
              tahunLulus: parseInt(state.step3Pendidikan.tahunLulus) || new Date().getFullYear(),
              kompetensiUtama: state.step3Pendidikan.kompetensiUtama,
              kompetensiKhusus: state.step3Pendidikan.kompetensiKhusus,
              keahlianKlinis: state.step3Pendidikan.keahlianKlinis,
            }];
          }

          // Add riwayat pekerjaan
          if (state.step5Pengalaman?.riwayatPekerjaan) {
            payload.riwayatPekerjaan = state.step5Pengalaman.riwayatPekerjaan;
          }

          // Add pelatihan
          if (state.step5Pengalaman?.pelatihan) {
            payload.pelatihan = state.step5Pengalaman.pelatihan;
          }

          // Add portofolio
          if (state.step6Kompetensi?.portofolio) {
            payload.portofolio = state.step6Kompetensi.portofolio;
          }

          // Add self assessment
          if (state.step6Kompetensi?.kompetensi) {
            payload.selfAssessment = state.step6Kompetensi.kompetensi;
          }

          // Add kewenangan diajukan
          if (state.step7Kewenangan) {
            payload.kewenanganDiajukan = state.step7Kewenangan;
          }

          // Add dokumen
          if (state.step8Dokumen) {
            payload.dokumen = state.step8Dokumen;
          }

          // Call API
          const response = await fetch("/api/kredens/draft", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const result: DraftResponse = await response.json();

          if (result.success && result.data) {
            // Update draft ID if newly created
            if (!state.draftId && result.data.id) {
              state.setDraftId(result.data.id as string);
            }
            state.setLastSavedAt(new Date());
            state.setIsSavingDraft(false);
            return { success: true };
          } else {
            state.setIsSavingDraft(false);
            return {
              success: false,
              error: result.error || "Gagal menyimpan draft",
            };
          }
        } catch (error) {
          console.error("Error saving draft:", error);
          state.setIsSavingDraft(false);
          
          // Save to localStorage as fallback
          try {
            const localStorageKey = `kredens-draft-${userId}`;
            const draftData = {
              ...payload,
              savedAt: new Date().toISOString(),
              isLocalOnly: true,
            };
            if (typeof window !== "undefined") {
              localStorage.setItem(localStorageKey, JSON.stringify(draftData));
            }
            return { success: true, error: undefined }; // Return success since we have local backup
          } catch (localError) {
            return {
              success: false,
              error: "Gagal menyimpan draft. Silakan coba lagi.",
            };
          }
        }
      },

      submitPengajuan: async (userId: string) => {
        const state = get();

        try {
          state.setIsSubmitting(true);
          state.clearErrors();

          // First save draft to ensure all data is persisted
          const saveResult = await state.saveDraft(userId);

          if (!saveResult.success && !state.draftId) {
            state.setIsSubmitting(false);
            return {
              success: false,
              error: saveResult.error || "Gagal menyimpan data sebelum pengajuan",
            };
          }

          // Validate all steps before submission
          let hasErrors = false;
          const allErrors: Record<string, string> = {};

          // Validate each step
          const step1Validation = validateStep1(state.step1Identitas || {});
          if (Object.keys(step1Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step1Validation);
          }

          const step2Validation = validateStep2(state.step2Profesi || {});
          if (Object.keys(step2Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step2Validation);
          }

          const step3Validation = validateStep3(state.step3Pendidikan || {});
          if (Object.keys(step3Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step3Validation);
          }

          const step4Validation = validateStep4(state.step4StrSip || {});
          if (Object.keys(step4Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step4Validation);
          }

          const step7Validation = validateStep7(state.step7Kewenangan);
          if (Object.keys(step7Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step7Validation);
          }

          const step8Validation = validateStep8(state.step8Dokumen, state.step8Pernyataan);
          if (Object.keys(step8Validation).length > 0) {
            hasErrors = true;
            Object.assign(allErrors, step8Validation);
          }

          if (hasErrors) {
            state.setErrors(allErrors);
            state.setIsSubmitting(false);
            
            // Navigate to first step with errors
            const firstErrorStep = Object.keys(allErrors)[0];
            if (firstErrorStep.startsWith("step")) {
              const stepNum = parseInt(firstErrorStep.replace("step", ""));
              if (stepNum >= 1 && stepNum <= 8) {
                state.setCurrentStep(stepNum);
              }
            }
            
            return {
              success: false,
              error: "Mohon lengkapi data yang belum lengkap",
            };
          }

          // Check if we have a draft ID
          if (!state.draftId) {
            state.setIsSubmitting(false);
            return {
              success: false,
              error: "Tidak ada draft yang dapat diajukan. Silakan simpan terlebih dahulu.",
            };
          }

          // Submit the pengajuan
          const submitPayload: SubmitPayload = {
            pengajuanId: state.draftId,
            userId,
          };

          const response = await fetch("/api/kredens/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(submitPayload),
          });

          const result: SubmitResponse = await response.json();

          if (result.success) {
            state.setNomorPengajuan(result.data?.nomorPengajuan || "");
            state.setSubmissionSuccess(true);
            state.setIsSubmitting(false);
            
            // Clear local storage on successful submission
            try {
              if (typeof window !== "undefined") {
                localStorage.removeItem(`kredens-draft-${userId}`);
              }
            } catch (e) {
              // Ignore localStorage errors
            }
            
            return {
              success: true,
              nomorPengajuan: result.data?.nomorPengajuan,
            };
          } else {
            state.setIsSubmitting(false);
            return {
              success: false,
              error: result.error || result.validationErrors?.join(", ") || "Gagal mengajukan kredensial",
            };
          }
        } catch (error) {
          console.error("Error submitting pengajuan:", error);
          state.setIsSubmitting(false);
          return {
            success: false,
            error: "Terjadi kesalahan saat mengajukan kredensial. Silakan coba lagi.",
          };
        }
      },

      resetForm: () => {
        set({
          ...initialState,
          // Keep totalSteps
          totalSteps: 8,
        });
        
        // Clear localStorage
        try {
          if (typeof window !== "undefined") {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith("kredens-")) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      },

      loadFromDraft: async (draftId: string, userId: string) => {
        try {
          const response = await fetch(`/api/kredens/draft?userId=${userId}`);
          const result: DraftResponse = await response.json();

          if (result.success && result.data) {
            const drafts = result.data as Record<string, unknown>[];
            const draft = drafts.find((d) => d.id === draftId);

            if (draft) {
              // Populate state with draft data
              set({
                draftId: draft.id as string,
                currentStep: (draft.tahapanSaatIni as number) || 1,
                step1Identitas: {
                  nik: draft.nik as string,
                  namaLengkap: draft.namaLengkap as string,
                  gelarDepan: draft.gelarDepan as string,
                  gelarBelakang: draft.gelarBelakang as string,
                  tempatLahir: draft.tempatLahir as string,
                  tanggalLahir: draft.tanggalLahir as string,
                  jenisKelamin: draft.jenisKelamin as string,
                  nomorWhatsApp: draft.nomorWhatsapp as string,
                  email: draft.email as string,
                },
                step2Profesi: {
                  jenisSdmk: draft.jenisSdmk as string,
                  jenisProfesi: draft.jenisProfesi as string,
                  jabatanFungsional: draft.jabatanFungsional as string,
                  statusKepegawaian: draft.statusKepegawaian as string,
                  pangkatGolongan: draft.pangkatGolongan as string,
                  unitKerja: draft.unitKerja as string,
                  puskesmasId: draft.puskesmasId as string,
                },
                lastSavedAt: new Date(draft.updatedAt as string),
              });
              
              return true;
            }
          }
          
          return false;
        } catch (error) {
          console.error("Error loading draft:", error);
          return false;
        }
      },
    }),
    {
      name: "kredens-form-storage",
      // Only persist specific fields
      partialize: (state) => ({
        currentStep: state.currentStep,
        step1Identitas: state.step1Identitas,
        step2Profesi: state.step2Profesi,
        step3Pendidikan: state.step3Pendidikan,
        step4StrSip: state.step4StrSip,
        step5Pengalaman: state.step5Pengalaman,
        step6Kompetensi: state.step6Kompetensi,
        step7Kewenangan: state.step7Kewenangan,
        step8Dokumen: state.step8Dokumen,
        step8Pernyataan: state.step8Pernyataan,
        draftId: state.draftId,
        lastSavedAt: state.lastSavedAt,
        nomorPengajuan: state.nomorPengajuan,
        submissionSuccess: state.submissionSuccess,
      }),
      // Version for future migrations
      version: 1,
    }
  )
);

// Export types for use in components
export type {
  KredensState,
  IdentitasData,
  ProfesiData,
  PendidikanData,
  StrSipData,
  PengalamanData,
  KompetensiData,
  KewenanganData,
  DokumenData,
  Pernyataan,
  RiwayatPekerjaan,
  Pelatihan,
  CompetencyAssessment,
  PortofolioEntry,
  KewenanganKlinis,
  DocumentItem,
  DeclarationItem,
  UploadedFile,
  CompleteFormData,
  DraftPayload,
  SubmitPayload,
  DraftResponse,
  SubmitResponse,
};

// Default export
export default useKredensStore;
