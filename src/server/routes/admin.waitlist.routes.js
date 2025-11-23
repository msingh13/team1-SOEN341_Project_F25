// server/routes/admin.waitlist.routes.js
const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/auth");

const {
  getGlobalWaitlistPolicy,
  upsertGlobalWaitlistPolicy,
  queryWaitlistAudit,
} = require("../waitlistPolicy.repo");

// All routes in this file: admin-only
router.use(authenticateToken, requireAdmin);

/**
 * POST /admin/waitlist/policy
 * Body: { maxSize?: number | null, autoPromote: boolean, enabled: boolean }
 * Effect: updates global waitlist policy and writes audit record.
 */
router.post("/policy", async (req, res) => {
  try {
    const { maxSize, autoPromote, enabled } = req.body || {};

    if (typeof autoPromote !== "boolean" || typeof enabled !== "boolean") {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "autoPromote and enabled are required boolean fields.",
      });
    }

    let parsedMax = null;
    if (maxSize !== undefined && maxSize !== null && maxSize !== "") {
      const n = Number(maxSize);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({
          code: "BAD_REQUEST",
          message: "maxSize must be a positive number or null.",
        });
      }
      parsedMax = n;
    }

    const adminId = req.user?.id || null;

    const newPolicy = await upsertGlobalWaitlistPolicy(
      {
        maxSize: parsedMax,
        autoPromote,
        enabled,
      },
      adminId
    );

    return res.status(200).json({
      message: "Waitlist policy updated successfully.",
      policy: newPolicy,
    });
  } catch (err) {
    console.error("Error updating waitlist policy", err);
    return res
      .status(500)
      .json({ code: "INTERNAL", message: "Failed to update waitlist policy." });
  }
});

/**
 * GET /admin/waitlist/policy
 * Optional helper to fetch current policy (for admin UI).
 */
router.get("/policy", async (_req, res) => {
  try {
    const policy = await getGlobalWaitlistPolicy();
    return res.status(200).json({ policy });
  } catch (err) {
    console.error("Error fetching waitlist policy", err);
    return res
      .status(500)
      .json({ code: "INTERNAL", message: "Failed to fetch waitlist policy." });
  }
});

/**
 * GET /admin/waitlist/audit
 * Query params:
 *   adminId?: number
 *   from?: ISO date
 *   to?: ISO date
 *   page?: number
 *   pageSize?: number
 */
router.get("/audit", async (req, res) => {
  try {
    const { adminId, from, to, page, pageSize } = req.query;

    const result = await queryWaitlistAudit({
      adminId: adminId ? Number(adminId) : undefined,
      from: from || undefined,
      to: to || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error querying waitlist audit", err);
    return res
      .status(500)
      .json({ code: "INTERNAL", message: "Failed to fetch waitlist audit." });
  }
});

module.exports = router;
