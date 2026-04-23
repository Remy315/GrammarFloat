/**
 * Home Screen - Quick Panel Entry Point
 * Acts as the main entry that triggers the floating bubble functionality
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { useApp } from '@/contexts/AppContext';

export default function HomeScreen() {
  const { setPanelExpanded } = useApp();

  // Auto-expand panel on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setPanelExpanded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [setPanelExpanded]);

  return (
    <Screen safeAreaEdges={['top', 'left', 'right']} statusBarStyle="light">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>
          </View>
          <Text style={styles.title}>GrammarFloat</Text>
          <Text style={styles.subtitle}>点击浮窗开始使用</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
});
