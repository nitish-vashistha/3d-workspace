/** Equipment type identifier — stable, used as key */
export type EquipmentTypeId = 'cabinet' | 'drive' | 'control-panel';

/** Definition of an equipment type in the palette */
export interface EquipmentTypeDefinition {
  id: EquipmentTypeId;
  nameKey: string; // i18n key
  width: number;   // metres (X-axis)
  height: number;  // metres (Y-axis, vertical)
  depth: number;   // metres (Z-axis)
  color: string;   // hex colour
  bomCategory: string;
  defaultProperties: Record<string, string | number>;
}

/** All available equipment types */
export const EQUIPMENT_TYPES: Record<EquipmentTypeId, EquipmentTypeDefinition> = {
  cabinet: {
    id: 'cabinet',
    nameKey: 'equipment.cabinet',
    width: 0.8,
    height: 2.2,
    depth: 0.6,
    color: '#4a6fa5',
    bomCategory: 'Enclosures',
    defaultProperties: {
      rating: 'IP54',
      material: 'Steel',
      voltage: 400,
    },
  },
  drive: {
    id: 'drive',
    nameKey: 'equipment.drive',
    width: 0.5,
    height: 1.5,
    depth: 0.4,
    color: '#e07a3a',
    bomCategory: 'Drives',
    defaultProperties: {
      power: '15kW',
      voltage: 400,
      protocol: 'Profinet',
    },
  },
  'control-panel': {
    id: 'control-panel',
    nameKey: 'equipment.controlPanel',
    width: 1.0,
    height: 1.8,
    depth: 0.5,
    color: '#5a9e6f',
    bomCategory: 'Control Systems',
    defaultProperties: {
      plcType: 'S7-1500',
      ioPoints: 128,
      redundancy: 'None',
    },
  },
};

