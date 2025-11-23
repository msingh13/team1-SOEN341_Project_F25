// src/pages/admin/WaitlistPolicyPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import WaitlistPolicyForm from "../components/WaitlistPolicyForm";
import WaitlistAuditTable from "../components/WaitlistAuditTable";
import {
  fetchWaitlistPolicy,
  updateWaitlistPolicy,
  fetchWaitlistAudit,
  type WaitlistPolicy,
  type WaitlistAuditResponse,
  type AuditFilters,
} from "../lib/adminWaitlistPolicy.api";

// TODO: hook this into your real auth context
type Role = "student" | "organizer" | "admin";

const WaitlistPolicyPage: React.FC = () => {
  const userRole: Role = "admin"; // replace with actual role from your auth
  const isAdmin = userRole === "admin";

  const [policy, setPolicy] = useState<WaitlistPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState<boolean>(false);
  const [policySubmitting, setPolicySubmitting] = useState<boolean>(false);

  const [audit, setAudit] = useState<WaitlistAuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    pageSize: 10,
  });

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const p = await fetchWaitlistPolicy();
      setPolicy(p);
    } catch (err) {
      console.error("Failed to fetch waitlist policy", err);
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  const loadAudit = useCallback(
    async (opts?: { page?: number }) => {
      setAuditLoading(true);
      try {
        const resp = await fetchWaitlistAudit({
          ...filters,
          page: opts?.page ?? filters.page ?? 1,
          pageSize: filters.pageSize ?? 10,
        });
        setAudit(resp);
        setFilters((prev) => ({
          ...prev,
          page: resp.page,
          pageSize: resp.pageSize,
        }));
      } catch (err) {
        console.error("Failed to fetch waitlist audit", err);
      } finally {
        setAuditLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (!isAdmin) return;
    void loadPolicy();
  }, [isAdmin, loadPolicy]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filters.from, filters.to, filters.eventId, filters.orgId, filters.userId]);

  const handlePolicySubmit = async (data: {
    maxSize: number | null;
    autoPromote: boolean;
    enabled: boolean;
  }) => {
    setPolicySubmitting(true);
    try {
      const updated = await updateWaitlistPolicy(data);
      setPolicy(updated);
      // refresh audit so admin sees latest change logged
      await loadAudit({ page: 1 });
    } finally {
      setPolicySubmitting(false);
    }
  };

  const handleFiltersChange = (next: AuditFilters) => {
    setFilters(next);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const buildEventLink = (eventId: number) => `/events/${eventId}`;
  const buildUserLink = (userId: number) => `/admin/users/${userId}`;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-4xl p-4 text-sm text-red-300">
        <h1 className="mb-2 text-lg font-semibold">Access denied</h1>
        <p>You must be an admin to view the waitlist policy and audit logs.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Waitlist Policy &amp; Audit</h1>
        <p className="text-sm text-slate-400">
          Manage global waitlist defaults and review audit history for policy
          changes.
        </p>
      </header>

      {policyLoading ? (
        <div className="rounded-lg border border-slate-700 bg-[#121212] p-4 text-sm text-slate-400">
          Loading current policy…
        </div>
      ) : (
        <WaitlistPolicyForm
          initialPolicy={policy}
          onSubmit={handlePolicySubmit}
          submitting={policySubmitting}
        />
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Audit</h2>
          <span className="text-[11px] text-slate-500">
            Showing changes to the global waitlist policy.
          </span>
        </div>

        <WaitlistAuditTable
          items={audit?.items ?? []}
          page={audit?.page ?? filters.page ?? 1}
          pageSize={audit?.pageSize ?? filters.pageSize ?? 10}
          total={audit?.total ?? 0}
          loading={auditLoading}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onPageChange={handlePageChange}
          buildEventLink={buildEventLink}
          buildUserLink={buildUserLink}
        />
      </section>
    </div>
  );
};

export default WaitlistPolicyPage;
