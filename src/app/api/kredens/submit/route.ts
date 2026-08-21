import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to create audit log
async function createAuditLog(
  userId: string | undefined,
  aksi: string,
  tabel: string,
  recordId: string,
  dataLama?: any,
  dataBaru?: any,
  request?: NextRequest
) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        aksi,
        tabel,
        recordId,
        dataLama: dataLama ? JSON.stringify(dataLama) : null,
        dataBaru: dataBaru ? JSON.stringify(dataBaru) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null,
        userAgent: request?.headers.get('user-agent') || null
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Generate final nomor pengajuan format: KRD-YYYY-XXXXXX
async function generateFinalNomorPengajuan(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KRD-${year}-`;
  
  // Get the latest nomor for this year (excluding drafts)
  const latestPengajuan = await db.pengajuanKredensial.findFirst({
    where: {
      nomorPengajuan: {
        startsWith: prefix
      },
      status: {
        not: 'DRAFT'
      }
    },
    orderBy: {
      nomorPengajuan: 'desc'
    },
    select: {
      nomorPengajuan: true
    }
  });
  
  let nextNumber = 1;
  if (latestPengajuan) {
    const lastNumber = parseInt(latestPengajuan.nomorPengajuan.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
}

// Required fields validation based on step
function validateRequiredFields(pengajuan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Step 1: Identitas Pemohon - Required fields
  if (!pengajuan.nik || pengajuan.nik.trim() === '') {
    errors.push('NIK wajib diisi');
  } else if (pengajuan.nik.length < 16 || pengajuan.nik.length > 16) {
    errors.push('NIK harus 16 digit');
  }

  if (!pengajuan.namaLengkap || pengajuan.namaLengkap.trim() === '') {
    errors.push('Nama lengkap wajib diisi');
  }

  if (!pengajuan.tempatLahir || pengajuan.tempatLahir.trim() === '') {
    errors.push('Tempat lahir wajib diisi');
  }

  if (!pengajuan.tanggalLahir || pengajuan.tanggalLahir.trim() === '') {
    errors.push('Tanggal lahir wajib diisi');
  }

  if (!pengajuan.jenisKelamin || !['LAKI_LAKI', 'PEREMPUAN'].includes(pengajuan.jenisKelamin)) {
    errors.push('Jenis kelamin wajib diisi (LAKI_LAKI atau PEREMPUAN)');
  }

  if (!pengajuan.nomorWhatsapp || pengajuan.nomorWhatsapp.trim() === '') {
    errors.push('Nomor WhatsApp wajib diisi');
  }

  // Step 2: Profil Profesi - Required fields
  if (!pengajuan.jenisSdmk || !['TENAGA_KESEHATAN', 'TENAGA_MEDIS'].includes(pengajuan.jenisSdmk)) {
    errors.push('Jenis SDMK wajib diisi (TENAGA_KESEHATAN atau TENAGA_MEDIS)');
  }

  if (!pengajuan.jenisProfesi || pengajuan.jenisProfesi.trim() === '') {
    errors.push('Jenis profesi wajib diisi');
  }

  if (!pengajuan.statusKepegawaian || 
      !['PNS', 'PPPK', 'Non_ASN', 'LAINNYA'].includes(pengajuan.statusKepegawaian)) {
    errors.push('Status kepegawaian wajib diisi');
  }

  if (!pengajuan.puskesmasId) {
    errors.push('Puskesmas/Tempat tugas wajib dipilih');
  }

  if (!pengajuan.profesiId) {
    errors.push('Profesi wajib dipilih');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// POST - Submit pengajuan (change status DRAFT → DIAJUKAN)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pengajuanId, userId } = body;

    if (!pengajuanId) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan wajib diisi' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    // Check if pengajuan exists
    const existingPengajuan = await db.pengajuanKredensial.findUnique({
      where: { id: pengajuanId },
      include: {
        pendidikan: true,
        riwayatPekerjaan: true,
        pelatihan: true,
        portofolio: true,
        selfAssessment: true,
        kewenanganDiajukan: true,
        dokumen: true
      }
    });

    if (!existingPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingPengajuan.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke pengajuan ini' },
        { status: 403 }
      );
    }

    // Only allow submission from DRAFT status
    if (existingPengajuan.status !== 'DRAFT') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Hanya pengajuan dengan status DRAFT yang dapat diajukan. Status saat ini: ${existingPengajuan.status}` 
        },
        { status: 400 }
      );
    }

    // Validate all required fields
    const validation = validateRequiredFields(existingPengajuan);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validasi gagal. Mohon lengkapi data berikut:',
          validationErrors: validation.errors
        },
        { status: 400 }
      );
    }

    // Validate required related data exists
    const warnings: string[] = [];

    if (!existingPengajuan.pendidikan || existingPengajuan.pendidikan.length === 0) {
      warnings.push('Belum ada data pendidikan yang dimasukkan');
    }

    if (!existingPengajuan.riwayatPekerjaan || existingPengajuan.riwayatPekerjaan.length === 0) {
      warnings.push('Belum ada data riwayat pekerjaan yang dimasukkan');
    }

    if (!existingPengajuan.dokumen || existingPengajuan.dokumen.length === 0) {
      warnings.push('Belum ada dokumen yang diunggah');
    }

    if (!existingPengajuan.selfAssessment || existingPengajuan.selfAssessment.length === 0) {
      warnings.push('Belum ada self assessment yang diisi');
    }

    if (!existingPengajuan.kewenanganDiajukan || existingPengajuan.kewenanganDiajukan.length === 0) {
      warnings.push('Belum ada kewenangan klinis yang diajukan');
    }

    // Generate final nomor pengajuan (replace draft number)
    const finalNomorPengajuan = await generateFinalNomorPengajuan();

    // Update pengajuan status and generate final number
    const submittedPengajuan = await db.pengajuanKredensial.update({
      where: { id: pengajuanId },
      data: {
        status: 'DIAJUKAN',
        nomorPengajuan: finalNomorPengajuan,
        tanggalPengajuan: new Date(),
        tahapanSaatIni: 2 // Move to next step after submission
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        puskesmas: true,
        profesi: true
      }
    });

    // Create initial status history for submission
    await db.statusHistory.create({
      data: {
        pengajuanId: pengajuanId,
        statusSebelumnya: 'DRAFT',
        statusBaru: 'DIAJUKAN',
        diubahOleh: userId,
        catatan: 'Pengajuan diajukan oleh pemohon'
      }
    });

    // Create audit log
    await createAuditLog(
      userId,
      'SUBMIT',
      'pengajuan_kredensial',
      pengajuanId,
      existingPengajuan,
      submittedPengajuan,
      request
    );

    return NextResponse.json({
      success: true,
      data: {
        pengajuan: submittedPengajuan,
        nomorPengajuan: finalNomorPengajuan,
        warnings: warnings.length > 0 ? warnings : undefined
      },
      message: warnings.length > 0 
        ? 'Pengajuan berhasil diajukan dengan peringatan. Beberapa data mungkin belum lengkap.' 
        : 'Pengajuan berhasil diajukan'
    });
  } catch (error) {
    console.error('Error submitting pengajuan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengajukan pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
