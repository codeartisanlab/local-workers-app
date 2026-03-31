import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CustomerTab = "home" | "profile" | "orders";

type FloatingTabBarProps = {
  activeTab: CustomerTab;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.homeRoof, active && styles.activeFill]} />
      <View style={[styles.homeBase, active && styles.activeFill]} />
      <View style={styles.homeDoor} />
    </View>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.profileHead, active && styles.activeFill]} />
      <View style={[styles.profileBody, active && styles.activeFill]} />
    </View>
  );
}

function OrdersIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.orderSheet, active && styles.orderSheetActive]}>
        <View style={styles.orderLine} />
        <View style={styles.orderLineShort} />
      </View>
    </View>
  );
}

export function FloatingTabBar({ activeTab }: FloatingTabBarProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: Math.max(insets.bottom + 10, 22) }]}>
      <View style={styles.bar}>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("Home")}>
          <View style={[styles.iconPad, activeTab === "home" && styles.iconPadActive]}>
            <HomeIcon active={activeTab === "home"} />
          </View>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("OrderHistory")}>
          <View style={[styles.iconPad, activeTab === "orders" && styles.iconPadActive]}>
            <OrdersIcon active={activeTab === "orders"} />
          </View>
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("CustomerProfile")}>
          <View style={[styles.iconPad, activeTab === "profile" && styles.iconPadActive]}>
            <ProfileIcon active={activeTab === "profile"} />
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
    backgroundColor: "#fffdf8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#eadfce",
    shadowColor: "#8c4d24",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
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
    backgroundColor: "#f5dfcb",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeFill: {
    backgroundColor: "#ca6b2c",
    borderColor: "#ca6b2c",
  },
  homeRoof: {
    width: 16,
    height: 16,
    backgroundColor: "#4e433a",
    transform: [{ rotate: "45deg" }],
    borderRadius: 3,
    marginBottom: -8,
  },
  homeBase: {
    width: 18,
    height: 14,
    backgroundColor: "#4e433a",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  homeDoor: {
    position: "absolute",
    bottom: 0,
    width: 5,
    height: 7,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: "#fffdf8",
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4e433a",
    marginBottom: 2,
  },
  profileBody: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#4e433a",
  },
  orderSheet: {
    width: 18,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#4e433a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  orderSheetActive: {
    backgroundColor: "#ca6b2c",
    borderColor: "#ca6b2c",
  },
  orderLine: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fffdf8",
    marginBottom: 3,
  },
  orderLineShort: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fffdf8",
  },
});
