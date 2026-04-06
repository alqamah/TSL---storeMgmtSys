const mongoose = require('mongoose');
const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    p_no: {
      type: String,
      required: [true, 'P.No is required'],
      unique: true,
      trim: true,
      match: [/^[A-Za-z0-9]{6}$/, 'P.No must be exactly 6 alphanumeric characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Phone must be exactly 10 digits'],
    },
    vendor_supervisor_name: {
      type: String,
      trim: true,
      default: '',
    },
    vendor_supervisor_gatepass_no: {
      type: String,
      trim: true,
      default: '',
    },
    job_location: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching employees by name or p_no
employeeSchema.index({ name: 'text', p_no: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
