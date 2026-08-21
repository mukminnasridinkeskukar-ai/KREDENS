import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Status configuration for tracking display
const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  description: string; 
  icon?: string;
  step?: number;
  isTerminal: boolean;
}> = {
  'DRAFT': { label: 'Draft', color: '#6B7280', description: 'Pengajuan masih dalam tahap pengisian', icon: 'file-text', step: 1, isTerminal: false },
  'DIAJUKAN': { label: 'Diajukan', color: '#3B82F6', description: 'Pengajuan telah dikirim dan menunggu verifikasi', icon: 'send', step: 2, isTerminal: false },
  'VERIFIKASI_PUSKESMAS': { label: 'Verifikasi Puskesmas', color: '#F59E0B', description: 'Sedang diverifikasi oleh pihak Puskesmas', icon: 'building', step: 3, isTerminal: false },
  'PERBAIKAN': { label: 'Perbaikan', color: '#F97316', description: 'Pengajuan memerlukan perbaikan data/dokumen', icon: 'edit', isTerminal: false },
  'VERIFIKASI_LENGKAP': { label: 'Verifikasi Lengkap', color: '#10B981', description: 'Verifikasi selesai, dokumen lengkap', icon: 'check-circle', isTerminal: false },
  'DITERUSKAN_KE_DINAS': { label: 'Diteruskan ke Dinas', color: '#8B5CF6', description: 'Telah diteruskan ke Dinas Kesehatan', icon: 'arrow-right-circle', step: 4, isTerminal: false },
  'PENJADWALAN_ASESMEN': { label: 'Penjadwalan Asesmen', color: '#6366F1', description: 'Sedang dijadwalkan untuk asesmen kompetensi', icon: 'calendar', step: 5, isTerminal: false },
  'ASESMEN': { label: 'Asesmen', color: '#EC4899', description: 'Proses asesmen kompetensi sedang berlangsung', icon: 'clipboard-check', step: 6, isTerminal: false },
  'REKOMENDASI': { label: 'Rekomendasi', color: '#14B8A6', description: 'Tim Ad Hoc sedang membuat rekomendasi', icon: 'users', step: 7, isTerminal: false },
  'PENETAPAN_KEWENANGAN_KLINIS': { label: 'Penetapan Kewenangan', color: '#06B6D4', description: 'Proses penetapan kewenangan klinis', icon: 'award', step: 8, isTerminal: false },
  'PENUGASAN_KLINIS': { label: 'Penugasan Klinis', color: '#059669', description: 'Penugasan klinis sedang diproses', icon: 'briefcase', isTerminal: false },
  'SELESAI': { label: 'Selesai', color: '#22C55E', description: 'Pengajuan telah selesai diproses', icon: 'check', isTerminal: true },
  'DITOLAK': { label: 'Ditolak', color: '#EF4444', description: 'Pengajuan ditolak', icon: 'x-circle', isTerminal: true },
  'DIBATALKAN': { label: 'Dibatalkan', color: '#64748B', description: 'Pengajuan dibatalkan oleh pemohon', icon: 'ban', isTerminal: true }
};

// Workflow steps for timeline visualization
const WORKFLOW_STEPS = [
  { key: 'DRAFT', label: 'Pengisian Form', description: 'Lengkapi data pengajuan' },
  { key: 'DIAJUKAN', label: 'Pengajuan', description: 'Kirim pengajuan' },
  { key: 'VERIFIKASI_PUSKESMAS', label: 'Verifikasi Puskesmas', description: 'Verifikasi oleh Puskesmas' },
  { key: 'DITERUSKAN_KE_DINAS', label: 'Verifikasi Dinas', description: 'Verifikasi oleh Dinkes' },
  { key: 'ASESMEN', label: 'Asesmen Kompetensi', description: 'Uji kompetensi' },
  { key: 'REKOMENDASI', label: 'Rekomendasi', description: 'Rekomendasi Tim Ad Hoc' },
  { key: 'PENETAPAN_KEWENANGAN_KLINIS', label: 'Penetapan Kewenangan', description: 'SK Penetapan' },
  { key: 'SELESAI', label: 'Selesai', description: 'Proses selesai' }
];

