const User = require('../models/User');

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin seed: ADMIN_EMAIL and ADMIN_PASSWORD not set in .env');
    return;
  }

  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      membershipStatus: 'active',
    });

    console.log(`Admin user created: ${adminEmail}`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
