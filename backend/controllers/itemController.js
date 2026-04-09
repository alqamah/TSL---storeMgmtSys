const Item = require('../models/Item');
const { logAction } = require('../utils/logger');

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
    await logAction(req.user, 'CREATE_ITEM', 'Item', item._id, { sap_id: item.sap_id, title: item.title });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// POST /api/items/bulk — Bulk Create items
exports.bulkCreate = async (req, res, next) => {
  try {
    const items = req.body.items || [];
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Expected an array of items' });
    }

    let inserted = 0;
    let updated = 0;
    let failedValidation = 0;
    const errorsObject = [];

    for (let i = 0; i < items.length; i++) {
        const itemData = items[i];
        
        // Skip if critical missing data before DB hit
        if (!itemData.sap_id) {
            failedValidation++;
            errorsObject.push({ row: i+1, sap_id: 'MISSING', msg: 'SAP ID is required' });
            continue;
        }

        // Date validation: next_due_date > prev_due_date
        if (itemData.prev_due_date && itemData.next_due_date) {
            const prev = new Date(itemData.prev_due_date);
            const next = new Date(itemData.next_due_date);
            if (!isNaN(prev) && !isNaN(next) && next <= prev) {
                delete itemData.prev_due_date;
                delete itemData.next_due_date;
                failedValidation++;
                errorsObject.push({ row: i+1, sap_id: itemData.sap_id, msg: 'Next Due Date must be after Previous Due Date. Item updated without modifying dates.' });
            }
        }

        try {
            const sapIdStr = String(itemData.sap_id).trim();
            const existing = await Item.findOne({ sap_id: sapIdStr });
            if (existing) {
                await Item.findByIdAndUpdate(existing._id, itemData, { runValidators: true });
                updated++;
            } else {
                await Item.create(itemData);
                inserted++;
            }
        } catch (err) {
            if (err.name === 'ValidationError') {
                failedValidation++;
                errorsObject.push({ row: i+1, sap_id: itemData.sap_id, msg: err.message });
            } else if (err.code === 11000) {
                failedValidation++;
                errorsObject.push({ row: i+1, sap_id: itemData.sap_id, msg: 'Duplicate SAP ID' });
            } else {
                failedValidation++;
                errorsObject.push({ row: i+1, sap_id: itemData.sap_id, msg: err.message });
            }
        }
    }

    const errorMsg = failedValidation > 0 
      ? ` ${failedValidation} rows had validation issues (see logs/details).` 
      : '';
    const summary = `Successfully inserted ${inserted} items. Updated ${updated} items.` + errorMsg;
    
    // Return 200 consistently, let the frontend read the message
    await logAction(req.user, 'BULK_CREATE_ITEMS', 'Item', 'BULK', { inserted, updated, failedValidation });
    
    res.status(200).json({
        message: summary,
        stats: { inserted, updated, failedValidation },
        errors: errorsObject
    });
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
    
    await logAction(req.user, 'UPDATE_ITEM', 'Item', item._id, { sap_id: item.sap_id });
    
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
    
    await logAction(req.user, 'DELETE_ITEM', 'Item', item._id, { sap_id: item.sap_id, title: item.title });
    
    res.json({ message: 'Item deleted', item });
  } catch (err) {
    next(err);
  }
};
