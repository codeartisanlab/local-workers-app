import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { LocationBar } from "../components/LocationBar";
import { useLocationState } from "../context/LocationContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { fetchNearbyWorkers } from "../services/api";
import { Worker } from "../types";

type Props = NativeStackScreenProps<CustomerStackParamList, "Workers">;

function StarIcon() {
  return (
    <View style={iconStyles.starWrap}>
      <View style={iconStyles.starVertical} />
      <View style={iconStyles.starHorizontal} />
      <View style={iconStyles.starDiagonalA} />
      <View style={iconStyles.starDiagonalB} />
    </View>
  );
}

export function WorkersScreen({ navigation, route }: Props) {
  const { service } = route.params;
  const { coordinates } = useLocationState();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNearbyWorkers(coordinates.latitude, coordinates.longitude)
      .then(setWorkers)
      .finally(() => setLoading(false));
  }, [coordinates.latitude, coordinates.longitude]);

  const filteredWorkers = useMemo(
    () =>
      workers.filter((worker) =>
        worker.skills.some((skill) => skill.toLowerCase().includes(service.name.toLowerCase())),
      ),
    [workers, service.name],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        data={filteredWorkers}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <LocationBar />
            <View>
              <Text style={styles.heading}>{service.name}</Text>
              <Text style={styles.subheading}>Available workers near you</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.workerCard}
            onPress={() => navigation.navigate("Booking", { worker: item, service })}
            testID={`book-now-button-${index}`}
          >
            <Image
              source={{ uri: item.photoUrl ?? `https://i.pravatar.cc/300?img=${(item.id % 60) + 1}` }}
              style={styles.workerPhoto}
            />
            <View style={styles.workerBody}>
              <View style={styles.workerTop}>
                <View style={styles.workerText}>
                  <Text style={styles.name} testID={`worker-name-${index}`}>
                    {item.name}
                  </Text>
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>
                <Text style={styles.distance}>{item.distance}</Text>
              </View>
              <Text style={styles.skills} numberOfLines={1}>
                {item.skills.join(" • ")}
              </Text>
              <View style={styles.workerMetaRow}>
                <View style={styles.metaPill}>
                  <StarIcon />
                  <Text style={styles.meta}> {item.rating}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.meta}>{service.name}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#ca6b2c" style={styles.loader} />
          ) : (
            <Text style={styles.empty}>No workers available for {service.name} nearby.</Text>
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
    marginBottom: 20,
  },
  heading: {
    color: "#231f1c",
    fontSize: 30,
    fontWeight: "800",
  },
  subheading: {
    marginTop: 4,
    color: "#7d6f63",
  },
  workerCard: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#eadfce",
    alignItems: "center",
    shadowColor: "#b98052",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  workerPhoto: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: "#eadfce",
  },
  workerBody: {
    flex: 1,
    justifyContent: "space-between",
  },
  workerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  workerText: {
    flex: 1,
  },
  name: {
    color: "#231f1c",
    fontSize: 19,
    fontWeight: "800",
  },
  locationText: {
    marginTop: 3,
    color: "#75685e",
    fontSize: 14,
  },
  distance: {
    color: "#8c4d24",
    fontWeight: "700",
    fontSize: 13,
    alignSelf: "flex-start",
  },
  skills: {
    color: "#4e433a",
    fontSize: 14,
  },
  workerMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f7f1e7",
  },
  meta: {
    color: "#7d6f63",
    fontSize: 13,
  },
  separator: {
    height: 12,
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

const iconStyles = StyleSheet.create({
  starWrap: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  starVertical: {
    position: "absolute",
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: "#ca6b2c",
  },
  starHorizontal: {
    position: "absolute",
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ca6b2c",
  },
  starDiagonalA: {
    position: "absolute",
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: "#ca6b2c",
    transform: [{ rotate: "45deg" }],
  },
  starDiagonalB: {
    position: "absolute",
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: "#ca6b2c",
    transform: [{ rotate: "-45deg" }],
  },
});
