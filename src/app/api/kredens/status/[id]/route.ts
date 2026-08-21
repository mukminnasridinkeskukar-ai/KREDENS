import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Allowed status transitions map
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'DRAFT': ['DIAJUKAN', 'DIBATALKAN'],
  'DIAJUKAN': ['VERIFIKASI_PUSKESMAS', 'PERBAIKAN', 'DITOLAK', 'DIBATALKAN'],
  'PERBAIKAN': ['DIAJUKAN', 'DIBATALKAN'],
  'VERIFIKASI_PUSKESMAS': ['PERBAIKAN', 'VERIFIKASI_LENGKAP', 'DITOLAK', 'DIBATALKAN'],
  'VERIFIKASI_LENGKAP': ['DITERUSKAN_KE_DINAS', 'PERBAIKAN', 'DITOLAK'],
  'DITERUSKAN_KE_DINAS': ['PENJADWALAN_ASESMEN', 'DITOLAK'],
  'PENJADWALAN_ASESMEN': ['ASESMEN'],
  'ASESMEN': ['REKOMENDASI', 'DITOLAK'],
  'REKOMENDASI': ['PENETAPAN_KEWENANGAN_KLINIS', 'PERBAIKAN', 'DITOLAK'],
  'PENETAPAN_KEWENANGAN_KLINIS': ['PENUGASAN_KLINIS'],
  'PENUGASAN_KLINIS': ['SELESAI'],
  'SELESAI': [], // Terminal state
  'DITOLAK': [], // Terminal state
  'DIBATALKAN': [] // Terminal state
};

// Status display configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; description: string; step?: number }> = {
  'DRAFT': { label: 'Draft', color: 'gray', description: 'Pengajuan masih dalam tahap pengisian', step: 1 },
  'DIAJUKAN': { label: 'Diajukan', color: 'blue', description: 'Pengajuan telah dikirim dan menunggu verifikasi', step: 2 },
  'VERIFIKASI_PUSKESMAS': { label: 'Verifikasi Puskesmas', color: 'yellow', description: 'Sedang diverifikasi oleh pihak Puskesmas', step: 3 },
  'PERBAIKAN': { label: 'Perbaikan', color: 'orange', description: 'Pengajuan memerlukan perbaikan data/dokumen' },
  'VERIFIKASI_LENGKAP': { label: 'Verifikasi Lengkap', color: 'green', description: 'Verifikasi selesai, dokumen lengkap' },
  'DITERUSKAN_KE_DINAS': { label: 'Diteruskan ke Dinas', color: 'purple', description: 'Telah diteruskan ke Dinas Kesehatan', step: 4 },
  'PENJADWALAN_ASESMEN': { label: 'Penjadwalan Asesmen', color: 'indigo', description: 'Sedang dijadwalkan untuk asesmen kompetensi', step: 5 },
  'ASESMEN': { label: 'Asesmen', color: 'pink', description: 'Proses asesmen kompetensi sedang berlangsung', step: 6 },
  'REKOMENDASI': { label: 'Rekomendasi', color: 'teal', description: 'Tim Ad Hoc sedang membuat rekomendasi', step: 7 },
  'PENETAPAN_KEWENANGAN_KLINIS': { label: 'Penetapan Kewenangan', color: 'cyan', description: 'Proses penetapan kewenangan klinis', step: 8 },
  'PENUGASAN_KLINIS': { label: 'Penugasan Klinis', color: 'emerald', description: 'Penugasan klinis sedang diproses' },
  'SELESAI': { label: 'Selesai', color: 'green', description: 'Pengajuan telah selesai diproses' },
  'DITOLAK': { label: 'Ditolak', color: 'red', description: 'Pengajuan ditolak' },
  'DIBATALKAN': { label: 'Dibatalkan', color: 'slate', description: 'Pengajuan dibatalkan oleh pemohon' }
};

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

