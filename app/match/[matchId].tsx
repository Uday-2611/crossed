import { SafetyMenu } from '@/components/SafetyMenu';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data for the Profile
const MOCK_PROFILE = {
  id: 'u1',
  name: 'Maya',
  age: 22,
  bio: "Enjoys quiet cafés, evening walks, and sticking to a comfortable routine. Always up for a good book or a spontaneous trip to the coast.",
  photos: [1, 2, 3], // Placeholders
  details: [
    { label: 'Height', value: "5'7\"" },
    { label: 'Job', value: 'UX Designer' },
    { label: 'Location', value: 'Brooklyn, NY' },
    { label: 'Education', value: 'Parsons' },
    { label: 'Gender', value: 'Woman' },
    { label: 'Religion', value: 'Spiritual' },
  ],
  sharedLocations: ['Central Park', 'Think Coffee', 'Prospect Park'],
  activities: ['Running', 'Reading', 'Photography', 'Jazz'],
};

const MatchProfile = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { matchId } = useLocalSearchParams(); // In a real app, use this ID to fetch data
  const [menuVisible, setMenuVisible] = useState(false);

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
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>

        {/* Header */}
        <View className='px-6 pt-2 pb-4 flex-row justify-between items-center'>
          <TouchableOpacity onPress={() => router.back()} className='flex-row items-center gap-2'>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className='font-bold text-xl text-black'>{MOCK_PROFILE.name}, {MOCK_PROFILE.age}</Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </TouchableOpacity>
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
              {MOCK_PROFILE.photos.map((photo, index) => (
                <View
                  key={index}
                  style={{ width: width * 0.9, height: 450 }}
                  className='bg-gray-200 rounded-3xl relative overflow-hidden shadow-sm border border-gray-100'
                >
                  <View className='absolute inset-0 items-center justify-center'>
                    <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* SECTION 2: Bio */}
          <View className='px-6 mb-8'>
            <Text className='text-base text-gray-800 leading-7 font-normal'>
              {MOCK_PROFILE.bio}
            </Text>
          </View>

          {/* SECTION 3: Personal Details */}
          <View className='px-6 mb-8'>
            <Text className='text-lg font-bold text-black mb-4'>Details</Text>
            <View className='flex-row flex-wrap gap-3'>
              {MOCK_PROFILE.details.map((detail, index) => (
                <View key={index} className='bg-white px-4 py-3 rounded-2xl border border-gray-100 flex-row gap-2 items-center shadow-sm'>
                  <Text className='text-gray-400 font-medium text-sm'>{detail.label}</Text>
                  <Text className='text-black font-semibold text-sm'>{detail.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4: Shared Locations */}
          <View className='px-6 mb-8'>
            <Text className='text-lg font-bold text-black mb-4'>Shared locations</Text>
            <View className='flex-row flex-wrap gap-2'>
              {MOCK_PROFILE.sharedLocations.map((loc, index) => (
                <View key={index} className='bg-white px-4 py-2.5 rounded-full border border-gray-200'>
                  <Text className='text-gray-700 font-medium'>{loc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 5: Activities */}
          <View className='px-6 mb-8'>
            <Text className='text-lg font-bold text-black mb-4'>Activities</Text>
            <View className='flex-row flex-wrap gap-2'>
              {MOCK_PROFILE.activities.map((activity, index) => (
                <View key={index} className='bg-gray-200 px-4 py-2.5 rounded-full'>
                  <Text className='text-black font-medium'>{activity}</Text>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* SECTION 6: Action Buttons (Fixed) */}
        <View className="absolute bottom-0 left-0 w-full">
          <LinearGradient
            colors={['rgba(249, 250, 251, 0)', 'rgba(249, 250, 251, 0.9)']}
            style={{ width: '100%', paddingHorizontal: 32, paddingBottom: 40, paddingTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 32 }}
          >
            <Pressable
              className='h-16 w-16 bg-white rounded-full items-center justify-center shadow-md border border-gray-100'
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            >
              <Ionicons name="close" size={32} color="#9CA3AF" />
            </Pressable>

            <Pressable
              className='h-16 w-16 bg-brand rounded-full items-center justify-center shadow-md'
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            >
              <Ionicons name="heart" size={30} color="#22C55E" />
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
    </View>
  );
};

export default MatchProfile;

// TODO: Add Shared element transition.