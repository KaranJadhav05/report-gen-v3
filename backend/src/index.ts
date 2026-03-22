import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import authRoutes       from './routes/auth';
import attendanceRoutes from './routes/attendance';

const app  = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth',       authRoutes);
app.use('/api/attendance', attendanceRoutes);

connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀  Server → http://localhost:${PORT}`)))
  .catch(err => { console.error('DB failed:', err); process.exit(1); });
