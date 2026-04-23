/**
 * History Screen
 * Shows all grammar check and translation history
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useApp } from '@/contexts/AppContext';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface HistoryItem {
  id: string;
  type: 'grammar' | 'translate';
  original: string;
  result: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function HistoryScreen() {
  const router = useSafeRouter();
  const { history, clearHistory } = useApp();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'grammar' | 'translate'>('all');

  // Filter history
  const filteredHistory = history.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  // Handle clear all
  const handleClearAll = () => {
    Alert.alert(
      '清空历史',
      '确定要清空所有历史记录吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  // Handle item press
  const handleItemPress = useCallback((item: HistoryItem) => {
    if (item.type === 'grammar') {
      router.push('/grammar-check', { text: item.original, result: item.result });
    } else {
      router.push('/translate', { text: item.original, result: item.result });
    }
  }, [router]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // Parse result
  const parseResult = (item: HistoryItem) => {
    try {
      const parsed = JSON.parse(item.result);
      if (item.type === 'grammar') {
        return parsed.corrected || item.result;
      } else {
        return parsed.translated || item.result;
      }
    } catch {
      return item.result;
    }
  };

  // Render item
  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'grammar' ? '#EEF2FF' : '#ECFDF5' }
        ]}>
          <FontAwesome6
            name={item.type === 'grammar' ? 'spell-check' : 'language'}
            size={12}
            color={item.type === 'grammar' ? '#4F46E5' : '#10B981'}
          />
          <Text style={[
            styles.typeText,
            { color: item.type === 'grammar' ? '#4F46E5' : '#10B981' }
          ]}>
            {item.type === 'grammar' ? '语法' : '翻译'}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      
      <Text style={styles.originalText} numberOfLines={2}>
        {item.original}
      </Text>
      
      <Text style={styles.resultText} numberOfLines={1}>
        {parseResult(item)}
      </Text>
    </TouchableOpacity>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <FontAwesome6 name="clock-rotate-left" size={40} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>暂无历史记录</Text>
      <Text style={styles.emptyText}>
        你的语法检查和翻译记录将显示在这里
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.startButtonText}>开始使用</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen safeAreaEdges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome6 name="arrow-left" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>历史记录</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      {history.length > 0 && (
        <View style={styles.filterContainer}>
          {(['all', 'grammar', 'translate'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}>
                {filter === 'all' ? '全部' : filter === 'grammar' ? '语法检查' : '翻译'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* History list */}
      <FlatList
        data={filteredHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredHistory.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  listContentEmpty: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  originalText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
