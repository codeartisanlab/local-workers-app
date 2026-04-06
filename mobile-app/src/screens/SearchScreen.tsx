import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { searchServicesAndWorkers } from "../services/api";
import { SearchResult, ServiceOption, Worker } from "../types";

type Props = NativeStackScreenProps<CustomerStackParamList, "Search">;

const SEARCH_DEBOUNCE_MS = 400;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    searchServicesAndWorkers(q)
      .then(setResults)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  function renderService(item: ServiceOption) {
    return (
      <Pressable
        style={styles.resultItem}
        onPress={() => navigation.navigate("Workers", { service: item })}
      >
        <Text style={styles.resultIcon}>🔧</Text>
        <View style={styles.resultCopy}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>Service</Text>
        </View>
        <Text style={styles.resultArrow}>›</Text>
      </Pressable>
    );
  }

  function renderWorker(item: Worker) {
    return (
      <Pressable
        style={styles.resultItem}
        onPress={() =>
          navigation.navigate("Booking", {
            worker: item,
            service: { id: 0, name: item.skills[0] ?? "Service" },
          })
        }
      >
        <Text style={styles.resultIcon}>👷</Text>
        <View style={styles.resultCopy}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultMeta}>{item.skills.join(", ")} · ⭐ {item.rating}</Text>
        </View>
        <Text style={styles.resultArrow}>›</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search services, plumbers, cleaners…"
          placeholderTextColor="#a89888"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {loading && <ActivityIndicator style={styles.loader} color="#ca6b2c" />}

      {!loading && results && (
        <FlatList
          contentContainerStyle={styles.list}
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {results.services.length > 0 && (
                <SectionCard>
                  <Text style={styles.sectionTitle}>Services</Text>
                  {results.services.map((s) => (
                    <View key={s.id}>{renderService(s)}</View>
                  ))}
                </SectionCard>
              )}
              {results.workers.length > 0 && (
                <SectionCard>
                  <Text style={styles.sectionTitle}>Workers</Text>
                  {results.workers.map((w) => (
                    <View key={w.id}>{renderWorker(w)}</View>
                  ))}
                </SectionCard>
              )}
              {results.services.length === 0 && results.workers.length === 0 && (
                <Text style={styles.empty}>No results for "{query}"</Text>
              )}
            </>
          }
        />
      )}

      {!loading && !results && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🔍</Text>
          <Text style={styles.placeholderText}>Search for services or workers</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  searchBar: { padding: 16, paddingBottom: 8 },
  input: {
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#231f1c",
  },
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12 },
  sectionTitle: { color: "#231f1c", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eadfce",
    gap: 12,
  },
  resultIcon: { fontSize: 24 },
  resultCopy: { flex: 1 },
  resultName: { color: "#231f1c", fontSize: 15, fontWeight: "600" },
  resultMeta: { color: "#75685e", fontSize: 12 },
  resultArrow: { color: "#ca6b2c", fontSize: 22 },
  empty: { textAlign: "center", color: "#75685e", marginTop: 40, fontSize: 15 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: "#75685e", fontSize: 16 },
});
