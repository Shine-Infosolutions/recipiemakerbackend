const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  ingredients: [{
    type: { type: String, enum: ['raw', 'semi-finished'], default: 'raw' },
    inventoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],
  instructions: String,
  cookTime: Number,
  servings: Number,
  sellingPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
