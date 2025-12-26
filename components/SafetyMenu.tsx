import { Modal, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';

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
                                <Pressable
                                    onPress={onUnmatch}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-200 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Unmatch user"
                                    accessibilityHint="Removes this match from your list"
                                >
                                    <Text className='text-base font-semibold text-black'>Unmatch</Text>
                                </Pressable>

                                <Pressable
                                    onPress={onBlock}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-200 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Block user"
                                    accessibilityHint="Prevents this user from contacting you"
                                >
                                    <Text className='text-base font-semibold text-red-500'>Block</Text>
                                </Pressable>

                                <Pressable
                                    onPress={onReport}
                                    className='p-4 bg-gray-50 rounded-2xl active:bg-gray-200 items-center'
                                    accessibilityRole="button"
                                    accessibilityLabel="Report user"
                                    accessibilityHint="Reports this user for inappropriate behavior"
                                >
                                    <Text className='text-base font-semibold text-red-500'>Report</Text>
                                </Pressable>
                            </View>

                            <Pressable
                                onPress={onClose}
                                className='mt-4 p-4 items-center active:opacity-50'
                                accessibilityRole="button"
                                accessibilityLabel="Cancel"
                                accessibilityHint="Close this menu without taking action"
                            >
                                <Text className='text-base font-medium text-gray-500'>Cancel</Text>
                            </Pressable>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
