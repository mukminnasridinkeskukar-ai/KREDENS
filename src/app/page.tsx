"use client";

import React, { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useKredensStore } from "@/lib/store/kredens-store";
import { KredensStepper } from "@/components/kredens/kredens-stepper";
import { FormStepContainer } from "@/components/kredens/form-step-container";

// Step Components
import { StepIdentitas } from "@/components/kredens/steps/step-identitas";
import { StepProfesi } from "@/components/kredens/steps/step-profesi";
import { StepPendidikan } from "@/components/kredens/steps/step-pendidikan";
import { StepStrSip } from "@/components/kredens/steps/step-str-sip";
import { StepPengalaman } from "@/components/kredens/steps/step-pengalaman";
import { StepKompetensi } from "@/components/kredens/steps/step-kompetensi";
import { StepKewenangan } from "@/components/kredens/steps/step-kewenangan";
import { StepPengajuan } from "@/components/kredens/steps/step-pengajuan";

// shadcn/ui Components
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import {
  ShieldIcon,
  SunIcon,
  MoonIcon,
  SaveIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Loader2Icon,
  FileCheckIcon,
  ChevronRightIcon,
  HomeIcon,
  LogOutIcon,
  ClockIcon,
  RefreshCwIcon,
} from "lucide-react";

// Theme provider hook
import { useTheme } from "next-themes";

// =============================================================================
// CONSTANTS
// =============================================================================

const TOTAL_STEPS = 8;
const APP_TITLE = "FORMULIR PENGAJUAN KREDENSIAL ONLINE";
const APP_SUBTITLE = "Sistem Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan";
const INSTITUTION = "Dinas Kesehatan Kabupaten Kutai Kartanegara";
const MOTTO = "Tepat Kompetensi, Tepat Kewenangan, Aman Pelayanan";

