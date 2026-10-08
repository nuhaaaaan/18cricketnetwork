# Welcome, identity and onboarding

All feature pages use the server-rendered NetworkGate. Anonymous visitors see a welcome/sign-in page; authenticated visitors must complete their private profile and acknowledge the current policies. Protected feature APIs also require identity and completed onboarding. Status and private account endpoints remain accessible for onboarding; camera device ingest retains its own credential-based authorization.

Required profile fields: name, verified provider email, city, country, selected role(s), primary role and policy acknowledgements. Business roles require an organization. Phone, state/region, styles and experience are optional. Do not collect passwords, payment cards, identity documents or full addresses here. Contact information is not a public lead. Consent timestamps and policy version are written server-side. Existing profiles without acknowledgements must complete onboarding before feature access.

The welcome scene uses CSS perspective, layered cricket bats, an illuminated globe-ball, orbital depth and pointer parallax. It is a 3D visual treatment, not literal five-dimensional rendering. Reduced-motion and pause controls are supported.

## Provider activation boundary

Sites owns sessions and currently provides ChatGPT authentication. Direct Google, Apple and WhatsApp buttons remain disabled and labelled unavailable. Do not connect them to ChatGPT under misleading labels or build a separate OAuth stack on Sites.

For a standalone Azure/Vercel launch, first activate the approved identity backend and production database. Google requires registered OAuth clients and server-validated OIDC tokens. Apple requires a Services ID associated with a primary app, registered domain and return URLs, and a private key. WhatsApp phone authentication requires a WhatsApp Business provider, approved authentication templates, expiring one-time codes, rate limits and server verification; a WhatsApp chat link is not authentication. Configure secrets outside git, protect callback state/nonce, and test account linking without relying on unverified phone/email values. Provider credentials are not currently configured.

Official references:
- https://developers.google.com/identity/openid-connect/openid-connect
- https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/authentication-templates

Existing private Sites access is unchanged. Its hosting-level sign-in may appear before the app welcome page. The standalone preview shows the welcome screen and denies feature APIs until authentication and storage are activated.
