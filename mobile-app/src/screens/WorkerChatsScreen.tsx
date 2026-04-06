import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerFloatingTabBar } from "../components/WorkerFloatingTabBar";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { fetchWorkerChats } from "../services/api";
import { ChatPreview } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerChats">;

function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function WorkerChatsScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadChats() {
    if (!accessToken) return;
    fetchWorkerChats(accessToken).then((data) => {
      setChats(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadChats();
    pollingRef.current = setInterval(loadChats, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [accessToken]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={chats}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Chats</Text>
            <Text style={styles.subheading}>Active booking conversations.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("BookingChat", {
                bookingId: item.id,
                workerName: item.customerPhone,
              })
            }
          >
            <SectionCard>
              <View style={styles.chatRow}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{item.customerPhone.slice(-2)}</Text>
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTopRow}>
                    <Text style={styles.chatName}>{item.customerPhone}</Text>
                    {item.lastMessageAt && (
                      <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
                    )}
                  </View>
                  <Text style={styles.chatService}>{item.serviceName}</Text>
                  {item.lastMessage ? (
                    <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
                  ) : (
                    <Text style={styles.chatNoMessage}>No messages yet</Text>
                  )}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No active chats. Accept a booking to start chatting with customers.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <WorkerFloatingTabBar activeTab="chats" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 20 },
  heading: { color: "#231f1c", fontSize: 30, fontWeight: "800", marginBottom: 6 },
  subheading: { color: "#75685e" },
  chatRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  chatAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#f0e2d2", alignItems: "center", justifyContent: "center",
  },
  chatAvatarText: { color: "#8c4d24", fontWeight: "800", fontSize: 16 },
  chatInfo: { flex: 1 },
  chatTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatName: { fontWeight: "700", color: "#231f1c", fontSize: 15 },
  chatTime: { color: "#7d6f63", fontSize: 12 },
  chatService: { color: "#ca6b2c", fontSize: 12, fontWeight: "600", marginTop: 2 },
  chatPreview: { color: "#75685e", fontSize: 13, marginTop: 2 },
  chatNoMessage: { color: "#b0a89e", fontSize: 13, marginTop: 2, fontStyle: "italic" },
  separator: { height: 10 },
  emptyState: { paddingTop: 60, alignItems: "center" },
  emptyText: { color: "#7d6f63", textAlign: "center", lineHeight: 22 },
});
