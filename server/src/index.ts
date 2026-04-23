import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Import routes
import grammarRouter from './routes/grammar';
import translateRouter from './routes/translate';
import historyRouter from './routes/history';

// Mount routes
app.use('/api/v1/grammar', grammarRouter);
app.use('/api/v1/translate', translateRouter);
app.use('/api/v1/history', historyRouter);

app.listen(port, () => {
  console.log(`GrammarFloat API server listening at http://localhost:${port}/`);
});
