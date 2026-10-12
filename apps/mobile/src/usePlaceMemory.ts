import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { samplePOIs } from "./fixtures";
import {
  emptyPlaceMemory,
  parsePlaceMemory,
  rememberPlace,
  toggleSavedPlace,
  PlaceMemory,
} from "./map/place-memory";

const key = "atlas:demo-venue:places:v1";
export function usePlaceMemory() {
  const [memory, setMemory] = useState<PlaceMemory>(emptyPlaceMemory);
  const [storageIssue, setStorageIssue] = useState(false);
  const [ready, setReady] = useState(false);
  const pending = useRef<((value: PlaceMemory) => PlaceMemory)[]>([]);
  const writes = useRef(Promise.resolve());
  const loadedSuccessfully = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        loadedSuccessfully.current = true;
        const loaded = parsePlaceMemory(
          raw,
          samplePOIs.map((p) => p.id),
        );
        setMemory(
          pending.current.reduce(
            (value, operation) => operation(value),
            loaded,
          ),
        );
      })
      .catch(() => {
        if (active) setStorageIssue(true);
      })
      .finally(() => {
        if (active) {
          pending.current = [];
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    // A failed read must not overwrite an unknown existing record with empty/session data.
    if (!ready || !loadedSuccessfully.current) return;
    // Serialize writes so rapid save/clear actions cannot restore older data.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(key, JSON.stringify(memory)))
      .then(() => setStorageIssue(false))
      .catch(() => setStorageIssue(true));
  }, [memory, ready]);
  const update = (operation: (value: PlaceMemory) => PlaceMemory) => {
    if (!ready) pending.current.push(operation);
    setMemory(operation);
  };
  return {
    ...memory,
    storageIssue,
    remember: (id: string) => update((value) => rememberPlace(value, id)),
    toggleSaved: (id: string) => update((value) => toggleSavedPlace(value, id)),
    clearRecent: () => update((value) => ({ ...value, recent: [] })),
  };
}
