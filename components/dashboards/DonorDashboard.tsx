'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MapPin, Trophy, Plus, Loader2, TrendingUp, Navigation2, Clock4, LocateFixed, Activity, ShieldCheck, Image as ImageIcon, AlertTriangle, Globe, CheckCircle2 } from 'lucide-react';
import { Donation, UserProfile } from '@/lib/types';
import { useCurrentUserLocation } from '@/hooks/use-location-store';
import { isLocationInIndia, getLocationErrorMessage } from '@/lib/geo-validation';
import { processDonation } from '@/lib/donation-distribution';
import NextImage from 'next/image';
import { writeAuditEvent } from '@/lib/audit-log';
import { SatellitePulseMap } from '@/components/SatellitePulseMap';
import { RoleLocationPanel } from '@/components/RoleLocationPanel';
import { IMAGE_CONSTRAINTS, DONATION_CONFIG } from '@/lib/config';
import { GEO_CONFIG } from '@/lib/config';
import { dedupeDonations, sanitizeInput } from '@/lib/data-utils';

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return DONATION_CONFIG.DEFAULT_QUANTITY;
  return Math.max(DONATION_CONFIG.MIN_QUANTITY, Math.min(DONATION_CONFIG.MAX_QUANTITY, Math.floor(value)));
}

