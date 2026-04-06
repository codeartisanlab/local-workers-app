import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WorkerTab = "jobs" | "chats" | "profile";

type WorkerFloatingTabBarProps = {
  activeTab: WorkerTab;
  unreadChats?: number;
};

function JobsIcon({ active }: { active: boolean }) {
  const color = active ? "#ca6b2c" : "#4e433a";
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.briefcaseBody, { borderColor: color }]}>
        <View style={[styles.briefcaseHandle, { borderColor: color }]} />
        <View style={[styles.briefcaseLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ChatsIcon({ active }: { active: boolean }) {
  const color = active ? "#ca6b2c" : "#4e433a";
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.chatBubble, { borderColor: color }]}>
        <View style={[styles.chatLine, { backgroundColor: color }]} />
        <View style={[styles.chatLineShort, { backgroundColor: color }]} />
      </View>
      <View style={[styles.chatTail, { borderTopColor: color }]} />
    </View>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? "#ca6b2c" : "#4e433a";
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.profileHead, { backgroundColor: color }]} />
      <View style={[styles.profileBody, { backgroundColor: color }]} />
    </View>
  );
}

export function WorkerFloatingTabBar({ activeTab, unreadChats = 0 }: WorkerFloatingTabBarProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[tabStyles.container, { bottom: Math.max(insets.bottom + 10, 22) }]}>
      <View style={tabStyles.bar}>
        <Pressable style={tabStyles.tabButton} onPress={() => navigation.navigate("WorkerDashboard")}>
          <View style={[tabStyles.iconPad, activeTab === "jobs" && tabStyles.iconPadActive]}>
            <JobsIcon active={activeTab === "jobs"} />
          </View>
          <Text style={[tabStyles.label, activeTab === "jobs" && tabStyles.labelActive]}>Jobs</Text>
        </Pressable>

        <Pressable style={tabStyles.tabButton} onPress={() => navigation.navigate("WorkerChats")}>
          <View style={[tabStyles.iconPad, activeTab === "chats" && tabStyles.iconPadActive]}>
            <ChatsIcon active={activeTab === "chats"} />
            {unreadChats > 0 && (
              <View style={tabStyles.badge}>
                <Text style={tabStyles.badgeText}>{unreadChats > 9 ? "9+" : String(unreadChats)}</Text>
              </View>
            )}
          </View>
          <Text style={[tabStyles.label, activeTab === "chats" && tabStyles.labelActive]}>Chats</Text>
        </Pressable>

        <Pressable style={tabStyles.tabButton} onPress={() => navigation.navigate("WorkerProfile")}>
          <View style={[tabStyles.iconPad, activeTab === "profile" && tabStyles.iconPadActive]}>
            <ProfileIcon active={activeTab === "profile"} />
          </View>
          <Text style={[tabStyles.label, activeTab === "profile" && tabStyles.labelActive]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  briefcaseBody: {
    width: 18,
    height: 13,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  briefcaseHandle: {
    position: "absolute",
    top: -5,
    width: 8,
    height: 5,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderRadius: 2,
  },
  briefcaseLine: {
    width: 10,
    height: 1.5,
    borderRadius: 1,
  },
  chatBubble: {
    width: 18,
    height: 14,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  chatTail: {
    position: "absolute",
    bottom: 1,
    left: 4,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  chatLine: {
    width: 8,
    height: 1.5,
    borderRadius: 1,
  },
  chatLineShort: {
    width: 5,
    height: 1.5,
    borderRadius: 1,
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  profileBody: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});

const tabStyles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
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
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7d6f63",
  },
  labelActive: {
    color: "#ca6b2c",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#c0392b",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
