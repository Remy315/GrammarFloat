/**
 * History Router
 * Manages history records for grammar checks and translations
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage (in production, use a database)
interface HistoryRecord {
  id: string;
  type: 'grammar' | 'translate';
  original: string;
  result: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Global history store
const historyStore: Map<string, HistoryRecord[]> = new Map();

// Get or create user history
function getUserHistory(userId: string): HistoryRecord[] {
  if (!historyStore.has(userId)) {
    historyStore.set(userId, []);
  }
  return historyStore.get(userId)!;
}

/**
 * POST /api/v1/history/add
 * Add a new history record
 */
router.post('/add', async (req, res) => {
  try {
    const { userId, type, original, result, metadata } = req.body;
    
    if (!userId || !type || !original || !result) {
      return res.status(400).json({ 
        error: 'userId, type, original, and result are required' 
      });
    }

    if (!['grammar', 'translate'].includes(type)) {
      return res.status(400).json({ 
        error: 'type must be "grammar" or "translate"' 
      });
    }

    const history = getUserHistory(userId);
    
    const record: HistoryRecord = {
      id: uuidv4(),
      type,
      original,
      result,
      metadata,
      createdAt: new Date().toISOString()
    };

    // Add to beginning (most recent first)
    history.unshift(record);
    
    // Keep only last 20 records
    if (history.length > 20) {
      history.pop();
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error('Add history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/history/:userId
 * Get user's history records
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const history = getUserHistory(userId);
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const records = history.slice(offsetNum, offsetNum + limitNum);

    res.json({
      records,
      total: history.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/history/:userId/:recordId
 * Get a specific history record
 */
router.get('/:userId/:recordId', async (req, res) => {
  try {
    const { userId, recordId } = req.params;

    if (!userId || !recordId) {
      return res.status(400).json({ error: 'userId and recordId are required' });
    }

    const history = getUserHistory(userId);
    const record = history.find(r => r.id === recordId);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/history/:userId/:recordId
 * Delete a specific history record
 */
router.delete('/:userId/:recordId', async (req, res) => {
  try {
    const { userId, recordId } = req.params;

    if (!userId || !recordId) {
      return res.status(400).json({ error: 'userId and recordId are required' });
    }

    const history = getUserHistory(userId);
    const index = history.findIndex(r => r.id === recordId);

    if (index === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }

    history.splice(index, 1);

    res.json({ success: true, message: 'Record deleted' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/history/:userId
 * Clear all history for a user
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    historyStore.delete(userId);

    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
