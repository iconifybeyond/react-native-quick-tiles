import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  QuickTiles,
  RequestAddTileResult,
  TileState,
  type TileStatus,
} from '@iconifybeyond/react-native-quick-tiles';

export default function App() {
  const [log, setLog] = useState<string[]>([
    'App started. Tap buttons to interact with the Quick Settings tile.',
  ]);
  const [tileStatus, setTileStatus] = useState<TileStatus | null>(null);
  const [isActive, setIsActive] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Subscribe to tile events
  useEffect(() => {
    if (Platform.OS !== 'android') {
      addLog('Not on Android — tile events unavailable.');
      return;
    }

    const subs = [
      QuickTiles.onTileClick(() => {
        addLog('⚡ Tile tapped!');
        // Toggle active/inactive on click
        setIsActive((prev) => {
          const next = !prev;
          QuickTiles.setTile({
            state: next ? TileState.Active : TileState.Inactive,
            label: next ? 'My Tile (ON)' : 'My Tile (OFF)',
          }).catch(() => {});
          return next;
        });
      }),
      QuickTiles.onTileAdded(() => addLog('✅ Tile added to Quick Settings')),
      QuickTiles.onTileRemoved(() => addLog('❌ Tile removed from Quick Settings')),
      QuickTiles.addTileListener('startListening', () =>
        addLog('👂 Tile startListening'),
      ),
      QuickTiles.addTileListener('stopListening', () =>
        addLog('🔇 Tile stopListening'),
      ),
    ];

    return () => subs.forEach((s) => s.remove());
  }, [addLog]);

  const handleSetActive = async () => {
    try {
      await QuickTiles.setTile({
        label: 'My Tile (ON)',
        subtitle: 'Active',
        state: TileState.Active,
      });
      setIsActive(true);
      addLog('setTile → ACTIVE');
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const handleSetInactive = async () => {
    try {
      await QuickTiles.setTile({
        label: 'My Tile (OFF)',
        subtitle: 'Inactive',
        state: TileState.Inactive,
      });
      setIsActive(false);
      addLog('setTile → INACTIVE');
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const handleSetCustom = async () => {
    try {
      await QuickTiles.setTile({
        label: 'Custom Label',
        subtitle: 'Custom Subtitle',
        iconName: 'ic_quick_tile',
        state: TileState.Active,
      });
      addLog('setTile → Custom label/subtitle/icon');
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const handleGetTile = async () => {
    try {
      const status = await QuickTiles.getTile();
      setTileStatus(status);
      addLog(`getTile → ${JSON.stringify(status)}`);
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const handleRequestAdd = async () => {
    try {
      const result = await QuickTiles.requestAddTile({
        label: 'My Tile',
        iconName: 'ic_quick_tile',
      });
      addLog(`requestAddTile → ${result}`);
      if (result === RequestAddTileResult.Unsupported) {
        addLog('(Device is below Android 13 — prompt not supported)');
      }
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  const handleToggle = async () => {
    try {
      const next = !isActive;
      await QuickTiles.setTile({
        label: next ? 'My Tile (ON)' : 'My Tile (OFF)',
        state: next ? TileState.Active : TileState.Inactive,
      });
      setIsActive(next);
      addLog(`Toggled → ${next ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (e: unknown) {
      addLog(`Error: ${String(e)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.heading}>Quick Tiles Example</Text>
      <Text style={styles.subheading}>
        {Platform.OS === 'android'
          ? `Tile is: ${isActive ? '🟢 ACTIVE' : '⚫ INACTIVE'}`
          : '⚠️  Android only'}
      </Text>

      <View style={styles.buttons}>
        <Button title="Set tile ACTIVE" onPress={handleSetActive} color="#2196F3" />
        <View style={styles.spacer} />
        <Button title="Set tile INACTIVE" onPress={handleSetInactive} color="#607D8B" />
        <View style={styles.spacer} />
        <Button title="Set custom label/subtitle/icon" onPress={handleSetCustom} color="#9C27B0" />
        <View style={styles.spacer} />
        <Button title="Toggle (click demo)" onPress={handleToggle} color="#FF5722" />
        <View style={styles.spacer} />
        <Button title="Get current tile state" onPress={handleGetTile} color="#009688" />
        <View style={styles.spacer} />
        <Button title="Request add tile (Android 13+)" onPress={handleRequestAdd} color="#FF9800" />
      </View>

      {tileStatus && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Last getTile() result:</Text>
          <Text style={styles.statusText}>{JSON.stringify(tileStatus, null, 2)}</Text>
        </View>
      )}

      <Text style={styles.logTitle}>Event log:</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.log}
        contentContainerStyle={styles.logContent}
      >
        {log.map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 12 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  subheading: { fontSize: 15, color: '#555', marginBottom: 12, textAlign: 'center' },
  buttons: { marginBottom: 12 },
  spacer: { height: 8 },
  statusBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statusTitle: { fontWeight: '600', marginBottom: 4 },
  statusText: { fontFamily: 'monospace', fontSize: 12 },
  logTitle: { fontWeight: '600', marginBottom: 4 },
  log: { flex: 1, backgroundColor: '#212121', borderRadius: 8 },
  logContent: { padding: 10 },
  logLine: { color: '#E0E0E0', fontFamily: 'monospace', fontSize: 12, marginBottom: 2 },
});
