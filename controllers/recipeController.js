const Recipe = require('../models/Recipe');
const Inventory = require('../models/Inventory');
const SemiFinished = require('../models/SemiFinishedGood');

exports.getAll = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('departmentId', 'name code');
    
    // Manually populate ingredients based on type
    for (let recipe of recipes) {
      for (let ingredient of recipe.ingredients) {
        if (ingredient.type === 'semi-finished') {
          ingredient.inventoryId = await SemiFinished.findById(ingredient.inventoryId).select('name quantity');
        } else {
          ingredient.inventoryId = await Inventory.findById(ingredient.inventoryId).select('name quantity unit');
        }
      }
    }
    
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('departmentId', 'name code');
    
    // Manually populate ingredients based on type
    for (let ingredient of recipe.ingredients) {
      if (ingredient.type === 'semi-finished') {
        ingredient.inventoryId = await SemiFinished.findById(ingredient.inventoryId).select('name quantity');
      } else {
        ingredient.inventoryId = await Inventory.findById(ingredient.inventoryId).select('name quantity unit');
      }
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);
    const populated = await Recipe.findById(recipe._id)
      .populate('departmentId', 'name code');
    
    // Manually populate ingredients based on type
    for (let ingredient of populated.ingredients) {
      if (ingredient.type === 'semi-finished') {
        ingredient.inventoryId = await SemiFinished.findById(ingredient.inventoryId).select('name quantity');
      } else {
        ingredient.inventoryId = await Inventory.findById(ingredient.inventoryId).select('name quantity unit');
      }
    }
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('departmentId', 'name code');
    
    // Manually populate ingredients based on type
    for (let ingredient of recipe.ingredients) {
      if (ingredient.type === 'semi-finished') {
        ingredient.inventoryId = await SemiFinished.findById(ingredient.inventoryId).select('name quantity');
      } else {
        ingredient.inventoryId = await Inventory.findById(ingredient.inventoryId).select('name quantity unit');
      }
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    
    recipe.isActive = !recipe.isActive;
    await recipe.save();
    
    res.json({ message: 'Recipe status updated', isActive: recipe.isActive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSellingPrices = async (req, res) => {
  try {
    await Recipe.updateMany(
      { sellingPrice: { $exists: false } },
      { $set: { sellingPrice: 100 } }
    );
    res.json({ message: 'Default selling prices updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cook = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    // Check ingredients availability
    for (const ing of recipe.ingredients) {
      let item;
      if (ing.type === 'semi-finished') {
        item = await SemiFinished.findById(ing.inventoryId);
        if (!item) {
          return res.status(400).json({ error: `Semi-finished ingredient not found` });
        }
        if (item.quantity < ing.quantity) {
          return res.status(400).json({ error: `Not enough ${item.name}. Need ${ing.quantity}, have ${item.quantity}` });
        }
      } else {
        item = await Inventory.findById(ing.inventoryId);
        if (!item) {
          return res.status(400).json({ error: `Raw material not found in inventory` });
        }
        if (item.quantity < ing.quantity) {
          return res.status(400).json({ error: `Not enough ${item.name}. Need ${ing.quantity}, have ${item.quantity}` });
        }
      }
    }

    // Deduct ingredients from inventory/semi-finished
    for (const ing of recipe.ingredients) {
      if (ing.type === 'semi-finished') {
        await SemiFinished.findByIdAndUpdate(ing.inventoryId, {
          $inc: { quantity: -ing.quantity }
        });
      } else {
        await Inventory.findByIdAndUpdate(ing.inventoryId, {
          $inc: { quantity: -ing.quantity }
        });
      }
    }

    res.json({ message: 'Recipe cooked successfully', recipe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
