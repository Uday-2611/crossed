import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock Data
const MATCHES = [
  { id: '1', name: 'Sophie', message: 'That cafe looks amazing!', time: '2m' },
  { id: '2', name: 'Alex', message: 'When are you free next?', time: '1h' },
  { id: '3', name: 'Nora', message: 'Haha exactly!', time: '3h' },
];

const LIKED_YOU = [
  { id: '4', name: 'Jessica' },
  { id: '5', name: 'David' },
  { id: '6', name: 'Emily' },
  { id: '7', name: 'Michael' },
];

const Chats = () => {
  const router = useRouter();
  return (
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>
        {/* Header */}

        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>

          <View className='px-6 pt-4 pb-4'>
            <Text className='font-bold text-4xl text-text-primary tracking-tight'>Matches</Text>
          </View>

          {/* Section 1: Matches (Active Chats) */}
          <View className='px-6 mb-8'>
            {MATCHES.length === 0 ? (
              <View className='items-center py-8'>
                <Text className='text-gray-400 text-base text-center'>
                  No matches yet. Start swiping to find connections!
                </Text>
              </View>
            ) : (
              <View className='gap-6'>
                {MATCHES.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    className='flex-row items-center gap-4 active:opacity-70'
                    onPress={() => router.push(`/chat/${match.id}`)}
                  >
                    {/* Avatar Placeholder */}
                    <View className='h-16 w-16 rounded-full bg-gray-200 items-center justify-center border border-gray-100'>
                      <Ionicons name="person" size={24} color="#9CA3AF" />
                    </View>

                    {/* Text Content */}
                    <View className='flex-1 justify-center border-b border-gray-100 pb-4'>
                      <View className='flex-row justify-between items-center mb-1'>
                        <Text className='font-bold text-lg text-text-primary'>{match.name}</Text>
                        <Text className='text-xs text-gray-400 font-medium'>{match.time}</Text>
                      </View>
                      <Text className='text-base text-gray-500 truncate leading-5' numberOfLines={1}>
                        {match.message}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View className='px-6 pt-4 pb-4'>
            <Text className='font-bold text-4xl text-black tracking-tight'>Liked You</Text>
          </View>

          {/* Section 2: Liked You */}
          <View className='px-6 mb-10'>
            {LIKED_YOU.length === 0 ? (
              <View className='items-center py-8'>
                <Text className='text-gray-400 text-base text-center'>
                  No pending likes. Check back later!
                </Text>
              </View>
            ) : (
              <View className='gap-6'>
                {LIKED_YOU.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    className='flex-row items-center gap-4 active:opacity-70'
                    accessibilityRole="button"
                    accessibilityLabel={`${user.name} liked your profile. Tap to view`}
                    onPress={() => router.push(`/match/${user.id}`)}
                  >
                    {/* Avatar Placeholder */}
                    <View className='h-16 w-16 rounded-full bg-gray-100 items-center justify-center border border-gray-50 opacity-80'>
                      <Ionicons name="heart" size={20} color="#D1D5DB" />
                    </View>

                    {/* Text Content */}
                    <View className='flex-1 justify-center border-b border-gray-50 pb-4'>
                      <Text className='font-bold text-lg text-black/80 mb-1'>{user.name}</Text>
                      <Text className='text-base text-gray-400 font-medium'>
                        Liked your profile
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Chats;