export const POLICY_VERSION='2026-10-08';
export function profileComplete(p){return !!(p&&typeof p.name==='string'&&p.name.trim()&&typeof p.city==='string'&&p.city.trim()&&typeof p.country==='string'&&p.country.trim()&&Array.isArray(p.roles)&&p.roles.length&&p.roles.includes(p.primaryRole)&&p.consent?.termsAccepted===true&&p.consent?.privacyAccepted===true&&p.consent?.policyVersion===POLICY_VERSION);}
export function entryDecision(user,profile,preview=false){return preview||!user?'welcome':profileComplete(profile)?'network':'onboarding';}
