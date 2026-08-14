export type RescueAssetKey =
  | 'rescueAgent'
  | 'repairRobot'
  | 'repairShip'
  | 'spaceBase'
  | 'signalDrone';

export interface RescueAssetManifestEntry {
  key: RescueAssetKey;
  source: 'procedural' | 'glb';
  url?: string;
}

export const RESCUE_ASSET_MANIFEST: Readonly<Record<RescueAssetKey, RescueAssetManifestEntry>> = {
  rescueAgent: { key: 'rescueAgent', source: 'procedural' },
  repairRobot: { key: 'repairRobot', source: 'procedural' },
  repairShip: { key: 'repairShip', source: 'procedural' },
  spaceBase: { key: 'spaceBase', source: 'procedural' },
  signalDrone: { key: 'signalDrone', source: 'procedural' },
};
