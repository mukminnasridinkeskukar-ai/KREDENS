"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  FileEditIcon,
  SendIcon,
  ClipboardCheckIcon,
  AlertTriangleIcon,
  CircleCheckIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserCheckIcon,
  AwardIcon,
  ShieldIcon,
  StethoscopeIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BanIcon,
} from "lucide-react";

// Status types for KREDENS
export type KredensStatus =
  | "DRAFT"
  | "DIAJUKAN"
  | "VERIFIKASI_PUSKESMAS"
  | "PERBAIKAN"
  | "VERIFIKASI_LENGKAP"
  | "DITERUSKAN_KE_DINAS"
  | "PENJADWALAN_ASESMEN"
  | "ASESMEN"
  | "REKOMENDASI"
  | "PENETAPAN_KEWENANGAN_KLINIS"
  | "PENUGASAN_KLINIS"
  | "SELESAI"
  | "DITOLAK"
  | "DIBATALKAN";

// Status configuration interface
export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon?: React.ReactNode;
  description: string;
}

// Complete status configuration map
export const STATUS_CONFIG: Record<KredensStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    color: "slate",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
    textColor: "text-slate-700 dark:text-slate-300",
    icon: <FileEditIcon className="h-3 w-3" />,
    description: "Pengajuan masih dalam bentuk draft dan belum dikirim",
  },
  DIAJUKAN: {
    label: "Diajukan",
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-600",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: <SendIcon className="h-3 w-3" />,
    description: "Pengajuan telah dikirim dan menunggu verifikasi",
  },
  VERIFIKASI_PUSKESMAS: {
    label: "Verifikasi Puskesmas",
    color: "yellow",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-600",
    textColor: "text-yellow-800 dark:text-yellow-300",
    icon: <ClipboardCheckIcon className="h-3 w-3" />,
    description: "Sedang diverifikasi oleh pihak Puskesmas",
  },
  PERBAIKAN: {
    label: "Perbaikan",
    color: "orange",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: <AlertTriangleIcon className="h-3 w-3" />,
    description: "Dokumen perlu diperbaiki sesuai catatan verifikator",
  },
  VERIFIKASI_LENGKAP: {
    label: "Verifikasi Lengkap",
    color: "green",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-600",
    textColor: "text-green-700 dark:text-green-300",
    icon: <CircleCheckIcon className="h-3 w-3" />,
    description: "Dokumen telah lengkap dan memenuhi syarat",
  },
  DITERUSKAN_KE_DINAS: {
    label: "Diteruskan ke Dinas",
    color: "blue",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-300 dark:border-indigo-600",
    textColor: "text-indigo-700 dark:text-indigo-300",
    icon: <ArrowRightIcon className="h-3 w-3" />,
    description: "Berkas telah diteruskan ke Dinas Kesehatan",
  },
  PENJADWALAN_ASESMEN: {
    label: "Penjadwalan Asesmen",
    color: "purple",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-600",
    textColor: "text-purple-700 dark:text-purple-300",
    icon: <CalendarIcon className="h-3 w-3" />,
    description: "Sedang dalam proses penjadwalan asesmen kompetensi",
  },
  ASESMEN: {
    label: "Asesmen",
    color: "indigo",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    borderColor: "border-violet-300 dark:border-violet-600",
    textColor: "text-violet-700 dark:text-violet-300",
    icon: <UserCheckIcon className="h-3 w-3" />,
    description: "Asesmen kompetensi sedang berlangsung",
  },
  REKOMENDASI: {
    label: "Rekomendasi",
    color: "teal",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    borderColor: "border-teal-300 dark:border-teal-600",
    textColor: "text-teal-700 dark:text-teal-300",
    icon: <AwardIcon className="h-3 w-3" />,
    description: "Rekomendasi kewenangan klinis sedang diproses",
  },
  PENETAPAN_KEWENANGAN_KLINIS: {
    label: "Penetapan Kewenangan Klinis",
    color: "emerald",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-300 dark:border-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-300",
    icon: <ShieldIcon className="h-3 w-3" />,
    description: "Penetapan kewenangan klinis sedang diproses",
  },
  PENUGASAN_KLINIS: {
    label: "Penugasan Klinis",
    color: "cyan",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    borderColor: "border-cyan-300 dark:border-cyan-600",
    textColor: "text-cyan-700 dark:text-cyan-300",
    icon: <StethoscopeIcon className="h-3 w-3" />,
    description: "Penugasan klinis sedang diatur",
  },
  SELESAI: {
    label: "Selesai",
    color: "green",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-400 dark:border-green-500",
    textColor: "text-green-800 dark:text-green-200 font-semibold",
    icon: <CheckCircle2Icon className="h-3 w-3" />,
    description: "Proses pengajuan kredensial telah selesai",
  },
  DITOLAK: {
    label: "Ditolak",
    color: "red",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-300 dark:border-red-600",
    textColor: "text-red-700 dark:text-red-300",
    icon: <XCircleIcon className="h-3 w-3" />,
    description: "Pengajuan ditolak karena tidak memenuhi persyaratan",
  },
  DIBATALKAN: {
    label: "Dibatalkan",
    color: "gray",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-300 dark:border-gray-600",
    textColor: "text-gray-600 dark:text-gray-400",
    icon: <BanIcon className="h-3 w-3" />,
    description: "Pengajuan dibatalkan oleh pemohon atau sistem",
  },
};

