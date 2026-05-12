import type { Mission } from '@/lib/types';

const DEFAULT_ORDER_IMAGE_DATA_URL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22480%22 viewBox=%220 0 640 480%22%3E%3Crect width=%22640%22 height=%22480%22 fill=%22%23f5f3ff%22/%3E%3Crect x=%2258%22 y=%2256%22 width=%22524%22 height=%22368%22 rx=%2222%22 fill=%22%23ffffff%22 stroke=%22%23c4b5fd%22 stroke-width=%224%22/%3E%3Cpath d=%22M146 348l106-110 82 85 56-58 106 83v34H146z%22 fill=%22%238b5cf6%22/%3E%3Ccircle cx=%22214%22 cy=%22200%22 r=%2244%22 fill=%22%23ddd6fe%22/%3E%3Ctext x=%22320%22 y=%22128%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2229%22 fill=%22%235b21b6%22%3EMission Order Image%3C/text%3E%3C/svg%3E';
const DEFAULT_ORDER_IMAGE_NAME = 'mission-order-image.svg';

export interface MissionAssignmentOrder {
  id: string;
  missionId: string;
  mission: Mission;
  imageDataUrl: string;
  imageName: string;
  volunteerId: string;
  volunteerName: string;
  ngoId: string;
  ngoName: string;
  status: 'sent' | 'accepted' | 'dismissed';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'mission_assignment_orders';
const CHANGE_EVENT = 'mission_assignment_orders_updated';

type MissionAssignmentOrderMap = Record<string, MissionAssignmentOrder>;

type MissionAssignmentOrderInput = Omit<MissionAssignmentOrder, 'imageDataUrl' | 'imageName'> & {
  imageDataUrl?: string | null;
  imageName?: string | null;
};

function normalizeOrderImageValue(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value : DEFAULT_ORDER_IMAGE_DATA_URL;
}

function normalizeOrderImageName(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value : DEFAULT_ORDER_IMAGE_NAME;
}

export function resolveMissionAssignmentOrderImage(imageDataUrl?: string | null, imageName?: string | null) {
  return {
    imageDataUrl: normalizeOrderImageValue(imageDataUrl),
    imageName: normalizeOrderImageName(imageName),
  };
}

function normalizeMissionAssignmentOrder(value: unknown): MissionAssignmentOrder | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<MissionAssignmentOrderInput>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.missionId !== 'string' ||
    typeof candidate.volunteerId !== 'string' ||
    typeof candidate.volunteerName !== 'string' ||
    typeof candidate.ngoId !== 'string' ||
    typeof candidate.ngoName !== 'string' ||
    typeof candidate.status !== 'string' ||
    typeof candidate.createdAt !== 'number' ||
    typeof candidate.updatedAt !== 'number' ||
    typeof candidate.mission !== 'object' ||
    candidate.mission === null
  ) {
    return null;
  }

  const { imageDataUrl, imageName } = resolveMissionAssignmentOrderImage(candidate.imageDataUrl, candidate.imageName);

  return {
    ...candidate,
    mission: candidate.mission as Mission,
    imageDataUrl,
    imageName,
  } as MissionAssignmentOrder;
}

function isMissionAssignmentOrder(value: unknown): value is MissionAssignmentOrder {
  return normalizeMissionAssignmentOrder(value) !== null;
}

function readOrderMap(): MissionAssignmentOrderMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return Object.entries(parsed).reduce<MissionAssignmentOrderMap>((accumulator, [orderId, value]) => {
      const normalizedOrder = normalizeMissionAssignmentOrder(value);
      if (normalizedOrder && isMissionAssignmentOrder(normalizedOrder)) {
        accumulator[orderId] = normalizedOrder;
      }
      return accumulator;
    }, {});
  } catch (error) {
    console.error('Error reading mission assignment orders:', error);
    return {};
  }
}

export function readMissionAssignmentOrders(): MissionAssignmentOrder[] {
  return Object.values(readOrderMap()).sort((left, right) => right.createdAt - left.createdAt);
}

export function readMissionAssignmentOrdersForVolunteer(volunteerId: string | null | undefined): MissionAssignmentOrder[] {
  if (!volunteerId) {
    return [];
  }

  return readMissionAssignmentOrders().filter((order) => order.volunteerId === volunteerId);
}

export function writeMissionAssignmentOrder(order: MissionAssignmentOrderInput) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const normalizedOrder = normalizeMissionAssignmentOrder(order);
    if (!normalizedOrder) {
      console.error('Cannot store invalid mission assignment order payload.');
      return;
    }

    const storedOrders = readOrderMap();
    storedOrders[normalizedOrder.id] = normalizedOrder;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedOrders));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Error storing mission assignment order:', error);
  }
}

export function updateMissionAssignmentOrderStatus(orderId: string, status: MissionAssignmentOrder['status']) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storedOrders = readOrderMap();
    const existingOrder = storedOrders[orderId];
    if (!existingOrder) {
      return;
    }

    storedOrders[orderId] = {
      ...existingOrder,
      status,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedOrders));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error('Error updating mission assignment order status:', error);
  }
}

export function subscribeToMissionAssignmentOrders(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
