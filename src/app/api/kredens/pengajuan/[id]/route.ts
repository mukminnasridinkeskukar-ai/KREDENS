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

// GET - Get detail pengajuan by ID (include all relations)
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

    const pengajuan = await db.pengajuanKredensial.findUnique({
      where: { id },
      include: {
        // User info
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            nik: true
          }
        },
        
        // Master data relations
        puskesmas: true,
        profesi: true,
        
        // Educational background
        pendidikan: {
          orderBy: { createdAt: 'asc' }
        },
        
        // Work history
        riwayatPekerjaan: {
          orderBy: { noUrut: 'asc' }
        },
        
        // Training
        pelatihan: {
          orderBy: { createdAt: 'asc' }
        },
        
        // Portfolio
        portofolio: {
          orderBy: { createdAt: 'desc' }
        },
        
        // Self assessment
        selfAssessment: {
          include: {
            kompetensi: true
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // Requested authorities
        kewenanganDiajukan: {
          include: {
            kewenangan: true
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // Documents
        dokumen: {
          include: {
            masterDokumen: true
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // Workflow stages
        verifikasi: {
          orderBy: { createdAt: 'desc' }
        },
        asesmen: {
          orderBy: { createdAt: 'desc' }
        },
        rekomendasi: {
          orderBy: { createdAt: 'desc' }
        },
        penetapan: {
          include: {
            puskesmas: true
          },
          orderBy: { createdAt: 'desc' }
        },
        penugasan: {
          orderBy: { createdAt: 'desc' }
        },
        
        // Status history (for timeline)
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pengajuan,
      message: 'Detail pengajuan berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching pengajuan detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil detail pengajuan',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (for status changes, draft save)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    const { 
      status, 
      catatan, 
      tahapanSaatIni,
      userId,
      ...updateData 
    } = body;

    // If status change is requested, validate transition
    if (status && status !== existingPengajuan.status) {
      const allowedTransitions: Record<string, string[]> = {
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
        'SELESAI': [],
        'DITOLAK': [],
        'DIBATALKAN': []
      };

      const currentAllowedTransitions = allowedTransitions[existingPengajuan.status] || [];
      
      if (!currentAllowedTransitions.includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Transisi status dari ${existingPengajuan.status} ke ${status} tidak diizinkan`,
            allowedTransitions: currentAllowedTransitions
          },
          { status: 400 }
        );
      }

      // Create status history entry
      await db.statusHistory.create({
        data: {
          pengajuanId: id,
          statusSebelumnya: existingPengajuan.status,
          statusBaru: status,
          diubahOleh: userId || existingPengajuan.userId,
          catatan: catatan || `Status diubah dari ${existingPengajuan.status} ke ${status}`
        }
      });
    }

    // Build update payload
    const updatePayload: Record<string, any> = { ...updateData };
    
    if (status !== undefined) {
      updatePayload.status = status;
    }
    
    if (catatan !== undefined) {
      updatePayload.catatan = catatan;
    }
    
    if (tahapanSaatIni !== undefined) {
      updatePayload.tahapanSaatIni = tahapanSaatIni;
    }

    // Perform update
    const updatedPengajuan = await db.pengajuanKredensial.update({
      where: { id },
      data: updatePayload,
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

    // Create audit log for important changes
    if (status && status !== existingPengajuan.status) {
      await createAuditLog(
        userId || existingPengajuan.userId,
        'UPDATE',
        'pengajuan_kredensial',
        id,
        { status: existingPengajuan.status },
        { status: updatedPengajuan.status },
        request
      );
    }

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
