import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Settings = () => {
    // Preferences State
    const [interestedIn, setInterestedIn] = useState<string[]>(['Women']);
    const [ageRange, setAgeRange] = useState([21, 26]);
    const [distance, setDistance] = useState(30);
    const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
    const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Spiritual', 'Not religious', 'Prefer not to say'];
    const ETHNICITIES = ['Prefer not to say', 'No preference', 'Asian', 'Black', 'Hispanic/Latino', 'Indian', 'Middle Eastern', 'White'];

    return (
        <View className='flex-1 bg-white pb-24'>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className='flex-1' edges={['top']}>
                {/* Header */}
                <View className='px-6 pt-4 pb-6'>
                    <Text className='font-bold text-4xl text-black tracking-tight'>Settings</Text>
                </View>

                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>

                    {/* Section 1: Account */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Account</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Edit Profile</Text>
                            </TouchableOpacity>

                            <View className='p-4 border-b border-gray-200'>
                                <Text className='text-base font-medium text-black mb-1'>Account Information</Text>
                                <Text className='text-sm text-gray-500'>uday@example.com • Google</Text>
                            </View>

                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Log Out</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 active:bg-red-50/50'>
                                <Text className='text-base font-medium text-red-500'>Delete Account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 1.5: Dating Preferences */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Dating Preferences</Text>
                        <View className='bg-gray-50 rounded-2xl p-4 gap-6'>

                            {/* Age Range Slider (Visual Mock) */}
                            <View>
                                <View className='flex-row justify-between mb-3'>
                                    <Text className='text-base font-medium text-black'>Age range</Text>
                                    <Text className='text-base font-medium text-gray-500'>{ageRange[0]} – {ageRange[1]}</Text>
                                </View>
                                <View className='h-10 justify-center'>
                                    {/* Track */}
                                    <View className='h-1.5 bg-gray-200 rounded-full w-full absolute' />
                                    {/* Active Track */}
                                    <View className='h-1.5 bg-black rounded-full absolute left-[15%] w-[20%]' />
                                    {/* Min Thumb */}
                                    <View className='h-7 w-7 bg-white rounded-full border border-gray-200 shadow-sm absolute left-[15%] -ml-3.5 z-10' />
                                    {/* Max Thumb */}
                                    <View className='h-7 w-7 bg-white rounded-full border border-gray-200 shadow-sm absolute left-[35%] -ml-3.5 z-10' />
                                </View>
                            </View>

                            {/* Distance Slider (Visual Mock) */}
                            <View>
                                <View className='flex-row justify-between mb-3'>
                                    <Text className='text-base font-medium text-black'>Distance</Text>
                                    <Text className='text-base font-medium text-gray-500'>Up to {distance} km</Text>
                                </View>
                                <View className='h-10 justify-center'>
                                    {/* Track */}
                                    <View className='h-1.5 bg-gray-200 rounded-full w-full absolute' />
                                    {/* Active Track */}
                                    <View className='h-1.5 bg-black rounded-full absolute w-[30%]' />
                                    {/* Thumb */}
                                    <View className='h-7 w-7 bg-white rounded-full border border-gray-200 shadow-sm absolute left-[30%] -ml-3.5' />
                                </View>
                                <Text className='text-xs text-gray-400 mt-1'>We'll show people within this distance</Text>
                            </View>

                            {/* Interested In */}
                            <View>
                                <Text className='text-base font-medium text-black mb-3'>Interested in</Text>
                                <View className='flex-row rounded-lg overflow-hidden border border-gray-200'>
                                    {['Men', 'Women', 'Everyone'].map((option, idx) => {
                                        const isSelected = interestedIn.includes(option);
                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => setInterestedIn([option])} // Single select for gender usually
                                                className={`flex-1 py-3 items-center ${isSelected ? 'bg-black' : 'bg-white'} ${idx !== 2 ? 'border-r border-gray-200' : ''} `}
                                            >
                                                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-black'} `}>{option}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Religion */}
                            <View>
                                <Text className='text-base font-medium text-black mb-3'>Religion <Text className='text-gray-400 font-normal'>(Optional)</Text></Text>
                                <View className='flex-row flex-wrap gap-2'>
                                    {RELIGIONS.map((item) => {
                                        const isSelected = selectedReligions.includes(item);
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => toggleSelection(item, selectedReligions, setSelectedReligions)}
                                                className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-black border-black' : 'bg-white border-gray-200'} `}
                                            >
                                                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'} `}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Ethnicity */}
                            <View>
                                <Text className='text-base font-medium text-black mb-3'>Ethnicity <Text className='text-gray-400 font-normal'>(Optional)</Text></Text>
                                <View className='flex-row flex-wrap gap-2'>
                                    {ETHNICITIES.map((item) => {
                                        const isSelected = selectedEthnicities.includes(item);
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => toggleSelection(item, selectedEthnicities, setSelectedEthnicities)}
                                                className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-black border-black' : 'bg-white border-gray-200'} `}
                                            >
                                                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'} `}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Section 2: Privacy & Safety */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Privacy & Safety</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Privacy Settings</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Blocked Users</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Report a Problem</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 3: Preferences */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Preferences</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Notifications</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Location Usage</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 4: Legal & About */}
                    <View className='px-6 mb-12'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Legal</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Terms of Service</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Privacy Policy</Text>
                            </TouchableOpacity>

                            <View className='p-4'>
                                <Text className='text-base font-medium text-black mb-1'>About Crossed</Text>
                                <Text className='text-sm text-gray-500'>Version 1.0.0 (Build 42)</Text>
                                <Text className='text-sm text-gray-500 mt-1'>
                                    Crossed is a minimalist dating app designed for authentic connections.
                                </Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default Settings;