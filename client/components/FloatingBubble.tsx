/**
 * Floating Bubble Component
 * The draggable floating button that opens the quick panel
 * 
 * Simplified version using GestureHandler for better performance
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 56;
const EDGE_MARGIN = 20;

export default function FloatingBubble() {
  const { isPanelExpanded, setPanelExpanded, hasClipboardContent } = useApp();
  const insets = useSafeAreaInsets();
  
  // Animation values - use useState for refs
  const [panX] = useState(() => new Animated.Value(0));
  const [panY] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const [pulseAnim] = useState(() => new Animated.Value(1));
  
  // Track drag state
  const isDraggingRef = useRef(false);
  const lastDyRef = useRef(0);
  const positionRef = useRef({ x: 0, y: 0 });
  
  // Initial position
  const initialX = -(SCREEN_WIDTH / 2 - BUBBLE_SIZE / 2 - EDGE_MARGIN);
  const initialY = 0;
  
  // Set initial position
  useEffect(() => {
    panX.setValue(initialX);
    panY.setValue(initialY);
    positionRef.current = { x: initialX, y: initialY };
  }, [panX, panY, initialX, initialY]);

  // Pulse animation when clipboard has content
  useEffect(() => {
    if (hasClipboardContent && !isPanelExpanded) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [hasClipboardContent, isPanelExpanded, pulseAnim]);

  // Handle touch events
  const handlePressIn = useCallback(() => {
    if (isPanelExpanded) return;
    Animated.spring(scale, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  }, [isPanelExpanded, scale]);

  const handlePressOut = useCallback(() => {
    if (isPanelExpanded) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isPanelExpanded, scale]);

  const handlePress = useCallback(() => {
    if (!isPanelExpanded) {
      setPanelExpanded(true);
    }
  }, [isPanelExpanded, setPanelExpanded]);

  // Vertical bounds
  const minY = -SCREEN_HEIGHT / 2 + insets.top + BUBBLE_SIZE / 2 + EDGE_MARGIN;
  const maxY = SCREEN_HEIGHT / 2 - insets.bottom - BUBBLE_SIZE / 2 - EDGE_MARGIN - 100;

  // Snap to edges
  const snapToEdge = useCallback((currentY: number) => {
    let targetX = positionRef.current.x;
    const targetY = Math.max(minY, Math.min(maxY, currentY));
    
    // Snap to nearest edge horizontally
    if (targetX < 0) {
      targetX = initialX;
    } else {
      targetX = SCREEN_WIDTH / 2 - BUBBLE_SIZE / 2 - EDGE_MARGIN;
    }
    
    positionRef.current = { x: targetX, y: targetY };
    
    Animated.parallel([
      Animated.spring(panX, {
        toValue: targetX,
        useNativeDriver: true,
      }),
      Animated.spring(panY, {
        toValue: targetY,
        useNativeDriver: true,
      }),
    ]).start();
  }, [panX, panY, initialX, minY, maxY]);

  // Pan responder callbacks stored in refs
  const onMoveRef = useRef<(dy: number) => void>(() => {
    // Default no-op
  });
  const onEndRef = useRef<(dy: number) => void>(() => {
    // Default no-op
  });
  
  onMoveRef.current = (dy: number) => {
    if (!isDraggingRef.current) return;
    lastDyRef.current = dy;
    panY.setValue(positionRef.current.y + dy);
  };
  
  onEndRef.current = (dy: number) => {
    isDraggingRef.current = false;
    handlePressOut();
    snapToEdge(positionRef.current.y + dy);
  };

  // If panel is expanded, don't show bubble
  if (isPanelExpanded) {
    return null;
  }

  const combinedScale = Animated.multiply(scale, pulseAnim);
  const adjustedPanY = Animated.add(panY, new Animated.Value(-SCREEN_HEIGHT / 2 + insets.top + BUBBLE_SIZE));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: panX },
            { translateY: adjustedPanY },
            { scale: combinedScale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.bubble,
          hasClipboardContent && styles.bubbleActive,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={() => onEndRef.current?.(lastDyRef.current)}
        activeOpacity={0.9}
      >
        <View style={styles.innerCircle}>
          <View style={styles.gIcon}>
            <View style={styles.gTop} />
            <View style={styles.gBottom} />
          </View>
        </View>
        
        {/* Red notification dot */}
        {hasClipboardContent && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    top: '40%',
    zIndex: 1000,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bubbleActive: {
    backgroundColor: '#6366F1',
  },
  innerCircle: {
    width: BUBBLE_SIZE - 16,
    height: BUBBLE_SIZE - 16,
    borderRadius: (BUBBLE_SIZE - 16) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gIcon: {
    width: 24,
    height: 28,
    position: 'relative',
  },
  gTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#fff',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  gBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
