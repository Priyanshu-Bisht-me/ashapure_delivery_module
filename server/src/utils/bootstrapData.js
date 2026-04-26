import bcrypt from 'bcryptjs';
import Delivery from '../models/Delivery.js';
import User from '../models/User.js';

const demoUsers = [
  {
    name: 'Aasapure Admin',
    email: 'admin@aasapure.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Rider One',
    email: 'agent1@aasapure.com',
    password: 'agent123',
    role: 'agent',
  },
  {
    name: 'Rider Two',
    email: 'agent2@aasapure.com',
    password: 'agent123',
    role: 'agent',
  },
];

export const ensureDemoUsers = async () => {
  for (const demoUser of demoUsers) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    await User.findOneAndUpdate(
      { email: demoUser.email },
      {
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        passwordHash,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        returnDocument: 'after',
      }
    );
  }
};

export const ensureDeliveryAssignments = async () => {
  const assignments = [
    { name: 'Rider One', email: 'agent1@aasapure.com' },
    { name: 'Rider Two', email: 'agent2@aasapure.com' },
  ];

  const deliveries = await Delivery.find({
    $or: [{ agentEmail: { $exists: false } }, { agentEmail: '' }],
  });

  if (deliveries.length === 0) {
    return;
  }

  await Promise.all(
    deliveries.map((delivery, index) =>
      Delivery.updateOne(
        { _id: delivery._id },
        {
          $set: {
            agentName: assignments[index % assignments.length].name,
            agentEmail: assignments[index % assignments.length].email,
          },
        }
      )
    )
  );
};
