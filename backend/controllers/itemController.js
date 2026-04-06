const Item = require('../models/Item');

// GET /api/items — List all items (with optional search)
exports.getAll = async (req, res, next) => {
  try {
    const { search, location, owner } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sap_id: { $regex: search, $options: 'i' } },
      ];
    }
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (owner) filter.owner = { $regex: owner, $options: 'i' };

    const items = await Item.find(filter).sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/items/:id — Get single item
exports.getById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// POST /api/items — Create item
exports.create = async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// PUT /api/items/:id — Update item
exports.update = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/items/:id — Delete item
exports.remove = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted', item });
  } catch (err) {
    next(err);
  }
};
