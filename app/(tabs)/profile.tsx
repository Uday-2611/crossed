import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PHOTO_SLOTS = [1, 2, 3, 4, 5, 6];

const DETAILS = [
  { label: 'Work', value: 'Software Engineer' },
  { label: 'Education', value: 'Stanford University' },
  { label: 'Height', value: '5\'11"' },
  { label: 'Hometown', value: 'San Francisco' },
  { label: 'Gender', value: 'Male' },
  { label: 'Interested in', value: 'Women' },
  { label: 'Relationship type', value: 'Long-term' },
  { label: 'Dating intentions', value: 'Serious' },
  { label: 'Religion', value: 'Agnostic' },
  { label: 'Smoke', value: 'No' },
  { label: 'Drink', value: 'Socially' },
];

const ACTIVITIES = ['Hiking', 'Photography', 'Cooking'];

const Profile = () => {
  const [bio, setBio] = useState('Coffee enthusiast, travel lover, and amateur photographer. Always looking for the next best ramen spot.');
  return (
    <View className='flex-1 bg-background'>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className='flex-1' edges={['top']}>
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>

          {/* Header Section */}
          <View className='px-6 pt-4 pb-6 items-center flex-row gap-5'>
            <View className='h-24 w-24 rounded-full bg-surface-muted items-center justify-center border border-border overflow-hidden'>
              <Ionicons name="person" size={40} color="#9AA8A3" />
            </View>
            <View className='flex-1'>
              <View className='flex-row items-center gap-2'>
                <Text className='font-bold text-3xl text-text-primary tracking-tight'>Uday</Text>
                <TouchableOpacity>
                  <Ionicons name="pencil-sharp" size={18} color="#9AA8A3" />
                </TouchableOpacity>
              </View>
            </View>
          </View>


          {/* SECTION 1: Profile Photos */}
          <View className='mb-8'>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={width * 0.4 + 12} // Card width + gap
            >
              {PHOTO_SLOTS.map((slot) => (
                <View
                  key={slot}
                  style={{ width: width * 0.4, height: width * 0.55 }}
                  className='bg-surface-muted rounded-2xl border border-border items-center justify-center relative overflow-hidden'
                >
                  <Ionicons name="add" size={32} color="#9AA8A3" style={{ opacity: 0.5 }} />
                  {/* Placeholder for "Add Photo" UI */}
                  <View className='absolute bottom-3 right-3 bg-white/50 p-1.5 rounded-full'>
                    <Ionicons name="image-outline" size={14} color="#5F6F6B" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* SECTION 2: Bio */}
          <View className='px-6 mb-8'>
            <Text className='text-lg font-bold text-text-primary mb-3'>Bio</Text>
            <View className='bg-surface-muted/50 rounded-2xl p-4 border border-border/50 min-h-[100px]'>
              <TextInput
                className='text-base text-text-primary leading-6'
                multiline
                value={bio}
                onChangeText={setBio}
                placeholder="Write something about yourself..."
                placeholderTextColor="#9AA8A3"
                scrollEnabled={false}
              />
            </View>
          </View>

          {/* SECTION 3: Personal Details */}
          <View className='px-6 mb-8'>
            <Text className='text-lg font-bold text-text-primary mb-4'>Details</Text>
            <View className='bg-surface rounded-3xl border border-border/60 overflow-hidden'>
              {DETAILS.map((detail, index) => (
                <View key={detail.label} className={`flex-row justify-between items-center py-4 px-5 ${index !== DETAILS.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <View className='flex-row items-center gap-3'>
                    <Text className='text-text-secondary font-medium'>{detail.label}</Text>
                  </View>
                  <TouchableOpacity className='flex-row items-center gap-1'>
                    <Text className='text-text-primary font-semibold'>{detail.value || 'Add'}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#DDE5E2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4: Activities */}
          <View className='px-6 mb-8'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-lg font-bold text-text-primary'>Your activities</Text>
            </View>

            <View className='flex-row flex-wrap gap-3'>
              {ACTIVITIES.map((activity) => (
                <View key={activity} className='bg-surface-muted px-4 py-2.5 rounded-full border border-border/40'>
                  <Text className='text-text-primary font-medium'>{activity}</Text>
                </View>
              ))}
              <TouchableOpacity className='bg-transparent px-4 py-2.5 rounded-full border border-brand border-dashed flex-row items-center gap-1'>
                <Ionicons name="add" size={16} color="#1F6F5C" />
                <Text className='text-brand font-medium'>Add new</Text>
              </TouchableOpacity>
            </View>
            <Text className='text-text-muted text-sm mt-3 ml-1'>Activities can be changed once a week</Text>
          </View>

          {/* SECTION 5: Pinned Locations */}
          <View className='px-6 mb-32'>
            <Text className='text-lg font-bold text-text-primary mb-4'>Pinned locations</Text>
            <View className='h-48 w-full bg-surface-muted rounded-3xl border border-border overflow-hidden relative'>
              {/* Map Placeholder Art */}
              <View className='absolute inset-0 opacity-20'>
                {/* Abstract map lines */}
                <View className='absolute top-1/4 left-0 w-full h-1 bg-text-muted transform -rotate-12' />
                <View className='absolute top-2/3 left-0 w-full h-1 bg-text-muted transform rotate-6' />
                <View className='absolute top-0 left-1/3 h-full w-1 bg-text-muted transform rotate-12' />
                <View className='absolute top-0 right-1/4 h-full w-1 bg-text-muted transform -rotate-6' />
              </View>

              <View className='flex-1 items-center justify-center'>
                <View className='bg-white p-3 rounded-full shadow-sm'>
                  <Ionicons name="location" size={24} color="#1F6F5C" />
                </View>
                <Text className='text-text-secondary font-medium mt-2'>San Francisco, CA</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View >
  );
};

export default Profile;