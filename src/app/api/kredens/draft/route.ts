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

// POST - Save draft (create or update, status always DRAFT)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      pengajuanId, 
      userId, 
      stepData, 
      currentStep,
      // Identitas fields
      nik,
      namaLengkap,
      gelarDepan,
      gelarBelakang,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      nomorWhatsapp,
      email,
      // Profesi fields
      jenisSdmk,
      jenisProfesi,
      jabatanFungsional,
      statusKepegawaian,
      pangkatGolongan,
      unitKerja,
      puskesmasId,
      profesiId,
      // Related data (optional - for batch save)
      pendidikan,
      riwayatPekerjaan,
      pelatihan,
      portofolio,
      selfAssessment,
      kewenanganDiajukan,
      dokumen
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    let savedPengajuan;

    // If pengajuanId provided, update existing draft
    if (pengajuanId) {
      const existingDraft = await db.pengajuanKredensial.findUnique({
        where: { id: pengajuanId }
      });

      if (!existingDraft) {
        return NextResponse.json(
          { success: false, error: 'Draft tidak ditemukan' },
          { status: 404 }
        );
      }

      if (existingDraft.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Anda tidak memiliki akses ke draft ini' },
          { status: 403 }
        );
      }

      if (existingDraft.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: `Hanya dapat menyimpan draft dengan status DRAFT. Status saat ini: ${existingDraft.status}` },
          { status: 400 }
        );
      }

      // Build update data
      const updateData: Record<string, any> = {
        status: 'DRAFT', // Always ensure status is DRAFT
        updatedAt: new Date()
      };

      // Add identity fields if provided
      if (nik !== undefined) updateData.nik = nik;
      if (namaLengkap !== undefined) updateData.namaLengkap = namaLengkap;
      if (gelarDepan !== undefined) updateData.gelarDepan = gelarDepan;
      if (gelarBelakang !== undefined) updateData.gelarBelakang = gelarBelakang;
      if (tempatLahir !== undefined) updateData.tempatLahir = tempatLahir;
      if (tanggalLahir !== undefined) updateData.tanggalLahir = tanggalLahir;
      if (jenisKelamin !== undefined) updateData.jenisKelamin = jenisKelamin;
      if (nomorWhatsapp !== undefined) updateData.nomorWhatsapp = nomorWhatsapp;
      if (email !== undefined) updateData.email = email;
      
      // Add profesi fields if provided
      if (jenisSdmk !== undefined) updateData.jenisSdmk = jenisSdmk;
      if (jenisProfesi !== undefined) updateData.jenisProfesi = jenisProfesi;
      if (jabatanFungsional !== undefined) updateData.jabatanFungsional = jabatanFungsional;
      if (statusKepegawaian !== undefined) updateData.statusKepegawaian = statusKepegawaian;
      if (pangkatGolongan !== undefined) updateData.pangkatGolongan = pangkatGolongan;
      if (unitKerja !== undefined) updateData.unitKerja = unitKerja;
      if (puskesmasId !== undefined) updateData.puskesmasId = puskesmasId;
      if (profesiId !== undefined) updateData.profesiId = profesiId;
      
      // Update current step if provided
      if (currentStep !== undefined && currentStep > 0) {
        updateData.tahapanSaatIni = currentStep;
      }

      savedPengajuan = await db.pengajuanKredensial.update({
        where: { id: pengajuanId },
        data: updateData
      });

      // Update related data if provided (delete and recreate)
      if (pendidikan && Array.isArray(pendidikan)) {
        await db.pendidikan.deleteMany({ where: { pengajuanId } });
        if (pendidikan.length > 0) {
          await db.pendidikan.createMany({
            data: pendidikan.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      if (riwayatPekerjaan && Array.isArray(riwayatPekerjaan)) {
        await db.riwayatPekerjaan.deleteMany({ where: { pengajuanId } });
        if (riwayatPekerjaan.length > 0) {
          await db.riwayatPekerjaan.createMany({
            data: riwayatPekerjaan.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      if (pelatihan && Array.isArray(pelatihan)) {
        await db.pelatihan.deleteMany({ where: { pengajuanId } });
        if (pelatihan.length > 0) {
          await db.pelatihan.createMany({
            data: pelatihan.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      if (portofolio && Array.isArray(portofolio)) {
        await db.portofolio.deleteMany({ where: { pengajuanId } });
        if (portofolio.length > 0) {
          await db.portofolio.createMany({
            data: portofolio.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      if (selfAssessment && Array.isArray(selfAssessment)) {
        await db.selfAssessment.deleteMany({ where: { pengajuanId } });
        if (selfAssessment.length > 0) {
          await db.selfAssessment.createMany({
            data: selfAssessment.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      if (kewenanganDiajukan && Array.isArray(kewenanganDiajukan)) {
        await db.kewenanganDiajukan.deleteMany({ where: { pengajuanId } });
        if (kewenanganDiajukan.length > 0) {
          await db.kewenanganDiajukan.createMany({
            data: kewenanganDiajukan.map((item: Record<string, any>) => ({
              ...item,
              pengajuanId
            }))
          });
        }
      }

      // Create audit log
      await createAuditLog(
        userId,
        'UPDATE',
        'pengajuan_kredensial',
        pengajuanId,
        existingDraft,
        { ...savedPengajuan, stepData, currentStep },
        request
      );

    } else {
      // Create new draft
      if (!nik || !namaLengkap) {
        return NextResponse.json(
          { success: false, error: 'NIK dan Nama Lengkap wajib diisi untuk membuat draft baru' },
          { status: 400 }
        );
      }

      // Generate temporary nomor for draft
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString(36).toUpperCase();
      const nomorPengajuan = `DRAFT-${year}-${timestamp}`;

      savedPengajuan = await db.pengajuanKredensial.create({
        data: {
          nomorPengajuan,
          jenisPengajuan: body.jenisPengajuan || 'AWAL',
          status: 'DRAFT',
          tahapanSaatIni: currentStep || 1,
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
        }
      });

      // Create related data if provided
      if (pendidikan && Array.isArray(pendidikan) && pendidikan.length > 0) {
        await db.pendidikan.createMany({
          data: pendidikan.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      if (riwayatPekerjaan && Array.isArray(riwayatPekerjaan) && riwayatPekerjaan.length > 0) {
        await db.riwayatPekerjaan.createMany({
          data: riwayatPekerjaan.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      if (pelatihan && Array.isArray(pelatihan) && pelatihan.length > 0) {
        await db.pelatihan.createMany({
          data: pelatihan.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      if (portofolio && Array.isArray(portofolio) && portofolio.length > 0) {
        await db.portofolio.createMany({
          data: portofolio.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      if (selfAssessment && Array.isArray(selfAssessment) && selfAssessment.length > 0) {
        await db.selfAssessment.createMany({
          data: selfAssessment.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      if (kewenanganDiajukan && Array.isArray(kewenanganDiajukan) && kewenanganDiajukan.length > 0) {
        await db.kewenanganDiajukan.createMany({
          data: kewenanganDiajukan.map((item: Record<string, any>) => ({
            ...item,
            pengajuanId: savedPengajuan.id
          }))
        });
      }

      // Create initial status history
      await db.statusHistory.create({
        data: {
          pengajuanId: savedPengajuan.id,
          statusSebelumnya: null,
          statusBaru: 'DRAFT',
          diubahOleh: userId,
          catatan: 'Draft dibuat'
        }
      });

      // Create audit log
      await createAuditLog(
        userId,
        'CREATE',
        'pengajuan_kredensial',
        savedPengajuan.id,
        null,
        { ...savedPengajuan, stepData, currentStep },
        request
      );
    }

    // Fetch complete updated data
    const completeData = await db.pengajuanKredensial.findUnique({
      where: { id: savedPengajuan.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        puskesmas: true,
        profesi: true,
        pendidikan: true,
        riwayatPekerjaan: true,
        pelatihan: true,
        portofolio: true,
        selfAssessment: true,
        kewenanganDiajukan: true,
        dokumen: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: completeData,
        message: pengajuanId ? 'Draft berhasil diperbarui' : 'Draft berhasil dibuat'
      },
      { status: pengajuanId ? 200 : 201 }
    );
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menyimpan draft',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// GET - Get user's drafts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const drafts = await db.pengajuanKredensial.findMany({
      where: {
        userId,
        status: 'DRAFT'
      },
      include: {
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
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: drafts,
      message: 'Daftar draft berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar draft',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