export function DonorDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealCount, setMealCount] = useState(0);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [pickupNote, setPickupNote] = useState('');
  const [pickupTime, setPickupTime] = useState('Today 5 PM - 7 PM');
  const [packagingImageDataUrl, setPackagingImageDataUrl] = useState<string>('');
  const [packagingImageName, setPackagingImageName] = useState<string>('');
  const [packagingImageSizeKb, setPackagingImageSizeKb] = useState<number>(0);
  const [packagingQualityStatus, setPackagingQualityStatus] = useState<'pass' | 'review' | 'pending'>('pending');
  const [uploadError, setUploadError] = useState<string>('');
  const [pinnedPickupLatitude, setPinnedPickupLatitude] = useState<number | null>(null);
  const [pinnedPickupLongitude, setPinnedPickupLongitude] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const userLocation = useCurrentUserLocation();
  const geoStatus = userLocation ? 'active' : 'checking';
  const lastLocationUpdate = userLocation ? new Date(userLocation.timestamp).toLocaleTimeString() : null;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const [userRes, donationsRes] = (await Promise.all([
          getUserProfileOrFallback(supabase, session.user),
          supabase
            .from('donations')
            .select('*')
            .eq('donor_id', session.user.id)
            .order('created_at', { ascending: false }),
        ])) as [UserProfile | null, { data: Donation[] | null }];

        setUser(userRes);

        if (donationsRes.data) {
          const uniqueDonations = dedupeDonations(donationsRes.data as Donation[]);
          setDonations(uniqueDonations);
          const total = uniqueDonations.reduce(
            (sum: number, d: Donation) => sum + (d.quantity || 1),
            0,
          );
          setMealCount(total);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    const safeDescription = sanitizeInput(description, 160);
    const safePickupTime = sanitizeInput(pickupTime, 80);
    const safePickupNote = sanitizeInput(pickupNote, 140);
    const safeQuantity = clampQuantity(quantity);

    if (!safeDescription) {
      setUploadError('Donation description is required.');
      return;
    }

    if (!packagingImageDataUrl) {
      setUploadError('Upload a food packing image for quality check.');
      return;
    }

    // Determine pickup location: pinned or device location
    const effectivePickupLat = pinnedPickupLatitude ?? userLocation?.latitude;
    const effectivePickupLng = pinnedPickupLongitude ?? userLocation?.longitude;

    // India geolocation validation
    if (!effectivePickupLat || !effectivePickupLng) {
      setUploadError('Location is required. Either pin a location on the map or enable device location services.');
      return;
    }

    if (!isLocationInIndia(effectivePickupLat, effectivePickupLng)) {
      setUploadError(getLocationErrorMessage());
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const { error } = await supabase.from('donations').insert({
        donor_id: session.user.id,
        description: safeDescription,
        quantity: safeQuantity,
        location: `${effectivePickupLat.toFixed(5)}, ${effectivePickupLng.toFixed(5)} | ${safePickupTime}${safePickupNote ? ` | ${safePickupNote}` : ''}`,
        pickup_time_window: safePickupTime,
        pickup_note: safePickupNote,
        pickup_latitude: effectivePickupLat,
        pickup_longitude: effectivePickupLng,
        packaging_image_data_url: packagingImageDataUrl,
        packaging_image_name: packagingImageName,
        packaging_quality_status: packagingQualityStatus,
        broadcast_to_roles: ['ngo', 'volunteer', 'reporter', 'admin'],
      });

      if (error) throw error;

      const latestDonationRes = (await supabase
        .from('donations')
        .select('id')
        .eq('donor_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: { id?: string } | null };

      const donationId = latestDonationRes.data?.id;

      writeAuditEvent({
        actorId: session.user.id,
        actorName: user?.full_name || session.user.email || 'Donor',
        actorRole: 'donor',
        action: 'create_donation',
        page: '/donor',
        entityType: 'donation',
        entityId: donationId || `${Date.now()}`,
        status: 'success',
        detail: `quantity=${safeQuantity}; quality=${packagingQualityStatus}`,
      });
      
      // Auto-process donation: find nearest NGO, create missions, broadcast to roles
      if (donationId) {
        setSuccessMessage(`Donation submitted! Processing assignment to nearest NGO...`);
        setShowSuccessNotification(true);

        // Process asynchronously without blocking UI
        processDonation(donationId, effectivePickupLat, effectivePickupLng).catch(err => {
          console.error('Error processing donation:', err);
        }).finally(() => {
          fetchDashboardData().catch((refreshError) => {
            console.error('Error refreshing donor dashboard after processing donation:', refreshError);
          });
        });
      }

      // Reset form and refresh data
      setDescription('');
      setQuantity(1);
      setPickupNote('');
      setPickupTime('Today 5 PM - 7 PM');
      setPackagingImageDataUrl('');
      setPackagingImageName('');
      setPackagingImageSizeKb(0);
      setPackagingQualityStatus('pending');
      setPinnedPickupLatitude(null);
      setPinnedPickupLongitude(null);
      setShowMapPicker(false);
      setShowDonateForm(false);
      
      // Auto-hide success notification after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);

      await fetchDashboardData();
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error creating donation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePackagingImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) {
      setPackagingImageDataUrl('');
      setPackagingImageName('');
      setPackagingImageSizeKb(0);
      setPackagingQualityStatus('pending');
      return;
    }

    if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as typeof IMAGE_CONSTRAINTS.ALLOWED_TYPES[number])) {
      setUploadError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }

    if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
      setUploadError('Image must be 3MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setUploadError('Could not read selected image.');
        return;
      }

      const image = new window.Image();
      image.onload = () => {
        const status = image.width >= 640 && image.height >= 480 && file.size >= 50 * 1024 ? 'pass' : 'review';
        setPackagingQualityStatus(status);
      };
      image.src = dataUrl;

      setPackagingImageDataUrl(dataUrl);
      setPackagingImageName(file.name);
      setPackagingImageSizeKb(Math.round(file.size / 1024));
    };
    reader.readAsDataURL(file);
  };

  const now = Date.now();
  const uniqueDonations = useMemo(() => dedupeDonations(donations), [donations]);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeekMeals = uniqueDonations
    .filter((donation) => new Date(donation.created_at).getTime() >= weekAgo)
    .reduce((sum, donation) => sum + (donation.quantity || 0), 0);

  const pickupReadyCount = uniqueDonations.filter((donation) => Boolean(donation.location)).length;

  const mapLat = userLocation?.latitude ?? GEO_CONFIG.DEFAULT_LOCATION.latitude;
  const mapLng = userLocation?.longitude ?? GEO_CONFIG.DEFAULT_LOCATION.longitude;
  const mapCenter = {
    latitude: pinnedPickupLatitude ?? mapLat,
    longitude: pinnedPickupLongitude ?? mapLng,
  };
  const mapMarkers = [
    ...(pinnedPickupLatitude !== null && pinnedPickupLongitude !== null
      ? [{
          id: 'pinned-pickup',
          latitude: pinnedPickupLatitude,
          longitude: pinnedPickupLongitude,
          label: 'Pinned pickup',
          description: 'Custom pickup location for this donation',
          color: '#f59e0b',
        }]
      : []),
    ...(userLocation
      ? [{
          id: 'device-location',
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          label: 'Device location',
          description: 'Auto-captured live location',
          color: '#16a34a',
        }]
      : []),
  ].filter((marker, index, markers) => {
    const key = `${marker.latitude.toFixed(5)}:${marker.longitude.toFixed(5)}`;
    return markers.findIndex((item) => `${item.latitude.toFixed(5)}:${item.longitude.toFixed(5)}` === key) === index;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="animate-slide-down rounded-2xl bg-green-50 border border-green-200 p-4 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">{successMessage}</h3>
              <p className="text-sm text-green-700 mt-1">
                Your donation is being assigned to the nearest NGO and missions are being created for volunteers.
              </p>
            </div>
            <Button
              onClick={() => setShowSuccessNotification(false)}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-slide-up">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Welcome back, {user?.full_name}!</h1>
            </div>
          </div>
          <p className="text-muted-foreground ml-11">Track your impact and share food with your community</p>
        </div>
        <Button
          onClick={() => setShowDonateForm(!showDonateForm)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 whitespace-nowrap transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Donate Food
        </Button>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-fade-in">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/0 border border-primary/20 shadow-card hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Meals Provided</p>
              <p className="text-5xl font-bold text-primary mt-3">{mealCount}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{Math.max(0, uniqueDonations.length)} this month
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/0 border border-secondary/20 shadow-card hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Total Donations</p>
              <p className="text-5xl font-bold text-secondary mt-3">{uniqueDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Donations shared</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <MapPin className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/0 border border-accent/20 shadow-card hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">Impact Level</p>
              <p className="text-5xl font-bold text-accent mt-3">{mealCount > 0 ? 'Hero' : 'Getting Started'}</p>
              <p className="text-xs text-muted-foreground mt-2">Community champion</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-card hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">This Week Meals</p>
              <p className="text-5xl font-bold text-blue-600 mt-3">{thisWeekMeals}</p>
              <p className="text-xs text-muted-foreground mt-2">Pickup-ready records: {pickupReadyCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Geolocation + Satellite map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
        <Card className="p-6 lg:col-span-2 border border-blue-200 bg-blue-50/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-blue-600" />
              Pickup Zone Map (Satellite)
            </h2>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              geoStatus === 'active'
                ? 'bg-green-100 text-green-700'
                : geoStatus === 'checking'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {geoStatus === 'active' ? 'Location Active' : geoStatus === 'checking' ? 'Locating...' : 'Location Blocked'}
            </span>
          </div>
          <div className="h-80 rounded-xl overflow-hidden border border-blue-200 bg-white">
            <SatellitePulseMap
              center={mapCenter}
              markers={mapMarkers}
              heightClassName="h-80"
              zoom={13}
              centerLabel="Donation center point"
            />
          </div>
        </Card>

        <Card className="p-6 border border-slate-200">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <LocateFixed className="w-4 h-4 text-blue-600" />
            Pickup Geolocation Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Latitude</p>
              <p className="font-semibold text-foreground">{userLocation ? userLocation.latitude.toFixed(6) : 'Unavailable'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Longitude</p>
              <p className="font-semibold text-foreground">{userLocation ? userLocation.longitude.toFixed(6) : 'Unavailable'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-semibold text-foreground">{lastLocationUpdate || 'Waiting for signal'}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-muted-foreground">Suggested Pickup Window</p>
              <p className="font-semibold text-foreground">{pickupTime}</p>
            </div>
          </div>
        </Card>
      </div>

      <RoleLocationPanel
        title="Donor Location Pin"
        userId={user?.id}
        userName={user?.full_name || user?.email || 'Donor'}
        userRole="donor"
        currentLocation={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          timestamp: userLocation.timestamp,
        } : null}
      />

      {/* Donation Form */}
      {showDonateForm && (
        <Card className="p-6 border-2 border-primary/30 bg-primary/5 shadow-lg animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add a New Donation
          </h2>
          <form onSubmit={handleDonate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                What are you donating?
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Fresh vegetables, baked goods, packaged meals"
                disabled={submitting}
                required
                className="border-border focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Number of meals
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                disabled={submitting}
                className="border-border focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Pickup time window
              </label>
              <Input
                type="text"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="e.g., Today 5 PM - 7 PM"
                disabled={submitting}
                className="border-border focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Pickup details for volunteers
              </label>
              <Input
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="e.g., Ring bell at gate 2, call before arrival"
                disabled={submitting}
                className="border-border focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Pin Pickup Location on Map
              </label>
              <Button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                variant="outline"
                className="w-full gap-2 mb-3"
                disabled={submitting}
              >
                <MapPin className="h-4 w-4" />
                {showMapPicker ? 'Hide Map Picker' : 'Show Map Picker'}
              </Button>
              
              {showMapPicker && (
                <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 mb-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Use satellite preview and enter exact pickup coordinates</p>
                  <div className="relative h-80 w-full rounded-lg border border-blue-200 bg-white overflow-hidden" id="map-picker">
                    <SatellitePulseMap
                      center={mapCenter}
                      markers={mapMarkers}
                      pinnedPoint={
                        pinnedPickupLatitude !== null && pinnedPickupLongitude !== null
                          ? { latitude: pinnedPickupLatitude, longitude: pinnedPickupLongitude }
                          : null
                      }
                      enablePinSelection
                      onPinSelect={(point) => {
                        setPinnedPickupLatitude(point.latitude);
                        setPinnedPickupLongitude(point.longitude);
                      }}
                      heightClassName="h-80"
                      zoom={14}
                      centerLabel="Pickup pin preview"
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 shadow-sm text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Selected Location:</span>
                    </div>
                    <div className="font-mono text-gray-600">
                      {pinnedPickupLatitude !== null && pinnedPickupLongitude !== null ? (
                        `${pinnedPickupLatitude.toFixed(5)}, ${pinnedPickupLongitude.toFixed(5)}`
                      ) : (
                        'No pin selected'
                      )}
                    </div>
                  </div>

                  {pinnedPickupLatitude && pinnedPickupLongitude && (
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-700">
                        ✓ Location pinned: {pinnedPickupLatitude.toFixed(5)}, {pinnedPickupLongitude.toFixed(5)}
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setShowMapPicker(false)}
                    variant="secondary"
                    className="w-full mt-3"
                    disabled={submitting}
                  >
                    Close Map Picker
                  </Button>
                </div>
              )}

              {pinnedPickupLatitude && pinnedPickupLongitude && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm mb-4">
                  <p className="text-green-700 font-semibold">✓ Pinned location: {pinnedPickupLatitude.toFixed(5)}, {pinnedPickupLongitude.toFixed(5)}</p>
                  <Button
                    type="button"
                    onClick={() => {
                      setPinnedPickupLatitude(null);
                      setPinnedPickupLongitude(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={submitting}
                  >
                    Clear pinned location
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Food packing image for quality check
              </label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={submitting}
                onChange={handlePackagingImageChange}
                className="border-border focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Security: only JPG/PNG/WEBP, max 3MB. Image is checked for minimum quality.
              </p>

              {packagingImageDataUrl && (
                <div className="mt-3 rounded-lg border border-border bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="font-semibold text-foreground truncate">{packagingImageName}</p>
                    <span className="text-muted-foreground">{packagingImageSizeKb} KB</span>
                  </div>
                  <NextImage
                    src={packagingImageDataUrl}
                    alt="Food packing preview"
                    width={640}
                    height={256}
                    unoptimized
                    className="mt-2 h-32 w-full rounded-md object-cover border border-border"
                  />
                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold">
                    <ImageIcon className="w-3 h-3" />
                    <span className={`rounded-full px-2 py-1 ${
                      packagingQualityStatus === 'pass'
                        ? 'bg-green-100 text-green-700'
                        : packagingQualityStatus === 'review'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      Quality Check: {packagingQualityStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mt-2 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {uploadError}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <Clock4 className="w-4 h-4" />
                Pickup Location Options
              </div>
              <p className="mt-1 text-blue-700/80">
                <strong>Option 1:</strong> Pin a custom location using the map picker above.
              </p>
              <p className="text-blue-700/80">
                <strong>Option 2:</strong> Use auto-detected device location {userLocation ? `(${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)})` : '(enable location access)'}.
              </p>
              <p className="text-blue-700/80 mt-1 text-xs">
                Pinned location takes priority if set. Fallback to device location if no pinned location.
              </p>
            </div>

            <div className={`rounded-lg border p-3 text-sm ${
              pinnedPickupLatitude && pinnedPickupLongitude && isLocationInIndia(pinnedPickupLatitude, pinnedPickupLongitude)
                ? 'bg-green-50 border-green-200'
                : userLocation && isLocationInIndia(userLocation.latitude, userLocation.longitude)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`flex items-center gap-2 font-semibold ${
                pinnedPickupLatitude && pinnedPickupLongitude && isLocationInIndia(pinnedPickupLatitude, pinnedPickupLongitude)
                  ? 'text-green-700'
                  : userLocation && isLocationInIndia(userLocation.latitude, userLocation.longitude)
                    ? 'text-green-700'
                    : 'text-orange-700'
              }`}>
                <Globe className="w-4 h-4" />
                India Geolocation Requirement
              </div>
              <p className={`mt-1 ${
                (pinnedPickupLatitude && pinnedPickupLongitude && isLocationInIndia(pinnedPickupLatitude, pinnedPickupLongitude)) ||
                (userLocation && isLocationInIndia(userLocation.latitude, userLocation.longitude))
                  ? 'text-green-700/80'
                  : 'text-orange-700/80'
              }`}>
                {(pinnedPickupLatitude && pinnedPickupLongitude && isLocationInIndia(pinnedPickupLatitude, pinnedPickupLongitude))
                  ? '✓ Pinned location is within India. Food donations are enabled.'
                  : (userLocation && isLocationInIndia(userLocation.latitude, userLocation.longitude))
                    ? '✓ Your device location is within India. Food donations are enabled.'
                    : (pinnedPickupLatitude && pinnedPickupLongitude)
                      ? '✗ Pinned location is outside India. Food donations are restricted to India only.'
                      : userLocation
                        ? '✗ Your location is outside India. Food donations are restricted to India only.'
                        : '⊘ Location required. Please pin a location or enable location services to proceed.'}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Security Controls Enabled
              </div>
              <p className="mt-1 text-green-700/80">
                Input sanitization, image type/size validation, quantity limits, India geolocation restriction, and donation trace are enforced.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Donation'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowDonateForm(false)}
                variant="outline"
                className="border-border"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Recent Donations */}
      <div className="animate-slide-up">
        <h2 className="text-xl font-bold text-foreground mb-5">Recent Donations</h2>
        {uniqueDonations.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No donations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start sharing food with your community to make an impact!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {uniqueDonations.map((donation) => (
              <Card
                key={donation.id} 
                className="p-5 flex items-center justify-between shadow-card hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 animate-fade-in"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{donation.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(donation.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  {donation.location && (
                    <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Pickup: {donation.location}
                    </p>
                  )}
                  {donation.packaging_quality_status && (
                    <p className="text-xs mt-1">
                      <span className={`rounded-full px-2 py-1 font-semibold ${
                        donation.packaging_quality_status === 'pass'
                          ? 'bg-green-100 text-green-700'
                          : donation.packaging_quality_status === 'review'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        Quality: {donation.packaging_quality_status.toUpperCase()}
                      </span>
                    </p>
                  )}
                  {donation.assigned_ngo_name && (
                    <p className="text-xs text-emerald-700 mt-2 font-medium">
                      Assigned NGO: {donation.assigned_ngo_name}
                      {typeof donation.assigned_ngo_distance_km === 'number'
                        ? ` (${donation.assigned_ngo_distance_km.toFixed(2)} km)`
                        : ''}
                    </p>
                  )}
                </div>
                <div className="text-right pl-4">
                  <p className="text-3xl font-bold text-primary">{donation.quantity}</p>
                  <p className="text-xs text-muted-foreground font-medium">meals</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quality Gallery */}
      {uniqueDonations.some((d) => d.packaging_image_data_url) && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-foreground mb-5">Food Packing Quality Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueDonations
              .filter((donation) => donation.packaging_image_data_url)
              .slice(0, 6)
              .map((donation) => {
                const imageUrl = donation.packaging_image_data_url ?? '';

                return (
                  <Card key={`gallery-${donation.id}`} className="p-3">
                    <NextImage
                      src={imageUrl}
                      alt={`Food packing for ${donation.description}`}
                      width={640}
                      height={352}
                      unoptimized
                      className="h-44 w-full rounded-md object-cover border border-border"
                    />
                    <p className="mt-2 text-sm font-semibold text-foreground truncate">{donation.description}</p>
                    <p className="text-xs text-muted-foreground">{donation.packaging_image_name || 'Image uploaded'}</p>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
