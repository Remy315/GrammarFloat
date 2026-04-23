/**
 * Root Layout with Floating UI
 * Wraps the app with floating bubble and quick panel
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { AppProvider } from '@/contexts/AppContext';
import FloatingBubble from '@/components/FloatingBubble';
import QuickPanel from '@/components/QuickPanel';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <Provider>
      <AppProvider>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false
          }}
        >
          <Stack.Screen name="index" options={{ title: "" }} />
          <Stack.Screen name="grammar-check" options={{ title: "语法检查" }} />
          <Stack.Screen name="translate" options={{ title: "翻译" }} />
          <Stack.Screen name="learn" options={{ title: "学习模式" }} />
          <Stack.Screen name="history" options={{ title: "历史记录" }} />
          <Stack.Screen name="settings" options={{ title: "设置" }} />
        </Stack>
        <Toast />
        <FloatingBubble />
        <QuickPanel />
        <StatusBar style="dark" />
      </AppProvider>
    </Provider>
  );
}
