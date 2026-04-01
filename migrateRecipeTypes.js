require('dotenv').config();
const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

const migrateRecipes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Update all existing recipes to add type: 'raw' to ingredients that don't have a type
    const result = await Recipe.updateMany(
      { 'ingredients.type': { $exists: false } },
      { $set: { 'ingredients.$[].type': 'raw' } }
    );

    console.log(`Updated ${result.modifiedCount} recipes with ingredient types`);

    // Also ensure all recipes have the new structure
    const recipes = await Recipe.find({});
    for (let recipe of recipes) {
      let modified = false;
      for (let ingredient of recipe.ingredients) {
        if (!ingredient.type) {
          ingredient.type = 'raw';
          modified = true;
        }
      }
      if (modified) {
        await recipe.save();
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateRecipes();