import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Configuration
const CONFIG = {
  // Allowed file types with MIME types and extensions
  allowedFileTypes: {
    'application/pdf': { ext: '.pdf', type: 'PDF' },
    'image/jpeg': { ext: '.jpg', type: 'JPG' },
    'image/jpg': { ext: '.jpg', type: 'JPG' },
    'image/png': { ext: '.png', type: 'PNG' }
  },
  
  // Max file size in bytes (default 10MB)
  maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
  
  // Base upload directory
  uploadBaseDir: process.env.UPLOAD_DIR || '/home/z/my-project/public/uploads/kredens',
  
  // Public URL base for accessing files
  publicUrlBase: '/uploads/kredens'
};

// Helper function to create audit log (simplified version without DB dependency for upload)
async function logUploadAction(
  action: string,
  details: Record<string, any>,
  request?: NextRequest
) {
  console.log(`[UPLOAD ${action}]`, JSON.stringify({
    ...details,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
    userAgent: request?.headers.get('user-agent')?.substring(0, 100),
    timestamp: new Date().toISOString()
  }));
}

// Validate file type
function validateFileType(mimeType: string): { valid: boolean; extension: string; type: string } | null {
  const fileType = CONFIG.allowedFileTypes[mimeType as keyof typeof CONFIG.allowedFileTypes];
  
  if (!fileType) {
    return null;
  }
  
  return {
    valid: true,
    extension: fileType.ext,
    type: fileType.type
  };
}

// Generate secure filename (UUID + original extension)
function generateSecureFilename(originalName: string, extension: string): string {
  const uuid = randomUUID();
  const timestamp = Date.now();
  return `${uuid}_${timestamp}${extension}`;
}

// Ensure directory exists
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const pengajuanId = formData.get('pengajuanId') as string | null;
    const nomorPengajuan = formData.get('nomorPengajuan') as string | null;
    const category = formData.get('category') as string | null; // e.g., 'pendidikan', 'pelatihan', 'dokumen'
    const customMaxSize = formData.get('maxSize') as string | null; // Optional override max size

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah' },
        { status: 400 }
      );
    }

    // Validate pengajuan context
    if (!pengajuanId && !nomorPengajuan) {
      return NextResponse.json(
        { success: false, error: 'pengajuanId atau nomorPengajuan wajib disertakan' },
        { status: 400 }
      );
    }

    // Get or determine nomorPengajuan for path
    let pathNomorPengajuan = nomorPengajuan || 'unknown';
    if (!nomorPengajuan && pengajuanId) {
      try {
        const { db } = await import('@/lib/db');
        const pengajuan = await db.pengajuanKredensial.findUnique({
          where: { id: pengajuanId },
          select: { nomorPengajuan: true }
        });
        if (pengajuan) {
          pathNomorPengajuan = pengajuan.nomorPengajuan.replace('/', '-');
        }
      } catch (error) {
        console.error('Error fetching pengajuan for filename:', error);
      }
    }

    // Validate file type
    const mimeType = file.type;
    const fileTypeValidation = validateFileType(mimeType);
    
    if (!fileTypeValidation) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tipe file tidak diizinkan. Hanya file PDF, JPG, JPEG, dan PNG yang diperbolehkan.`,
          receivedType: mimeType,
          allowedTypes: Object.keys(CONFIG.allowedFileTypes)
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = customMaxSize ? parseInt(customMaxSize, 10) : CONFIG.maxFileSize;
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = file.size / (1024 * 1024);
      return NextResponse.json(
        { 
          success: false, 
          error: `Ukuran file terlalu besar. Maksimal ukuran file adalah ${maxSizeMB.toFixed(2)} MB`,
          fileSize: `${fileSizeMB.toFixed(2)} MB`,
          maxSize: `${maxSizeMB.toFixed(2)} MB`
        },
        { status: 400 }
      );
    }

    // Minimum file size check (1KB to prevent empty files)
    if (file.size < 1024) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ukuran file terlalu kecil. File mungkin rusak atau kosong.' 
        },
        { status: 400 }
      );
    }

    // Generate secure filename
    const originalName = file.name;
    const secureFilename = generateSecureFilename(originalName, fileTypeValidation.extension);

    // Build directory path: /kredens/pengajuan/YYYY/NOMOR_PENGAJUAN/category/
    const year = new Date().getFullYear().toString();
    const safeCategory = (category || 'umum').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeNomorPengajuan = pathNomorPengajuan.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const relativeDirPath = join('pengajuan', year, safeNomorPengajuan, safeCategory);
    const fullDirPath = join(CONFIG.uploadBaseDir, relativeDirPath);
    
    // Ensure directory exists
    await ensureDirectoryExists(fullDirPath);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filePath = join(fullDirPath, secureFilename);
    await writeFile(filePath, buffer);

    // Build public URL
    const relativeFilePath = join(relativeDirPath, secureFilename).replace(/\\/g, '/');
    const fileUrl = `${CONFIG.publicUrlBase}/${relativeFilePath}`;

    // Log successful upload
    await logUploadAction('SUCCESS', {
      originalName,
      secureFilename,
      mimeType,
      fileSize: file.size,
      fileUrl,
      pengajuanId,
      category: safeCategory
    }, request);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: secureFilename,
        originalFileName: originalName,
        fileSize: file.size,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: fileTypeValidation.type,
        mimeType,
        path: relativeFilePath,
        fullPath: filePath
      },
      message: 'File berhasil diunggah'
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    
    await logUploadAction('ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, request);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengunggah file',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// GET - Check upload status/configuration (optional endpoint)
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      allowedTypes: Object.keys(CONFIG.allowedFileTypes).map(key => ({
        mime: key,
        extension: CONFIG.allowedFileTypes[key as keyof typeof CONFIG.allowedFileTypes].ext,
        type: CONFIG.allowedFileTypes[key as keyof typeof CONFIG.allowedFileTypes].type
      })),
      maxFileSize: CONFIG.maxFileSize,
      maxFileSizeFormatted: formatFileSize(CONFIG.maxFileSize),
      uploadBaseDir: CONFIG.uploadBaseDir
    },
    message: 'Konfigurasi upload berhasil diambil'
  });
}
