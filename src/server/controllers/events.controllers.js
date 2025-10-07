const Events = require("../db/queries/events");

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
