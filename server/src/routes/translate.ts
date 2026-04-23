import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

// Simple phrase translations
const phraseDictionary: Record<string, Array<{ en: string; zh: string }>> = {
  'hello': [{ en: 'Hello!', zh: '你好！' }],
  'good morning': [{ en: 'Good morning!', zh: '早上好！' }],
  'good night': [{ en: 'Good night!', zh: '晚安！' }],
  'thank you': [{ en: 'Thank you!', zh: '谢谢！' }],
  'how are you': [{ en: 'How are you?', zh: '你好吗？' }],
  'what is your name': [{ en: 'What is your name?', zh: '你叫什么名字？' }],
  'my name is': [{ en: 'My name is', zh: '我叫' }],
  'where are you from': [{ en: 'Where are you from?', zh: '你是哪里人？' }],
  'i am from china': [{ en: 'I am from China', zh: '我来自中国' }],
};

// Simple word-level translation
const wordDictionary: Record<string, string> = {
  // Pronouns
  'i': '我', 'you': '你', 'he': '他', 'she': '她', 'it': '它',
  'we': '我们', 'they': '他们', 'me': '我', 'him': '他', 'us': '我们',
  'my': '我的', 'your': '你的', 'his': '他的', 'its': '它的', 'our': '我们的',
  // Be verbs
  'is': '是', 'are': '是', 'was': '是', 'were': '是', 'am': '是',
  // Have verbs
  'have': '有', 'has': '有', 'had': '有',
  // Modal verbs
  'do': '做', 'does': '做', 'did': '做',
  'can': '能', 'could': '能', 'will': '会', 'would': '会',
  'should': '应该', 'may': '可能', 'might': '可能', 'must': '必须',
  // Articles and prepositions
  'the': '这', 'a': '一', 'an': '一',
  'in': '在', 'on': '在', 'at': '在', 'to': '到', 'for': '为',
  'with': '和', 'by': '通过', 'from': '从', 'of': '的',
  // Conjunctions
  'and': '和', 'or': '或者', 'but': '但是', 'so': '所以', 'because': '因为',
  'if': '如果', 'when': '当', 'where': '哪里', 'what': '什么', 'who': '谁', 'why': '为什么', 'how': '怎样',
  // Demonstratives
  'this': '这个', 'that': '那个', 'these': '这些', 'those': '那些',
  // Adverbs
  'here': '这里', 'there': '那里', 'now': '现在', 'then': '然后', 'always': '总是', 'never': '从不',
  'yes': '是', 'no': '不', 'please': '请', 'sorry': '对不起', 'thanks': '谢谢',
  // Common words
  'good': '好', 'bad': '坏', 'big': '大', 'small': '小', 'new': '新', 'old': '旧',
  'today': '今天', 'tomorrow': '明天', 'yesterday': '昨天',
  'work': '工作', 'life': '生活', 'time': '时间', 'day': '天', 'year': '年',
  'much': '很多', 'many': '很多', 'some': '一些', 'all': '全部', 'each': '每个',
  'person': '人', 'people': '人们', 'thing': '东西', 'world': '世界',
  'water': '水', 'food': '食物', 'money': '钱', 'book': '书', 'phone': '手机',
  'hello': '你好', 'morning': '早上', 'afternoon': '下午', 'evening': '晚上',
  'night': '晚上', 'week': '周', 'month': '月', 'hour': '小时', 'minute': '分钟',
  'question': '问题', 'answer': '答案', 'idea': '想法', 'problem': '问题',
  'important': '重要', 'interesting': '有趣', 'difficult': '困难', 'easy': '容易',
  'right': '正确', 'wrong': '错误', 'same': '相同', 'different': '不同',
  'more': '更多', 'most': '最多', 'less': '更少',
  'still': '仍然', 'again': '再次', 'once': '一次',
  'fast': '快', 'slow': '慢', 'hot': '热', 'cold': '冷', 'warm': '温暖', 'cool': '凉快',
  'high': '高', 'low': '低', 'long': '长', 'short': '短', 'wide': '宽',
  'strong': '强', 'weak': '弱', 'rich': '富', 'poor': '穷', 'young': '年轻', 'send': '发送',
  'help': '帮助', 'start': '开始', 'stop': '停止', 'finish': '完成',
  'open': '打开', 'close': '关闭', 'change': '改变', 'move': '移动', 'wait': '等待',
  'play': '玩', 'study': '学习', 'teach': '教', 'call': '打电话',
  'use': '使用', 'try': '尝试', 'ask': '问', 'tell': '告诉', 'say': '说',
  'feel': '感觉', 'become': '成为', 'leave': '离开', 'put': '放',
  'keep': '保持', 'show': '显示', 'hear': '听到', 'find': '找到',
  'give': '给', 'turn': '转', 'hold': '拿住', 'bring': '带来', 'happen': '发生',
  'write': '写', 'provide': '提供', 'sit': '坐', 'stand': '站', 'lose': '丢失',
  'pay': '付钱', 'meet': '遇见', 'include': '包含', 'continue': '继续',
  'set': '设置', 'develop': '开发', 'live': '生活', 'cover': '覆盖',
  'face': '面对', 'exist': '存在', 'believe': '相信', 'affect': '影响',
  'remember': '记住', 'consider': '考虑', 'appear': '出现', 'expect': '期望',
  'decide': '决定', 'produce': '生产', 'explain': '解释', 'allow': '允许',
  'add': '添加', 'spend': '花费', 'walk': '走',
  'win': '赢', 'offer': '提供', 'love': '爱', 'buy': '买', 'serve': '服务', 'die': '死',
  'build': '建造', 'stay': '停留', 'fall': '落下', 'cut': '切', 'reach': '到达', 'remain': '保持', 'suggest': '建议',
  'raise': '提高', 'pass': '通过', 'sell': '卖', 'require': '需要', 'report': '报告',
  'pull': '拉', 'hope': '希望', 'achieve': '实现',
  'connect': '连接', 'describe': '描述', 'improve': '提高', 'inspire': '激励',
  'celebrate': '庆祝', 'succeed': '成功', 'contribute': '贡献', 'protect': '保护',
  'prepare': '准备', 'discover': '发现', 'accept': '接受', 'enjoy': '享受',
  'manage': '管理', 'choose': '选择',
  'design': '设计', 'create': '创造', 'organize': '组织', 'communicate': '沟通',
  'experience': '体验', 'appreciate': '感激',
};

