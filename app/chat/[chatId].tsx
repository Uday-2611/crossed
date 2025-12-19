import { SafetyMenu } from '@/components/SafetyMenu';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
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


// Mock Messages
const MOCK_MESSAGES = [
  { id: '1', text: "Hey! How's your week going?", sender: 'them', time: '10:02 AM' },
  { id: '2', text: "It's been good, just busy with work. How about yours?", sender: 'me', time: '10:05 AM' },
  { id: '3', text: "Pretty chill actually. Finally checked out that book shop you mentioned.", sender: 'them', time: '10:10 AM' },
  { id: '4', text: "No way! Did you find anything good?", sender: 'me', time: '10:12 AM' },
  { id: '5', text: "Yeah got a couple of classics. We should go together sometime.", sender: 'them', time: '10:15 AM' },
];

const ChatScreen = () => {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSafetyMenuOpen, setIsSafetyMenuOpen] = useState(false); // New state for safety menu

  const handleUnmatch = () => {
    setIsSafetyMenuOpen(false);
    Alert.alert(
      "Unmatch this user?",
      "This will remove this match and you won’t be able to chat anymore.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unmatch", style: "destructive", onPress: () => router.replace('/(tabs)/chats') }
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
        { text: "Block", style: "destructive", onPress: () => router.replace('/(tabs)/chats') }
      ]
    );
  };

  const handleReport = () => {
    setIsSafetyMenuOpen(false);
    router.push(`/report/${chatId}` as any);
  };

  const goToProfile = () => {
    // In real app, chatId might be same as matchId or mapped
    router.push(`/match/${chatId}`);
  };

  // Send Message Handler
  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  // Menu Options
  const MENU_OPTIONS = [
    { id: 'photo', label: 'Photo', icon: 'image-outline' },
    { id: 'location', label: 'Share Location', icon: 'location-outline' },
    { id: 'activity', label: 'Activity Invite', icon: 'calendar-outline' },
    { id: 'voice', label: 'Voice Note', icon: 'mic-outline' },
  ] as const;

  return (
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1'>

        {/* Header */}
        <View className='px-4 py-3 flex-row items-center justify-between border-b border-gray-100 bg-background z-10'>
          <TouchableOpacity onPress={() => router.back()} className='p-2'>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToProfile}>
            <Text className='font-semibold text-lg text-text-primary'>Sophie</Text>
          </TouchableOpacity>

          <TouchableOpacity className='p-2' onPress={() => setIsSafetyMenuOpen(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          className='flex-1 px-4'
          contentContainerStyle={{ paddingVertical: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View className={`w-full flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${isMe
                    ? 'bg-brand rounded-tr-none'
                    : 'bg-gray-100 rounded-tl-none'
                    }`}
                >
                  <Text className={`text-base leading-6 ${isMe ? 'text-white' : 'text-text-primary'}`}>
                    {item.text}
                  </Text>
                  <Text className={`text-[10px] mt-1 ${isMe ? 'text-gray-200' : 'text-gray-500'} text-right`}>
                    {item.time}
                  </Text>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          className='border-t border-gray-100 bg-background p-2'
        >
          <View className='flex-row items-end gap-2 px-2 py-2'>
            {/* Plus Menu Button */}
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              className='h-10 w-10 items-center justify-center bg-gray-100 rounded-full mb-1'
            >
              <Ionicons name="add" size={24} color="black" />
            </TouchableOpacity>

            {/* Text Input */}
            <View className='flex-1 bg-background rounded-2xl px-4 py-2 min-h-[44px] justify-center'>
              <TextInput
                className='text-base text-text-primary max-h-24'
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`h-10 w-10 items-center justify-center rounded-full mb-1 ${inputText.trim() ? 'bg-brand' : 'bg-gray-100'
                }`}
            >
              <Ionicons name="arrow-up" size={20} color={inputText.trim() ? 'white' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Bottom Sheet Modal */}
        <Modal
          visible={isMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View className='flex-1 bg-black/40 justify-end'>
              <TouchableWithoutFeedback>
                <View className='bg-background rounded-t-3xl p-6 pb-10 shadow-xl'>
                  {/* Handle Indicator */}
                  <View className='w-12 h-1 bg-background rounded-full mx-auto mb-6' />

                  <View className='gap-4'>
                    {MENU_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        className='flex-row items-center gap-4 p-4 bg-background rounded-2xl active:bg-gray-100'
                        onPress={() => setIsMenuOpen(false)}
                      >
                        <View className='h-10 w-10 bg-background rounded-full items-center justify-center border border-gray-100'>
                          <Ionicons name={option.icon as any} size={20} color="black" />
                        </View>
                        <Text className='text-base font-medium text-text-primary'>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
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