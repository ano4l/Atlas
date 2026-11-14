import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  ViewProps,
} from "react-native";
import * as Haptics from "expo-haptics";

export const FeedbackContext = createContext({
  reducedMotion: false,
  haptics: true,
});

const animationOptions = {
  useNativeDriver: Platform.OS !== "web",
  isInteraction: false,
};

export type FeedbackKind =
  | "selection"
  | "success"
  | "turn"
  | "warning"
  | "error";

// Android's impact and notification calls are only simulated with the raw
// vibrator, so Android uses the system haptic constants instead.
const androidHaptic: Record<FeedbackKind, Haptics.AndroidHaptics> = {
  selection: Haptics.AndroidHaptics.Context_Click,
  success: Haptics.AndroidHaptics.Confirm,
  turn: Haptics.AndroidHaptics.Long_Press,
  warning: Haptics.AndroidHaptics.Reject,
  error: Haptics.AndroidHaptics.Reject,
};

function playFeedback(kind: FeedbackKind) {
  if (Platform.OS === "android")
    return Haptics.performAndroidHapticsAsync(androidHaptic[kind]);
  switch (kind) {
    case "success":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case "warning":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case "error":
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case "turn":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    default:
      return Haptics.selectionAsync();
  }
}

export function useFeedback() {
  const { haptics } = useContext(FeedbackContext);
  return useCallback(
    (kind: FeedbackKind = "selection") => {
      if (!haptics) return;
      void playFeedback(kind).catch(() => {});
    },
    [haptics],
  );
}

/** A short entrance from the surface's anchor, with glass-safe full opacity. */
export function MotionSurface({
  children,
  style,
  origin = "bottom",
  ...props
}: ViewProps & {
  origin?: "top" | "bottom" | "center";
}) {
  const { reducedMotion } = useContext(FeedbackContext);
  const [entrance] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));
  const motionStyle = useMemo(() => {
    const movement = entrance.interpolate({
      inputRange: [0, 1],
      outputRange:
        origin === "center" ? [0.985, 1] : [origin === "top" ? -10 : 12, 0],
    });
    return {
      transform:
        origin === "center"
          ? [{ scale: movement }]
          : [{ translateY: movement }],
    };
  }, [entrance, origin]);

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    const animation = Animated.timing(entrance, {
      ...animationOptions,
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, reducedMotion]);
  return (
    <Animated.View {...props} style={[style, !reducedMotion && motionStyle]}>
      {children}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/** Tactile feedback for prominent actions, never a delay before onPress. */
export function MotionPressable({
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps) {
  const { reducedMotion } = useContext(FeedbackContext);
  const [pressed, setPressed] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  const pressStyle = useMemo(() => ({ transform: [{ scale }] }), [scale]);
  const updatePress = (next: boolean) => {
    if (typeof style === "function") setPressed(next);
    if (reducedMotion || disabled) return;

    // A new animation takes over from the current scale during a quick re-press.
    const animation = next
      ? Animated.timing(scale, {
          ...animationOptions,
          toValue: 0.97,
          duration: 65,
          easing: Easing.out(Easing.quad),
        })
      : Animated.spring(scale, {
          ...animationOptions,
          toValue: 1,
          stiffness: 380,
          damping: 28,
          mass: 0.7,
          overshootClamping: true,
        });
    animation.start();
  };
  useEffect(() => {
    if (reducedMotion || disabled) scale.setValue(1);
    return () => scale.stopAnimation();
  }, [disabled, reducedMotion, scale]);
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        updatePress(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        updatePress(false);
        onPressOut?.(event);
      }}
      style={[
        typeof style === "function"
          ? style({ pressed: pressed && !disabled })
          : style,
        !reducedMotion && pressStyle,
      ]}
    />
  );
}
