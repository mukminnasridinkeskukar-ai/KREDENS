import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Check if NIK exists in database
// NEVER block NIK that was used before (allow re-registration/rekredensial)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nik, excludePengajuanId } = body;

    // Validate NIK format
    if (!nik) {
      return NextResponse.json(
        { success: false, error: 'NIK wajib diisi' },
        { status: 400 }
      );
    }

    // Basic NIK validation (16 digits)
    const cleanedNik = nik.toString().trim();
    if (!/^\d{16}$/.test(cleanedNik)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Format NIK tidak valid. NIK harus terdiri dari 16 digit angka.' 
        },
        { status: 400 }
      );
    }

    // Search for existing pengajuan with this NIK
    const whereClause: Record<string, any> = {
      nik: cleanedNik,
      status: { not: 'DIBATALKAN' }
    };

    // Exclude specific pengajuan ID if provided (for editing current draft)
    if (excludePengajuanId) {
      whereClause.id = { not: excludePengajuanId };
    }

    // Find all non-cancelled pengajuan with this NIK
    const existingPengajuanList = await db.pengajuanKredensial.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
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
            verifikasi: true,
            asesmen: true,
            rekomendasi: true,
            penetapan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to last 10 records to avoid huge responses
    });

    // Check if NIK exists in user table as well
    const userWithNik = await db.user.findUnique({
      where: { nik: cleanedNik },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // If no existing data found
    if (existingPengajuanList.length === 0 && !userWithNik) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          nik: cleanedNik,
          message: 'NIK tidak ditemukan dalam sistem. Anda dapat mendaftar baru.'
        }
      });
    }

    // Build response with existing data
    const response: Record<string, any> = {
      exists: true,
      nik: cleanedNik,
      canRegister: true, // ALWAYS allow re-registration/rekredensial
      message: 'NIK ditemukan dalam sistem. Data sebelumnya ditampilkan untuk referensi.'
    };

    // Add user info if found
    if (userWithNik) {
      response.user = userWithNik;
    }

    // Add previous pengajuan data
    if (existingPengajuanList.length > 0) {
      // Get the most recent/active pengajuan for quick reference
      const latestPengajuan = existingPengajuanList[0];
      
      response.latestData = {
        id: latestPengajuan.id,
        nomorPengajuan: latestPengajuan.nomorPengajuan,
        namaLengkap: latestPengajuan.namaLengkap,
        gelarDepan: latestPengajuan.gelarDepan,
        gelarBelakang: latestPengajuan.gelarBelakang,
        tempatLahir: latestPengajuan.tempatLahir,
        tanggalLahir: latestPengajuan.tanggalLahir,
        jenisKelamin: latestPengajuan.jenisKelamin,
        nomorWhatsapp: latestPengajuan.nomorWhatsapp,
        email: latestPengajuan.email,
        jenisSdmk: latestPengajuan.jenisSdmk,
        jenisProfesi: latestPengajuan.jenisProfesi,
        jabatanFungsional: latestPengajuan.jabatanFungsional,
        statusKepegawaian: latestPengajuan.statusKepegawaian,
        pangkatGolongan: latestPengajuan.pangkatGolongan,
        unitKerja: latestPengajuan.unitKerja,
        status: latestPengajuan.status,
        jenisPengajuan: latestPengajuan.jenisPengajuan,
        tanggalPengajuan: latestPengajuan.tanggalPengajuan,
        tanggalSelesai: latestPengajuan.tanggalSelesai,
        puskesmas: latestPengajuan.puskesmas,
        profesi: latestPengajuan.profesi,
        user: latestPengajuan.user
      };

      // Add history of previous pengajuan
      response.previousPengajuan = existingPengajuanList.map(p => ({
        id: p.id,
        nomorPengajuan: p.nomorPengajuan,
        jenisPengajuan: p.jenisPengajuan,
        status: p.status,
        namaLengkap: p.namaLengkap,
        profesi: p.profesi?.nama || p.jenisProfesi,
        puskesmas: p.puskesmas?.nama,
        tanggalPengajuan: p.tanggalPengajuan,
        tanggalSelesai: p.tanggalSelesai,
        createdAt: p.createdAt,
        isCompleted: p.status === 'SELESAI',
        isRejected: p.status === 'DITOLAK',
        isInProgress: !['SELESAI', 'DITOLAK', 'DIBATALKAN'].includes(p.status)
      }));

      // Suggest appropriate jenisPengajuan based on history
      const hasCompletedPengajuan = existingPengajuanList.some(
        p => p.status === 'SELESAI'
      );
      
      if (hasCompletedPengajuan) {
        response.suggestedJenisPengajuan = ['REKREDENSIAL', 'PERUBAHAN_KEWENANGAN', 'PERUBAHAN_TEMPAT', 'PERUBAHAN_KOMPETENSI'];
        response.suggestionMessage = 'NIK ini memiliki pengajuan yang sudah selesai. Anda dapat melakukan rekredensial atau perubahan data.';
      } else {
        const activePengajuan = existingPengajuanList.find(
          p => !['SELESAI', 'DITOLAK', 'DIBATALKAN'].includes(p.status)
        );
        
        if (activePengajuan) {
          response.hasActivePengajuan = true;
          response.activePengajuan = {
            id: activePengajuan.id,
            nomorPengajuan: activePengajuan.nomorPengajuan,
            status: activePengajuan.status
          };
          response.suggestionMessage = `Anda memiliki pengajuan aktif dengan nomor ${activePengajuan.nomorPengajuan} (Status: ${activePengajuan.status}).`;
        } else {
          response.suggestedJenisPengajuan = ['AWAL'];
          response.suggestionMessage = 'Anda dapat membuat pengajuan baru.';
        }
      }

      // Count statistics
      response.statistics = {
        totalPengajuan: existingPengajuanList.length,
        completed: existingPengajuanList.filter(p => p.status === 'SELESAI').length,
        rejected: existingPengajuanList.filter(p => p.status === 'DITOLAK').length,
        inProgress: existingPengajuanList.filter(p => 
          !['SELESAI', 'DITOLAK', 'DIBATALKAN'].includes(p.status)
        ).length
      };
    }

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error checking NIK:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi saat memeriksa NIK',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// GET - Alternative method to check NIK via query param
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nik = searchParams.get('nik');
    const excludePengajuanId = searchParams.get('excludePengajuanId');

    if (!nik) {
      return NextResponse.json(
        { success: false, error: 'Parameter NIK wajib disertakan' },
        { status: 400 }
      );
    }

    // Reuse POST logic by calling it internally
    const postResponse = await POST(
      new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, excludePengajuanId })
      })
    );

    return postResponse;
  } catch (error) {
    console.error('Error checking NIK (GET):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat memeriksa NIK',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
