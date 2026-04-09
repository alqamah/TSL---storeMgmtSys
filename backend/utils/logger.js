const Log = require('../models/Log');

/**
 * Helper to log user actions asynchronously.
 * Designed to not fail the main API flow if logging fails.
 */
exports.logAction = async (user, action, target_type, target_id, details = {}) => {
  try {
    if (!user || !user.id) return;
    
    await Log.create({
      user: user.id,
      action,
      target_type,
      target_id,
      details,
    });
  } catch (err) {
    console.error(`[LOGGER ERROR] Failed to log action ${action}:`, err);
  }
};
