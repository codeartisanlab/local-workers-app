import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { fetchBookingMessages, sendBookingMessage } from "../services/api";
import { BookingMessage } from "../types";

type Props = NativeStackScreenProps<CustomerStackParamList, "BookingChat">;

export function BookingChatScreen({ route }: Props) {
  const { bookingId, workerName } = route.params;
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchBookingMessages(accessToken, bookingId).then(setMessages);
  }, [accessToken, bookingId]);

  async function handleSend() {
    if (!accessToken || !messageText.trim()) {
      return;
    }
    setSending(true);
    const createdMessage = await sendBookingMessage(accessToken, bookingId, messageText.trim());
    setMessages((current) => [...current, createdMessage]);
    setMessageText("");
    setSending(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SectionCard>
          <Text style={styles.title}>Chat with {workerName}</Text>
          <Text style={styles.subtitle}>Booking #{bookingId}</Text>
        </SectionCard>

        <FlatList
          contentContainerStyle={styles.messagesContent}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isMe = item.senderPhone === user?.phone;
            return (
              <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.messageSender, isMe ? styles.mySender : styles.otherSender]}>
                  {isMe ? "You" : item.senderPhone}
                </Text>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                  {item.message}
                </Text>
              </View>
            );
          }}
        />

        <SectionCard>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message"
            style={styles.input}
            multiline
          />
          <PrimaryButton title="Send Message" onPress={handleSend} loading={sending} />
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f1ea",
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#231f1c",
  },
  subtitle: {
    marginTop: 4,
    color: "#75685e",
  },
  messagesContent: {
    gap: 10,
    paddingBottom: 8,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: "85%",
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2f6c62",
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: {
    lineHeight: 20,
  },
  mySender: {
    color: "#dcebe7",
  },
  otherSender: {
    color: "#8a796d",
  },
  myMessageText: {
    color: "#fffdf8",
  },
  otherMessageText: {
    color: "#231f1c",
  },
  input: {
    backgroundColor: "#f7f1e7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfce",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#231f1c",
    marginBottom: 12,
    minHeight: 96,
    textAlignVertical: "top",
  },
});
