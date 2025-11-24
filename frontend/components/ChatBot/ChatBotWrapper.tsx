import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingChatButton from './FloatingChatButton';
import ChatInterface from './ChatInterface';

interface ChatBotWrapperProps {
  children: React.ReactNode;
}

const ChatBotWrapper: React.FC<ChatBotWrapperProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <View style={styles.container}>
      {children}
      <FloatingChatButton
        onPress={() => setIsChatOpen(!isChatOpen)}
        isOpen={isChatOpen}
      />
      <ChatInterface
        isVisible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatBotWrapper;
