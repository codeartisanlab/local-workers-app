import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WorkerStackParamList } from "../navigation/WorkerNavigator";

type WorkerTab = "dashboard" | "earnings" | "guide";

type WorkerTabBarProps = {
  activeTab: WorkerTab;
};

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

function DashboardIcon({ active }: { active: boolean }) {
  const color = active ? "#2f6c62" : "#7d6f63";
  return (
    <View style={iconStyles.wrap}>
      <View style={[iconStyles.grid, { borderColor: color }]}>
        <View style={[iconStyles.gridDot, { backgroundColor: color }]} />
        <View style={[iconStyles.gridDot, { backgroundColor: color }]} />
        <View style={[iconStyles.gridDot, { backgroundColor: color }]} />
        <View style={[iconStyles.gridDot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function EarningsIcon({ active }: { active: boolean }) {
  const color = active ? "#2f6c62" : "#7d6f63";
  return (
    <View style={iconStyles.wrap}>
      <View style={[iconStyles.coin, { borderColor: color }]}>
        <View style={[iconStyles.coinLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function GuideIcon({ active }: { active: boolean }) {
  const color = active ? "#2f6c62" : "#7d6f63";
  return (
    <View style={iconStyles.wrap}>
      <View style={[iconStyles.book, { borderColor: color }]}>
        <View style={[iconStyles.bookLine, { backgroundColor: color }]} />
        <View style={[iconStyles.bookLineShort, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function WorkerTabBar({ activeTab }: WorkerTabBarProps) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: Math.max(insets.bottom + 10, 22) }]}>
      <View style={styles.bar}>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("WorkerDashboard")}>
          <View style={[styles.iconPad, activeTab === "dashboard" && styles.iconPadActive]}>
            <DashboardIcon active={activeTab === "dashboard"} />
          </View>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("WorkerEarnings")}>
          <View style={[styles.iconPad, activeTab === "earnings" && styles.iconPadActive]}>
            <EarningsIcon active={activeTab === "earnings"} />
          </View>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("WorkerGuide")}>
          <View style={[styles.iconPad, activeTab === "guide" && styles.iconPadActive]}>
            <GuideIcon active={activeTab === "guide"} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: "#1e3830",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2f6c62",
    shadowColor: "#0a1f1c",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tabButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPadActive: {
    backgroundColor: "rgba(47,108,98,0.35)",
  },
});

const iconStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  grid: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 2,
    gap: 2,
  },
  gridDot: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
  },
  coin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  coinLine: {
    width: 7,
    height: 2,
    borderRadius: 1,
  },
  book: {
    width: 14,
    height: 18,
    borderRadius: 2,
    borderWidth: 2,
    padding: 2,
    justifyContent: "center",
    gap: 3,
  },
  bookLine: {
    width: "100%",
    height: 2,
    borderRadius: 1,
  },
  bookLineShort: {
    width: "65%",
    height: 2,
    borderRadius: 1,
  },
});
