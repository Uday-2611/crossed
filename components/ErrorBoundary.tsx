import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background items-center justify-center p-6">
          <Text className="text-2xl font-bold text-foreground mb-4">
            Something went wrong
          </Text>
          <ScrollView className="max-h-64 w-full mb-6">
            <Text className="text-sm text-muted-foreground font-mono">
              {this.state.error?.message}
            </Text>
            <Text className="text-xs text-muted-foreground font-mono mt-2">
              {this.state.error?.stack}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-primary-foreground font-semibold">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}