import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// Create Supabase admin client with service role key
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, businessId } = body;

    // Validate required fields
    if (!studentId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the student belongs to the business (security check)
    const { data: student, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, business_id')
      .eq('id', studentId)
      .eq('business_id', businessId)
      .single();

    if (verifyError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Delete from auth system first
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      studentId
    );

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user from authentication system' },
        { status: 500 }
      );
    }

    // Delete from users table (this should cascade to packages and attendance)
    const { error: dbDeleteError } = await (supabaseAdmin
      .from('users') as any)
      .delete()
      .eq('id', studentId)
      .eq('business_id', businessId);

    if (dbDeleteError) {
      console.error('Error deleting user from database:', dbDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in delete-student API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
