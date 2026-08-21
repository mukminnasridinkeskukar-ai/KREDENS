import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List kompetensi by profesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const profesiId = searchParams.get('profesiId');
    const search = searchParams.get('search');
    const level = searchParams.get('level'); // DASAR, MENENGAH, LANJUTAN
    const jenis = searchParams.get('jenis'); // UTAMA, KHUSUS, PENUNJANG
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

    if (level) {
      where.level = level.toUpperCase();
    }

    if (jenis) {
      where.jenis = jenis.toUpperCase();
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
      const kompetensiList = await db.masterKompetensi.findMany({
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
              assessment: true
            }
          }
        },
        orderBy: [
          { level: 'asc' },
          { jenis: 'asc' },
          { nama: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: kompetensiList,
        message: 'Daftar Kompetensi berhasil diambil'
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;
    const total = await db.masterKompetensi.count({ where });
    const totalPages = Math.ceil(total / limit);

    const kompetensiList = await db.masterKompetensi.findMany({
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
            assessment: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { jenis: 'asc' },
        { nama: 'asc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: kompetensiList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Daftar Kompetensi berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching master kompetensi:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar Kompetensi',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new Kompetensi (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authorization header (placeholder)
    const authHeader = request.headers.get('authorization');
    
    const body = await request.json();
    const { kode, nama, profesiId, level, jenis, deskripsi } = body;

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
    const validLevels = ['DASAR', 'MENENGAH', 'LANJUTAN'];
    if (level && !validLevels.includes(level.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Level tidak valid. Pilih: ${validLevels.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const validJenis = ['UTAMA', 'KHUSUS', 'PENUNJANG'];
    if (jenis && !validJenis.includes(jenis.toUpperCase())) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Jenis tidak valid. Pilih: ${validJenis.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if kode already exists
    const existingKompetensi = await db.masterKompetensi.findUnique({
      where: { kode: kode.toUpperCase() }
    });

    if (existingKompetensi) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Kompetensi dengan kode ${kode} sudah ada` 
        },
        { status: 409 }
      );
    }

    // Create new Kompetensi
    const newKompetensi = await db.masterKompetensi.create({
      data: {
        kode: kode.toUpperCase(),
        nama,
        profesiId,
        level: level?.toUpperCase() || null,
        jenis: jenis?.toUpperCase() || null,
        deskripsi: deskripsi || null,
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
          tabel: 'master_kompetensi',
          recordId: newKompetensi.id,
          dataBaru: JSON.stringify(newKompetensi),
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
        data: newKompetensi,
        message: 'Kompetensi berhasil ditambahkan'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating master kompetensi:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menambahkan Kompetensi',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
