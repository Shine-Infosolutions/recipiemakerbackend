const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('MongoDB connected');
    const db = mongoose.connection.db;
    await db.collection('recipes').dropIndex('title_1_userId_1');
    console.log('Index dropped successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
