import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useLocationState } from "../context/LocationContext";

function LocationPinIcon() {
  return (
    <View style={iconStyles.pinWrap}>
      <View style={iconStyles.pinCircle} />
      <View style={iconStyles.pinStem} />
    </View>
  );
}

function DetectIcon() {
  return (
    <View style={iconStyles.detectWrap}>
      <View style={iconStyles.detectRing} />
      <View style={iconStyles.detectDot} />
    </View>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <View style={[iconStyles.chevronWrap, expanded && iconStyles.chevronWrapExpanded]}>
      <View style={iconStyles.chevronLeft} />
      <View style={iconStyles.chevronRight} />
    </View>
  );
}

export function LocationBar() {
  const {
    presets,
    activeLocation,
    locationInput,
    locating,
    setLocationInput,
    applyLocationInput,
    selectPreset,
    detectLocation,
  } = useLocationState();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <View style={styles.locationCluster}>
          <View style={styles.locationIconBadge}>
            <LocationPinIcon />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationLabel}>{activeLocation.label}</Text>
            <TextInput
              value={locationInput}
              onChangeText={setLocationInput}
              onFocus={() => setExpanded(true)}
              onSubmitEditing={() => {
                applyLocationInput();
                setExpanded(false);
              }}
              placeholder="Change location"
              placeholderTextColor="#9a8e84"
              style={styles.locationInput}
              testID="top-location-input"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setExpanded((current) => !current)}
            testID="toggle-location-dropdown"
          >
            <ChevronIcon expanded={expanded} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, locating && styles.iconButtonDisabled]}
            onPress={detectLocation}
            disabled={locating}
            testID="detect-location-button"
          >
            {locating ? <ActivityIndicator size="small" color="#ca6b2c" /> : <DetectIcon />}
          </Pressable>
        </View>
      </View>

      {expanded ? (
        <View style={styles.dropdown}>
          {presets.map((preset) => {
            const active = preset.label === activeLocation.label;
            return (
              <Pressable
                key={preset.label}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                onPress={() => {
                  selectPreset(preset);
                  setExpanded(false);
                }}
              >
                <Text style={[styles.dropdownTitle, active && styles.dropdownTitleActive]}>{preset.label}</Text>
                <Text style={[styles.dropdownSubtitle, active && styles.dropdownSubtitleActive]}>
                  {preset.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 22,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  locationCluster: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flex: 1,
  },
  locationIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5dfcb",
    alignItems: "center",
    justifyContent: "center",
  },
  locationCopy: {
    flex: 1,
  },
  locationLabel: {
    color: "#231f1c",
    fontSize: 16,
    fontWeight: "800",
  },
  locationInput: {
    marginTop: 4,
    color: "#7d6f63",
    fontSize: 13,
    paddingVertical: 0,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfce",
    backgroundColor: "#f7f1e7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.7,
  },
  dropdown: {
    backgroundColor: "#fffdf8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfce",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1e8da",
  },
  dropdownItemActive: {
    backgroundColor: "#f9efe4",
  },
  dropdownTitle: {
    color: "#231f1c",
    fontWeight: "700",
    marginBottom: 2,
  },
  dropdownTitleActive: {
    color: "#8c4d24",
  },
  dropdownSubtitle: {
    color: "#75685e",
    fontSize: 13,
  },
  dropdownSubtitleActive: {
    color: "#8c4d24",
  },
});

const iconStyles = StyleSheet.create({
  pinWrap: {
    alignItems: "center",
  },
  pinCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ca6b2c",
    marginBottom: -2,
  },
  pinStem: {
    width: 8,
    height: 8,
    backgroundColor: "#ca6b2c",
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },
  detectWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  detectRing: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ca6b2c",
  },
  detectDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#ca6b2c",
  },
  chevronWrap: {
    width: 16,
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "180deg" }],
  },
  chevronWrapExpanded: {
    transform: [{ rotate: "0deg" }],
  },
  chevronLeft: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#4e433a",
    transform: [{ rotate: "45deg" }],
    marginRight: -2,
  },
  chevronRight: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#4e433a",
    transform: [{ rotate: "-45deg" }],
    marginLeft: -2,
  },
});
