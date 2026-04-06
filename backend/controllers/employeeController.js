const Employee = require('../models/Employee');

// GET /api/employees — List all employees (with optional search)
exports.getAll = async (req, res, next) => {
  try {
    const { search, job_location } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { p_no: { $regex: search, $options: 'i' } },
      ];
    }
    if (job_location) filter.job_location = { $regex: job_location, $options: 'i' };

    const employees = await Employee.find(filter).sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/:id — Get single employee
exports.getById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// POST /api/employees — Create employee
exports.create = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

// PUT /api/employees/:id — Update employee
exports.update = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/employees/:id — Delete employee
exports.remove = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted', employee });
  } catch (err) {
    next(err);
  }
};
