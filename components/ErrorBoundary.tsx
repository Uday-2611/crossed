import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, resetKey: 0 };
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
            {__DEV__ && (
              <Text className="text-xs text-muted-foreground font-mono mt-2">
                {this.state.error?.stack}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => this.setState((prev) => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }))}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-primary-foreground font-semibold">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}