// GET - Get full tracking info for pengajuan
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

    // Fetch pengajuan with all related data
    const pengajuan = await db.pengajuanKredensial.findUnique({
      where: { id },
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
            nama: true
          }
        },
        // Status history for timeline
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        // Workflow data for detailed tracking
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
          orderBy: { createdAt: 'desc' },
          include: {
            puskesmas: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        },
        penugasan: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!pengajuan) {
      return NextResponse.json(
        { success: false, error: 'Pengajuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Build current status info
    const currentStatusConfig = STATUS_CONFIG[pengajuan.status] || {
      label: pengajuan.status,
      color: '#6B7280',
      description: '',
      isTerminal: false
    };

    // Build timeline from status history
    const timeline = pengajuan.statusHistory.map((history, index) => ({
      id: history.id,
      index: index + 1,
      fromStatus: history.statusSebelumnya ? {
        status: history.statusSebelumnya,
        ...STATUS_CONFIG[history.statusSebelumnya]
      } : null,
      toStatus: history.statusBaru ? {
        status: history.statusBaru,
        ...STATUS_CONFIG[history.statusBaru]
      } : null,
      changedBy: history.diubahOleh,
      changedByName: history.diubahOlehName,
      catatan: history.catatan,
      timestamp: history.createdAt.toISOString(),
      date: history.createdAt.toLocaleDateString('id-ID'),
      time: history.createdAt.toLocaleTimeString('id-ID'),
      isFirst: index === 0,
      isLatest: index === pengajuan.statusHistory.length - 1
    }));

    // Calculate progress percentage based on workflow steps
    const currentStepIndex = WORKFLOW_STEPS.findIndex(step => {
      if (step.key === pengajuan.status) return true;
      // Handle intermediate statuses
      if (step.key === 'VERIFIKASI_PUSKESMAS' && ['PERBAIKAN', 'VERIFIKASI_LENGKAP'].includes(pengajuan.status)) return true;
      if (step.key === 'DITERUSKAN_KE_DINAS' && pengajuan.status === 'DITERUSKAN_KE_DINAS') return true;
      if (step.key === 'ASESMEN' && ['PENJADWALAN_ASESMEN', 'ASESMEN'].includes(pengajuan.status)) return true;
      if (step.key === 'REKOMENDASI' && pengajuan.status === 'REKOMENDASI') return true;
      if (step.key === 'PENETAPAN_KEWENANGAN_KLINIS' && ['PENETAPAN_KEWENANGAN_KLINIS', 'PENUGASAN_KLINIS'].includes(pengajuan.status)) return true;
      return false;
    });

    // Determine progress
    let progressPercentage = 0;
    let currentStepKey = '';
    
    if (currentStepIndex !== -1) {
      progressPercentage = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;
      currentStepKey = WORKFLOW_STEPS[currentStepIndex].key;
    } else if (['SELESAI', 'DITOLAK', 'DIBATALKAN'].includes(pengajuan.status)) {
      progressPercentage = pengajuan.status === 'SELESAI' ? 100 : 
                           pengajuan.status === 'DITOLAK' ? 0 : 0;
      currentStepKey = pengajuan.status;
    } else {
      // For statuses not in main steps, estimate position
      if (['PERBAIKAN', 'VERIFIKASI_LENGKAP'].includes(pengajuan.status)) {
        progressPercentage = (3 / WORKFLOW_STEPS.length) * 100;
        currentStepKey = 'VERIFIKASI_PUSKESMAS';
      } else if (pengajuan.status === 'PENJADWALAN_ASESMEN') {
        progressPercentage = (5 / WORKFLOW_STEPS.length) * 100;
        currentStepKey = 'ASESMEN';
      } else if (pengajuan.status === 'PENUGASAN_KLINIS') {
        progressPercentage = (7 / WORKFLOW_STEPS.length) * 100;
        currentStepKey = 'PENETAPAN_KEWENANGAN_KLINIS';
      }
    }

    // Build workflow steps with status
    const workflowStepsWithStatus = WORKFLOW_STEPS.map((step, index) => {
      let stepStatus: 'completed' | 'current' | 'pending' | 'skipped' | 'error' = 'pending';
      
      if (index < currentStepIndex || (currentStepIndex === -1 && progressPercentage >= ((index + 1) / WORKFLOW_STEPS.length) * 100)) {
        stepStatus = 'completed';
      } else if (index === currentStepIndex || step.key === currentStepKey) {
        stepStatus = 'current';
      }
      
      // Handle special cases
      if (pengajuan.status === 'DITOLAK') {
        stepStatus = index <= currentStepIndex ? 'error' : 'pending';
      }
      if (pengajuan.status === 'DIBATALKAN') {
        stepStatus = index <= currentStepIndex ? 'skipped' : 'pending';
      }
      
      return {
        ...step,
        stepNumber: index + 1,
        status: stepStatus,
        isActive: step.key === currentStepKey || step.key === pengajuan.status
      };
    });

    // Calculate duration metrics
    const createdDate = pengajuan.createdAt;
    const submittedDate = pengajuan.tanggalPengajuan;
    const completedDate = pengajuan.tanggalSelesai;

    const durationMetrics = {
      daysSinceCreation: Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceSubmission: submittedDate ? Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
      totalProcessingDays: completedDate && submittedDate ? 
        Math.floor((completedDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
      submissionToNowDays: submittedDate ? 
        Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)) : null
    };

    // Compile additional workflow details
    const workflowDetails = {
      verifikasi: pengajuan.verifikasi.length > 0 ? pengajuan.verifikasi.map(v => ({
        id: v.id,
        tahap: v.tahap,
        status: v.status,
        catatan: v.catatan,
        tanggalVerifikasi: v.tanggalVerifikasi?.toISOString(),
        verifierName: v.verifierName
      })) : null,
      
      asesmen: pengajuan.asesmen.length > 0 ? pengajuan.asesmen.map(a => ({
        id: a.id,
        tanggalAsesmen: a.tanggalAsesmen,
        lokasi: a.lokasi,
        hasil: a.hasil,
        nilai: a.nilai,
        asesmenName: a.asesmenName
      })) : null,
      
      rekomendasi: pengajuan.rekomendasi.length > 0 ? pengajuan.rekomendasi.map(r => ({
        id: r.id,
        rekomendasi: r.rekomendasi,
        catatan: r.catatan,
        timAdHocName: r.timAdHocName,
        tanggalRekomendasi: r.tanggalRekomendasi?.toISOString()
      })) : null,
      
      penetapan: pengajuan.penetapan.length > 0 ? pengajuan.penetapan.map(p => ({
        id: p.id,
        nomorSk: p.nomorSk,
        masaBerlakuMulai: p.masaBerlakuMulai?.toISOString(),
        masaBerlakuAkhir: p.masaBerlakuAkhir?.toISOString(),
        pimpinanName: p.pimpinanName,
        puskesmasNama: p.puskesmas?.nama,
        tanggalPenetapan: p.tanggalPenetapan?.toISOString()
      })) : null,
      
      penugasan: pengajuan.penugasan.length > 0 ? pengajuan.penugasan.map(p => ({
        id: p.id,
        unitPenugasan: p.unitPenugasan,
        jenisPenugasan: p.jenisPenugasan,
        supervisorName: p.supervisorName,
        tanggalPenugasan: p.tanggalPenugasan?.toISOString()
      })) : null
    };

    // Construct final response
    const trackingData = {
      // Basic info
      pengajuanId: pengajuan.id,
      nomorPengajuan: pengajuan.nomorPengajuan,
      jenisPengajuan: pengajuan.jenisPengajuan,
      
      // Current status
      currentStatus: {
        status: pengajuan.status,
        ...currentStatusConfig
      },
      
      // Progress
      progress: {
        percentage: Math.round(progressPercentage),
        currentStep: currentStepIndex !== -1 ? currentStepIndex + 1 : null,
        totalSteps: WORKFLOW_STEPS.length,
        currentStepKey
      },
      
      // Timeline
      timeline,
      
      // Workflow steps with status
      workflowSteps: workflowStepsWithStatus,
      
      // Dates
      dates: {
        created: pengajuan.createdAt.toISOString(),
        createdFormatted: pengajuan.createdAt.toLocaleString('id-ID'),
        submitted: pengajuan.tanggalPengajuan?.toISOString(),
        submittedFormatted: pengajuan.tanggalPengajuan?.toLocaleString('id-ID'),
        completed: pengajuan.tanggalSelesai?.toISOString(),
        completedFormatted: pengajuan.tanggalSelesai?.toLocaleString('id-ID'),
        lastUpdated: pengajuan.updatedAt.toISOString(),
        lastUpdatedFormatted: pengajuan.updatedAt.toLocaleString('id-ID')
      },
      
      // Duration metrics
      duration: durationMetrics,
      
      // Workflow details
      details: workflowDetails,
      
      // Applicant summary
      applicant: {
        namaLengkap: pengajuan.namaLengkap,
        nik: pengajuan.nik,
        profesi: pengajuan.profesi?.nama || pengajuan.jenisProfesi,
        puskesmas: pengajuan.puskesmas?.nama
      },

      // Status counts
      statusSummary: {
        totalChanges: pengajuan.statusHistory.length,
        terminalState: currentStatusConfig.isTerminal
      }
    };

    return NextResponse.json({
      success: true,
      data: trackingData,
      message: 'Tracking informasi berhasil diambil'
    });
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil informasi tracking',
        message: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
