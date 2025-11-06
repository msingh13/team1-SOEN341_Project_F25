// src/client/src/api/adminOrgs.ts
import { http } from "../lib/api";

export type Role = "admin" | "organizer" | "member";

export type Org = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  members?: { user_id: number; role: Role }[];
};

export type OrgCreate = { name: string; description?: string };
export type OrgUpdate = Partial<OrgCreate>;

/**
 * IMPORTANT: all admin org routes are under /api/admin/...
 * If you still get a 500, open your server logs; a 404 here usually means
 * the path was wrong. With these paths it should line up with the server.
 */

export async function listOrgs(): Promise<Org[]> {
  return http("GET", `/api/admin/orgs`);
}
export async function getOrg(id: number): Promise<Org> {
  return http("GET", `/api/admin/orgs/${id}`);
}
export async function createOrg(body: OrgCreate): Promise<Org> {
  return http("POST", `/api/admin/orgs`, body);
}
export async function updateOrg(id: number, body: OrgUpdate): Promise<Org> {
  return http("PUT", `/api/admin/orgs/${id}`, body);
}
export async function deleteOrg(id: number): Promise<{ ok: true }> {
  return http("DELETE", `/api/admin/orgs/${id}`);
}

export async function assignRole(orgId: number, user_id: number, role: Role): Promise<Org> {
  return http("POST", `/api/admin/orgs/${orgId}/roles`, { user_id, role });
}
export async function removeRole(orgId: number, userId: number): Promise<Org> {
  return http("DELETE", `/api/admin/orgs/${orgId}/roles/${userId}`);
}
