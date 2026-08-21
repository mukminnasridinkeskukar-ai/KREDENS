import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all active Profesi (filter by jenisSdmk if provided)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search');
    const jenisSdmk = searchParams.get('jenisSdmk'); // TENAGA_KESEHATAN, TENAGA_MEDIS
    const kategori = searchParams.get('kategori'); // KLINIK, NON_KLINIK
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const getAll = searchParams.get('all') === 'true';

    // Build where clause
    const where: Record<string, any> = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (jenisSdmk) {
      where.jenisSdmk = jenisSdmk.toUpperCase();
    }

    if (kategori) {
      where.kategori = kategori.toUpperCase();
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (getAll) {
      // Return all records without pagination
      const profesiList = await db.masterProfesi.findMany({
        where,
        select: {
          id: true,
          kode: true,
          nama: true,
          jenisSdmk: true,
          kategori: true,
          deskripsi: true,
          isActive: true,
          _count: {
            select: {
              kompetensi: {
                where: { isActive: true }
              },
              kewenangan: {
                where: { isActive: true }
              },
              pengajuan: {
                where: {
                  status: { not: 'DIBATALKAN' }
                }
              }
            }
          }
        },
        orderBy: [
          { jenisSdmk: 'asc' },
          { nama: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: profesiList,
        message: 'Daftar Profesi berhasil diambil'
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;
    const total = await db.masterProfesi.count({ where });
    const totalPages = Math.ceil(total / limit);

    const profesiList = await db.masterProfesi.findMany({
      where,
      select: {
        id: true,
        kode: true,
        nama: true,
        jenisSdmk: true,
        kategori: true,
        deskripsi: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            kompetensi: {
              where: { isActive: true }
            },
            kewenangan: {
              where: { isActive: true }
            },
            pengajuan: {
              where: {
                status: { not: 'DIBATALKAN' }
              }
            }
          }
        }
      },
      orderBy: [
        { jenisSdmk: 'asc' },
        { nama: 'asc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: profesiList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Daftar Profesi berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching master profesi:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar Profesi',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new Profesi (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authorization header (placeholder)
    const authHeader = request.headers.get('authorization');
    
    const body = await request.json();
    const { kode, nama, jenisSdmk, kategori, deskripsi } = body;

    // Validate required fields
    if (!kode || !nama || !jenisSdmk) {
      return NextResponse.json(
        { success: false, error: 'Kode, nama, dan jenis SDMK wajib diisi' },
        { status: 400 }
      );
    }

    // Validate jenisSdmk
    const validJenisSdmk = ['TENAGA_KESEHATAN', 'TENAGA_MEDIS'];
    if (!validJenisSdmk.includes(jenisSdmk.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Jenis SDMK tidak valid. Pilih: ${validJenisSdmk.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if kode already exists
    const existingProfesi = await db.masterProfesi.findUnique({
      where: { kode: kode.toUpperCase() }
    });

    if (existingProfesi) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Profesi dengan kode ${kode} sudah ada` 
        },
        { status: 409 }
      );
    }

    // Create new Profesi
    const newProfesi = await db.masterProfesi.create({
      data: {
        kode: kode.toUpperCase(),
        nama,
        jenisSdmk: jenisSdmk.toUpperCase(),
        kategori: kategori?.toUpperCase() || null,
        deskripsi: deskripsi || null,
        isActive: true
      }
    });

    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          userId: null,
          aksi: 'CREATE',
          tabel: 'master_profesi',
          recordId: newProfesi.id,
          dataBaru: JSON.stringify(newProfesi),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null
        }
      });
    } catch (logError) {
      console.error('Failed to create audit log:', logError);
    }

    return NextResponse.json(
      {
        success: true,
        data: newProfesi,
        message: 'Profesi berhasil ditambahkan'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating master profesi:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menambahkan Profesi',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
