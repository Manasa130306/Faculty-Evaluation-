'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { SERVICE_REGISTER_FACULTY } from '@/lib/constants/facultyData';
import { HISTORICAL_EVALUATIONS } from '@/lib/constants/historicalData';
import { EvaluationMarkChange, MonthlyEvaluation, EvaluationHeadMark } from '@/lib/types';
import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Ensure all 56 authoritative faculty records exist in Supabase database
 */
export async function ensureFacultySeededAction() {
  let sb;
  try {
    sb = createAdminClient();
  } catch (err: any) {
    return { success: false, message: err.message || 'Supabase admin client not configured' };
  }

  try {
    const recordsToInsert = SERVICE_REGISTER_FACULTY.map((f) => ({
      faculty_id: f.faculty_id.toUpperCase(),
      name: f.name,
      designation: f.designation,
      department: f.department,
    }));

    await sb.from('faculty').upsert(recordsToInsert, { onConflict: 'faculty_id' });
    return { success: true };
  } catch (err: any) {
    console.warn('Faculty seeding error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save head mark to Supabase database (Heads 1-8)
 */
export async function saveHeadMarkAction(
  facultyId: string,
  year: number,
  month: string,
  headNumber: number,
  marks: number | null,
  documentMetadata?: {
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    file_url?: string;
  },
  referenceInfo: string = '',
  isAdminUpdate: boolean = false
) {
  const cleanId = facultyId.trim().toUpperCase();
  let sb;
  try {
    sb = createAdminClient();
  } catch (err: any) {
    return { success: false, message: err.message || 'Supabase admin client not configured' };
  }

  try {
    // 1. Ensure faculty record exists
    const facultyInfo = SERVICE_REGISTER_FACULTY.find((f) => f.faculty_id.toUpperCase() === cleanId);
    await sb.from('faculty').upsert(
      {
        faculty_id: cleanId,
        name: facultyInfo?.name || cleanId,
        designation: facultyInfo?.designation || 'FACULTY',
        department: facultyInfo?.department || 'GENERAL',
      },
      { onConflict: 'faculty_id' }
    );

    // 2. Fetch or create evaluation
    const { data: existingEval } = await sb
      .from('evaluations')
      .select('*, evaluation_heads(*)')
      .eq('faculty_id', cleanId)
      .eq('year', year)
      .ilike('month', month)
      .maybeSingle();

    let evaluationId = existingEval?.id;

    if (!evaluationId) {
      const { data: newEval, error: evalErr } = await sb
        .from('evaluations')
        .insert({
          faculty_id: cleanId,
          year,
          month,
          status: 'Draft',
          total_marks: marks || 0,
        })
        .select()
        .single();

      if (evalErr) {
        // Try upsert on conflict
        const { data: upsertEval } = await sb
          .from('evaluations')
          .upsert(
            {
              faculty_id: cleanId,
              year,
              month,
              status: 'Draft',
              total_marks: marks || 0,
            },
            { onConflict: 'faculty_id,year,month' }
          )
          .select()
          .single();
        evaluationId = upsertEval?.id;
      } else {
        evaluationId = newEval?.id;
      }
    }

    if (!evaluationId) {
      throw new Error('Failed to resolve evaluation record in Supabase');
    }

    // 3. Upsert head mark
    const headPayload: any = {
      evaluation_id: evaluationId,
      head_number: headNumber,
      marks: marks !== null ? Number(marks) : null,
      updated_at: new Date().toISOString(),
    };

    if (documentMetadata?.file_path) headPayload.reference_document_path = documentMetadata.file_path;
    if (documentMetadata?.file_name) headPayload.reference_document_name = documentMetadata.file_name;
    if (documentMetadata?.file_size) headPayload.reference_document_size = documentMetadata.file_size;
    if (documentMetadata?.file_type) headPayload.reference_document_type = documentMetadata.file_type;
    if (referenceInfo) headPayload.reference_info = referenceInfo;

    await sb.from('evaluation_heads').upsert(headPayload, {
      onConflict: 'evaluation_id,head_number',
    });

    // 4. Calculate total marks across heads 1 to 8
    const { data: allHeads } = await sb
      .from('evaluation_heads')
      .select('head_number, marks')
      .eq('evaluation_id', evaluationId);

    let totalMarks = 0;
    if (allHeads && allHeads.length > 0) {
      totalMarks = allHeads.reduce((acc, h) => acc + (Number(h.marks) || 0), 0);
    }

    await sb
      .from('evaluations')
      .update({
        total_marks: totalMarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', evaluationId);

    revalidatePath('/faculty');
    revalidatePath('/admin/month-records');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      evaluationId,
      totalMarks,
    };
  } catch (err: any) {
    console.error('saveHeadMarkAction error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit faculty evaluation permanently to Supabase
 */
export async function submitEvaluationAction(facultyId: string, year: number, month: string) {
  const cleanId = facultyId.trim().toUpperCase();
  let sb;
  try {
    sb = createAdminClient();
  } catch (err: any) {
    return { success: false, message: err.message || 'Supabase admin client not configured' };
  }

  try {
    const now = new Date().toISOString();

    // 1. Ensure faculty record exists
    const facultyInfo = SERVICE_REGISTER_FACULTY.find((f) => f.faculty_id.toUpperCase() === cleanId);
    await sb.from('faculty').upsert(
      {
        faculty_id: cleanId,
        name: facultyInfo?.name || cleanId,
        designation: facultyInfo?.designation || 'FACULTY',
        department: facultyInfo?.department || 'GENERAL',
      },
      { onConflict: 'faculty_id' }
    );

    // 2. Fetch or create evaluation
    const { data: existingEval } = await sb
      .from('evaluations')
      .select('id, total_marks')
      .eq('faculty_id', cleanId)
      .eq('year', year)
      .ilike('month', month)
      .maybeSingle();

    if (existingEval) {
      await sb
        .from('evaluations')
        .update({
          status: 'Pending',
          submitted_at: now,
          updated_at: now,
        })
        .eq('id', existingEval.id);
    } else {
      await sb.from('evaluations').upsert(
        {
          faculty_id: cleanId,
          year,
          month,
          status: 'Pending',
          submitted_at: now,
          total_marks: 0,
          updated_at: now,
        },
        { onConflict: 'faculty_id,year,month' }
      );
    }

    revalidatePath('/faculty');
    revalidatePath('/admin/month-records');
    revalidatePath('/admin/dashboard');

    return { success: true, submittedAt: now };
  } catch (err: any) {
    console.error('submitEvaluationAction error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin modify H2-H8 marks with full immutable audit history
 */
export async function adminModifyHeadMarkAction(params: {
  facultyId: string;
  facultyName?: string;
  year: number;
  month: string;
  headNumber: number;
  revisedMarks: number;
  adminId: string;
  adminName?: string;
}) {
  const { facultyId, facultyName, year, month, headNumber, revisedMarks, adminId, adminName } = params;
  const cleanId = facultyId.trim().toUpperCase();
  let sb;
  try {
    sb = createAdminClient();
  } catch (err: any) {
    return { success: false, message: err.message || 'Supabase admin client not configured' };
  }

  try {
    const now = new Date().toISOString();

    // 1. Fetch current evaluation & head mark
    const { data: evalData } = await sb
      .from('evaluations')
      .select('id, faculty_id, year, month, total_marks, evaluation_heads(*)')
      .eq('faculty_id', cleanId)
      .eq('year', year)
      .ilike('month', month)
      .maybeSingle();

    let evaluationId = evalData?.id;

    if (!evaluationId) {
      // Ensure faculty exists
      const fInfo = SERVICE_REGISTER_FACULTY.find((f) => f.faculty_id.toUpperCase() === cleanId);
      await sb.from('faculty').upsert(
        {
          faculty_id: cleanId,
          name: facultyName || fInfo?.name || cleanId,
          designation: fInfo?.designation || 'FACULTY',
          department: fInfo?.department || 'GENERAL',
        },
        { onConflict: 'faculty_id' }
      );

      const { data: createdEval } = await sb
        .from('evaluations')
        .insert({
          faculty_id: cleanId,
          year,
          month,
          status: 'Submitted',
          total_marks: 0,
        })
        .select()
        .single();

      evaluationId = createdEval?.id;
    }

    const existingHead = evalData?.evaluation_heads?.find(
      (h: any) => Number(h.head_number) === Number(headNumber)
    );

    const originalMarks =
      existingHead?.original_faculty_marks !== null && existingHead?.original_faculty_marks !== undefined
        ? existingHead.original_faculty_marks
        : existingHead?.marks ?? null;

    const docName = existingHead?.reference_document_name || null;
    const docPath = existingHead?.reference_document_path || null;

    // 2. Insert into immutable audit table `evaluation_mark_changes`
    await sb.from('evaluation_mark_changes').insert({
      evaluation_id: evaluationId,
      faculty_id: cleanId,
      year,
      month,
      head_number: headNumber,
      original_marks: originalMarks,
      revised_marks: revisedMarks,
      changed_by_admin_id: adminId,
      changed_by_admin_name: adminName || 'IQAC Administrator',
      reference_document_name: docName,
      reference_document_path: docPath,
      changed_at: now,
    });

    // 3. Update evaluation_heads with new marks and admin-modified flags
    await sb.from('evaluation_heads').upsert(
      {
        evaluation_id: evaluationId,
        head_number: headNumber,
        marks: revisedMarks,
        original_faculty_marks: originalMarks,
        is_admin_modified: true,
        admin_modified_at: now,
        admin_modified_by: adminId,
        updated_at: now,
      },
      { onConflict: 'evaluation_id,head_number' }
    );

    // 4. Recalculate total marks for the evaluation
    const { data: allHeads } = await sb
      .from('evaluation_heads')
      .select('head_number, marks')
      .eq('evaluation_id', evaluationId);

    let calcTotal = 0;
    if (allHeads && allHeads.length > 0) {
      calcTotal = allHeads.reduce((acc: number, h: any) => acc + (Number(h.marks) || 0), 0);
    }

    await sb
      .from('evaluations')
      .update({
        total_marks: calcTotal,
        updated_at: now,
      })
      .eq('id', evaluationId);

    revalidatePath('/faculty');
    revalidatePath('/admin/month-records');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      originalMarks,
      revisedMarks,
      totalMarks: calcTotal,
      changedAt: now,
    };
  } catch (err: any) {
    console.error('adminModifyHeadMarkAction error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch modification audit changes for a faculty member or month
 */
export async function getEvaluationMarkChangesAction(
  facultyId?: string,
  year?: number,
  month?: string
): Promise<EvaluationMarkChange[]> {
  let sb;
  try {
    sb = createAdminClient();
  } catch (err: any) {
    return [];
  }

  try {
    let query = sb.from('evaluation_mark_changes').select('*').order('changed_at', { ascending: false });

    if (facultyId) {
      query = query.eq('faculty_id', facultyId.trim().toUpperCase());
    }
    if (year) {
      query = query.eq('year', year);
    }
    if (month) {
      query = query.ilike('month', month);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data as EvaluationMarkChange[];
    }
  } catch (err) {
    console.warn('getEvaluationMarkChangesAction error:', err);
  }
  return [];
}

/**
 * Finalize evaluation (Admin action)
 * Uploads all Supabase Storage files to Google Drive, updates DB, sets status to finalized
 */
export async function adminFinalizeEvaluationAction(facultyId: string, year: number, month: string) {
  const cleanId = facultyId.trim().toUpperCase();
  
  try {
    const { verifyAdminServerAction } = await import('@/lib/auth/admin-session');
    const adminSession = await verifyAdminServerAction();
    
    if (!adminSession.isValid || adminSession.role !== 'admin') {
      return { success: false, message: 'Unauthorized. Please login as Admin.' };
    }
    
    let sb;
    try {
      sb = createAdminClient();
    } catch (err: any) {
      return { success: false, message: err.message || 'Supabase admin client not configured' };
    }

    // 3. Fetch evaluation
    const { data: evalData } = await sb
      .from('evaluations')
      .select('id, status, evaluation_heads(*)')
      .eq('faculty_id', cleanId)
      .eq('year', year)
      .ilike('month', month)
      .maybeSingle();

    if (!evalData) {
      return { success: false, message: 'Evaluation not found.' };
    }

    // 4. Update status to Submitted
    const now = new Date().toISOString();
    const { error: updateError } = await sb
      .from('evaluations')
      .update({
        status: 'Complete',
        updated_at: now,
      })
      .eq('id', evalData.id);

    if (updateError) {
      throw new Error(`Failed to update evaluation status: ${updateError.message}`);
    }

    // 5. Fetch just this faculty's details and trigger Excel update
    const { data: facultyInfo } = await sb.from('profiles').select('faculty_id, name, department').eq('faculty_id', cleanId).maybeSingle();
    const { data: latestEval } = await sb
      .from('evaluations')
      .select('*, evaluation_heads(*)')
      .eq('id', evalData.id)
      .maybeSingle();

    if (facultyInfo && latestEval) {
      const headMarksRecord: any = {};
      if (Array.isArray(latestEval.evaluation_heads)) {
        latestEval.evaluation_heads.forEach((hm: any) => {
          headMarksRecord[hm.head_number] = hm;
        });
      }
      
      const singleEvalData = {
        id: latestEval.id,
        faculty_id: latestEval.faculty_id,
        year: latestEval.year,
        month: latestEval.month,
        status: latestEval.status?.toLowerCase() === 'complete' ? 'Complete' : latestEval.status,
        submitted_at: latestEval.submitted_at,
        total_marks: latestEval.total_marks || 0,
        head_marks: headMarksRecord,
      };

      const { updateMonthlyExcelAction } = await import('./drive');
      const excelRes = await updateMonthlyExcelAction(
        [facultyInfo],
        year,
        month,
        { [`${facultyInfo.faculty_id.toUpperCase()}_${year}_${month.toLowerCase()}`]: singleEvalData }
      );
      if (!excelRes.success) {
        throw new Error(`Failed to update Excel: ${excelRes.error}`);
      }
    }

    revalidatePath('/faculty');
    revalidatePath('/admin/month-records');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (err: any) {
    console.error('adminFinalizeEvaluationAction error:', err);
    return { success: false, error: err.message };
  }
}
