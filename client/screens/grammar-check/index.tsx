/**
 * Grammar Check Screen
 * Provides grammar checking with auto-correct and learning modes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useApp } from '@/contexts/AppContext';
import { checkGrammar, translate } from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

interface GrammarMatch {
  original: string;
  replacement: string;
  index: number;
  length: number;
  type: string;
  message: string;
  context: string;
}

type Mode = 'auto' | 'learn';

export default function GrammarCheckScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ text?: string; result?: string }>();
  const { addToHistory, defaultMode } = useApp();
  
  // State
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    original: string;
    corrected: string;
    matches: GrammarMatch[];
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [flipAnimation] = useState(new Animated.Value(0));
  
  // Load initial text from params
  useEffect(() => {
    if (params.text) {
      setInputText(params.text);
      if (params.result) {
        // Pre-fill results if coming from history
        try {
          const parsed = JSON.parse(params.result);
          if (parsed.original && parsed.corrected) {
            setResults(parsed);
          }
        } catch {
          // Not JSON, ignore
        }
      }
    }
  }, [params.text, params.result]);

  // Handle long press to change default mode
  const handleModeLongPress = () => {
    const newMode = mode === 'auto' ? 'learn' : 'auto';
    setMode(newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: 'info',
      text1: '默认模式已更改',
      text2: newMode === 'auto' ? '自动修正模式' : '学习模式',
    });
  };

  // Check grammar
  const handleCheck = useCallback(async () => {
    if (!inputText.trim()) {
      Toast.show({
        type: 'error',
        text1: '请输入英文文本',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await checkGrammar(inputText);
      setResults(response);
      
      // Add to history
      addToHistory({
        type: 'grammar',
        original: inputText,
        result: JSON.stringify(response),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Grammar check error:', error);
      Toast.show({
        type: 'error',
        text1: '检查失败',
        text2: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  }, [inputText, addToHistory]);

  // Copy corrected text
  const handleCopy = async () => {
    if (!results?.corrected) return;
    
    await Clipboard.setStringAsync(results.corrected);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: '已复制到剪贴板',
      text2: '返回原应用粘贴',
    });
  };

  // Get explanation in Chinese
  const getExplanation = async (match: GrammarMatch): Promise<string> => {
    try {
      const response = await translate(match.message, 'zh');
      return response.translated;
    } catch {
      return match.message;
    }
  };

  // Toggle details section
  const toggleDetails = () => {
    Animated.timing(showDetails ? flipAnimation : new Animated.Value(1), {
      toValue: showDetails ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowDetails(!showDetails);
  };

  // Navigate to learning mode
  const handleEnterLearnMode = () => {
    if (!results) return;
    
    router.push('/learn', {
      original: inputText,
      corrections: JSON.stringify(results.matches),
    });
  };

  return (
    <Screen safeAreaEdges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome6 name="arrow-left" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>语法检查</Text>
          <TouchableOpacity
            style={styles.modeButton}
            onLongPress={handleModeLongPress}
            delayLongPress={500}
          >
            <Text style={styles.modeText}>
              {mode === 'auto' ? '自动' : '学习'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>输入英文文本</Text>
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => setInputText('')}>
                <Text style={styles.clearText}>清除</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="粘贴或输入英文文本..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.checkButton, !inputText.trim() && styles.checkButtonDisabled]}
            onPress={handleCheck}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="wand-magic-sparkles" size={18} color="#fff" />
                <Text style={styles.checkButtonText}>检查语法</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {results && (
          <ScrollView
            style={styles.resultsSection}
            showsVerticalScrollIndicator={false}
          >
            {/* Corrected Text */}
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleContainer}>
                  <View style={[styles.resultBadge, { backgroundColor: '#ECFDF5' }]}>
                    <FontAwesome6 name="circle-check" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.resultTitle}>修正结果</Text>
                </View>
                {results.matches.length > 0 && (
                  <TouchableOpacity onPress={toggleDetails}>
                    <Text style={styles.detailsToggle}>
                      {showDetails ? '收起详情' : '查看详情'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.correctedText}>
                <HighlightedText
                  original={results.original}
                  corrected={results.corrected}
                  matches={results.matches}
                />
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                  <FontAwesome6 name="copy" size={16} color="#4F46E5" />
                  <Text style={styles.copyButtonText}>复制修正全文</Text>
                </TouchableOpacity>

                {results.matches.length > 0 && mode === 'learn' && (
                  <TouchableOpacity
                    style={styles.learnButton}
                    onPress={handleEnterLearnMode}
                  >
                    <FontAwesome6 name="graduation-cap" size={16} color="#fff" />
                    <Text style={styles.learnButtonText}>进入学习</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Details Section */}
            {showDetails && results.matches.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>改动详情</Text>
                {results.matches.map((match, index) => (
                  <MatchDetailCard key={index} match={match} />
                ))}
              </View>
            )}

            {/* No errors message */}
            {results.matches.length === 0 && (
              <View style={styles.noErrors}>
                <FontAwesome6 name="face-smile" size={48} color="#10B981" />
                <Text style={styles.noErrorsText}>太棒了！没有发现语法错误</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Highlighted text component showing corrections
function HighlightedText({
  original,
  corrected,
  matches,
}: {
  original: string;
  corrected: string;
  matches: GrammarMatch[];
}) {
  if (matches.length === 0) {
    return <Text style={styles.correctedTextContent}>{corrected}</Text>;
  }

  // Simple approach: show corrected text with highlights
  return (
    <Text style={styles.correctedTextContent}>
      {corrected.split('').map((char, index) => {
        // Find if this position is part of a correction
        const isCorrected = matches.some(
          m => index >= m.index && index < m.index + m.length
        );
        return (
          <Text
            key={index}
            style={isCorrected ? styles.correctedHighlight : undefined}
          >
            {char}
          </Text>
        );
      })}
    </Text>
  );
}

// Match detail card with flip animation
function MatchDetailCard({ match }: { match: GrammarMatch }) {
  const [flipped, setFlipped] = useState(false);
  const [explanation, setExplanation] = useState(match.message);
  const flipAnim = useState(new Animated.Value(0))[0];

  const handleFlip = async () => {
    if (!flipped) {
      // Get Chinese explanation
      try {
        const response = await translate(match.message, 'zh');
        setExplanation(response.translated);
      } catch {
        setExplanation(match.message);
      }
    }

    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
    }).start();

    setFlipped(!flipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity onPress={handleFlip} activeOpacity={0.8}>
      <View style={styles.matchCard}>
        <Animated.View
          style={[
            styles.matchFront,
            { transform: [{ rotateY: frontInterpolate }] },
          ]}
        >
          <View style={styles.matchContent}>
            <View style={styles.matchPair}>
              <View style={styles.strikeThrough}>
                <Text style={styles.originalWord}>{match.original}</Text>
                <View style={styles.strikeLine} />
              </View>
              <FontAwesome6 name="arrow-right" size={14} color="#10B981" />
              <Text style={styles.correctedWord}>{match.replacement}</Text>
            </View>
            <Text style={styles.matchType}>
              {match.type === 'spelling' ? '拼写' :
               match.type === 'grammar' ? '语法' :
               match.type === 'article' ? '冠词' :
               match.type === 'tense' ? '时态' : '用法'}
            </Text>
          </View>
          <FontAwesome6 name="rotate" size={14} color="#9CA3AF" />
        </Animated.View>

        <Animated.View
          style={[
            styles.matchBack,
            { transform: [{ rotateY: backInterpolate }] },
          ]}
        >
          <Text style={styles.explanation}>{explanation}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  inputSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  clearText: {
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    minHeight: 120,
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 14,
    gap: 8,
  },
  checkButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsToggle: {
    fontSize: 13,
    color: '#4F46E5',
  },
  correctedText: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  correctedTextContent: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 24,
  },
  correctedHighlight: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  learnButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  learnButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  detailsSection: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  matchCard: {
    height: 80,
    marginBottom: 10,
  },
  matchFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
  },
  matchBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  matchContent: {
    flex: 1,
  },
  matchPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strikeThrough: {
    position: 'relative',
  },
  originalWord: {
    fontSize: 15,
    color: '#EF4444',
    textDecorationLine: 'line-through',
  },
  strikeLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF4444',
  },
  correctedWord: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
  },
  matchType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  explanation: {
    fontSize: 14,
    color: '#4F46E5',
    textAlign: 'center',
  },
  noErrors: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noErrorsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
  },
});
