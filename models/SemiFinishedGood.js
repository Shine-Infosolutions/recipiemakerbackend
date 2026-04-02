const mongoose = require('mongoose');

const semiFinishedSchema = new mongoose.Schema({
  name: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  quantity: { type: Number, default: 0 },
  rawMaterials: [{
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SemiFinished', semiFinishedSchema);
