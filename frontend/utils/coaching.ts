import api from './api';

// Shared light "marketplace" palette for the coaching experience. Kept separate
// from the dark app-wide Colors so the coaching flow reads as a premium,
// trustworthy marketplace surface.
export const CM = {
  bg: '#f4f5f7',
  card: '#ffffff',
  text: '#0f172a',
  sub: '#64748b',
  border: '#e5e8ec',
  primary: '#DC2626',
  primaryDark: '#991B1B',
  accentBg: '#fdecec',
  inputBg: '#f1f3f5',
  chipBg: '#eef1f4',
  success: '#0f9d58',
  warning: '#b45309',
  warningBg: '#fef3c7',
  info: '#2563eb',
};

export interface Taxonomy {
  serviceTaxonomy: { category: string; label: string; subcategories: string[] }[];
  sessionFormats: string[];
  durations: number[];
  currencies: string[];
  ageGroups: string[];
  playerLevels: string[];
  daysOfWeek: string[];
  coachStatuses: string[];
  certStatuses: string[];
  sessionStatuses: string[];
}

export interface CoachProfile {
  id: string;
  status: string;
  onboardingStep?: number;
  displayName?: string;
  legalFullName?: string;
  headline?: string;
  bio?: string;
  coachingPhilosophy?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  specializations?: string[];
  languages?: string[];
  ageGroups?: string[];
  playerLevels?: string[];
  yearsCoaching?: number;
  yearsPlaying?: number;
  primaryRole?: string;
  virtualAvailable?: boolean;
  inPersonAvailable?: boolean;
  travelRadiusKm?: number;
  meetingProvider?: string;
  virtualInstructions?: string;
  cancellationPolicy?: string;
  agreedTerms?: boolean;
  agreedCoachAgreement?: boolean;
  agreedSafeguarding?: boolean;
  agreedFeeDisclosure?: boolean;
  confirmedAccurate?: boolean;
  understoodNoGuarantee?: boolean;
  averageRating?: number;
  reviewCount?: number;
  profileViews?: number;
  badges?: string[];
  fromPrice?: any;
  [key: string]: any;
}

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: '#475569', bg: '#e2e8f0' },
  SUBMITTED: { label: 'Submitted', color: '#1d4ed8', bg: '#dbeafe' },
  UNDER_REVIEW: { label: 'Under Review', color: '#b45309', bg: '#fef3c7' },
  NEEDS_INFORMATION: { label: 'Needs Info', color: '#b45309', bg: '#fef3c7' },
  APPROVED: { label: 'Approved', color: '#0f7a3d', bg: '#dcfce7' },
  REJECTED: { label: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
  SUSPENDED: { label: 'Suspended', color: '#b91c1c', bg: '#fee2e2' },
};

export const coachingApi = {
  taxonomy: () => api.get<Taxonomy>('/coaching/taxonomy').then((r) => r.data),
  platformFee: () => api.get('/coaching/platform-fee').then((r) => r.data),
  myProfile: () => api.get<CoachProfile | null>('/coach-profiles/me').then((r) => r.data),
  saveProfile: (patch: Partial<CoachProfile>) =>
    api.put<CoachProfile>('/coach-profiles/me', patch).then((r) => r.data),
  submit: () => api.post('/coach-applications/submit').then((r) => r.data),
  services: () => api.get('/coach-profiles/me/services').then((r) => r.data),
  addService: (s: any) => api.post('/coach-profiles/me/services', s).then((r) => r.data),
  deleteService: (id: string) => api.delete(`/coach-services/${id}`).then((r) => r.data),
  pricing: () => api.get('/coach-profiles/me/pricing').then((r) => r.data),
  addPricing: (p: any) => api.post('/coach-profiles/me/pricing', p).then((r) => r.data),
  deletePricing: (id: string) => api.delete(`/coach-pricing/${id}`).then((r) => r.data),
  experience: () => api.get('/coach-profiles/me/experience').then((r) => r.data),
  saveExperience: (e: any) => api.put('/coach-profiles/me/experience', e).then((r) => r.data),
  availability: () => api.get('/coach-profiles/me/availability').then((r) => r.data),
  saveAvailability: (a: any) => api.put('/coach-profiles/me/availability', a).then((r) => r.data),
  certifications: () => api.get('/coach-profiles/me/certifications').then((r) => r.data),
  overview: () => api.get('/coach-profiles/me/overview').then((r) => r.data),
  discover: (params: any) => api.get('/coaching/coaches', { params }).then((r) => r.data),
  facets: () => api.get('/coaching/coaches/facets').then((r) => r.data),
  publicCoach: (id: string) => api.get(`/coaching/coaches/${id}`).then((r) => r.data),
  book: (b: any) => api.post('/coaching/bookings', b).then((r) => r.data),
  myBookings: (role = 'player') =>
    api.get('/coaching/bookings/me', { params: { role } }).then((r) => r.data),
  // Admin
  adminList: (status?: string) =>
    api.get('/admin/coaches', { params: status ? { status } : {} }).then((r) => r.data),
  adminDetail: (id: string) => api.get(`/admin/coaches/${id}`).then((r) => r.data),
  adminApprove: (id: string) => api.post(`/admin/coaches/${id}/approve`).then((r) => r.data),
  adminReject: (id: string, reason: string) =>
    api.post(`/admin/coaches/${id}/reject`, { reason }).then((r) => r.data),
  adminRequestInfo: (id: string, reason: string) =>
    api.post(`/admin/coaches/${id}/request-info`, { reason }).then((r) => r.data),
  adminSuspend: (id: string, reason: string) =>
    api.post(`/admin/coaches/${id}/suspend`, { reason }).then((r) => r.data),
  adminVerifyCert: (id: string) =>
    api.post(`/admin/certifications/${id}/verify`).then((r) => r.data),
  adminRejectCert: (id: string, reason: string) =>
    api.post(`/admin/certifications/${id}/reject`, { reason }).then((r) => r.data),
};

export async function uploadCertification(fields: {
  file: any;
  name: string;
  issuer: string;
  credentialType?: string;
  credentialNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}) {
  const form = new FormData();
  form.append('file', fields.file);
  form.append('name', fields.name);
  form.append('issuer', fields.issuer);
  form.append('credentialType', fields.credentialType || '');
  form.append('credentialNumber', fields.credentialNumber || '');
  form.append('issueDate', fields.issueDate || '');
  form.append('expiryDate', fields.expiryDate || '');
  const res = await api.post('/coach-profiles/me/certifications', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
