import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  PressableProps,
  ViewProps,
} from "react-native";
import * as Haptics from "expo-haptics";

export const FeedbackContext = createContext({
  reducedMotion: false,
  haptics: true,
});
export function useFeedback() {
  const { haptics } = useContext(FeedbackContext);
  return (kind: "selection" | "success" = "selection") => {
    if (!haptics) return;
    // Feedback must never delay an action or fail the navigation flow.
    const feedback =
      kind === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.selectionAsync();
    void feedback.catch(() => {});
  };
}

/** Small, interruptible entrance; no perpetual animation on the map. */
export function MotionSurface({ children, style, ...props }: ViewProps) {
  const { reducedMotion } = useContext(FeedbackContext);
  const entrance = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    entrance.stopAnimation();
    if (reducedMotion) entrance.setValue(1);
    else
      Animated.timing(entrance, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    return () => entrance.stopAnimation();
  }, [entrance, reducedMotion]);
  return (
    <Animated.View
      {...props}
      style={[
        style,
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/** Tactile feedback for prominent actions, never a delay before onPress. */
export function MotionPressable({
  style,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps) {
  const { reducedMotion } = useContext(FeedbackContext);
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: reducedMotion ? 1 : value,
      duration: value === 1 ? 140 : 80,
      useNativeDriver: true,
    }).start();
  };
  useEffect(() => {
    if (reducedMotion) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [reducedMotion, scale]);
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        setPressed(true);
        animate(0.98);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        animate(1);
        onPressOut?.(event);
      }}
      style={[
        typeof style === "function" ? style({ pressed }) : style,
        { transform: [{ scale }] },
      ]}
    />
  );
}
