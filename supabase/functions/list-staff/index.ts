import {
  errorResponse,
  getRequestCors,
  HttpError,
  jsonResponse,
  requireAdmin,
} from '../_shared/staff-auth.ts';

const STAFF_ROLES = ['admin', 'approver', 'loan_officer'] as const;

Deno.serve(async (req) => {
  const cors = getRequestCors(req);
  if (!cors) {
    return jsonResponse({ error: 'Origin is not allowed.' }, 403, {});
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors.headers });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, cors.headers);
  }

  try {
    const { adminClient } = await requireAdmin(req);
    const { data: roleRows, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id, role')
      .in('role', [...STAFF_ROLES]);

    if (rolesError) {
      console.error('Staff roles could not be loaded:', rolesError.message);
      throw new HttpError(500, 'The staff directory could not be loaded.');
    }

    if (!roleRows?.length) {
      return jsonResponse({ staff: [] }, 200, cors.headers);
    }

    const users = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('Auth users could not be loaded:', error.message);
        throw new HttpError(500, 'The staff directory could not be loaded.');
      }

      users.push(...data.users);
      if (data.users.length < perPage) break;
      page += 1;
    }

    const usersById = new Map(users.map((user) => [user.id, user]));
    const staff = roleRows.flatMap((roleRow) => {
      const account = usersById.get(roleRow.user_id);
      if (!account) return [];

      const status = account.email_confirmed_at
        ? 'active'
        : account.invited_at
          ? 'invited'
          : 'pending';

      return [{
        id: `${account.id}:${roleRow.role}`,
        email: account.email || '',
        role: roleRow.role,
        status,
        created_at: account.created_at || null,
        invited_at: account.invited_at || null,
        email_confirmed_at: account.email_confirmed_at || null,
        last_sign_in_at: account.last_sign_in_at || null,
      }];
    }).sort((a, b) => {
      const aTime = a.created_at ? Date.parse(a.created_at) : 0;
      const bTime = b.created_at ? Date.parse(b.created_at) : 0;
      return bTime - aTime;
    });

    return jsonResponse({ staff }, 200, cors.headers);
  } catch (error) {
    return errorResponse(error, cors.headers);
  }
});
