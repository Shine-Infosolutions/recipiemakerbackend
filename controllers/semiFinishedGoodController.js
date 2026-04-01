const SemiFinished = require('../models/SemiFinishedGood');
const Inventory = require('../models/Inventory');

exports.getAll = async (req, res) => {
  try {
    const items = await SemiFinished.find({})
      .populate('departmentId', 'name code')
      .populate('rawMaterials.inventoryId', 'name unit')
      .populate('userId', 'name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, departmentId, rawMaterials } = req.body;
    const userId = req.user.id;

    // Create semi-finished item
    const semiFinished = new SemiFinished({
      name,
      departmentId,
      rawMaterials,
      userId,
      quantity: 0 // Start with 0, will be added when stock is produced
    });

    await semiFinished.save();
    
    // Populate the response
    await semiFinished.populate('departmentId', 'name code');
    await semiFinished.populate('rawMaterials.inventoryId', 'name unit');
    
    res.status(201).json(semiFinished);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityToAdd, rawMaterialsUsed } = req.body;

    console.log('Add Stock Request:', { id, quantityToAdd, rawMaterialsUsed });

    const semiFinished = await SemiFinished.findById(id);
    if (!semiFinished) {
      return res.status(404).json({ message: 'Semi-finished item not found' });
    }

    // Check if we have enough raw materials
    for (const rm of rawMaterialsUsed) {
      const inventoryItem = await Inventory.findById(rm.inventoryId);
      console.log(`Checking ${inventoryItem?.name}: Need ${rm.quantity}, Have ${inventoryItem?.quantity}`);
      if (!inventoryItem || inventoryItem.quantity < rm.quantity) {
        return res.status(400).json({ 
          message: `Insufficient ${inventoryItem?.name || 'raw material'} in inventory. Need ${rm.quantity}, have ${inventoryItem?.quantity || 0}` 
        });
      }
    }

    // Deduct raw materials from inventory
    for (const rm of rawMaterialsUsed) {
      console.log(`Deducting ${rm.quantity} from inventory item ${rm.inventoryId}`);
      const result = await Inventory.findByIdAndUpdate(
        rm.inventoryId,
        { $inc: { quantity: -rm.quantity } },
        { new: true }
      );
      console.log(`After deduction: ${result.name} now has ${result.quantity}`);
    }

    // Add to semi-finished stock
    semiFinished.quantity += quantityToAdd;
    await semiFinished.save();
    console.log(`Added ${quantityToAdd} to semi-finished. New quantity: ${semiFinished.quantity}`);

    // Populate the response
    await semiFinished.populate('departmentId', 'name code');
    await semiFinished.populate('rawMaterials.inventoryId', 'name unit');

    res.json({
      ...semiFinished.toObject(),
      message: `Successfully added ${quantityToAdd} units. Current stock: ${semiFinished.quantity}`
    });
  } catch (error) {
    console.error('Add Stock Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await SemiFinished.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to update semi-finished usage when used in recipes
exports.updateUsage = async (semiFinishedId, quantityUsed) => {
  try {
    await SemiFinished.findByIdAndUpdate(
      semiFinishedId,
      { $inc: { quantity: -quantityUsed } }
    );
  } catch (error) {
    console.error('Error updating semi-finished usage:', error);
    throw error;
  }
};

