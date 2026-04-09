const Log = require('../models/Log');

// GET /api/logs — Get all logs (Admin only)
exports.getAllLogs = async (req, res, next) => {
  try {
    const logs = await Log.find()
      .populate('user', 'name p_no role')
      .sort({ createdAt: -1 })
      .lean();

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
