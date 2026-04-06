import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { RootStackParamList } from "../navigation/AppNavigator";
import { fetchCategoryServices } from "../services/api";
import { ServiceWithPackages } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceCategory">;

export function ServiceCategoryScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const [services, setServices] = useState<ServiceWithPackages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryServices(category.id)
      .then(setServices)
      .finally(() => setLoading(false));
  }, [category.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={services}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.icon}>{category.icon}</Text>
            <Text style={styles.title}>{category.name}</Text>
            <Text style={styles.subtitle}>{category.description}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("ServiceDetail", { service: item })}>
            <SectionCard>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  {item.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text> : null}
                  <View style={styles.metaRow}>
                    <Text style={styles.badge}>
                      ₹{item.packages.length > 0
                        ? Math.min(...item.packages.map((p) => p.price))
                        : item.base_price}+
                    </Text>
                    <Text style={styles.badge}>{item.packages.length} packages</Text>
                    <Text style={styles.badge}>{item.duration_hours}h</Text>
                  </View>
                </View>
                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </SectionCard>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#ca6b2c" style={styles.loader} />
          ) : (
            <Text style={styles.empty}>No services in this category yet.</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: "center" },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { color: "#231f1c", fontSize: 28, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#75685e", fontSize: 14, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1 },
  serviceName: { color: "#231f1c", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  serviceDesc: { color: "#75685e", fontSize: 13, marginBottom: 8, lineHeight: 18 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: {
    color: "#6f5039",
    backgroundColor: "#f0e2d2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: "hidden",
  },
  arrow: { paddingLeft: 8 },
  arrowText: { color: "#ca6b2c", fontSize: 28, fontWeight: "300" },
  sep: { height: 12 },
  loader: { marginTop: 48 },
  empty: { textAlign: "center", color: "#75685e", marginTop: 40 },
});
