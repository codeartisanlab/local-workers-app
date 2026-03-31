import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { LocationBar } from "../components/LocationBar";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { fetchServices } from "../services/api";
import { ServiceOption } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

function ServiceGlyph({ label, active }: { label: string; active: boolean }) {
  const tone = active ? "#fffdf8" : "#ca6b2c";

  if (label.toLowerCase().includes("clean")) {
    return (
      <View style={serviceIconStyles.wrap}>
        <View style={[serviceIconStyles.sparkleCore, { backgroundColor: tone }]} />
        <View style={[serviceIconStyles.sparkleArmVertical, { backgroundColor: tone }]} />
        <View style={[serviceIconStyles.sparkleArmHorizontal, { backgroundColor: tone }]} />
      </View>
    );
  }

  if (label.toLowerCase().includes("plumb")) {
    return (
      <View style={serviceIconStyles.wrap}>
        <View style={[serviceIconStyles.wrenchHead, { borderColor: tone }]} />
        <View style={[serviceIconStyles.wrenchHandle, { backgroundColor: tone }]} />
      </View>
    );
  }

  return (
    <View style={serviceIconStyles.wrap}>
      <View style={[serviceIconStyles.boltTop, { borderBottomColor: tone }]} />
      <View style={[serviceIconStyles.boltBottom, { borderTopColor: tone }]} />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} testID="home-screen">
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        data={services}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={
          <View style={styles.header}>
            <LocationBar />
            <View>
              <Text style={styles.welcome}>Hello, {user?.phone}</Text>
              <Text style={styles.heading} testID="home-heading">
                Pick a service
              </Text>
              <Text style={styles.subheading}>Find nearby pros around your selected location.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.serviceCard} onPress={() => navigation.navigate("Workers", { service: item })}>
            <View style={styles.serviceIconShell}>
              <ServiceGlyph label={item.name} active={false} />
            </View>
            <View style={styles.serviceCopy}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceCaption}>Nearby workers</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#ca6b2c" style={styles.loader} />
          ) : (
            <Text style={styles.empty}>No services available.</Text>
          )
        }
      />
      <FloatingTabBar activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f1ea",
  },
  content: {
    padding: 20,
    paddingBottom: 132,
  },
  header: {
    gap: 18,
    marginBottom: 22,
  },
  welcome: {
    color: "#7d6f63",
    fontSize: 14,
    marginBottom: 4,
  },
  heading: {
    color: "#231f1c",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
  },
  subheading: {
    marginTop: 8,
    color: "#75685e",
    fontSize: 14,
    lineHeight: 20,
  },
  column: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  serviceCard: {
    width: "48%",
    minHeight: 164,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#eadfce",
    justifyContent: "space-between",
    shadowColor: "#b98052",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  serviceIconShell: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fdf2e8",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceCopy: {
    gap: 4,
  },
  serviceName: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "800",
  },
  serviceCaption: {
    color: "#7d6f63",
    fontSize: 13,
  },
  empty: {
    textAlign: "center",
    color: "#75685e",
    marginTop: 40,
  },
  loader: {
    marginTop: 48,
  },
});

const serviceIconStyles = StyleSheet.create({
  wrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparkleArmVertical: {
    position: "absolute",
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  sparkleArmHorizontal: {
    position: "absolute",
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  wrenchHead: {
    position: "absolute",
    top: 2,
    width: 10,
    height: 10,
    borderWidth: 2,
    borderRadius: 5,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
  wrenchHandle: {
    position: "absolute",
    width: 3,
    height: 12,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
    bottom: 1,
  },
  boltTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 2,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  boltBottom: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 2,
    borderRightWidth: 5,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
