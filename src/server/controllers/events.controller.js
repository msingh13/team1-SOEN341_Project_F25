const Events = require("../db/queries/events");
const Tickets = require("../db/queries/tickets");
const { withTransaction } = require("../db/tx");

exports.list = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Events.getEvents(limit, offset),
      Events.countPublished()
    ]);

    res.json({ data, page, limit, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Something went wrong" });
  }
};

exports.claimTicket = async (req, res) => {
  const eventId = Number(req.params.id);
  const userId = Number(req.header("x-user-id"));
  if (!Number.isInteger(eventId)) return res.status(400).json({ code:"BAD_EVENT_ID", message:"Event id must be an integer" });
  if (!Number.isInteger(userId))  return res.status(401).json({ code:"UNAUTHORIZED", message:"Missing or invalid x-user-id" });

  try {
    const { ticketId, qrToken } = await withTransaction((client) =>
      Tickets.claimTicketTx(client, { eventId, userId })
    );
    return res.status(201).json({ ticketId, eventId, qrToken });
  } catch (err) {
    if (err.code === "NOT_FOUND")      return res.status(404).json({ code:"NOT_FOUND", message:"Event not found" });
    if (err.code === "NOT_PUBLISHED")  return res.status(400).json({ code:"NOT_PUBLISHED", message:"Event is not published" });
    if (err.code === "SOLD_OUT")       return res.status(400).json({ code:"SOLD_OUT", message:"Event is sold out" });
    if (err.code === "ALREADY_CLAIMED")return res.status(400).json({ code:"ALREADY_CLAIMED", message:"User already claimed a ticket" });
    console.error("claimTicket unexpected error:", err);
    return res.status(500).json({ code:"INTERNAL_ERROR", message:"Something went wrong" });
  }
};


// --- Ticket claim handler ---
const { claimTicketTx } = require('../db/queries/tickets');

function getUserId(req) {
  const id = req.header('x-user-id');
  return id ? parseInt(id, 10) : null;
}

exports.claimTicket = async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = parseInt(req.params.id, 10);

    if (!userId || Number.isNaN(eventId)) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Missing user or event id' });
    }

    const result = await claimTicketTx(eventId, userId);

    if (result.error) {
      const { status = 400, code, message } = result.error;
      return res.status(status).json({ code, message });
    }

    return res.status(201).json({
      id: result.ticket.id,
      qr_token: result.ticket.qr_token,
      created_at: result.ticket.created_at,
      event_id: eventId,
      user_id: userId,
    });
  } catch (err) {
    console.error('claimTicket error', err);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Unexpected error' });
  }
};
