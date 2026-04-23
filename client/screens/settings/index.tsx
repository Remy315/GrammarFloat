/**
 * Settings Screen
 * App settings and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useApp } from '@/contexts/AppContext';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useSafeRouter();
  const { defaultMode, setDefaultMode, clearHistory } = useApp();
  
  const [settings, setSettings] = useState({
    clipboardMonitoring: true,
    hapticFeedback: true,
    autoDetectLanguage: true,
    soundEffects: false,
  });

  // Handle setting change
  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle default mode change
  const handleModeChange = () => {
    const newMode = defaultMode === 'auto' ? 'learn' : 'auto';
    setDefaultMode(newMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Handle clear data
  const handleClearData = () => {
    Alert.alert(
      '清除数据',
      '确定要清除所有历史记录和缓存吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('成功', '数据已清除');
          },
        },
      ]
    );
  };

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
        <Text style={styles.title}>设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Default mode section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>默认模式</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleModeChange}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <FontAwesome6 name="sliders" size={16} color="#4F46E5" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>语法检查默认模式</Text>
                  <Text style={styles.settingSubtitle}>
                    {defaultMode === 'auto' ? '自动修正模式' : '学习模式'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.modeIndicator,
                { backgroundColor: defaultMode === 'auto' ? '#10B981' : '#4F46E5' }
              ]}>
                <Text style={styles.modeIndicatorText}>
                  {defaultMode === 'auto' ? 'A' : 'L'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Behavior section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>行为设置</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <FontAwesome6 name="clipboard" size={16} color="#EF4444" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>剪贴板监听</Text>
                  <Text style={styles.settingSubtitle}>复制文本后自动提示</Text>
                </View>
              </View>
              <Switch
                value={settings.clipboardMonitoring}
                onValueChange={(v) => handleSettingChange('clipboardMonitoring', v)}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={settings.clipboardMonitoring ? '#4F46E5' : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <FontAwesome6 name="hand" size={16} color="#F59E0B" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>触觉反馈</Text>
                  <Text style={styles.settingSubtitle}>操作时的震动反馈</Text>
                </View>
              </View>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(v) => handleSettingChange('hapticFeedback', v)}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={settings.hapticFeedback ? '#4F46E5' : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <FontAwesome6 name="language" size={16} color="#10B981" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>自动检测语言</Text>
                  <Text style={styles.settingSubtitle}>翻译时自动识别输入语言</Text>
                </View>
              </View>
              <Switch
                value={settings.autoDetectLanguage}
                onValueChange={(v) => handleSettingChange('autoDetectLanguage', v)}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={settings.autoDetectLanguage ? '#4F46E5' : '#9CA3AF'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                  <FontAwesome6 name="volume-high" size={16} color="#A855F7" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>音效</Text>
                  <Text style={styles.settingSubtitle}>操作音效提示</Text>
                </View>
              </View>
              <Switch
                value={settings.soundEffects}
                onValueChange={(v) => handleSettingChange('soundEffects', v)}
                trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                thumbColor={settings.soundEffects ? '#4F46E5' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearData}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <FontAwesome6 name="trash" size={16} color="#EF4444" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                    清除历史记录
                  </Text>
                  <Text style={styles.settingSubtitle}>删除所有检查和翻译记录</Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                  <FontAwesome6 name="info" size={16} color="#4F46E5" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>版本</Text>
                  <Text style={styles.settingSubtitle}>1.0.0</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <FontAwesome6 name="star" size={16} color="#10B981" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>给我们评分</Text>
                  <Text style={styles.settingSubtitle}>喜欢我们的应用吗？</Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <FontAwesome6 name="envelope" size={16} color="#F59E0B" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>联系我们</Text>
                  <Text style={styles.settingSubtitle}>问题反馈与建议</Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>GrammarFloat</Text>
          <Text style={styles.footerSubtext}>让语法学习变得简单有趣</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  modeIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});
