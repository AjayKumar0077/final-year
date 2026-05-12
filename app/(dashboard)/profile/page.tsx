'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserProfile } from '@/lib/types';
import { Loader2, User, Save, Building, Phone, BookOpen, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [organization, setOrganization] = useState('');
  const [serviceRadius, setServiceRadius] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const profile = await getUserProfileOrFallback(supabase, session.user);
          setUser(profile);
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
          setBio(profile.bio || '');
          setOrganization(profile.organization || '');
          setServiceRadius(profile.service_radius_km?.toString() || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = {
        full_name: fullName,
        phone: phone,
        bio: bio,
        organization: organization,
        service_radius_km: serviceRadius ? parseFloat(serviceRadius) : null,
        updated_at: new Date().toISOString(),
      };

      const result = await (supabase
        .from('users')
        .update(updates)
        .eq('id', user.id) as any);

      if (result.error) {
        // Fallback for initial insert if row missing
        const upsertResult = await (supabase.from('users') as any).upsert({
          id: user.id,
          email: user.email,
          role: user.role,
          ...updates
        });
        if (upsertResult.error) {
          console.error('Update error:', upsertResult.error);
          toast.error('Could not save profile details to the database.');
        } else {
          toast.success('Profile created and updated successfully!');
        }
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-10">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className="text-muted-foreground capitalize">Role: {user.role}</p>
        </div>
      </div>

      <Card className="p-6 border border-primary/20 shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-primary" />
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="border-input focus:ring-primary/30"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4 text-primary" />
                Phone Number
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="border-input focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <BookOpen className="w-4 h-4 text-primary" />
              Bio / About
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {(user.role === 'ngo' || user.role === 'admin') && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Building className="w-4 h-4 text-primary" />
                Organization Name
              </label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Organization Name"
                className="border-input focus:ring-primary/30"
              />
            </div>
          )}

          {(user.role === 'volunteer' || user.role === 'ngo') && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Service Radius (km)
              </label>
              <Input
                type="number"
                value={serviceRadius}
                onChange={(e) => setServiceRadius(e.target.value)}
                placeholder="e.g., 10"
                className="border-input focus:ring-primary/30"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
