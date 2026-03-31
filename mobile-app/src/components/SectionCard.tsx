import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

export function SectionCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fffdf8",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eadfce",
    shadowColor: "#b98052",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
});

