# 18’s Third Umpire

/third-umpire provides private app/platform reviews, optional experience ratings, bug reports and development ideas for all signed-in members (including Basic). It does not create public testimonials, invented ratings or seller/product review scores. Feedback is stored separately in platform_feedback, outside matches, rankings, generic records and assistant context.

Users explicitly accept the private feedback notice. Verified account email is captured only when optional follow-up consent is granted. Operations access uses the existing trusted PLATFORM_ADMIN_EMAIL check. Internal notes are never returned to ordinary users; users can see their own status and permanently withdraw/delete their submission. The inbox supports status filtering, pagination and concurrency-safe review updates. Repeat submission keys do not create duplicates, and there is a five-entry rolling 24-hour cap.

Email delivery is deliberately inactive: every confirmation reports emailSent=false and each submission records emailDeliveryStatus=not_configured. No destination, mail provider, fake email receipt or automatic send is created. When the owner provides an address later, configure an approved server-side email delivery provider and explicit destination. Define consent, retry/idempotency and whether historical submissions should be forwarded before implementing that delivery workflow. Supplying a destination alone will not retroactively send stored feedback.

No fake submissions are deployed. Tests use only isolated synthetic fixtures. Site publication preserves its current owner-private audience and existing feature behavior.
