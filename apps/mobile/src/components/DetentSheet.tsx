import React, {
  forwardRef,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, Theme } from "../theme";
import { GlassSurface } from "./GlassSurface";
import { FeedbackContext, MotionPressable, useFeedback } from "./Motion";

/** 0 shows the header and footer only, 1 adds the summary, 2 shows everything. */
export type Detent = 0 | 1 | 2;
export type DetentSheetHandle = { snapTo: (detent: Detent) => void };

const panelGap = 8;
// The map stays visible above a fully raised sheet.
const mapSliver = 56;
const detentSpring = {
  damping: 28,
  stiffness: 320,
  mass: 0.85,
  overshootClamping: true,
};

type Props = {
  theme: Theme;
  /** Names the content for the grabber's accessibility label. */
  label: string;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Body height in points at the middle detent. Defaults to 28% of the window. */
  mediumHeight?: number;
  initialDetent?: Detent;
  onDetentChange?: (detent: Detent) => void;
  /** Settled height for camera framing. It stops growing at the middle detent. */
  onHeightChange: (height: number) => void;
  /** Per-frame height for controls that ride above the sheet. */
  liveHeight?: SharedValue<number>;
  /** Slide up on mount. The sheet never fades, because glass cannot. */
  animateIn?: boolean;
};

// Translate only: a fading ancestor stops the system glass from rendering.
const rise = () => {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: 44 }] },
    animations: {
      transform: [
        { translateY: withSpring(0, { damping: 24, stiffness: 260, mass: 0.9 }) },
      ],
    },
  };
};

/**
 * The single bottom sheet. The header and footer stay visible, and the body
 * between them resizes across three detents. Dragging works from the whole
 * surface, except while the fully raised body is scrolling its own content.
 */