// Chinese to English (simplified - using reversed mapping)
const zhToEnDictionary: Record<string, string> = Object.fromEntries(
  Object.entries(wordDictionary).map(([en, zh]) => [zh, en])
);

/**
 * POST /api/v1/translate
 * Translate text between Chinese and English
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, targetLang } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sourceLang = detectLanguage(text);
    const finalTargetLang = targetLang || (sourceLang === 'en' ? 'zh' : 'en');

    // Simple word-by-word translation
    const words = text.trim().split(/\s+/);
    const translatedWords: string[] = [];
    
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
      const punctuation = word.match(/[.,!?;:'"()]+$/)?.[0] || '';
      
      if (sourceLang === 'en') {
        const translation = wordDictionary[cleanWord] || cleanWord;
        translatedWords.push(translation + punctuation);
      } else {
        const translation = zhToEnDictionary[cleanWord] || cleanWord;
        translatedWords.push(translation + punctuation);
      }
    }

    const translatedText = translatedWords.join(' ');
    
    res.json({
      original: text,
      translated: translatedText,
      sourceLang,
      targetLang: finalTargetLang,
      isPhrase: false,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

/**
 * Detect if text is primarily Chinese or English
 */
function detectLanguage(text: string): 'en' | 'zh' {
  const chineseRegex = /[\u4e00-\u9fff]/;
  const chineseChars = (text.match(chineseRegex) || []).length;
  return chineseChars > text.length * 0.3 ? 'zh' : 'en';
}

export default router;
