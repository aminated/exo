import { db } from "./db";
import { products, blogPosts } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length > 0) return;

  await db.insert(products).values([
    {
      name: "Estradiol Enanthate",
      slug: "estradiol-enanthate",
      concentration: "40mg/mL",
      type: "10mL vial",
      unitPrice: "48.00",
      inStock: true,
      description: "Estradiol Enanthate is an estradiol ester and a long-acting estrogen. It is administered via intramuscular injection and has a duration of action of approximately 1 to 4 weeks depending on the individual.\n\nEach 10mL vial contains 40mg/mL of Estradiol Enanthate in a carrier oil solution. The product is sterile-filtered and produced under strict quality control conditions.\n\nStorage: Store at room temperature, away from direct sunlight. Do not freeze. Shelf life is approximately 24 months from date of manufacture when stored properly.",
    },
    {
      name: "Progesterone",
      slug: "progesterone",
      concentration: "200mg",
      type: "90 capsules",
      unitPrice: "30.00",
      inStock: true,
      description: "Micronized Progesterone capsules, 200mg per capsule. Each bottle contains 90 capsules for a full 3-month supply.\n\nProgesterone is a naturally occurring steroid hormone involved in the menstrual cycle, pregnancy, and embryogenesis. Micronized formulation ensures optimal bioavailability when taken orally.\n\nDosage: As directed by your healthcare provider. Typically 100-200mg daily. Take with food for best absorption.",
    },
    {
      name: "Progesterone Instructions",
      slug: "progesterone-instructions",
      concentration: null,
      type: null,
      unitPrice: "1.00",
      inStock: false,
      description: "Comprehensive printed guide for progesterone usage, including dosage schedules, potential interactions, and monitoring recommendations.\n\nCurrently out of stock. A digital version will be made available soon.",
    },
    {
      name: "Injection Instructions",
      slug: "injection-instructions",
      concentration: null,
      type: null,
      unitPrice: "1.00",
      inStock: false,
      description: "Step-by-step printed guide for safe intramuscular and subcutaneous injection techniques. Covers proper site selection, needle gauge recommendations, injection angle, and post-injection care.\n\nCurrently out of stock. A digital version will be made available soon.",
    },
    {
      name: "Estradiol Valerate",
      slug: "estradiol-valerate",
      concentration: "20mg/mL",
      type: "10mL vial",
      unitPrice: "40.00",
      inStock: true,
      description: "Estradiol Valerate is a prodrug of estradiol delivered via intramuscular injection. It has a shorter duration of action compared to Estradiol Enanthate, typically requiring injections every 5-7 days.\n\nEach 10mL vial contains 20mg/mL of Estradiol Valerate in castor oil. Sterile-filtered and quality tested.\n\nStorage: Store at controlled room temperature. Protect from light.",
    },
  ]);

  await db.insert(blogPosts).values([
    {
      title: "On the Importance of Consistent Dosing",
      slug: "consistent-dosing",
      content: "Maintaining a consistent dosing schedule is one of the most critical factors in hormone therapy. Irregular dosing leads to fluctuating blood levels, which can cause mood swings, fatigue, and reduced efficacy of treatment.\n\nThe key is to find a routine that works for your lifestyle. Set reminders, keep a log, and communicate with your provider about any difficulties maintaining your schedule.\n\nRemember that the goal of hormone therapy is stable, consistent levels that mimic natural physiology as closely as possible. This is best achieved through regular, predictable dosing intervals.",
      excerpt: "Why sticking to your schedule matters more than you think.",
      publishedAt: new Date("2025-12-15"),
    },
    {
      title: "Understanding Carrier Oils",
      slug: "carrier-oils",
      content: "Not all injectable hormone formulations are created equal, and one of the most overlooked factors is the carrier oil used in the preparation.\n\nCommon carrier oils include castor oil, sesame oil, cottonseed oil, and MCT (medium-chain triglyceride) oil. Each has different viscosity, absorption rates, and allergenic potential.\n\nCastor oil is the most viscous, requiring larger gauge needles but providing slower absorption and more stable blood levels. MCT oil is thinner and easier to inject but may result in slightly faster absorption peaks.\n\nIf you experience persistent injection site reactions, consider whether the carrier oil might be the culprit. Discuss alternatives with your provider.",
      excerpt: "A deep dive into the oils that carry your hormones.",
      publishedAt: new Date("2026-01-08"),
    },
    {
      title: "Storage and Handling Best Practices",
      slug: "storage-handling",
      content: "Proper storage of your medications is essential for maintaining their potency and safety. Here are some guidelines that apply to most hormone preparations.\n\nTemperature: Store at controlled room temperature (20-25 degrees C / 68-77 degrees F). Brief excursions to 15-30 degrees C are generally acceptable, but prolonged exposure to heat or cold can degrade the active ingredients.\n\nLight: Many hormone preparations are light-sensitive. Store in their original packaging or in a dark location. Never leave vials on a windowsill or in direct sunlight.\n\nSterility: Once a vial has been punctured, use it within the timeframe recommended by the manufacturer. Wipe the rubber stopper with an alcohol swab before each use. Never re-use needles or syringes.\n\nTravel: When traveling, keep medications in your carry-on bag where temperature is more controlled. Consider a small insulated pouch for extreme climates.",
      excerpt: "Keep your meds safe and effective with these simple tips.",
      publishedAt: new Date("2026-02-01"),
    },
  ]);

  console.log("Database seeded successfully");
}
