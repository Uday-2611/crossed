import { SafetyMenu } from '@/components/SafetyMenu';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StatusBar, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MatchProfile = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { matchId } = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);

  // Cast matchId to Id<"profiles"> (Safe because we control navigation)
  const profileId = matchId as Id<"profiles">;

  // Query with proper ID
  const profile = useQuery(api.matches.getProfileWithDetails, { profileId });
  const likeMutation = useMutation(api.matches.likeProfile);
  const passMutation = useMutation(api.matches.passProfile);

  // Animation Values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);
  const [actionType, setActionType] = useState<'like' | 'pass' | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const finishAction = async (type: 'like' | 'pass') => {
    try {
      if (type === 'like') {
        const result = await likeMutation({ targetId: profileId });
        if (result.status === 'matched') {
          // Match Alert
          Alert.alert("It's a Match! 🎉", "You and " + profile?.name + " liked each other!", [
            { text: "Awesome", onPress: () => router.back() }
          ]);
        } else {
          router.back();
        }
      } else {
        await passMutation({ targetId: profileId });
        router.back();
      }
    } catch (error) {
      console.error("Action error:", error);
      router.back(); // Fallback
    }
  };

  const handleLike = () => {
    setActionType('like');
    // Animate Right
    overlayOpacity.value = withTiming(1, { duration: 150 });
    translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 300 }, () => {
      runOnJS(finishAction)('like');
    });
  };

  const handlePass = () => {
    setActionType('pass');
    // Animate Left
    overlayOpacity.value = withTiming(1, { duration: 150 });
    translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 300 }, () => {
      runOnJS(finishAction)('pass');
    });
  };

  if (!profile) {
    return (
      <View className='flex-1 items-center justify-center bg-white'>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Transform flat profile to details
  const details = [
    { label: 'Height', value: profile.height ? `${profile.height} cm` : 'N/A' },
    { label: 'Job', value: profile.occupation || 'N/A' },
    { label: 'Location', value: profile.location || 'N/A' },
    { label: 'Education', value: profile.university || 'N/A' },
    { label: 'Gender', value: profile.gender || 'N/A' },
    { label: 'Religion', value: profile.religion || 'N/A' },
  ].filter(d => d.value !== 'N/A');

  const photos = profile.photos || [];
  // Type Safe Access (no 'as any')
  const sharedLocations = profile.sharedLocations || [];

  const handleUnmatch = () => {
    setMenuVisible(false);
    Alert.alert(
      "Unmatch this user?",
      "This will remove this match and you won’t be able to chat anymore.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unmatch", style: "destructive", onPress: () => router.replace('/(tabs)/matches') }
      ]
    );
  };

  const handleBlock = () => {
    setMenuVisible(false);
    Alert.alert(
      "Block this user?",
      "They won't be able to see your profile or message you.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => router.replace('/(tabs)/matches') }
      ]
    );
  };

  const handleReport = () => {
    setMenuVisible(false);
    router.push(`/report/${matchId}` as any);
  };

  return (
    <View className='flex-1 bg-background relative'>
      <StatusBar barStyle="dark-content" />

      {/* Action Overlay */}
      <Animated.View style={[overlayStyle]} className='absolute inset-0 z-50 flex items-center justify-center pointer-events-none'>
        {actionType === 'like' && (
          <View className='bg-green-500/20 w-full h-full items-center justify-center'>
            <Ionicons name="heart" size={120} color="#22C55E" />
          </View>
        )}
        {actionType === 'pass' && (
          <View className='bg-red-500/20 w-full h-full items-center justify-center'>
            <Ionicons name="close" size={120} color="#EF4444" />
          </View>
        )}
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <SafeAreaView className='flex-1' edges={['top']}>
          {/* Header */}
          <View className='px-6 pt-2 pb-4 flex-row justify-between items-center'>
            <Pressable onPress={() => router.back()} className='flex-row items-center gap-2 active:opacity-50'>
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <Text className='font-bold text-xl text-black'>{profile.name}, {profile.age}</Text>
            <Pressable onPress={() => setMenuVisible(true)} className="active:opacity-50">
              <Ionicons name="ellipsis-horizontal" size={24} color="black" />
            </Pressable>
          </View>

          <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

            {/* SECTION 1: Profile Photos (Gallery) */}
            <View className='mb-8'>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={width * 0.9 + 12}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              >
                {photos.length > 0 ? photos.map((photo: string, index: number) => (
                  <View
                    key={index}
                    style={{ width: width * 0.9, height: 450 }}
                    className='bg-gray-200 rounded-3xl relative overflow-hidden shadow-sm border border-gray-100'
                  >
                    <Image
                      source={{ uri: photo }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                )) : (
                  <View
                    style={{ width: width * 0.9, height: 450 }}
                    className='bg-gray-200 rounded-3xl relative overflow-hidden shadow-sm border border-gray-100 items-center justify-center'
                  >
                    <Ionicons name="person" size={80} color="#9CA3AF" />
                  </View>
                )}
              </ScrollView>
            </View>

            {/* SECTION 2: Bio */}
            <View className='px-6 mb-8'>
              <Text className='text-base text-gray-800 leading-7 font-normal'>
                {profile.bio || "No bio yet."}
              </Text>
            </View>

            {/* SECTION 3: PERSONAL DETAILS */}
            <View className='px-6 mb-8'>
              <Text className='text-lg font-bold text-black mb-4'>Details</Text>
              <View className='flex-row flex-wrap gap-3'>
                {details.map((detail, index) => (
                  <View key={index} className='bg-white px-4 py-3 rounded-2xl border border-gray-100 flex-row gap-2 items-center shadow-sm'>
                    <Text className='text-gray-400 font-medium text-sm'>{detail.label}</Text>
                    <Text className='text-black font-semibold text-sm'>{detail.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* SECTION 4: SHARED LOCATIONS */}
            {sharedLocations.length > 0 && (
              <View className='px-6 mb-8'>
                <Text className='text-lg font-bold text-black mb-4'>Shared locations</Text>
                <View className='flex-col gap-3'>
                  {sharedLocations.map((loc: string, index: number) => (
                    <View key={index} className='bg-white p-4 rounded-2xl border border-gray-100 flex-row items-center gap-3 shadow-sm'>
                      <View className='w-10 h-10 bg-green-50 rounded-full items-center justify-center'>
                        <Ionicons name="location-sharp" size={20} color="#10B981" />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-black font-semibold text-base'>{loc}</Text>
                        <Text className='text-gray-500 text-sm'>You both visited here</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* SECTION 5: ACTIVITIES */}
            <View className='px-6 mb-8'>
              <Text className='text-lg font-bold text-black mb-4'>Activities</Text>
              <View className='flex-row flex-wrap gap-2'>
                {(profile.activities || []).map((activity: string, index: number) => (
                  <View key={index} className='bg-gray-200 px-4 py-2.5 rounded-full'>
                    <Text className='text-black font-medium'>{activity}</Text>
                  </View>
                ))}
              </View>
            </View>

          </ScrollView>

          {/* SECTION 6: ACTION BUTTONS */}
          <View className="absolute bottom-0 left-0 w-full">
            <LinearGradient
              colors={['rgba(249, 250, 251, 0)', 'rgba(249, 250, 251, 0.9)']}
              style={{ width: '100%', paddingHorizontal: 32, paddingBottom: 40, paddingTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 32 }}
            >
              <Pressable
                onPress={() => handlePass()}
                className='h-16 w-16 bg-white rounded-full items-center justify-center shadow-md border border-gray-100 active:scale-95'
                accessibilityLabel="Pass on this profile"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={32} color="#EF4444" />
              </Pressable>

              <Pressable
                onPress={() => handleLike()}
                className='h-16 w-16 bg-brand rounded-full items-center justify-center shadow-md active:scale-95'
                style={{ backgroundColor: '#22C55E' }}
                accessibilityLabel="Like this profile"
                accessibilityRole="button"
              >
                <Ionicons name="heart" size={30} color="white" />
              </Pressable>
            </LinearGradient>
          </View>

          <SafetyMenu
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            onUnmatch={handleUnmatch}
            onBlock={handleBlock}
            onReport={handleReport}
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

export default MatchProfile;