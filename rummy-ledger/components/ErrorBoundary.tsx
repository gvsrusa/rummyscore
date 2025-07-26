import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedButton } from './ThemedButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you would send this to a crash reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ThemedView style={styles.container}>
          <ThemedText type="h1" style={styles.title}>
            Oops! Something went wrong
          </ThemedText>
          <ThemedText style={styles.message}>
            We&apos;re sorry, but something unexpected happened. Please try again.
          </ThemedText>
          
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <ThemedText type="h2" style={styles.errorTitle}>
                Error Details (Development Only):
              </ThemedText>
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text style={styles.errorText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </View>
          )}
          
          <ThemedButton
            title="Try Again"
            onPress={this.handleReset}
            style={styles.button}
          />
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxHeight: 200,
  },
  errorTitle: {
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  button: {
    minWidth: 120,
  },
});