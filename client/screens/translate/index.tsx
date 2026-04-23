/**
 * Translation Screen
 * Provides Chinese-English translation with voice input
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useApp } from '@/contexts/AppContext';
import { translate as translateApi, detectLanguage } from '@/utils/api';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

type LanguageDirection = 'en-zh' | 'zh-en';

export default function TranslateScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ text?: string; result?: string }>();
  const { addToHistory } = useApp();
  
  // State
  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState<LanguageDirection>('en-zh');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    original: string;
    translated: string;
    sourceLang: 'en' | 'zh';
    targetLang: 'en' | 'zh';
  } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const flipAnim = useState(new Animated.Value(0))[0];
  
  // Auto-detect language
  const [autoDetect, setAutoDetect] = useState(true);

  // Load initial text from params
  useEffect(() => {
    if (params.text) {
      setInputText(params.text);
      if (params.result) {
        try {
          const parsed = JSON.parse(params.result);
          if (parsed.original && parsed.translated) {
            setResult(parsed);
            setDirection(
              parsed.sourceLang === 'en' ? 'en-zh' : 'zh-en'
            );
          }
        } catch {
          // Not JSON, ignore
        }
      }
    }
  }, [params.text, params.result]);

  // Detect language and set direction
  const detectAndSetDirection = useCallback(async (text: string) => {
    if (!autoDetect || !text.trim()) return;
    
    try {
      const { language } = await detectLanguage(text);
      setDirection(language === 'en' ? 'en-zh' : 'zh-en');
    } catch {
      // Keep current direction
    }
  }, [autoDetect]);

  // Handle input change
  const handleInputChange = (text: string) => {
    setInputText(text);
    setIsFlipped(false);
    detectAndSetDirection(text);
  };

  // Toggle direction
  const handleToggleDirection = () => {
    setDirection(prev => prev === 'en-zh' ? 'zh-en' : 'en-zh');
    setAutoDetect(false);
    setIsFlipped(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Translate
  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      Toast.show({
        type: 'error',
        text1: '请输入文本',
      });
      return;
    }

    setLoading(true);
    setIsFlipped(false);
    try {
      const targetLang = direction === 'en-zh' ? 'zh' : 'en';
      const response = await translateApi(inputText, targetLang);
      setResult(response);
      
      // Add to history
      addToHistory({
        type: 'translate',
        original: inputText,
        result: JSON.stringify(response),
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Translation error:', error);
      Toast.show({
        type: 'error',
        text1: '翻译失败',
        text2: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  }, [inputText, direction, addToHistory]);

  // Flip card animation
  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  // Copy result
  const handleCopy = async () => {
    if (!result) return;
    
    const textToCopy = isFlipped ? result.original : result.translated;
    await Clipboard.setStringAsync(textToCopy);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: '已复制到剪贴板',
    });
  };

  // Text-to-speech
  const handleSpeak = async () => {
    if (!result) return;
    
    const textToSpeak = isFlipped ? result.original : result.translated;
    const language = isFlipped ? result.sourceLang : result.targetLang;
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      language: language === 'en' ? 'en-US' : 'zh-CN',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  // Front and back interpolations
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    backfaceVisibility: 'hidden' as const,
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    backfaceVisibility: 'hidden' as const,
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
          <Text style={styles.title}>翻译</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Direction Toggle */}
        <View style={styles.directionContainer}>
          <TouchableOpacity
            style={[styles.directionButton, direction === 'en-zh' && styles.directionActive]}
            onPress={() => {
              setDirection('en-zh');
              setAutoDetect(false);
            }}
          >
            <Text style={[styles.directionText, direction === 'en-zh' && styles.directionTextActive]}>
              英文 → 中文
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleToggleDirection}
          >
            <FontAwesome6 name="right-left" size={14} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.directionButton, direction === 'zh-en' && styles.directionActive]}
            onPress={() => {
              setDirection('zh-en');
              setAutoDetect(false);
            }}
          >
            <Text style={[styles.directionText, direction === 'zh-en' && styles.directionTextActive]}>
              中文 → 英文
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>
              {direction === 'en-zh' ? '英文' : '中文'}
            </Text>
            {autoDetect && inputText.length > 0 && (
              <Text style={styles.autoDetected}>自动检测</Text>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder={direction === 'en-zh' ? '输入英文...' : '输入中文...'}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          
          {/* Voice Input Button */}
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={async () => {
                Toast.show({
                  type: 'info',
                  text1: '语音输入',
                  text2: '请使用系统语音输入功能',
                });
              }}
            >
              <FontAwesome6 name="microphone" size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.translateButton, !inputText.trim() && styles.translateButtonDisabled]}
              onPress={handleTranslate}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome6 name="arrows-spin" size={16} color="#fff" />
                  <Text style={styles.translateButtonText}>翻译</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Result Card */}
        {result && (
          <View style={styles.resultContainer}>
            <TouchableOpacity
              style={styles.resultCard}
              onPress={handleFlip}
              activeOpacity={0.95}
            >
              {/* Front - Translation */}
              <Animated.View style={[styles.resultFront, frontAnimatedStyle]}>
                <View style={styles.resultContent}>
                  <View style={styles.resultHeader}>
                    <View style={[
                      styles.langBadge,
                      { backgroundColor: direction === 'en-zh' ? '#ECFDF5' : '#EEF2FF' }
                    ]}>
                      <Text style={[
                        styles.langBadgeText,
                        { color: direction === 'en-zh' ? '#10B981' : '#4F46E5' }
                      ]}>
                        {direction === 'en-zh' ? 'EN' : 'ZH'}
                      </Text>
                    </View>
                    <Text style={styles.flipHint}>点击查看原文</Text>
                  </View>
                  <Text style={styles.resultText}>{result.translated}</Text>
                </View>
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={handleSpeak}
                  >
                    <FontAwesome6
                      name={isSpeaking ? 'stop-circle' : 'volume-high'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={handleCopy}
                  >
                    <FontAwesome6 name="copy" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Back - Original */}
              <Animated.View style={[styles.resultBack, backAnimatedStyle]}>
                <View style={styles.resultContent}>
                  <View style={styles.resultHeader}>
                    <View style={[
                      styles.langBadge,
                      { backgroundColor: direction === 'zh-en' ? '#ECFDF5' : '#EEF2FF' }
                    ]}>
                      <Text style={[
                        styles.langBadgeText,
                        { color: direction === 'zh-en' ? '#10B981' : '#4F46E5' }
                      ]}>
                        {direction === 'zh-en' ? 'EN' : 'ZH'}
                      </Text>
                    </View>
                    <Text style={styles.flipHint}>点击查看译文</Text>
                  </View>
                  <Text style={styles.resultText}>{result.original}</Text>
                </View>
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={handleSpeak}
                  >
                    <FontAwesome6
                      name={isSpeaking ? 'stop-circle' : 'volume-high'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={handleCopy}
                  >
                    <FontAwesome6 name="copy" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage tips */}
        <View style={styles.tips}>
          <FontAwesome6 name="lightbulb" size={14} color="#F59E0B" />
          <Text style={styles.tipsText}>
            点击结果卡片可翻转查看原文/译文
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  directionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  directionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  directionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  directionTextActive: {
    color: '#fff',
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  autoDetected: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  input: {
    minHeight: 100,
    maxHeight: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  translateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  translateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  resultContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultCard: {
    height: 220,
    position: 'relative',
  },
  resultFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  langBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  flipHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultText: {
    fontSize: 20,
    color: '#1F2937',
    lineHeight: 30,
    fontWeight: '400',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
