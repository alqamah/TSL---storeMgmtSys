const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    sap_id: {
      type: String,
      required: [true, 'SAP ID is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    certificate_no: {
      type: String,
      trim: true,
      default: '',
    },
    make: {
      type: String,
      trim: true,
      default: '',
    },
    parent: {
      type: String,
      trim: true,
      default: '',
    },
    prev_due_date: {
      type: Date,
      default: null,
    },
    next_due_date: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: String,
      trim: true,
      default: '',
    },
    umc: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for common queries
itemSchema.index({ title: 'text', sap_id: 'text' });

module.exports = mongoose.model('Item', itemSchema);
