import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const MOCK_PROFILES = [
  { id: '1', name: 'James', age: 24, bio: 'Coffee enthusiast & designer' },
  { id: '2', name: 'Maya', age: 22, bio: 'Nature lover' },
  { id: '3', name: 'Liam', age: 25, bio: 'Musician based in NYC' },
  { id: '4', name: 'Elena', age: 23, bio: 'Art history major' },
  { id: '5', name: 'Marcus', age: 26, bio: 'Chef' },
];

const Matches = () => {
  const router = useRouter();
  return (
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>
        {/* Header */}
        <View className='px-6 pt-6 pb-4'>
          <Text className='font-bold text-5xl text-text-primary tracking-tighter'>Discovery</Text>
        </View>

        {/* Carousel */}
        <FlatList
          data={MOCK_PROFILES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
          renderItem={({ item }) => (
            <View style={{ width: width }} className='items-center justify-start pt-2 px-4'>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/match/${item.id}`)}
                className='w-full h-[72vh] bg-surface-muted rounded-[32px] overflow-hidden relative shadow-sm border border-border/50'
              >
                {/* Photo Placeholder Area */}
                <View className='flex-1 bg-brand/5 w-full' />

                {/* Content Overlay */}
                <View className='absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/5 to-transparent'>
                  <View className='flex-col'>
                    <Text className='text-6xl text-text-primary font-bold tracking-tight'>
                      {item.name}, {item.age}
                    </Text>
                    <Text className='text-text-secondary text-lg mt-1 opacity-80'>{item.bio}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  )
}

export default Matches