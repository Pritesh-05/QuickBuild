import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  isAdmin: boolean;
  buildCount: number;
}

interface AdminListUsersRow {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
  build_count: number | string;
}

/** Admin-only: every signed-up user, their admin flag, and saved-build
 * count. Backed by the admin_list_users() RPC (see
 * supabase/schema-admin-users.sql) — it re-checks admin status itself
 * server-side, so this errors for a non-admin caller even if this function
 * were somehow reached without the route guard. */
export const adminListUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminUserRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) throw new Error(error.message);

    return ((data ?? []) as AdminListUsersRow[]).map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at,
      isAdmin: row.is_admin,
      buildCount: Number(row.build_count),
    }));
  },
);

const setRoleSchema = z.object({
  email: z.string().email(),
  makeAdmin: z.boolean(),
});

/** Admin-only: grant or revoke admin access by email. The RPC refuses to
 * let an admin remove their own access, so there's always someone left who
 * can manage the catalog. */
export const adminSetUserRole = createServerFn({ method: "POST" })
  .validator(setRoleSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_admin", {
      target_email: data.email,
      make_admin: data.makeAdmin,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Admin-only: permanently deletes a user's account (and, via cascade,
 * their saved builds). Backed by the admin_delete_user() RPC (see
 * supabase/schema-admin-delete-user.sql), which also refuses to let an
 * admin delete themselves. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.rpc("admin_delete_user", {
      target_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });