import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questionsPath = join(__dirname, '../../../shared/questions.json');

let questionsData = null;

function getQuestionsData() {
  if (!questionsData) {
    questionsData = JSON.parse(readFileSync(questionsPath, 'utf-8'));
  }
  return questionsData;
}

export function getAllCategories() {
  return getQuestionsData().categories.map(({ id, name, emoji, color, description, ageRestricted }) => ({
    id, name, emoji, color, description, ageRestricted: !!ageRestricted
  }));
}

export function getCategory(id) {
  return getQuestionsData().categories.find(c => c.id === id);
}

export function getNextQuestion(categoryId, usedQuestionIds = [], customQuestions = []) {
  const data = getQuestionsData();
  let pool = [];

  if (categoryId === 'custom' || categoryId === 'all') {
    // Mix all categories
    for (const cat of data.categories) {
      if (!cat.ageRestricted) {
        pool.push(...cat.questions.map(q => ({ ...q, category: cat.id })));
      }
    }
  } else {
    const cat = data.categories.find(c => c.id === categoryId);
    if (cat) {
      pool = cat.questions.map(q => ({ ...q, category: cat.id }));
    }
  }

  // Add custom questions
  pool.push(...customQuestions.map(q => ({ ...q, category: 'custom' })));

  // Filter out recently used (last 20)
  const recentUsed = usedQuestionIds.slice(-20);
  let available = pool.filter(q => !recentUsed.includes(q.id));

  // If all used, reset (allow repeats but shuffle)
  if (available.length === 0) {
    available = pool;
  }

  // Pick random
  const idx = Math.floor(Math.random() * available.length);
  return available[idx] || null;
}

export function validateCustomQuestion(text) {
  if (!text || typeof text !== 'string') return false;
  if (text.trim().length < 10) return false;
  if (text.trim().length > 300) return false;
  return true;
}
