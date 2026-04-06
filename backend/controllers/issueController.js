const Issue = require('../models/Issue');
const Item = require('../models/Item');

// GET /api/issues — List all issues (optionally filter by active/returned)
exports.getAll = async (req, res, next) => {
  try {
    const { status, item, employee } = req.query;
    const filter = {};

    if (status === 'active') filter.return_date = null;
    if (status === 'returned') filter.return_date = { $ne: null };
    if (item) filter['items.item'] = item;
    if (employee) filter.employee = employee;

    const issues = await Issue.find(filter)
      .populate('items.item', 'sap_id title location quantity')
      .populate('employee', 'p_no name phone job_location')
      .sort({ issue_date: -1 });

    res.json(issues);
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/active — Currently issued items (shortcut)
exports.getActive = async (_req, res, next) => {
  try {
    const issues = await Issue.find({ return_date: null })
      .populate('items.item', 'sap_id title location quantity')
      .populate('employee', 'p_no name phone job_location')
      .sort({ issue_date: -1 });

    res.json(issues);
  } catch (err) {
    next(err);
  }
};

// GET /api/issues/:id — Get single issue
exports.getById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('items.item')
      .populate('employee');

    if (!issue) return res.status(404).json({ error: 'Issue record not found' });
    res.json(issue);
  } catch (err) {
    next(err);
  }
};

// POST /api/issues — Issue items to an employee
// Body: { items: [{ item: <itemId>, quantity: <n> }, ...], employee, issuer_p_no, issue_date? }
exports.create = async (req, res, next) => {
  try {
    const { items, employee, issue_date, issuer_p_no } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Validate stock for each item
    for (const entry of items) {
      const itemDoc = await Item.findById(entry.item);
      if (!itemDoc) {
        return res.status(404).json({ error: `Item ${entry.item} not found` });
      }
      if (itemDoc.quantity < entry.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${itemDoc.title}" (SAP: ${itemDoc.sap_id}). Available: ${itemDoc.quantity}, Requested: ${entry.quantity}`,
        });
      }
    }

    // Decrement quantity for each item
    for (const entry of items) {
      await Item.findByIdAndUpdate(entry.item, {
        $inc: { quantity: -entry.quantity },
      });
    }

    const issue = await Issue.create({
      items: items.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        returned_quantity: 0,
      })),
      employee,
      issue_date: issue_date || Date.now(),
      issuer_p_no,
    });

    const populated = await issue.populate([
      { path: 'items.item', select: 'sap_id title location quantity' },
      { path: 'employee', select: 'p_no name phone' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// PUT /api/issues/:id/return — Return items
// Body: { returns: [{ item: <itemId>, quantity: <n> }] }
// If no body, returns ALL remaining items
exports.returnItem = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue record not found' });

    if (issue.return_date) {
      return res.status(400).json({ error: 'All items have already been returned' });
    }

    const returns = req.body.returns;

    if (returns && returns.length) {
      // Partial return — return specific items/quantities
      for (const ret of returns) {
        const issueItem = issue.items.find(
          (i) => i.item.toString() === ret.item
        );
        if (!issueItem) {
          return res
            .status(400)
            .json({ error: `Item ${ret.item} is not part of this issue` });
        }

        const remaining = issueItem.quantity - issueItem.returned_quantity;
        if (ret.quantity > remaining) {
          return res.status(400).json({
            error: `Cannot return ${ret.quantity} of item ${ret.item}. Only ${remaining} remaining.`,
          });
        }

        issueItem.returned_quantity += ret.quantity;

        // Increment item stock back
        await Item.findByIdAndUpdate(ret.item, {
          $inc: { quantity: ret.quantity },
        });
      }
    } else {
      // Full return — return everything remaining
      for (const issueItem of issue.items) {
        const remaining = issueItem.quantity - issueItem.returned_quantity;
        if (remaining > 0) {
          issueItem.returned_quantity = issueItem.quantity;
          await Item.findByIdAndUpdate(issueItem.item, {
            $inc: { quantity: remaining },
          });
        }
      }
    }

    // Check if fully returned → set return_date
    const fullyReturned = issue.items.every(
      (i) => i.returned_quantity >= i.quantity
    );
    if (fullyReturned) {
      issue.return_date = req.body.return_date || Date.now();
    }

    await issue.save();

    const populated = await issue.populate([
      { path: 'items.item', select: 'sap_id title location quantity' },
      { path: 'employee', select: 'p_no name phone' },
    ]);

    res.json({
      message: fullyReturned
        ? 'All items returned successfully'
        : 'Partial return recorded',
      issue: populated,
    });
  } catch (err) {
    next(err);
  }
};
