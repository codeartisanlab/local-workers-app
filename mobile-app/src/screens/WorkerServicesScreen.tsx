import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { fetchServices, updateWorkerProfile, fetchWorkerMe } from "../services/api";
import { ServiceOption } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerServices">;

export function WorkerServicesScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([fetchServices(), fetchWorkerMe(accessToken)]).then(([svcs, profile]) => {
      setServices(svcs);
      const currentIds = new Set(profile.subServices.map((s) => s.id));
      setSelectedIds(currentIds);
      setExpanded(new Set(svcs.map((s) => s.id)));
    });
  }, [accessToken]);

  function toggleSubService(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateWorkerProfile(accessToken, { sub_service_ids: Array.from(selectedIds) });
      Alert.alert("Saved", "Your services have been updated.");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Failed to save services.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={services}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>My Services</Text>
            <Text style={styles.subheading}>Select the services and sub-services you offer.</Text>
          </View>
        }
        renderItem={({ item: service }) => (
          <SectionCard>
            <Pressable style={styles.serviceHeader} onPress={() => toggleExpanded(service.id)}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.expandIcon}>{expanded.has(service.id) ? "▲" : "▼"}</Text>
            </Pressable>
            {expanded.has(service.id) && (service.subServices ?? []).length > 0 ? (
              (service.subServices ?? []).map((sub) => (
                <Pressable
                  key={sub.id}
                  style={styles.subServiceRow}
                  onPress={() => toggleSubService(sub.id)}
                >
                  <View style={[styles.checkbox, selectedIds.has(sub.id) && styles.checkboxChecked]}>
                    {selectedIds.has(sub.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.subServiceName}>{sub.name}</Text>
                </Pressable>
              ))
            ) : expanded.has(service.id) ? (
              <Text style={styles.noSubs}>No sub-services available.</Text>
            ) : null}
          </SectionCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>{selectedIds.size} sub-service{selectedIds.size !== 1 ? "s" : ""} selected</Text>
            <PrimaryButton title={saving ? "Saving…" : "Save Services"} onPress={handleSave} loading={saving} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 0, paddingBottom: 40 },
  header: { marginBottom: 20 },
  heading: { color: "#231f1c", fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subheading: { color: "#75685e", lineHeight: 20 },
  serviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceName: { color: "#231f1c", fontSize: 17, fontWeight: "800" },
  expandIcon: { color: "#7d6f63", fontSize: 12 },
  subServiceRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f0e8da",
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#dfd3c1",
    alignItems: "center", justifyContent: "center", backgroundColor: "#f7f1e7",
  },
  checkboxChecked: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  checkmark: { color: "#fffdf8", fontSize: 13, fontWeight: "700" },
  subServiceName: { color: "#4e433a", fontSize: 15 },
  noSubs: { color: "#7d6f63", marginTop: 8, fontSize: 13 },
  footer: { marginTop: 20, gap: 12 },
  selectedCount: { textAlign: "center", color: "#7d6f63" },
});
