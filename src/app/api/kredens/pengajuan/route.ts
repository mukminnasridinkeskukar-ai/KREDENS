import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Allowed status transitions for validation
const ALLOWED_STATUSES = [
  'DRAFT',
  'DIAJUKAN',
  'VERIFIKASI_PUSKESMAS',
  'PERBAIKAN',
  'VERIFIKASI_LENGKAP',
  'DITERUSKAN_KE_DINAS',
  'PENJADWALAN_ASESMEN',
  'ASESMEN',
  'REKOMENDASI',
  'PENETAPAN_KEWENANGAN_KLINIS',
  'PENUGASAN_KLINIS',
  'SELESAI',
  'DITOLAK',
  'DIBATALKAN'
];

// Generate nomor pengajuan format: KRD-YYYY-XXXXXX
async function generateNomorPengajuan(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KRD-${year}-`;
  
  // Get the latest nomor for this year
  const latestPengajuan = await db.pengajuanKredensial.findFirst({
    where: {
      nomorPengajuan: {
        startsWith: prefix
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

// GET - List all pengajuan with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const puskesmasId = searchParams.get('puskesmasId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tanggalMulai = searchParams.get('tanggalMulai');
    const tanggalAkhir = searchParams.get('tanggalAkhir');

    // Build where clause
    const where: Record<string, any> = {};
    
    if (status && ALLOWED_STATUSES.includes(status)) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (puskesmasId) {
      where.puskesmasId = puskesmasId;
    }
    
    if (search) {
      where.OR = [
        { namaLengkap: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search } },
        { nomorPengajuan: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tanggalMulai || tanggalAkhir) {
      where.createdAt = {};
      if (tanggalMulai) {
        where.createdAt.gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        where.createdAt.lte = new Date(tanggalAkhir);
      }
    }

    // Exclude cancelled/deleted records by default unless explicitly requested
    if (!searchParams.get('includeCancelled')) {
      where.status = { not: 'DIBATALKAN' };
    } else if (status && status !== 'DIBATALKAN') {
      // If status is specified and it's not DIBATALKAN, keep the status filter
    }

    // Get total count for pagination
    const total = await db.pengajuanKredensial.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch data with relations
    const pengajuanList = await db.pengajuanKredensial.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        puskesmas: {
          select: {
            id: true,
            kode: true,
            nama: true
          }
        },
        profesi: {
          select: {
            id: true,
            kode: true,
            nama: true,
            jenisSdmk: true
          }
        },
        _count: {
          select: {
            pendidikan: true,
            riwayatPekerjaan: true,
            pelatihan: true,
            dokumen: true,
            selfAssessment: true,
            kewenanganDiajukan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: pengajuanList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Daftar pengajuan berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching pengajuan list:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new pengajuan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nik,
      namaLengkap,
      gelarDepan,
      gelarBelakang,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      nomorWhatsapp,
      email,
      jenisSdmk,
      jenisProfesi,
      jabatanFungsional,
      statusKepegawaian,
      pangkatGolongan,
      unitKerja,
      puskesmasId,
      profesiId,
      jenisPengajuan,
      userId,
      tahapanSaatIni = 1
    } = body;

    // Validate required fields
    if (!nik) {
      return NextResponse.json(
        { success: false, error: 'NIK wajib diisi' },
        { status: 400 }
      );
    }

    if (!namaLengkap) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    if (!jenisPengajuan || !['AWAL', 'REKREDENSIAL', 'PERUBAHAN_KEWENANGAN', 'PERUBAHAN_TEMPAT', 'PERUBAHAN_KOMPETENSI'].includes(jenisPengajuan)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Jenis pengajuan tidak valid. Pilih: AWAL, REKREDENSIAL, PERUBAHAN_KEWENANGAN, PERUBAHAN_TEMPAT, PERUBAHAN_KOMPETENSI' 
        },
        { status: 400 }
      );
    }

    // Check if there's an existing DRAFT for this user (optional: prevent multiple drafts)
    const existingDraft = await db.pengajuanKredensial.findFirst({
      where: {
        userId,
        nik,
        status: 'DRAFT'
      }
    });

    if (existingDraft) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Anda memiliki draft pengajuan yang belum selesai. Silakan lanjutkan atau hapus draft tersebut.',
          existingDraftId: existingDraft.id
        },
        { status: 409 }
      );
    }

    // Generate nomor pengajuan
    const nomorPengajuan = await generateNomorPengajuan();

    // Create pengajuan
    const newPengajuan = await db.pengajuanKredensial.create({
      data: {
        nomorPengajuan,
        jenisPengajuan,
        status: 'DRAFT',
        tahapanSaatIni,
        nik,
        namaLengkap,
        gelarDepan: gelarDepan || null,
        gelarBelakang: gelarBelakang || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir || null,
        jenisKelamin: jenisKelamin || null,
        nomorWhatsapp: nomorWhatsapp || null,
        email: email || null,
        jenisSdmk: jenisSdmk || null,
        jenisProfesi: jenisProfesi || null,
        jabatanFungsional: jabatanFungsional || null,
        statusKepegawaian: statusKepegawaian || null,
        pangkatGolongan: pangkatGolongan || null,
        unitKerja: unitKerja || null,
        puskesmasId: puskesmasId || null,
        profesiId: profesiId || null,
        userId
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

    // Create initial status history
    await db.statusHistory.create({
      data: {
        pengajuanId: newPengajuan.id,
        statusSebelumnya: null,
        statusBaru: 'DRAFT',
        diubahOleh: userId,
        catatan: 'Pengajuan dibuat sebagai draft'
      }
    });

    // Create audit log
    await createAuditLog(
      userId,
      'CREATE',
      'pengajuan_kredensial',
      newPengajuan.id,
      null,
      newPengajuan,
      request
    );

    return NextResponse.json(
      {
        success: true,
        data: newPengajuan,
        message: 'Pengajuan berhasil dibuat'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pengajuan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat membuat pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update pengajuan (full update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan wajib diisi' },
        { status: 400 }
      );
    }

    // Check if pengajuan exists
    const existingPengajuan = await db.pengajuanKredensial.findUnique({
      where: { id }
    });

    if (!existingPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent update if already submitted or cancelled
    if (existingPengajuan.status === 'DIAJUKAN' || 
        existingPengajuan.status === 'SELESAI' || 
        existingPengajuan.status === 'DITOLAK' ||
        existingPengajuan.status === 'DIBATALKAN') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tidak dapat mengubah pengajuan dengan status ${existingPengajuan.status}` 
        },
        { status: 400 }
      );
    }

    // Remove fields that should not be updated directly
    const { 
      nomorPengajuan, 
      status, 
      createdAt, 
      updatedAt, 
      userId,
      ...allowedUpdateData 
    } = updateData;

    // Update pengajuan
    const updatedPengajuan = await db.pengajuanKredensial.update({
      where: { id },
      data: allowedUpdateData,
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

    // Create audit log
    await createAuditLog(
      existingPengajuan.userId,
      'UPDATE',
      'pengajuan_kredensial',
      id,
      existingPengajuan,
      updatedPengajuan,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedPengajuan,
      message: 'Pengajuan berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating pengajuan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat memperbarui pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete pengajuan (set status to DIBATALKAN)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const alasan = searchParams.get('alasan');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan wajib diisi' },
        { status: 400 }
      );
    }

    // Check if pengajuan exists
    const existingPengajuan = await db.pengajuanKredensial.findUnique({
      where: { id }
    });

    if (!existingPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Only allow cancellation of DRAFT or DIAJUKAN status
    if (!['DRAFT', 'DIAJUKAN'].includes(existingPengajuan.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Hanya pengajuan dengan status DRAFT atau DIAJUKAN yang dapat dibatalkan` 
        },
        { status: 400 }
      );
    }

    // Soft delete by updating status
    const cancelledPengajuan = await db.pengajuanKredensial.update({
      where: { id },
      data: {
        status: 'DIBATALKAN',
        catatan: alasan || 'Pengajuan dibatalkan oleh pemohon'
      }
    });

    // Create status history
    await db.statusHistory.create({
      data: {
        pengajuanId: id,
        statusSebelumnya: existingPengajuan.status,
        statusBaru: 'DIBATALKAN',
        diubahOleh: userId || existingPengajuan.userId,
        catatan: alasan || 'Pengajuan dibatalkan oleh pemohon'
      }
    });

    // Create audit log
    await createAuditLog(
      userId || existingPengajuan.userId,
      'DELETE',
      'pengajuan_kredensial',
      id,
      existingPengajuan,
      cancelledPengajuan,
      request
    );

    return NextResponse.json({
      success: true,
      data: cancelledPengajuan,
      message: 'Pengajuan berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Error deleting pengajuan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat membatalkan pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
