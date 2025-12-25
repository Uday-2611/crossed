import { SafetyMenu } from '@/components/SafetyMenu';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const conversationId = (typeof chatId === 'string' ? chatId : undefined) as Id<"conversations"> | undefined;

  // Convex
  const conversation = useQuery(api.chat.getConversation, conversationId ? { conversationId } : "skip");
  const messages = useQuery(api.chat.getMessages, conversationId ? { conversationId } : "skip");

  if (!conversationId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Invalid conversation</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <Text className="text-brand-primary">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sendMessage = useMutation(api.chat.sendMessage);
  const unmatchMutation = useMutation(api.matches.unmatch);
  const blockMutation = useMutation(api.matches.block);

  // State
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSafetyMenuOpen, setIsSafetyMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Actions
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText(''); // Optimistic clear

    try {
      await sendMessage({
        conversationId,
        content,
        type: 'text',
      });
    } catch (err) {
      Alert.alert("Error", "Failed to send message");
      setInputText(content); // Revert
    }
  };

  const handlePickImage = async (camera: boolean = false) => {
    setIsMenuOpen(false);

    let result;
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission Needed", "Camera access is required");
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission Needed", "Photo library access is required");
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    }
    if (!result.canceled && result.assets[0].uri) {
      setIsSending(true);
      try {
        const imageUrl = await uploadToCloudinary(result.assets[0].uri);
        await sendMessage({
          conversationId,
          content: imageUrl,
          type: 'image',
        });
      } catch (err) {
        Alert.alert("Upload Failed", "Could not send image");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleUnmatch = () => {
    setIsSafetyMenuOpen(false);
    Alert.alert(
      "Unmatch this user?",
      "This will remove this match and you won’t be able to chat anymore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              if (!conversation?.matchId) return;
              await unmatchMutation({ matchId: conversation.matchId as Id<"matches"> });
              router.replace('/(tabs)/chats');
            } catch (e) {
              Alert.alert("Error", "Failed to unmatch");
            }
          }
        }
      ]
    );
  };

  const handleBlock = () => {
    setIsSafetyMenuOpen(false);
    Alert.alert(
      "Block this user?",
      "They won't be able to see your profile or message you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            if (!conversation?.peer?._id) return;
            try {
              await blockMutation({ targetId: conversation.peer._id as Id<"profiles"> });
              router.replace('/(tabs)/chats');
            } catch (e) {
              Alert.alert("Error", "Failed to block");
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    setIsSafetyMenuOpen(false);
    if (!conversation?.peer?._id) return;
    router.push(`/report/${conversation.peer._id}`);
  };

  const goToProfile = () => {
    if (conversation?.peer?._id) {
      router.push(`/match/${conversation.peer._id}`);
    }
  };

  if (conversation === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (conversation === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Conversation not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <Text className="text-brand-primary">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-white'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>

        {/* Header */}
        <View className='px-4 py-3 flex-row items-center justify-between border-b border-gray-100 bg-white z-10'>
          <TouchableOpacity onPress={() => router.back()} className='p-2 -ml-2'>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToProfile} className="flex-row items-center">
            {conversation.peer?.photos?.[0] && (
              <Image
                source={{ uri: conversation.peer.photos[0] }}
                className="w-8 h-8 rounded-full mr-2 bg-gray-200"
              />
            )}
            <View>
              <Text className="text-[10px] text-green-600 font-medium">Online</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className='p-2 -mr-2' onPress={() => setIsSafetyMenuOpen(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          className='flex-1 px-4'
          inverted
          contentContainerStyle={{ paddingVertical: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            // peer is the other user in this conversation
            const isSelf = item.senderId !== conversation.peer?._id;
            return (
              <View className={`w-full flex-row ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <View
                  className={`max-w-[80%] rounded-2xl p-3 ${item.type === 'image' ? 'p-1 bg-transparent' :
                    isSelf ? 'bg-brand-primary rounded-tr-sm' : 'bg-gray-100 rounded-tl-sm'
                    }`}                >
                  {item.type === 'image' ? (
                    <TouchableOpacity onPress={() => {/* Fullscreen view logic */ }}>
                      <Image
                        source={{ uri: item.content }}
                        className="w-48 h-64 rounded-xl bg-gray-200"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Text className={`text-base leading-5 ${isSelf ? 'text-white' : 'text-gray-900'}`}>
                      {item.content}
                    </Text>
                  )}

                  {item.type !== 'image' && (
                    <Text className={`text-[10px] mt-1 ${isSelf ? 'text-green-100' : 'text-gray-400'} text-right`}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isSending ? <ActivityIndicator size="small" className="py-2" /> : null}
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          className='border-t border-gray-100 bg-white pb-6 pt-2'
        >
          <View className='flex-row items-end gap-2 px-3'>
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              className='h-10 w-10 items-center justify-center bg-gray-50 rounded-full mb-0.5'
            >
              <Ionicons name="add" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View className='flex-1 bg-gray-50 rounded-2xl px-4 py-2 min-h-[44px] justify-center border border-gray-100'>
              <TextInput
                className='text-base text-gray-900 max-h-24 leading-5'
                placeholder="Message..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`h-10 w-10 items-center justify-center rounded-full mb-0.5 ${inputText.trim() ? 'bg-green-500' : 'bg-gray-100'
                }`}
            >
              <Ionicons name="arrow-up" size={20} color={inputText.trim() ? 'white' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Media Sheet Modal */}
        <Modal
          visible={isMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View className='flex-1 bg-black/40 justify-end'>
              <TouchableWithoutFeedback>
                <View className='bg-white rounded-t-3xl p-6 pb-12 shadow-xl'>
                  <View className='w-12 h-1 bg-gray-300 rounded-full mx-auto mb-8' />
                  <View className='flex-row justify-around'>
                    <TouchableOpacity onPress={() => handlePickImage(false)} className='items-center'>
                      <View className="h-14 w-14 bg-green-100 items-center justify-center rounded-2xl mb-2">
                        <Ionicons name="images" size={24} color="#10B981" />
                      </View>
                      <Text className="font-medium text-gray-700">Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handlePickImage(true)} className='items-center'>
                      <View className="h-14 w-14 bg-blue-100 items-center justify-center rounded-2xl mb-2">
                        <Ionicons name="camera" size={24} color="#3B82F6" />
                      </View>
                      <Text className="font-medium text-gray-700">Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <SafetyMenu
          visible={isSafetyMenuOpen}
          onClose={() => setIsSafetyMenuOpen(false)}
          onUnmatch={handleUnmatch}
          onBlock={handleBlock}
          onReport={handleReport}
        />

      </SafeAreaView>
    </View>
  );
};

export default ChatScreen;