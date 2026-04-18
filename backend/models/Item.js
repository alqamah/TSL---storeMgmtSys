const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema(
  {
    part_no: {
      type:String,
      trim:true,
      description: "Part number of the item in the format: FMM/INFRA/XX/"
    },
    sap_id: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple docs with null/missing sap_id
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },    
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      // enum: ['C1', 'C2', 'C3', 'C4', 'C5'],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      type: String,
      default: '',
      trim: true,
    },
    certificate_no: {
      type: String,
      default: '',
      trim: true,
    },
    make: {
      type: String,
      default: '',
      trim: true,
    },
    prev_due_date: {
      type: Date,
      default: null,
    },
    next_due_date: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value || !this.prev_due_date) return true;
          return value >= this.prev_due_date;
        },
        message: 'Next due date cannot be before prev due date',
      },
    },
    owner: {
      type: String,
      default: '',
      trim: true,
    },
    umc: {
      type: String,
      default: '',
      trim: true,
    },
    date_added:{
      type: Date,
      description:"Date when item was added to the store"
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
// Index for common queries
itemSchema.index({ title: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
