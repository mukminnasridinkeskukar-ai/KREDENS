"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  UploadIcon,
  FileIcon,
  ImageIcon,
  XIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  DownloadIcon,
  RefreshCwIcon,
  PaperclipIcon,
} from "lucide-react";

// Types
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: "uploading" | "valid" | "warning" | "error" | "idle";
  progress: number;
  error?: string;
  warning?: string;
}

export interface FileUploadProps {
  /** Accepted file types (MIME types) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Current uploaded files */
  value?: UploadedFile[];
  /** Callback when files change */
  onChange?: (files: UploadedFile[]) => void;
  /** Label for the upload area */
  label?: string;
  /** Description text */
  description?: string;
  /** Custom class name */
  className?: string;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Whether upload is required */
  required?: boolean;
  /** Error message from parent */
  error?: string;
  /** Upload URL for actual upload simulation */
  onUpload?: (file: File) => Promise<void>;
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toUpperCase();
};

const isImageFile = (type: string): boolean => {
  return type.startsWith("image/");
};

const isPdfFile = (type: string): boolean => {
  return type === "application/pdf";
};

const generateId = (): string => {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Default accepted file types
const DEFAULT_ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 5,
  multiple = false,
  value = [],
  onChange,
  label = "Unggah Dokumen",
  description = "Format yang didukung: PDF, JPG, JPEG, PNG. Maksimal ukuran file 10MB",
  className,
  disabled = false,
  required = false,
  error,
  onUpload,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Sync external value changes
  useEffect(() => {
    setInternalFiles(value);
  }, [value]);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string; warning?: string } => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check file type
      if (!accept.includes(file.type)) {
        errors.push(`Tipe file "${file.type}" tidak didukung`);
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(
          `Ukuran file terlalu besar (${formatFileSize(file.size)}). Maksimal ${formatFileSize(maxSize)}`
        );
      }

      // Warning for large files
      if (file.size > 5 * 1024 * 1024) {
        warnings.push("File berukuran besar, proses upload mungkin memakan waktu lebih lama");
      }

      // Check max files limit
      if (!multiple && internalFiles.length >= 1) {
        errors.push("Hanya dapat mengunggah satu file");
      }
      if (multiple && internalFiles.length + 1 > maxFiles) {
        errors.push(`Maksimal ${maxFiles} file dapat diunggah`);
      }

      if (errors.length > 0) {
        return { valid: false, error: errors[0] };
      }
      if (warnings.length > 0) {
        return { valid: true, warning: warnings[0] };
      }
      return { valid: true };
    },
    [accept, maxSize, maxFiles, multiple, internalFiles.length]
  );

  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (isImageFile(file.type)) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  const simulateUpload = useCallback(
    async (uploadedFile: UploadedFile): Promise<UploadedFile> => {
      // Simulate upload progress
      const steps = [0, 20, 40, 60, 80, 100];
      
      for (const progress of steps) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        uploadedFile.progress = progress;
        
        // Update state with progress
        setInternalFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: f.progress } : f))
        );
      }

      // Call actual upload handler if provided
      if (onUpload) {
        try {
          await onUpload(uploadedFile.file);
          return { ...uploadedFile, status: "valid", progress: 100 };
        } catch (err) {
          return {
            ...uploadedFile,
            status: "error",
            error: "Gagal mengunggah file",
            progress: 0,
          };
        }
      }

      return { ...uploadedFile, status: "valid", progress: 100 };
    },
    [onUpload]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);
        const preview = await createPreview(file);

        const uploadedFile: UploadedFile = {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          status: validation.valid ? "uploading" : validation.error ? "error" : "warning",
          progress: 0,
          error: validation.error,
          warning: validation.warning,
        };

        newFiles.push(uploadedFile);

        // Start upload simulation for valid files
        if (validation.valid && !validation.warning) {
          simulateUpload(uploadedFile).then((result) => {
            setInternalFiles((prev) =>
              prev.map((f) => (f.id === result.id ? result : f))
            );
          });
        }
      }

      const updatedFiles = [...internalFiles, ...newFiles];
      setInternalFiles(updatedFiles);
      onChange?.(updatedFiles);
    },
    [validateFile, createPreview, simulateUpload, internalFiles, onChange]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      dragCounterRef.current = 0;

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, processFiles]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        // Reset input value to allow re-upload of same file
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = internalFiles.filter((f) => f.id !== id);
      setInternalFiles(updatedFiles);
      onChange?.(updatedFiles);
    },
    [internalFiles, onChange]
  );

  const retryUpload = useCallback(
    async (id: string) => {
      const fileToRetry = internalFiles.find((f) => f.id === id);
      if (!fileToRetry) return;

      const retryFile: UploadedFile = {
        ...fileToRetry,
        status: "uploading",
        progress: 0,
        error: undefined,
      };

      setInternalFiles((prev) =>
        prev.map((f) => (f.id === id ? retryFile : f))
      );

      const result = await simulateUpload(retryFile);
      setInternalFiles((prev) =>
        prev.map((f) => (f.id === result.id ? result : f))
      );
    },
    [internalFiles, simulateUpload]
  );

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case "warning":
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "uploading":
        return (
          <svg
            className="animate-spin h-5 w-5 text-[#1e3a5f]"
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
        );
      default:
        return null;
    }
  };

  const getFileIcon = (type: string) => {
    if (isImageFile(type)) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    }
    if (isPdfFile(type)) {
      return <FileIcon className="h-6 w-6 text-red-500" />;
    }
    return <PaperclipIcon className="h-6 w-6 text-slate-500" />;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 md:p-8 transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:ring-offset-2",
          isDragOver && !disabled
            ? "border-[#0d9488] bg-teal-50 dark:bg-teal-900/20 scale-[1.01]"
            : disabled
            ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
            : "border-slate-300 dark:border-slate-600 hover:border-[#0d9488] hover:bg-teal-50/50 dark:hover:bg-teal-900/10",
          error && !isDragOver && "border-red-300 bg-red-50 dark:bg-red-900/10"
        )}
        aria-label={label}
        aria-disabled={disabled}
      >
        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
        />

        {/* Upload Content */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* Icon */}
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragOver
                ? "bg-[#0d9488]/10"
                : "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <UploadIcon
              className={cn(
                "h-8 w-8 transition-colors",
                isDragOver ? "text-[#0d9488]" : "text-slate-400"
              )}
            />
          </div>

          {/* Text */}
          <p className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
            {isDragOver ? (
              <span className="text-[#0d9488]">Lepaskan file di sini</span>
            ) : (
              <>
                <span className="text-[#1e3a5f]">Klik untuk unggah</span>
                <span className="text-slate-400"> atau seret & lepas</span>
              </>
            )}
          </p>
          <p className="text-sm text-slate-500 mt-2">{description}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <XCircleIcon className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* File List */}
      {internalFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {internalFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                "group flex items-start gap-3 p-4 rounded-xl border transition-all",
                file.status === "error"
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                  : file.status === "valid"
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  : file.status === "warning"
                  ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}
            >
              {/* File Preview or Icon */}
              <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(file.type)
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(file.size)} • {getFileExtension(file.name)}
                    </p>
                  </div>

                  {/* Status Icon */}
                  <div className="shrink-0">{getStatusIcon(file.status)}</div>
                </div>

                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <div className="mt-3">
                    <Progress
                      value={file.progress}
                      className="h-1.5 bg-slate-200 dark:bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-[#1e3a5f] [&>div]:to-[#0d9488]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Mengunggah... {file.progress}%
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {file.error && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="h-3 w-3 shrink-0" />
                    {file.error}
                  </p>
                )}

                {/* Warning Message */}
                {file.warning && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangleIcon className="h-3 w-3 shrink-0" />
                    {file.warning}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {file.status === "error" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => retryUpload(file.id)}
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Coba lagi"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                )}
                {file.status === "valid" && file.preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(file.preview, "_blank")}
                    className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                    title="Lihat preview"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Hapus file"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files Count */}
      {internalFiles.length > 0 && !multiple && (
        <p className="mt-2 text-xs text-slate-500">
          1 dari 1 file diunggah
        </p>
      )}
      {internalFiles.length > 0 && multiple && (
        <p className="mt-2 text-xs text-slate-500">
          {internalFiles.length} dari {maxFiles} file diunggah
        </p>
      )}
    </div>
  );
}

export default FileUpload;
