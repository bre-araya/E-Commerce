require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const users = await User.find().select('+password');
  console.log('Users found:', users.length);
  for (const u of users) {
    console.log({ id: u._id.toString(), email: u.email, name: u.name, role: u.role });
  }
  process.exit(0);
})();