const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for each item in the issue
const issueItemSchema = new Schema(
  {
    item: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    returned_quantity: {
      type: Number,
      default: 0,
      min: [0, 'Returned quantity cannot be negative'],
    },
  },
  { _id: false }
);

const issueSchema = new Schema(
  {
    items: {
      type: [issueItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one item is required',
      },
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    issue_date: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    return_date: {
      type: Date,
      default: null, // null means at least some items still issued
    },
    issuer_p_no: {
      type: String,
      required: [true, 'Issuer P.No is required'],
      match: [/^[A-Za-z0-9]{6}$/, 'Issuer P.No must be exactly 6 alphanumeric characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index to find active issues
issueSchema.index({ return_date: 1 });
issueSchema.index({ employee: 1 });
issueSchema.index({ 'items.item': 1 });

// Virtual: check if the issue is fully returned
issueSchema.virtual('is_fully_returned').get(function () {
  return this.items.every((i) => i.returned_quantity >= i.quantity);
});

// Ensure virtuals are included in JSON output
issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);
