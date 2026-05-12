// @ts-nocheck
import { createClient } from '@/lib/supabase/client';
import { Donation, UserProfile, UserRole } from '@/lib/types';
import { calculateHaversineDistance } from '@/lib/geo-distance';

type NearestNGOResult = {
  ngo: UserProfile;
  distanceKm: number;
};

type QuerySingleResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

/**
+// @ts-nocheck
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateHaversineDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
}

/**
 * Find the nearest NGO to a donation location
 */
export async function findNearestNGO(
  latitude: number,
  longitude: number
): Promise<UserProfile | null> {
  const result = await findNearestNGOWithDistance(latitude, longitude);
  return result?.ngo ?? null;
}

async function findNearestNGOWithDistance(
  latitude: number,
  longitude: number
): Promise<NearestNGOResult | null> {
  try {
    const supabase = createClient();

    const { data: ngos, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'ngo');

    if (error || !ngos) {
      console.error('Error fetching NGOs:', error);
      return null;
    }

    // Filter NGOs with valid coordinates
    const ngoWithCoords = (ngos as UserProfile[]).filter(
      (ngo) => typeof ngo.latitude === 'number' && typeof ngo.longitude === 'number'
    );

    if (ngoWithCoords.length === 0) {
      // Fall back to any NGO profile so assignment still proceeds in partially configured environments.
      const fallbackNgo = (ngos as UserProfile[])[0] ?? null;
      if (!fallbackNgo) {
        console.warn('No NGOs available for assignment');
        return null;
      }
      return {
        ngo: fallbackNgo,
        distanceKm: Number.POSITIVE_INFINITY,
      };
    }

    const rankedNGOs = ngoWithCoords
      .map((ngo) => {
        const distanceKm = calculateDistance(
          latitude,
          longitude,
          ngo.latitude!,
          ngo.longitude!
        );
        return { ngo, distanceKm };
      })
      .sort((left, right) => left.distanceKm - right.distanceKm);

    const withinServiceRadius = rankedNGOs.filter(({ ngo, distanceKm }) => {
      if (typeof ngo.service_radius_km !== 'number' || ngo.service_radius_km <= 0) {
        return true;
      }
      return distanceKm <= ngo.service_radius_km;
    });

    const bestMatch = withinServiceRadius[0] ?? rankedNGOs[0] ?? null;
    if (!bestMatch) {
      return null;
    }

    return bestMatch;
  } catch (error) {
    console.error('Error finding nearest NGO:', error);
    return null;
  }
}

async function querySingleById<T extends Record<string, unknown>>(
  table: string,
  id: string,
): Promise<QuerySingleResult<T>> {
  const supabase = createClient();
  const query = supabase.from(table).select('*').eq('id', id);

  if (typeof (query as { maybeSingle?: unknown }).maybeSingle === 'function') {
    const result = await (query as { maybeSingle: () => Promise<QuerySingleResult<T>> }).maybeSingle();
    return {
      data: result.data,
      error: result.error,
    };
  }

  const result = await query;
  const rows = Array.isArray(result.data) ? (result.data as T[]) : [];
  return {
    data: rows[0] ?? null,
    error: result.error ?? null,
  };
}

async function getExistingDonationMissionIds(donationId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('missions')
    .select('id')
    .eq('source_entity_type', 'donation')
    .eq('source_entity_id', donationId);

  if (error || !data) {
    return [];
  }

  return (data as Array<{ id?: string }>)
    .map((item) => item.id)
    .filter((id): id is string => typeof id === 'string');
}

/**
 * Create mission/task for volunteers from a donation
 */
