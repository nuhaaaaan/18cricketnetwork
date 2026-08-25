import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CM, coachingApi, uploadCertification, CoachProfile, Taxonomy } from '../../utils/coaching';
import { Field, Input, ChipSelect, Toggle, Checkbox } from '../../components/coaching/Fields';

const STEPS = [
  'Account & Identity',
  'Coaching Profile',
  'Coaching Services',
  'Qualifications',
  'Experience',
  'Pricing',
  'Location / Virtual',
  'Availability',
  'Policies & Agreements',
  'Review & Submit',
];

async function pickDocument(): Promise<any | null> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg';
      input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
      input.click();
    });
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require('expo-image-picker');
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled || !res.assets?.length) return null;
    const a = res.assets[0];
    return { uri: a.uri, name: a.fileName || 'upload.jpg', type: a.mimeType || 'image/jpeg' };
  } catch {
    return null;
  }
}

export default function ApplyScreen() {
  const router = useRouter();
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  // sub-resource state
  const [services, setServices] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const flash = (text: string, ok = true) => {
    setNotice({ text, ok });
    setTimeout(() => setNotice(null), 3000);
  };

  const patch = (p: Partial<CoachProfile>) => setProfile((prev) => ({ ...(prev as any), ...p }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, p] = await Promise.all([coachingApi.taxonomy(), coachingApi.myProfile().catch(() => null)]);
      setTax(t);
      let prof = p;
      if (!prof) {
        prof = await coachingApi.saveProfile({ onboardingStep: 1 });
      }
      setProfile(prof);
      setStep(Math.min((prof.onboardingStep || 1) - 1, STEPS.length - 1));
      const [sv, pr, ce, av] = await Promise.all([
        coachingApi.services().catch(() => []),
        coachingApi.pricing().catch(() => []),
        coachingApi.certifications().catch(() => []),
        coachingApi.availability().catch(() => ({ slots: [] })),
      ]);
      setServices(sv);
      setPricing(pr);
      setCerts(ce);
      setSlots((av as any).slots || []);
    } catch (e) {
      console.error('apply load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (extra: Partial<CoachProfile> = {}, nextStep?: number) => {
    setSaving(true);
    try {
      const payload = { ...extra, onboardingStep: (nextStep ?? step) + 1 };
      const updated = await coachingApi.saveProfile(payload);
      setProfile(updated);
      return true;
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not save', false);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async (extra: Partial<CoachProfile> = {}) => {
    const next = Math.min(step + 1, STEPS.length - 1);
    const ok = await saveProfile({ ...profile, ...extra } as any, next);
    if (ok) setStep(next);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const saveAndExit = async () => {
    await saveProfile(profile as any, step);
    flash('Draft saved. You can continue later.');
    setTimeout(() => router.push('/coaching' as any), 700);
  };

  const submit = async () => {
    setSaving(true);
    setSubmitErrors([]);
    try {
      await saveProfile(profile as any, step);
      await coachingApi.submit();
      flash('Application submitted for review!');
      setTimeout(() => router.replace('/coaching/dashboard' as any), 900);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail?.errors) setSubmitErrors(detail.errors);
      else flash(typeof detail === 'string' ? detail : 'Could not submit application', false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tax || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={CM.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={CM.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {STEPS[step]}
        </Text>
        <TouchableOpacity onPress={saveAndExit}>
          <Text style={styles.saveExit}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {step + 1} of {STEPS.length}
        </Text>
      </View>

      {notice && (
        <View style={[styles.notice, { backgroundColor: notice.ok ? CM.success : CM.primary }]}>
          <Text style={styles.noticeText}>{notice.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <Input label="Legal full name" value={profile.legalFullName || ''} onChangeText={(v) => patch({ legalFullName: v })} placeholder="As on your ID" />
            <Input label="Display name" value={profile.displayName || ''} onChangeText={(v) => patch({ displayName: v })} placeholder="Shown to players" />
            <Input label="Email" value={profile.email || ''} onChangeText={(v) => patch({ email: v })} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
            <Input label="Phone" value={profile.phone || ''} onChangeText={(v) => patch({ phone: v })} keyboardType="phone-pad" />
            <Input label="Date of birth (optional)" value={profile.dateOfBirth || ''} onChangeText={(v) => patch({ dateOfBirth: v })} placeholder="YYYY-MM-DD" />
            <Input label="Country" value={profile.country || ''} onChangeText={(v) => patch({ country: v })} placeholder="e.g. United Kingdom" />
            <Input label="State / Province" value={profile.state || ''} onChangeText={(v) => patch({ state: v })} />
            <Input label="City" value={profile.city || ''} onChangeText={(v) => patch({ city: v })} />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="Professional headline" hint='e.g. "ECB Level 2 Batting & Fielding Coach"' value={profile.headline || ''} onChangeText={(v) => patch({ headline: v })} />
            <Input label="Biography" value={profile.bio || ''} onChangeText={(v) => patch({ bio: v })} multiline />
            <Input label="Coaching philosophy" value={profile.coachingPhilosophy || ''} onChangeText={(v) => patch({ coachingPhilosophy: v })} multiline />
            <Input label="Years coaching" value={String(profile.yearsCoaching ?? '')} onChangeText={(v) => patch({ yearsCoaching: parseInt(v, 10) || 0 })} keyboardType="numeric" />
            <Input label="Years playing" value={String(profile.yearsPlaying ?? '')} onChangeText={(v) => patch({ yearsPlaying: parseInt(v, 10) || 0 })} keyboardType="numeric" />
            <Input label="Primary cricket role" value={profile.primaryRole || ''} onChangeText={(v) => patch({ primaryRole: v })} placeholder="e.g. Batting all-rounder" />
            <Field label="Age groups coached">
              <ChipSelect options={tax.ageGroups} selected={profile.ageGroups || []} onToggle={(o) => patch({ ageGroups: toggle(profile.ageGroups, o) })} />
            </Field>
            <Field label="Player levels">
              <ChipSelect options={tax.playerLevels} selected={profile.playerLevels || []} onToggle={(o) => patch({ playerLevels: toggle(profile.playerLevels, o) })} />
            </Field>
            <Field label="Specializations" hint="Select at least one">
              <ChipSelect
                options={allSubcategories(tax)}
                selected={profile.specializations || []}
                onToggle={(o) => patch({ specializations: toggle(profile.specializations, o) })}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <ServicesStep tax={tax} services={services} setServices={setServices} flash={flash} />
        )}

        {step === 3 && (
          <CertStep certs={certs} setCerts={setCerts} flash={flash} pickDocument={pickDocument} />
        )}

        {step === 4 && <ExperienceStep flash={flash} />}

        {step === 5 && (
          <PricingStep tax={tax} services={services} pricing={pricing} setPricing={setPricing} flash={flash} />
        )}

        {step === 6 && (
          <>
            <Toggle label="Offer virtual / online coaching" icon="videocam-outline" value={!!profile.virtualAvailable} onChange={(v) => patch({ virtualAvailable: v })} />
            {profile.virtualAvailable && (
              <>
                <Input label="Meeting provider" value={profile.meetingProvider || ''} onChangeText={(v) => patch({ meetingProvider: v })} placeholder="Zoom / Google Meet / Teams" />
                <Input label="Virtual instructions (private)" value={profile.virtualInstructions || ''} onChangeText={(v) => patch({ virtualInstructions: v })} multiline placeholder="Shared only with booked participants" />
              </>
            )}
            <Toggle label="Offer in-person coaching" icon="location-outline" value={!!profile.inPersonAvailable} onChange={(v) => patch({ inPersonAvailable: v })} />
            {profile.inPersonAvailable && (
              <>
                <Input label="Travel radius (km)" value={String(profile.travelRadiusKm ?? '')} onChangeText={(v) => patch({ travelRadiusKm: parseFloat(v) || 0 })} keyboardType="numeric" />
                <Toggle label="I can travel to the player" value={!!profile.canTravelToPlayer} onChange={(v) => patch({ canTravelToPlayer: v })} />
                <Toggle label="Player travels to me" value={!!profile.playerTravelsToCoach} onChange={(v) => patch({ playerTravelsToCoach: v })} />
              </>
            )}
          </>
        )}

        {step === 7 && (
          <AvailabilityStep tax={tax} slots={slots} setSlots={setSlots} flash={flash} initialTz={profile.availabilityTimezone} />
        )}

        {step === 8 && (
          <>
            <Input label="Cancellation policy" value={profile.cancellationPolicy || ''} onChangeText={(v) => patch({ cancellationPolicy: v })} multiline placeholder="e.g. Free cancellation up to 24 hours before the session" />
            <View style={styles.divider} />
            <Checkbox label="I agree to the 18 Cricket Network platform Terms." value={!!profile.agreedTerms} onChange={(v) => patch({ agreedTerms: v })} />
            <Checkbox label="I agree to the Coach Agreement." value={!!profile.agreedCoachAgreement} onChange={(v) => patch({ agreedCoachAgreement: v })} />
            <Checkbox label="I agree to safeguarding & community requirements (required when coaching minors)." value={!!profile.agreedSafeguarding} onChange={(v) => patch({ agreedSafeguarding: v })} />
          </>
        )}

        {step === 9 && (
          <ReviewStep
            profile={profile}
            services={services}
            pricing={pricing}
            certs={certs}
            slots={slots}
            patch={patch}
            errors={submitErrors}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="chevron-back" size={18} color={CM.text} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => goNext()} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Continue</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Submit Application</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ------- helpers ----------
function toggle(list: string[] | undefined, value: string): string[] {
  const arr = list || [];
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}
function allSubcategories(tax: Taxonomy): string[] {
  const out: string[] = [];
  tax.serviceTaxonomy.forEach((c) => c.subcategories.forEach((s) => out.push(s)));
  return out;
}

// ------- Step 3: Services ----------
function ServicesStep({ tax, services, setServices, flash }: any) {
  const [category, setCategory] = useState(tax.serviceTaxonomy[0].category);
  const [subcategory, setSubcategory] = useState('');
  const [title, setTitle] = useState('');
  const [virtual, setVirtual] = useState(false);
  const [inPerson, setInPerson] = useState(false);
  const subs = tax.serviceTaxonomy.find((c: any) => c.category === category)?.subcategories || [];

  const add = async () => {
    if (!title.trim()) return flash('Give the service a title', false);
    try {
      const svc = await coachingApi.addService({ category, subcategory, title: title.trim(), virtualAvailable: virtual, inPersonAvailable: inPerson });
      setServices([...services, svc]);
      setTitle('');
      flash('Service added');
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not add service', false);
    }
  };
  const remove = async (id: string) => {
    await coachingApi.deleteService(id);
    setServices(services.filter((s: any) => s.id !== id));
  };

  return (
    <>
      <Text style={styles.stepHint}>Choose the coaching services you provide. Add as many as you like.</Text>
      <Field label="Category">
        <ChipSelect options={tax.serviceTaxonomy.map((c: any) => c.category)} selected={[category]} onToggle={(c) => { setCategory(c); setSubcategory(''); }} />
      </Field>
      {subs.length > 0 && (
        <Field label="Subcategory">
          <ChipSelect options={subs} selected={subcategory ? [subcategory] : []} onToggle={(s) => setSubcategory(subcategory === s ? '' : s)} />
        </Field>
      )}
      <Input label="Service title" value={title} onChangeText={setTitle} placeholder="e.g. Batting Technique Session" />
      <Toggle label="Available virtually" value={virtual} onChange={setVirtual} />
      <Toggle label="Available in person" value={inPerson} onChange={setInPerson} />
      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Ionicons name="add" size={18} color={CM.primary} />
        <Text style={styles.addBtnText}>Add service</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 8 }}>
        {services.map((s: any) => (
          <View key={s.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{s.title}</Text>
              <Text style={styles.listSub}>{s.category}{s.subcategory ? ` · ${s.subcategory}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(s.id)}>
              <Ionicons name="trash-outline" size={20} color={CM.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );
}

// ------- Step 4: Certifications ----------
function CertStep({ certs, setCerts, flash, pickDocument }: any) {
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!name.trim() || !issuer.trim()) return flash('Enter certificate name and issuer', false);
    const file = await pickDocument();
    if (!file) return;
    setBusy(true);
    try {
      const cert = await uploadCertification({ file, name: name.trim(), issuer: issuer.trim() });
      setCerts([...certs, cert]);
      setName('');
      setIssuer('');
      flash('Certificate uploaded — pending verification');
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Upload failed', false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text style={styles.stepHint}>Upload coaching, safeguarding or sports-science credentials (PDF, JPG or PNG). Documents are stored privately and verified by our team — they are never shown publicly.</Text>
      <Input label="Certificate name" value={name} onChangeText={setName} placeholder="e.g. ECB Level 2 Coaching" />
      <Input label="Issuing organization" value={issuer} onChangeText={setIssuer} placeholder="e.g. ECB" />
      <TouchableOpacity style={styles.uploadBtn} onPress={upload} disabled={busy}>
        {busy ? <ActivityIndicator color={CM.primary} /> : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color={CM.primary} />
            <Text style={styles.uploadBtnText}>Choose file & upload</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={{ marginTop: 12 }}>
        {certs.map((c: any) => (
          <View key={c.id} style={styles.listRow}>
            <Ionicons name="document-text-outline" size={20} color={CM.sub} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.listTitle}>{c.name}</Text>
              <Text style={styles.listSub}>{c.issuer}</Text>
            </View>
            <View style={styles.pendingChip}>
              <Text style={styles.pendingChipText}>{c.status}</Text>
            </View>
          </View>
        ))}
        {certs.length === 0 && <Text style={styles.emptyLine}>No certificates uploaded yet.</Text>}
      </View>
    </>
  );
}

// ------- Step 5: Experience ----------
function ExperienceStep({ flash }: any) {
  const [exp, setExp] = useState<any>({});
  useEffect(() => {
    coachingApi.experience().then((e) => e && setExp(e)).catch(() => {});
  }, []);
  const save = async () => {
    try {
      await coachingApi.saveExperience({
        currentOrganization: exp.currentOrganization,
        playingHistory: exp.playingHistory,
        leagueExperience: exp.leagueExperience,
        tournamentExperience: exp.tournamentExperience,
        professionalExperience: exp.professionalExperience,
        notableAchievements: exp.notableAchievements,
      });
      flash('Experience saved');
    } catch {
      flash('Could not save experience', false);
    }
  };
  const f = (k: string) => (v: string) => setExp((p: any) => ({ ...p, [k]: v }));
  return (
    <>
      <Text style={styles.stepHint}>Self-reported experience helps our reviewers. It is not shown as verified unless confirmed.</Text>
      <Input label="Current coaching organization" value={exp.currentOrganization || ''} onChangeText={f('currentOrganization')} />
      <Input label="Playing history" value={exp.playingHistory || ''} onChangeText={f('playingHistory')} multiline />
      <Input label="League experience" value={exp.leagueExperience || ''} onChangeText={f('leagueExperience')} multiline />
      <Input label="Tournament experience" value={exp.tournamentExperience || ''} onChangeText={f('tournamentExperience')} multiline />
      <Input label="Notable achievements" value={exp.notableAchievements || ''} onChangeText={f('notableAchievements')} multiline />
      <TouchableOpacity style={styles.addBtn} onPress={save}>
        <Ionicons name="save-outline" size={18} color={CM.primary} />
        <Text style={styles.addBtnText}>Save experience</Text>
      </TouchableOpacity>
    </>
  );
}

// ------- Step 6: Pricing ----------
function PricingStep({ tax, services, pricing, setPricing, flash }: any) {
  const [sessionType, setSessionType] = useState(tax.sessionFormats[0]);
  const [duration, setDuration] = useState(60);
  const [currency, setCurrency] = useState('USD');
  const [price, setPrice] = useState('');
  const [minP, setMinP] = useState('1');
  const [maxP, setMaxP] = useState('1');

  const add = async () => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return flash('Enter a valid price', false);
    try {
      const row = await coachingApi.addPricing({
        sessionType,
        durationMinutes: duration,
        currency,
        price: priceNum,
        minimumParticipants: parseInt(minP, 10) || 1,
        maximumParticipants: parseInt(maxP, 10) || 1,
      });
      setPricing([...pricing, row]);
      setPrice('');
      flash('Price added');
    } catch (e: any) {
      flash(e?.response?.data?.detail || 'Could not add price', false);
    }
  };
  const remove = async (id: string) => {
    await coachingApi.deletePricing(id);
    setPricing(pricing.filter((p: any) => p.id !== id));
  };

  return (
    <>
      <Text style={styles.stepHint}>Set your own prices. Each service and format can have its own price. Currency is configurable.</Text>
      <Field label="Session format">
        <ChipSelect options={tax.sessionFormats} selected={[sessionType]} onToggle={setSessionType} multi={false} />
      </Field>
      <Field label="Duration (minutes)">
        <ChipSelect options={tax.durations.map(String)} selected={[String(duration)]} onToggle={(d) => setDuration(parseInt(d, 10))} multi={false} />
      </Field>
      <Field label="Currency">
        <ChipSelect options={tax.currencies} selected={[currency]} onToggle={setCurrency} multi={false} />
      </Field>
      <Input label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 50" />
      {sessionType.includes('GROUP') && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Min players" value={minP} onChangeText={setMinP} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Input label="Max players" value={maxP} onChangeText={setMaxP} keyboardType="numeric" /></View>
        </View>
      )}
      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Ionicons name="add" size={18} color={CM.primary} />
        <Text style={styles.addBtnText}>Add price</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 8 }}>
        {pricing.map((p: any) => (
          <View key={p.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{p.currency} {p.price} · {p.durationMinutes} min</Text>
              <Text style={styles.listSub}>{p.sessionType}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(p.id)}>
              <Ionicons name="trash-outline" size={20} color={CM.primary} />
            </TouchableOpacity>
          </View>
        ))}
        {pricing.length === 0 && <Text style={styles.emptyLine}>No prices added yet.</Text>}
      </View>
    </>
  );
}

// ------- Step 8: Availability ----------
function AvailabilityStep({ tax, slots, setSlots, flash, initialTz }: any) {
  const [day, setDay] = useState(tax.daysOfWeek[5]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('13:00');
  const [tz, setTz] = useState(initialTz || 'UTC');

  const persist = async (nextSlots: any[]) => {
    await coachingApi.saveAvailability({
      timezone: tz,
      slots: nextSlots.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, locationType: s.locationType || 'virtual' })),
    });
  };
  const add = async () => {
    const next = [...slots, { id: `tmp-${Date.now()}`, dayOfWeek: day, startTime: start, endTime: end, locationType: 'virtual' }];
    setSlots(next);
    try { await persist(next); flash('Availability updated'); } catch { flash('Could not save availability', false); }
  };
  const remove = async (idx: number) => {
    const next = slots.filter((_: any, i: number) => i !== idx);
    setSlots(next);
    await persist(next);
  };

  return (
    <>
      <Text style={styles.stepHint}>Set recurring weekly availability. Players can request sessions inside these windows.</Text>
      <Input label="Timezone" value={tz} onChangeText={setTz} placeholder="e.g. Europe/London" />
      <Field label="Day">
        <ChipSelect options={tax.daysOfWeek} selected={[day]} onToggle={setDay} multi={false} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Input label="Start (HH:MM)" value={start} onChangeText={setStart} /></View>
        <View style={{ flex: 1 }}><Input label="End (HH:MM)" value={end} onChangeText={setEnd} /></View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Ionicons name="add" size={18} color={CM.primary} />
        <Text style={styles.addBtnText}>Add availability</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 8 }}>
        {slots.map((s: any, i: number) => (
          <View key={s.id || i} style={styles.listRow}>
            <Ionicons name="time-outline" size={18} color={CM.sub} />
            <Text style={[styles.listTitle, { flex: 1, marginLeft: 10 }]}>{s.dayOfWeek} · {s.startTime}–{s.endTime}</Text>
            <TouchableOpacity onPress={() => remove(i)}>
              <Ionicons name="trash-outline" size={20} color={CM.primary} />
            </TouchableOpacity>
          </View>
        ))}
        {slots.length === 0 && <Text style={styles.emptyLine}>No availability added yet.</Text>}
      </View>
    </>
  );
}

// ------- Step 10: Review & Submit ----------
function ReviewStep({ profile, services, pricing, certs, slots, patch, errors }: any) {
  const Row = ({ label, value }: any) => (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || '—'}</Text>
    </View>
  );
  return (
    <>
      <Text style={styles.stepHint}>Review your application before submitting.</Text>
      {errors?.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Please complete the following:</Text>
          {errors.map((e: string, i: number) => (
            <Text key={i} style={styles.errorItem}>• {e}</Text>
          ))}
        </View>
      )}
      <View style={styles.reviewCard}>
        <Text style={styles.reviewSection}>Identity</Text>
        <Row label="Name" value={profile.displayName} />
        <Row label="Location" value={[profile.city, profile.country].filter(Boolean).join(', ')} />
        <Text style={styles.reviewSection}>Coaching</Text>
        <Row label="Specializations" value={(profile.specializations || []).join(', ')} />
        <Row label="Services" value={`${services.length} added`} />
        <Row label="Pricing" value={`${pricing.length} price(s)`} />
        <Row label="Credentials" value={`${certs.length} uploaded`} />
        <Row label="Availability" value={`${slots.length} slot(s)`} />
      </View>
      <View style={styles.divider} />
      <Checkbox label="I confirm that the information and documents provided are accurate." value={!!profile.confirmedAccurate} onChange={(v) => patch({ confirmedAccurate: v })} />
      <Checkbox label="I understand that submitting this application does not guarantee approval." value={!!profile.understoodNoGuarantee} onChange={(v) => patch({ understoodNoGuarantee: v })} />
      <Checkbox label="I understand that 18 Cricket Network may charge a platform/service fee for bookings and that the applicable fee will be disclosed before paid booking features are activated." value={!!profile.agreedFeeDisclosure} onChange={(v) => patch({ agreedFeeDisclosure: v })} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CM.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: CM.card,
    borderBottomWidth: 1,
    borderBottomColor: CM.border,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: CM.text, marginHorizontal: 8 },
  saveExit: { color: CM.primary, fontWeight: '700', fontSize: 14 },
  progressWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: CM.card, borderBottomWidth: 1, borderBottomColor: CM.border },
  progressBar: { height: 6, backgroundColor: CM.inputBg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: CM.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: CM.sub, marginTop: 6, fontWeight: '600' },
  notice: { paddingVertical: 10, paddingHorizontal: 16 },
  noticeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  body: { padding: 16, paddingBottom: 40 },
  stepHint: { fontSize: 13, color: CM.sub, marginBottom: 16, lineHeight: 19 },
  divider: { height: 1, backgroundColor: CM.border, marginVertical: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: CM.card,
    borderTopWidth: 1,
    borderTopColor: CM.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 16 },
  backBtnText: { color: CM.text, fontWeight: '700', fontSize: 15 },
  nextBtn: { flex: 1, backgroundColor: CM.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: CM.primary, borderRadius: 12, paddingVertical: 13, marginTop: 4 },
  addBtnText: { color: CM.primary, fontWeight: '700', fontSize: 14 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: CM.primary, borderRadius: 12, paddingVertical: 18 },
  uploadBtnText: { color: CM.primary, fontWeight: '700', fontSize: 14 },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CM.card, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: CM.border },
  listTitle: { fontSize: 14, fontWeight: '700', color: CM.text },
  listSub: { fontSize: 12, color: CM.sub, marginTop: 2 },
  emptyLine: { color: CM.sub, fontSize: 13, marginTop: 12, textAlign: 'center' },
  pendingChip: { backgroundColor: CM.warningBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pendingChipText: { color: CM.warning, fontWeight: '700', fontSize: 11 },
  reviewCard: { backgroundColor: CM.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: CM.border },
  reviewSection: { fontSize: 13, fontWeight: '800', color: CM.primary, marginTop: 10, marginBottom: 6 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  reviewLabel: { fontSize: 13, color: CM.sub },
  reviewValue: { fontSize: 13, color: CM.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, marginBottom: 16 },
  errorTitle: { color: '#b91c1c', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  errorItem: { color: '#b91c1c', fontSize: 13, lineHeight: 19 },
});
