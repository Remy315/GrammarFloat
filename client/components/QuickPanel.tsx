/**
 * Quick Panel Component
 * The main floating panel with grammar check and translate options
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function QuickPanel() {
  const { 
    isPanelExpanded, 
    setPanelExpanded, 
    hasClipboardContent, 
    clipboardText,
    history,
  } = useApp();
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPanelExpanded) {
      // Open animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(contentScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isPanelExpanded, slideAnim, backdropAnim, contentScale, contentOpacity]);

  const handleClose = () => {
    setPanelExpanded(false);
  };

  const handleGrammarCheck = () => {
    setPanelExpanded(false);
    if (clipboardText) {
      router.push('/grammar-check', { text: clipboardText });
    } else {
      router.push('/grammar-check');
    }
  };

  const handleTranslate = () => {
    setPanelExpanded(false);
    if (clipboardText) {
      router.push('/translate', { text: clipboardText });
    } else {
      router.push('/translate');
    }
  };

  const handleHistoryPress = (item: typeof history[0]) => {
    setPanelExpanded(false);
    if (item.type === 'grammar') {
      router.push('/grammar-check', { 
        text: item.original,
        result: item.result,
      });
    } else {
      router.push('/translate', {
        text: item.original,
        result: item.result,
      });
    }
  };

  if (!isPanelExpanded) {
    return null;
  }

  return (
    <Modal
      visible={isPanelExpanded}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              paddingBottom: insets.bottom + 20,
              transform: [
                { translateY: slideAnim },
                { scale: contentScale },
              ],
              opacity: contentOpacity,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>G</Text>
                </View>
                <Text style={styles.title}>GrammarFloat</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <FontAwesome6 name="xmark" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Clipboard indicator */}
          {hasClipboardContent && (
            <View style={styles.clipboardIndicator}>
              <FontAwesome6 name="clipboard" size={14} color="#4F46E5" />
              <Text style={styles.clipboardText} numberOfLines={1}>
                {clipboardText.substring(0, 50)}...
              </Text>
            </View>
          )}

          {/* Main action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.grammarButton]}
              onPress={handleGrammarCheck}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(79, 70, 229, 0.15)' }]}>
                <FontAwesome6 name="spell-check" size={24} color="#4F46E5" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>语法检查</Text>
                <Text style={styles.actionSubtitle}>Grammar Check</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.translateButton]}
              onPress={handleTranslate}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <FontAwesome6 name="language" size={24} color="#10B981" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>翻译</Text>
                <Text style={styles.actionSubtitle}>Translate</Text>
              </View>
              <FontAwesome6 name="chevron-right" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* History section */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>最近记录</Text>
              {history.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/history')}>
                  <Text style={styles.viewAll}>查看全部</Text>
                </TouchableOpacity>
              )}
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <FontAwesome6 name="clock-rotate-left" size={24} color="#D1D5DB" />
                <Text style={styles.emptyText}>暂无历史记录</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyList}
              >
                {history.slice(0, 10).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.historyCard}
                    onPress={() => handleHistoryPress(item)}
                  >
                    <View style={[
                      styles.historyTypeTag,
                      { backgroundColor: item.type === 'grammar' ? '#EEF2FF' : '#ECFDF5' }
                    ]}>
                      <Text style={[
                        styles.historyTypeText,
                        { color: item.type === 'grammar' ? '#4F46E5' : '#10B981' }
                      ]}>
                        {item.type === 'grammar' ? '语法' : '翻译'}
                      </Text>
                    </View>
                    <Text style={styles.historyOriginal} numberOfLines={2}>
                      {item.original}
                    </Text>
                    <Text style={styles.historyResult} numberOfLines={1}>
                      {item.result}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Settings row */}
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              setPanelExpanded(false);
              router.push('/settings');
            }}
          >
            <View style={styles.settingsLeft}>
              <FontAwesome6 name="gear" size={18} color="#6B7280" />
              <Text style={styles.settingsText}>设置</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipboardIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  clipboardText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#4F46E5',
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  grammarButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  translateButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  historySection: {
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  viewAll: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  historyList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  historyCard: {
    width: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
  },
  historyTypeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  historyTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyOriginal: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
    marginBottom: 6,
  },
  historyResult: {
    fontSize: 11,
    color: '#6B7280',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#4B5563',
  },
});
