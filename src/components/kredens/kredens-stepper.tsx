"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  UserIcon,
  StethoscopeIcon,
  GraduationCapIcon,
  FileTextIcon,
  BriefcaseIcon,
  AwardIcon,
  ShieldCheckIcon,
  SendIcon,
} from "lucide-react";

// Step configuration type
export interface KredensStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Default steps for KREDENS form
export const DEFAULT_KREDENS_STEPS: KredensStep[] = [
  {
    id: 1,
    title: "Identitas",
    description: "Data diri pemohon",
    icon: <UserIcon className="h-5 w-5" />,
  },
  {
    id: 2,
    title: "Profesi",
    description: "Data profesi keperawatan",
    icon: <StethoscopeIcon className="h-5 w-5" />,
  },
  {
    id: 3,
    title: "Pendidikan",
    description: "Riwayat pendidikan",
    icon: <GraduationCapIcon className="h-5 w-5" />,
  },
  {
    id: 4,
    title: "STR/SIP",
    description: "Dokumen registrasi",
    icon: <FileTextIcon className="h-5 w-5" />,
  },
  {
    id: 5,
    title: "Pengalaman",
    description: "Riwayat pekerjaan",
    icon: <BriefcaseIcon className="h-5 w-5" />,
  },
  {
    id: 6,
    title: "Kompetensi",
    description: "Self assessment",
    icon: <AwardIcon className="h-5 w-5" />,
  },
  {
    id: 7,
    title: "Kewenangan",
    description: "Usulan kewenangan",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    id: 8,
    title: "Pengajuan",
    description: "Review & submit",
    icon: <SendIcon className="h-5 w-5" />,
  },
];

interface KredensStepperProps {
  currentStep: number;
  onStepChange?: (step: number) => void;
  steps?: KredensStep[];
  className?: string;
}

export function KredensStepper({
  currentStep,
  onStepChange,
  steps = DEFAULT_KREDENS_STEPS,
  className,
}: KredensStepperProps) {
  const getStepStatus = (stepId: number): "completed" | "current" | "upcoming" => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or the next step
    if (stepId <= currentStep && onStepChange) {
      onStepChange(stepId);
    }
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Stepper - Horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-8" />
          
          {/* Progress Bar Fill */}
          <div
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] rounded-full transition-all duration-500 ease-in-out mx-8"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between items-start">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isClickable = step.id <= currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-2 group flex-1",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                  aria-label={`Langkah ${step.id}: ${step.title}`}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                      status === "completed" && "border-[#059669] bg-[#059669] text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30",
                      status === "current" && "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-lg shadow-navy-200 dark:shadow-navy-900/30 scale-110",
                      status === "upcoming" && "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckIcon className="h-5 w-5 animate-in zoom-in duration-200" />
                    ) : (
                      <span className="transition-transform group-hover:scale-105">
                        {step.icon}
                      </span>
                    )}
                    
                    {/* Pulse effect for current step */}
                    {status === "current" && (
                      <span className="absolute inset-0 rounded-full bg-[#1e3a5f] animate-ping opacity-20" />
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="text-center max-w-[100px]">
                    <p
                      className={cn(
                        "font-semibold text-sm leading-tight transition-colors",
                        status === "current" && "text-[#1e3a5f] dark:text-teal-400",
                        status === "completed" && "text-[#059669]",
                        status === "upcoming" && "text-slate-400"
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-0.5 hidden lg:block",
                        status === "upcoming" && "text-slate-400",
                        (status === "current" || status === "completed") && "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Step Number Badge */}
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                      status === "current" && "bg-[#0d9488] text-white",
                      status === "completed" && "bg-[#059669] text-white",
                      status === "upcoming" && "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    )}
                  >
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Stepper - Vertical / Compact Horizontal */}
      <div className="md:hidden">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          {/* Mobile Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-[#1e3a5f] dark:text-teal-400">
                Langkah {currentStep} dari {steps.length}
              </span>
              <span className="text-slate-500">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Mobile Steps Indicator */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {steps.map((step) => {
              const status = getStepStatus(step.id);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[70px]",
                    status === "current" &&
                      "bg-[#1e3a5f]/10 dark:bg-teal-900/20 border border-[#1e3a5f] dark:border-teal-600",
                    status === "completed" &&
                      "bg-emerald-50 dark:bg-emerald-900/20 border border-transparent",
                    status === "upcoming" &&
                      "bg-slate-50 dark:bg-slate-800 border border-transparent opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center mb-1",
                      status === "completed" && "bg-[#059669] text-white",
                      status === "current" && "bg-[#1e3a5f] text-white",
                      status === "upcoming" && "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    )}
                  >
                    {status === "completed" ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium truncate max-w-[60px]",
                      status === "current" && "text-[#1e3a5f] dark:text-teal-400",
                      status === "completed" && "text-[#059669]",
                      status === "upcoming" && "text-slate-400"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Step Info */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] dark:bg-teal-900 flex items-center justify-center text-white">
                {steps[currentStep - 1]?.icon}
              </div>
              <div>
                <p className="font-semibold text-[#1e3a5f] dark:text-teal-400">
                  {steps[currentStep - 1]?.title}
                </p>
                <p className="text-xs text-slate-500">
                  {steps[currentStep - 1]?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation buttons component
interface StepperNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
  showSubmit?: boolean;
  className?: string;
}

export function StepperNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
  canProceed = true,
  showSubmit = false,
  className,
}: StepperNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6",
        className
      )}
    >
      {/* Left side - Previous & Draft buttons */}
      <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="gap-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Kembali
          </Button>
        )}

        {onSaveDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            className="gap-2 text-slate-600 dark:text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            Simpan Draft
          </Button>
        )}
      </div>

      {/* Right side - Next / Submit button */}
      <div className="w-full sm:w-auto order-1 sm:order-2">
        {showSubmit && isLastStep && onSubmit ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canProceed || isSubmitting}
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#059669] to-[#0d9488] hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
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
                Mengirim...
              </>
            ) : (
              <>
                <SendIcon className="h-4 w-4" />
                Ajukan Kredensial
              </>
            )}
          </Button>
        ) : !isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="w-full sm:w-auto gap-2 bg-[#1e3a5f] hover:bg-[#152d4a] text-white shadow-lg shadow-navy-200 dark:shadow-navy-900/30"
          >
            Lanjut
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default KredensStepper;