// Ordered status flow (for timeline)
export const STATUS_FLOW: KredensStatus[] = [
  "DRAFT",
  "DIAJUKAN",
  "VERIFIKASI_PUSKESMAS",
  "PERBAIKAN",
  "VERIFIKASI_LENGKAP",
  "DITERUSKAN_KE_DINAS",
  "PENJADWALAN_ASESMEN",
  "ASESMEN",
  "REKOMENDASI",
  "PENETAPAN_KEWENANGAN_KLINIS",
  "PENUGASAN_KLINIS",
  "SELESAI",
];

// Terminal statuses (end of flow)
export const TERMINAL_STATUSES: KredensStatus[] = ["SELESAI", "DITOLAK", "DIBATALKAN"];

// Active statuses (in progress)
export const ACTIVE_STATUSES: KredensStatus[] = [
  "DIAJUKAN",
  "VERIFIKASI_PUSKESMAS",
  "VERIFIKASI_LENGKAP",
  "DITERUSKAN_KE_DINAS",
  "PENJADWALAN_ASESMEN",
  "ASESMEN",
  "REKOMENDASI",
  "PENETAPAN_KEWENANGAN_KLINIS",
  "PENUGASAN_KLINIS",
];

interface StatusBadgeProps {
  status: KredensStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showDescription?: boolean;
  variant?: "default" | "outline" | "filled";
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  showDescription = false,
  variant = "filled",
  className,
  pulse = false,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const baseClasses = cn(
    "inline-flex items-center font-medium rounded-full border transition-all duration-200",
    sizeClasses[size],
    config.bgColor,
    config.borderColor,
    config.textColor,
    variant === "outline" && "bg-transparent",
    variant === "default" && config.bgColor,
    pulse && ACTIVE_STATUSES.includes(status) && "animate-pulse",
    className
  );

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Badge
        className={cn(baseClasses, "pointer-events-none")}
        variant="outline"
      >
        {showIcon && config.icon && (
          <span className="shrink-0">{config.icon}</span>
        )}
        <span>{config.label}</span>
      </Badge>
      {showDescription && (
        <p className="text-xs text-slate-500 max-w-[250px]">{config.description}</p>
      )}
    </div>
  );
}

// Status selector component (for admin use)
interface StatusSelectorProps {
  value: KredensStatus;
  onChange: (status: KredensStatus) => void;
  disabled?: boolean;
  allowedStatuses?: KredensStatus[];
  className?: string;
}

export function StatusSelector({
  value,
  onChange,
  disabled = false,
  allowedStatuses,
  className,
}: StatusSelectorProps) {
  const statuses = allowedStatuses || Object.keys(STATUS_CONFIG) as KredensStatus[];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2", className)}>
      {statuses.map((status) => {
        const config = STATUS_CONFIG[status];
        if (!config) return null;

        const isSelected = status === value;

        return (
          <button
            key={status}
            type="button"
            onClick={() => !disabled && onChange(status)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-200",
              isSelected
                ? `${config.bgColor} ${config.borderColor} ${config.textColor} ring-2 ring-offset-2 ring-current opacity-100`
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {config.icon}
            <span className="text-xs font-medium truncate">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Status progress indicator
interface StatusProgressProps {
  currentStatus: KredensStatus;
  className?: string;
}

export function StatusProgress({ currentStatus, className }: StatusProgressProps) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Steps */}
      <div className="relative flex justify-between items-center mb-4">
        {/* Progress Line Background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 mx-8" />
        
        {/* Progress Line Fill */}
        {!isTerminal && currentIndex > 0 && (
          <div
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-[#059669] to-[#0d9488] transition-all duration-500 mx-8"
            style={{
              width: `${(currentIndex / (STATUS_FLOW.length - 1)) * 100}%`,
            }}
          />
        )}

        {/* Step Indicators */}
        {STATUS_FLOW.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const isCompleted = index < currentIndex || (isTerminal && index <= currentIndex);
          const isCurrent = status === currentStatus;

          return (
            <div
              key={status}
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted && "bg-[#059669] border-[#059669] text-white",
                  isCurrent &&
                    !isCompleted &&
                    `bg-white ${config.borderColor} ${config.textColor} scale-110 shadow-lg`,
                  !isCompleted &&
                    !isCurrent &&
                    "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                )}
                title={config.description}
              >
                {isCompleted ? (
                  <CheckCircle2Icon className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                  {config.label}
                  <p className="text-slate-300 mt-0.5">{config.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Status Badge */}
      <div className="flex justify-center mt-6">
        <StatusBadge status={currentStatus} size="lg" showDescription />
      </div>
    </div>
  );
}

export default StatusBadge;
