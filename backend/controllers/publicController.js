const Item = require('../models/Item');

// Fields considered safe to expose to unauthenticated external users.
const PUBLIC_FIELDS =
  'title quantity umc description category location capacity make updatedAt';

// GET /api/public/items — Public catalogue listing
exports.listItems = async (req, res, next) => {
  try {
    const items = await Item.find({})
      .select(PUBLIC_FIELDS)
      .sort({ title: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/public/items/:id — Public single item detail
exports.getItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).select(PUBLIC_FIELDS);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};
