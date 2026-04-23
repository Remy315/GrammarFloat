/**
 * Learning Mode Screen
 * Provides interactive grammar learning with exercises
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Easing,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { verifyAnswer } from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';
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

type SubMode = 'inline' | 'sentence';

export default function LearnScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    original: string;
    corrections: string;
  }>();
  
  // Parse corrections
  const [corrections, setCorrections] = useState<GrammarMatch[]>([]);
  const [subMode, setSubMode] = useState<SubMode>('inline');
  
  // Inline edit state
  const [editableIndices, setEditableIndices] = useState<Set<number>>(new Set());
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [correctedIndices, setCorrectedIndices] = useState<Set<number>>(new Set());
  
  // Sentence practice state
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentenceInput, setSentenceInput] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [sentenceResult, setSentenceResult] = useState<{
    isCorrect: boolean;
    feedback: string;
  } | null>(null);
  
  // Animation states
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);

  // Parse corrections on mount
  useEffect(() => {
    if (params.corrections) {
      try {
        const parsed = JSON.parse(params.corrections);
        setCorrections(parsed);
        setUserInputs(parsed.map(() => ''));
      } catch (e) {
        console.error('Failed to parse corrections:', e);
      }
    }
  }, [params.corrections]);

  // Trigger confetti animation
  const triggerConfetti = () => {
    setShowConfetti(true);
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setShowConfetti(false));
  };

  // Trigger shake animation
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Handle inline edit - make error index editable
  const handleMakeEditable = (index: number) => {
    const newEditable = new Set(editableIndices);
    newEditable.add(index);
    setEditableIndices(newEditable);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle inline edit - check answer
  const handleCheckInline = async (index: number) => {
    const match = corrections[index];
    const userAnswer = userInputs[index].trim();
    
    if (!userAnswer) {
      Toast.show({ type: 'error', text1: '请输入修正内容' });
      return;
    }

    try {
      const result = await verifyAnswer(
        match.original,
        userAnswer,
        match.replacement
      );

      if (result.isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newCorrected = new Set(correctedIndices);
        newCorrected.add(index);
        setCorrectedIndices(newCorrected);
        
        // Remove from editable
        const newEditable = new Set(editableIndices);
        newEditable.delete(index);
        setEditableIndices(newEditable);

        // Check if all complete
        if (newCorrected.size === corrections.length) {
          setIsCompleted(true);
          triggerConfetti();
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();
        Toast.show({
          type: 'error',
          text1: '答案不正确',
          text2: '请再试一次，或双击查看参考答案',
        });
      }
    } catch (e) {
      console.error('Verify error:', e);
    }
  };

  // Handle sentence practice - check answer
  const handleCheckSentence = async () => {
    if (!sentenceInput.trim()) {
      Toast.show({ type: 'error', text1: '请输入正确句子' });
      return;
    }

    setAttemptCount(prev => prev + 1);

    try {
      const result = await verifyAnswer(
        corrections[currentSentenceIndex]?.context || params.original,
        sentenceInput,
        corrections[currentSentenceIndex]?.replacement
      );

      setSentenceResult({
        isCorrect: result.isCorrect,
        feedback: result.feedback,
      });

      if (result.isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Animate slide out
        Animated.timing(slideAnim, {
          toValue: -400,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Move to next or complete
          if (currentSentenceIndex < corrections.length - 1) {
            setCurrentSentenceIndex(prev => prev + 1);
            setSentenceInput('');
            setSentenceResult(null);
            setAttemptCount(0);
            slideAnim.setValue(400);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          } else {
            setIsCompleted(true);
            triggerConfetti();
          }
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();
        
        // Show answer after 3 attempts
        if (attemptCount >= 2) {
          Toast.show({
            type: 'info',
            text1: '参考答案',
            text2: corrections[currentSentenceIndex].replacement,
          });
        }
      }
    } catch (e) {
      console.error('Verify error:', e);
    }
  };

  // Show answer for inline edit
  const handleShowAnswerInline = (index: number) => {
    const match = corrections[index];
    const newInputs = [...userInputs];
    newInputs[index] = match.replacement;
    setUserInputs(newInputs);
    
    // Mark as not counted for reward
    const newCorrected = new Set(correctedIndices);
    newCorrected.add(index);
    setCorrectedIndices(newCorrected);
    
    Toast.show({
      type: 'info',
      text1: '已显示参考答案',
      text2: '该题不再计入奖励',
    });
  };

  // Render inline edit mode
  const renderInlineMode = () => (
    <View style={styles.inlineMode}>
      <Text style={styles.instruction}>
        点击红色高亮区域，修正错误后点击确认
      </Text>
      
      {/* Original text with error highlights */}
      <View style={styles.textContainer}>
        <Animated.View style={[styles.textWrapper, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.originalText}>
            {corrections.map((match, index) => {
              const isCorrected = correctedIndices.has(index);
              const isEditable = editableIndices.has(index);
              
              if (isCorrected) {
                return (
                  <Text key={index}>
                    <Text style={styles.correctWord}>{match.replacement}</Text>
                    <Text style={styles.normalText}>{params.original.slice(match.index + match.length)}</Text>
                  </Text>
                );
              }
              
              // Find position in original string
              const beforeError = params.original.substring(0, match.index);
              const errorWord = params.original.substring(match.index, match.index + match.length);
              const afterError = params.original.substring(match.index + match.length);
              
              return (
                <Text key={index}>
                  <Text style={styles.normalText}>{beforeError}</Text>
                  {isEditable ? (
                    <Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={userInputs[index]}
                        onChangeText={(text) => {
                          const newInputs = [...userInputs];
                          newInputs[index] = text;
                          setUserInputs(newInputs);
                        }}
                        autoFocus
                        onSubmitEditing={() => handleCheckInline(index)}
                      />
                    </Text>
                  ) : (
                    <Text
                      style={styles.errorWord}
                      onPress={() => handleMakeEditable(index)}
                      onLongPress={() => handleShowAnswerInline(index)}
                    >
                      {errorWord}
                    </Text>
                  )}
                  <Text style={styles.normalText}>{afterError}</Text>
                </Text>
              );
            })}
          </Text>
        </Animated.View>
      </View>

      {/* Action buttons for selected error */}
      {editableIndices.size > 0 && (
        <View style={styles.inlineActions}>
          {Array.from(editableIndices).map((index) => (
            <TouchableOpacity
              key={index}
              style={styles.confirmButton}
              onPress={() => handleCheckInline(index)}
            >
              <FontAwesome6 name="check" size={16} color="#fff" />
              <Text style={styles.confirmButtonText}>确认修正</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Progress */}
      <View style={styles.progress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(correctedIndices.size / corrections.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {correctedIndices.size} / {corrections.length} 已修正
        </Text>
      </View>
    </View>
  );

  // Render sentence practice mode
  const renderSentenceMode = () => {
    const currentMatch = corrections[currentSentenceIndex];
    
    return (
      <View style={styles.sentenceMode}>
        <Text style={styles.instruction}>
          请重写正确的句子（第 {currentSentenceIndex + 1} / {corrections.length} 题）
        </Text>
        
        {/* Problem card */}
        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <View style={styles.problemBadge}>
              <FontAwesome6 name="pencil" size={12} color="#4F46E5" />
              <Text style={styles.problemBadgeText}>练习题</Text>
            </View>
            {attemptCount > 0 && (
              <Text style={styles.attemptText}>
                第 {attemptCount} 次尝试
              </Text>
            )}
          </View>
          
          <Text style={styles.problemText}>
            {currentMatch?.context || params.original}
          </Text>
          
          <TextInput
            style={[
              styles.sentenceInput,
              sentenceResult?.isCorrect === false && styles.sentenceInputError,
              sentenceResult?.isCorrect === true && styles.sentenceInputSuccess,
            ]}
            value={sentenceInput}
            onChangeText={setSentenceInput}
            placeholder="输入正确的句子..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          
          {sentenceResult && !sentenceResult.isCorrect && (
            <View style={styles.feedbackContainer}>
              <FontAwesome6 name="circle-exclamation" size={16} color="#EF4444" />
              <Text style={styles.feedbackText}>{sentenceResult.feedback}</Text>
            </View>
          )}
          
          {sentenceResult?.isCorrect && (
            <View style={styles.feedbackContainerSuccess}>
              <FontAwesome6 name="circle-check" size={16} color="#10B981" />
              <Text style={styles.feedbackTextSuccess}>{sentenceResult.feedback}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              sentenceResult?.isCorrect && styles.submitButtonSuccess,
            ]}
            onPress={handleCheckSentence}
            disabled={sentenceResult?.isCorrect}
          >
            <Text style={styles.submitButtonText}>
              {sentenceResult?.isCorrect ? '正确!' : '提交答案'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {corrections.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSentenceIndex && styles.dotActive,
                index < currentSentenceIndex && styles.dotCompleted,
              ]}
            />
          ))}
        </View>
      </View>
    );
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
          <Text style={styles.title}>学习模式</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sub-mode selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeTab, subMode === 'inline' && styles.modeTabActive]}
            onPress={() => setSubMode('inline')}
          >
            <Text style={[styles.modeTabText, subMode === 'inline' && styles.modeTabTextActive]}>
              原位修改
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, subMode === 'sentence' && styles.modeTabActive]}
            onPress={() => setSubMode('sentence')}
          >
            <Text style={[styles.modeTabText, subMode === 'sentence' && styles.modeTabTextActive]}>
              句子练习
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {subMode === 'inline' ? renderInlineMode() : renderSentenceMode()}
        </ScrollView>

        {/* Confetti overlay */}
        {showConfetti && (
          <View style={styles.confettiOverlay}>
            <ConfettiAnimation />
          </View>
        )}

        {/* Completion overlay */}
        {isCompleted && (
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <FontAwesome6 name="trophy" size={48} color="#F59E0B" />
              </View>
              <Text style={styles.completionTitle}>太棒了！</Text>
              <Text style={styles.completionText}>
                你已完成所有语法练习
              </Text>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => router.back()}
              >
                <Text style={styles.completionButtonText}>返回</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// Pre-generated confetti particles for consistent animation
const CONFETTI_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 300,
  delay: Math.random() * 500,
  color: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899'][
    Math.floor(Math.random() * 5)
  ],
}));

