import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Products for Sale' },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  threshold: { type: Number, default: 5 },
  cost: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema, 'inventory');
