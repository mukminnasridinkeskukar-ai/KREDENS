"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
  InfoIcon,
} from "lucide-react";

// Import status types
import type { KredensStatus } from "./status-badge";
import { STATUS_CONFIG, STATUS_FLOW, TERMINAL_STATUSES } from "./status-badge";

// Types
export interface StatusHistory {
  id: string;
  status: KredensStatus;
  tanggal: string; // ISO date string
  waktu?: string; // Time string
  catatan?: string;
  pengubah?: string; // Who made the change
  jabatan?: string; // Role/position
}

export interface TrackingTimelineProps {
  /** Current status */
  currentStatus: KredensStatus;
  /** Status history */
  history: StatusHistory[];
  /** Custom class name */
  className?: string;
  /** Show detailed history */
  showDetails?: boolean;
  /** Whether timeline is compact */
  compact?: boolean;
  /** Submission date */
  tanggalPengajuan?: string;
  /** Estimated completion date */
  estimasiSelesai?: string;
  /** Callback for viewing details */
  onViewDetail?: (historyId: string) => void;
}

// Format date to Indonesian locale
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
};

// Format time
const formatTime = (timeString?: string): string => {
  if (!timeString) return "";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return timeString;
  }
};

// Get relative time (e.g., "2 hari yang lalu")
const getRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
  } catch {
    return "";
  }
};