export const DetentSheet = forwardRef<DetentSheetHandle, Props>(
  function DetentSheet(
    {
      theme,
      label,
      header,
      footer,
      children,
      mediumHeight,
      initialDetent = 1,
      onDetentChange,
      onHeightChange,
      liveHeight,
      animateIn,
    },
    ref,
  ) {
    const { height: windowHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { reducedMotion } = useContext(FeedbackContext);
    const feedback = useFeedback();
    const [detent, setDetent] = useState<Detent>(initialDetent);
    const [chromeHeight, setChromeHeight] = useState({ header: 0, footer: 0 });
    const [contentHeight, setContentHeight] = useState(0);
    const measured = useRef(false);
    const current = useRef<Detent>(initialDetent);

    const fixed =
      chromeHeight.header + chromeHeight.footer + StyleSheet.hairlineWidth * 2;
    const large = Math.max(
      0,
      Math.min(
        contentHeight,
        windowHeight - insets.top - mapSliver - fixed - panelGap,
      ),
    );
    const medium = Math.min(mediumHeight ?? windowHeight * 0.28, large);
    const target = detent === 0 ? 0 : detent === 1 ? medium : large;
    // The body scrolls only when it is fully raised and still overflows.
    const scrollable = contentHeight > large + 1 && target >= large;

    const body = useSharedValue(0);
    const dragStart = useSharedValue(0);

    useEffect(() => {
      // The first measurement places the sheet without an entrance resize.
      if (!measured.current || reducedMotion) {
        cancelAnimation(body);
        body.value = target;
        if (contentHeight > 0 && (target > 0 || detent === 0))
          measured.current = true;
      } else {
        body.value = withSpring(target, detentSpring);
      }
    }, [body, contentHeight, detent, reducedMotion, target]);

    useEffect(() => {
      onHeightChange(fixed + Math.min(target, medium) + panelGap);
    }, [fixed, medium, onHeightChange, target]);
    useAnimatedReaction(
      () => fixed + Math.min(body.value, medium) + panelGap,
      (value) => {
        if (liveHeight) liveHeight.value = value;
      },
    );

    const commit = useCallback(
      (next: Detent) => {
        if (current.current !== next) feedback();
        current.current = next;
        setDetent(next);
        onDetentChange?.(next);
      },
      [feedback, onDetentChange],
    );
    useImperativeHandle(ref, () => ({ snapTo: commit }), [commit]);

    // Back lowers a raised sheet before the app handles it.
    useEffect(() => {
      if (detent !== 2 || large <= medium) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          commit(1);
          return true;
        },
      );
      return () => subscription.remove();
    }, [commit, detent, large, medium]);

    const makeDrag = (enabled: boolean) =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY([-8, 8])
        .failOffsetX([-18, 18])
        .onStart(() => {
          cancelAnimation(body);
          dragStart.value = body.value;
        })
        .onUpdate(({ translationY }) => {
          if (reducedMotion) return;
          const raw = Math.max(0, dragStart.value - translationY);
          // Past the top detent the sheet follows the finger with resistance.
          body.value = raw > large ? large + (raw - large) * 0.2 : raw;
        })
        .onEnd(({ translationY, velocityY }, success) => {
          // Project the release so a flick carries to the next detent.
          const projected = success
            ? dragStart.value - translationY - velocityY * 0.12
            : dragStart.value;
          const stops = [0, medium, large];
          let next = 0;
          for (let index = 1; index < 3; index++)
            if (
              Math.abs(stops[index] - projected) <
              Math.abs(stops[next] - projected)
            )
              next = index;
          body.value = reducedMotion
            ? stops[next]
            : withSpring(stops[next], { ...detentSpring, velocity: -velocityY });
          runOnJS(commit)(next as Detent);
        });
    const headerDrag = makeDrag(true);
    const footerDrag = makeDrag(true);
    const bodyDrag = makeDrag(!scrollable);

    const bodyStyle = useAnimatedStyle(() => ({ height: body.value }));
    const raised = detent === 2 || large <= medium;
    const cycle = () => commit(detent === 0 ? 1 : raised ? 0 : 2);

    return (
      <Animated.View
        entering={animateIn && !reducedMotion ? rise : undefined}
        style={styles.sheet}
      >
        <GlassSurface theme={theme} variant="panel" style={styles.surface}>
        <GestureDetector gesture={headerDrag}>
          <View
            onLayout={(event) => {
              const next = event.nativeEvent.layout.height;
              setChromeHeight((heights) =>
                heights.header === next ? heights : { ...heights, header: next },
              );
            }}
          >
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{ expanded: detent > 0 }}
              accessibilityLabel={
                detent === 0
                  ? `Expand ${label}`
                  : raised
                    ? `Collapse ${label}`
                    : `Show all of ${label}`
              }
              onPress={cycle}
              style={styles.handle}
            >
              <View
                style={[styles.grabber, { backgroundColor: theme.muted }]}
              />
            </MotionPressable>
            {header}
          </View>
        </GestureDetector>
        <Animated.View
          style={[styles.clip, !footer && styles.clipEnd, bodyStyle]}
        >
          <GestureDetector gesture={bodyDrag}>
            <ScrollView
              accessibilityElementsHidden={detent === 0}
              importantForAccessibility={
                detent === 0 ? "no-hide-descendants" : "auto"
              }
              scrollEnabled={scrollable}
              showsVerticalScrollIndicator={scrollable}
              onContentSizeChange={(_, next) => setContentHeight(next)}
              style={{ height: large }}
            >
              {children}
            </ScrollView>
          </GestureDetector>
        </Animated.View>
        {footer && (
          <GestureDetector gesture={footerDrag}>
            <View
              onLayout={(event) => {
                const next = event.nativeEvent.layout.height;
                setChromeHeight((heights) =>
                  heights.footer === next
                    ? heights
                    : { ...heights, footer: next },
                );
              }}
            >
              {footer}
            </View>
          </GestureDetector>
        )}
        </GlassSurface>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  sheet: { position: "absolute", bottom: panelGap, left: 10, right: 10 },
  surface: { borderRadius: radius.sheet + 4 },
  handle: { height: 22, alignItems: "center", justifyContent: "center" },
  grabber: { width: 38, height: 5, borderRadius: 3, opacity: 0.32 },
  clip: { overflow: "hidden" },
  clipEnd: {
    borderCurve: "continuous",
    borderBottomLeftRadius: radius.sheet + 4,
    borderBottomRightRadius: radius.sheet + 4,
  },
});
