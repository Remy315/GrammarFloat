/**
 * API Service for GrammarFloat
 * Handles all backend API calls
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface GrammarMatch {
  original: string;
  replacement: string;
  index: number;
  length: number;
  type: string;
  message: string;
  context: string;
}

interface GrammarCheckResponse {
  original: string;
  corrected: string;
  matches: GrammarMatch[];
  matchCount: number;
  timestamp: string;
}

interface VerifyResponse {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
  correctAnswer?: string;
}

interface TranslateResponse {
  original: string;
  translated: string;
  sourceLang: 'en' | 'zh';
  targetLang: 'en' | 'zh';
  alternatives: string[];
  timestamp: string;
}

interface HistoryRecord {
  id: string;
  type: 'grammar' | 'translate';
  original: string;
  result: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface HistoryListResponse {
  records: HistoryRecord[];
  total: number;
  limit: number;
  offset: number;
}

// Grammar Check API
export async function checkGrammar(text: string): Promise<GrammarCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/grammar/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Grammar check failed: ${response.status}`);
  }

  return response.json();
}

// Verify Answer API (for learning mode)
export async function verifyAnswer(
  original: string,
  userAnswer: string,
  correctAnswer: string,
  alternatives?: string[]
): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/grammar/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      original,
      userAnswer,
      correctAnswer,
      alternatives,
    }),
  });

  if (!response.ok) {
    throw new Error(`Verify failed: ${response.status}`);
  }

  return response.json();
}

// Translation API
export async function translate(
  text: string,
  targetLang?: 'en' | 'zh'
): Promise<TranslateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, targetLang }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  return response.json();
}

// Language Detection API
export async function detectLanguage(text: string): Promise<{ language: 'en' | 'zh' }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/translate/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Language detection failed: ${response.status}`);
  }

  return response.json();
}

// History APIs
export async function addHistory(
  userId: string,
  type: 'grammar' | 'translate',
  original: string,
  result: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; record: HistoryRecord }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, type, original, result, metadata }),
  });

  if (!response.ok) {
    throw new Error(`Add history failed: ${response.status}`);
  }

  return response.json();
}

export async function getHistory(
  userId: string,
  limit = 20,
  offset = 0
): Promise<HistoryListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/history/${userId}?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Get history failed: ${response.status}`);
  }

  return response.json();
}

export async function deleteHistoryRecord(
  userId: string,
  recordId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/${userId}/${recordId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Delete history failed: ${response.status}`);
  }

  return response.json();
}

export async function clearAllHistory(userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Clear history failed: ${response.status}`);
  }

  return response.json();
}
