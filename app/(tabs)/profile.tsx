import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { uploadToCloudinary } from '../../lib/cloudinary';

const { width } = Dimensions.get('window');

const PHOTO_SLOTS = [1, 2, 3, 4, 5, 6];

const Profile = () => {
  const profile = useQuery(api.profiles.getMyProfile);
  const upsertProfile = useMutation(api.profiles.upsertMyProfile);

  // Local state for editing
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    occupation: '',
    height: 0,
    location: '',
    gender: '',
    religion: '',
    // Default values for fields not yet in UI but required by schema
    age: 18,
    sexuality: 'Heterosexual',
    photos: [] as string[],
    activities: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);

  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {

    setIsSaving(true);

    try {
      // Request permission ->
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work');
        setIsSaving(false);
        return
      }

      // Launch Image Library -> 
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        exif: false
      })

      if (!result.canceled) {
        const asset = result.assets[0]
        const secureUrl = await uploadToCloudinary(asset.uri); //Upload to cloudinary

        // Update local state, limit to 6 photos. 
        if (formData.photos.length < 6) {
          const updatedPhotos = [...formData.photos, secureUrl];
          updateField('photos', updatedPhotos);

          // Auo-save to convex -> 
          await upsertProfile({
            ...formData,
            photos: updatedPhotos,
            height: Number(formData.height),
            age: Number(formData.age)
          })

          console.log('Photo uploaded and profile saved')
        } else {
          alert('You can only have 6 photos')
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Sync Convex data to local state when loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        occupation: profile.occupation || '',
        height: profile.height || 0,
        location: profile.location || '',
        gender: profile.gender || '',
        religion: profile.religion || '',
        age: profile.age || 18,
        sexuality: profile.sexuality || 'Heterosexual',
        photos: profile.photos || [],
        activities: profile.activities || [],
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertProfile({
        ...formData,
        // Ensure numbers are numbers
        height: Number(formData.height),
        age: Number(formData.age),
      });
      console.log('Profile saved!');
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (profile === undefined) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size="large" color="#1F6F5C" />
      </View>
    );
  }

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
              <View className='flex-row items-center justify-between'>
                <View className='flex-1 pr-4'>
                  <TextInput
                    className='font-bold text-3xl text-text-primary tracking-tight'
                    value={formData.name}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="Your Name"
                  />
                </View>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#1F6F5C" />
                  ) : (
                    <Text className='text-brand font-bold text-lg'>Save</Text>
                  )}
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
              {PHOTO_SLOTS.map((slot, index) => (
                <View
                  key={slot}
                  style={{ width: width * 0.4, height: width * 0.55 }}
                  className='bg-surface-muted rounded-2xl border border-border items-center justify-center relative overflow-hidden'
                >
                  {formData.photos[index] ? (
                    <Image
                      source={{ uri: formData.photos[index] }}
                      className='w-full h-full'
                      resizeMode='cover'
                    />
                  ) : (
                    <>
                      {index === formData.photos.length ? (
                        <TouchableOpacity
                          onPress={pickImage}
                          className='w-full h-full items-center justify-center'
                        >
                          <Ionicons
                            name='add'
                            size={32}
                            color='#9AA8A3'
                            style={{ opacity: 0.5 }}
                          />

                          <View className='absolute bottom-3 right-3 bg-white/50 p-1.5 rounded-full'>
                            <Ionicons
                              name='image-outline'
                              size={14}
                              color='#5F6F6B'
                            />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Ionicons
                          name='add'
                          size={32}
                          color='#E5E7EB'
                          style={{ opacity: 0.2 }}
                        />
                      )}
                    </>
                  )}
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
                value={formData.bio}
                onChangeText={(text) => updateField('bio', text)}
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
              {/* Work */}
              <View className='flex-row justify-between items-center py-4 px-5 border-b border-border/30'>
                <Text className='text-text-secondary font-medium'>Work</Text>
                <TextInput
                  className='text-text-primary font-semibold text-right flex-1 ml-4'
                  value={formData.occupation}
                  onChangeText={(text) => updateField('occupation', text)}
                  placeholder="Add"
                />
              </View>

              {/* Height */}
              <View className='flex-row justify-between items-center py-4 px-5 border-b border-border/30'>
                <Text className='text-text-secondary font-medium'>Height (cm)</Text>
                <TextInput
                  className='text-text-primary font-semibold text-right flex-1 ml-4'
                  value={formData.height ? formData.height.toString() : ''}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    updateField('height', isNaN(num) ? 0 : num);
                  }}
                  keyboardType="numeric"
                  placeholder="Add"
                />
              </View>

              {/* Hometown (Location) */}
              <View className='flex-row justify-between items-center py-4 px-5 border-b border-border/30'>
                <Text className='text-text-secondary font-medium'>Hometown</Text>
                <TextInput
                  className='text-text-primary font-semibold text-right flex-1 ml-4'
                  value={formData.location}
                  onChangeText={(text) => updateField('location', text)}
                  placeholder="Add"
                />
              </View>

              {/* Gender */}
              <View className='flex-row justify-between items-center py-4 px-5 border-b border-border/30'>
                <Text className='text-text-secondary font-medium'>Gender</Text>
                <TextInput
                  className='text-text-primary font-semibold text-right flex-1 ml-4'
                  value={formData.gender}
                  onChangeText={(text) => updateField('gender', text)}
                  placeholder="Add"
                />
              </View>

              {/* Religion */}
              <View className='flex-row justify-between items-center py-4 px-5'>
                <Text className='text-text-secondary font-medium'>Religion</Text>
                <TextInput
                  className='text-text-primary font-semibold text-right flex-1 ml-4'
                  value={formData.religion}
                  onChangeText={(text) => updateField('religion', text)}
                  placeholder="Add"
                />
              </View>
            </View>
          </View>

          {/* SECTION 4: Activities */}
          <View className='px-6 mb-8'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-lg font-bold text-text-primary'>Your activities</Text>
            </View>

            <View className='flex-row flex-wrap gap-3'>
              {formData.activities.map((activity, index) => (
                <View key={index} className='bg-surface-muted px-4 py-2.5 rounded-full border border-border/40'>
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