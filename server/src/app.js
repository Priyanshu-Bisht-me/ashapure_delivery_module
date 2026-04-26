import cors from 'cors';
import express from 'express';
import deliveryRoutes from './routes/deliveryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', systemRoutes);
app.use('/api', deliveryRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

export default app;
