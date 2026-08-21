import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all active Puskesmas (for dropdown)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search');
    const tipe = searchParams.get('tipe'); // PUSKESMAS, RUMAH_SAKIT, KLINIK
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10); // Default higher limit for dropdowns
    const getAll = searchParams.get('all') === 'true'; // Get all without pagination

    // Build where clause
    const where: Record<string, any> = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (tipe) {
      where.tipe = tipe;
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
        { alamat: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (getAll) {
      // Return all records without pagination
      const puskesmasList = await db.masterPuskesmas.findMany({
        where,
        select: {
          id: true,
          kode: true,
          nama: true,
          alamat: true,
          telp: true,
          email: true,
          tipe: true,
          isActive: true,
          _count: {
            select: {
              pengajuan: {
                where: {
                  status: { not: 'DIBATALKAN' }
                }
              }
            }
          }
        },
        orderBy: [
          { tipe: 'asc' },
          { nama: 'asc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: puskesmasList,
        message: 'Daftar Puskesmas berhasil diambil'
      });
    }

    // Paginated response
    const skip = (page - 1) * limit;
    const total = await db.masterPuskesmas.count({ where });
    const totalPages = Math.ceil(total / limit);

    const puskesmasList = await db.masterPuskesmas.findMany({
      where,
      select: {
        id: true,
        kode: true,
        nama: true,
        alamat: true,
        telp: true,
        email: true,
        tipe: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            pengajuan: {
              where: {
                status: { not: 'DIBATALKAN' }
              }
            }
          }
        }
      },
      orderBy: [
        { tipe: 'asc' },
        { nama: 'asc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: puskesmasList,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Daftar Puskesmas berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching master puskesmas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil daftar Puskesmas',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new Puskesmas (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authorization header (placeholder)
    const authHeader = request.headers.get('authorization');
    // In production, verify JWT token here
    
    const body = await request.json();
    const { kode, nama, alamat, telp, email, tipe } = body;

    // Validate required fields
    if (!kode || !nama) {
      return NextResponse.json(
        { success: false, error: 'Kode dan nama Puskesmas wajib diisi' },
        { status: 400 }
      );
    }

    // Check if kode already exists
    const existingPuskesmas = await db.masterPuskesmas.findUnique({
      where: { kode }
    });

    if (existingPuskesmas) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Puskesmas dengan kode ${kode} sudah ada` 
        },
        { status: 409 }
      );
    }

    // Create new Puskesmas
    const newPuskesmas = await db.masterPuskesmas.create({
      data: {
        kode: kode.toUpperCase(),
        nama,
        alamat: alamat || null,
        telp: telp || null,
        email: email || null,
        tipe: tipe || 'PUSKESMAS',
        isActive: true
      }
    });

    // Create audit log
    try {
      await db.auditLog.create({
        data: {
          userId: null, // Will be filled from auth token in production
          aksi: 'CREATE',
          tabel: 'master_puskesmas',
          recordId: newPuskesmas.id,
          dataBaru: JSON.stringify(newPuskesmas),
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
        data: newPuskesmas,
        message: 'Puskesmas berhasil ditambahkan'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating master puskesmas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat menambahkan Puskesmas',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
