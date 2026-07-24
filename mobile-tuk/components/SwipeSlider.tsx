import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 80;
const BUTTON_WIDTH = 64;

export default function SwipeSlider({ onSwipeComplete, theme, text = "Slide to Start Trip" }: { onSwipeComplete: () => void, theme: any, text?: string }) {
    const translateX = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationX > 0 && event.translationX < SLIDE_WIDTH - BUTTON_WIDTH) {
                translateX.value = event.translationX;
            }
        })
        .onEnd(() => {
            if (translateX.value > (SLIDE_WIDTH - BUTTON_WIDTH) * 0.7) {
                translateX.value = withSpring(SLIDE_WIDTH - BUTTON_WIDTH);
                runOnJS(onSwipeComplete)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={[styles.sliderContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.sliderText, { color: theme.icon }]}>{text}</Text>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.sliderButton, animatedStyle, { backgroundColor: theme.tint }]}>
                    <ChevronRight color="#fff" size={24} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    sliderContainer: {
        width: SLIDE_WIDTH,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        position: 'relative'
    },
    sliderText: {
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.6
    },
    sliderButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: BUTTON_WIDTH,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    }
});
