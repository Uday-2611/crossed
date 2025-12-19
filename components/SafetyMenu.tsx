import React from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface SafetyMenuProps {
    visible: boolean;
    onClose: () => void;
    onUnmatch: () => void;
    onBlock: () => void;
    onReport: () => void;
}

export const SafetyMenu = ({ visible, onClose, onUnmatch, onBlock, onReport }: SafetyMenuProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className='flex-1 bg-black/40 justify-end'>
                    <TouchableWithoutFeedback>
                        <View className='bg-white rounded-t-3xl p-6 pb-12 shadow-xl'>
                            {/* Handle Indicator */}
                            <View className='w-12 h-1 bg-gray-300 rounded-full mx-auto mb-8' />

                            <View className='gap-2'>
                                <TouchableOpacity
                                    onPress={onUnmatch}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-100 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Unmatch user"
                                    accessibilityHint="Removes this match from your list"
                                >
                                    <Text className='text-base font-semibold text-black'>Unmatch</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onBlock}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-100 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Block user"
                                    accessibilityHint="Prevents this user from contacting you"
                                >
                                    <Text className='text-base font-semibold text-red-500'>Block</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onReport}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-100 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Report user"
                                    accessibilityHint="Reports this user for inappropriate behavior"
                                >
                                    <Text className='text-base font-semibold text-red-500'>Report</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={onClose}
                                className='mt-4 p-4 items-center'
                                accessibilityRole="button"
                                accessibilityLabel="Cancel"
                                accessibilityHint="Close this menu without taking action"
                            >
                                <Text className='text-base font-medium text-gray-500'>Cancel</Text>
                            </TouchableOpacity>                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
