import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="matches"
        options={{
          tabBarAccessibilityLabel: 'Matches tab',
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          tabBarAccessibilityLabel: 'Chats tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />    </Tabs>
  );
}