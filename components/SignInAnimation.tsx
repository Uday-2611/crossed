import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface BlobProps {
    color: string;
    size: number;
    initialX: number;
    initialY: number;
    delay?: number;
    duration?: number;
}

const Blob = ({
    color,
    size,
    initialX,
    initialY,
    delay = 0,
    duration = 5000,
}: BlobProps) => {
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Continuous random movement
        translateX.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(initialX + Math.random() * 150 - 75, { duration: duration, easing: Easing.inOut(Easing.quad) }),
                    withTiming(initialX - Math.random() * 150 + 75, { duration: duration * 1.2, easing: Easing.inOut(Easing.quad) }),
                    withTiming(initialX, { duration: duration, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        );

        translateY.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(initialY + Math.random() * 150 - 75, { duration: duration * 1.1, easing: Easing.inOut(Easing.quad) }),
                    withTiming(initialY - Math.random() * 150 + 75, { duration: duration, easing: Easing.inOut(Easing.quad) }),
                    withTiming(initialY, { duration: duration * 1.2, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        );

        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.3, { duration: duration, easing: Easing.inOut(Easing.quad) }),
                    withTiming(0.9, { duration: duration * 1.5, easing: Easing.inOut(Easing.quad) }),
                    withTiming(1, { duration: duration, easing: Easing.inOut(Easing.quad) })
                ),
                -1,
                true
            )
        );
    }, [delay, duration, initialX, initialY, scale, translateY, translateX]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
        };
    });

    return (
        <Animated.View style={[styles.blob, animatedStyle]} />
    );
};

export const SignInAnimation = () => {
    // Colors from brand: '#F6F8F7', '#E9F0EE', '#7FB3A2', '#1F6F5C'
    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Background base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F6F8F7' }]} />

            {/* Large Blobs for Fluid Effect */}
            {/* Dark Brand Green */}
            <Blob
                color="#1F6F5C"
                size={width * 1.0}
                initialX={-width * 0.3}
                initialY={-height * 0.2}
                duration={8000}
            />

            {/* Light Brand Green */}
            <Blob
                color="#7FB3A2"
                size={width * 1.1}
                initialX={width * 0.2}
                initialY={height * 0.1}
                delay={1000}
                duration={9000}
            />

            {/* Light Grayish/Whiteish */}
            <Blob
                color="#E9F0EE"
                size={width * 1.2}
                initialX={-width * 0.2}
                initialY={height * 0.5}
                delay={2000}
                duration={10000}
            />

            {/* Accent Dark Green - bottom right */}
            <Blob
                color="#1F6F5C"
                size={width * 0.9}
                initialX={width * 0.4}
                initialY={height * 0.6}
                delay={500}
                duration={8500}
            />

            {/* BlurView for Fluidity */}
            {/* Intensity needs to be high to merge them. 'heavy' or numeric (Android support varies) */}
            <BlurView
                intensity={Platform.OS === 'ios' ? 80 : 30}
                style={StyleSheet.absoluteFill}
                tint="light"
                experimentalBlurMethod='dimezisBlurView' // Helps on Android sometimes
            />
        </View>
    );
};

const styles = StyleSheet.create({
    blob: {
        position: 'absolute',
        opacity: 0.8, // Slightly transparent to blend
    },
});