export async function createMissionFromDonation(
  donation: Donation,
  ngo: UserProfile
): Promise<string | null> {
  try {
    const supabase = createClient();

    const missionTitle = `Food Pickup: ${donation.description}`;
    const missionDescription = `
Pick up ${donation.quantity} meals of ${donation.description} from donor.
Pickup window: ${donation.pickup_time_window || 'Not specified'}
Location: ${donation.location || 'Not specified'}
Donor notes: ${donation.pickup_note || 'None'}
    `.trim();

    const { data, error } = await supabase
      .from('missions')
      .insert({
        case_report_id: undefined,
        source_role: 'donor',
        source_entity_type: 'donation',
        source_entity_id: donation.id,
        title: missionTitle,
        description: missionDescription,
        pickup_location: donation.location || 'Donor Location',
        pickup_latitude: donation.pickup_latitude,
        pickup_longitude: donation.pickup_longitude,
        delivery_location: `${ngo.organization || ngo.full_name || 'NGO'} Center`,
        delivery_latitude: ngo.latitude,
        delivery_longitude: ngo.longitude,
        status: 'pending',
        priority: 'normal',
        broadcast_to_roles: ['ngo', 'volunteer', 'reporter', 'admin'],
        last_geo_update_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select();

    if (error || !data || data.length === 0) {
      console.error('Error creating mission:', error);
      return null;
    }

    return data[0].id;
  } catch (error) {
    console.error('Error creating mission from donation:', error);
    return null;
  }
}

/**
 * Assign donation to nearest NGO and create corresponding missions
 */
export async function assignDonationToNearestNGO(
  donationId: string,
  latitude: number,
  longitude: number
): Promise<{ ngo: UserProfile | null; missionIds: string[] }> {
  try {
    const supabase = createClient();

    // Fetch the donation details first to keep assignment idempotent.
    const { data: donation, error: fetchError } = await querySingleById<Donation>('donations', donationId);

    if (fetchError || !donation) {
      console.error('Error fetching donation:', fetchError);
      return { ngo: null, missionIds: [] };
    }

    const existingMissionIds = donation.assigned_mission_ids?.length
      ? donation.assigned_mission_ids
      : await getExistingDonationMissionIds(donationId);

    if (donation.assigned_ngo_id && existingMissionIds.length > 0) {
      const existingNgo = await querySingleById<UserProfile>('users', donation.assigned_ngo_id);
      return {
        ngo: existingNgo.data,
        missionIds: existingMissionIds,
      };
    }

    // Find nearest NGO
    const nearestNGOMatch = await findNearestNGOWithDistance(latitude, longitude);
    const nearestNGO = nearestNGOMatch?.ngo ?? null;
    const distanceKm = nearestNGOMatch?.distanceKm ?? Number.POSITIVE_INFINITY;

    if (!nearestNGO) {
      console.warn('No nearby NGO found for donation');
      return { ngo: null, missionIds: [] };
    }

    // Create mission for volunteers
    const missionId = existingMissionIds.length > 0 ? null : await createMissionFromDonation(donation, nearestNGO);
    const missionIds = existingMissionIds.length > 0 ? existingMissionIds : missionId ? [missionId] : [];

    // Update donation with assigned NGO
    const { error: updateError } = await supabase
      .from('donations')
      .update({
        assigned_ngo_id: nearestNGO.id,
        assigned_ngo_name: nearestNGO.full_name || nearestNGO.organization,
        assigned_ngo_distance_km: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : undefined,
        assignment_status: 'assigned',
        assigned_at: new Date().toISOString(),
        assigned_mission_ids: missionIds,
        broadcast_to_roles: ['ngo', 'volunteer', 'reporter', 'admin'],
      })
      .eq('id', donationId);

    if (updateError) {
      console.error('Error updating donation:', updateError);
    }

    return { ngo: nearestNGO, missionIds };
  } catch (error) {
    console.error('Error assigning donation to NGO:', error);
    return { ngo: null, missionIds: [] };
  }
}

/**
 * Create a donation notification for NGO
 */
export async function notifyNGOOfDonation(
  ngoId: string,
  donation: Donation,
  missionIds: string[]
): Promise<void> {
  try {
    const notificationMessage = `
New food donation received!
Description: ${donation.description}
Quantity: ${donation.quantity} meals
Location: ${donation.location}
Pickup time: ${donation.pickup_time_window}
${missionIds.length > 0 ? `\nMission(s) created: ${missionIds.join(', ')}` : 'No missions created yet'}
    `.trim();

    // You can store this in a notifications table or broadcast it
    console.log(`[NGO ${ngoId}] ${notificationMessage}`);

    // Optional: Store in a notifications table if it exists
    // await supabase.from('notifications').insert({
    //   recipient_id: ngoId,
    //   message: notificationMessage,
    //   related_donation_id: donation.id,
    //   created_at: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('Error notifying NGO:', error);
  }
}

/**
 * Broadcast donation data to specific roles
 */
export async function broadcastDonationToRoles(
  donation: Donation,
  roles: UserRole[]
): Promise<void> {
  try {
    for (const role of roles) {
      if (role === 'ngo') {
        if (donation.assigned_ngo_id) {
          await notifyNGOOfDonation(
            donation.assigned_ngo_id,
            donation,
            donation.assigned_mission_ids || []
          );
        }
      } else if (role === 'volunteer') {
        // Volunteers can see missions created from this donation
        console.log(
          `[Volunteer] Food delivery mission available: ${donation.description}`
        );
      } else if (role === 'reporter') {
        // Reporters can see food distribution activities
        console.log(
          `[Reporter] Food donation tracked: ${donation.description} at ${donation.location}`
        );
      } else if (role === 'admin') {
        // Admins can see all donation assignments
        console.log(
          `[Admin] Donation ${donation.id} assigned to NGO ${donation.assigned_ngo_id}`
        );
      }
    }
  } catch (error) {
    console.error('Error broadcasting donation:', error);
  }
}

/**
 * Complete donation workflow: assign to NGO, create missions, broadcast
 */
export async function processDonation(
  donationId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    // Step 1: Assign to nearest NGO and create missions
    const { ngo, missionIds } = await assignDonationToNearestNGO(
      donationId,
      latitude,
      longitude
    );

    if (!ngo) {
      console.warn('Could not assign donation to NGO');
      return;
    }

    // Step 2: Fetch updated donation
    const supabase = createClient();
    const { data: updatedDonation } = await querySingleById<Donation>('donations', donationId);

    if (!updatedDonation) return;

    // Step 3: Broadcast to all relevant roles
    const rolesToNotify = updatedDonation.broadcast_to_roles || [
      'ngo',
      'volunteer',
      'reporter',
      'admin',
    ];
    if (!updatedDonation.broadcast_to_roles?.length) {
      await supabase
        .from('donations')
        .update({ broadcast_to_roles: rolesToNotify })
        .eq('id', donationId);
    }
    await broadcastDonationToRoles(updatedDonation, rolesToNotify);

    console.log(`✓ Donation ${donationId} processed successfully`);
    console.log(`  - Assigned to NGO: ${ngo.full_name}`);
    console.log(`  - Created missions: ${missionIds.join(', ')}`);
    console.log(`  - Broadcast to roles: ${rolesToNotify.join(', ')}`);
  } catch (error) {
    console.error('Error processing donation:', error);
  }
}
