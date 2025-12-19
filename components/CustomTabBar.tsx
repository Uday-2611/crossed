import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_WIDTH = 65;
const PADDING = 8;

function TabButton({
    route,
    isFocused,
    onPress,
}: {
    route: any;
    isFocused: boolean;
    onPress: () => void;
}) {
    const iconMap: Record<string, string> = {
        matches: 'heart-outline',
        chats: 'chatbox-outline',
        profile: 'person-outline',
        settings: 'settings-outline',
    };

    const iconName = iconMap[route.name] || 'help-circle-outline';

    // Animate width ONLY
    const animatedStyle = useAnimatedStyle(() => ({
        width: withTiming(isFocused ? 150 : 65, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        }),
    }));

    const iconColor = isFocused ? '#000000' : '#9AA8A3';

    return (
        <Pressable onPress={onPress}>
            <Animated.View
                style={[
                    {
                        height: 60,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: 30,
                    },
                    animatedStyle,
                ]}
            >
                <Ionicons
                    name={iconName as any}
                    size={28}
                    color={iconColor}
                    style={{ marginRight: isFocused ? 8 : 0 }}
                />

                {isFocused && (
                    <Animated.Text
                        entering={FadeIn.duration(200).delay(50)}
                        exiting={FadeOut.duration(50)}
                        style={{
                            color: '#000000',
                            fontSize: 16,
                            fontWeight: '600',
                        }}
                        numberOfLines={1}
                    >
                        {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
                    </Animated.Text>
                )}
            </Animated.View>
        </Pressable>
    );
}


export function CustomTabBar({ state, navigation }: any) {
    const insets = useSafeAreaInsets();

    // Shared indicator animation
    const indicatorStyle = useAnimatedStyle(() => {
        // The position is simply the number of collapsed tabs before the active one * collapsed width
        // plus the padding offset.
        const translateX = withSpring(PADDING + state.index * TAB_WIDTH, {
            damping: 15,
            stiffness: 100,
            mass: 0.5
        });

        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={{
                position: 'absolute',
                bottom: insets.bottom - 12,
                left: 10,
                right: 10,
                alignItems: 'center',
            }}
        >
            <View
                className="flex-row bg-black rounded-full p-2 items-center"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                }}
            >
                {/* Shared Sliding Indicator */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: 0,
                            top: PADDING, // Match vertical padding
                            height: 60,
                            width: 150, // Match expanded width
                            backgroundColor: 'white',
                            borderRadius: 30,
                            zIndex: 0,
                        },
                        indicatorStyle
                    ]}
                />

                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TabButton
                            key={route.key}
                            route={route}
                            isFocused={isFocused}
                            onPress={onPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}
