/**
 * Grammar Check Router
 * Provides grammar checking functionality with error detection and suggestions
 */

import { Router } from 'express';

const router = Router();

// Common grammar patterns for detection
const grammarPatterns = [
  // Subject-verb agreement
  { pattern: /\b(he|she|it)\s+(have|are)\b/gi, type: 'grammar', message: 'Use "has" or "is" for third person singular', corrections: ['has', 'is'] },
  { pattern: /\b(they|we|I|you)\s+(has|are)\b/gi, type: 'grammar', message: 'Use "have" or "are" for plural subjects', corrections: ['have', 'are'] },
  
  // Articles
  { pattern: /\ba\s+([aeiou][a-z]*)\b/gi, type: 'article', message: 'Use "an" before a vowel sound', corrections: ['an'] },
  { pattern: /\ban\s+([bcdfghjklmnpqrstvwxyz][a-z]*)\b/gi, type: 'article', message: 'Use "a" before a consonant sound', corrections: ['a'] },
  
  // Common misspellings
  { pattern: /\brecieve\b/gi, type: 'spelling', message: 'Correct spelling is "receive"', corrections: ['receive'] },
  { pattern: /\bdefinately\b/gi, type: 'spelling', message: 'Correct spelling is "definitely"', corrections: ['definitely'] },
  { pattern: /\boccured\b/gi, type: 'spelling', message: 'Correct spelling is "occurred"', corrections: ['occurred'] },
  { pattern: /\bseperate\b/gi, type: 'spelling', message: 'Correct spelling is "separate"', corrections: ['separate'] },
  { pattern: /\btommorow\b/gi, type: 'spelling', message: 'Correct spelling is "tomorrow"', corrections: ['tomorrow'] },
  { pattern: /\buntill\b/gi, type: 'spelling', message: 'Correct spelling is "until"', corrections: ['until'] },
  { pattern: /\bpsychology\b/gi, type: 'spelling', message: 'Correct spelling is "psychology"', corrections: ['psychology'] },
  { pattern: /\baccomodate\b/gi, type: 'spelling', message: 'Correct spelling is "accommodate"', corrections: ['accommodate'] },
  { pattern: /\bperformence\b/gi, type: 'spelling', message: 'Correct spelling is "performance"', corrections: ['performance'] },
  { pattern: /\bmaintainance\b/gi, type: 'spelling', message: 'Correct spelling is "maintenance"', corrections: ['maintenance'] },
  { pattern: /\bsuccessful\b/gi, type: 'spelling', message: 'Correct spelling is "successful"', corrections: ['successful'] },
  { pattern: /\boccassion\b/gi, type: 'spelling', message: 'Correct spelling is "occasion"', corrections: ['occasion'] },
  
  // Tense issues
  { pattern: /\bi\s+go\s+to\s+school\s+yesterday\b/gi, type: 'tense', message: 'Use past tense "went" for completed actions', corrections: ['I went to school yesterday'] },
  { pattern: /\bi\s+see\s+him\s+yesterday\b/gi, type: 'tense', message: 'Use past tense "saw" for completed actions', corrections: ['I saw him yesterday'] },
  
  // Word choice
  { pattern: /\bits\s+a\s+good\s+idea\s+to\s+me\b/gi, type: 'word-choice', message: 'Consider "seems good to me" or "is a good idea"', corrections: ['seems good to me', 'is a good idea'] },
  { pattern: /\bgoing\s+to\s+school\b/gi, type: 'usage', message: 'This is correct in some contexts, but consider "attending school" for formal writing', corrections: [] },
];

interface GrammarMatch {
  original: string;
  replacement: string;
  index: number;
  length: number;
  type: string;
  message: string;
  context: string;
}

/**
 * POST /api/v1/grammar/check
 * Check grammar and return corrections
 */
router.post('/check', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const matches: GrammarMatch[] = [];
    
    for (const rule of grammarPatterns) {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      
      while ((match = regex.exec(text)) !== null) {
        const original = match[0];
        const contextStart = Math.max(0, match.index - 20);
        const contextEnd = Math.min(text.length, match.index + original.length + 20);
        
        matches.push({
          original,
          replacement: rule.corrections[0] || original,
          index: match.index,
          length: original.length,
          type: rule.type,
          message: rule.message,
          context: text.substring(contextStart, contextEnd)
        });
      }
    }

    // Sort matches by index (descending) to apply replacements correctly
    matches.sort((a, b) => b.index - a.index);

    // Apply corrections to create corrected text
    let correctedText = text;
    for (const match of matches) {
      correctedText = correctedText.substring(0, match.index) + match.replacement + correctedText.substring(match.index + match.length);
    }

    // Sort matches by index (ascending) for display
    matches.sort((a, b) => a.index - b.index);

    res.json({
      original: text,
      corrected: correctedText,
      matches,
      matchCount: matches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/grammar/verify
 * Verify user's answer against correct answer (for learning mode)
 */
router.post('/verify', async (req, res) => {
  try {
    const { original, userAnswer, correctAnswer } = req.body;
    
    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'userAnswer and correctAnswer are required' });
    }

    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    
    // Exact match
    if (normalizedUser === normalizedCorrect) {
      return res.json({
        isCorrect: true,
        score: 100,
        feedback: 'Perfect! Your answer is correct.',
        suggestions: []
      });
    }

    // Fuzzy matching for multiple correct answers
    const alternativeAnswers = [correctAnswer, ...(req.body.alternatives || [])];
    for (const alt of alternativeAnswers) {
      if (normalizedUser === alt.trim().toLowerCase()) {
        return res.json({
          isCorrect: true,
          score: 100,
          feedback: 'Correct! This is an acceptable answer.',
          suggestions: []
        });
      }
    }

    // Calculate similarity
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
    
    // Provide hints based on similarity
    const suggestions = [];
    if (similarity >= 0.7) {
      suggestions.push('Check your spelling and punctuation.');
    }
    if (similarity >= 0.5) {
      suggestions.push('Review the grammar structure.');
    }

    res.json({
      isCorrect: false,
      score: Math.round(similarity * 100),
      feedback: `Your answer is ${Math.round(similarity * 100)}% similar to the correct answer.`,
      suggestions,
      correctAnswer
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export default router;
