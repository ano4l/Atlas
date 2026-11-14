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

export function useFeedback() {
  const { haptics } = useContext(FeedbackContext);
  return useCallback(
    (kind: "selection" | "success" = "selection") => {
      if (!haptics) return;
      const feedback =
        kind === "success"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          : Haptics.selectionAsync();
      void feedback.catch(() => {});
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
          toValue: 0.98,
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