// Auto-save interval in milliseconds (30 seconds)
const AUTO_SAVE_INTERVAL = 30000;

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function KredensPage() {
  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Store state
  const currentStep = useKredensStore((s) => s.currentStep);
  const setCurrentStep = useKredensStore((s) => s.setCurrentStep);
  const nextStep = useKredensStore((s) => s.nextStep);
  const prevStep = useKredensStore((s) => s.prevStep);

  // Form data
  const step1Identitas = useKredensStore((s) => s.step1Identitas);
  const setStep1Identitas = useKredensStore((s) => s.setStep1Identitas);
  const step2Profesi = useKredensStore((s) => s.step2Profesi);
  const setStep2Profesi = useKredensStore((s) => s.setStep2Profesi);
  const step3Pendidikan = useKredensStore((s) => s.step3Pendidikan);
  const setStep3Pendidikan = useKredensStore((s) => s.setStep3Pendidikan);
  const step4StrSip = useKredensStore((s) => s.step4StrSip);
  const setStep4StrSip = useKredensStore((s) => s.setStep4StrSip);
  const step5Pengalaman = useKredensStore((s) => s.step5Pengalaman);
  const setStep5Pengalaman = useKredensStore((s) => s.setStep5Pengalaman);
  const step6Kompetensi = useKredensStore((s) => s.step6Kompetensi);
  const setStep6Kompetensi = useKredensStore((s) => s.setStep6Kompetensi);
  const step7Kewenangan = useKredensStore((s) => s.step7Kewenangan);
  const setStep7Kewenangan = useKredensStore((s) => s.setStep7Kewenangan);
  const step8Dokumen = useKredensStore((s) => s.step8Dokumen);
  const setStep8Dokumen = useKredensStore((s) => s.setStep8Dokumen);
  const step8Pernyataan = useKredensStore((s) => s.step8Pernyataan);
  const setStep8Pernyataan = useKredensStore((s) => s.setStep8Pernyataan);

  // Submission state
  const isSubmitting = useKredensStore((s) => s.isSubmitting);
  const isSavingDraft = useKredensStore((s) => s.isSavingDraft);
  const lastSavedAt = useKredensStore((s) => s.lastSavedAt);
  const nomorPengajuan = useKredensStore((s) => s.nomorPengajuan);
  const submissionSuccess = useKredensStore((s) => s.submissionSuccess);
  const draftId = useKredensStore((s) => s.draftId);

  // Actions
  const saveDraft = useKredensStore((s) => s.saveDraft);
  const submitPengajuan = useKredensStore((s) => s.submitPengajuan);
  const resetForm = useKredensStore((s) => s.resetForm);
  const getProgressPercentage = useKredensStore((s) => s.getProgressPercentage);
  const getAllFormData = useKredensStore((s) => s.getAllFormData);
  const validateCurrentStep = useKredensStore((s) => s.validateCurrentStep);

  // Local state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Demo user ID (in real app, this would come from auth session)
  const DEMO_USER_ID = "demo-user-001";

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Handle mount for theme and loading state
  React.useEffect(() => {
    setMounted(true);
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // ===========================================================================
  // HANDLERS (Declared before effects that use them)
  // ===========================================================================

  const handleSaveDraft = useCallback(async () => {
    try {
      const result = await saveDraft(DEMO_USER_ID);
      if (result.success) {
        toast.success("Draft berhasil disimpan", {
          description: "Perubahan Anda telah disimpan secara otomatis",
          icon: <SaveIcon className="h-4 w-4" />,
        });
      } else {
        toast.error("Gagal menyimpan draft", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [saveDraft]);

  const handleSubmit = useCallback(async () => {
    try {
      const result = await submitPengajuan(DEMO_USER_ID);
      
      if (result.success) {
        setShowSuccessDialog(true);
        toast.success("Pengajuan Berhasil!", {
          description: `Nomor Pengajuan: ${result.nomorPengajuan}`,
          duration: 5000,
          icon: <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />,
        });
      } else {
        toast.error("Pengajuan Gagal", {
          description: result.error,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Terjadi Kesalahan", {
        description: "Silakan coba lagi nanti",
      });
    }
  }, [submitPengajuan]);

  const handleReset = useCallback(() => {
    resetForm();
    setShowResetDialog(false);
    toast.info("Form telah direset", {
      description: "Semua data telah dihapus",
      icon: <RotateCcwIcon className="h-4 w-4" />,
    });
  }, [resetForm]);

  const handleNext = useCallback(() => {
    const validation = validateCurrentStep();
    
    if (!validation.valid && Object.keys(validation.errors).length > 0) {
      toast.error("Validasi Gagal", {
        description: "Mohon lengkapi data yang diperlukan",
      });
      return;
    }
    
    nextStep();
  }, [nextStep, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Get all form data for review summary
  const allFormData = getAllFormData();

  // Calculate progress
  const progressPercentage = getProgressPercentage();

  // ===========================================================================
  // EFFECTS (Declared after handlers)
  // ===========================================================================

  // Auto-save effect - save when moving past step 1
  useEffect(() => {
    if (!draftId && currentStep > 1) {
      // Auto-save when moving past step 1
      const timer = setTimeout(() => {
        handleSaveDraft();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, handleSaveDraft]);

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep > 1 && !isSubmitting) {
        handleSaveDraft();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentStep, isSubmitting, handleSaveDraft]);

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a]">
        {/* Header Skeleton */}
        <header className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stepper Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>

          {/* Form Container Skeleton */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] p-6">
              <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
              <Skeleton className="h-4 w-72 bg-white/20" />
            </div>
            <div className="p-6 lg:p-8 space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-4 pt-6">
                <Skeleton className="h-11 w-24" />
                <Skeleton className="h-11 w-32 ml-auto" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ===========================================================================
  // SUCCESS STATE (After Submission)
  // ===========================================================================

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-[#0f172a] dark:to-[#0c1929] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2Icon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Pengajuan Berhasil!
              </h1>
              <p className="text-emerald-100">
                Kredensial Anda telah berhasil diajukan
              </p>
            </div>

            {/* Success Content */}
            <div className="p-8 space-y-6">
              {/* Nomor Pengajuan */}
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                  Nomor Pengajuan
                </p>
                <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {nomorPengajuan || "-"}
                </p>
              </div>

              {/* Info List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Pengajuan akan diproses oleh Tim Ad Hoc Kredensial
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Anda dapat memantau status pengajuan kapan saja
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Notifikasi akan dikirim melalui WhatsApp terdaftar
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1 gap-2"
                >
                  Cetak Bukti
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowSuccessDialog(false);
                  }}
                  className="flex-1 gap-2 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488]"
                >
                  Ajukan Baru
                </Button>
              </div>
            </div>

            {/* Footer Info */}
            <div className="px-8 pb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                <p className="text-xs text-slate-500">
                  {INSTITUTION}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Sistem Tata Kelola Kredensial © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors duration-300">
      {/* Toaster */}
      <Toaster position="top-right" richColors closeButton />

      {/* ================================================================== */}
      {/* HEADER SECTION */}
      {/* ================================================================== */}
      <header className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Logo */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d9488] flex items-center justify-center shadow-md">
                <ShieldIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>

              {/* Title Group - Hidden on small screens */}
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg font-bold text-[#1e3a5f] dark:text-teal-400 leading-tight">
                  {APP_TITLE}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
                  {APP_SUBTITLE}
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Draft Status Indicator */}
              {lastSavedAt && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ClockIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Tersimpan {new Date(lastSavedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}

              {/* Auto-save indicator */}
              {isSavingDraft && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full border border-amber-200 dark:border-amber-800">
                  <Loader2Icon className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span className="text-xs text-amber-600 font-medium">Menyimpan...</span>
                </div>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full h-9 w-9"
                aria-label={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
              >
                {mounted && theme === "dark" ? (
                  <SunIcon className="h-4 w-4 text-amber-400" />
                ) : (
                  <MoonIcon className="h-4 w-4 text-slate-600" />
                )}
              </Button>

              {/* Reset Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="hidden md:flex gap-2 text-slate-600 dark:text-slate-300"
              >
                <RotateCcwIcon className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Institution Banner */}
        <div className="bg-gradient-to-r from-[#1e3a5f] via-[#1a3556] to-[#0d9488] py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-xs md:text-sm text-white/90 font-medium truncate">
              {INSTITUTION}
            </p>
            <p className="text-xs text-white/70 hidden sm:block italic">
              &ldquo;{MOTTO}&rdquo;
            </p>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24">
        {/* Mobile Header Info */}
        <div className="sm:hidden mb-4 p-4 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#0d9488] flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#1e3a5f] dark:text-teal-400">KREDENS</p>
              <p className="text-xs text-slate-500">{INSTITUTION}</p>
            </div>
          </div>
        </div>

        {/* Progress Overview Card */}
        <div className="mb-6 p-4 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1e3a5f" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#1e3a5f] dark:text-teal-400">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Langkah {currentStep} dari {TOTAL_STEPS}
                </p>
                <p className="text-sm text-slate-500">
                  {getStepTitle(currentStep)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick actions for mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="sm:hidden gap-2"
              >
                {isSavingDraft ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                Simpan
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="sm:hidden gap-2 text-red-600"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* STEPPER COMPONENT */}
        <div className="mb-8">
          <KredensStepper
            currentStep={currentStep}
            onStepChange={(step) => setCurrentStep(step)}
          />
        </div>

        {/* ================================================================== */}
        {/* FORM STEP CONTAINER - Conditional Rendering */}
        {/* ================================================================== */}

        {/* STEP 1: IDENTITAS */}
        {currentStep === 1 && (
          <FormStepContainer
            stepNumber={1}
            totalSteps={TOTAL_STEPS}
            title="Data Identitas Pemohon"
            description="Lengkapi data identitas diri Anda sesuai dokumen resmi"
            onPrevious={undefined}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            canProceed={
              !!step1Identitas?.nik &&
              step1Identitas.nik.length === 16 &&
              !!step1Identitas?.namaLengkap &&
              !!step1Identitas?.tempatLahir &&
              !!step1Identitas?.tanggalLahir &&
              !!step1Identitas?.jenisKelamin
            }
          >
            <StepIdentitas
              data={step1Identitas || {}}
              onChange={setStep1Identitas}
              onSaveDraft={handleSaveDraft}
            />
          </FormStepContainer>
        )}

        {/* STEP 2: PROFESI */}
        {currentStep === 2 && (
          <FormStepContainer
            stepNumber={2}
            totalSteps={TOTAL_STEPS}
            title="Data Profesi Keperawatan"
            description="Informasi profesi dan status kepegawaian Anda"
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            canProceed={
              !!step2Profesi?.jenisSdmk &&
              !!step2Profesi?.jenisProfesi &&
              !!step2Profesi?.statusKepegawaian
            }
          >
            <StepProfesi
              data={step2Profesi || {}}
              onChange={setStep2Profesi}
              onSaveDraft={handleSaveDraft}
            />
          </FormStepContainer>
        )}

        {/* STEP 3: PENDIDIKAN */}
        {currentStep === 3 && (
          <FormStepContainer
            stepNumber={3}
            totalSteps={TOTAL_STEPS}
            title="Riwayat Pendidikan"
            description="Data pendidikan formal dan kompetensi yang dimiliki"
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            canProceed={
              !!step3Pendidikan?.jenjangPendidikan &&
              !!step3Pendidikan?.programStudi &&
              !!step3Pendidikan?.institusiPendidikan &&
              !!step3Pendidikan?.tahunLulus
            }
          >
            <StepPendidikan
              data={step3Pendidikan || {}}
              onChange={setStep3Pendidikan}
              onSaveDraft={handleSaveDraft}
            />
          </FormStepContainer>
        )}

        {/* STEP 4: STR/SIP */}
        {currentStep === 4 && (
          <FormStepContainer
            stepNumber={4}
            totalSteps={TOTAL_STEPS}
            title="Dokumen Registrasi (STR/SIP)"
            description="Upload dan verifikasi Surat Tanda Registrasi serta Izin Praktik"
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            canProceed={
              !!step4StrSip?.nomorStr &&
              !!step4StrSip?.tanggalTerbitStr &&
              !!step4StrSip?.tanggalBerakhirStr
            }
          >
            <StepStrSip
              data={step4StrSip || {}}
              onChange={setStep4StrSip}
              onSaveDraft={handleSaveDraft}
            />
          </FormStepContainer>
        )}

        {/* STEP 5: PENGALAMAN */}
        {currentStep === 5 && (
          <StepPengalaman
            data={step5Pengalaman || {}}
            onChange={setStep5Pengalaman}
            onSaveDraft={handleSaveDraft}
          />
        )}

        {/* STEP 6: KOMPETENSI */}
        {currentStep === 6 && (
          <StepKompetensi
            data={step6Kompetensi || {}}
            onChange={setStep6Kompetensi}
            onSaveDraft={handleSaveDraft}
            jenisSdmk={step2Profesi?.jenisSdmk}
            jenisProfesi={step2Profesi?.jenisProfesi}
          />
        )}

        {/* STEP 7: KEWENANGAN */}
        {currentStep === 7 && (
          <StepKewenangan
            data={{ kewenanganKlinis: step7Kewenangan || [] }}
            onChange={(data) => setStep7Kewenangan(data.kewenanganKlinis)}
            onSaveDraft={handleSaveDraft}
            jenisSdmk={step2Profesi?.jenisSdmk}
            jenisProfesi={step2Profesi?.jenisProfesi}
          />
        )}

        {/* STEP 8: PENGAJUAN (Review & Submit) */}
        {currentStep === 8 && (
          <StepPengajuan
            data={{
              dokumen: step8Dokumen || [],
              pernyataan: step8Pernyataan || [],
            }}
            onChange={(data) => {
              if (data.dokumen) setStep8Dokumen(data.dokumen);
              if (data.pernyataan) setStep8Pernyataan(data.pernyataan);
            }}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            allFormData={allFormData as Record<string, unknown>}
            jenisProfesi={step2Profesi?.jenisProfesi}
            isSubmitting={isSubmitting}
          />
        )}
      </main>

      {/* ================================================================== */}
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-700 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} {INSTITUTION}</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Sistem KREDENS v1.0</span>
            </div>
            <div className="flex items-center gap-3">
              {draftId && (
                <span className="hidden md:flex items-center gap-1">
                  <FileCheckIcon className="w-3.5 h-3.5" />
                  Draft ID: {draftId.slice(0, 8)}...
                </span>
              )}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-[#0d9488] transition-colors"
              >
                ↑ Atas
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================== */}
      {/* DIALOGS */}
      {/* ================================================================== */}

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
              </div>
              Reset Formulir?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin mereset seluruh formulir? Semua data yang telah
              diisi akan hilang dan tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Jika Anda sudah menyimpan draft sebelumnya, data tersebut tetap aman
                  di server.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="flex-1 sm:w-auto"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              className="flex-1 sm:w-auto gap-2"
            >
              <RotateCcwIcon className="h-4 w-4" />
              Ya, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <CheckCircle2Icon className="w-7 h-7 text-white" />
              </div>
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                Pengajuan Kredensial Berhasil!
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Data pengajuan Anda telah diterima dan akan diproses oleh Tim Ad Hoc Kredensial.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {/* Nomor Pengajuan Card */}
            <div className="p-4 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] rounded-xl text-center">
              <p className="text-white/80 text-sm mb-1">Nomor Pengajuan</p>
              <p className="text-2xl font-bold font-mono text-white tracking-wide">
                {nomorPengajuan || "-"}
              </p>
            </div>

            {/* Next Steps */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Langkah Selanjutnya:
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  Pantau status pengajuan secara berkala
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  Siapkan dokumen asli untuk verifikasi
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRightIcon className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  Periksa notifikasi untuk update status
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                resetForm();
              }}
              className="w-full gap-2 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488]"
            >
              Ajukan Kredensial Baru
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStepTitle(step: number): string {
  const titles: Record<number, string> = {
    1: "Data Identitas Pemohon",
    2: "Data Profesi Keperawatan",
    3: "Riwayat Pendidikan",
    4: "Dokumen Registrasi (STR/SIP)",
    5: "Riwayat Pengalaman Kerja",
    6: "Portofolio & Self Assessment",
    7: "Usulan Kewenangan Klinis",
    8: "Review & Pengajuan",
  };
  return titles[step] || "";
}
