export const SCORE_CRITERIA = [
  { key: "water_calmness", label: "Water calmness / safety" },
  { key: "water_clarity", label: "Water clarity / photo quality" },
  { key: "visitor_traffic", label: "Visitor traffic" },
  { key: "premium_potential", label: "Premium customer potential" },
  { key: "road_access", label: "Road access" },
  { key: "parking", label: "Parking" },
  { key: "security", label: "Security" },
  { key: "facilities", label: "Toilets / changing facilities" },
  { key: "power", label: "Electricity / power" },
  { key: "connectivity", label: "Mobile / data coverage" },
  { key: "storage", label: "Storage" },
  { key: "operating_space", label: "Available operating space" },
  { key: "hotel_partnerships", label: "Hotel / tourism partnerships" },
  { key: "community_support", label: "Community / government support" },
  { key: "cost_terms", label: "Operating cost / terms" },
  { key: "expansion", label: "Expansion potential" },
] as const;

export const SITE_DECISIONS = ["Shortlist", "Hold", "Reject", "Preferred"] as const;

export const NEGOTIATION_QUESTIONS = [
  { key: "permission_control", label: "Who controls permission to operate here?" },
  { key: "commercial_approval", label: "Is commercial operating approval available?" },
  { key: "pilot_90", label: "Is a 90-day pilot acceptable?" },
  { key: "rent_vs_share", label: "Fixed rent or revenue share?" },
  { key: "storage", label: "Is secure storage available on site?" },
  { key: "security", label: "Who provides security and at what cost?" },
  { key: "utilities", label: "What utilities are available (power, water)?" },
  { key: "hours", label: "What operating hours are permitted?" },
  { key: "signage", label: "Is branded signage permitted?" },
  { key: "exclusivity", label: "Is activity exclusivity possible?" },
  { key: "food", label: "Is food and beverage service permitted?" },
  { key: "drone", label: "Are drone operations permitted on site?" },
  { key: "insurance", label: "What insurance is required by the site owner?" },
  { key: "employment", label: "What local employment is expected?" },
  { key: "termination", label: "What are the termination / exit terms?" },
] as const;

export const PARTNERSHIP_MODELS = [
  { key: "pilot_90", label: "90-day pilot agreement" },
  { key: "revenue_share", label: "Revenue share" },
  { key: "concession", label: "Concession / fixed fee" },
  { key: "hotel_commission", label: "Hotel commission model" },
  { key: "joint_promotion", label: "Joint promotion / marketing" },
] as const;

export const COMPLIANCE_STATUSES = [
  "Not Started",
  "In Progress",
  "Submitted",
  "Approved",
  "N/A",
] as const;

export const PROCUREMENT_STATUSES = [
  "Planned",
  "Quote Requested",
  "Quote Received",
  "Approved",
  "Ordered",
  "Received",
] as const;

export const PRICE_BASIS = ["Reference", "Planning allowance", "Validated quote"] as const;

export const PRIORITIES = ["High", "Medium", "Low"] as const;

export const LEAD_SOURCES = [
  "Hotel",
  "Instagram",
  "TikTok",
  "Facebook",
  "WhatsApp",
  "Walk-in",
  "Tour operator",
  "Wedding planner",
  "Website waitlist",
  "Other",
] as const;

export const LEAD_STATUSES = [
  "New Lead",
  "Contacted",
  "Quote Sent",
  "Deposit Paid",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export const PARTNER_TYPES = [
  "Hotel / Resort",
  "Airbnb Host",
  "Tour Operator",
  "Wedding Planner",
  "Photographer / Creator",
  "Food / Decor Supplier",
  "Transport Provider",
  "Other",
] as const;

export const PARTNER_STATUSES = [
  "Inbound Enquiry",
  "Prospect",
  "Contacted",
  "In Discussion",
  "Agreed",
  "Declined",
] as const;

export const TASK_STATUSES = ["Backlog", "This Week", "In Progress", "Waiting", "Done"] as const;

export const TASK_CATEGORIES = [
  "Site Validation",
  "Negotiation",
  "Procurement",
  "Compliance",
  "Partnerships",
  "Pre-Sales",
  "Operations",
  "Launch",
  "General",
] as const;

export const STAKEHOLDER_STATUSES = [
  "To Contact",
  "Meeting Booked",
  "Met",
  "Negotiating",
  "Agreed",
  "Not Proceeding",
] as const;

export const DOCUMENT_SECTIONS = [
  "Concept",
  "Procurement",
  "Finance",
  "Sites",
  "Compliance",
  "Operations",
  "Partnerships",
  "General",
] as const;

export const APP_ROLES = [
  { value: "founder_admin", label: "Founder / Admin" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance / Procurement" },
  { value: "viewer", label: "Viewer / Investor" },
] as const;

export const LAUNCH_TIMELINE = [
  {
    week: 1,
    title: "Week 1 — Site Validation",
    detail: "Visit, score and photograph all six candidate beaches; record traffic and conditions.",
    categories: ["Site Validation"],
  },
  {
    week: 2,
    title: "Week 2 — Negotiation",
    detail: "Identify decision makers, present the 90-day pilot, agree commercial terms.",
    categories: ["Negotiation"],
  },
  {
    week: 3,
    title: "Week 2-3 — Procurement & Compliance",
    detail: "Collect supplier quotes and landed costs; verify permissions, insurance and safety SOPs.",
    categories: ["Procurement", "Compliance"],
  },
  {
    week: 4,
    title: "Week 3 — Pre-Sales",
    detail: "Open the waitlist, activate hotel partners, secure deposits for launch weekend.",
    categories: ["Pre-Sales", "Partnerships"],
  },
  {
    week: 5,
    title: "Week 4 — Go / No-Go",
    detail: "Readiness review against safety, permission, equipment and pre-sales criteria.",
    categories: ["Launch", "Operations", "General"],
  },
] as const;

export const PLANNING_TAG = "Planning / Unvalidated";
