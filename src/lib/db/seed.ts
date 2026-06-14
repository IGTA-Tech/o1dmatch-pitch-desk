/**
 * Seed the settings table with dropdowns from the original dropdowns.json.
 * Run with: npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "./index";
import { settings } from "./schema";

const SENDERS = [
  "Sherrod Seward",
  "Rollin Seward - University Relations",
  "Lanita Matel - Technical Recruiter & Corporate Relations",
  "Tiffany Moore",
  "Autumn Marshall",
  "Mark Adams - Corporate Relations",
  "Adam Mersch - Relationship Manager",
  "Susan Proctor - Corporate Relations Manager",
];

const PITCH_MAP: Record<string, string[]> = {
  "AI Choose Best": [
    "AI choose best",
    "Conservative pitch",
    "Aggressive sales pitch",
    "Feedback-first pitch",
    "Short intro only",
    "Other / custom",
  ],
  "General Employer": [
    "Talent access without sponsorship",
    "One-page interest letter",
    "No H-1B process",
    "Try free employer access",
    "Schedule demo",
    "Other / custom",
  ],
  "H-1B Power User": [
    "H-1B backup lane",
    "H-1B overflow / recycle",
    "Reduce sponsorship burden",
    "Parallel O-1 talent pipeline",
    "Global mobility feedback request",
    "Concierge offload workflow",
    "Other / custom",
  ],
  "H-1B Overflow / Recycle": [
    "Candidates not selected in lottery",
    "Candidates employer declined to sponsor",
    "OPT/STEM OPT backup",
    "Bring rejected candidates back later",
    "Attorney/referral bridge",
    "Other / custom",
  ],
  "Concierge: You Hire, We Petition": [
    "$2,000/month retainer",
    "Agent-petitioner of record",
    "Employer sends own candidate",
    "O1DMatch sources candidates",
    "Hands-off immigration infrastructure",
    "I-797 delivered to HR",
    "Other / custom",
  ],
  "Small Specialized Employer": [
    "Compete without immigration department",
    "Hard-to-fill specialized roles",
    "Local/regional meeting",
    "High-skill talent access",
    "Low-volume visa help",
    "Other / custom",
  ],
  "Recruiter / Staffing Revenue": [
    "Turn rejected visa candidates into revenue",
    "Candidate recovery pipeline",
    "Add O-1 candidates to placements",
    "Client solution when sponsorship fails",
    "Trial credits for candidates",
    "Other / custom",
  ],
  "Law Firm / Attorney Partner": [
    "H-1B season overflow",
    "Employer/itinerary problem",
    "O-1 bridge for clients",
    "Free credits for client testing",
    "Co-counsel/referral exploration",
    "Other / custom",
  ],
  "Talent Agency": [
    "Monetize foreign talent",
    "Convert visa-blocked talent into placements",
    "O-1 pathway for represented talent",
    "Agency submits candidates",
    "Trial credits",
    "Other / custom",
  ],
  "Healthcare / Research": [
    "Specialized researcher talent",
    "Hard-to-fill clinical/business roles",
    "Cap-exempt comparison",
    "International expert access",
    "Employer does not petition",
    "Other / custom",
  ],
  "University / Cap-Exempt": [
    "O-1 for distinguished researchers/faculty",
    "Non-H-1B pathway for elite talent",
    "Adjunct/visiting expert pipeline",
    "Research collaboration talent",
    "Interest-letter support",
    "Other / custom",
  ],
  "Feedback Request Only": [
    "Mobility team feedback",
    "HR feedback",
    "Legal/compliance feedback",
    "Recruiter feedback",
    "Product-market feedback",
    "Other / custom",
  ],
};

const PRODUCT_OFFERS = [
  "AI choose best",
  "Free employer platform",
  "HIRE200",
  "Concierge - $2,000/month",
  "Recruiter partnership",
  "Attorney partnership",
  "Talent agency trial credits",
  "Feedback-only conversation",
  "Custom",
];

const TONES = [
  "Strict O1DMatch brand",
  "Direct",
  "Warm",
  "Founder-led",
  "Corporate",
  "Recruiter-friendly",
  "Legal/compliance-aware",
  "Soft feedback request",
  "Short and plain",
];

const GOALS = [
  "Book intro call",
  "Schedule demo",
  "Get feedback",
  "Invite platform signup",
  "Offer Concierge call",
  "Ask for candidate overflow",
  "Ask for recruiter partnership",
  "Ask for attorney partnership",
  "Ask for sample interest-letter review",
  "Custom",
];

const CONTACT_TYPES = [
  "Global Mobility",
  "Human Resources",
  "People Operations",
  "Recruiter",
  "Talent Acquisition",
  "General Counsel",
  "Founder / CEO",
  "President",
  "University Relations",
  "Technical Contact",
  "Staffing / Agency Contact",
  "Attorney Contact",
  "Generic Inbox",
  "Unknown",
];

async function seed() {
  console.log("Seeding settings...");

  await db.delete(settings);

  const rows: (typeof settings.$inferInsert)[] = [];

  SENDERS.forEach((value, i) => {
    rows.push({ settingType: "sender", settingKey: value, settingValue: value, sortOrder: i });
  });

  Object.entries(PITCH_MAP).forEach(([pitchType, subPitches], i) => {
    rows.push({
      settingType: "pitch_type",
      settingKey: pitchType,
      settingValue: JSON.stringify(subPitches),
      sortOrder: i,
    });
  });

  PRODUCT_OFFERS.forEach((value, i) => {
    rows.push({ settingType: "product_offer", settingKey: value, settingValue: value, sortOrder: i });
  });

  TONES.forEach((value, i) => {
    rows.push({ settingType: "tone", settingKey: value, settingValue: value, sortOrder: i });
  });

  GOALS.forEach((value, i) => {
    rows.push({ settingType: "goal", settingKey: value, settingValue: value, sortOrder: i });
  });

  CONTACT_TYPES.forEach((value, i) => {
    rows.push({ settingType: "contact_type", settingKey: value, settingValue: value, sortOrder: i });
  });

  await db.insert(settings).values(rows);

  console.log(`Seeded ${rows.length} settings rows.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
