// const mongoose = require('mongoose');

// const logSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     action: {
//       type: String,
//       required: true,
//       index: true,
//     },
//     target_type: {
//       type: String,
//       required: true,
//     },
//     target_id: {
//       type: String,
//     },
//     details: {
//       type: mongoose.Schema.Types.Mixed,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexes for faster queries
// logSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Log', logSchema);
