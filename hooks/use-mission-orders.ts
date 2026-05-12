'use client';

import { useEffect, useState } from 'react';
import {
  readMissionAssignmentOrdersForVolunteer,
  subscribeToMissionAssignmentOrders,
  type MissionAssignmentOrder,
} from '@/lib/mission-order-store';
import { useSessionUserId } from '@/hooks/use-session';

export function useCurrentVolunteerMissionOrders() {
  const userId = useSessionUserId();
  const [orders, setOrders] = useState<MissionAssignmentOrder[]>([]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const refreshOrders = () => {
      setOrders(readMissionAssignmentOrdersForVolunteer(userId));
    };

    refreshOrders();
    const unsubscribe = subscribeToMissionAssignmentOrders(refreshOrders);

    return unsubscribe;
  }, [userId]);

  return userId ? orders : [];
}
