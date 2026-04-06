import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { ServicePackage } from "../types";

type Props = NativeStackScreenProps<CustomerStackParamList, "ServiceDetail">;

export function ServiceDetailScreen({ route, navigation }: Props) {
  const { service } = route.params;
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | undefined>(
    service.packages.find((p) => p.is_popular) ?? service.packages[0],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.title}>{service.name}</Text>
          {service.description ? <Text style={styles.desc}>{service.description}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.badge}>₹{selectedPackage?.price ?? service.base_price}</Text>
            <Text style={styles.badge}>{selectedPackage?.duration_hours ?? service.duration_hours}h</Text>
          </View>
        </SectionCard>

        {service.packages.length > 0 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Select Package</Text>
            {service.packages.map((pkg) => (
              <Pressable
                key={pkg.id}
                style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardSelected]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <View style={styles.pkgRow}>
                  <View style={styles.pkgInfo}>
                    <View style={styles.pkgNameRow}>
                      <Text style={styles.pkgName}>{pkg.name}</Text>
                      {pkg.is_popular && <Text style={styles.popularBadge}>Popular</Text>}
                    </View>
                    <Text style={styles.pkgDesc}>{pkg.description}</Text>
                    {pkg.included_items.length > 0 && (
                      <Text style={styles.included}>✓ {pkg.included_items.join(", ")}</Text>
                    )}
                  </View>
                  <Text style={styles.pkgPrice}>₹{pkg.price}</Text>
                </View>
              </Pressable>
            ))}
          </SectionCard>
        )}

        {service.included_items.length > 0 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {service.included_items.map((item, i) => (
              <Text key={i} style={styles.listItem}>✓  {item}</Text>
            ))}
          </SectionCard>
        )}

        {service.excluded_items.length > 0 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Not Included</Text>
            {service.excluded_items.map((item, i) => (
              <Text key={i} style={styles.listItemExcluded}>✗  {item}</Text>
            ))}
          </SectionCard>
        )}

        <PrimaryButton
          label="Find Workers →"
          onPress={() =>
            navigation.navigate("Workers", {
              service: { id: service.id, name: service.name },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { color: "#231f1c", fontSize: 26, fontWeight: "800", marginBottom: 6 },
  desc: { color: "#75685e", lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 8 },
  badge: {
    color: "#6f5039",
    backgroundColor: "#f0e2d2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 12 },
  packageCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfce",
    backgroundColor: "#f7f1e7",
    padding: 14,
    marginBottom: 10,
  },
  packageCardSelected: { borderColor: "#2f6c62", backgroundColor: "#e8f4f0" },
  pkgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  pkgInfo: { flex: 1, marginRight: 12 },
  pkgNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  pkgName: { color: "#231f1c", fontSize: 16, fontWeight: "700" },
  popularBadge: {
    color: "#fffdf8",
    backgroundColor: "#ca6b2c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  pkgDesc: { color: "#75685e", fontSize: 13, marginBottom: 4 },
  included: { color: "#2f6c62", fontSize: 12 },
  pkgPrice: { color: "#231f1c", fontSize: 18, fontWeight: "800" },
  listItem: { color: "#2f6c62", marginBottom: 6, lineHeight: 20 },
  listItemExcluded: { color: "#b24a3a", marginBottom: 6, lineHeight: 20 },
});
