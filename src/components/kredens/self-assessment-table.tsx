"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  AlertCircleIcon,
} from "lucide-react";

// Types
export type CompetencyLevel = "BELUM_KOMPETEN" | "KOMPETEN_SUPERVISI" | "KOMPETEN_MANDIRI";

export type EvidenceType = "PENDIDIKAN" | "PELATIHAN" | "SERTIFIKAT" | "PENGALAMAN" | "LOGBOOK" | "PORTOFOLIO";

export interface CompetencyAssessment {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  level: CompetencyLevel;
  evidence: EvidenceType[];
  catatan: string;
}

export interface SelfAssessmentTableProps {
  /** List of competencies to assess */
  competencies: CompetencyAssessment[];
  /** Callback when assessment changes */
  onChange?: (assessments: CompetencyAssessment[]) => void;
  /** Whether table is disabled (read-only mode) */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Show expandable descriptions */
  expandable?: boolean;
  /** Show validation errors */
  showValidation?: boolean;
}

// Level configuration
export const LEVEL_CONFIG: Record<CompetencyLevel, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  BELUM_KOMPETEN: {
    label: "Belum Kompeten",
    description: "Memerlukan pembelajaran lebih lanjut",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
  KOMPETEN_SUPERVISI: {
    label: "Kompeten dengan Supervisi",
    description: "Dapat melaksanakan dengan bimbingan/pengawasan",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  KOMPETEN_MANDIRI: {
    label: "Kompeten Mandiri",
    description: "Dapat melaksanakan secara mandiri",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
};

// Evidence configuration
export const EVIDENCE_CONFIG: Record<EvidenceType, {
  label: string;
  icon: string;
  description: string;
}> = {
  PENDIDIKAN: {
    label: "Pendidikan",
    icon: "🎓",
    description: "Bukti pendidikan formal",
  },
  PELATIHAN: {
    label: "Pelatihan",
    icon: "📚",
    description: "Sertifikat pelatihan terkait",
  },
  SERTIFIKAT: {
    label: "Sertifikat",
    icon: "📜",
    description: "Sertifikat kompetensi/profesi",
  },
  PENGALAMAN: {
    label: "Pengalaman",
    icon: "💼",
    description: "Bukti pengalaman kerja",
  },
  LOGBOOK: {
    label: "Logbook",
    icon: "📝",
    description: "Catatan kegiatan klinis",
  },
  PORTOFOLIO: {
    label: "Portofolio",
    icon: "🏆",
    description: "Karya/portofolio terkait",
  },
};

const EVIDENCE_TYPES: EvidenceType[] = [
  "PENDIDIKAN",
  "PELATIHAN",
  "SERTIFIKAT",
  "PENGALAMAN",
  "LOGBOOK",
  "PORTOFOLIO",
];

export function SelfAssessmentTable({
  competencies = [],
  onChange,
  disabled = false,
  className,
  expandable = true,
  showValidation = true,
}: SelfAssessmentTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toggle row expansion
  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle level change
  const handleLevelChange = useCallback(
    (id: string, level: CompetencyLevel) => {
      if (disabled) return;

      const updatedCompetencies = competencies.map((comp) =>
        comp.id === id ? { ...comp, level } : comp
      );
      onChange?.(updatedCompetencies);

      // Clear error if exists
      if (errors[id]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    },
    [competencies, disabled, onChange, errors]
  );

  // Handle evidence change
  const handleEvidenceChange = useCallback(
    (id: string, evidenceType: EvidenceType, checked: boolean) => {
      if (disabled) return;

      const updatedCompetencies = competencies.map((comp) => {
        if (comp.id !== id) return comp;

        let newEvidence = [...comp.evidence];
        if (checked && !newEvidence.includes(evidenceType)) {
          newEvidence.push(evidenceType);
        } else if (!checked && newEvidence.includes(evidenceType)) {
          newEvidence = newEvidence.filter((e) => e !== evidenceType);
        }

        return { ...comp, evidence: newEvidence };
      });

      onChange?.(updatedCompetencies);
    },
    [competencies, disabled, onChange]
  );

  // Handle notes change
  const handleNotesChange = useCallback(
    (id: string, catatan: string) => {
      if (disabled) return;

      const updatedCompetencies = competencies.map((comp) =>
        comp.id === id ? { ...comp, catatan } : comp
      );
      onChange?.(updatedCompetencies);
    },
    [competencies, disabled, onChange]
  );

  // Validate all rows
  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};

    competencies.forEach((comp) => {
      if (!comp.level || comp.level === "BELUM_KOMPETEN") {
        // Level is required but can be any value including belum kompeten
        // Only error if no selection made
      }
      if (!comp.level) {
        newErrors[comp.id] = "Silakan pilih tingkat kompetensi";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [competencies]);

  // Get summary statistics
  const getSummary = () => {
    const total = competencies.length;
    const mandiri = competencies.filter((c) => c.level === "KOMPETEN_MANDIRI").length;
    const supervisi = competencies.filter((c) => c.level === "KOMPETEN_SUPERVISI").length;
    const belum = competencies.filter((c) => c.level === "BELUM_KOMPETEN").length;
    const unselected = competencies.filter((c) => !c.level).length;

    return { total, mandiri, supervisi, belum, unselected };
  };

  const summary = getSummary();

  return (
    <div className={cn("w-full", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{summary.total}</p>
          <p className="text-xs text-slate-500">Total Kompetensi</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", LEVEL_CONFIG.KOMPETEN_MANDIRI.bgColor, "border-emerald-200 dark:border-emerald-800")}>
          <p className={cn("text-2xl font-bold", LEVEL_CONFIG.KOMPETEN_MANDIRI.color)}>{summary.mandiri}</p>
          <p className="text-xs text-slate-600">Mandiri</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", LEVEL_CONFIG.KOMPETEN_SUPERVISI.bgColor, "border-amber-200 dark:border-amber-800")}>
          <p className={cn("text-2xl font-bold", LEVEL_CONFIG.KOMPETEN_SUPERVISI.color)}>{summary.supervisi}</p>
          <p className="text-xs text-slate-600">Supervisi</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center", LEVEL_CONFIG.BELUM_KOMPETEN.bgColor, "border-red-200 dark:border-red-800")}>
          <p className={cn("text-2xl font-bold", LEVEL_CONFIG.BELUM_KOMPETEN.color)}>{summary.belum}</p>
          <p className="text-xs text-slate-600">Belum Kompeten</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-slate-400">{summary.unselected}</p>
          <p className="text-xs text-slate-500">Belum Dipilih</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[200px]">Kompetensi</TableHead>
                <TableHead className="min-w-[280px]">Tingkat Kompetensi</TableHead>
                <TableHead className="min-w-[300px]">Bukti Pendukung</TableHead>
                <TableHead className="min-w-[150px]">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <InfoIcon className="h-8 w-8 text-slate-400" />
                      <p>Belum ada data kompetensi</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                competencies.map((comp, index) => {
                  const isExpanded = expandedRows.has(comp.id);
                  const hasError = !!errors[comp.id];
                  const levelConfig = comp.level ? LEVEL_CONFIG[comp.level] : null;

                  return (
                    <React.Fragment key={comp.id}>
                      <TableRow
                        className={cn(
                          hasError && "bg-red-50/50 dark:bg-red-900/10",
                          !disabled && "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        {/* Row Number */}
                        <TableCell className="font-medium text-slate-500">
                          {index + 1}
                        </TableCell>

                        {/* Competency Info */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span className="font-mono text-xs font-semibold text-[#0d9488] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">
                                {comp.kode}
                              </span>
                            </div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {comp.nama}
                            </p>

                            {/* Expand/Collapse Button */}
                            {expandable && comp.deskripsi && (
                              <button
                                type="button"
                                onClick={() => toggleRowExpansion(comp.id)}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#0d9488] transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUpIcon className="h-3 w-3" />
                                    Sembunyikan deskripsi
                                  </>
                                ) : (
                                  <>
                                    <ChevronDownIcon className="h-3 w-3" />
                                    Lihat deskripsi
                                  </>
                                )}
                              </button>
                            )}

                            {/* Description (when expanded) */}
                            {isExpanded && comp.deskripsi && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                {comp.deskripsi}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Level Selector */}
                        <TableCell>
                          {hasError && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mb-2">
                              <AlertCircleIcon className="h-3 w-3" />
                              {errors[comp.id]}
                            </div>
                          )}
                          <RadioGroup
                            value={comp.level || ""}
                            onValueChange={(value) =>
                              handleLevelChange(comp.id, value as CompetencyLevel)
                            }
                            disabled={disabled}
                            className="gap-2"
                          >
                            {(Object.keys(LEVEL_CONFIG) as CompetencyLevel[]).map(
                              (level) => {
                                const config = LEVEL_CONFIG[level];
                                return (
                                  <Label
                                    key={level}
                                    htmlFor={`${comp.id}-${level}`}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                      comp.level === level
                                        ? `${config.bgColor} ${config.color} border-current`
                                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                  >
                                    <RadioGroupItem
                                      id={`${comp.id}-${level}`}
                                      value={level}
                                      className="sr-only"
                                    />
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                        comp.level === level
                                          ? "border-current"
                                          : "border-slate-300 dark:border-slate-600"
                                      )}
                                    >
                                      {comp.level === level && (
                                        <div className="w-2 h-2 rounded-full bg-current" />
                                      )}
                                    </div>
                                    <span className="text-xs font-medium">
                                      {config.label}
                                    </span>
                                  </Label>
                                );
                              }
                            )}
                          </RadioGroup>
                        </TableCell>

                        {/* Evidence Checkboxes */}
                        <TableCell>
                          <div className="grid grid-cols-2 gap-2">
                            {EVIDENCE_TYPES.map((evidenceType) => {
                              const config = EVIDENCE_CONFIG[evidenceType];
                              const isChecked = comp.evidence.includes(evidenceType);

                              return (
                                <Label
                                  key={evidenceType}
                                  htmlFor={`${comp.id}-evidence-${evidenceType}`}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all text-xs",
                                    isChecked
                                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  )}
                                >
                                  <Checkbox
                                    id={`${comp.id}-evidence-${evidenceType}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleEvidenceChange(comp.id, evidenceType, checked as boolean)
                                    }
                                    disabled={disabled}
                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  />
                                  <span>{config.label}</span>
                                </Label>
                              );
                            })}
                          </div>
                        </TableCell>

                        {/* Notes */}
                        <TableCell>
                          <Textarea
                            value={comp.catatan}
                            onChange={(e) => handleNotesChange(comp.id, e.target.value)}
                            placeholder="Catatan tambahan..."
                            disabled={disabled}
                            className="min-h-[60px] max-h-[100px] resize-y text-sm"
                            rows={2}
                          />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Keterangan Tingkat Kompetensi:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.entries(LEVEL_CONFIG) as [CompetencyLevel, typeof LEVEL_CONFIG[CompetencyLevel]][]).map(
            ([level, config]) => (
              <div
                key={level}
                className={cn("flex items-start gap-2 p-3 rounded-lg", config.bgColor)}
              >
                <Badge
                  variant="outline"
                  className={cn(config.color, config.bgColor, "border-current shrink-0")}
                >
                  {config.label.split(" ")[0]}
                </Badge>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {config.description}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default SelfAssessmentTable;
