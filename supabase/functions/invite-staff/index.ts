import { z } from 'npm:zod@3.25.76';
import {
  errorResponse,
  getRequestCors,
  HttpError,
  jsonResponse,
  requireAdmin,
} from '../_shared/staff-auth.ts';

const InviteSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  role: z.enum(['admin', 'approver', 'loan_officer']),
});

function isDuplicateAccount(error: { message?: string; code?: string; status?: number }): boolean {
  const code = error.code?.toLowerCase() || '';
  const message = error.message?.toLowerCase() || '';
  return code === 'email_exists' ||
    code === 'user_already_exists' ||
    error.status === 422 ||
    message.includes('already registered') ||
    message.includes('already exists');
}

Deno.serve(async (req) => {
  const cors = getRequestCors(req);
  if (!cors) {
    return jsonResponse({ error: 'Origin is not allowed.' }, 403, {});
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors.headers });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, cors.headers);
  }

  try {
    const { adminClient } = await requireAdmin(req);
    const parsed = InviteSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonResponse(
        { error: 'Enter a valid email and choose Admin, Approver, or Loan Officer.' },
        400,
        cors.headers,
      );
    }

    if (!cors.origin) {
      throw new HttpError(400, 'An allowed application origin is required for invitations.');
    }

    const { email, role } = parsed.data;
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${cors.origin}/login` },
    );

    if (inviteError) {
      if (isDuplicateAccount(inviteError)) {
        return jsonResponse(
          { error: 'An account with this email already exists. No invitation or role change was made.' },
          409,
          cors.headers,
        );
      }

      console.error('Staff invitation failed:', inviteError.message);
      throw new HttpError(500, 'The staff invitation could not be created.');
    }

    const invitedUser = inviteData.user;
    if (!invitedUser) {
      throw new HttpError(500, 'The invitation did not return an account.');
    }

    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: invitedUser.id, role });

    if (roleError) {
      console.error('Staff role assignment failed:', roleError.message);
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(invitedUser.id);

      if (cleanupError) {
        console.error('Incomplete invited account cleanup failed:', cleanupError.message);
        throw new HttpError(
          500,
          'Role assignment failed and the incomplete account could not be removed automatically. No staff access was granted.',
        );
      }

      throw new HttpError(500, 'Role assignment failed. The incomplete invitation was removed safely.');
    }

    return jsonResponse(
      {
        success: true,
        staff: {
          email: invitedUser.email || email,
          role,
          status: 'invited',
          invited_at: invitedUser.invited_at || null,
        },
      },
      201,
      cors.headers,
    );
  } catch (error) {
    return errorResponse(error, cors.headers);
  }
});
