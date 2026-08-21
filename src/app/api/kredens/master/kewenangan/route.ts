import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List kewenangan klinis by profesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const profesiId = searchParams.get('profesiId');
    const search = searchParams.get('search');
    const kategori = searchParams.get('kategori'); // DIAGNOSTIK, TERAPEUTIK, PREVENTIF
    const tingkatDefault = searchParams.get('tingkatDefault'); // MANDIRI, SUPERVISI
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const getAll = searchParams.get('all') === 'true';

    // Build where clause
    const where: Record<string, any> = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (profesiId) {
      where.profesiId = profesiId;
    }

    if (kategori) {
      where.kategori = kategori.toUpperCase();
    }

    if (tingkatDefault) {
      where.tingkatDefault = tingkatDefault.toUpperCase();
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
      const kewenanganList = await db.masterKewenanganKlinis.findMany({
        where,
        include: {
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
              kewenanganDiajukan: true
            }
          }
        },
        orderBy: [
          { kategori: 'asc' },
          { nama: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: kewenanganList,
        message: 'Daftar Kewenangan Klinis berhasil diambil'
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;
    const total = await db.masterKewenanganKlinis.count({ where });
    const totalPages = Math.ceil(total / limit);

    const kewenanganList = await db.masterKewenanganKlinis.findMany({
      where,
      include: {
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
            kewenanganDiajukan: true
          }
        }
      },
      orderBy: [
        { kategori: 'asc' },
        { nama: 'asc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: kewenanganList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Daftar Kewenangan Klinis berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching master kewenangan klinis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar Kewenangan Klinis',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new Kewenangan Klinis (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authorization header (placeholder)
    const authHeader = request.headers.get('authorization');
    
    const body = await request.json();
    const { kode, nama, profesiId, kategori, deskripsi, tingkatDefault } = body;

    // Validate required fields
    if (!kode || !nama || !profesiId) {
      return NextResponse.json(
        { success: false, error: 'Kode, nama, dan profesi ID wajib diisi' },
        { status: 400 }
      );
    }

    // Validate profesi exists
    const profesi = await db.masterProfesi.findUnique({
      where: { id: profesiId }
    });

    if (!profesi) {
      return NextResponse.json(
        { success: false, error: 'Profesi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate optional fields
    const validKategori = ['DIAGNOSTIK', 'TERAPEUTIK', 'PREVENTIF'];
    if (kategori && !validKategori.includes(kategori.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Kategori tidak valid. Pilih: ${validKategori.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const validTingkat = ['MANDIRI', 'SUPERVISI'];
    if (tingkatDefault && !validTingkat.includes(tingkatDefault.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tingkat default tidak valid. Pilih: ${validTingkat.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if kode already exists
    const existingKewenangan = await db.masterKewenanganKlinis.findUnique({
      where: { kode: kode.toUpperCase() }
    });

    if (existingKewenangan) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Kewenangan klinis dengan kode ${kode} sudah ada` 
        },
        { status: 409 }
      );
    }

    // Create new Kewenangan Klinis
    const newKewenangan = await db.masterKewenanganKlinis.create({
      data: {
        kode: kode.toUpperCase(),
        nama,
        profesiId,
        kategori: kategori?.toUpperCase() || null,
        deskripsi: deskripsi || null,
        tingkatDefault: tingkatDefault?.toUpperCase() || null,
        isActive: true
      },
      include: {
        profesi: {
          select: {
            id: true,
            kode: true,
            nama: true
          }
        }
      }
    });

    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          userId: null,
          aksi: 'CREATE',
          tabel: 'master_kewenangan_klinis',
          recordId: newKewenangan.id,
          dataBaru: JSON.stringify(newKewenangan),
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
        data: newKewenangan,
        message: 'Kewenangan Klinis berhasil ditambahkan'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating master kewenangan klinis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menambahkan Kewenangan Klinis',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