export function TrackingTimeline({
  currentStatus,
  history = [],
  className,
  showDetails = true,
  compact = false,
  tanggalPengajuan,
  estimasiSelesai,
  onViewDetail,
}: TrackingTimelineProps) {
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  // Get current status config
  const currentConfig = STATUS_CONFIG[currentStatus];
  
  // Find current position in flow
  const currentPosition = STATUS_FLOW.indexOf(currentStatus);

  // Determine which statuses are completed
  const completedStatuses = STATUS_FLOW.slice(0, currentPosition + 1);

  // Toggle history expansion
  const toggleHistoryExpansion = (id: string) => {
    setExpandedHistory((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    const totalSteps = STATUS_FLOW.length;
    const terminalIndex = STATUS_FLOW.findIndex((s) =>
      TERMINAL_STATUSES.includes(s)
    );
    
    if (TERMINAL_STATUSES.includes(currentStatus)) {
      return 100;
    }

    return Math.round(((currentPosition + 1) / totalSteps) * 100);
  };

  // Estimate remaining days
  const estimateRemainingDays = (): number | null => {
    if (!estimasiSelesai || TERMINAL_STATUSES.includes(currentStatus)) {
      return null;
    }
    
    try {
      const estDate = new Date(estimasiSelesai);
      const now = new Date();
      const diffMs = estDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return null;
    }
  };

  const progressPercentage = calculateProgress();
  const remainingDays = estimateRemainingDays();

  return (
    <div className={cn("w-full", className)}>
      {/* Header Card */}
      <Card className="mb-6 overflow-hidden border-2 border-[#1e3a5f]/20">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f] dark:from-[#0f2744] dark:to-[#1e3a5f] p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm uppercase tracking-wider font-medium">
                Status Pengajuan Saat Ini
              </p>
              <div className="flex items-center gap-3 mt-2">
                {currentConfig?.icon}
                <h2 className="text-xl md:text-2xl font-bold">{currentConfig?.label}</h2>
              </div>
              {currentConfig?.description && (
                <p className="text-white/80 text-sm mt-2 max-w-lg">
                  {currentConfig.description}
                </p>
              )}
            </div>

            {/* Progress Circle */}
            <div className="shrink-0">
              <div className="relative w-24 h-24 mx-auto md:mx-0">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercentage * 2.64} 264`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{progressPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/70 mb-2">
              <span>Proses Pengajuan</span>
              <span>{progressPercentage}% selesai</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">{currentPosition + 1}</p>
            <p className="text-xs text-slate-500">Tahap Saat Ini</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#0d9488]">{STATUS_FLOW.length}</p>
            <p className="text-xs text-slate-500">Total Tahap</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{history.length}</p>
            <p className="text-xs text-slate-500">Update Status</p>
          </div>
          <div className="text-center">
            <p className={cn(
              "text-2xl font-bold",
              remainingDays !== null && remainingDays <= 3 ? "text-red-600" : "text-blue-600"
            )}>
              {remainingDays !== null ? `${remainingDays} hari` : "-"}
            </p>
            <p className="text-xs text-slate-500">Estimasi Sisa</p>
          </div>
        </CardContent>
      </Card>

      {/* Visual Timeline */}
      {!compact && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-[#1e3a5f] flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Alur Proses Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Desktop Timeline */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                
                {/* Completed Line */}
                <div
                  className="absolute top-5 left-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{
                    width: `calc(${(currentPosition / (STATUS_FLOW.length - 1)) * 100}% - 16px)`,
                  }}
                />

                {/* Timeline Nodes */}
                <div className="relative flex justify-between">
                  {STATUS_FLOW.map((status, index) => {
                    const config = STATUS_CONFIG[status];
                    const isCompleted = completedStatuses.includes(status);
                    const isCurrent = status === currentStatus;
                    const isTerminal = TERMINAL_STATUSES.includes(status);
                    const isFuture = index > currentPosition;

                    return (
                      <div key={status} className="flex flex-col items-center group">
                        {/* Node */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300",
                            isCompleted && !isCurrent && "bg-emerald-500 border-emerald-500 text-white",
                            isCurrent && !isTerminal && "bg-[#1e3a5f] border-[#1e3a5f] text-white scale-110 shadow-lg shadow-navy-200",
                            isTerminal && isCompleted && "bg-emerald-600 border-emerald-600 text-white",
                            isFuture && "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2Icon className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                          
                          {/* Pulse for current */}
                          {isCurrent && !isTerminal && (
                            <span className="absolute inset-0 rounded-full bg-[#1e3a5f] animate-ping opacity-20" />
                          )}
                        </div>

                        {/* Label */}
                        <div className="mt-3 text-center max-w-[80px]">
                          <p
                            className={cn(
                              "text-xs font-medium leading-tight",
                              isCompleted && "text-emerald-600",
                              isCurrent && "text-[#1e3a5f] font-bold",
                              isFuture && "text-slate-400"
                            )}
                          >
                            {config?.label}
                          </p>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute top-full mt-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                            {config?.description}
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile Timeline - Vertical */}
            <div className="md:hidden space-y-0">
              {STATUS_FLOW.map((status, index) => {
                const config = STATUS_CONFIG[status];
                const isCompleted = completedStatuses.includes(status);
                const isCurrent = status === currentStatus;

                return (
                  <div key={status} className="flex gap-4 pb-4 last:pb-0 relative">
                    {/* Vertical Line */}
                    {index < STATUS_FLOW.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-[11px] top-8 bottom-0 w-0.5",
                          isCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      />
                    )}

                    {/* Node */}
                    <div
                      className={cn(
                        "w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 shrink-0 z-10",
                        isCompleted && !isCurrent && "bg-emerald-500 border-emerald-500 text-white",
                        isCurrent && "bg-[#1e3a5f] border-[#1e3a5f] text-white",
                        !isCompleted && !isCurrent && "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <p
                        className={cn(
                          "font-medium text-sm",
                          isCompleted && "text-emerald-600",
                          isCurrent && "text-[#1e3a5f]",
                          !isCompleted && !isCurrent && "text-slate-400"
                        )}
                      >
                        {config?.label}
                      </p>
                      {isCurrent && config?.description && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {showDetails && history.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#1e3a5f] flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Riwayat Perubahan Status
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {history.length} update
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            {/* Latest Status Highlight */}
            {history.length > 0 && (() => {
              const latest = history[0];
              const latestConfig = STATUS_CONFIG[latest.status];

              return (
                <div className={cn(
                  "p-4 rounded-xl mb-4 border-l-4",
                  latestConfig?.bgColor,
                  latestConfig?.borderColor.replace("border-", "border-l-")
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      latestConfig?.bgColor
                    )}>
                      {latestConfig?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {latestConfig?.label}
                        </span>
                        <Badge variant="outline" className={cn(latestConfig?.bgColor, latestConfig?.color, latestConfig?.borderColor)}>
                          Terbaru
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatDate(latest.tanggal)}
                        </span>
                        {latest.waktu && (
                          <span>{formatTime(latest.waktu)}</span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">{getRelativeTime(latest.tanggal)}</span>
                      </div>
                      {latest.catatan && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-lg">
                          {latest.catatan}
                        </p>
                      )}
                      {latest.pengubah && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <UserIcon className="h-3.5 w-3.5" />
                          <span>Diubah oleh: <strong>{latest.pengubah}</strong></span>
                          {latest.jabatan && (
                            <span>({latest.jabatan})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <Separator />

            {/* History List */}
            <div className="mt-4 space-y-0">
              {history.slice(1).map((item, index) => {
                const config = STATUS_CONFIG[item.status];
                const isExpanded = expandedHistory.has(item.id);

                return (
                  <React.Fragment key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleHistoryExpansion(item.id)}
                      className="w-full flex items-start gap-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          config?.bgColor,
                          config?.color
                        )}
                      >
                        {config?.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {config?.label}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-opacity"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>{formatDate(item.tanggal)}</span>
                          {item.waktu && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{formatTime(item.waktu)}</span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">{getRelativeTime(item.tanggal)}</span>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            {item.catatan && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <p className="text-xs font-medium text-slate-500 mb-1">Catatan:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {item.catatan}
                                </p>
                              </div>
                            )}
                            {item.pengubah && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <UserIcon className="h-4 w-4" />
                                <span>
                                  Diubah oleh <strong>{item.pengubah}</strong>
                                  {item.jabatan && ` (${item.jabatan})`}
                                </span>
                              </div>
                            )}
                            {onViewDetail && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewDetail(item.id);
                                }}
                                className="text-[#0d9488]"
                              >
                                Lihat Detail
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </button>

                    {index < history.length - 2 && <Separator />}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {showDetails && history.length === 0 && (
        <Card className="p-8 text-center">
          <ClockIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada riwayat perubahan status</p>
          <p className="text-sm text-slate-400 mt-1">
            Riwayat akan muncul setelah ada perubahan status pada pengajuan ini.
          </p>
        </Card>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
            Informasi Tracking
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
            <li>Status akan diperbarui secara otomatis oleh sistem atau verifikator</li>
            <li>Anda akan mendapat notifikasi saat ada perubahan status</li>
            <li>Jika ada pertanyaan, hubungi admin Dinas Kesehatan Kabupaten Kutai Kartanegara</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TrackingTimeline;
