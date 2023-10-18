import React, { forwardRef, useCallback, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

import Animated, {
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { strings } from '../../../../../../../locales/i18n';
import Icon, {
  IconName,
  IconColor,
  IconSize,
} from '../../../../../../component-library/components/Icons/Icon';
import Text, {
  TextColor,
  TextVariant,
} from '../../../../../../component-library/components/Texts/Text';
import { useTheme } from '../../../../../../util/theme';
import createStyles from './ButtonConfirm.styles';

const animationDuration = 1200;

const AnimatedText = Animated.createAnimatedComponent(
  // eslint-disable-next-line react/display-name, react/prop-types
  forwardRef(({ children, ...props }, _ref) => (
    <Text
      variant={TextVariant.BodyLGMedium}
      color={TextColor.Inverse}
      {...props}
    >
      {children}
    </Text>
  )),
);

interface Props {
  onLongPress: () => void;
  disabled?: boolean;
}

const initialAnimationValue = 0;
const finishedAnimationValue = 1;

const ButtonConfirm = ({ onLongPress, disabled = false }: Props) => {
  // Pre-completed progress value
  const longPressProgress = useSharedValue(initialAnimationValue);
  // Completed progress value
  const pressedProgress = useSharedValue(initialAnimationValue);

  const { colors } = useTheme();
  const styles = createStyles(colors);

  // handleContainerOnLayout will set the container width on layout
  const [containerWidth, setContainerWidth] = React.useState(0);
  const handleContainerOnLayout = useCallback((event: any) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Post animation from long press
  useAnimatedReaction(
    () => longPressProgress.value,
    (val) => {
      if (val === finishedAnimationValue) {
        // Trigger post long press animation
        pressedProgress.value = withTiming(1, {
          duration: 400,
        });
      }
    },
  );

  // Trigger action from long press
  useAnimatedReaction(
    () => pressedProgress.value,
    (val) => {
      if (val === finishedAnimationValue) {
        // Trigger long press action
        runOnJS(onLongPress)();
      }
    },
  );

  // Button is pressed
  const triggerPressStart = useCallback(() => {
    longPressProgress.value = withTiming(finishedAnimationValue, {
      duration: animationDuration - longPressProgress.value * animationDuration,
    });
  }, [longPressProgress]);

  // Button is released
  const triggerPressEnd = useCallback(() => {
    if (longPressProgress.value < finishedAnimationValue) {
      longPressProgress.value = withTiming(initialAnimationValue, {
        duration: (longPressProgress.value * animationDuration) / 2,
      });
    }
  }, [longPressProgress]);

  useEffect(() => {
    if (disabled) {
      triggerPressEnd();
    }
  }, [disabled, triggerPressEnd]);

  const progressBarStyle = useAnimatedStyle(
    () => ({
      borderTopEndRadius: interpolate(
        longPressProgress.value,
        [0.8, 1],
        [0, 30],
      ),
      borderBottomEndRadius: interpolate(
        longPressProgress.value,
        [0.8, 1],
        [0, 30],
      ),
      opacity: interpolate(longPressProgress.value, [0, 1], [0.5, 1]),
      width: longPressProgress.value * containerWidth,
    }),
    [containerWidth],
  );
  const holdLabelStyle = useAnimatedStyle(
    () => ({
      // interpolate opacity
      opacity: interpolate(
        longPressProgress.value,
        [0, 0.02, 0.08],
        [1, 1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        },
      ),
    }),
    [containerWidth],
  );

  const confirmLabelStyle = useAnimatedStyle(
    () => ({
      // interpolate opacity
      opacity: interpolate(
        longPressProgress.value,
        [0, 0.08, 0.1, 0.99, 1],
        [0, 0, 1, 1, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        },
      ),
    }),
    [containerWidth],
  );

  const confirmedLabelStyle = useAnimatedStyle(
    () => ({
      // interpolate opacity
      opacity: interpolate(pressedProgress.value, [0, 1], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    }),
    [containerWidth],
  );

  const completedBackgroundStyle = useAnimatedStyle(() => {
    if (longPressProgress.value === 1) {
      return {
        backgroundColor: interpolateColor(
          pressedProgress.value,
          [0, 1],
          [colors.primary.alternative, colors.success.default],
        ),
      };
    }
    return {};
  });

  return (
    <TouchableOpacity
      onPressIn={triggerPressStart}
      onPressOut={triggerPressEnd}
      disabled={disabled}
      style={disabled ? styles.disabled : undefined}
      activeOpacity={1}
    >
      <Animated.View
        style={[styles.container]}
        onLayout={handleContainerOnLayout}
      >
        <Animated.View
          style={[
            styles.progressContainer,
            progressBarStyle,
            completedBackgroundStyle,
          ]}
        />
        <AnimatedText> </AnimatedText>
        <AnimatedText style={[styles.label, holdLabelStyle]}>
          {strings('fiat_on_ramp_aggregator.send_transaction.hold_to_send')}
        </AnimatedText>
        <AnimatedText style={[styles.label, confirmLabelStyle]}>
          {strings('fiat_on_ramp_aggregator.send_transaction.send')}
        </AnimatedText>
        <AnimatedText style={[styles.label, confirmedLabelStyle]}>
          <Icon
            name={IconName.CheckBold}
            color={IconColor.Inverse}
            size={IconSize.Sm}
          />{' '}
          {strings('fiat_on_ramp_aggregator.send_transaction.sent')}
        </AnimatedText>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default ButtonConfirm;
