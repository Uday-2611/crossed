import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const Chats = () => {
  const router = useRouter();

  // Queries
  const pendingLikes = useQuery(api.matches.getPendingLikers);
  const conversations = useQuery(api.chat.getConversations);

  // Mutations
  const likeProfile = useMutation(api.matches.likeProfile);
  const passProfile = useMutation(api.matches.passProfile);

  const handleLike = async (id: Id<"profiles">) => {
    try {
      await likeProfile({ targetId: id });
    } catch (error) {
      console.error('Failed to like profile:', error);
    }
  };

  const handlePass = async (id: Id<"profiles">) => {
    try {
      await passProfile({ targetId: id });
    } catch (error) {
      console.error('Failed to pass profile:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // < 24h
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // < 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View className='flex-1 bg-white'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>

        <View className="px-6 py-4 border-b border-gray-100">
          <Text className="text-3xl font-bold tracking-tight text-gray-900">Chats</Text>
        </View>

        <ScrollView
          className='flex-1'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >

          {/* SECTION 1: LIKED YOU (Horizontal) */}
          <View className='mt-6 mb-2'>
            <View className="px-6 flex-row justify-between items-end mb-4">
              <Text className='font-bold text-xl text-gray-900'>Liked You</Text>
              <Text className="text-brand-primary font-medium">{pendingLikes?.length || 0}</Text>
            </View>

            {(!pendingLikes || pendingLikes.length === 0) ? (
              <View className="px-6 py-4">
                <Text className="text-gray-400">No new likes yet.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 12 }}
              >
                {pendingLikes.map((profile) => (
                  <View key={profile._id} className="mr-4 w-40 relative">
                    <View className="h-52 w-40 rounded-2xl overflow-hidden bg-gray-200 relative shadow-sm">
                      {profile.photos?.[0] ? (
                        <Image
                          source={{ uri: profile.photos[0] }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-200">
                          <Ionicons name="person" size={40} color="#9CA3AF" />
                        </View>
                      )}

                      {/* Overlay Gradient (Optional, but adding slight scrim for text) */}
                      <View className="absolute bottom-0 w-full h-20 bg-black/40" />

                      <View className="absolute bottom-3 left-3">
                        <Text className="text-white font-bold text-lg shadow-sm">
                          {profile.name}, {profile.age}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="absolute -bottom-4 w-full flex-row justify-center gap-4">
                      <TouchableOpacity
                        onPress={() => handlePass(profile._id as Id<"profiles">)}
                        className="h-10 w-10 rounded-full bg-white shadow-md items-center justify-center border border-gray-100"
                      >
                        <Ionicons name="close" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleLike(profile._id as Id<"profiles">)}
                        className="h-10 w-10 rounded-full bg-white shadow-md items-center justify-center border border-gray-100"
                      >
                        <Ionicons name="heart" size={20} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                    <View className="h-4" /> {/* Spacer for buttons */}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* SECTION 2: MATCHES (Vertical) */}
          <View className='mt-6 px-6'>
            <Text className='font-bold text-xl text-gray-900 mb-4'>Matches</Text>

            {(!conversations || conversations.length === 0) ? (
              <View className="py-10 items-center justify-center opacity-50">
                <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 mt-2 text-center">
                  No matches yet.{'\n'}Start swiping to connect!
                </Text>
              </View>
            ) : (
              <View className='gap-4'>
                {conversations.map((conv) => (
                  <TouchableOpacity
                    key={conv._id}
                    onPress={() => router.push(`/chat/${conv._id}`)}
                    className="flex-row items-center bg-white"
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <View className="relative">
                      {conv.peer?.photos?.[0] ? (
                        <Image
                          source={{ uri: conv.peer.photos[0] }}
                          className="h-14 w-14 rounded-full bg-gray-200"
                        />
                      ) : (
                        <View className="h-14 w-14 rounded-full bg-gray-200 items-center justify-center">
                          <Ionicons name="person" size={24} color="#9CA3AF" />
                        </View>
                      )}
                      {/** Online Indicator Placeholder - Assuming we might add real online status later */}
                      {/* <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" /> */}
                    </View>

                    <View className="flex-1 ml-4 border-b border-gray-100 pb-4 pt-2">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-bold text-lg text-gray-900">
                          {conv.peer?.name}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {formatTime(conv.lastMessageAt)}
                        </Text>
                      </View>
                      <Text
                        className={`text-sm truncate ${conv.lastMessage ? 'text-gray-500' : 'text-brand-primary font-medium'}`}
                        numberOfLines={1}
                      >
                        {conv.lastMessage?.content || "Say hi 👋"}
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