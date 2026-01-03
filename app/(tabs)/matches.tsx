import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react'; 
import { useRouter } from 'expo-router';
import { Alert, Dimensions, FlatList, Pressable, StatusBar, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Matches = () => {
  const router = useRouter();
  const candidates = useQuery(api.matches.getPotentialMatches); 

  const rewind = useMutation(api.matches.rewindLastRejection);
  const handleRewind = async () => {
    try {
      const result = await rewind();
      if (result) {
        Alert.alert("Success", "Profile Rewound! The user should reappear in your stack.");
      } else {
        Alert.alert("Info", "Nothing to rewind.");
      }
    } catch {
      Alert.alert("Error", "Failed to rewind.");
    }
  };

  if (candidates === null) {
    return (
      <View className='flex-1 justify-center items-center bg-background'>
        <Text className='text-red-500 font-semibold text-lg'>Sign in to view matches.</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>
        {/* Header */}
        <View className='px-6 pt-6 pb-4 flex-row justify-between items-center'>
          <Text className='font-bold text-5xl text-text-primary tracking-tighter'>Discovery</Text>
          <Pressable
            onPress={handleRewind}
            className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
          >
            <Text className="text-2xl">↺</Text>
          </Pressable>
        </View>

        {/* Carousel */}
        {candidates === undefined ? (
          <View className='flex-1 justify-center items-center'>
            <Text>Loading matches...</Text>
          </View>
        ) : candidates.length === 0 ? (
          <View className='flex-1 justify-center items-center px-6'>
            <Text className='text-xl font-semibold text-gray-500 text-center'>No updates for now.</Text>
            <Text className='text-gray-400 mt-2 text-center'>Check back later for new profiles.</Text>
          </View>
        ) : (
          <FlatList
            data={candidates}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            bounces={false}
            renderItem={({ item }) => (
              <View style={{ width: width }} className='items-center justify-start pt-2 px-4'>
                <Pressable
                  onPress={() => router.push(`/match/${item._id}` as `/match/${string}`)} className='w-full h-[72vh] bg-surface-muted rounded-[32px] overflow-hidden relative shadow-sm border border-border/50 active:opacity-90'
                >
                  {/* Photo Placeholder Area */}
                  <View className='flex-1 bg-brand/5 w-full' >
                    {item.photos && item.photos.length > 0 ? (
                      <Image source={{ uri: item.photos[0] }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="flex-1" />
                    )}
                  </View>

                  {/* Content Overlay */}
                  <View className='absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent'>
                    <View className='flex-col'>
                      {/* Shared Locations Pill */}
                      {item.sharedLocations && item.sharedLocations.length > 0 && (
                        <View className='self-start bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full mb-3 flex-row items-center gap-1.5 border border-white/30'>
                          <Text className='text-base'>📍</Text>
                          <Text className='text-white font-semibold text-sm'>
                            {item.sharedLocations.length} Shared {item.sharedLocations.length === 1 ? 'Place' : 'Places'}
                          </Text>
                        </View>
                      )}
                      <Text className='text-6xl text-white font-bold tracking-tight'>
                        {item.name}, {item.age}
                      </Text>
                      <Text className='text-gray-200 text-lg mt-1 opacity-90' numberOfLines={2}>{item.bio}</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default Matches;