// PATCH - Update status pengajuan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statusBaru, catatan, userId, userName } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan wajib diisi' },
        { status: 400 }
      );
    }

    if (!statusBaru) {
      return NextResponse.json(
        { success: false, error: 'Status baru wajib diisi' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID (pengubah) wajib diisi' },
        { status: 400 }
      );
    }

    // Validate status baru is a valid status
    if (!STATUS_CONFIG[statusBaru]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Status "${statusBaru}" tidak valid`,
          validStatuses: Object.keys(STATUS_CONFIG)
        },
        { status: 400 }
      );
    }

    // Check if pengajuan exists
    const existingPengajuan = await db.pengajuanKredensial.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!existingPengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentStatus = existingPengajuan.status;

    // Check if status transition is allowed
    const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(statusBaru)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Transisi status dari "${currentStatus}" ke "${statusBaru}" tidak diizinkan`,
          currentStatus: {
            status: currentStatus,
            ...STATUS_CONFIG[currentStatus]
          },
          requestedStatus: {
            status: statusBaru,
            ...STATUS_CONFIG[statusBaru]
          },
          allowedTransitions: allowedTransitions.map(s => ({
            status: s,
            ...STATUS_CONFIG[s]
          }))
        },
        { status: 400 }
      );
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      status: statusBaru,
      catatan: catatan || existingPengajuan.catatan
    };

    // Auto-update tahapanSaatIni based on new status
    if (STATUS_CONFIG[statusBaru]?.step) {
      updatePayload.tahapanSaatIni = STATUS_CONFIG[statusBaru].step!;
    }

    // Set tanggalSelesai for terminal states
    if (statusBaru === 'SELESAI' || statusBaru === 'DITOLAK' || statusBaru === 'DIBATALKAN') {
      updatePayload.tanggalSelesai = new Date();
    }

    // Update pengajuan in transaction
    const updatedPengajuan = await db.$transaction(async (tx) => {
      // Update main pengajuan
      const updated = await tx.pengajuanKredensial.update({
        where: { id },
        data: updatePayload
      });

      // Create status history entry
      await tx.statusHistory.create({
        data: {
          pengajuanId: id,
          statusSebelumnya: currentStatus,
          statusBaru: statusBaru,
          diubahOleh: userId,
          diubahOlehName: userName || null,
          catatan: catatan || `Status diubah dari ${currentStatus} ke ${statusBaru}`
        }
      });

      return updated;
    });

    // Create audit log
    await createAuditLog(
      userId,
      statusBaru === 'DITOLAK' ? 'REJECT' : 
      statusBaru === 'SELESAI' ? 'APPROVE' : 'UPDATE',
      'pengajuan_kredensial',
      id,
      { status: currentStatus, catatan: existingPengajuan.catatan },
      { status: statusBaru, catatan: catatan || existingPengajuan.catatan },
      request
    );

    // Return response with full status info
    return NextResponse.json({
      success: true,
      data: {
        pengajuan: updatedPengajuan,
        statusChange: {
          from: {
            status: currentStatus,
            ...STATUS_CONFIG[currentStatus]
          },
          to: {
            status: statusBaru,
            ...STATUS_CONFIG[statusBaru]
          },
          changedBy: userId,
          changedByName: userName,
          catatan: catatan,
          changedAt: new Date()
        }
      },
      message: `Status berhasil diubah dari ${currentStatus} ke ${statusBaru}`
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengubah status',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// GET - Get available status transitions for a pengajuan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pengajuan wajib diisi' },
        { status: 400 }
      );
    }

    // Check if pengajuan exists
    const pengajuan = await db.pengajuanKredensial.findUnique({
      where: { id },
      select: {
        id: true,
        nomorPengajuan: true,
        status: true,
        namaLengkap: true
      }
    });

    if (!pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentStatus = pengajuan.status;
    const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];

    return NextResponse.json({
      success: true,
      data: {
        pengajuan,
        currentStatus: {
          status: currentStatus,
          ...STATUS_CONFIG[currentStatus]
        },
        allowedTransitions: allowedTransitions.map(s => ({
          status: s,
          ...STATUS_CONFIG[s]
        })),
        allStatuses: Object.entries(STATUS_CONFIG).map(([key, value]) => ({
          status: key,
          ...value
        }))
      },
      message: 'Informasi status berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting status info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil informasi status',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
