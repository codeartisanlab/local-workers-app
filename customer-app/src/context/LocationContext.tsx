import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type LocationPreset = {
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

type LocationState = {
  presets: LocationPreset[];
  activeLocation: LocationPreset;
  locationInput: string;
  locating: boolean;
  setLocationInput: (value: string) => void;
  applyLocationInput: () => void;
  selectPreset: (preset: LocationPreset) => void;
  detectLocation: () => void;
  coordinates: { latitude: number; longitude: number };
};

const locationPresets: LocationPreset[] = [
  { label: "Downtown", subtitle: "221B Baker Street", latitude: 12.9716, longitude: 77.5946 },
  { label: "MG Road", subtitle: "12 MG Road", latitude: 12.9755, longitude: 77.6065 },
  { label: "Richmond", subtitle: "45 Richmond Town", latitude: 12.9647, longitude: 77.6031 },
];

const LocationContext = createContext<LocationState | undefined>(undefined);

function getNearestPreset(latitude: number, longitude: number) {
  return locationPresets.reduce((closest, preset) => {
    const presetDelta = Math.abs(preset.latitude - latitude) + Math.abs(preset.longitude - longitude);
    const currentDelta =
      Math.abs(closest.latitude - latitude) + Math.abs(closest.longitude - longitude);
    return presetDelta < currentDelta ? preset : closest;
  }, locationPresets[0]);
}

export function LocationProvider({ children }: PropsWithChildren) {
  const [activeLocation, setActiveLocation] = useState(locationPresets[0]);
  const [locationInput, setLocationInput] = useState(locationPresets[0].subtitle);
  const [coordinates, setCoordinates] = useState({
    latitude: locationPresets[0].latitude,
    longitude: locationPresets[0].longitude,
  });
  const [locating, setLocating] = useState(false);

  function selectPreset(preset: LocationPreset) {
    setActiveLocation(preset);
    setLocationInput(preset.subtitle);
    setCoordinates({ latitude: preset.latitude, longitude: preset.longitude });
  }

  function applyLocationInput() {
    const normalized = locationInput.trim().toLowerCase();
    const matchedPreset =
      locationPresets.find(
        (preset) =>
          preset.label.toLowerCase() === normalized || preset.subtitle.toLowerCase() === normalized,
      ) ?? null;

    if (matchedPreset) {
      selectPreset(matchedPreset);
      return;
    }

    setActiveLocation((current) => ({
      ...current,
      subtitle: locationInput.trim() || current.subtitle,
    }));
  }

  function detectLocation() {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation) {
      selectPreset(locationPresets[0]);
      return;
    }

    setLocating(true);
    geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const nearestPreset = getNearestPreset(latitude, longitude);
        setCoordinates({ latitude, longitude });
        setActiveLocation(nearestPreset);
        setLocationInput(nearestPreset.subtitle);
        setLocating(false);
      },
      () => {
        selectPreset(locationPresets[0]);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      },
    );
  }

  const value = useMemo(
    () => ({
      presets: locationPresets,
      activeLocation,
      locationInput,
      locating,
      setLocationInput,
      applyLocationInput,
      selectPreset,
      detectLocation,
      coordinates,
    }),
    [activeLocation, locationInput, locating, coordinates],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationState() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationState must be used within LocationProvider");
  }
  return context;
}