// Confetti animation component
function ConfettiAnimation() {
  return (
    <View style={styles.confettiContainer}>
      {CONFETTI_PARTICLES.map((p) => (
        <ConfettiParticle key={p.id} particle={p} />
      ))}
    </View>
  );
}

function ConfettiParticle({ particle }: { particle: { id: number; x: number; delay: number; color: string } }) {
  const anim = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(particle.delay),
      Animated.timing(anim, {
        toValue: 600,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, particle.delay]);

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          left: particle.x,
          backgroundColor: particle.color,
          transform: [{ translateY: anim }],
        },
      ]}
    />
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
  placeholder: {
    width: 36,
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeTabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  inlineMode: {},
  textContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textWrapper: {},
  originalText: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 32,
  },
  normalText: {
    fontSize: 18,
    color: '#1F2937',
  },
  errorWord: {
    fontSize: 18,
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  correctWord: {
    fontSize: 18,
    backgroundColor: '#D1FAE5',
    color: '#059669',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  inlineInput: {
    fontSize: 18,
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4F46E5',
    minWidth: 80,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  progress: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  sentenceMode: {},
  problemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  problemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  problemBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
  },
  attemptText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  problemText: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 28,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sentenceInput: {
    minHeight: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sentenceInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  sentenceInputSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
  },
  feedbackContainerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  feedbackTextSuccess: {
    fontSize: 13,
    color: '#10B981',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  submitButtonSuccess: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#4F46E5',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1000,
  },
  confettiContainer: {
    flex: 1,
    position: 'relative',
  },
  confettiParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  completionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  completionButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  completionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
