"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SaveIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";

export interface FormStepContainerProps {
  /** Step number (1-based) */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Form content to render */
  children: React.ReactNode;
  /** Callback for previous button */
  onPrevious?: () => void;
  /** Callback for next/submit button */
  onNext?: () => void;
  /** Callback for save draft button */
  onSaveDraft?: () => void;
  /** Whether this is the last step */
  isLastStep?: boolean;
  /** Whether form can proceed (validation) */
  canProceed?: boolean;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Show submit button instead of next */
  showSubmit?: boolean;
  /** Optional error message */
  error?: string;
  /** Optional info/warning message */
  info?: string;
  /** Custom class name for container */
  className?: string;
  /** Hide navigation buttons */
  hideNavigation?: boolean;
  /** Header icon */
  icon?: React.ReactNode;
}

export function FormStepContainer({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onPrevious,
  onNext,
  onSaveDraft,
  isLastStep = false,
  canProceed = true,
  isSubmitting = false,
  showSubmit = false,
  error,
  info,
  className,
  hideNavigation = false,
  icon,
}: FormStepContainerProps) {
  const progressPercentage = ((stepNumber - 1) / (totalSteps - 1)) * 100;
  const isFirstStep = stepNumber === 1;

  return (
    <div
      className={cn(
        "w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300",
        className
      )}
    >
      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header Section */}
        <CardHeader
          className={cn(
            "bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] dark:from-[#0f2744] dark:to-[#1e3a5f] text-white pb-6",
            error && "from-red-700 to-red-800"
          )}
        >
          {/* Top Row - Step Number & Progress */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Step Number Badge */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 font-bold text-lg">
                {icon || stepNumber}
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                  Langkah {stepNumber} dari {totalSteps}
                </p>
                <CardTitle className="text-white text-xl md:text-2xl mt-0.5">
                  {title}
                </CardTitle>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
              <span className="text-white/80 text-xs font-medium">
                {Math.round(progressPercentage)}% Selesai
              </span>
              <Progress
                value={progressPercentage}
                className="h-2 w-full bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-emerald-400"
              />
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-white/80 text-sm ml-[52px]">{description}</p>
          )}

          {/* Mobile Progress */}
          <div className="sm:hidden mt-4 ml-[52px]">
            <Progress
              value={progressPercentage}
              className="h-1.5 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-emerald-400"
            />
          </div>
        </CardHeader>

        {/* Content Area */}
        <CardContent className="p-4 md:p-6 lg:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
              <AlertCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">
                  Terjadi Kesalahan
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Info Message */}
          {info && !error && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex gap-3">
              <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Informasi
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {info}
                </p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="space-y-6">{children}</div>

          {/* Navigation Buttons */}
          {!hideNavigation && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
              {/* Left Side - Previous & Draft */}
              <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
                {!isFirstStep && onPrevious && (
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
                    className="gap-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <SaveIcon className="h-4 w-4" />
                    Simpan Draft
                  </Button>
                )}
              </div>

              {/* Right Side - Next / Submit */}
              <div className="w-full sm:w-auto order-1 sm:order-2">
                {showSubmit && isLastStep && onNext ? (
                  <Button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed || isSubmitting}
                    className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#059669] to-[#0d9488] hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 h-11 px-6"
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
                        Memproses...
                      </>
                    ) : (
                      <>
                        Ajukan Kredensial
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
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22,2 15,22 11,13 2,9 22,2" />
                        </svg>
                      </>
                    )}
                  </Button>
                ) : !isLastStep && onNext ? (
                  <Button
                    type="button"
                    onClick={onNext}
                    disabled={!canProceed}
                    className="w-full sm:w-auto gap-2 bg-[#1e3a5f] hover:bg-[#152d4a] text-white shadow-md shadow-navy-200 dark:shadow-navy-900/30 h-11 px-6"
                  >
                    Lanjutkan
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Progress Bar (Mobile friendly) */}
      {!hideNavigation && (
        <div className="mt-4 px-4 sm:hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Langkah {stepNumber} dari {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% lengkap</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified version without card wrapper
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
  id,
}: FormSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 transition-all",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {title && (
            <h3 className="text-base font-semibold text-[#1e3a5f] dark:text-teal-400">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Form field row component for consistent spacing
interface FormFieldRowProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function FormFieldRow({
  children,
  className,
  columns = 2,
}: FormFieldRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

export default FormStepContainer;
