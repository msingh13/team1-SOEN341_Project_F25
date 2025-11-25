// src/pages/admin/WaitlistPolicyPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";

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

const WaitlistPolicyPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [policy, setPolicy] = useState<WaitlistPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySubmitting, setPolicySubmitting] = useState(false);

  const [audit, setAudit] = useState<WaitlistAuditResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    pageSize: 10,
  });

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const p = await fetchWaitlistPolicy();
      setPolicy(p);
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
        });

        setAudit(resp);
        setFilters((prev) => ({
          ...prev,
          page: resp.page,
        }));
      } finally {
        setAuditLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (isAdmin) loadPolicy();
  }, [isAdmin, loadPolicy]);

  useEffect(() => {
    if (isAdmin) loadAudit();
  }, [
    isAdmin,
    filters.from,
    filters.to,
    filters.eventId,
    filters.orgId,
    filters.userId,
  ]);

  async function handlePolicySubmit(data: {
    maxSize: number | null;
    autoPromote: boolean;
    enabled: boolean;
  }) {
    setPolicySubmitting(true);
    try {
      const updated = await updateWaitlistPolicy(data);
      setPolicy(updated);
      await loadAudit({ page: 1 });
    } finally {
      setPolicySubmitting(false);
    }
  }

  if (!isAdmin)
    return (
      <div className="container" style={{ padding: 32 }}>
        <div className="card" style={{ padding: 24, borderColor: "#a33" }}>
          <h1 className="h2" style={{ marginTop: 0 }}>
            Access Denied
          </h1>
          <p className="muted">Admins only.</p>
        </div>
      </div>
    );

  return (
    <div className="container" style={{ padding: 32, maxWidth: 1100 }}>
      {/* HEADER */}
      <header
        className="card-header"
        style={{
          marginBottom: 18,
          paddingBottom: 8,
        }}
      >
        <div>
          <h1 className="h2" style={{ marginBottom: 4 }}>
            Waitlist Policy & Audit
          </h1>
          <p className="muted">
            Configure global waitlist defaults and review historical policy
            changes.
          </p>
        </div>
      </header>

      {/* POLICY CARD */}
      <section
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          borderRadius: 12,
        }}
      >
        <h2 className="h3" style={{ marginTop: 0, marginBottom: 12 }}>
          Waitlist Policy
        </h2>

        {policyLoading ? (
          <div className="muted">Loading policy…</div>
        ) : (
          <WaitlistPolicyForm
            initialPolicy={policy}
            onSubmit={handlePolicySubmit}
            submitting={policySubmitting}
          />
        )}
      </section>

      {/* AUDIT CARD */}
      <section
        className="card"
        style={{
          padding: 20,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 className="h3" style={{ margin: 0 }}>
            Audit Log
          </h2>

          <span className="muted" style={{ fontSize: 12 }}>
            Records every change made to the global waitlist settings.
          </span>
        </div>

        <WaitlistAuditTable
          items={audit?.items ?? []}
          page={audit?.page ?? filters.page ?? 1}
          pageSize={audit?.pageSize ?? filters.pageSize ?? 10}
          total={audit?.total ?? 0}
          loading={auditLoading}
          filters={filters}
          onFiltersChange={setFilters}
          onPageChange={(p) =>
            setFilters((prev) => ({
              ...prev,
              page: p,
            }))
          }
          buildEventLink={(id) => `/events/${id}`}
          buildUserLink={(id) => `/admin/users/${id}`}
        />
      </section>
    </div>
  );
};

export default WaitlistPolicyPage;
