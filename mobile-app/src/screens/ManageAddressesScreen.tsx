import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { fetchAddresses } from "../services/api";
import { CustomerAddress } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ManageAddresses">;

export function ManageAddressesScreen({}: Props) {
  const { accessToken } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    fetchAddresses(accessToken).then(setAddresses);
  }, [accessToken]);

  const labelIcons: Record<string, string> = { Home: "🏠", Work: "🏢", Other: "📍" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={addresses}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={<Text style={styles.title}>Saved Addresses</Text>}
        renderItem={({ item }) => (
          <SectionCard>
            <View style={styles.row}>
              <Text style={styles.icon}>{labelIcons[item.label] ?? "📍"}</Text>
              <View style={styles.info}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.is_default && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
                <Text style={styles.address}>{item.address}</Text>
              </View>
            </View>
          </SectionCard>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<Text style={styles.empty}>No saved addresses yet.</Text>}
        ListFooterComponent={
          <Pressable
            style={styles.addButton}
            onPress={() => Alert.alert("Add Address", "Address entry form coming soon.")}
          >
            <Text style={styles.addButtonText}>+ Add New Address</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "#231f1c", fontSize: 26, fontWeight: "800", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: { fontSize: 28, marginTop: 2 },
  info: { flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  label: { color: "#231f1c", fontSize: 16, fontWeight: "700" },
  defaultBadge: {
    color: "#2f6c62",
    backgroundColor: "#d9efe3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  address: { color: "#75685e", lineHeight: 20 },
  sep: { height: 10 },
  empty: { textAlign: "center", color: "#75685e", marginTop: 40 },
  addButton: {
    marginTop: 20,
    backgroundColor: "#ca6b2c",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  addButtonText: { color: "#fffdf8", fontSize: 16, fontWeight: "800" },
});
