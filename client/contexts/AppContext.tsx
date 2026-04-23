/**
 * GrammarFloat App Context
 * Manages global app state including floating window UI and clipboard monitoring
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

interface HistoryItem {
  id: string;
  type: 'grammar' | 'translate';
  original: string;
  result: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AppContextType {
  // Floating window state
  isPanelExpanded: boolean;
  setPanelExpanded: (expanded: boolean) => void;
  
  // Clipboard state
  hasClipboardContent: boolean;
  clipboardText: string;
  checkClipboard: () => Promise<void>;
  
  // History
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // User settings
  defaultMode: 'auto' | 'learn';
  setDefaultMode: (mode: 'auto' | 'learn') => void;
  
  // Device ID for history
  deviceId: string;
  
  // Toast/feedback
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate or retrieve persistent device ID
async function getOrCreateDeviceId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem('@grammarfloat_device_id');
    if (stored) {
      return stored;
    }
    // Generate a simple device ID
    const id = 'user_' + Math.random().toString(36).substring(2, 15);
    await AsyncStorage.setItem('@grammarfloat_device_id', id);
    return id;
  } catch {
    return 'anonymous_' + Date.now();
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isPanelExpanded, setPanelExpanded] = useState(false);
  const [hasClipboardContent, setHasClipboardContent] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [defaultMode, setDefaultMode] = useState<'auto' | 'learn'>('auto');
  const [deviceId, setDeviceId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: string } | null>(null);
  
  const lastClipboardContent = useRef<string>('');
  const clipboardTextRef = useRef<string>('');
  const hasClipboardRef = useRef<boolean>(false);
  const clipboardInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize device ID and load history
  useEffect(() => {
    const init = async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
      
      // Load history from storage
      try {
        const stored = await AsyncStorage.getItem('@grammarfloat_history');
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
      
      // Load default mode
      try {
        const mode = await AsyncStorage.getItem('@grammarfloat_default_mode');
        if (mode === 'learn' || mode === 'auto') {
          setDefaultMode(mode);
        }
      } catch (e) {
        console.error('Failed to load default mode:', e);
      }
    };
    init();
  }, []);

  // Check clipboard periodically
  const checkClipboardInternal = useCallback(async () => {
    try {
      const content = await Clipboard.getStringAsync();
      if (content && content.trim() !== lastClipboardContent.current) {
        lastClipboardContent.current = content;
        clipboardTextRef.current = content;
        hasClipboardRef.current = content.length > 0;
        
        // Vibrate to indicate new content
        if (content.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      console.error('Clipboard check error:', e);
    }
  }, []);

  // Sync clipboard state (called when interval triggers)
  const syncClipboardState = useCallback(() => {
    setClipboardText(clipboardTextRef.current);
    setHasClipboardContent(hasClipboardRef.current);
  }, []);

  // Start clipboard monitoring when panel is expanded
  useEffect(() => {
    if (isPanelExpanded) {
      clipboardInterval.current = setInterval(() => {
        checkClipboardInternal();
        syncClipboardState();
      }, 2000);
    } else {
      if (clipboardInterval.current) {
        clearInterval(clipboardInterval.current);
        clipboardInterval.current = null;
      }
    }
    
    return () => {
      if (clipboardInterval.current) {
        clearInterval(clipboardInterval.current);
      }
    };
  }, [isPanelExpanded, checkClipboardInternal, syncClipboardState]);

  // Add item to history
  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 20); // Keep last 20
      // Persist to storage
      AsyncStorage.setItem('@grammarfloat_history', JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem('@grammarfloat_history').catch(console.error);
  }, []);

  // Update default mode
  const updateDefaultMode = useCallback((mode: 'auto' | 'learn') => {
    setDefaultMode(mode);
    AsyncStorage.setItem('@grammarfloat_default_mode', mode).catch(console.error);
  }, []);

  // Show toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isPanelExpanded,
        setPanelExpanded,
        hasClipboardContent,
        clipboardText,
        checkClipboard: checkClipboardInternal,
        history,
        addToHistory,
        clearHistory,
        defaultMode,
        setDefaultMode: updateDefaultMode,
        deviceId,
        showToast,
      }}
    >
      {children}
      {/* Toast notification */}
      {toastMessage && (
        <ToastMessage message={toastMessage.message} type={toastMessage.type} />
      )}
    </AppContext.Provider>
  );
}

// Toast component
function ToastMessage({ message, type }: { message: string; type: string }) {
  const backgroundColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#6366F1';
  
  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
}

// Import Animated and Text for Toast
import { Animated, Text } from 'react-native';

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { AppContext };
