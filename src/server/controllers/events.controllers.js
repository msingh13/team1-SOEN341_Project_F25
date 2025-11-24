// src/server/controllers/events.controllers.js
const Events = require("../db/queries/events");

// --- helper to send 400 errors ---
function bad(res, message, details) {
  return res.status(400).json({
    code: "BAD_REQUEST",
    message,
    ...(details ? { details } : {}),
  });
}

// --- small helpers ---
function parsePositiveInt(v, def) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function isIsoDate(s) {
  return typeof s === "string" && !Number.isNaN(Date.parse(s));
}

/**
 * GET /events
 * Main event listing
 */
exports.list = async (req, res) => {
  try {
    /* ----------------------------------
     * Pagination
     * ---------------------------------- */
    const page = Math.max(
      1,
      parsePositiveInt(req.query.page || "1", 1)
    );

    const perPage = Math.min(
      50,
      Math.max(1, parsePositiveInt(req.query.perPage || req.query.limit || "12", 12))
    );

    const offset = (page - 1) * perPage;

    /* ----------------------------------
     * Filters
     * ---------------------------------- */
    const q = (req.query.q || "").trim() || null;

    const categories = req.query.category
      ? String(req.query.category)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const org = req.query.org ? Number(req.query.org) : null;
    if (req.query.org && !Number.isFinite(org)) {
      return bad(res, "org must be a number");
    }

    const dateFrom = req.query.dateFrom ? String(req.query.dateFrom) : null;
    const dateTo = req.query.dateTo ? String(req.query.dateTo) : null;

    if (dateFrom && !isIsoDate(dateFrom)) {
      return bad(
        res,
        "dateFrom must be an ISO date string (YYYY-MM-DD or ISO datetime)"
      );
    }
    if (dateTo && !isIsoDate(dateTo)) {
      return bad(
        res,
        "dateTo must be an ISO date string (YYYY-MM-DD or ISO datetime)"
      );
    }
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      return bad(res, "`dateFrom` must be <= `dateTo`");
    }

    /* ----------------------------------
     * Sorting
     * ---------------------------------- */
    const allowedSort = new Set([
      "start_asc",
      "start_desc",
      "created_desc",
    ]);
    const sort = allowedSort.has(req.query.sort)
      ? req.query.sort
      : "start_asc";

    /* ----------------------------------
     * Query DB
     * ---------------------------------- */
    const [data, total] = await Promise.all([
      Events.getEvents({
        q,
        categories,
        org,
        dateFrom,
        dateTo,
        sort,
        limit: perPage,
        offset,
      }),
      Events.countPublished({
        q,
        categories,
        org,
        dateFrom,
        dateTo,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    /* ----------------------------------
     * Final Response
     * ---------------------------------- */
    return res.json({
      data,
      page,
      perPage,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("❌ Failed to list events:", err);
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Failed to list events",
      details: err.message,
    });
  }
};
