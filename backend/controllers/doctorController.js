/**
 * VedNidan AI — Charak (Charaka Samhita) Consultation Engine
 * Authentic Ayurvedic diagnosis & treatment based on classical texts.
 * Each health category has its own 7-question diagnostic protocol.
 */

const fs = require('fs');
const path = require('path');

// Load AI doctor knowledge base (Ayurvedic disease data)
const knowledgeBasePath = path.join(__dirname, '../data/ai_doctor_knowledge.json');
let knowledgeBase = [];
try {
  const kbRaw = fs.readFileSync(knowledgeBasePath, 'utf-8');
  knowledgeBase = JSON.parse(kbRaw);
  console.log(`[AI Doctor] Loaded ${knowledgeBase.length} disease records from knowledge base.`);
} catch (e) {
  console.error('[AI Doctor] Failed to load AI doctor knowledge base:', e);
  knowledgeBase = [];
}

const productsFilePath = path.join(__dirname, '../data/products.json');
const getProducts = () => {
  const jsonData = fs.readFileSync(productsFilePath, 'utf-8');
  return JSON.parse(jsonData);
};

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM CLASSIFIER — maps user complaint to a health category
// ─────────────────────────────────────────────────────────────────────────────
const classifySymptom = (text) => {
  const t = text.toLowerCase();

  if (/skin|acne|pimple|rash|eczema|psoriasis|dull|glow|complexion|fairness|dark spot|scar|pigment/.test(t)) return 'skin';
  if (/hair|dandruff|bald|hairfall|hair fall|hair loss|grey hair|scalp|thinning/.test(t)) return 'hair';
  if (/digest|stomach|gas|bloat|acidity|heartburn|ibs|constipat|diarrhea|loose motion|nausea|vomit|indigestion|ulcer|bowel/.test(t)) return 'digestion';
  if (/stress|anxiety|panic|worry|fear|nervou|mental|depress|mood|bipolar|overthink/.test(t)) return 'mentalhealth';
  if (/sleep|insomnia|cannot sleep|wake up|restless|dream|tired morning/.test(t)) return 'sleep';
  if (/joint|arthrit|knee|back pain|lumbar|spine|neck|shoulder|muscle|rheumat|gout|spondyl/.test(t)) return 'joints';
  if (/diabetes|blood sugar|insulin|sugar level|hyperglycemi|diabetic/.test(t)) return 'diabetes';
  if (/weight|obese|fat|overweight|slim|reduce belly|lose weight|body mass/.test(t)) return 'weight';
  if (/immunity|immune|fever|cold|cough|flu|infection|viral|weak body|fatigue|low energy|lethargy/.test(t)) return 'immunity';
  if (/liver|kidney|urine|UTI|jaundice|hepatitis|gallbladder|stone|thyroid/.test(t)) return 'organhealth';
  if (/fertility|period|menstrual|pcos|pcod|irregular|cramp|women|pregnancy|hormone|libido|sperm|erectile/.test(t)) return 'womenshealth';
  if (/bp|blood pressure|hypertension|cholesterol|heart|cardiac|lipid|triglyceride/.test(t)) return 'heart';

  return 'general'; // fallback
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-SPECIFIC DIAGNOSTIC QUESTIONNAIRES (7 Qs each)
// ─────────────────────────────────────────────────────────────────────────────
const categoryQuestions = {

  skin: [
    { q: "**Q1 — Skin Type & Texture**: How would you describe your skin?", opts: [
      { k:"A", t:"Dry, rough, flaky, dull, or easily chapped skin", s:"vata" },
      { k:"B", t:"Oily, sensitive, prone to redness, acne, rashes or inflammation", s:"pitta" },
      { k:"C", t:"Thick, moist, clammy, or prone to large pores and blackheads", s:"kapha" }
    ]},
    { q: "**Q2 — Breakout Pattern**: When do your skin problems flare up?", opts: [
      { k:"A", t:"In dry weather, winter, or after stress and poor sleep", s:"vata" },
      { k:"B", t:"In summer, after spicy/oily food, or under the sun", s:"pitta" },
      { k:"C", t:"In humid, rainy weather or after dairy/sweet intake", s:"kapha" }
    ]},
    { q: "**Q3 — Skin Colour & Marks**: Which best matches your concern?", opts: [
      { k:"A", t:"Dark patches, hyperpigmentation, or discolouration", s:"vata" },
      { k:"B", t:"Red inflamed spots, acne, or pus-filled pimples", s:"pitta" },
      { k:"C", t:"Whiteheads, blackheads, enlarged pores, or milia", s:"kapha" }
    ]},
    { q: "**Q4 — Digestive Link**: What is your digestion like?", opts: [
      { k:"A", t:"Irregular, gassy, or bloated — skin acts up with constipation", s:"vata" },
      { k:"B", t:"Acidic, hot, loose, or burning — skin acts up with spicy food", s:"pitta" },
      { k:"C", t:"Slow, heavy, or constipated — skin issues appear with dairy intake", s:"kapha" }
    ]},
    { q: "**Q5 — Sleep & Lifestyle**: How is your sleep and daily routine?", opts: [
      { k:"A", t:"Irregular sleep, often stay up late, anxious mind", s:"vata" },
      { k:"B", t:"Sleep okay but feel warm or sweaty; high-pressure work routine", s:"pitta" },
      { k:"C", t:"Sleep too much; sluggish morning routine, prefer rest", s:"kapha" }
    ]},
    { q: "**Q6 — Water & Hydration**: How much water do you drink daily?", opts: [
      { k:"A", t:"Less than 1.5L; often forget to drink water", s:"vata" },
      { k:"B", t:"Drink plenty but still feel hot and flushed", s:"pitta" },
      { k:"C", t:"Drink moderately but skin feels congested regardless", s:"kapha" }
    ]},
    { q: "**Q7 — Emotional State**: Which emotion most affects your skin?", opts: [
      { k:"A", t:"Anxiety, overthinking, or fear triggers dryness/pigmentation", s:"vata" },
      { k:"B", t:"Anger, frustration, or jealousy triggers acne/redness", s:"pitta" },
      { k:"C", t:"Grief, loneliness, or attachment triggers oiliness/puffiness", s:"kapha" }
    ]}
  ],

  hair: [
    { q: "**Q1 — Hair Loss Pattern**: Describe your hair problem:", opts: [
      { k:"A", t:"Diffuse thinning all over scalp, dry and frizzy hair", s:"vata" },
      { k:"B", t:"Hair fall with inflammation, scalp redness, or early greying", s:"pitta" },
      { k:"C", t:"Dandruff, oily scalp, slow hair growth, or hair that falls in clumps", s:"kapha" }
    ]},
    { q: "**Q2 — Scalp Condition**: How does your scalp feel?", opts: [
      { k:"A", t:"Dry, flaky, itchy scalp — itching worsens in cold or wind", s:"vata" },
      { k:"B", t:"Hot, burning scalp with redness or pus-filled follicles", s:"pitta" },
      { k:"C", t:"Greasy, heavy scalp with white or yellow dandruff flakes", s:"kapha" }
    ]},
    { q: "**Q3 — Diet Connection**: What food increases your hair fall?", opts: [
      { k:"A", t:"Irregular eating, skipping meals, or raw cold food", s:"vata" },
      { k:"B", t:"Spicy, sour, fermented, or fried foods trigger it", s:"pitta" },
      { k:"C", t:"Heavy dairy, sweets, white flour, or wheat-based meals", s:"kapha" }
    ]},
    { q: "**Q4 — Stress & Hair**: How does stress affect your hair?", opts: [
      { k:"A", t:"Sudden hair loss spikes during anxiety or life changes", s:"vata" },
      { k:"B", t:"Consistent hair fall with high-pressure work deadlines", s:"pitta" },
      { k:"C", t:"Slow steady hair loss, not dramatically affected by stress", s:"kapha" }
    ]},
    { q: "**Q5 — Hair Texture Before Loss**: Describe your original hair:", opts: [
      { k:"A", t:"Was naturally dry, curly, thin, or prone to breakage", s:"vata" },
      { k:"B", t:"Was fine, silky, and straight — now thinning rapidly", s:"pitta" },
      { k:"C", t:"Was thick, wavy, and strong — now getting oily and lifeless", s:"kapha" }
    ]},
    { q: "**Q6 — Sleep & Recovery**: How is your night-time recovery?", opts: [
      { k:"A", t:"Sleep is light, fragmented; wake up tired with a dry mouth", s:"vata" },
      { k:"B", t:"Sleep moderately but wake feeling hot or with headaches", s:"pitta" },
      { k:"C", t:"Sleep deeply but feel heavy, unmotivated in the morning", s:"kapha" }
    ]},
    { q: "**Q7 — Agni (Digestive Fire)**: What is your digestion like?", opts: [
      { k:"A", t:"Variable — sometimes strong, sometimes poor; bloating and gas", s:"vata" },
      { k:"B", t:"Intense — strong hunger but acid reflux or loose stools", s:"pitta" },
      { k:"C", t:"Slow — rarely hungry; feel full long after meals; weight gain", s:"kapha" }
    ]}
  ],

  digestion: [
    { q: "**Q1 — Primary Digestive Complaint**: What bothers you most?", opts: [
      { k:"A", t:"Bloating, gas, burping, constipation, or irregular bowels", s:"vata" },
      { k:"B", t:"Acidity, heartburn, ulcer pain, loose stools, or nausea", s:"pitta" },
      { k:"C", t:"Slow digestion, heaviness after meals, sluggish bowels, or nausea with mucus", s:"kapha" }
    ]},
    { q: "**Q2 — Hunger Pattern (Agni Assessment)**: How is your appetite?", opts: [
      { k:"A", t:"Erratic — sometimes very hungry, sometimes zero appetite", s:"vata" },
      { k:"B", t:"Always hungry; get irritable, headachy when meals are delayed", s:"pitta" },
      { k:"C", t:"Low appetite; rarely feel hungry; feel full for hours", s:"kapha" }
    ]},
    { q: "**Q3 — Stool Analysis (Mala Pariksha)**: Describe your stools:", opts: [
      { k:"A", t:"Dry, hard, pellet-like, or difficult to pass — often skip days", s:"vata" },
      { k:"B", t:"Loose, yellow, or burning — more than twice daily", s:"pitta" },
      { k:"C", t:"Pale, mucus-covered, or very slow — once every 2 days or more", s:"kapha" }
    ]},
    { q: "**Q4 — Triggering Foods**: Which food group worsens your problem?", opts: [
      { k:"A", t:"Raw salads, beans, chickpeas, broccoli, or cold beverages", s:"vata" },
      { k:"B", t:"Spicy chillies, tomatoes, vinegar, coffee, or alcohol", s:"pitta" },
      { k:"C", t:"Fried foods, ice cream, wheat bread, or heavy meat dishes", s:"kapha" }
    ]},
    { q: "**Q5 — Time of Day**: When do symptoms peak?", opts: [
      { k:"A", t:"Evening or night — worse after sunset and during winter", s:"vata" },
      { k:"B", t:"Midday or midnight — worse in summer and after alcohol", s:"pitta" },
      { k:"C", t:"Morning right after waking or within an hour of breakfast", s:"kapha" }
    ]},
    { q: "**Q6 — Associated Symptoms**: What accompanies your digestive issue?", opts: [
      { k:"A", t:"Anxiety, lower back pain, dry skin, or insomnia alongside gut issues", s:"vata" },
      { k:"B", t:"Skin rash, inflammation, irritability, or red eyes alongside gut issues", s:"pitta" },
      { k:"C", t:"Weight gain, mucus production, fatigue, or congestion alongside gut issues", s:"kapha" }
    ]},
    { q: "**Q7 — Bowel Sound & Gas**: Describe gas/sound from your abdomen:", opts: [
      { k:"A", t:"Loud gurgling, frequent gas, borborygmi (intestinal sounds)", s:"vata" },
      { k:"B", t:"Burning gas, sour-smelling, or acid taste in the mouth", s:"pitta" },
      { k:"C", t:"Minimal gas but a constant heavy, uncomfortable full feeling", s:"kapha" }
    ]}
  ],

  mentalhealth: [
    { q: "**Q1 — Primary Mental Concern**: What describes your mental state?", opts: [
      { k:"A", t:"Constant worry, fear, overthinking, scattered thoughts, or panic attacks", s:"vata" },
      { k:"B", t:"Anger, irritability, frustration, perfectionism, or burnout", s:"pitta" },
      { k:"C", t:"Sadness, withdrawal, lethargy, attachment, or depression", s:"kapha" }
    ]},
    { q: "**Q2 — Thought Pattern**: How do unwanted thoughts manifest?", opts: [
      { k:"A", t:"Racing thoughts that jump from topic to topic — impossible to focus", s:"vata" },
      { k:"B", t:"Critical or competitive thoughts — always judging self or others", s:"pitta" },
      { k:"C", t:"Repetitive, stuck thoughts — ruminating on old events or losses", s:"kapha" }
    ]},
    { q: "**Q3 — Sleep Effect**: How does your mental state affect sleep?", opts: [
      { k:"A", t:"Can't fall asleep due to anxiety or light fragmented sleep", s:"vata" },
      { k:"B", t:"Fall asleep okay but wake up at 2–3 AM with a busy mind", s:"pitta" },
      { k:"C", t:"Sleep too much — use sleep to escape; hard to get out of bed", s:"kapha" }
    ]},
    { q: "**Q4 — Social & Behavioural Response**: Under stress I:", opts: [
      { k:"A", t:"Talk fast, fidget, avoid decisions, change plans frequently", s:"vata" },
      { k:"B", t:"Argue, control situations, push through, or lash out", s:"pitta" },
      { k:"C", t:"Withdraw, overeat, isolate myself, or procrastinate", s:"kapha" }
    ]},
    { q: "**Q5 — Appetite & Digestion During Stress**: Food during anxiety:", opts: [
      { k:"A", t:"Forget to eat, lose appetite, feel nauseated, or develop gas", s:"vata" },
      { k:"B", t:"Crave cold drinks, sweets, or alcohol to cool internal heat", s:"pitta" },
      { k:"C", t:"Emotional eating — crave oily, sweet, heavy comfort foods", s:"kapha" }
    ]},
    { q: "**Q6 — Body Sensations**: Physical manifestation of mental distress:", opts: [
      { k:"A", t:"Muscle tension, trembling, dry mouth, palpitations, or tingling", s:"vata" },
      { k:"B", t:"Sweating, flushing, tension headaches, or eye strain", s:"pitta" },
      { k:"C", t:"Heaviness in chest, sluggishness, fatigue, or excess mucus production", s:"kapha" }
    ]},
    { q: "**Q7 — Spiritual/Energy Level**: Your life energy (Prana) right now:", opts: [
      { k:"A", t:"Feel scattered, ungrounded, spacey, or disconnected", s:"vata" },
      { k:"B", t:"Feel driven but exhausted — burnt out from overachievement", s:"pitta" },
      { k:"C", t:"Feel stuck, unmotivated, or emotionally numb", s:"kapha" }
    ]}
  ],

  sleep: [
    { q: "**Q1 — Sleep Difficulty Type**: What is your main problem?", opts: [
      { k:"A", t:"Cannot fall asleep — mind is too active, anxious, or restless", s:"vata" },
      { k:"B", t:"Fall asleep but wake mid-night (2–3 AM) unable to return", s:"pitta" },
      { k:"C", t:"Sleep too much but feel unrefreshed, groggy, and heavy all morning", s:"kapha" }
    ]},
    { q: "**Q2 — Dream Pattern**: Describe your dreams:", opts: [
      { k:"A", t:"Vivid, fearful, flying, falling, or chaotic dreams", s:"vata" },
      { k:"B", t:"Intense, violent, competitive, or passionate dreams", s:"pitta" },
      { k:"C", t:"Deep dreamless sleep or slow, pleasant romantic dreams", s:"kapha" }
    ]},
    { q: "**Q3 — Body At Bedtime**: How does your body feel at night?", opts: [
      { k:"A", t:"Cold hands/feet, dry mouth, or muscle twitching at sleep onset", s:"vata" },
      { k:"B", t:"Feels hot or sweaty; prefer cold pillow or cool bedroom", s:"pitta" },
      { k:"C", t:"Heavy and drowsy by 9 PM but cannot wake easily in morning", s:"kapha" }
    ]},
    { q: "**Q4 — Wakeful Cause**: What wakes you or prevents sleep?", opts: [
      { k:"A", t:"Anxious thoughts, sudden noise sensitivity, or environmental change", s:"vata" },
      { k:"B", t:"Acid reflux, anger, hot flushes, or mental replaying of events", s:"pitta" },
      { k:"C", t:"Breathing difficulty, snoring, or feeling of suffocation", s:"kapha" }
    ]},
    { q: "**Q5 — Daytime Effect of Poor Sleep**: How do you feel the next day?", opts: [
      { k:"A", t:"Foggy, unfocused, anxious, nervous, or hypersensitive to stimuli", s:"vata" },
      { k:"B", t:"Irritable, short-tempered, headachy, or with red/burning eyes", s:"pitta" },
      { k:"C", t:"Heavy, slow, swollen-faced, craving sweet or high-carb foods", s:"kapha" }
    ]},
    { q: "**Q6 — Evening Routine**: What do you typically do before bed?", opts: [
      { k:"A", t:"Screen time, social media, or irregular late-night schedule", s:"vata" },
      { k:"B", t:"Work late, have debates/arguments, or consume alcohol/coffee", s:"pitta" },
      { k:"C", t:"Watch TV lying down, overeat dinner, or nap in the evening", s:"kapha" }
    ]},
    { q: "**Q7 — Duration & Onset**: How long has this sleep issue persisted?", opts: [
      { k:"A", t:"Comes and goes — tied to stress, travel, or life changes", s:"vata" },
      { k:"B", t:"Consistent for months — especially during high-pressure periods", s:"pitta" },
      { k:"C", t:"Chronic — been like this for years; always felt heavy/tired", s:"kapha" }
    ]}
  ],

  joints: [
    { q: "**Q1 — Joint Pain Character**: Describe the quality of your joint pain:", opts: [
      { k:"A", t:"Migratory, shifting pain — moves from joint to joint; worse in cold", s:"vata" },
      { k:"B", t:"Burning, hot, reddened, inflamed joints — worse in heat or summer", s:"pitta" },
      { k:"C", t:"Dull, heavy, fixed pain with swelling — worse in damp or rainy weather", s:"kapha" }
    ]},
    { q: "**Q2 — Morning Stiffness**: How stiff are you in the morning?", opts: [
      { k:"A", t:"Very stiff and cracking on waking, eases within 15 minutes", s:"vata" },
      { k:"B", t:"Warm and tender joints in morning — eases with cold compress", s:"pitta" },
      { k:"C", t:"Heavy stiffness for 30–60 minutes; joints feel swollen and immovable", s:"kapha" }
    ]},
    { q: "**Q3 — Aggravating Factors**: What worsens your joint problem?", opts: [
      { k:"A", t:"Cold weather, wind, fasting, irregular meals, or travel", s:"vata" },
      { k:"B", t:"Heat, summer, spicy food, alcohol, or direct sunlight", s:"pitta" },
      { k:"C", t:"Damp cold, rain, heavy meals, sedentary lifestyle, or excess sleep", s:"kapha" }
    ]},
    { q: "**Q4 — Joint Sound (Crepitus)**: Do joints make sounds?", opts: [
      { k:"A", t:"Yes — frequent cracking, popping, or clicking sounds on movement", s:"vata" },
      { k:"B", t:"Occasional mild sounds with burning sensation on movement", s:"pitta" },
      { k:"C", t:"No sounds but significant stiffness, swelling, and weight around joints", s:"kapha" }
    ]},
    { q: "**Q5 — Type of Arthritis (if known)**: Which matches your condition?", opts: [
      { k:"A", t:"Osteoarthritis (dry, degenerative) or vague shifting pain", s:"vata" },
      { k:"B", t:"Rheumatoid, psoriatic arthritis, or gout (uric acid)", s:"pitta" },
      { k:"C", t:"Fluid accumulation, water-on-knee, or fibromyalgia", s:"kapha" }
    ]},
    { q: "**Q6 — Bowel & Gut Connection**: Do gut issues accompany joint pain?", opts: [
      { k:"A", t:"Constipation, gas, or bloating often precedes or accompanies joint flare", s:"vata" },
      { k:"B", t:"Acid, loose stools, or skin rash accompanies inflammation", s:"pitta" },
      { k:"C", t:"Mucus in stools, sluggish bowels, or weight gain alongside joint swelling", s:"kapha" }
    ]},
    { q: "**Q7 — Ama (Toxin) Assessment**: Do you have these toxic-load signs?", opts: [
      { k:"A", t:"Cracked tongue coating, dry skin, cold extremities, dehydrated joints", s:"vata" },
      { k:"B", t:"Yellow/green tongue coating, inflammatory skin, smelly sweat", s:"pitta" },
      { k:"C", t:"Thick white tongue coating, mucus, swollen lymph nodes, fatigue", s:"kapha" }
    ]}
  ],

  immunity: [
    { q: "**Q1 — Primary Complaint**: What is your main immune concern?", opts: [
      { k:"A", t:"Frequent colds/flu, chronic fatigue, poor recovery, or low vitality", s:"vata" },
      { k:"B", t:"Recurring infections with fever, inflammation, or yellow-green mucus", s:"pitta" },
      { k:"C", t:"Sluggish immunity — always tired, congested mucus, or recurrent bronchitis", s:"kapha" }
    ]},
    { q: "**Q2 — Energy Level**: How would you rate your daily energy?", opts: [
      { k:"A", t:"Crashes by afternoon — high in morning but exhausted by 3 PM", s:"vata" },
      { k:"B", t:"Driven and consistent but burns out when ill — takes time to recover", s:"pitta" },
      { k:"C", t:"Perpetually low — hard to start the day; always dragging", s:"kapha" }
    ]},
    { q: "**Q3 — Mucus & Respiratory**: Describe any mucus symptoms:", opts: [
      { k:"A", t:"Dry, scanty, clear mucus; dry cough or dry nose", s:"vata" },
      { k:"B", t:"Yellow or green thick mucus; burning throat or fever with infections", s:"pitta" },
      { k:"C", t:"Abundant white thick mucus; chest congestion or productive cough", s:"kapha" }
    ]},
    { q: "**Q4 — Season of Illness**: When do you fall sick most?", opts: [
      { k:"A", t:"Autumn, winter, or during wind/cold changes", s:"vata" },
      { k:"B", t:"Summer, or periods of high heat and stress", s:"pitta" },
      { k:"C", t:"Monsoon, early spring, or after consuming cold/dairy foods", s:"kapha" }
    ]},
    { q: "**Q5 — Ojas Assessment (Vital Essence)**: How is your overall vitality?", opts: [
      { k:"A", t:"Feel fragile, anxious, and scattered — easily drained by tasks", s:"vata" },
      { k:"B", t:"Feel competitive and driven but emotionally volatile", s:"pitta" },
      { k:"C", t:"Feel stable but heavy, complacent, and lacking enthusiasm", s:"kapha" }
    ]},
    { q: "**Q6 — Gut & Immunity Link**: How is your digestion?", opts: [
      { k:"A", t:"Erratic Agni — alternating constipation and loose motions", s:"vata" },
      { k:"B", t:"Hyper Agni — acidity and inflammation; food intolerances", s:"pitta" },
      { k:"C", t:"Manda Agni — slow, low appetite and consistent weight gain", s:"kapha" }
    ]},
    { q: "**Q7 — Recovery Speed**: After illness, how quickly do you recover?", opts: [
      { k:"A", t:"Slow recovery with lingering dryness, weight loss, and weakness", s:"vata" },
      { k:"B", t:"Moderate — leave some residual inflammation or skin breakouts", s:"pitta" },
      { k:"C", t:"Very slow — mucus persists for weeks; always feel slightly unwell", s:"kapha" }
    ]}
  ],

  diabetes: [
    { q: "**Q1 — Blood Sugar Behaviour**: When do your levels spike?", opts: [
      { k:"A", t:"Fasting sugar normal but post-meal spikes are very unpredictable", s:"vata" },
      { k:"B", t:"Post-meal spikes with thirst, heat sensation, or burning urination", s:"pitta" },
      { k:"C", t:"Consistently elevated fasting sugar with excessive tiredness and weight", s:"kapha" }
    ]},
    { q: "**Q2 — Body Type & Prameha Pattern**: Your body type:", opts: [
      { k:"A", t:"Thin with dry skin, cold body, variable sugar — lean diabetes type", s:"vata" },
      { k:"B", t:"Medium build with inflammation, acidic sweat, and skin issues", s:"pitta" },
      { k:"C", t:"Overweight or obese with sluggish metabolism and fatty liver signs", s:"kapha" }
    ]},
    { q: "**Q3 — Urinary Pattern (Mutra Pariksha)**: Describe your urination:", opts: [
      { k:"A", t:"Frequent small amounts; sometimes dark or scanty", s:"vata" },
      { k:"B", t:"Burning or yellow urination; UTI-prone or frequent infections", s:"pitta" },
      { k:"C", t:"Heavy, turbid, cloudy, or sweet-smelling urine (classic Prameha)", s:"kapha" }
    ]},
    { q: "**Q4 — Hunger & Thirst**: Which matches your experience?", opts: [
      { k:"A", t:"Erratic — sometimes intense hunger, sometimes none at all", s:"vata" },
      { k:"B", t:"Constant thirst and hunger — irritable if meals are delayed", s:"pitta" },
      { k:"C", t:"Slow appetite but excessive hunger after long gaps; constant sweet cravings", s:"kapha" }
    ]},
    { q: "**Q5 — Peripheral Symptoms**: Any numbness or tingling?", opts: [
      { k:"A", t:"Yes — significant tingling, numbness, or pain in feet/hands", s:"vata" },
      { k:"B", t:"Burning in feet, cramps, or inflammatory nerve pain", s:"pitta" },
      { k:"C", t:"Heaviness and swelling in legs; no sharp pain but constant fatigue", s:"kapha" }
    ]},
    { q: "**Q6 — Lifestyle Factor**: Primary cause of your condition:", opts: [
      { k:"A", t:"Stress, irregular meals, poor sleep, or extreme dieting", s:"vata" },
      { k:"B", t:"High-stress career, alcohol, inflammatory diet, or excess meat", s:"pitta" },
      { k:"C", t:"Sedentary lifestyle, excess sweets/carbs, family history, or obesity", s:"kapha" }
    ]},
    { q: "**Q7 — Eye & Skin Signs**: Any secondary diabetes signs?", opts: [
      { k:"A", t:"Dry skin, dry eyes, or blurred vision during stress", s:"vata" },
      { k:"B", t:"Red or inflamed eyes, skin rashes, or boils", s:"pitta" },
      { k:"C", t:"Blurred vision, oily skin, skin tags, or slow-healing wounds", s:"kapha" }
    ]}
  ],

  weight: [
    { q: "**Q1 — Weight Gain Pattern**: How is your weight distributed?", opts: [
      { k:"A", t:"Difficulty gaining weight despite eating well; or rapid weight loss", s:"vata" },
      { k:"B", t:"Moderate weight gain — mainly around abdomen and face", s:"pitta" },
      { k:"C", t:"Consistent weight gain all over; hard to lose despite dieting", s:"kapha" }
    ]},
    { q: "**Q2 — Metabolic Rate Assessment**: My metabolism feels:", opts: [
      { k:"A", t:"Highly variable — fast some days, sluggish others", s:"vata" },
      { k:"B", t:"Strong but I overeat due to emotional cravings or stress", s:"pitta" },
      { k:"C", t:"Very slow — I gain weight just by looking at food", s:"kapha" }
    ]},
    { q: "**Q3 — Craving Pattern (Rasa)**: What do you crave most?", opts: [
      { k:"A", t:"Salty, crunchy, or astringent snacks; irregular meal timing", s:"vata" },
      { k:"B", t:"Spicy, sour, or pungent food; coffee or alcohol to boost metabolism", s:"pitta" },
      { k:"C", t:"Sweet, oily, heavy comfort foods; emotional binge-eating patterns", s:"kapha" }
    ]},
    { q: "**Q4 — Exercise Response**: How do you respond to exercise?", opts: [
      { k:"A", t:"Fatigue easily; joints ache after exercise; inconsistent routine", s:"vata" },
      { k:"B", t:"Enjoy intense workouts but easily inflamed or injured", s:"pitta" },
      { k:"C", t:"Rarely exercise — feel unmotivated; prefer leisurely walks", s:"kapha" }
    ]},
    { q: "**Q5 — Water Retention**: Do you hold water weight?", opts: [
      { k:"A", t:"Minimal water retention; body feels dry and depleted", s:"vata" },
      { k:"B", t:"Moderate — mainly around face, eyes, or abdomen after heavy meals", s:"pitta" },
      { k:"C", t:"Significant — persistent puffiness in ankles, face, and abdomen", s:"kapha" }
    ]},
    { q: "**Q6 — Thyroid & Hormones**: Any hormonal factor?", opts: [
      { k:"A", t:"Stress-driven fluctuations; cortisol spikes causing fat around waist", s:"vata" },
      { k:"B", t:"PCOS, liver heat, or estrogen dominance driving abdominal fat", s:"pitta" },
      { k:"C", t:"Low thyroid (hypothyroid), PCOS, or insulin resistance", s:"kapha" }
    ]},
    { q: "**Q7 — Sleep & Weight Link**: How does your sleep affect weight?", opts: [
      { k:"A", t:"Poor sleep causes anxiety eating and erratic metabolism", s:"vata" },
      { k:"B", t:"Stress insomnia causes cortisol belly — eating at night", s:"pitta" },
      { k:"C", t:"Oversleeping — sleep more than 9 hours; feel heavy and swollen daily", s:"kapha" }
    ]}
  ],

  general: [
    { q: "**Q1 — Dominant Complaint**: What is your primary health concern?", opts: [
      { k:"A", t:"Pain, dryness, anxiety, constipation, or variable energy", s:"vata" },
      { k:"B", t:"Inflammation, acidity, fever, skin issues, or irritability", s:"pitta" },
      { k:"C", t:"Weight, mucus, congestion, sluggishness, or excess sleep", s:"kapha" }
    ]},
    { q: "**Q2 — Weather Sensitivity**: What weather triggers symptoms?", opts: [
      { k:"A", t:"Cold, dry, or windy weather — autumn or early winter", s:"vata" },
      { k:"B", t:"Hot, humid summer or warm tropical climate", s:"pitta" },
      { k:"C", t:"Cold, damp, rainy, or late winter to early spring", s:"kapha" }
    ]},
    { q: "**Q3 — Digestive Pattern (Agni)**: How is your digestion?", opts: [
      { k:"A", t:"Irregular — gas, bloating, alternating constipation/diarrhoea", s:"vata" },
      { k:"B", t:"Excessive — acid, burning, loose stools, or food intolerances", s:"pitta" },
      { k:"C", t:"Slow — low appetite, heavy feeling, or constipation with mucus", s:"kapha" }
    ]},
    { q: "**Q4 — Sleep Quality**: How do you sleep?", opts: [
      { k:"A", t:"Light, interrupted, troubled by anxious or fearful thoughts", s:"vata" },
      { k:"B", t:"Moderate sleep but wake 2–3 AM; hot or sweaty at night", s:"pitta" },
      { k:"C", t:"Deep prolonged sleep but feel exhausted and heavy on waking", s:"kapha" }
    ]},
    { q: "**Q5 — Skin & Tongue**: What does your body surface tell you?", opts: [
      { k:"A", t:"Dry skin, thin body, cracked lips, or coated tongue (thin grey)", s:"vata" },
      { k:"B", t:"Oily skin, reddish complexion, or yellow-coated tongue", s:"pitta" },
      { k:"C", t:"Thick oily skin, pale complexion, or white-coated thick tongue", s:"kapha" }
    ]},
    { q: "**Q6 — Stress Response**: Under pressure I:", opts: [
      { k:"A", t:"Panic, scatter, forget things, or develop palpitations", s:"vata" },
      { k:"B", t:"Get angry, criticise, burn out, or develop migraines", s:"pitta" },
      { k:"C", t:"Withdraw, overeat, procrastinate, or feel depressed", s:"kapha" }
    ]},
    { q: "**Q7 — Pulse & Vitality (Nadi Pariksha simulation)**: Your pulse quality:", opts: [
      { k:"A", t:"Irregular, fast, thin — like a snake's irregular movement", s:"vata" },
      { k:"B", t:"Moderate, sharp, jumping — like a frog leaping forward", s:"pitta" },
      { k:"C", t:"Slow, deep, steady — like a swan gliding through water", s:"kapha" }
    ]}
  ]
};

// Use general questions as fallback for unlisted categories
['womenshealth', 'heart', 'organhealth'].forEach(cat => {
  categoryQuestions[cat] = categoryQuestions['general'];
});

// ─────────────────────────────────────────────────────────────────────────────
// TREATMENT DATABASE — Authentic Charak Samhita-based prescriptions
// ─────────────────────────────────────────────────────────────────────────────
const treatments = {

  skin: {
    vata: {
      diagnosis: "**Vata-type Skin Disorder (Vata Kushtha)**: Your skin suffers from depleted Rasa Dhatu (plasma tissue), high Vata drying tissues, and impaired Ojas. Classical Ayurveda identifies this as Vata Kushtha causing dryness, hyperpigmentation, and premature ageing.",
      medicines: ["Mahamanjishthadi Kadha (50ml twice daily after meals)", "Sarivadyasava (25ml with equal water twice daily)", "Kumkumadi Taila (apply on face at night)", "Chyawanprash (1 tsp with warm milk every morning)", "Shatavari Churna (1 tsp with milk at bedtime)"],
      homeRemedies: ["**Turmeric Milk Mask**: Mix 1 tsp raw turmeric, 1 tsp organic honey, and 2 tsp raw milk. Apply on face for 20 min, rinse with lukewarm water — 3x weekly.", "**Almond Oil Massage**: Warm 2 tsp sweet almond oil with 2 drops sandalwood essential oil. Massage face and body gently in circular motion before bath daily.", "**Triphala Water Rinse**: Soak 1 tsp Triphala powder in water overnight, strain and wash face morning — excellent for dark spots and dull complexion.", "**Diet Protocol**: Include sesame seeds, cow ghee (1 tsp with every meal), soaked almonds (10/day), and warm cooked vegetables. Avoid cold raw salads."],
      therapies: ["**Snehana (Oleation)**: Daily self-massage (Abhyanga) with warm sesame or Dhanwantharam Tailam for 20 minutes before bath — builds Rasa Dhatu.", "**Rakta Mokshana (Blood Purification)**: Leeching therapy or Jalaukavacharana performed by a Vaidya to cleanse the Rakta Dhatu of accumulated toxins.", "**Takradhara**: Continuous pouring of medicated buttermilk (with Amla, Bibhitaki) on the forehead — cools and nourishes deep skin tissues.", "**Nasya Karma**: Instil 2 drops of Anu Taila in each nostril — carries medicines directly to Shira (head) channels, brightening complexion."]
    },
    pitta: {
      diagnosis: "**Pitta-type Skin Disorder (Pitta Kushtha / Raktaja Vikara)**: Excess Pitta in Rakta Dhatu (blood tissue) causes inflammatory skin conditions — acne, rosacea, eczema, rashes. Charaka Samhita classifies this under Kushtha Chikitsa with Pitta-Rakta Shodhana (purification of blood).",
      medicines: ["Neem Capsules (2 caps twice daily with water)", "Mahamanjishtadi Kadha (30ml with water twice daily)", "Avipattikar Churna (1 tsp with warm water before bed for 21 days)", "Kumari Saar (Aloe Vera juice — 30ml on empty stomach morning)", "Panchatikta Ghrita (1 tsp with warm milk — purifies deep tissue toxins)"],
      homeRemedies: ["**Aloe + Rose Water Gel**: Apply fresh aloe vera gel mixed with 5 drops of rose water directly on affected skin. Leave overnight. — Pacifies Pitta inflammation.", "**Cooling Neem Face Pack**: Mix 2 tsp neem powder + 1 tsp multani mitti + 1 tsp rose water into paste. Apply 15 min, rinse. 2x weekly.", "**Coriander-Fennel Drink**: Boil 1 tsp coriander seeds + 1 tsp fennel seeds in 2 cups water. Strain, cool, and drink daily — classical Pitta cooling drink.", "**Diet Protocol**: Completely avoid spicy, sour, fried, and fermented foods. Increase bitter vegetables (bitter gourd, neem), sweet fruits (pomegranate, watermelon, coconut water), and raw cucumber."],
      therapies: ["**Virechana (Therapeutic Purgation)**: The primary classical treatment for Pitta Kushtha — medicated laxative (Trivrit Lehyam) administered by a Vaidya to cleanse the liver and blood of excess Pitta.", "**Raktamokshana (Blood Letting)**: Controlled blood-letting using leeches (Jalaukavacharana) on affected skin — extremely effective for chronic acne and eczema.", "**Lepana Chikitsa**: Application of herbal medicated paste (made of Chandana, Lodhra, Ushira, Haridra) to inflamed skin areas — cools and heals tissues.", "**Sheetali Pranayama**: Practice cooling breath (tongue-curling inhalation) for 10–15 minutes at sunrise daily — reduces internal Pitta heat."]
    },
    kapha: {
      diagnosis: "**Kapha-type Skin Disorder (Sthula Kushtha / Kaphaja Vikara)**: Excess Kapha combined with Ama (toxins from undigested food) blocks skin channels (Srotas), causing oiliness, congestion, whiteheads, and enlarged pores. Charaka describes this as Kaphaja Kushtha requiring deep Shodhana.",
      medicines: ["Triphala Churna (1 tsp with warm water at bedtime)", "Arogyavardhini Vati (2 tablets twice daily after meals)", "Guduchi Satwa (500mg twice daily)", "Haridra Khanda (1 tsp with warm water — anti-inflammatory)", "Kanchanara Guggulu (2 tablets twice daily — clears lymphatic channels)"],
      homeRemedies: ["**Dry Ubtan Scrub**: Mix chickpea flour (besan) + turmeric + sandalwood powder + few drops lemon. Apply as dry scrub on oily areas 3x weekly — absorbs excess Kapha oil.", "**Neem-Turmeric Steam**: Add neem leaves, turmeric, and camphor to boiling water. Steam face for 5 minutes weekly — opens blocked skin pores.", "**Ginger-Honey Toner**: Mix 1 tsp ginger juice + 1 tsp raw honey. Apply on face for 10 min daily — dissolves Ama from skin channels.", "**Diet Protocol**: Completely eliminate dairy, refined sugar, ice cream, and wheat. Eat light, warm, dry, and spicy food. Include ginger, pepper, and long pepper (Pippali) daily."],
      therapies: ["**Udvartana (Dry Powder Massage)**: Vigorous dry massage with herbal powders (Triphala, Haritaki, Neem) in a reverse direction — breaks down fatty deposits and Kapha accumulation.", "**Vamana Karma (Therapeutic Emesis)**: Classical Kapha-releasing detox — medicated vomiting induced under Vaidya supervision with Madanaphala and Yashtimadhu — most effective for Kapha skin.", "**Nasya Karma (Pratimarsha)**: Daily application of sharp herb oil (Shadbindu Taila) in nostrils — clears Kapha from upper respiratory and skin channels.", "**Kapha-reducing Yoga**: Surya Namaskar (12 rounds daily), Bhastrika Pranayama (bellows breath), and Kapalabhati (40 rounds/minute) to burn accumulated Kapha Dosha."]
    }
  },

  hair: {
    vata: {
      diagnosis: "**Vata-type Hair Loss (Khalitya — Vata Predominant)**: Classical Charaka Samhita describes Khalitya (baldness) as being caused primarily by Vata imbalance drying out the Asthi Dhatu (bone tissue, of which hair is a by-product). Vata depletes Sneha (lubrication) from hair roots causing thinning, breakage, and fall.",
      medicines: ["Bhringraj Taila (massage warm into scalp every night)", "Ashwagandha Churna (1 tsp with warm milk at bedtime)", "Brahmi Amla Hair Oil (massage 2x weekly)", "Narasimha Rasayana (1 tsp with milk — nourishes Asthi Dhatu)", "Shatavari Churna (1 tsp with milk — rebuilds deep nourishing tissues)"],
      homeRemedies: ["**Overnight Sesame-Bhringraj Scalp Mask**: Warm 3 tsp sesame oil + 1 tsp Bhringraj powder. Massage into scalp for 10 min, leave overnight, wash morning. 3x weekly.", "**Onion Juice Scalp Rub**: Apply fresh onion juice to scalp, leave 30 min, wash. High sulfur content nourishes hair roots (Kesha Mula).", "**Triphala Rinse**: Boil 2 tsp Triphala in 2 cups water for 15 min. Cool, strain and use as final hair rinse weekly.", "**Diet Protocol**: Eat sesame seeds (1 tsp daily), coconut, soaked almonds, and iron-rich foods. Drink warm milk with Ashwagandha nightly. Avoid skipping meals."],
      therapies: ["**Shiroabhyanga (Head Massage)**: 20-min daily self-massage with warm Bhringraj or Brahmi oil — stimulates Marma points on the scalp, improves Vata circulation to hair roots.", "**Shirodhara**: Warm medicated oil (Dhanwantharam Tailam) poured continuously on the forehead — profoundly calms Vata, nourishes the scalp channels (Kesha Srotas).", "**Nasya (Anu Taila)**: 2 drops of Anu Taila in each nostril — carries nourishment directly to the scalp via nasal channels.", "**Thalam / Tailapichhu**: Medicated oil kept on crown of head (held with cotton) for 45 minutes — deeply penetrates and lubricates hair follicles."]
    },
    pitta: {
      diagnosis: "**Pitta-type Hair Loss (Khalitya — Pitta Predominant)**: Excess Pitta in Rakta (blood) acts as a toxin that destroys hair follicles. Charaka Samhita describes this as Ushna (heat) entering Palita (hair channels) causing premature greying, early baldness, and scalp inflammation.",
      medicines: ["Bhringraj Taila (massage into scalp cooling effect)", "Neeli Bhringadi Taila (specific for Pitta-type hair loss)", "Triphala Churna (1 tsp at bedtime — blood purifier)", "Saarivadyasava (25ml with water — cools Pitta in blood)", "Brahmi Ghrita (1 tsp with warm milk — cools Pitta in head channels)"],
      homeRemedies: ["**Cooling Hibiscus-Amla Mask**: Blend 2 hibiscus flowers + 2 tsp Amla powder + 3 tsp coconut oil. Apply on scalp and hair, leave 1 hour, wash. Weekly.", "**Amla-Brahmi Oil**: Mix Amla juice with Brahmi oil, warm slightly, and massage scalp nightly. Amla is the highest natural source of Vitamin C and cools Pitta perfectly.", "**Coconut-Milk Scalp Rinse**: Warm fresh coconut milk, apply on scalp post-wash, leave 15 min, rinse. Soothes Pitta inflammation.", "**Diet Protocol**: Eliminate spicy, sour, alcohol, and fermented foods. Increase amla (gooseberry), pomegranate, coconut water, and bitter leafy vegetables daily."],
      therapies: ["**Takradhara (Buttermilk Shirodhara)**: Cool medicated buttermilk dripped on the forehead — directly pacifies Pitta in the brain and scalp, dramatically reduces hair fall and premature greying.", "**Virechana**: Medicated purgation to clear Rakta Pitta (inflammatory blood toxins) from the root — recommended for any Pitta-driven skin or hair condition.", "**Raktamokshana**: Therapeutic blood-letting at Marma points on the scalp — releases inflammatory Pitta toxins causing follicle destruction.", "**Sheetali-Shitkari Pranayama**: 15 minutes of cooling breath practice daily — lowers internal body temperature reducing Pitta activity in hair channels."]
    },
    kapha: {
      diagnosis: "**Kapha-type Hair Disorder (Indralupta Variant)**: Kapha combines with Vata to block the fine micro-channels (sookshma srotas) of hair follicles, causing itchy oily dandruff, slow growth, and dead follicles. Charaka classifies this under Kaphaja Indralupta treatment.",
      medicines: ["Kapha-drying Guggulu Vati (2 tabs twice daily)", "Trikatu Churna (1/4 tsp with warm water before meals — ignites Agni)", "Anutaila (5 drops each nostril — Nasya therapy at home)", "Arogyavardhini Vati (2 tabs twice daily after meals)", "Nimba Patra Churna (Neem leaf powder — 500mg with warm water)"],
      homeRemedies: ["**Dry Shikakai + Neem Shampoo**: Mix 2 tsp shikakai powder + 1 tsp neem powder + 1 tsp Triphala. Use as natural shampoo 3x weekly. Eliminates Kapha-type dandruff.", "**Ginger Scalp Stimulator**: Rub fresh ginger slice on scalp for 5 min before oil massage. Ignites scalp circulation and breaks Kapha stagnation.", "**Methi (Fenugreek) Hair Pack**: Soak methi seeds overnight, grind to paste, apply on scalp for 45 min, rinse. Excellent for oily dandruff and sluggish follicles.", "**Diet Protocol**: Eliminate dairy, ice cream, and excessive sweets. Eat light warm meals with ginger, garlic, and black pepper. Include light proteins like moong dal and lentils."],
      therapies: ["**Udvartana Shiro (Head Powder Massage)**: Dry massage of scalp with Triphala, Neem, and Reetha powder in firm circular strokes before oil application.", "**Nasya with Shadbindu Taila**: Sharp herbal nose drops — classically described in Charaka for clearing blocked scalp channels and treating Indralupta (hair loss with dandruff).", "**Vamana (Kapha cleanse)**: Therapeutic emesis under Vaidya supervision — primary classical treatment for all Kaphaja conditions including sluggish hair disorders.", "**Kapalabhati Pranayama**: 10 minutes daily of rapid abdominal breathing — generates internal heat to burn Kapha in the scalp and improve blood circulation to hair roots."]
    }
  },

  digestion: {
    vata: {
      diagnosis: "**Vata-type Digestive Disorder (Vata Grahani / Anaha)**: Classical texts describe Vishama Agni (variable digestive fire) as the hallmark of Vata digestive imbalance. Charaka Samhita's Chikitsa Sthana identifies this as Anaha (bloating/gas), Vibandha (constipation), and Pravahika (irregular bowel).",
      medicines: ["Hingvastak Churna (1/2 tsp with ghee 15 min before meals)", "Trikatu Churna (1/4 tsp with warm water before meals)", "Gandharva Haritaki (2 tabs with warm water at bedtime)", "Dashamoola Kadha (25ml twice daily — pacifies systemic Vata)", "Ajwain (Carom seeds — 1 tsp with warm water after every meal)"],
      homeRemedies: ["**Ginger-Lemon-Sendha Salt**: Mix fresh ginger juice + lemon juice + rock salt (Sendha namak). Take 1 tsp before each meal. Classical Deepana (Agni-kindling) formula from Charaka Samhita.", "**Warm Castor Oil at Bedtime**: 1 tsp castor oil in warm milk or ginger tea at bedtime — gently relieves Vata-type constipation without harsh laxative effects.", "**Triphala Night Formula**: 1 tsp Triphala powder in warm water at 9 PM — balances all three Doshas, regulates bowel, builds intestinal Ojas.", "**Diet Protocol**: Always eat warm, freshly cooked food with ghee. Avoid raw salads, cold beverages, and gas-causing foods (beans, chickpeas, broccoli). Eat at fixed times."],
      therapies: ["**Basti Karma (Anuvasan Basti)**: Medicated oil enema (Dhanwantharam Tailam or Sesame oil-based) — the primary classical treatment for all Vata disorders including digestive Vata. Charaka calls Basti the 'half of all therapies'.", "**Kati Basti**: Warm medicated oil pooled on the lower back for 30 minutes — deeply nourishes the Apana Vata, regulating downward movement and bowel function.", "**Abhyanga + Swedana**: Full-body oil massage followed by steam — calms systemic Vata, improves circulation to intestines.", "**Pranayama for Vata Gut**: Nadi Shodhana (alternate nostril breathing) 15 min daily + Pavanamuktasana (wind-relieving pose) to physically release trapped intestinal gas."]
    },
    pitta: {
      diagnosis: "**Pitta-type Digestive Disorder (Tikshna Agni / Pitta Grahani)**: Charaka Samhita describes Tikshna Agni (sharp, excess digestive fire) causing the stomach lining to erode — manifesting as gastritis, peptic ulcers, acid reflux, and inflammatory bowel conditions (Pittaja Grahani).",
      medicines: ["Avipattikar Churna (1 tsp with cool water before bed)", "Shatavari Churna (1 tsp with cool milk twice daily)", "Yashtimadhu (Licorice) powder (1 tsp with warm milk — heals gastric lining)", "Praval Pishti (250mg twice daily — excellent natural antacid)", "Pomegranate juice (100ml with mishri — classical Pitta liver tonic)"],
      homeRemedies: ["**Amla-Coconut Cooling Formula**: Mix 1 tsp Amla powder in 1 glass coconut water. Drink every morning on empty stomach. Classically described as the best Pitta pacifier for digestive fire.", "**Fennel-Coriander-Cumin Tea**: Boil 1 tsp each of fennel, coriander, and cumin seeds. Strain, cool to room temperature. Drink after both meals. Classical tridosha digestive formula.", "**Banana-Ghee Remedy**: Ripe banana mashed with 1 tsp cow ghee — soothes acidic stomach lining. Take mid-morning as snack.", "**Diet Protocol**: Completely eliminate spicy, fermented, sour, and fried foods. Increase cooling foods: rice, coconut, coriander, pomegranate, and fresh dairy (warm milk with mishri). Eat on time."],
      therapies: ["**Virechana Karma (Therapeutic Purgation)**: Primary Panchakarma for all Pitta disorders — Trivrit Lehyam or Ichhabhedi Rasa administered under Vaidya supervision clears liver, gallbladder, and small intestine of excess Pitta.", "**Shirodhara with Ksheera Dhara (Milk Dhara)**: Medicated warm milk with Shatavari poured on the forehead — cools Pitta from the top (shira-to-gut axis) and calms nervous hyperacidity.", "**Uttara Basti (Intestinal enema)**: Medicated cooling oil or milk decoction enema to soothe the inflamed intestinal lining.", "**Sheetali-Shitkari Pranayama**: Cooling breath practices for 15 minutes after meals — reduces internal gastric fire preventing post-meal acid spikes."]
    },
    kapha: {
      diagnosis: "**Kapha-type Digestive Disorder (Manda Agni / Ama Formation)**: Charaka Samhita's most important digestive concept — Manda Agni (slow digestive fire) allows Ama (toxic undigested material) to accumulate in the gut, blocking all Srotas (channels) and causing chronic sluggishness, mucus, and Kapha Grahani.",
      medicines: ["Trikatu Churna (1/2 tsp with honey 30 min before meals — ignites Agni)", "Chitrakadi Vati (2 tabs before meals — Agni deepan)", "Hingvastak Churna (1/2 tsp with rock salt before meals)", "Panchakola Phanta (hot infusion of 5 heating spices)", "Triphala Churna (1 tsp at bedtime — moves Ama out of gut)"],
      homeRemedies: ["**Classical Agni-Kindler Tea**: Boil 1 inch fresh ginger + 5 black peppercorns + 1/2 tsp cumin in 2 cups water for 10 min. Add 1 tsp raw honey when cooled to 40°C. Drink 30 min before each meal.", "**Rock Salt + Lemon Appetizer**: 1/4 tsp black salt + lemon juice + fresh ginger in warm water before meals. Described in Charaka as the best Manda Agni remedy.", "**Dry Ginger Powder (Sonth) Milk**: Boil 1/4 tsp dry ginger powder in 1 cup warm milk with turmeric. Drink at bedtime — melts accumulated Ama overnight.", "**Diet Protocol**: Eat only one cooked warm meal a day if severely congested. No snacking between meals. Avoid all dairy, wheat, and sweets until Agni recovers. Do 30-min brisk walk after dinner."],
      therapies: ["**Vamana Karma (Therapeutic Emesis)**: Classical Charaka Samhita's primary treatment for Kapha — medicated emesis clears accumulated Kapha from stomach and respiratory tract in one session. Done under expert Vaidya supervision.", "**Udwartana (Dry Herb Powder Massage)**: Vigorous full-body reverse-direction massage with Triphala, Yava, and Neem powder — burns Kapha, stimulates lymphatic drainage, ignites Agni.", "**Lekhan Basti (Scraping Enema)**: Medicated decoction enema with Vacha, Triphala, and honey — classically described for scraping Ama from colon walls.", "**Agni-stimulating Yoga**: Nauli Kriya (abdominal churning), Mayurasana, and Vajrasana (sitting pose after meals) directly stimulate digestive fire per classical Hatha Yoga texts."]
    }
  },

  // ── Compact treatments for other categories ──────────────────────────────
  mentalhealth: {
    vata: {
      diagnosis: "**Vata-type Mental Disorder (Vata Unmada / Chittodvega)**: Charaka Samhita Chapter 9 (Unmada Nidana) describes Vataja Unmada as caused by excessive fear, grief, and Vata accumulation in Manovahasrotas — manifesting as anxiety, panic, racing thoughts, and nervous disorders.",
      medicines: ["Ashwagandha Churna (1 tsp warm milk nightly)", "Brahmi Ghrita (1 tsp warm milk twice daily)", "Saraswatarishta (25ml twice daily after meals)", "Manasvilas Ras (classical mental tonic — 2 tabs twice daily)", "Jatamansi Churna (1 tsp warm water at bedtime — calms nervous system)"],
      homeRemedies: ["**Warm Milk Rasayana**: Warm 1 glass organic milk + 1/4 tsp Ashwagandha + 1/4 tsp Brahmi + pinch nutmeg + 1 tsp ghee. Drink 30 min before bedtime daily.", "**Sesame Oil Head Massage**: Warm sesame oil, massage scalp and soles of feet for 15 min every evening before bed — grounds hyperactive Vata.", "**Rose Petal Tea**: Steep 5 fresh or dried rose petals + 3 cardamom pods in hot water. Drink twice daily — calms Prana Vata, reduces anxiety.", "**Routine Protocol**: Fixed wake time (sunrise), fixed meal times, 15 min of Yoga Nidra before sleep — Vata pacification requires above all a strict daily routine (Dinacharya)."],
      therapies: ["**Shirodhara (Warm Oil)**: 45-minute continuous warm oil flow on forehead — the most classical Ayurvedic treatment for anxiety, PTSD, and nervous exhaustion. Directly calms Prana Vata.", "**Nasya Karma with Brahmi Oil**: 5 drops Brahmi or Anu Taila in each nostril — carries Medhya (brain-nourishing) herbs directly to the mind via nasal channels.", "**Abhyanga + Swedana**: Daily oil massage is essential — without proper Snehana, Vata will not settle. Follow with mild steam.", "**Yoga Nidra + Nadi Shodhana**: 30 min of Yoga Nidra (guided deep relaxation) + Nadi Shodhana (alternate nostril breathing) — most effective combination for Vata anxiety per classical Yoga Chikitsa."]
    },
    pitta: {
      diagnosis: "**Pitta-type Mental Disorder (Pittaja Unmada / Krodha Roga)**: Charaka describes Pittaja Unmada as excess Pitta in Manovahasrotas causing rage, critical thinking, perfectionistic traits, burnout, and inflammatory mental states.",
      medicines: ["Brahmi (Bacopa) Capsules (500mg twice daily after meals)", "Sarpagandha Vati (1 tab at night — classical blood pressure and anger herb)", "Saraswatarishta (25ml with water twice daily — Pitta brain tonic)", "Chandanasava (25ml twice daily — cooling liver and brain)", "Praval Pishti (250mg with rose water twice daily — calms Pitta)"],
      homeRemedies: ["**Rose-Sandalwood Cooling Compress**: Apply cool rose water compress on forehead and eyes for 15 min daily. Mix sandalwood paste on temples at bedtime.", "**Amla-Pomegranate Juice**: 50ml each of fresh Amla and pomegranate juice mixed. Drink daily in morning. Purifies Pitta from blood.", "**Brahmi-Shatavari Cold Milk**: Blend 1 tsp Brahmi + 1 tsp Shatavari in cold coconut milk with rose water. Drink mid-morning.", "**Sunlight & Nature Protocol**: Avoid screens and artificial light after 8 PM. Spend 30 min in nature (sunrise walk without phone). Complete silence for 20 min after wake-up."],
      therapies: ["**Virechana (Pitta Shodhana)**: Therapeutic purgation to clear excess Pitta from liver — dramatically reduces anger, irritability, and inflammatory mental states.", "**Takra Shirodhara (Buttermilk Dhara)**: Cool medicated buttermilk continuously poured on forehead — most effective Pitta cooling treatment for burnout and anger.", "**Shirolepa (Herbal Head Pack)**: Application of cooling herbal paste (Chandana, Ushira, Brahmi) on the head — directly cools Pitta in the brain.", "**Tratak + Cooling Pranayama**: Candle-flame Tratak meditation (10 min) + Sheetali (cooling tongue breath 15 min) — classical combination for Pitta mental cooling."]
    },
    kapha: {
      diagnosis: "**Kapha-type Mental Disorder (Kaphaja Unmada / Avasada)**: Classical Charaka describes Kaphaja Unmada as mental heaviness, emotional withdrawal, depression, attachment, and grief — caused by Kapha blocking Manovahasrotas, suppressing Prana and mental clarity.",
      medicines: ["Brahmi Vati (2 tabs twice daily after meals — stimulates Kapha mind)", "Trikatu Churna (1/4 tsp warm water before meals — burns mental Kapha)", "Vacha Powder (Acorus calamus — 1/4 tsp with honey — awakens mind)", "Ashwagandha (for energy + motivation, 1 tsp warm milk morning)", "Kapha-clearing Guggulu (2 tabs twice daily)"],
      homeRemedies: ["**Ginger-Pepper-Brahmi Morning Tea**: Boil 1/4 inch ginger + 3 black peppers + 5 Brahmi leaves. Add 1 tsp raw honey. Drink on empty stomach daily.", "**Nasya with Sharp Herbs**: 1 drop of Vacha or Shadbindu oil in each nostril daily morning — classically described as the primary treatment for Kaphaja depression.", "**Vigorous Dry Rubbing**: Use a dry loofah or rough towel to vigorously rub the entire body before morning shower — stimulates Kapha and awakens the nervous system.", "**Strict Morning Protocol**: Force wake at sunrise (even if tired), cold-water face wash, 20-min run or vigorous Surya Namaskar. Kapha must be broken by will and action."],
      therapies: ["**Vamana (Kapha Shodhana)**: Classical primary treatment for Kaphaja Unmada — medicated emesis under Vaidya supervision releases deep-seated emotional Kapha causing depression.", "**Udvartana (Vigorous Dry Massage)**: Herb powder massage in upward strokes — stimulates lymph, burns Kapha, elevates mood through physical invigoration.", "**Nasya with Vacha Taila**: Sharp herbal nasal drops — cuts through Kapha in the channels of the brain, restoring mental clarity and motivation.", "**Bhastrika + Kapalabhati**: Vigorous pranayama — Bhastrika (bellows breath) 10 minutes + Kapalabhati 10 minutes daily — physically burns Kapha in lungs and mind."]
    }
  },

  sleep: {
    vata: {
      diagnosis: "**Vata-type Insomnia (Anidra — Vata Pradhana)**: Charaka Samhita Sutra Sthana describes Anidra caused by hyperactive Prana Vata and Tarpaka Kapha deficiency in the nervous system channels — manifesting as inability to fall asleep, light sleep, and anxious dreams.",
      medicines: ["Ashwagandha Churna (1 tsp warm milk 30 min before bed)", "Jatamansi Churna (1 tsp warm water at bedtime)", "Brahmi Ghrita (1 tsp warm milk nightly)", "Tagar (Valeriana wallichii) — 500mg at bedtime — classical Ayurvedic sedative", "Manasmitra Vatakam (2 tabs — classical formulation for Anidra and anxiety)"],
      homeRemedies: ["**Nutmeg Warm Milk**: Warm 1 cup organic milk + 1 pinch nutmeg + 1/4 tsp Ashwagandha + 1 tsp ghee + 1 tsp mishri. Drink 30 min before sleep. — Nourishes Tarpaka Kapha and calms Prana Vata.", "**Foot Oil Ritual**: Warm pure castor oil or sesame oil, massage soles of feet and between toes for 10 min. Wear cotton socks. The feet contain critical Vata-calming Marma points.", "**Banana-Honey Snack**: 1 ripe banana with 1 tsp raw honey at 8 PM — provides tryptophan and natural magnesium to support sleep neurotransmitters.", "**Pre-sleep Protocol**: Switch off all screens by 9 PM. Do 10 min of Shavasana (corpse pose). Apply Brahmi oil on crown of head. Keep bedroom dark, quiet, and slightly cool."],
      therapies: ["**Shirodhara (Sesame or Brahmi Oil)**: The definitive classical treatment for insomnia — 45-min warm oil flow on the forehead has been clinically proven to activate the sleep switch in the hypothalamus.", "**Padabhyanga (Foot Massage Therapy)**: 20-minute professional foot massage with warm sesame oil before bed — stimulates 72,000 nerve endings in the feet, calming the entire nervous system.", "**Nasya with Brahmi Oil**: 5 drops warm Brahmi oil in each nostril at bedtime — directly reaches Tarpaka Kapha region in head, restoring normal sleep architecture.", "**Yoga Nidra**: 30-minute guided Yoga Nidra (non-sleep deep rest) — clinical studies show equivalent brain restoration to 4 hours of conventional sleep. Practice daily before bedtime."]
    },
    pitta: {
      diagnosis: "**Pitta-type Sleep Disorder (Pitta Anidra / Nidranasha)**: Charaka describes Sadhaka Pitta imbalance in the heart and liver channels causing wakefulness at Pitta time (2–4 AM). Excess heat and inflammatory Pitta in the nervous system prevents deep sleep maintenance.",
      medicines: ["Brahmi Capsules (2 tabs after dinner)", "Chandanasava (25ml after dinner with water)", "Praval Pishti (250mg with rose water at bedtime — cooling)", "Sarpagandha (classical Pitta-calming nervine — 1 tab at bedtime)", "Ashoka Ghrita (1 tsp warm milk — soothes Sadhaka Pitta in the heart)"],
      homeRemedies: ["**Rose-Coconut Milk Nightcap**: Warm coconut milk + 5 drops rose water + 1/4 tsp Brahmi powder + mishri. Drink at 9 PM — specifically cools Pitta in Mano Vahasrotas.", "**Sandalwood Temple Paste**: Mix sandalwood powder with rose water into a paste. Apply thin layer on temples and forehead at bedtime — immediate cooling of Pitta.", "**Cucumber-Fennel Evening Snack**: Fresh cucumber slices with fennel seeds at 7 PM — reduces evening Pitta heat spike before sleep.", "**Cool Bedroom Protocol**: Sleep in a well-ventilated, slightly cool room. Use cotton sheets only. No spicy food after 6 PM. Avoid alcohol completely — most disruptive to Pitta sleep."],
      therapies: ["**Takra Shirodhara (Buttermilk)**: Cool medicated buttermilk with Amla poured on forehead — specifically pacifies Pitta in the head and calms Sadhaka Pitta to restore sleep.", "**Shirolepa with Chandana**: Cooling sandalwood and Amla paste applied on the scalp at bedtime — reduces thermal activation of Pitta preventing 2 AM waking.", "**Virechana**: If sleep issues are chronic, a Pitta Shodhana (cleansing) via medicated purgation resets the liver–brain Pitta axis dramatically improving sleep.", "**Chandra Bheda Pranayama (Moon Breath)**: Inhale through left nostril only for 15 minutes — classical technique for activating the cooling lunar energy channel (Ida Nadi), pacifying Pitta."]
    },
    kapha: {
      diagnosis: "**Kapha-type Sleep Disorder (Ati Nidra — Excess Sleep)**: Charaka Samhita describes Ati Nidra (hypersomnia) as the primary Kaphaja disorder — excess Tarpaka Kapha blocking Manovahasrotas causing excessive, unrefreshing sleep and morning heaviness (Tandrā).",
      medicines: ["Trikatu Churna (1/4 tsp warm water first thing in morning)", "Brahmi Vati (2 tabs morning and afternoon)", "Arogyavardhini Vati (2 tabs after breakfast)", "Vacha (Acorus calamus) — 250mg with honey in morning — brain activator", "Guggulu formulation (2 tabs after lunch — Kapha metabolic activator)"],
      homeRemedies: ["**Morning Ginger-Pepper Activation Drink**: Boil 1 inch ginger + 5 black peppers + 2 Tulsi leaves + 1/4 tsp turmeric in 2 cups water. Strain. Add 1 tsp honey. Drink immediately on waking.", "**Cold Water Face Splash**: Splash cold water on face and eyes 20 times upon waking. Classical Dinacharya recommendation to shock Tarpaka Kapha out of sluggishness.", "**Nasya with Sharp Herbs**: 1 drop Shadbindu Taila in each nostril first thing — classically described to dispel morning Kapha heaviness.", "**Sunrise Walk Protocol**: Wake before sunrise, regardless of how you feel. Brisk 30-min walk in morning sun and fresh air — the most powerful Kapha-dispersing daily practice."],
      therapies: ["**Udvartana (Stimulating Dry Massage)**: Vigorous dry powder massage before morning shower — physically disperses Kapha lethargy and stimulates lymphatic circulation.", "**Nasya Karma (Marsha or Pratimarsha)**: Regular medicated nasal drops — clears Kapha from the brain channels, improving daytime alertness.", "**Vamana Karma (Seasonal)**: Annual therapeutic emesis each spring (Vasanta Ritu) — Charaka's classical protocol for preventing annual Kapha accumulation that causes hypersomnia.", "**Kapalabhati (40 min daily)**: Rapid abdominal pumping — physically burns Tarpaka Kapha in the head and chest, the most powerful Kapha-breaking pranayama technique."]
    }
  },

  joints: {
    vata: {
      diagnosis: "**Vata-type Joint Disease (Vata Roga / Sandhivata — Osteoarthritis)**: Charaka Samhita Chikitsa Sthana Chapter 28 describes Sandhivata as depletion of Sleshaka Kapha (synovial fluid) by excess Vata — causing dry, painful, cracking joints with migratory pain. Modern correlate: osteoarthritis, degenerative disc disease.",
      medicines: ["Yogaraj Guggulu (2 tabs twice daily after meals)", "Dashamoola Kadha (25ml twice daily — systemic Vata pacifier)", "Ashwagandha Churna (1 tsp warm milk at bedtime — builds Asthi Dhatu)", "Shallaki (Boswellia) Capsules (2 caps twice daily — anti-inflammatory)", "Rasnasaptaka Kadha (25ml twice daily — classical joint decoction)"],
      homeRemedies: ["**Warm Sesame Oil Joint Pack**: Warm sesame oil with camphor and apply to affected joints. Wrap in warm cloth for 30 min. Twice daily for acute pain.", "**Methi-Ajwain Anti-Vata Drink**: Soak 1 tsp each of fenugreek and carom seeds overnight. Boil in morning, strain and drink. Reduces joint stiffness.", "**Ashwagandha-Turmeric Milk**: 1 tsp Ashwagandha + 1 tsp turmeric in warm milk at bedtime. Rebuilds the Asthi Dhatu (bone tissue) depleted by excess Vata.", "**Diet Protocol**: Eat warm, soupy, oily foods. Include ghee in every meal. Avoid dry foods, beans, and cold water. Sesame seeds and soaked walnuts daily."],
      therapies: ["**Janu Basti / Kati Basti (Joint Oil Pooling)**: A ring of dough built around the joint, filled with warm medicated oil (Dhanwantharam Tailam or Mahanarayan Tailam). Held for 45 min — directly lubricates dry articular cartilage.", "**Panchakarma Basti (Oil Enema)**: Classical Charaka Samhita's treatment of choice for all Vata disorders — Anuvasana Basti (oil enema) with Dhanwantharam Tailam nourishes the entire Vata-Asthi axis.", "**Pinda Sweda (Bolus Steam)**: Hot rice-and-milk boluses applied in rhythmic strokes on joints — nourishes Asthi Dhatu and restores Sleshaka Kapha.", "**Rasayana Therapy**: Ashwagandha + Bala + Shatavari combination (Bruhan Chikitsa) — builds up depleted deep tissues over 90 days, reversing Vata-type degeneration."]
    },
    pitta: {
      diagnosis: "**Pitta-type Joint Disease (Pittaja Sandhi Shotha / Vatarakta — Gout & Rheumatoid Arthritis)**: Charaka Samhita Chapter 29 describes Vatarakta as Vata combined with vitiated Rakta (Pitta-inflamed blood) causing burning, reddened, inflamed joints — modern correlate: gout, rheumatoid arthritis, and psoriatic arthritis.",
      medicines: ["Triphala Guggulu (2 tabs twice daily — anti-inflammatory liver cleanse)", "Gokshuradi Guggulu (2 tabs twice daily — uric acid clearance for gout)", "Mahamanjishthadi Kadha (25ml twice daily — Rakta Shodhana)", "Guduchi Satwa (500mg twice daily — anti-inflammatory immunomodulator)", "Punarnava Mandura (2 tabs twice daily — reduces Pitta-type joint inflammation)"],
      homeRemedies: ["**Coconut Oil-Turmeric Anti-Inflammatory Rub**: Mix 2 tsp coconut oil + 1 tsp turmeric. Gently apply to inflamed joints. Never use heat on Pitta-type joints — use room temperature or cool application.", "**Cherry-Pomegranate Anti-Uric Drink**: Fresh pomegranate juice (50ml) daily — classical Rakta Shodhaka (blood purifier) for Vatarakta (gout-type joint inflammation).", "**Coriander-Fennel Cooling Drink**: Boil 1 tsp each and drink cooled — reduces uric acid accumulation and cools Pitta in Rakta.", "**Diet Protocol**: Completely eliminate red meat, shellfish, alcohol, and high-purine foods. Increase cherries, pomegranate, bitter gourd, and dark leafy greens."],
      therapies: ["**Virechana (Rakta Pitta Shodhana)**: Primary Panchakarma for Vatarakta — Trivrit Lehyam-based purgation to eliminate uric acid and inflammatory Pitta from blood and liver.", "**Lepana Chikitsa**: Application of cooling herbal paste (Sandalwood, Chandana, Lodhra, Manjistha) directly on hot swollen joints — immediate anti-inflammatory effect.", "**Raktamokshana (Leeching)**: Application of medicinal leeches (Jalaukavacharana) to inflamed joints — leeches directly remove Pitta-vitiated blood from local tissue.", "**Sheetali Pranayama**: 20 minutes of cooling breath practice daily — reduces systemic Pitta inflammation affecting joints."]
    },
    kapha: {
      diagnosis: "**Kapha-type Joint Disease (Amavata — Similar to Rheumatoid Arthritis)**: Charaka's Amavata Chikitsa describes Ama (toxins from incomplete digestion) combining with Kapha to settle in joints — causing fixed, heavy, swollen joints with morning stiffness exceeding 1 hour. Modern correlate: rheumatoid arthritis, fibromyalgia.",
      medicines: ["Simhanada Guggulu (2 tabs twice daily — primary Amavata medicine)", "Rasna-Guggulu combination (classical Amavata protocol)", "Trikatu Churna (1/2 tsp with warm water before meals — burns Ama)", "Guduchi Ghrita (1 tsp warm water — immunomodulator)", "Punarnava Kadha (25ml twice daily — reduces Kapha swelling)"],
      homeRemedies: ["**Hot Ginger-Castor Oil Compress**: Boil castor oil with dry ginger (Sonth) powder. Apply warm compress with this oil to stiff swollen joints for 30 min. Classically described for Amavata.", "**Fasting Protocol (Langhana)**: Classical Charaka recommendation — light fasting on buttermilk or warm water with Trikatu one day per week to burn accumulated Ama in joints.", "**Turmeric-Pepper Milk**: 1/2 tsp turmeric + 1/4 tsp black pepper in warm milk. Daily. The piperine in black pepper increases turmeric bioavailability 2000%.", "**Diet Protocol**: Avoid curds, cold foods, fish, sesame, and excessive sweets. Eat light, warm, and lightly spiced meals. Old rice (purana shali), moong soup, and warm vegetable soups."],
      therapies: ["**Swedana (Patrapotali Sweda)**: Hot herbal bundle massage (with Nirgundi, Eranda, and Rasna leaves) applied rhythmically to affected joints — primary Amavata treatment, reduces Ama and Kapha stiffness.", "**Niruha Basti (Decoction Enema)**: Herbal decoction enema with Vacha, Triphala, and anti-Ama herbs — classical intestinal cleansing for Amavata treatment per Charaka Chikitsa.", "**Udvartana**: Dry powder massage with Triphala and heating herbs — breaks down Kapha deposits in joint spaces.", "**Langhana (Therapeutic Fasting)**: Supervised therapeutic fasting is described in Charaka Samhita as the primary treatment for Ama — nothing burns Ama like controlled fasting combined with hot ginger water."]
    }
  },

  immunity: {
    vata: {
      diagnosis: "**Depleted Ojas — Vata-type Low Immunity**: Charaka Samhita describes Ojas (vital essence) as the final product of all seven Dhatus. Excess Vata depletes Ojas causing chronic fatigue, poor recovery, and fragile immunity. Classical treatment is Rasayana Chikitsa (rejuvenation).",
      medicines: ["Chyawanprash (1 tsp warm milk twice daily — greatest classical Rasayana)", "Ashwagandha Churna (1 tsp warm milk at bedtime)", "Shatavari Churna (1 tsp warm milk twice daily)", "Amalaki Rasayana (classical single herb Rasayana — 1 tsp warm water)", "Bala Churna (root powder — 1 tsp warm milk — builds Shukra and Ojas)"],
      homeRemedies: ["**Ojas Rebuild Milk Rasayana**: Boil 1 glass milk with 10 soaked almonds (blended), 5 soaked dates, 1 tsp Ashwagandha, 1 tsp ghee, and 1 tsp honey (added after cooling). Drink daily.", "**Golden Turmeric Honey**: 1 tsp raw turmeric powder + 1 tsp raw honey mixed into paste. Take 1/4 tsp sublingually 3x daily. Classical anti-viral and Ojas builder.", "**Tulsi-Ginger Immunity Kadha**: Boil 5 Tulsi leaves + 1 inch ginger + 5 black pepper + 1/4 tsp turmeric in 3 cups water. Reduce to 1 cup, add honey. Drink twice daily.", "**Protocol**: Sleep by 10 PM and rise at 6 AM without fail. This is non-negotiable for Ojas recovery. Vata immunity requires absolute lifestyle regularity."],
      therapies: ["**Rasayana Chikitsa (Kuti Praveshika)**: The classical Charaka protocol for deep immunity rebuild — a 30–45 day indoor Rasayana regimen with Chyawanprash, milk, and rejuvenating herbs.", "**Abhyanga + Swedana**: Daily warm oil massage followed by steam — prevents Vata from depleting Ojas through stress and dehydration.", "**Nasya + Shirodhara**: Oil Nasya strengthens Prana Vata; Shirodhara rebuilds Tarpaka Kapha — together they rebuild the Ojas-protecting systems of the head.", "**Pranayama Sadhana**: Nadi Shodhana (20 min) + Bhramari (10 min) + Anulom Vilom — classical breathing practices to strengthen Prana and build Ojas."]
    },
    pitta: {
      diagnosis: "**Pitta-type Immune Dysregulation**: Excess Pitta creates an overly reactive immune response — manifesting as autoimmune tendencies, inflammatory diseases, frequent infections with high fever, and burning recovery. Charaka's approach: Pitta Shodhana + Rasayana.",
      medicines: ["Guduchi (Giloy) Capsules (2 caps twice daily — best classical immunomodulator)", "Tulsi + Ginger + Honey Kadha (twice daily)", "Neem Capsules (2 caps after meals — blood purifier + anti-microbial)", "Amalaki Rasayana (1 tsp warm water — highest Vitamin C, Pitta-cooling)", "Shatavari Churna (1 tsp cold milk — cooling Rasayana for Pitta immunity)"],
      homeRemedies: ["**Amla-Giloy-Tulsi Juice**: Fresh Amla juice (30ml) + Giloy juice (15ml) + Tulsi juice (10ml). Drink every morning on empty stomach. — Best Pitta-cooling immunity formula.", "**Cooling Kadha**: Boil coriander seeds + fennel + Tulsi + ginger (minimal). Cool to room temperature and drink with raw honey.", "**Triphala Night Dose**: 1 tsp Triphala in warm water at bedtime — purifies blood and lymph of Pitta toxins nightly.", "**Protocol**: Avoid alcohol, red meat, fermented foods, and excess salt completely. These directly increase Pitta and weaken immunity's regulatory capacity."],
      therapies: ["**Virechana**: Seasonal medicated purgation — the most effective classical Pitta cleanse; dramatically reduces inflammatory immune burden.", "**Raktamokshana**: Blood purification therapy — reduces inflammatory mediators in blood that cause hyper-reactive Pitta immunity.", "**Chandanadi Basti**: Cooling herbal enema with Chandana and Yashtimadhu — reduces systemic inflammation.", "**Cooling Meditation + Trataka**: Daily 20-min silent meditation + Tratak (candle gazing) — calms the overactive Pitta immune response through the nervous system."]
    },
    kapha: {
      diagnosis: "**Kapha-type Low Immunity (Ama-based)**: Charaka identifies Kapha Ama as the greatest enemy of Ojas — sticky, congesting Ama blocks all Srotas and suppresses immune function. Treatment: Agni stimulation + Ama pachan + Rasayana.",
      medicines: ["Trikatu Churna (1/2 tsp with honey before meals — burns Ama)", "Sitopaladi Churna (1 tsp honey twice daily — respiratory immunity)", "Talishadi Churna (Kapha-cutting respiratory formula)", "Chyawanprash (1 tsp after breakfast — with warm water, not milk)", "Arogyavardhini Vati (2 tabs after meals — comprehensive Kapha detoxifier)"],
      homeRemedies: ["**Haldi-Adrak-Kali Mirch Kadha**: Boil 1 tsp turmeric + 1 inch ginger + 8 black peppercorns + 2 cloves in 3 cups water. Reduce to 1 cup. This is the classical Kapha-clearing immune decoction.", "**Garlic-Honey Rasayana**: Peel 1 garlic clove, crush, mix with 1 tsp raw honey. Take daily on empty stomach. Classical Rasonam (garlic) Rasayana for Kapha immunity.", "**Steam Inhalation**: Add Eucalyptus + Camphor + Tulsi + Ajwain to boiling water. Steam inhale for 10 min twice daily — clears respiratory Kapha blocks.", "**Protocol**: One light day per week (only soups, no solid food, warm water only) — periodically breaks the Ama-Kapha cycle that suppresses immunity."],
      therapies: ["**Vamana (Kapha Shodhana)**: Seasonal therapeutic emesis — primary Panchakarma for Kapha immunity; directly removes Ama and Kapha from the respiratory-lymphatic system.", "**Nasya Karma (Katu Taila)**: Sharp herbal nasal drops — classically described for clearing Kapha from the head, sinuses, and upper respiratory tract.", "**Udvartana**: Dry herbal powder massage — stimulates lymphatic flow, breaks down Ama deposits, and reactivates sluggish Kapha immunity.", "**Bhastrika + Kapalabhati**: 20 min of intense pranayama — directly burns Ama in the respiratory tract and ignites Agni, the root of all immunity."]
    }
  },

  // Remaining categories use condensed shared format
  diabetes: {
    vata: {
      diagnosis: "**Vata-type Prameha (Lean/Neurogenic Diabetes)**: Charaka Samhita's Prameha Nidana describes Vataja Prameha in thin individuals — caused by depletion of Ojas and Rasa Dhatu. Nervous system-driven irregular blood sugar with neuropathy.",
      medicines: ["Chandraprabha Vati (2 tabs twice daily after meals)", "Gudmar (Gymnema sylvestre) Capsules (500mg before meals)", "Shilajit (500mg twice daily — rebuilds Dhatu depletion in Prameha)", "Ashwagandha Churna (1 tsp warm water before bed)", "Gokshuradi Guggulu (2 tabs — kidney protection in diabetes)"],
      homeRemedies: ["**Jamun Seed Powder**: 1 tsp Jamun (Indian blackberry) seed powder in warm water every morning. Clinically validated classical anti-diabetic remedy.", "**Fenugreek Seed Water**: Soak 2 tsp methi seeds overnight. Drink water and eat seeds on empty stomach. Reduces post-meal glucose spikes.", "**Bitter Gourd Juice**: 30ml fresh bitter gourd (karela) juice daily in morning — the most classical Ayurvedic anti-diabetic herb.", "**Protocol**: Fixed meal times are non-negotiable for Vata diabetes. Eat every 4 hours. No fasting. Include protein and fat with every meal to prevent blood sugar crashes."],
      therapies: ["**Basti Karma (Oil Enema)**: Primary treatment for Vata-type Prameha — nourishes depleted Ojas and stabilises erratic Apana Vata controlling glucose absorption.", "**Abhyanga with Medicated Oils**: Nourishing oil massage reverses Vata depletion of tissues common in lean diabetes.", "**Nasya + Shirodhara**: Stabilises the neurogenic component of Vata diabetes — critical for preventing diabetic neuropathy.", "**Yoga Therapy**: Specific postures — Mandukasana, Paschimottanasana, and Dhanurasana — directly stimulate pancreatic function per classical texts."]
    },
    pitta: {
      diagnosis: "**Pitta-type Prameha (Inflammatory Diabetes with Liver Involvement)**: Excess Pitta in Rasa and Medas Dhatu causes inflammatory glucose metabolism issues — presenting with hot sensations, burning urination, skin infections, and liver dysfunction.",
      medicines: ["Arogyavardhini Vati (2 tabs twice daily — liver-metabolic corrector)", "Chandraprabha Vati (2 tabs twice daily)", "Neem Capsules (2 caps after meals — reduces blood sugar + skin infections)", "Guduchi Satwa (500mg — immunomodulator + glucose regulator)", "Triphala Churna (1 tsp bedtime — liver and bowel cleanse)"],
      homeRemedies: ["**Amla-Karela Juice**: Fresh Amla juice (30ml) + Karela juice (20ml) daily morning. Greatest classical anti-diabetic formula for Pitta type.", "**Turmeric-Neem Paste**: 1/4 tsp turmeric + neem powder + warm water to paste. Consume on empty stomach — powerfully purifies the Medas Dhatu.", "**Coriander Seed Infusion**: Soak 2 tsp coriander seeds in 2 cups water overnight. Drink strained water — helps the kidneys excrete Pitta-type excess glucose.", "**Protocol**: Avoid all sweet, sour, salty, and spicy foods. Eat bitter and astringent foods — bitter gourd, neem, fenugreek, coriander, and Amla are your best medicines."],
      therapies: ["**Virechana (Liver Pitta Shodhana)**: Primary treatment — monthly medicated purgation resets liver glucose regulation and clears inflammatory Pitta from Medas Dhatu.", "**Takradhara**: Cools systemic Pitta inflammation that drives insulin resistance.", "**Raktamokshana**: Blood purification — reduces inflammatory cytokines causing pancreatic beta-cell destruction in Pitta-type diabetes.", "**Cooling Yoga**: Gentle forward bends + Twists targeting liver and pancreas."]
    },
    kapha: {
      diagnosis: "**Kapha-type Prameha (Type-2 Obesity-related Diabetes)**: The classical and most common Ayurvedic Prameha — excess Kapha and Medas (fat tissue) blocking insulin receptor sensitivity, described by Charaka as the most treatable with aggressive Shodhana and Lekhana therapy.",
      medicines: ["Arogyavardhini Vati (2 tabs twice daily — primary Kapha-Medas corrector)", "Gudmar (Gymnema sylvestre) — 1g twice daily before meals", "Trikatu Churna (1/2 tsp before meals — ignites Agni, burns Medas)", "Triphala + Guggulu combination (classical Medohar formula)", "Shilajit + Guggulu combination (1 cap each daily — potent Prameha formula)"],
      homeRemedies: ["**Gurmar-Jamun-Karela Triple**: Mix equal parts Gurmar leaf powder + Jamun seed powder + Karela powder. Take 1 tsp mix with warm water before each meal. — The definitive classical anti-diabetic triple.", "**Barley Water Fast**: Replace all food with barley water one day weekly — classical Charaka Lekhana (scraping) therapy for Kapha-Medas Prameha.", "**Cinnamon Tea**: Boil 1 inch cinnamon stick in 2 cups water. Drink as morning tea. Reduces insulin resistance.", "**Protocol**: Walk 10,000 steps daily. Walk 30 min after every meal. No daytime sleep. One meal per day or intermittent fasting under guidance — mandatory for Kapha diabetes."],
      therapies: ["**Vamana + Virechana (Shodhana Sequence)**: Charaka's classical protocol for Kapha diabetes — first Vamana (emesis), then Virechana (purgation) to completely eliminate Kapha-Ama from the body.", "**Udvartana (Vigorous Dry Massage)**: Daily scraping dry massage with Triphala, Yava, and turmeric to physically break down subcutaneous fat (Medas) causing insulin resistance.", "**Lekhana Basti**: Scraping decoction enema — removes Ama from the colon-metabolic axis.", "**Vigorous Yoga**: Surya Namaskar (30 rounds daily) + Kapalbhati (20 min) + Utkatasana — physical Agni-burning programme."]
    }
  },

  weight: {
    vata: {
      diagnosis: "**Vata-type Weight Issue (Underweight/Krisha)**: Charaka describes Atyagni (hyper-metabolic fire) burning all Dhatus — leading to extreme thinness, inability to gain weight, and tissue depletion. Treatment is Brimhana (nourishing/building) Chikitsa.",
      medicines: ["Ashwagandha Churna (1 tsp with milk twice daily)", "Shatavari Churna (1 tsp with milk twice daily)", "Bala Churna (1 tsp with milk — builds muscle mass)", "Chyawanprash (2 tsp with milk twice daily)", "Amalaki Rasayana (1 tsp warm water daily)"],
      homeRemedies: ["**Brimhana Milk Rasayana**: Warm 1 glass milk + 10 soaked almonds (blended) + 5 soaked dates + 1 tsp ghee + 1 tsp Ashwagandha + 1 tsp Shatavari. Drink twice daily.", "**Urad Dal Khichdi**: Heavy, oily, warm urad dal khichdi with abundant ghee — the classical Brimhana meal for Vata tissue building.", "**Banana + Milk**: 2 ripe bananas blended with warm milk, 1 tsp ghee, and cardamom — classical Charaka Brimhana recipe for building Rasa and Shukra Dhatus.", "**Protocol**: Eat 6 small warm meals daily. Never skip meals. Sleep 8–9 hours. Avoid over-exercise. Do gentle Yoga only — intense exercise further depletes Vata."],
      therapies: ["**Brimhana Basti (Nourishing Oil Enema)**: The primary Panchakarma for Vata underweight — sesame oil or milk-based medicated enema builds deep tissue (Asthi and Shukra Dhatu).", "**Abhyanga with Heavy Oils**: Daily full-body massage with sesame or Mahanarayan Tailam — the fat-soluble minerals penetrate through skin and nourish depleted Dhatus.", "**Shirodhara + Nasya**: Nourishes the highest Dhatu (Majja/nerve tissue) which is always depleted in Vata underweight.", "**Yoga for Weight Gain**: Bhujangasana, Sarvangasana, and Viparita Karani — inversions and back bends that stimulate digestive fire and anabolic hormones."]
    },
    pitta: {
      diagnosis: "**Pitta-type Weight Issue (Inflammatory Abdominal Fat)**: Excess Pitta drives inflammatory cortisol cycles that accumulate Medas Dhatu specifically around the abdomen and liver. Charaka's approach: Pitta Shodhana + Medohar herbs.",
      medicines: ["Arogyavardhini Vati (2 tabs twice daily)", "Triphala Guggulu (2 tabs twice daily — Medohar formula)", "Chandraprabha Vati (2 tabs twice daily — fat metabolism)", "Brahmi (liver cooling — reduces cortisol-driven fat storage)", "Shatavari (hormone balancing + reduces Pitta-driven fat storage)"],
      homeRemedies: ["**Lemon-Ginger-Honey Morning Drink**: Warm water + lemon juice + 1 tsp raw honey + pinch ginger. Drink first thing — stimulates liver, clears Pitta-Medas.", "**Bitter Herbs Approach**: Make bitters infusion — Neem + Guduchi + Karela — powerful liver-Pitta and fat-burning herbs.", "**Intermittent Fasting (16:8)**: Classic Pitta approach — eat only between 10 AM and 6 PM. The liver Pitta burns fat most efficiently in the fasting window.", "**Protocol**: Eliminate alcohol, fried foods, red meat, and all sugar completely. These directly feed the Pitta-fat cycle."],
      therapies: ["**Virechana (Primary)**: Liver Pitta Shodhana — removes the root cause of inflammatory cortisol-driven fat storage. Recommended twice yearly.", "**Udvartana**: Vigorous dry massage over the abdomen — directly breaks down Pitta-Medas accumulation.", "**Yoga for Pitta Weight**: Twisting postures (Ardha Matsyendrasana), Navasana, Boat pose — target the liver and abdomen.", "**Cold-water Immersion**: Classical Pitta therapy — cold bath or swimming pacifies Pitta and reduces cortisol spikes."]
    },
    kapha: {
      diagnosis: "**Kapha-type Obesity (Sthaulya Roga)**: Charaka Samhita devotes an entire chapter to Atisthaulya (morbid obesity) as a Kapha disease — excess Medas Dhatu blocking all other Dhatu formation, slowing metabolism, and causing systemic disease. Most important to treat urgently.",
      medicines: ["Medohar Guggulu (2 tabs twice daily — primary Kapha fat-burning formula)", "Arogyavardhini Vati (2 tabs twice daily)", "Trikatu Churna (1 tsp before every meal)", "Triphala Churna (2 tsp warm water bedtime — overnight fat metabolism)", "Vidanga (Embelia ribes) — 500mg before meals — Medohar herb"],
      homeRemedies: ["**Triple Kapha Cutter Tea**: Boil 1 inch ginger + 1 tsp cumin + 5 black pepper + 1/4 tsp cinnamon in 3 cups water. Reduce to 1 cup. Drink three times daily — the classical Charaka Agni-boosting drink.", "**Honey-Lime Water (Only Warm)**: 1 tsp raw honey + 1/2 lemon + warm water. Drink on empty stomach and again before bed. Honey with warm water is described in classical texts as the only form that does not increase Kapha.", "**Barley as Staple**: Replace all rice with barley. Barley (Yava) is the single most recommended grain for Kapha weight in all classical texts.", "**Protocol: Daily Mandatory**: Wake 5:30 AM. 30-min intense cardio (running/skipping). No breakfast before 9 AM. No dinner after 6:30 PM. Zero daytime sleep. One cheat day per month only."],
      therapies: ["**Udvartana (Primary Treatment)**: Vigorous daily dry herbal powder massage — the primary classical Ayurvedic treatment for obesity. The friction and herbs dissolve Kapha-Medas directly through the skin.", "**Vamana + Virechana (Annual Shodhana)**: Charaka's prescribed annual cleanse for Sthaulya — twice yearly Panchakarma to prevent recurrence of Kapha obesity.", "**Lekhana Basti (Scraping Enema)**: Medicated decoction enema — scrapes accumulated Medas from the intestinal wall and lymphatics.", "**Hot Yoga + Sauna**: Daily exposure to heat — Pizhichil (oil bath) or sauna — liquefies Kapha-Medas making it available for metabolic burning."]
    }
  }
};

// Fallback shared treatments for categories without specific entries
const buildFallbackTreatment = (dosha, symptom) => ({
  diagnosis: `**${dosha.charAt(0).toUpperCase()+dosha.slice(1)}-type Imbalance**: Based on your responses, your primary Dosha imbalance is ${dosha.toUpperCase()}. Your symptoms (${symptom}) are caused by accumulation of ${dosha} in the body channels (Srotas), disrupting the normal flow of Prana and tissue nutrition.`,
  medicines: dosha === 'vata'
    ? ["Ashwagandha Churna (1 tsp warm milk nightly)", "Dashamoola Kadha (25ml twice daily)", "Yogaraj Guggulu (2 tabs twice daily)", "Chyawanprash (1 tsp morning)", "Brahmi Ghrita (1 tsp warm milk)"]
    : dosha === 'pitta'
    ? ["Neem Capsules (2 caps twice daily)", "Shatavari Churna (1 tsp cool milk twice daily)", "Triphala Churna (1 tsp bedtime)", "Guduchi Satwa (500mg twice daily)", "Praval Pishti (250mg twice daily)"]
    : ["Trikatu Churna (1/2 tsp before meals)", "Triphala Churna (1 tsp bedtime)", "Arogyavardhini Vati (2 tabs twice daily)", "Guggulu tablets (2 tabs after meals)", "Chyawanprash (1 tsp warm water morning)"],
  homeRemedies: dosha === 'vata'
    ? ["Warm sesame oil daily body massage", "Warm milk with Ashwagandha and nutmeg at bedtime", "Ginger-lemon water before meals", "Regular meal times — no skipping meals"]
    : dosha === 'pitta'
    ? ["Aloe vera juice (30ml) on empty stomach", "Cooling coriander-fennel tea twice daily", "Coconut water with fresh lime", "Avoid spicy, sour, and fried foods completely"]
    : ["Ginger-pepper-honey tea thrice daily", "Dry body brushing before shower", "Barley as staple grain", "One light fasting day per week"],
  therapies: dosha === 'vata'
    ? ["Shirodhara — warm oil on forehead", "Abhyanga full-body oil massage", "Basti (medicated oil enema)", "Nadi Shodhana Pranayama 20 min daily"]
    : dosha === 'pitta'
    ? ["Virechana — therapeutic purgation", "Takra Shirodhara — buttermilk dhara", "Sheetali Pranayama 15 min daily", "Cooling Yoga — forward bends"]
    : ["Vamana — therapeutic emesis", "Udvartana — dry herb powder massage", "Nasya with sharp herbs", "Kapalabhati 20 min daily"]
});

// Ensure all categories have treatment data
['womenshealth', 'heart', 'organhealth', 'general'].forEach(cat => {
  if (!treatments[cat]) {
    treatments[cat] = {
      vata: buildFallbackTreatment('vata', 'general complaint'),
      pitta: buildFallbackTreatment('pitta', 'general complaint'),
      kapha: buildFallbackTreatment('kapha', 'general complaint')
    };
  }
});

// Localization definitions
const categoryQuestionsLocalized = {
  en: categoryQuestions,
  hi: {
    skin: [
      { q: "**Q1 — त्वचा का प्रकार और बनावट**: आप अपनी त्वचा का वर्णन कैसे करेंगे?", opts: [
        { k:"A", t:"रूखी, खुरदरी, पपड़ीदार या आसानी से फटने वाली", s:"vata" },
        { k:"B", t:"तैलीय, संवेदनशील, लालिमा या मुंहासे वाली", s:"pitta" },
        { k:"C", t:"मोटी, नम, चिपचिपी या बड़े रोमछिद्रों वाली", s:"kapha" }
      ]},
      { q: "**Q2 — मुंहासे/त्वचा की समस्या कब बढ़ती है?**: आपकी त्वचा की समस्या कब गंभीर होती है?", opts: [
        { k:"A", t:"शुष्क मौसम, सर्दियों में या तनाव और खराब नींद के दौरान", s:"vata" },
        { k:"B", t:"गर्मियों में, मसालेदार/तैलीय भोजन के बाद या धूप में", s:"pitta" },
        { k:"C", t:"उमस या बारिश के मौसम में अथवा डेयरी/मीठा खाने के बाद", s:"kapha" }
      ]},
      { q: "**Q3 — त्वचा के निशान और रंग**: आपकी मुख्य चिंता किससे मेल खाती है?", opts: [
        { k:"A", t:"काले धब्बे, हाइपरपिग्मेंटेशन या त्वचा का रंग बदलना", s:"vata" },
        { k:"B", t:"लाल और सूजन वाले दाने, मुंहासे या मवाद से भरे फुंसी", s:"pitta" },
        { k:"C", t:"व्हाइटहेड्स, ब्लैकहेड्स या बढ़े हुए रोमछिद्र", s:"kapha" }
      ]},
      { q: "**Q4 — पाचन क्रिया का प्रभाव**: आपकी पाचन स्थिति कैसी रहती है?", opts: [
        { k:"A", t:"अनियमित, गैस या कब्ज के साथ त्वचा की समस्या बढ़ना", s:"vata" },
        { k:"B", t:"एसिडिटी, जलन या मसालेदार भोजन खाने से त्वचा पर दाने निकलना", s:"pitta" },
        { k:"C", t:"धीमा या भारी पाचन, डेयरी उत्पाद खाने से त्वचा का तैलीय होना", s:"kapha" }
      ]},
      { q: "**Q5 — नींद और जीवनशैली**: आपकी नींद और दिनचर्या कैसी है?", opts: [
        { k:"A", t:"अनियमित नींद, देर रात तक जागना और तनाव", s:"vata" },
        { k:"B", t:"सामान्य नींद लेकिन शरीर में गर्मी और पसीना आना, काम का दबाव", s:"pitta" },
        { k:"C", t:"अत्यधिक नींद, सुबह आलस महसूस होना और सुस्ती", s:"kapha" }
      ]},
      { q: "**Q6 — पानी और शरीर में नमी**: आप रोजाना कितना पानी पीते हैं?", opts: [
        { k:"A", t:"1.5 लीटर से कम, अक्सर पानी पीना भूल जाना", s:"vata" },
        { k:"B", t:"खूब पानी पीना लेकिन फिर भी शरीर में गर्मी और प्यास लगना", s:"pitta" },
        { k:"C", t:"मध्यम पानी पीना लेकिन फिर भी त्वचा तैलीय या चिपचिपी रहना", s:"kapha" }
      ]},
      { q: "**Q7 — मानसिक/भावनात्मक स्थिति**: कौन सी भावना आपकी त्वचा को सबसे ज्यादा प्रभावित करती है?", opts: [
        { k:"A", t:"चिंता, घबराहट या अधिक सोचना (त्वचा में सूखापन/काले धब्बे बढ़ना)", s:"vata" },
        { k:"B", t:"क्रोध, चिड़चिड़ापन या गुस्सा आना (मुंहासे/लालिमा बढ़ना)", s:"pitta" },
        { k:"C", t:"उदास रहना या किसी बात से अत्यधिक लगाव होना (तैलीयपन/त्वचा में सूजन)", s:"kapha" }
      ]}
    ],
    hair: [
      { q: "**Q1 — बाल झड़ने का प्रकार**: अपनी बालों की समस्या का वर्णन करें:", opts: [
        { k:"A", t:"पूरे सिर से बाल झड़ना, बाल रूखे और बेजान होना", s:"vata" },
        { k:"B", t:"जलन, खुजली, सिर की त्वचा का लाल होना या बालों का असमय सफेद होना", s:"pitta" },
        { k:"C", t:"रूसी (डैंड्रफ), तैलीय सिर, धीमा विकास या गुच्छों में बाल गिरना", s:"kapha" }
      ]},
      { q: "**Q2 — सिर की त्वचा (Scalp) की स्थिति**: आपका स्कैल्प कैसा महसूस होता है?", opts: [
        { k:"A", t:"रूखा, पपड़ीदार, खुजली वाला जो ठंड या हवा में बढ़ जाता है", s:"vata" },
        { k:"B", t:"गर्म, जलनयुक्त, लालिमा या फुंसियों के साथ", s:"pitta" },
        { k:"C", t:"तैलीय, भारी, सफेद या पीले रंग की डैंड्रफ फ्लेक्स के साथ", s:"kapha" }
      ]},
      { q: "**Q3 — खान-पान का प्रभाव**: किस तरह का भोजन आपके बाल झड़ने को बढ़ाता है?", opts: [
        { k:"A", t:"अनियमित भोजन करना, भोजन छोड़ना या ठंडा और रूखा खाना", s:"vata" },
        { k:"B", t:"मसालेदार, खट्टा, फर्मेंटेड या तला-भुना खाना", s:"pitta" },
        { k:"C", t:"भारी डेयरी उत्पाद, मीठा या मैदे से बने खाद्य पदार्थ", s:"kapha" }
      ]},
      { q: "**Q4 — तनाव और बाल**: तनाव आपके बालों को कैसे प्रभावित करता है?", opts: [
        { k:"A", t:"चिंता या जीवन में अचानक आए बदलावों के दौरान बाल तेजी से गिरना", s:"vata" },
        { k:"B", t:"काम के दबाव या समय सीमा (Deadlines) के दौरान लगातार बाल गिरना", s:"pitta" },
        { k:"C", t:"धीमी और निरंतर गति से बाल गिरना, तनाव का बहुत अधिक प्रभाव न होना", s:"kapha" }
      ]},
      { q: "**Q5 — बाल झड़ने से पहले बालों की बनावट**: आपके प्राकृतिक बाल पहले कैसे थे?", opts: [
        { k:"A", t:"प्राकृतिक रूप से सूखे, घुंघराले, पतले या जल्दी टूटने वाले", s:"vata" },
        { k:"B", t:"बारीक, सीधे और रेशमी - अब तेजी से पतले हो रहे हैं", s:"pitta" },
        { k:"C", t:"घने, घुंघराले और मजबूत - अब तैलीय और बेजान हो रहे हैं", s:"kapha" }
      ]},
      { q: "**Q6 — नींद और स्वास्थ्य लाभ**: आपकी रात की नींद कैसी है?", opts: [
        { k:"A", t:"हल्की और खंडित नींद; सुबह मुंह सूखना और थकान महसूस होना", s:"vata" },
        { k:"B", t:"मध्यम नींद लेकिन शरीर में गर्मी या सिरदर्द महसूस होना", s:"pitta" },
        { k:"C", t:"गहरी नींद लेकिन सुबह उठने पर भारीपन और सुस्ती महसूस होना", s:"kapha" }
      ]},
      { q: "**Q7 — जठराग्नि (पाचन अग्नि)**: आपकी भूख और पाचन कैसा है?", opts: [
        { k:"A", t:"परिवर्तनशील — कभी बहुत तेज भूख, कभी बिल्कुल नहीं; गैस और पेट फूलना", s:"vata" },
        { k:"B", t:"तीव्र — बहुत तेज भूख लगना, लेकिन एसिडिटी या दस्त होना", s:"pitta" },
        { k:"C", t:"मंद — भूख बहुत कम लगना, भोजन के लंबे समय बाद तक पेट भारी रहना", s:"kapha" }
      ]}
    ],
    digestion: [
      { q: "**Q1 — मुख्य पाचन समस्या**: आपको सबसे ज्यादा क्या परेशान करता है?", opts: [
        { k:"A", t:"पेट फूलना, गैस, डकार, कब्ज या अनियमित मल विसर्जन", s:"vata" },
        { k:"B", t:"एसिडिटी, सीने में जलन, पेट में घाव/अल्सर का दर्द या खट्टी डकारें", s:"pitta" },
        { k:"C", t:"धीमा पाचन, भोजन के बाद भारीपन या मल में चिपचिपाहट/कफ होना", s:"kapha" }
      ]},
      { q: "**Q2 — भूख का पैटर्न (अग्नि परीक्षण)**: आपकी भूख कैसी है?", opts: [
        { k:"A", t:"अनियमित — कभी बहुत तेज भूख लगना, तो कभी बिल्कुल भूख न लगना", s:"vata" },
        { k:"B", t:"हमेशा तेज भूख लगना; भोजन में देरी होने पर सिरदर्द या चिड़चिड़ापन", s:"pitta" },
        { k:"C", t:"कम भूख लगना; भोजन के बिना भी कई घंटों तक पेट भरा महसूस होना", s:"kapha" }
      ]},
      { q: "**Q3 — मल का विश्लेषण**: आपका मल विसर्जन कैसा रहता है?", opts: [
        { k:"A", t:"सूखा, कड़ा, गांठदार या दर्दनाक कब्ज - कई बार दिन छूट जाना", s:"vata" },
        { k:"B", t:"ढीला, पीला या जलनयुक्त - दिन में दो से अधिक बार होना", s:"pitta" },
        { k:"C", t:"चिपचिपाहट, कफ/बलगम युक्त या बहुत धीमी गति से होने वाला", s:"kapha" }
      ]},
      { q: "**Q4 — नुकसानदेह भोजन**: किस तरह का भोजन आपकी समस्या को बढ़ाता है?", opts: [
        { k:"A", t:"कच्चा सलाद, दालें, चना, ब्रोकली या ठंडे पेय पदार्थ", s:"vata" },
        { k:"B", t:"तीखी मिर्च, टमाटर, सिरका, चाय/कॉफी या गर्म मसाले", s:"pitta" },
        { k:"C", t:"तला-भुना खाना, आइसक्रीम, मैदा, मिठाई या भारी भोजन", s:"kapha" }
      ]},
      { q: "**Q5 — समय का प्रभाव**: आपके लक्षण किस समय सबसे अधिक बढ़ते हैं?", opts: [
        { k:"A", t:"शाम या रात के समय — विशेष रूप से सर्दियों में या सूर्यास्त के बाद", s:"vata" },
        { k:"B", t:"दोपहर या आधी रात को — गर्मियों के मौसम में या भोजन के तुरंत बाद", s:"pitta" },
        { k:"C", t:"सुबह सोकर उठने के तुरंत बाद या नाश्ते के 1 घंटे के भीतर", s:"kapha" }
      ]},
      { q: "**Q6 — अन्य संबंधित लक्षण**: पाचन समस्या के साथ आपको और क्या महसूस होता है?", opts: [
        { k:"A", t:"घबराहट, कमर दर्द, त्वचा का सूखापन या अनिद्रा", s:"vata" },
        { k:"B", t:"त्वचा पर लाल चकत्ते, चिड़चिड़ापन या आंखों में जलन", s:"pitta" },
        { k:"C", t:"वजन बढ़ना, कफ/बलगम, अत्यधिक थकान या सुस्ती", s:"kapha" }
      ]},
      { q: "**Q7 — पेट की आवाज और गैस**: पेट से आने वाली आवाजों का वर्णन करें:", opts: [
        { k:"A", t:"पेट में गुड़गुड़ाहट की तेज आवाज होना और बार-बार गैस बनना", s:"vata" },
        { k:"B", t:"गर्म, दुर्गंधयुक्त गैस या मुंह का स्वाद कड़वा/खट्टा होना", s:"pitta" },
        { k:"C", t:"गैस कम बनना लेकिन पेट में हमेशा भारीपन और जकड़न महसूस होना", s:"kapha" }
      ]}
    ],
    joints: [
      { q: "**Q1 — जोड़ों के दर्द का प्रकार**: आपके जोड़ों के दर्द की स्थिति कैसी है?", opts: [
        { k:"A", t:"बदलता रहने वाला दर्द — एक जोड़ से दूसरे में जाना, ठंड में बढ़ना", s:"vata" },
        { k:"B", t:"जलन, जोड़ों का गर्म और लाल होना, गर्मियों में गंभीर होना", s:"pitta" },
        { k:"C", t:"धीमा, भारी दर्द, जोड़ों में सूजन, गीले/बरसाती मौसम में बढ़ना", s:"kapha" }
      ]},
      { q: "**Q2 — सुबह की अकड़न**: सुबह उठने पर आपको कितनी अकड़न महसूस होती है?", opts: [
        { k:"A", t:"उठने पर बहुत अधिक अकड़न और जोड़ों में कटकट की आवाज, 15 मिनट में ठीक होना", s:"vata" },
        { k:"B", t:"सुबह जोड़ों में कोमलता और गर्माहट महसूस होना - ठंडी सिकाई से आराम", s:"pitta" },
        { k:"C", t:"30-60 मिनट तक भारी अकड़न; जोड़ों में सूजन और हिलने-डुलने में कठिनाई", s:"kapha" }
      ]},
      { q: "**Q3 — बढ़ाने वाले कारक**: आपकी समस्या को कौन सी चीजें बदतर बनाती हैं?", opts: [
        { k:"A", t:"ठंड का मौसम, तेज हवा, उपवास, अनियमित भोजन या यात्रा", s:"vata" },
        { k:"B", t:"गर्मी, धूप, तीखा भोजन, चाय/कॉफी या शराब", s:"pitta" },
        { k:"C", t:"ठंडा और नम मौसम, भारी भोजन, शारीरिक निष्क्रियता या अधिक सोना", s:"kapha" }
      ]},
      { q: "**Q4 — जोड़ों से आवाज**: क्या आपके जोड़ों से आवाज आती है?", opts: [
        { k:"A", t:"हाँ — हिलने-डुलने पर जोड़ों से कटकट या चटकने की लगातार आवाजें", s:"vata" },
        { k:"B", t:"कभी-कभी हल्की आवाज और साथ में जोड़ों में जलन", s:"pitta" },
        { k:"C", t:"कोई आवाज नहीं लेकिन भारीपन, सूजन और हिलने-डुलने में असमर्थता", s:"kapha" }
      ]},
      { q: "**Q5 — गठिया का प्रकार (यदि ज्ञात हो)**: आपकी स्थिति किससे मेल खाती है?", opts: [
        { k:"A", t:"ऑस्टियोआर्थराइटिस (हड्डियों का घिसना) या वात का पुराना दर्द", s:"vata" },
        { k:"B", t:"रुमेटॉइड आर्थराइटिस, सोरियाटिक गठिया या यूरिक एसिड (गाउट)", s:"pitta" },
        { k:"C", t:"जोड़ों में पानी भरना (Fluid Retention) या फाइब्रोमायल्गिया", s:"kapha" }
      ]},
      { q: "**Q6 — पेट और पाचन संबंध**: क्या जोड़ों के दर्द के साथ पेट की समस्या भी है?", opts: [
        { k:"A", t:"कब्ज, गैस या पेट फूलने के बाद जोड़ों का दर्द बढ़ जाता है", s:"vata" },
        { k:"B", t:"एसिडिटी, दस्त या त्वचा पर चकत्ते होना", s:"pitta" },
        { k:"C", t:"मल में आंव/बलगम आना, कब्ज या वजन बढ़ना", s:"kapha" }
      ]},
      { q: "**Q7 — आम (विषाक्त पदार्थ) का स्तर**: क्या आपको ये लक्षण महसूस होते हैं?", opts: [
        { k:"A", t:"जीभ पर हल्की परत, सूखी त्वचा, हाथ-पैर ठंडे रहना", s:"vata" },
        { k:"B", t:"जीभ पर पीली परत, त्वचा में लालिमा या पसीने में दुर्गंध", s:"pitta" },
        { k:"C", t:"जीभ पर मोटी सफेद परत, बलगम बनना, अत्यधिक थकान और आलस", s:"kapha" }
      ]}
    ],
    sleep: [
      { q: "**Q1 — नींद की समस्या का प्रकार**: आपकी मुख्य समस्या क्या है?", opts: [
        { k:"A", t:"नींद न आना — दिमाग का बहुत सक्रिय या चिंतित होना", s:"vata" },
        { k:"B", t:"नींद आ जाना लेकिन रात में 2-3 बजे आंख खुलना और फिर नींद न आना", s:"pitta" },
        { k:"C", t:"बहुत अधिक सोना लेकिन सुबह उठने पर थकान, भारीपन और सुस्ती रहना", s:"kapha" }
      ]},
      { q: "**Q2 — सपनों का प्रकार**: आपके सपने कैसे होते हैं?", opts: [
        { k:"A", t:"बहुत स्पष्ट, डरावने, उड़ने या गिरने वाले अथवा बेचैन करने वाले", s:"vata" },
        { k:"B", t:"तीव्र, हिंसक, प्रतिस्पर्धी या उत्तेजना वाले सपने", s:"pitta" },
        { k:"C", t:"गहरी और सपने रहित नींद या शांत, खुशनुमा सपने", s:"kapha" }
      ]},
      { q: "**Q3 — सोते समय शरीर की स्थिति**: सोते समय आपका शरीर कैसा महसूस होता है?", opts: [
        { k:"A", t:"हाथ-पैर ठंडे होना, मुंह सूखना या शरीर में झटके लगना", s:"vata" },
        { k:"B", t:"गर्मी या पसीना आना; ठंडे तकिये या ठंडे कमरे की जरूरत महसूस होना", s:"pitta" },
        { k:"C", t:"रात 9 बजे तक भारीपन और नींद आना लेकिन सुबह उठने में कठिनाई", s:"kapha" }
      ]},
      { q: "**Q4 — जागने का कारण**: आपकी नींद किस वजह से खुलती या टूटती है?", opts: [
        { k:"A", t:"चिंताजनक विचार, हल्की सी आवाज के प्रति संवेदनशीलता", s:"vata" },
        { k:"B", t:"एसिडिटी/सीने में जलन, गुस्सा या पुरानी बातों का बार-बार याद आना", s:"pitta" },
        { k:"C", t:"सांस लेने में कठिनाई, खर्राटे या भारीपन महसूस होना", s:"kapha" }
      ]},
      { q: "**Q5 — अगले दिन का प्रभाव**: कम नींद के कारण अगले दिन कैसा महसूस होता है?", opts: [
        { k:"A", t:"दिमाग खाली रहना, ध्यान केंद्रित न होना, घबराहट या बेचैनी", s:"vata" },
        { k:"B", t:"चिड़चिड़ापन, जल्दी गुस्सा आना, सिरदर्द या आंखों में जलन", s:"pitta" },
        { k:"C", t:"शरीर में भारीपन, चेहरे पर सूजन, मीठा या कार्बोहाइड्रेट खाने की इच्छा", s:"kapha" }
      ]},
      { q: "**Q6 — रात की दिनचर्या**: आप सोने से पहले आमतौर पर क्या करते हैं?", opts: [
        { k:"A", t:"मोबाइल/टीवी देखना, सोशल मीडिया का उपयोग या देर रात तक जागना", s:"vata" },
        { k:"B", t:"देर रात तक काम करना, बहस करना या चाय/कॉफी का सेवन", s:"pitta" },
        { k:"C", t:"सोफे पर लेटे हुए टीवी देखना, भारी डिनर करना या शाम को सो जाना", s:"kapha" }
      ]},
      { q: "**Q7 — समस्या की अवधि**: यह नींद की समस्या कब से है?", opts: [
        { k:"A", t:"आती-जाती रहती है — तनाव, यात्रा या बदलावों से जुड़ी है", s:"vata" },
        { k:"B", t:"लगातार बनी हुई है — विशेष रूप से काम के दबाव के दौरान", s:"pitta" },
        { k:"C", t:"पुरानी समस्या है — सालों से है; हमेशा से भारीपन और सुस्ती महसूस होती है", s:"kapha" }
      ]}
    ],
    general: [
      { q: "**Q1 — मुख्य चिंता**: आपकी प्राथमिक स्वास्थ्य समस्या क्या है?", opts: [
        { k:"A", t:"दर्द, सूखापन, घबराहट, कब्ज या ऊर्जा में उतार-चढ़ाव", s:"vata" },
        { k:"B", t:"सूजन, एसिडिटी, गर्मी लगना, त्वचा के चकत्ते या चिड़चिड़ापन", s:"pitta" },
        { k:"C", t:"वजन बढ़ना, बलगम, सुस्ती, अत्यधिक नींद या भारीपन", s:"kapha" }
      ]},
      { q: "**Q2 — मौसम के प्रति संवेदनशीलता**: कौन सा मौसम आपकी समस्या को बढ़ाता है?", opts: [
        { k:"A", t:"ठंडा, शुष्क या हवादार मौसम — पतझड़ या शुरुआती सर्दियाँ", s:"vata" },
        { k:"B", t:"गर्म और उमस भरी गर्मी या उष्णकटिबंधीय मौसम", s:"pitta" },
        { k:"C", t:"ठंडा, नम, बरसाती मौसम या वसंत ऋतु की शुरुआत", s:"kapha" }
      ]},
      { q: "**Q3 — पाचन क्रिया का प्रकार (अग्नि)**: आपकी पाचन स्थिति कैसी है?", opts: [
        { k:"A", t:"अनियमित — पेट फूलना, गैस, कब्ज और दस्त का बारी-बारी से होना", s:"vata" },
        { k:"B", t:"अत्यधिक तीव्र — एसिडिटी, सीने में जलन, ढीला मल या अपच", s:"pitta" },
        { k:"C", t:"धीमी — कम भूख लगना, पेट में भारीपन या मल में चिपचिपाहट", s:"kapha" }
      ]},
      { q: "**Q4 — नींद की गुणवत्ता**: आप कैसे सोते हैं?", opts: [
        { k:"A", t:"हल्की नींद, बार-बार टूटने वाली, डरावने या बेचैन करने वाले सपने", s:"vata" },
        { k:"B", t:"सामान्य नींद लेकिन रात में 2-3 बजे टूटना, शरीर गर्म होना", s:"pitta" },
        { k:"C", t:"गहरी और लंबी नींद लेकिन उठने के बाद थकान और भारीपन रहना", s:"kapha" }
      ]},
      { q: "**Q5 — त्वचा और जीभ**: आपकी त्वचा और जीभ की स्थिति कैसी है?", opts: [
        { k:"A", t:"सूखी त्वचा, पतला शरीर, फटे होंठ या जीभ पर पतली ग्रे परत", s:"vata" },
        { k:"B", t:"तैलीय त्वचा, लाल रंगत या जीभ पर पीली परत", s:"pitta" },
        { k:"C", t:"मोटी तैलीय त्वचा, पीलापन या जीभ पर सफेद मोटी परत", s:"kapha" }
      ]},
      { q: "**Q6 — तनाव में प्रतिक्रिया**: दबाव में आप कैसा व्यवहार करते हैं?", opts: [
        { k:"A", t:"घबरा जाना, काम भूलना, दिल की धड़कन तेज होना", s:"vata" },
        { k:"B", t:"क्रोधित होना, आलोचना करना, चिड़चिड़ा होना या सिरदर्द होना", s:"pitta" },
        { k:"C", t:"चुप हो जाना, अधिक खाना, टालमटोल करना या उदास होना", s:"kapha" }
      ]},
      { q: "**Q7 — नाड़ी और जीवन शक्ति**: आपकी नाड़ी की गति कैसी महसूस होती है?", opts: [
        { k:"A", t:"अनियमित, तेज और पतली — सांप की टेढ़ी-मेढ़ी चाल की तरह", s:"vata" },
        { k:"B", t:"मध्यम, तेज और उछलती हुई — मेंढक की छलांग की तरह", s:"pitta" },
        { k:"C", t:"धीमी, गहरी और स्थिर — हंस के तैरने की तरह", s:"kapha" }
      ]}
    ]
  },
  mr: {
    skin: [
      { q: "**Q1 — त्वचेचा प्रकार आणि पोत**: तुम्ही तुमच्या त्वचेचे वर्णन कसे कराल?", opts: [
        { k:"A", t:"कोरडी, खडबडीत, पापुद्रे येणारी किंवा लवकर चिरडणारी त्वचा", s:"vata" },
        { k:"B", t:"तेलकट, संवेदनशील, लालसरपणा, पुरळ किंवा जळजळ होण्याची प्रवृत्ती असलेली त्वचा", s:"pitta" },
        { k:"C", t:"जाड, ओलसर, चिकट किंवा मोठ्या छिद्रांची आणि ब्लॅकहेड्सची प्रवृत्ती असलेली त्वचा", s:"kapha" }
      ]},
      { q: "**Q2 — पुरळ / त्वचा समस्या कधी वाढते?**: तुमची त्वचा समस्या कधी तीव्र होते?", opts: [
        { k:"A", t:"कोरड्या हवामानात, हिवाळ्यात किंवा ताणतणाव आणि अपुऱ्या झोपेमुळे", s:"vata" },
        { k:"B", t:"उन्हाळ्यात, तिखट/तेलकट जेवणानंतर किंवा उन्हात गेल्यानंतर", s:"pitta" },
        { k:"C", t:"दमट किंवा पावसाळी हवामानात किंवा दुग्धजन्य पदार्थ/गोड खाल्ल्यानंतर", s:"kapha" }
      ]},
      { q: "**Q3 — त्वचेचे डाग आणि रंग**: तुमची मुख्य काळजी कशाशी जुळते?", opts: [
        { k:"A", t:"काळे डाग, हायपरपिग्मेंटेशन या त्वचेचा रंग बदलणे", s:"vata" },
        { k:"B", t:"लाल आणि सूजलेले पुरळ, मुरुम किंवा पुवाने भरलेले फोड", s:"pitta" },
        { k:"C", t:"व्हाईटहेड्स, ब्लॅकहेड्स किंवा मोठी झालेली छिद्रे", s:"kapha" }
      ]},
      { q: "**Q4 — पचनाचा प्रभाव**: तुमची पचन स्थिती कशी असते?", opts: [
        { k:"A", t:"अनियमित, गॅस किंवा बद्धकोष्ठतेसह त्वचेची समस्या वाढणे", s:"vata" },
        { k:"B", t:"ॲसिडिटी, जळजळ किंवा तिखट अन्न खाल्ल्याने त्वचेवर पुरळ येणे", s:"pitta" },
        { k:"C", t:"मंथ किंवा जड पचन, दुग्धजन्य पदार्थांमुळे त्वचा तेलकट होणे", s:"kapha" }
      ]},
      { q: "**Q5 — झोप आणि जीवनशैली**: तुमची झोप आणि दिनचर्या कशी आहे?", opts: [
        { k:"A", t:"अनियमित झोप, रात्री उशिरापर्यंत जागणे आणि मानसिक ताण", s:"vata" },
        { k:"B", t:"सामान्य झोप पण शरीरात उष्णता आणि घाम येणे, कामाचा ताण", s:"pitta" },
        { k:"C", t:"अति झोप, सकाळी उठल्यावर आळस आणि जडपणा जाणवणे", s:"kapha" }
      ]},
      { q: "**Q6 — पाणी आणि शरीरातील ओलावा**: तुम्ही दररोज किती पाणी पिता?", opts: [
        { k:"A", t:"१.५ लिटरपेक्षा कमी, वारंवार पाणी पिण्यास विसरणे", s:"vata" },
        { k:"B", t:"भरपूर पाणी पिणे पण तरीही शरीरात उष्णता आणि तहान लागणे", s:"pitta" },
        { k:"C", t:"मध्यम पाणी पिणे पण तरीही त्वचा तेलकट किंवा चिकट राहणे", s:"kapha" }
      ]},
      { q: "**Q7 — मानसिक/भावनिक स्थिती**: कोणती भावना तुमच्या त्वचेला सर्वाधिक प्रभावित करते?", opts: [
        { k:"A", t:"काळजी, घबराट किंवा अतिविचार (त्वचेत कोरडेपणा/काळे डाग वाढणे)", s:"vata" },
        { k:"B", t:"राग, चिडचिड किंवा राग येणे (मुरुम/लालसरपणा वाढणे)", s:"pitta" },
        { k:"C", t:"उदास राहणे किंवा अति लगाव असणे (तेलकटपणा/त्वचेवर सूज येणे)", s:"kapha" }
      ]}
    ],
    hair: [
      { q: "**Q1 — केस गळण्याचा प्रकार**: तुमच्या केसांच्या समस्येचे वर्णन करा:", opts: [
        { k:"A", t:"पूर्ण डोक्याचे केस गळणे, केस कोरडे आणि निर्जीव होणे", s:"vata" },
        { k:"B", t:"जळजळ, खाज, डोक्याची त्वचा लाल होणे किंवा केस अकाली पांढरे होणे", s:"pitta" },
        { k:"C", t:"कोंडा (डँड्रफ), तेलकट टाळू, संथ वाढ किंवा गुच्छांमध्ये केस पडणे", s:"kapha" }
      ]},
      { q: "**Q2 — टाळूची (Scalp) स्थिती**: तुमचा स्कैल्प कसा जाणवतो?", opts: [
        { k:"A", t:"कोरडा, पापुद्रे असलेला, खाज सुटणारा जो थंडी किंवा वाऱ्यात वाढतो", s:"vata" },
        { k:"B", t:"गरम, जळजळ असलेला, लालसरपणा किंवा पुरळ असलेला", s:"pitta" },
        { k:"C", t:"तेलकट, जड, पांढरा किंवा पिवळ्या रंगाचा कोंडा सह", s:"kapha" }
      ]},
      { q: "**Q3 — खाण्यापिण्याचा प्रभाव**: कोणत्या प्रकारचे अन्न तुमचे केस गळणे वाढवते?", opts: [
        { k:"A", t:"अनियमित जेवण करणे, जेवण न करणे किंवा थंड आणि कोरडे अन्न खाणे", s:"vata" },
        { k:"B", t:"तिखट, आंबट, फरमेंट केलेले किंवा तळलेले अन्न खाणे", s:"pitta" },
        { k:"C", t:"जड दुग्धजन्य पदार्थ, गोड किंवा मैद्याचे अन्नपदार्थ", s:"kapha" }
      ]},
      { q: "**Q4 — ताणतणाव आणि केस**: ताणतणाव तुमच्या केसांवर कसा परिणाम करतो?", opts: [
        { k:"A", t:"चिंता किंवा जीवनातील अचानक बदलांदरम्यान केस वेगाने गळणे", s:"vata" },
        { k:"B", t:"कामाचा ताण किंवा वेळेच्या मर्यादेत सतत केस गळणे", s:"pitta" },
        { k:"C", t:"हळूवार आणि सतत गळणे, ताणतणावाचा फारसा प्रभाव नसणे", s:"kapha" }
      ]},
      { q: "**Q5 — केस गळण्यापूर्वी केसांचा पोत**: तुमचे नैसर्गिक केस आधी कसे होते?", opts: [
        { k:"A", t:"नैसर्गिकरित्या कोरडे, कुरळे, पातळ किंवा लवकर तुटणारे", s:"vata" },
        { k:"B", t:"बारीक, सरळ आणि रेशमी - आता वेगाने पातळ होत आहेत", s:"pitta" },
        { k:"C", t:"दाट, कुरळे आणि मजबूत - आता तेलकट आणि निर्जीव होत आहेत", s:"kapha" }
      ]},
      { q: "**Q6 — झोप आणि आरोग्य लाभ**: तुमची रात्रीची झोप कशी आहे?", opts: [
        { k:"A", t:"हलकी आणि खंडित झोप; सकाळी तोंड सुकणे आणि थकवा जाणवणे", s:"vata" },
        { k:"B", t:"मध्यम झोप पण शरीरात उष्णता किंवा डोकेदुखी जाणवणे", s:"pitta" },
        { k:"C", t:"खोल झोप पण सकाळी उठल्यावर जडपणा आणि आळस जाणवणे", s:"kapha" }
      ]},
      { q: "**Q7 — जठराग्नी (पचन अग्नी)**: तुमची भूक आणि पचन कसे आहे?", opts: [
        { k:"A", t:"बदलणारी भूक — कधी खूप जास्त, कधी अजिबात नाही; गॅस आणि पोट फुगणे", s:"vata" },
        { k:"B", t:"तीव्र — खूप भूक लागणे, पण ॲसिडिटी किंवा जुलाब होणे", s:"pitta" },
        { k:"C", t:"मंद — भूक कमी लागणे, जेवणानंतर खूप वेळ पेट जड राहणे", s:"kapha" }
      ]}
    ],
    digestion: [
      { q: "**Q1 — मुख्य पचन समस्या**: तुम्हाला सर्वात जास्त काय त्रास देते?", opts: [
        { k:"A", t:"पोट फुगणे, गॅस, ढेकर, बद्धकोष्ठता किंवा अनियमित शौच होणे", s:"vata" },
        { k:"B", t:"ॲसिडिटी, छातीत जळजळ, पोटात अल्सरचे दुखणे किंवा आंबट ढेकर येणे", s:"pitta" },
        { k:"C", t:"मंद पचन, जेवणानंतर जडपणा किंवा शौचात चिकटपणा/कफ असणे", s:"kapha" }
      ]},
      { q: "**Q2 — भूकेचे प्रमाण (अग्नि परीक्षा)**: तुमची भूक कशी आहे?", opts: [
        { k:"A", t:"अनियमित — कधी खूप भूक लागणे, तर कधी अजिबात न लागणे", s:"vata" },
        { k:"B", t:"नेहमी तीव्र भूक लागणे; जेवणास उशीर झाल्यास डोकेदुखी किंवा चिडचिड", s:"pitta" },
        { k:"C", t:"कमी भूक लागणे; जेवणाशिवायही तासनतास पोट भरलेले वाटणे", s:"kapha" }
      ]},
      { q: "**Q3 — शौचाचे विश्लेषण**: तुमचे शौच कसे होते?", opts: [
        { k:"A", t:"कोरडे, कडक, खड्यांसारखे किंवा वेदनादायक बद्धकोष्ठता - काही दिवस न होणे", s:"vata" },
        { k:"B", t:"पातळ, पिवळे किंवा जळजळ असलेले - दिवसातून दोनपेक्षा जास्त वेळा होणे", s:"pitta" },
        { k:"C", t:"चिकट, कफ/बलगम असलेले किंवा खूप संथ गतीने होणारे", s:"kapha" }
      ]},
      { q: "**Q4 — अपायकारक अन्न**: कोणत्या प्रकारचे अन्न तुमची समस्या वाढवते?", opts: [
        { k:"A", t:"कच्चा सॅलड, डाळी, हरभरा, ब्रोकोली किंवा थंड पेये", s:"vata" },
        { k:"B", t:"तिखट मिरच्या, टोमॅटो, व्हिनेगर, चहा/कॉफी किंवा गरम मसाले", s:"pitta" },
        { k:"C", t:"तळलेले अन्न, आईस्क्रीम, मैदा, मिठाई किंवा जड जेवण", s:"kapha" }
      ]},
      { q: "**Q5 — वेळेचा प्रभाव**: तुमची लक्षणे कोणत्या वेळी सर्वात जास्त वाढतात?", opts: [
        { k:"A", t:"संध्याकाळी किंवा रात्रीच्या वेळी — विशेषतः हिवाळ्यात किंवा सूर्यास्तनंतर", s:"vata" },
        { k:"B", t:"दुपारी किंवा मध्यरात्री — उन्हाळ्यात किंवा जेवणानंतर लगेच", s:"pitta" },
        { k:"C", t:"सकाळी झोपेतून उठल्यावर लगेच किंवा नाश्त्यानंतर १ तासात", s:"kapha" }
      ]},
      { q: "**Q6 — इतर संबंधित लक्षणे**: पचन समस्येसोबत तुम्हाला आणखी काय जाणवते?", opts: [
        { k:"A", t:"घबराट, कंबरदुखी, त्वचेचा कोरडेपणा किंवा निद्रानाश", s:"vata" },
        { k:"B", t:"त्वचेवर लाल पुरळ, चिडचिड किंवा डोळ्यांची जळजळ", s:"pitta" },
        { k:"C", t:"वजन वाढणे, कफ/बलगम, अति थकवा किंवा आळस", s:"kapha" }
      ]},
      { q: "**Q7 — पोटाचा आवाज आणि गॅस**: पोटातून येणाऱ्या आवाजांचे वर्णन करा:", opts: [
        { k:"A", t:"पोटात गुरगुरण्याचा मोठा आवाज होणे आणि वारंवार गॅस होणे", s:"vata" },
        { k:"B", t:"गरम, दुर्गंधयुक्त गॅस किंवा तोंडाची चव कडू/आंबट असणे", s:"pitta" },
        { k:"C", t:"गॅस कमी होणे पण पोटात नेहमी जडपणा आणि ताण जाणवणे", s:"kapha" }
      ]}
    ],
    joints: [
      { q: "**Q1 — सांधेदुखीचा प्रकार**: तुमच्या सांधेदुखीची स्थिती कशी आहे?", opts: [
        { k:"A", t:"बदलत राहणारे दुखणे — एका सांध्यातून दुसऱ्या सांध्यात जाणे, थंडीत वाढणे", s:"vata" },
        { k:"B", t:"जळजळ, सांधे गरम आणि लाल होणे, उन्हाळ्यात तीव्र होणे", s:"pitta" },
        { k:"C", t:"मंद, जड दुखणे, सांध्यांमध्ये सूज, ओलसर/पावसाळी हवामानात वाढणे", s:"kapha" }
      ]},
      { q: "**Q2 — सकाळची अकडण**: सकाळी उठल्यावर तुम्हाला किती अकडण जाणवते?", opts: [
        { k:"A", t:"उठल्यावर खूप अकडण आणि सांध्यांमध्ये कटकट आवाज, १५ मिनिटांत बरे होणे", s:"vata" },
        { k:"B", t:"सकाळी सांध्यांमध्ये मऊपणा आणि उष्णता जाणवणे - थंड शेकने आराम", s:"pitta" },
        { k:"C", t:"३०-६० मिनिटे जास्त अकडण; सांध्यांमध्ये सूज आणि हालचालीत अडचण", s:"kapha" }
      ]},
      { q: "**Q3 — वाढवणारे घटक**: तुमची समस्या कोणत्या गोष्टींमुळे अधिक बिघडते?", opts: [
        { k:"A", t:"थंड हवामान, वेगाने वाहणारा वारा, उपवास, अनियमित जेवण किंवा प्रवास", s:"vata" },
        { k:"B", t:"उष्णता, ऊन, तिखट अन्न, चहा/कॉफी किंवा अल्कोहोल", s:"pitta" },
        { k:"C", t:"थंड आणि दमट हवामान, जड जेवण, शारीरिक निष्क्रियता या जास्त झोपणे", s:"kapha" }
      ]},
      { q: "**Q4 — सांध्यांचा आवाज**: काय तुमच्या सांध्यांमधून आवाज येतो?", opts: [
        { k:"A", t:"होय — हालचाल करताना सांध्यांमधून कटकट किंवा चटकण्याचा सतत आवाज येणे", s:"vata" },
        { k:"B", t:"कधीकधी हलका आवाज आणि सोबत सांध्यांमध्ये जळजळ", s:"pitta" },
        { k:"C", t:"काहीही आवाज नाही पण जडपणा, सूज आणि हालचाल करण्यास अडचण", s:"kapha" }
      ]},
      { q: "**Q5 — संधीवाताचा प्रकार (माहीत असल्यास)**: तुमची स्थिती कशाशी जुळते?", opts: [
        { k:"A", t:"ऑस्टिओआर्थरायटिस (हाडे झिजणे) किंवा वातचे जुने दुखणे", s:"vata" },
        { k:"B", t:"रुमॅटॉइड आर्थरायटिस, सोरियाटिक संधीवात किंवा युरिक ॲसिड (गाऊट)", s:"pitta" },
        { k:"C", t:"सांध्यांमध्ये पाणी साठणे (Fluid Retention) किंवा फायब्रोमायल्जिया", s:"kapha" }
      ]},
      { q: "**Q6 — पोट आणि पचन संबंध**: काय सांधेदुखीसोबत पोटाची समस्या पण आहे?", opts: [
        { k:"A", t:"बद्धकोष्ठता, गॅस किंवा पोट फुगल्यानंतर सांधेदुखी वाढते", s:"vata" },
        { k:"B", t:"ॲसिडिटी, जुलाब किंवा त्वचेवर पुरळ उठणे", s:"pitta" },
        { k:"C", t:"शौचात आव/बलगम असणे, बद्धकोष्ठता किंवा वजन वाढणे", s:"kapha" }
      ]},
      { q: "**Q7 — आम (विषाक्त घटक) चा स्तर**: काय तुम्हाला ही लक्षणे जाणवतात?", opts: [
        { k:"A", t:"जिभेवर हलका थर, कोरडी त्वचा, हाथ-पाय थंड पडणे", s:"vata" },
        { k:"B", t:"जिभेवर पिवळा थर, त्वचेत लालसरपणा किंवा घामाचा दुर्गंध", s:"pitta" },
        { k:"C", t:"जिभेवर पांढरा जाड थर, बलगम तयार होणे, अति थकवा आणि आळस", s:"kapha" }
      ]}
    ],
    sleep: [
      { q: "**Q1 — झोपेच्या समस्येचा प्रकार**: तुमची मुख्य समस्या काय आहे?", opts: [
        { k:"A", t:"झोप न येणे — मेंदू खूप सक्रिय किंवा चिंतेत असणे", s:"vata" },
        { k:"B", t:"झोप येणे पण रात्री २-३ वाजता जाग येणे आणि नंतर झोप न लागणे", s:"pitta" },
        { k:"C", t:"खूप जास्त झोपणे पण सकाळी उठल्यावर थकवा, जडपणा आणि आळस राहणे", s:"kapha" }
      ]},
      { q: "**Q2 — स्वप्नांचा प्रकार**: तुमची स्वप्ने कशी असतात?", opts: [
        { k:"A", t:"खूप स्पष्ट, भितीदायक, हवेत उडणारी किंवा पडणारी किंवा अस्वस्थ करणारी", s:"vata" },
        { k:"B", t:"तीव्र, हिंसक, स्पर्धात्मक किंवा उत्तेजित स्वप्ने", s:"pitta" },
        { k:"C", t:"खोल आणि स्वप्नविरहित झोप किंवा शांत, आनंदी स्वप्ने", s:"kapha" }
      ]},
      { q: "**Q3 — झोपताना शरीराची स्थिती**: झोपताना तुमचे शरीर कसे जाणवते?", opts: [
        { k:"A", t:"हात-पाय थंड पडणे, तोंड सुकणे किंवा शरीराला धक्के बसणे", s:"vata" },
        { k:"B", t:"उष्णता किंवा घाम येणे; थंड उशीची किंवा थंड खोलीची गरज वाटणे", s:"pitta" },
        { k:"C", t:"रात्री ९ वाजेपर्यंत जडपणा आणि झोप येणे पण सकाळी उठण्यास त्रास होणे", s:"kapha" }
      ]},
      { q: "**Q4 — जाग येण्याचे कारण**: तुमची झोप कोणत्या कारणामुळे तुटते किंवा उघडते?", opts: [
        { k:"A", t:"चिंताजनक विचार, हलक्या आवाजाप्रती संवेदनशीलता", s:"vata" },
        { k:"B", t:"ॲसिडिटी/छातीत जळजळ, राग या जुन्या गोष्टी वारंवार आठवणे", s:"pitta" },
        { k:"C", t:"श्वास घेण्यास त्रास होणे, घोरणे किंवा जडपणा जाणवणे", s:"kapha" }
      ]},
      { q: "**Q5 — दुसऱ्या दिवशीचा प्रभाव**: कमी झोपेमुळे दुसऱ्या दिवशी कसे वाटते?", opts: [
        { k:"A", t:"डोके रिकामे वाटणे, लक्ष केंद्रित न होणे, घबराट किंवा अस्वस्थता", s:"vata" },
        { k:"B", t:"चिडचिड होणे, लवकर राग येणे, डोकेदुखी किंवा डोळ्यांची जळजळ", s:"pitta" },
        { k:"C", t:"शरीरात जडपणा, चेहऱ्यावर सूज, गोड किंवा कर्बोदके खाण्याची इच्छा", s:"kapha" }
      ]},
      { q: "**Q6 — रात्रीची दिनचर्या**: तुम्ही झोपण्यापूर्वी सामान्यतः काय करता?", opts: [
        { k:"A", t:"मोबाईल/टीव्ही पाहणे, सोशल मीडिया वापरणे किंवा उशिरापर्यंत जागणे", s:"vata" },
        { k:"B", t:"रात्री उशिरापर्यंत काम करणे, वाद घालणे किंवा चहा/कॉफी पिणे", s:"pitta" },
        { k:"C", t:"सोफ्यावर झोपून टीव्ही पाहणे, जड जेवण करणे किंवा संध्याकाळी झोपून जाणे", s:"kapha" }
      ]},
      { q: "**Q7 — समस्येचा कालावधी**: ही झोपेची समस्या कधीपासून आहे?", opts: [
        { k:"A", t:"येत-जात राहते — मानसिक ताण, प्रवास किंवा बदलांशी जोडलेली आहे", s:"vata" },
        { k:"B", t:"सतत सुरू आहे — विशेषतः कामाच्या ताणादरम्यान", s:"pitta" },
        { k:"C", t:"जुनी समस्या आहे — वर्षांपासून आहे; नेहमी जडपणा आणि आळस जाणवतो", s:"kapha" }
      ]}
    ],
    general: [
      { q: "**Q1 — मुख्य काळजी**: तुमची प्राथमिक आरोग्य समस्या काय आहे?", opts: [
        { k:"A", t:"दुखणे, कोरडेपणा, घबराट, बद्धकोष्ठता किंवा ऊर्जेत बदल", s:"vata" },
        { k:"B", t:"सूज, ॲसिडिटी, उष्णता जाणवणे, त्वचेवर पुरळ किंवा चिडचिड", s:"pitta" },
        { k:"C", t:"वजन वाढणे, बलगम, आळस, अति झोप किंवा जडपणा", s:"kapha" }
      ]},
      { q: "**Q2 — हवामानाची संवेदनशीलता**: कोणते हवामान तुमची समस्या वाढवते?", opts: [
        { k:"A", t:"थंड, कोरडे किंवा वाऱ्याचे हवामान — पानगळ किंवा हिवाळा", s:"vata" },
        { k:"B", t:"उष्ण आणि दमट उन्हाळा किंवा उष्णकटिबंधीय हवामान", s:"pitta" },
        { k:"C", t:"थंड, दमट, पावसाळी हवामान किंवा वसंत ऋतूची सुरुवात", s:"kapha" }
      ]},
      { q: "**Q3 — पचन क्रियेचा प्रकार (अग्नि)**: तुमची पचन स्थिती कशी आहे?", opts: [
        { k:"A", t:"अनियमित — पोट फुगणे, गॅस, बद्धकोष्ठता आणि जुलाब आलटून-पालटून होणे", s:"vata" },
        { k:"B", t:"अति तीव्र — ॲसिडिटी, छातीत जळजळ, पातळ शौच किंवा अपचन", s:"pitta" },
        { k:"C", t:"मंद — कमी भूक लागणे, पोटात जडपणा किंवा शौचात चिकटपणा", s:"kapha" }
      ]},
      { q: "**Q4 — झोपेची गुणवत्ता**: तुम्ही कसे झोपता?", opts: [
        { k:"A", t:"हलकी झोप, वारंवार तुटणारी, भितीदायक किंवा अस्वस्थ स्वप्ने", s:"vata" },
        { k:"B", t:"सामान्य झोप पण रात्री २-३ वाजता तुटणे, शरीर गरम होणे", s:"pitta" },
        { k:"C", t:"खोल आणि लांब झोप पण उठल्यानंतर थकवा आणि जडपणा राहणे", s:"kapha" }
      ]},
      { q: "**Q5 — त्वचा आणि जीभ**: तुमची त्वचा आणि जिभेची स्थिती कशी आहे?", opts: [
        { k:"A", t:"कोरडी त्वचा, पातळ शरीर, फाटलेले ओठ या जिभेवर पांढुरका थर", s:"vata" },
        { k:"B", t:"तेलकट त्वचा, लालसरपणा किंवा जिभेवर पिवळा थर", s:"pitta" },
        { k:"C", t:"जाड तेलकट त्वचा, फिकटपणा किंवा जिभेवर पांढरा जाड थर", s:"kapha" }
      ]},
      { q: "**Q6 — तणावात प्रतिक्रिया**: दबावाखाली तुम्ही कसा व्यवहार करता?", opts: [
        { k:"A", t:"घाबरून जाणे, काम विसरणे, हृदयाची धडधड वाढणे", s:"vata" },
        { k:"B", t:"राग येणे, टीका करणे, चिडचिड होणे किंवा डोकेदुखी होणे", s:"pitta" },
        { k:"C", t:"शांत बसणे, जास्त खाणे, टाळाटाळ करणे किंवा उदास होणे", s:"kapha" }
      ]},
      { q: "**Q7 — नाडी आणि जीवन शक्ती**: तुमच्या नाडीची गती कशी जाणवते?", opts: [
        { k:"A", t:"अनियमित, वेगवान आणि बारीक — सापाच्या वेड्यावाकड्या चालीसारखी", s:"vata" },
        { k:"B", t:"मध्यम, वेगवान आणि उडणारी — बेडकाच्या उडीसारखी", s:"pitta" },
        { k:"C", t:"हळूवार, खोल आणि स्थिर — हंसाच्या पोहण्यासारखी", s:"kapha" }
      ]}
    ]
  }
};

const treatmentsLocalized = {
  hi: {
    skin: {
      vata: {
        diagnosis: "**वात-प्रकार त्वचा विकार (वात कुष्ठ)**: आपकी त्वचा रस धातु की कमी, उच्च वात शुष्कता और ओज की कमी से पीड़ित है। यह त्वचा में सूखापन, काले धब्बे और समय से पहले बुढ़ापा लाता है।",
        medicines: ["महामंजिष्ठादि काढ़ा (भोजन के बाद दिन में दो बार 30ml)", "सारिवाद्यासव (25ml बराबर पानी के साथ दिन में दो बार)", "कुंकुमादि तैल (रात में चेहरे पर लगाएं)", "च्यवनप्राश (हर सुबह 1 चम्मच गुनगुने दूध के साथ)", "शतावरी चूर्ण (सोते समय 1 चम्मच दूध के साथ)"],
        homeRemedies: ["**हल्दी-दूध का लेप**: 1 चम्मच कच्ची हल्दी, 1 चम्मच शहद और 2 चम्मच कच्चा दूध मिलाकर चेहरे पर 20 मिनट के लिए लगाएं, फिर गुनगुने पानी से धो लें।", "**बादाम तेल की मालिश**: स्नान करने से पहले चेहरे और शरीर पर गुनगुने बादाम के तेल से मालिश करें।", "**आहार नियम**: भोजन में गाय का घी, भीगे हुए बादाम और तिल शामिल करें। ठंडा और रूखा भोजन न करें।"],
        therapies: ["**स्नेहन (तैल मालिश)**: स्नान से पहले 20 मिनट तक गुनगुने तिल के तेल से पूरे शरीर की मालिश करें।", "**रक्तमोक्षण (रक्त शुद्धि)**: किसी वैद्य द्वारा जलोकावचारण (लीच थेरेपी) कराएं।", "**नस्य कर्म**: दोनों नथुनों में 2-2 बूंद अणु तैल डालें।"]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार त्वचा विकार (पित्त कुष्ठ / रक्तज विकार)**: रक्त धातु में अत्यधिक पित्त होने से त्वचा पर सूजन, लालिमा, मुंहासे और चकत्ते होते हैं। चरक संहिता के अनुसार इसके लिए पित्त-रक्त शोधन (खून की सफाई) आवश्यक है।",
        medicines: ["नीम कैप्सूल (पानी के साथ दिन में दो बार 2 कैप्सूल)", "महामंजिष्ठादि काढ़ा (दिन में दो बार 30ml)", "अविपत्तिकर चूर्ण (सोते समय गुनगुने पानी के साथ 1 चम्मच)", "एलोवेरा जूस (सुबह खाली पेट 30ml)", "पंचतिक्त घृत (1 चम्मच गुनगुने दूध के साथ)"],
        homeRemedies: ["**एलोवेरा और गुलाब जल**: ताज़ा एलोवेरा जेल में गुलाब जल मिलाकर प्रभावित त्वचा पर लगाएं।", "**नीम का लेप**: नीम पाउडर और मुल्तानी मिट्टी का पेस्ट बनाकर चेहरे पर लगाएं।", "**आहार नियम**: तीखा, खट्टा, तला-भुना और फर्मेंटेड भोजन पूरी तरह से बंद कर दें। अनार, तरबूज और नारियल पानी का सेवन बढ़ाएं।"],
        therapies: ["**विरेचन (पित्त शोधन)**: किसी वैद्य की देखरेख में त्रिवृत लेह्यम द्वारा विरेचन कराएं ताकि पित्त शरीर से बाहर निकल सके।", "**रक्तमोक्षण (लीच थेरेपी)**: सूजन और मुंहासों वाले स्थान पर लीच लगवाएं।", "**शीतली प्राणायाम**: प्रतिदिन सुबह 10-15 मिनट शीतली प्राणायाम का अभ्यास करें जिससे आंतरिक पित्त शांत हो।"]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार त्वचा विकार (कफज कुष्ठ)**: अत्यधिक कफ और आम (विषाक्त पदार्थ) त्वचा के रोमछिद्रों को अवरुद्ध कर देते हैं, जिससे तैलीयपन, व्हाइटहेड्स और रोमछिद्र बड़े हो जाते हैं। इसके लिए कफ नाशक शोधन आवश्यक है।",
        medicines: ["त्रिफला चूर्ण (सोते समय गुनगुने पानी के साथ 1 चम्मच)", "आरोग्यवर्धिनी वटी (भोजन के बाद दिन में दो बार 2 गोली)", "गिलोय सत्व (500mg दिन में दो बार)", "हरिद्रा खंड (1 चम्मच गुनगुने पानी के साथ)", "कांचनार गुग्गुल (दिन में दो बार 2 गोली)"],
        homeRemedies: ["**उबटन**: बेसन, हल्दी और चंदन पाउडर का पेस्ट बनाकर चेहरे पर लगाएं, यह अतिरिक्त तेल को सोख लेता है।", "**नीम की भाप**: उबलते पानी में नीम के पत्ते डालकर चेहरे को भाप दें, इससे बंद रोमछिद्र खुलेंगे।", "**आहार नियम**: डेयरी उत्पाद, मिठाई और मैदा पूरी तरह बंद कर दें। भोजन में अदरक, काली मिर्च और पीपली का उपयोग करें।"],
        therapies: ["**उद्वर्तन (सूखा हर्बल पाउडर मसाज)**: त्रिफला और नीम चूर्ण से शरीर पर सूखी मालिश करें।", "**वमन कर्म**: वैद्य की देखरेख में मदनफल और मुलेठी से वमन (उल्टी द्वारा शोधन) कराएं।", "**कफ नाशक योग**: प्रतिदिन सूर्य नमस्कार और कपालभाति प्राणायाम करें।"]
      }
    },
    hair: {
      vata: {
        diagnosis: "**वात-प्रकार बाल झड़ना (खालित्य)**: वात असंतुलन अस्थि धातु (जिसका उपोत्पाद बाल हैं) को सुखा देता है। यह जड़ों की चिकनाई को खत्म कर बालों को पतला और बेजान बनाता है।",
        medicines: ["भृंगराज तेल (रोज रात को सिर में मालिश करें)", "अश्वगंधा चूर्ण (सोते समय 1 चम्मच गुनगुने दूध के साथ)", "ब्राह्मी आंवला तेल (हफ्ते में 2 बार लगाएं)", "नरसिंह रसायन (दूध के साथ 1 चम्मच)"],
        homeRemedies: ["**तिल और भृंगराज मास्क**: गुनगुने तिल के तेल में भृंगराज मिलाकर सिर की त्वचा पर मालिश करें और रात भर छोड़ दें।", "**प्याज का रस**: प्याज का ताजा रस निकालकर सिर की जड़ों में लगाएं, यह बालों की जड़ों को पोषण देता है।", "**आहार नियम**: काले तिल, नारियल, भीगे हुए बादाम खाएं। समय पर भोजन करें।"],
        therapies: ["**शिरोअभ्यंग (सिर की मालिश)**: गुनगुने भृंगराज या ब्राह्मी तेल से 20 मिनट सिर की मालिश करें।", "**शिरोधारा**: माथे पर औषधियुक्त तेल की निरंतर धार गिराना, जो वात को शांत करता है।", "**नस्य (अणु तैल)**: दोनों नथुनों में रोज सुबह 2-2 बूंद अणु तैल डालें।"]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार बाल झड़ना (खालित्य/पालित्य)**: रक्त में अत्यधिक पित्त होने से बाल झड़ने लगते हैं और असमय सफेद होने लगते हैं। पित्त बालों के रोमछिद्रों को जला देता है।",
        medicines: ["नीलीभृंगादि तैल (सिर में लगाने के लिए सबसे उत्तम पित्त नाशक तेल)", "त्रिफला चूर्ण (सोते समय 1 चम्मच)", "सारिवाद्यासव (25ml पानी के साथ)", "ब्राह्मी घृत (1 चम्मच गुनगुने दूध के साथ)"],
        homeRemedies: ["**जपा (गुड़हल) और आंवला पैक**: गुड़हल के फूल और आंवला पाउडर का पेस्ट नारियल तेल में मिलाकर सिर पर लगाएं।", "**नारियल का दूध**: ताज़ा नारियल का दूध निकालकर सिर की जड़ों में लगाएं, यह जलन को शांत करता है।", "**आहार नियम**: तीखा, खट्टा, मसालेदार खाना और चाय/कॉफी पूरी तरह से बंद कर दें। आंवला और नारियल पानी लें।"],
        therapies: ["**तक्रधारा (मट्ठे की शिरोधारा)**: माथे पर ठंडे छाछ की धार गिराना, जो मस्तिष्क और बालों की पित्त गर्मी को शांत करता है।", "**विरेचन**: शरीर से अतिरिक्त पित्त निकालने के लिए विरेचन क्रिया कराएं।", "**शीतली प्राणायाम**: प्रतिदिन 15 मिनट अभ्यास करें ताकि शरीर का तापमान सामान्य रहे।"]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार बालों की समस्या (इंद्रलुप्त/डैंड्रफ)**: अत्यधिक कफ और वात मिलकर बालों के रोमछिद्रों को अवरुद्ध कर देते हैं, जिससे तैलीय रूसी (डैंड्रफ) होती है और बालों का विकास रुक जाता है।",
        medicines: ["आरोग्यवर्धिनी वटी (भोजन के बाद दिन में दो बार 2 गोली)", "त्रिकटु चूर्ण (भोजन से पहले 1/4 चम्मच गुनगुने पानी के साथ)", "नियमत रूप से नस्य के लिए अणु तैल"],
        homeRemedies: ["**शिकिकाई और नीम**: शिकिकाई, नीम और त्रिफला के पानी से बाल धोएं, यह तैलीय डैंड्रफ को खत्म करता है।", "**अदरक का रस**: अदरक का एक टुकड़ा सिर की त्वचा पर रगड़ें, इससे रक्त संचार बढ़ता है और कफ का जमाव दूर होता।", "**आहार नियम**: मीठा, डेयरी उत्पाद और भारी भोजन बंद कर दें। भोजन में काली मिर्च और अदरक का उपयोग करें।"],
        therapies: ["**नस्य (षडबिंदु तैल)**: दोनों नथुनों में 2-2 बूंद षडबिंदु तैल डालें जो कफ को साफ करता है।", "**उद्वर्तन**: सिर की त्वचा पर जड़ी-बूटियों के सूखे पाउडर से मालिश करना।", "**कपालभाति**: रोजाना 15-20 मिनट कपालभाति प्राणायाम करें जिससे कफ पिघलता है।"]
      }
    },
    digestion: {
      vata: {
        diagnosis: "**वात-प्रकार पाचन विकार (वात गृहणी / आनाह)**: आपकी जठराग्नि विषम (अस्थिर) है। इससे पेट फूलना, गैस, डकार और कब्ज की शिकायत रहती है।",
        medicines: ["हिंग्वाष्टक चूर्ण (भोजन से 15 मिनट पहले आधा चम्मच घी के साथ)", "त्रिकटु चूर्ण (भोजन से पहले 1/4 चम्मच गुनगुने पानी के साथ)", "गंधर्व हरीतकी (सोते समय 2 गोली गुनगुने पानी के साथ)", "दशमूल काढ़ा (दिन में दो बार 25ml)"],
        homeRemedies: ["**अदरक-नींबू-सेंधा नमक**: ताजा अदरक का रस, नींबू और सेंधा नमक मिलाकर भोजन से पहले लें। यह अग्नि को प्रदीप्त करता है।", "**सोते समय अरंडी का तेल**: रात को गुनगुने दूध में 1 चम्मच अरंडी (कैस्टर) का तेल मिलाकर पिएं, इससे कब्ज दूर होती है।", "**आहार नियम**: हमेशा ताजा, गर्म और घी युक्त भोजन करें। कच्चा सलाद, ठंडी चीजें और गैस बनाने वाली दालें न खाएं।"],
        therapies: ["**बस्ती कर्म (अनुवासन बस्ती)**: तिल के तेल या धनवंतरी तेल की बस्ती (एनिमा) वात पाचन विकारों के लिए सर्वश्रेष्ठ है।", "**कटि बस्ती**: पीठ के निचले हिस्से में गुनगुना तेल रोकना, जिससे अपान वात नियंत्रित होता है।", "**प्राणायाम**: रोजाना अनुलोम-विलोम प्राणायाम और पवनमुक्तासन का अभ्यास करें।"]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार पाचन विकार (तीक्ष्ण अग्नि / पित्त गृहणी)**: आपकी जठराग्नि तीक्ष्ण (अत्यधिक तेज) है। यह पेट की परत में जलन पैदा करती है, जिससे एसिडिटी, सीने में जलन और खट्टी डकारें आती हैं।",
        medicines: ["अविपत्तिकर चूर्ण (सोते समय 1 चम्मच गुनगुने पानी के साथ)", "शतावरी चूर्ण (दिन में दो बार 1 चम्मच ठंडे दूध के साथ)", "यष्टिमधु (मुलेठी) चूर्ण (1 चम्मच गुनगुने दूध के साथ)", "प्रवाल पिष्टी (250mg दिन में दो बार - प्राकृतिक एंटासिड)"],
        homeRemedies: ["**आंवला-नारियल पानी**: नारियल पानी में 1 चम्मच आंवला चूर्ण मिलाकर सुबह खाली पेट पिएं। यह पित्त को शांत करता है।", "**सौंफ-धनिया-जीरा चाय**: सौंफ, धनिया और जीरा को उबालकर ठंडा कर लें और भोजन के बाद पिएं।", "**आहार नियम**: तीखा, खट्टा, खमीरयुक्त (fermented) और तला-भुना खाना पूरी तरह बंद कर दें। चिड़चिड़ापन शांत करने के लिए ठंडे पेय लें।"],
        therapies: ["**विरेचन कर्म**: पित्त को जड़ से समाप्त करने के लिए किसी वैद्य की देखरेख में विरेचन कराएं।", "**क्षीरधारा**: माथे पर औषधियुक्त ठंडे दूध की धार गिराना, जो एसिडिटी को कम करता है।", "**शीतली प्राणायाम**: भोजन के बाद 10-15 मिनट शीतली या शीतकारी प्राणायाम का अभ्यास करें।"]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार पाचन विकार (मंद अग्नि / आम बनना)**: आपकी जठराग्नि मंद (धीमी) है। इससे भोजन पूरी तरह नहीं पचता और 'आम' (विषाक्त कफ) बनता है, जिससे पेट हमेशा भारी रहता है।",
        medicines: ["त्रिकटु चूर्ण (भोजन से 30 मिनट पहले 1/2 चम्मच शहद के साथ)", "चित्रकादि वटी (भोजन से पहले 2 गोली)", "त्रिफला चूर्ण (सोते समय 1 चम्मच गुनगुने पानी के साथ)"],
        homeRemedies: ["**अग्नि प्रदीप्त पेय**: अदरक, काली मिर्च और जीरा पानी में उबालकर चाय बनाएं और शहद मिलाकर भोजन से पहले पिएं।", "**अदरक-नमक**: भोजन से पहले अदरक के टुकड़े पर थोड़ा काला नमक लगाकर चबाएं।", "**आहार नियम**: दिन में केवल एक या दो बार ही भोजन करें। डेयरी उत्पाद, भारी भोजन और मिठाई पूरी तरह बंद कर दें।"],
        therapies: ["**वमन कर्म**: पेट और छाती से कफ निकालने के लिए वैद्य की देखरेख में औषधीय वमन (उल्टी) कराएं।", "**उद्वर्तन**: गर्म हर्बल चूर्ण से पेट और शरीर की मालिश।", "**कपालभाति**: जठराग्नि बढ़ाने के लिए प्रतिदिन 20 मिनट कपालभाति करें।"]
      }
    },
    joints: {
      vata: {
        diagnosis: "**वात-प्रकार जोड़ों का दर्द (संधिवात / ऑस्टियोआर्थराइटिस)**: जोड़ों में चिकनाई (श्लेषक कफ) कम होने के कारण हड्डियां घिसने लगती हैं, जिससे जोड़ों में दर्द, सूजन और चलने पर कटकट की आवाज आती है।",
        medicines: ["योगराज गुग्गुल (भोजन के बाद दिन में दो बार 2 गोली)", "दशमूल काढ़ा (दिन में दो बार 25ml)", "अश्वगंधा चूर्ण (सोते समय 1 चम्मच गुनगुने दूध के साथ)", "शल्लकी (Shallaki) कैप्सूल (दिन में दो बार 2 कैप्सूल)"],
        homeRemedies: ["**गर्म तेल की सिकाई**: जोड़ों पर गुनगुना तिल का तेल या महानारायण तेल लगाकर हल्के हाथ से मालिश करें और गर्म कपड़े से बांधें।", "**मेथी-अजवाइन का पानी**: रात भर भीगे मेथी और अजवाइन का पानी उबालकर सुबह पिएं, यह अकड़न कम करता है।", "**आहार नियम**: गर्म, सूप और घी युक्त भोजन करें। सूखा भोजन, राजमा, छोले और ठंडे पानी से परहेज करें।"],
        therapies: ["**जानु बस्ती / कटि बस्ती**: जोड़ों या कमर पर उड़द के आटे का घेरा बनाकर उसमें गुनगुना औषधीय तेल भरना।", "**बस्ती (एनिमा)**: वात रोगों के लिए धनवंतरी तेल की एनिमा चिकित्सा।", "**रसायन चिकित्सा**: जोड़ों के पुनर्निर्माण के लिए अश्वगंधा और शतावरी का सेवन।"]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार जोड़ों का दर्द (वात रक्त / गाउट)**: रक्त में यूरिक एसिड या पित्त की अधिकता से जोड़ों में तेज जलन, लालिमा और सूजन होती है।",
        medicines: ["त्रिफला गुग्गुल (दिन में दो बार 2 गोली)", "गोक्षुरादि गुग्गुल (यूरिक एसिड कम करने के लिए दिन में दो बार 2 गोली)", "मह मंजिष्ठादि काढ़ा (दिन में दो बार 25ml)"],
        homeRemedies: ["**नारियल तेल और हल्दी**: नारियल के तेल में हल्दी मिलाकर जोड़ों पर लगाएं। ध्यान रखें, पित्त के जोड़ों पर कभी गर्म सिकाई न करें।", "**अनार का रस**: यूरिक एसिड को कम करने के लिए रोज अनार का रस पिएं।", "**आहार नियम**: शराब, मटन, खट्टा और तली-भुनी चीजें बंद कर दें। कड़वी सब्जियां खाएं।"],
        therapies: ["**विरेचन**: शरीर और रक्त से यूरिक एसिड बाहर निकालने के लिए विरेचन कराएं।", "**लेप चिकित्सा**: चंदन, लोध्र और मंजिष्ठा का ठंडा लेप जोड़ों पर लगाएं।", "**रक्तमोक्षण (लीच)**: जोड़ों की लालिमा और सूजन कम करने के लिए जलोका (लीच) लगवाएं।"]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार जोड़ों का दर्द (आमवात / रूमेटॉइड आर्थराइटिस)**: अपचित भोजन से बना 'आम' (टॉक्सिन) जब जोड़ों में जाकर कफ के साथ जमा हो जाता है, तो जोड़ों में सूजन, भारीपन और सुबह उठने पर भारी अकड़न होती है।",
        medicines: ["सिंहनाद गुग्गुल (दिन में दो बार 2 गोली)", "रास्ना सप्तक काढ़ा (दिन में दो बार 25ml)", "त्रिकटु चूर्ण (भोजन से पहले 1/2 चम्मच)"],
        homeRemedies: ["**अदरक-अरंडी तेल सिकाई**: अरंडी के तेल में सोंठ (सूखा अदरक) मिलाकर जोड़ों पर गुनगुनी मालिश करें और सिकाई करें।", "**लंघना (उपवास)**: विषैले तत्व 'आम' को पचाने के लिए हफ्ते में एक दिन हल्का भोजन या उपवास करें।", "**आहार नियम**: दही, ठंडी चीजें, मिठाई और मछली पूरी तरह बंद कर दें। मूंग दाल का सूप और पुराना चावल लें।"],
        therapies: ["**पत्रपोटली स्वेद**: औषधीय पत्तों की पोटली बनाकर जोड़ों की गर्म सिकाई करना, जिससे कफ पिघलता है और दर्द कम होता है।", "**निरूह बस्ती**: पेट साफ करने के लिए काढ़े की बस्ती देना।", "**कपालभाति**: शरीर की अतिरिक्त चर्बी और कफ को सुखाने के लिए प्रतिदिन २० मिनट कपालभाति करें।"]
      }
    },
    sleep: {
      vata: {
        diagnosis: "**वात-प्रकार अनिद्रा (नींद न आना)**: मस्तिष्क में वात (प्राण वायु) के बढ़ने और कफ की कमी से नींद नहीं आती, मन अशांत रहता है और डरावने सपने आते हैं।",
        medicines: ["अश्वगंधा चूर्ण (सोते समय 1 चम्मच गुनगुने दूध के साथ)", "जतामांसी चूर्ण (सोते समय 1 चम्मच)", "ब्राह्मी घृत (1 चम्मच गुनगुने दूध के साथ)", "मानस मित्र वाटकम (सोते समय 2 गोली)"],
        homeRemedies: ["**जायफल वाला दूध**: सोते समय दूध में एक चुटकी जायफल, थोड़ा अश्वगंधा और घी डालकर पिएं। यह दिमाग को शांत करता है।", "**पादअभ्यंग (पैर की मालिश)**: सोने से पहले पैरों के तलवों में गुनगुने तिल के तेल या अरंडी के तेल से १० मिनट मालिश करें।", "**आहार नियम**: रात को हल्का लेकिन पौष्टिक भोजन लें। सोने से १ घंटे पहले मोबाइल, टीवी देखना बंद कर दें।"],
        therapies: ["**शिरोधारा**: माथे पर गुनगुने तेल की धार गिराना, अनिद्रा के लिए सर्वश्रेष्ठ चिकित्सा है।", "**नस्य कर्म**: सोते समय नाक के दोनों नथुनों में 2-2 बूंद ब्राह्मी तेल या अणु तेल डालें।", "**योग निद्रा**: सोने से पहले 20 मिनट योग निद्रा (गहन ध्यान) का अभ्यास करें।"]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार अनिद्रा (रात को नींद टूटना)**: शरीर में अत्यधिक गर्मी और पित्त के बढ़ने से रात को २-३ बजे आंख खुलती है और दोबारा नींद आने में कठिनाई होती है।",
        medicines: ["ब्राह्मी कैप्सूल (भोजन के बाद 2 कैप्सूल)", "चंदनाससव (25ml पानी के साथ)", "प्रवाल पिष्टी (250mg गुलाब जल के साथ)"],
        homeRemedies: ["**गुलाब-नारियल दूध**: नारियल के दूध में गुलाब जल और मिश्री मिलाकर रात को पिएं। यह पित्त की गर्मी को शांत करता है।", "**चंदन लेप**: माथे और कनपटी पर चंदन का ठंडा लेप लगाएं।", "**आहार नियम**: रात के भोजन में तीखा, खट्टा और तला हुआ भोजन न करें। कमरे को ठंडा और हवादार रखें।"],
        therapies: ["**तक्रधारा**: छाछ की शिरोधारा करना, जो सिर की गर्मी और पित्त को कम करती है।", "**विरेचन**: पित्त दोष को शांत करने के लिए विरेचन क्रिया करवाएं।", "**चंद्र भेदन प्राणायाम**: बाईं नासिका से सांस लेने का अभ्यास करें जिससे शरीर शीतल होता है।"]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार अनिद्रा (अति निद्रा / सुस्ती)**: अत्यधिक कफ के कारण दिन भर नींद आना, भारीपन रहना और सुबह उठने में परेशानी होना (तंद्रा)।",
        medicines: ["त्रिकटु चूर्ण (सुबह खाली पेट 1/4 चम्मच)", "आरोग्यवर्धिनी वटी (भोजन के बाद दिन में दो बार 2 गोली)", "वचा चूर्ण (सुबह शहद के साथ 250mg)"],
        homeRemedies: ["**अदरक-काली मिर्च चाय**: अदरक, काली मिर्च और तुलसी की बिना दूध वाली चाय पिएं। यह कफ को पिघलाता है।", "**ठंडे पानी के छींटे**: सुबह उठकर चेहरे और आंखों पर ठंडे पानी के छींटे मारें।", "**आहार नियम**: सुबह सूर्योदय से पहले उठें। दिन में सोना पूरी तरह बंद करें। हल्का भोजन लें।"],
        therapies: ["**उद्वर्तन (सूखी मालिश)**: सूखे जड़ी-बूटी चूर्ण से शरीर पर रगड़कर मालिश करना।", "**नस्य कर्म**: तीखे अणु तेल की बूंदें नाक में डालना ताकि कफ दूर हो।", "**कपालभाति**: सुबह खाली पेट 20 मिनट तेज गति से कपालभाति प्राणायाम करें।"]
      }
    },
    general: {
      vata: {
        diagnosis: "**वात दोष असंतुलन**: आपके शरीर में वात (वायु) की अधिकता है जिससे दर्द, शुष्कता, कब्ज और घबराहट जैसे लक्षण उत्पन्न होते हैं।",
        medicines: ["अश्वगंधा चूर्ण (सोते समय दूध के साथ 1 चम्मच)", "दशमूल काढ़ा (दिन में दो बार 25ml)", "योगराज गुग्गुल (भोजन के बाद दिन में दो बार 2 गोली)"],
        homeRemedies: ["रोजाना तिल के तेल से शरीर की मालिश करें।", "सोते समय अश्वगंधा के साथ गर्म दूध लें।", "हमेशा गर्म, ताजा और घी युक्त भोजन करें।"],
        therapies: ["**अभ्यंग**: गर्म तेल से मालिश।", "**बस्ती**: औषधीय तेल का एनिमा।", "अनुलोम-विलोम प्राणायाम का अभ्यास करें।"]
      },
      pitta: {
        diagnosis: "**पित्त दोष असंतुलन**: आपके शरीर में पित्त (अग्नि) की अधिकता है जिससे सीने में जलन, एसिडिटी, त्वचा पर चकत्ते और चिड़चिड़ापन होता है।",
        medicines: ["अविपत्तिकर चूर्ण (सोते समय 1 चम्मच)", "शतावरी चूर्ण (दिन में दो बार 1 चम्मच)", "गिलोय सत्व (500mg)"],
        homeRemedies: ["सुबह खाली पेट एलोवेरा का रस पिएं।", "सौंफ और धनिए की चाय पिएं।", "तीखा, खट्टा और तला हुआ भोजन न करें।"],
        therapies: ["**विरेचन**: पित्त नाशक शोधन।", "**तक्रधारा**: छाछ की शिरोधारा।", "शीतली प्राणायाम करें।"]
      },
      kapha: {
        diagnosis: "**कफ दोष असंतुलन**: आपके शरीर में कफ (जल/पृथ्वी) की अधिकता है जिससे वजन बढ़ना, सुस्ती, बलगम और भारीपन महसूस होता है।",
        medicines: ["त्रिकटु चूर्ण (भोजन से पहले 1/2 चम्मच)", "आरोग्यवर्धिनी वटी (भोजन के बाद दिन में दो बार 2 गोली)", "त्रिफला चूर्ण (सोते समय गुनगुने पानी के साथ 1 चम्मच)"],
        homeRemedies: ["अदरक, काली मिर्च और शहद की चाय पिएं।", "डेयरी उत्पाद, मिठाई और मैदा बंद कर दें।", "सुबह जल्दी उठें और व्यायाम करें।"],
        therapies: ["**वमन**: औषधीय उल्टी द्वारा कफ शोधन।", "**उद्वर्तन**: हर्बल चूर्ण की सूखी मालिश।", "कपालभाति प्राणायाम करें।"]
      }
    }
  },
  mr: {
    skin: {
      vata: {
        diagnosis: "**वात-प्रकार त्वचा विकार (वात कुष्ठ)**: तुमच्या त्वचेमध्ये रस धातूची कमतरता, उच्च वात कोरडेपणा आणि ओजसची कमतरता आहे. यामुळे त्वचेवर कोरडेपणा, काळे डाग आणि अकाली वृद्धत्व येते.",
        medicines: ["महामंजिष्ठादि काढा (जेवणानंतर दिवसातून दोनदा 30ml)", "सारिवाद्यासव (25ml समान पाण्यासोबत दिवसातून दोनदा)", "कुंकुमादि तैल (रात्री चेहऱ्यावर लावा)", "च्यवनप्राश (रोज सकाळी 1 चमचा कोमट दुधासोबत)"],
        homeRemedies: ["**हळद-दूध लेप**: 1 चमचा हळद, 1 चमचा मध आणि 2 चमचे कच्चे दूध एकत्र करून चेहऱ्यावर 20 मिनिटे लावा, नंतर कोमट पाण्याने धुवा.", "**बदाम तेल मालिश**: आंघोळीपूर्वी चेहऱ्यावर आणि शरीरावर कोमट बदाम तेलाने मालिश करा.", "**आहार नियम**: आहारात गाईचे तूप, भिजवलेले बदाम आणि तीळ वापरा. थंड आणि कोरडे अन्न खाणे टाळा."],
        therapies: ["**स्नेहन (तेल मालिश)**: आंघोळीपूर्वी 20 मिनिटे कोमट तिळाच्या तेलाने शरीराला मालिश करा.", "**रक्तमोक्षण (रक्त शुद्धीकरण)**: वैद्यांच्या सल्ल्याने जळू लावून रक्त शुद्धीकरण करा.", "**नस्य कर्म**: दोन्ही नाकपुड्यांमध्ये रोज सकाळी 2-2 थेंब अणु तेल टाका."]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार त्वचा विकार (पित्त कुष्ठ / रक्तज विकार)**: रक्त धातूमध्ये अतिरिक्त पित्त वाढल्याने त्वचेवर सूज, लालसरपणा, मुरुम आणि पुरळ येते. चरक संहितेनुसार यासाठी पित्त-रक्त शोधन आवश्यक आहे.",
        medicines: ["नीम कॅप्सूल (पाण्यासोबत दिवसातून दोनदा 2 कॅप्सूल)", "महामंजिष्ठादि काढा (दिवसातून दोनदा 30ml)", "अविपत्तिकर चूर्ण (झोपताना कोमट पाण्यासोबत 1 चमचा)", "कोरफडीचा रस (सकाळी रिकाम्या पोटी 30ml)"],
        homeRemedies: ["**कोरफड आणि गुलाब पाणी**: ताज्या कोरफडीच्या जेलमध्ये गुलाब पाणी मिसळून त्वचेवर लावा.", "**कडुनिंब लेप**: कडुनिंब पावडर आणि मुलतानी मातीचा लेप चेहऱ्यावर लावा.", "**आहार नियम**: तिखट, आंबट, तळलेले आणि आंबवलेले (fermented) अन्न खाणे पूर्णपणे बंद करा. डाळिंब आणि शहाळ्याचे पाणी प्या."],
        therapies: ["**विरेचन (पित्त शोधन)**: अतिरिक्त पित्त शरीराबाहेर काढण्यासाठी वैद्यांच्या देखरेखीखाली विरेचन करा.", "**रक्तमोक्षण (जळू चिकित्सा)**: सूज व मुरुमांच्या जागी जळू लावून घ्या.", "**शीतली प्राणायाम**: रोज सकाळी 10-15 मिनिटे शीतली प्राणायामाचा सराव करा ज्यामुळे शरीरातील पित्त शांत होईल."]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार त्वचा विकार (कफज कुष्ठ)**: अतिरिक्त कफ आणि शरीरातील 'आम' (टॉक्सिन्स) त्वचेची छिद्रे बंद करतात, ज्यामुळे त्वचा तेलकट होते, व्हाईटहेड्स येतात आणि छिद्रे मोठी होतात.",
        medicines: ["त्रिफला चूर्ण (झोपताना कोमट पाण्यासोबत 1 चमचा)", "आरोग्यवर्धिनी वटी (जेवणानंतर दिवसातून दोनदा 2 गोळ्या)", "गिलोय सत्व (500mg दिवसातून दोनदा)"],
        homeRemedies: ["**उटणे**: बेसन, हळद आणि चंदन पावडरचे उटणे चेहऱ्यावर लावा, हे त्वचेतील अतिरिक्त तेल शोषून घेते.", "**कडुनिंबाची वाफ**: उकळत्या पाण्यात कडुनिंबाची पाने टाकून चेहऱ्याला वाफ द्या.", "**आहार नियम**: दुग्धजन्य पदार्थ, मिठाई आणि मैदा बंद करा. जेवणात आले, मिरी आणि पिंपळी वापरा."],
        therapies: ["**उद्वर्तन (कोरडी मालिश)**: त्रिफला आणि कडुनिंब चूर्णाने शरीरावर कोरडी मालिश करा.", "**वमन कर्म**: वैद्यांच्या देखरेखीखाली कफ बाहेर काढण्यासाठी वमन चिकित्सा करा.", "**कफ नाशक योग**: रोज सूर्यनमस्कार आणि कपालभाती प्राणायाम करा."]
      }
    },
    hair: {
      vata: {
        diagnosis: "**वात-प्रकार केस गळणे (खालित्य)**: वात दोषामुळे अस्थि धातू (केस हे अस्थींचे उपउत्पादन आहेत) कोरडे होतात. यामुळे केसांच्या मुळांमधील ओलावा निघून जातो आणि केस पातळ होतात.",
        medicines: ["भृंगराज तेल (रोज रात्री डोक्याला हलक्या हाताने मालिश करा)", "अश्वगंधा चूर्ण (झोपताना 1 चमचा कोमट दुधासोबत)", "ब्राह्मी आवळा तेल (आठवड्यातून 2 वेळा लावा)"],
        homeRemedies: ["**तीळ आणि भृंगराज मास्क**: कोमट तिळाच्या तेलात भृंगराज पावडर मिसळून टाळूला मसाज करा आणि रात्री ठेवा.", "**कांद्याचा रस**: कांद्याचा ताजा रस काढून केसांच्या मुळांना लावा, हा मुळांना पोषण देतो.", "**आहार नियम**: काळे तीळ, ओले खोबरे आणि भिजवलेले बदाम खा. जेवणाची वेळ निश्चित ठेवा."],
        therapies: ["**शिरोअभ्यंग (डोक्याची मालिश)**: कोमट भृंगराज तेलाने 20 मिनिटे डोक्याला मसाज करा.", "**शिरोधारा**: कपाळावर औषधी तेलाची संतत धार सोडणे, ज्यामुळे वात शांत होतो.", "**नस्य (अणु तैल)**: रोज सकाळी दोन्ही नाकपुड्यांमध्ये 2-2 थेंब अणु तेल टाका."]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार केस गळणे (खालित्य/पालित्य)**: रक्तातील अतिरिक्त पित्त केसांच्या मुळांना इजा करते, ज्यामुळे केस गळतात आणि अकाली पांढरे होतात.",
        medicines: ["निलीभृंगादि तैल (केसांसाठी सर्वोत्तम पित्त नाशक तेल)", "त्रिफला चूर्ण (झोपताना 1 चमचा)", "सारिवाद्यासव (25ml पाण्यासोबत)"],
        homeRemedies: ["**जास्वंद आणि आवळा लेप**: जास्वंदाची फुले आणि आवळा पावडर खोबरेल तेलात मिसळून डोक्याला लावा.", "**शहाळ्याचे पाणी व नारळाचे दूध**: नारळाचे ताजे दूध टाळूवर लावा, यामुळे पित्त शांत होते.", "**आहार नियम**: तिखट, आंबट अन्न आणि चहा/कॉफी पूर्णपणे बंद करा. आवळा आणि डाळिंब खा."],
        therapies: ["**तक्रधारा (ताकाची शिरोधारा)**: कपाळावर औषधी ताकाची धार सोडणे, ज्यामुळे मेंदू आणि केसांची उष्णता कमी होते.", "**विरेचन**: रक्तातील उष्णता कमी करण्यासाठी वैद्यांच्या सल्ल्याने विरेचन करा.", "**शीतली प्राणायाम**: रोज १५ मिनिटे शीतली प्राणायाम करा."]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार केसांची समस्या (कोंडा/डँड्रफ)**: अतिरिक्त कफ आणि वात मिळून केसांच्या छिद्रांना बंद करतात, ज्यामुळे तेलकट कोंडा होतो आणि केसांची वाढ थांबते.",
        medicines: ["आरोग्यवर्धिनी वटी (जेवणानंतर दिवसातून दोनदा 2 गोळ्या)", "त्रिकटु चूर्ण (जेवणापूर्वी 1/4 चमचा कोमट पाण्यासोबत)"],
        homeRemedies: ["**शिकेकाई आणि कडुनिंब**: शिकेकाई, कडुनिंब आणि त्रिफलाच्या पाण्याने केस धुवा, यामुळे तेलकट कोंडा कमी होतो.", "**आल्याचा रस**: आल्याचा तुकडा टाळूवर घासावा, यामुळे रक्ताभिसरण सुधारते आणि कफ दूर होतो.", "**आहार नियम**: गोड, दुग्धजन्य पदार्थ बंद करा. जेवणात मिरी आणि आले वापरा."],
        therapies: ["**नस्य (षडबिंदु तेल)**: नाकपुड्यांमध्ये 2-2 थेंब षडबिंदु तेल टाका जे कफ साफ करते.", "**कपालभाती**: कफ वितळवण्यासाठी दररोज १५-२० मिनिटे कपालभाती प्राणायाम करा."]
      }
    },
    digestion: {
      vata: {
        diagnosis: "**वात-प्रकार पचन विकार (वात गृहणी / आनाह)**: तुमची जठराग्नी विषम (अस्थिर) आहे. यामुळे पोट फुगणे, गॅस आणि बद्धकोष्ठतेचा त्रास होतो.",
        medicines: ["हिंग्वाष्टक चूर्ण (जेवणापूर्वी १५ मिनिटे अर्धा चमचा तुपासोबत)", "त्रिकटु चूर्ण (जेवणापूर्वी 1/4 चमचा कोमट पाण्यासोबत)", "गंधर्व हरीतकी (झोपताना 2 गोळ्या कोमट पाण्यासोबत)"],
        homeRemedies: ["**आले-लिंबू-सेंधा मीठ**: आल्याचा रस, लिंबू आणि सेंधा मीठ एकत्र करून जेवणापूर्वी घ्या. हे भूक वाढवते.", "**झोपताना एरंडेल तेल**: रात्री कोमट दुधात १ चमचा एरंडेल (कॅस्टर) तेल मिसळून प्या, बद्धकोष्ठता दूर होईल.", "**आहार नियम**: नेहमी ताजे, गरम आणि तुपाचा समावेश असलेले अन्न खा. कच्चे सॅलड आणि थंड पदार्थ खाऊ नका."],
        therapies: ["**बस्ती कर्म (अनुवासन बस्ती)**: तिळाचे तेल वात रोगांसाठी उत्तम आहे.", "**कटि बस्ती**: पाठीच्या खालच्या भागात कोमट तेल काही वेळ साठवणे.", "**प्राणायाम**: रोज अनुलोम-विलोम प्राणायाम आणि पवनमुक्तासन करा."]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार पचन विकार (तीक्ष्ण अग्नि / पित्त गृहणी)**: तुमची जठराग्नी तीक्ष्ण (खूप तीव्र) आहे. यामुळे पोटात जळजळ, ॲसिडिटी आणि छातीत जळजळ होते.",
        medicines: ["अविपत्तिकर चूर्ण (झोपताना १ चमचा कोमट पाण्यासोबत)", "शतावरी चूर्ण (दिवसातून दोनदा १ चमचा थंड दुधासोबत)", "प्रवाल पिष्टी (250mg दिवसातून दोनदा - नैसर्गिक अँटासिड)"],
        homeRemedies: ["**आवळा-शहाळे**: शहाळ्याच्या पाण्यात १ चमचा आवळा चूर्ण टाकून सकाळी रिकाम्या पोटी प्या. हे पित्त शांत करते.", "**बडीशेप-धणे-जिरे चहा**: बडीशेप, धणे आणि जिरे उकळून गार करा आणि जेवणानंतर प्या.", "**आहार नियम**: तिखट, आंबट, तळलेले आणि आंबवलेले जेवण बंद करा. थंड आणि गोड पदार्थ घ्या."],
        therapies: ["**विरेचन कर्म**: पित्त मुळापासून नष्ट करण्यासाठी वैद्यांच्या मार्गदर्शनाखाली विरेचन करा.", "**क्षीरधारा**: कपाळावर कोमट दुधाची धार सोडणे.", "**शीतली प्राणायाम**: जेवणानंतर १०-१५ मिनिटे शीतली प्राणायामाचा सराव करा."]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार पचन विकार (मंद अग्नि / आम तयार होणे)**: तुमची जठराग्नी मंद (हळू) आहे, ज्यामुळे अन्न नीट पचत नाही आणि विषारी कफ (आम) तयार होतो, ज्यामुळे पोट जड वाटते.",
        medicines: ["त्रिकटु चूर्ण (जेवणापूर्वी ३० मिनिटे १/२ चमचा मधासोबत)", "चित्रकादि वटी (जेवणापूर्वी २ गोळ्या)", "त्रिफला चूर्ण (झोपताना १ चमचा कोमट पाण्यासोबत)"],
        homeRemedies: ["**आले-मीठ**: जेवणापूर्वी आल्याच्या तुकड्यावर थोडे काळे मीठ लावून चावून खा.", "**आहार नियम**: दिवसातून एकदा किंवा दोदाच जेवा. दुग्धजन्य पदार्थ आणि गोड पूर्णपणे बंद करा."],
        therapies: ["**वमन कर्म**: पोट आणि छातीतील कफ बाहेर काढण्यासाठी वैद्यांच्या देखरेखीखाली वमन (उलटी) करा.", "**कपालभाती**: जठराग्नी प्रदीप्त करण्यासाठी रोज २० मिनिटे कपालभाती करा."]
      }
    },
    joints: {
      vata: {
        diagnosis: "**वात-प्रकार सांधेदुखी (संधिवात / ऑस्टिओआर्थरायटिस)**: सांध्यांमधील वंगण (श्लेषक कफ) कमी झाल्याने हाडे घासली जातात, ज्यामुळे सांधे दुखतात आणि हालचाल करताना आवाज येतो.",
        medicines: ["योगराज गुग्गुल (जेवणानंतर दिवसातून दोनदा २ गोळ्या)", "दशमूल काढा (दिवसातून दोनदा २५ml)", "अश्वगंधा चूर्ण (झोपताना १ चमचा कोमट दुधासोबत)"],
        homeRemedies: ["**कोमट तेल शेक**: सांध्यांवर कोमट तिळाचे तेल लावून मालिश करा आणि कोमट कपड्याने शेका.", "**मेथी-ओवा पाणी**: रात्री भिजवलेली मेथी आणि ओवा उकळून सकाळी प्या, यामुळे अकडण कमी होते.", "**आहार नियम**: गरम आणि तुपाचा समावेश असलेले जेवण करा. वातूळ पदार्थ टाळा."],
        therapies: ["**जानु बस्ती / कटि बस्ती**: सांध्यांवर किंवा पाठीवर उडदाच्या पिठाचे गोल कडे करून त्यात कोमट औषधी तेल भरणे.", "**बस्ती (एनिमा)**: धनवंतरी तेलाची बस्ती चिकित्सा.", "**रसायन चिकित्सा**: हाडांच्या मजबूतीसाठी अश्वगंधा आणि शतावरी घ्या."]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार सांधेदुखी (वात रक्त / गाऊट)**: रक्तात यूरिक ॲसिड किंवा पित्त वाढल्यामुळे सांध्यांमध्ये जळजळ, लालसरपणा आणि तीव्र सूज येते.",
        medicines: ["त्रिफला गुग्गुल (दिवसातून दोनदा २ गोळ्या)", "गोक्षुरादि गुग्गुल (यूरिक ॲसिड कमी करण्यासाठी २ गोळ्या)", "मह मंजिष्ठादि काढा (दिवसातून दोनदा २५ml)"],
        homeRemedies: ["**खोबरेल तेल आणि हळद**: खोबरेल तेलात हळद मिसळून सांध्यांवर लावा. लक्षात ठेवा पित्तच्या दुखण्यावर कधीही गरम शेक देऊ नका.", "**डाळिंबाचा रस**: यूरिक ॲसिड कमी करण्यासाठी रोज डाळिंबाचा रस प्या.", "**आहार नियम**: दारू, मांसाहार, आंबट आणि तळलेले पदार्थ बंद करा. कडू भाज्या खा."],
        therapies: ["**विरेचन**: शरीरातून आणि रक्तातून यूरिक ॲसिड बाहेर काढण्यासाठी विरेचन करा.", "**लेप चिकित्सा**: चंदन आणि मंजिष्ठाचा थंड लेप सांध्यांवर लावा.", "**रक्तमोक्षण (जळू)**: जळू लावून दूषित रक्त बाहेर काढा."]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार सांधेदुखी (आमवात / रुमॅटॉइड आर्थरायटिस)**: अपचन झालेले अन्न आणि कफ एकत्र येऊन सांध्यांमध्ये साठतात, ज्यामुळे सांध्यांवर सूज आणि सकाळी तीव्र अकडण जाणवते.",
        medicines: ["सिंहनाद गुग्गुल (दिवसातून दोनदा २ गोळ्या)", "रास्ना सप्तक काढा (दिवसातून दोनदा २५ml)", "त्रिकटु चूर्ण (जेवणापूर्वी १/२ चमचा)"],
        homeRemedies: ["**आले-एरंडेल तेल शेक**: एरंडेल तेलात सोंठ पावडर मिसळून सांध्यांना कोमट मालिश करा व शेका.", "**लंघन (उपवास)**: विषारी घटक (आम) पचवण्यासाठी आठवड्यातून एकदा उपवास ठेवा.", "**आहार नियम**: दही, थंड पदार्थ, मिठाई बंद करा. मुगाचे सूप आणि जुने तांदूळ खा."],
        therapies: ["**पत्रपोटली स्वेद**: औषधी पानांची पोटली करून सांधे शेकणे, ज्यामुळे कफ वितळतो आणि सूज कमी होते.", "**निरूह बस्ती**: काढ्याची बस्ती देणे.", "**कपालभाती**: कफ सुकवण्यासाठी दररोज २० मिनिटे कपालभाती करा."]
      }
    },
    sleep: {
      vata: {
        diagnosis: "**वात-प्रकार अनिद्रा (झोप न येणे)**: मेंदूत वात वाढल्याने मन अस्वस्थ होते, झोप लागत नाही आणि हलकी झोप लागते.",
        medicines: ["अश्वगंधा चूर्ण (झोपताना १ चमचा कोमट दुधासोबत)", "जटामांसी चूर्ण (झोपताना १ चमचा)", "ब्राह्मी घृत (१ चमचा कोमट दुधासोबत)"],
        homeRemedies: ["**जायफळ दूध**: झोपताना कोमट दुधात चिमूटभर जायफळ, अश्वगंधा आणि तूप टाकून प्या. हे मेंदूला शांत करते.", "**पादाभ्यंग (पायाची मालिश)**: सोनेण्यापूर्वी पायांच्या तळव्यांना कोमट तिळाच्या तेलाने १० मिनिटे मालिश करा.", "**आहार नियम**: रात्री हलका पण सकस आहार घ्या. सोनेण्यापूर्वी १ तास आधी स्क्रीन बंद करा."],
        therapies: ["**शिरोधारा**: कपाळावर कोमट तेलाची संतत धार सोडणे, अनिद्रा कमी करण्यासाठी सर्वात उत्तम उपाय आहे.", "**नस्य कर्म**: झोपण्यापूर्वी नाकपुड्यांमध्ये २-२ थेंब ब्राह्मी किंवा अणु तेल टाका.", "**योग निद्रा**: झोपण्यापूर्वी २० मिनिटे योग निद्रा करा."]
      },
      pitta: {
        diagnosis: "**पित्त-प्रकार अनिद्रा (रात्री झोप मोडणे)**: शरीरातील उष्णता आणि पित्त वाढल्याने रात्री २-३ वाजता जाग येते आणि पुन्हा झोप येत नाही.",
        medicines: ["ब्राह्मी कॅप्सूल (जेवणानंतर २ कॅप्सूल)", "चंदनाससव (२५ml पाण्यासोबत)", "प्रवाल पिष्टी (250mg गुलाब पाण्यासोबत)"],
        homeRemedies: ["**गुलाब-नारळ दूध**: नारळाच्या दुधात गुलाब पाणी आणि खडीसाखर टाकून रात्री प्या, यामुळे पित्त शांत होते.", "**चंदन लेप**: कपाळावर चंदनाचा थंड लेप लावा.", "**आहार नियम**: रात्रीच्या जेवणात तिखट किंवा मसालेदार पदार्थ खाऊ नका. खोली थंड ठेवा."],
        therapies: ["**तक्रधारा**: कपाळावर ताकाची शिरोधारा करणे, ज्यामुळे पित्त कमी होते.", "**विरेचन**: पित्त शांत करण्यासाठी वैद्यांच्या देखरेखीखाली विरेचन करा.", "**चंद्र भेदन प्राणायाम**: डाव्या नाकपुडीने श्वास घ्या."]
      },
      kapha: {
        diagnosis: "**कफ-प्रकार अनिद्रा (अति झोप / सुस्ती)**: अतिरिक्त कफामुळे दिवसभर झोप येणे, सकाळी उठण्यास त्रास होणे आणि शरीरात सुस्ती राहणे.",
        medicines: ["त्रिकटु चूर्ण (सकाळी रिकाम्या पोटी १/४ चमचा)", "आरोग्यवर्धिनी वटी (जेवणानंतर २ गोळ्या)"],
        homeRemedies: ["**आले-मिरी चहा**: आले, मिरी आणि तुळशीचा चहा दुधाशिवाय प्या. हे कफ वितळवते.", "**थंड पाण्याचे हबके**: सकाळी उठल्यावर चेहऱ्यावर थंड पाण्याचे हबके मारा.", "**आहार नियम**: सूर्योदयापूर्वी उठा. दुपारी झोपणे बंद करा. हलके जेवण घ्या."],
        therapies: ["**उद्वर्तन (सूखी मालिश)**: हर्बल पावडरने शरीराला घासून मालिश करणे.", "**कपालभाती**: सकाळी खाली पेट २० मिनिटे कपालभाती प्राणायाम करा."]
      }
    },
    general: {
      vata: {
        diagnosis: "**वात दोष असंतुलन**: शरीरात वात (हवा) वाढल्याने दुखणे, कोरडेपणा आणि बद्धकोष्ठता होते.",
        medicines: ["अश्वगंधा चूर्ण (झोपताना दुधासोबत १ चमचा)", "दशमूल काढा (दिवसातून दोनदा २५ml)"],
        homeRemedies: ["तिळाच्या तेलाने मालिश करा.", "सोताना गरम दूध प्या.", "नेहमी गरम आणि ताजे अन्न खा."],
        therapies: ["**अभ्यंग**: मालिश.", "**बस्ती**: औषधी तेल एनिमा."]
      },
      pitta: {
        diagnosis: "**पित्त दोष असंतुलन**: शरीरात पित्त (उष्णता) वाढल्याने छातीत जळजळ, ॲसिडिटी आणि चिडचिड होते.",
        medicines: ["अविपत्तिकर चूर्ण (झोपताना १ चमचा)", "शतावरी चूर्ण (१ चमचा)"],
        homeRemedies: ["रिकाम्या पोटी कोरफडीचा रस प्या.", "धने-बडीशेप चहा प्या.", "तिखट खाणे टाळा."],
        therapies: ["**विरेचन**: पित्त साफ करणे.", "**तक्रधारा**: ताकाची शिरोधारा."]
      },
      kapha: {
        diagnosis: "**कफ दोष असंतुलन**: शरीरात कफ वाढल्याने वजन वाढणे, आळस आणि जडपणा जाणवतो.",
        medicines: ["त्रिकटु चूर्ण (१/२ चमचा)", "आरोग्यवर्धिनी वटी (२ गोळ्या)"],
        homeRemedies: ["आले-मिरी चहा प्या.", "गोड आणि दुग्धजन्य पदार्थ बंद करा.", "व्यायाम करा."],
        therapies: ["**वमन**: औषधी उलटी.", "**उद्वर्तन**: चूर्ण मालिश."]
      }
    }
  }
};

function getLocalizedQuestions(category, lang) {
  const langSet = categoryQuestionsLocalized[lang] || categoryQuestionsLocalized.en;
  return langSet[category] || langSet.general;
}

// MAIN CONSULTATION ENDPOINT
exports.consultDoctor = (req, res) => {
  try {
    const { message, chatState } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    let state = chatState || {
      step: 0,
      language: "",
      name: "",
      weight: "",
      height: "",
      problem: "",
      duration: "",
      symptom: "",
      category: "general",
      scores: { vata: 0, pitta: 0, kapha: 0 }
    };

    const inputLower = message.toLowerCase();
    let reply = "";
    let recommendedProducts = [];
    let suggestedQuestions = [];
    let nextStep = state.step;
    let tx = null;
    let kbMatch = null;
    let dominantDosha = "";

    // Ensure state fields exist
    if (!state.scores) state.scores = { vata: 0, pitta: 0, kapha: 0 };
    if (!state.language) state.language = "";

    // ── STEP 0: Select Language ─────────────────────────
    if (state.step === 0) {
      let lang = 'en';
      if (inputLower.includes('hindi') || inputLower.includes('हिंदी')) {
        lang = 'hi';
      } else if (inputLower.includes('marathi') || inputLower.includes('मराठी')) {
        lang = 'mr';
      } else {
        lang = 'en';
      }
      state.language = lang;
      nextStep = 1;

      if (lang === 'hi') {
        reply = "नमस्ते 🙏 वेदनिदान एआई डॉक्टर में आपका स्वागत है। कृपया मुझे अपना **नाम** बताएं:";
      } else if (lang === 'mr') {
        reply = "नमस्ते 🙏 वेदनिदान एआय डॉक्टरमध्ये आपले स्वागत आहे. कृपया मला तुमचे **नाव** सांगा:";
      } else {
        reply = "Namaste 🙏 Welcome to VedNidan AI Doctor. Please tell me your **Name** to begin:";
      }
      suggestedQuestions = [];
    }

    // ── STEP 1: Enter Name ─────────────────────────────
    else if (state.step === 1) {
      state.name = message.trim();
      nextStep = 2;

      const lang = state.language;
      if (lang === 'hi') {
        reply = `धन्यवाद, **${state.name}**। कृपया अपना **वजन** (किलोग्राम में, जैसे: 70 kg) और **ऊंचाई** (जैसे: 175 cm या 5.8 feet) बताएं:`;
      } else if (lang === 'mr') {
        reply = `धन्यवाद, **${state.name}**. कृपया तुमचे **वजन** (किग्रॅ मध्ये, उदा: 70 kg) आणि **उंची** (उदा: 175 cm किंवा 5.8 feet) सांगा:`;
      } else {
        reply = `Thank you, **${state.name}**. Please enter your **Weight** (in kg, e.g., 70 kg) and **Height** (e.g., 175 cm or 5.8 feet):`;
      }
      suggestedQuestions = [];
    }

    // ── STEP 2: Enter Weight & Height ───────────────────
    else if (state.step === 2) {
      const parts = message.split(/,|\band\b/i);
      state.weight = parts[0] ? parts[0].trim() : message.trim();
      state.height = parts[1] ? parts[1].trim() : "";
      nextStep = 3;

      const lang = state.language;
      if (lang === 'hi') {
        reply = `ठीक है। आपकी मुख्य स्वास्थ्य समस्या या लक्षण क्या है? कृपया इसके बारे में विस्तार से बताएं (जैसे: जोड़ों का दर्द, त्वचा के मुंहासे, एसिडिटी, बाल झड़ना):`;
        suggestedQuestions = ["त्वचा और मुंहासे", "बालों का झड़ना", "अपच और एसिडिटी", "जोड़ों का दर्द", "अनिद्रा"];
      } else if (lang === 'mr') {
        reply = `ठीक आहे. तुमची मुख्य आरोग्य समस्या किंवा लक्षण काय आहे? कृपया याबद्दल सविस्तर सांगा (उदा: सांधेदुखी, त्वचेचे मुरुम, ॲसिडिटी, केस गळणे):`;
        suggestedQuestions = ["त्वचा आणि मुरुम", "केस गळणे", "अपचन आणि ॲसिडिटी", "सांधेदुखी", "अनिद्रा"];
      } else {
        reply = `Got it. What is your primary health concern or symptom? Please describe it in detail (e.g., joint pain, skin breakouts, acidity, hair fall):`;
        suggestedQuestions = ["Skin & Acne", "Hair Fall", "Acidity & Digestion", "Joint Pain", "Insomnia"];
      }
    }

    // ── STEP 3: Enter Problem ───────────────────────────
    else if (state.step === 3) {
      state.problem = message.trim();
      state.symptom = message.trim(); // alias
      state.category = classifySymptom(state.problem);
      nextStep = 4;

      const lang = state.language;
      if (lang === 'hi') {
        reply = `आप कितने समय से इस समस्या का सामना कर रहे हैं? (जैसे: 2 सप्ताह, 1 महीना, 6 महीने):`;
        suggestedQuestions = ["कुछ दिनों से", "1 सप्ताह से", "1 महीने से", "6 महीने से अधिक"];
      } else if (lang === 'mr') {
        reply = `तुम्ही किती काळापासून या समस्येचा सामना करत आहात? (उदा: २ आठवडे, १ महिना, ६ महिने):`;
        suggestedQuestions = ["काही दिवसांपासून", "१ आठवड्यापासून", "१ महिन्यापासून", "६ महिन्यांपेक्षा जास्त"];
      } else {
        reply = `How long have you been facing this problem? (e.g., 2 weeks, 1 month, 6 months):`;
        suggestedQuestions = ["A few days", "1 week", "1 month", "More than 6 months"];
      }
    }

    // ── STEP 4: Enter Duration ──────────────────────────
    else if (state.step === 4) {
      state.duration = message.trim();
      state.scores = { vata: 0, pitta: 0, kapha: 0 };
      nextStep = 5; // Start Question 1 (index 0)

      const lang = state.language;
      const qSet = getLocalizedQuestions(state.category, lang);
      const q = qSet[0];

      if (lang === 'hi') {
        reply = `धन्यवाद। आपकी पूरी जानकारी दर्ज कर ली गई है। समस्या के सटीक आयुर्वेदिक उपचार, थेरेपी और दवाओं के निर्धारण के लिए कृपया नीचे दिए गए 7 प्रश्नों के उत्तर दें:\n\n**प्रश्न 1**: ${q.q}`;
      } else if (lang === 'mr') {
        reply = `धन्यवाद. तुमची सर्व माहिती नोंदवली गेली आहे. समस्येच्या अचूक आयुर्वेदिक उपचार, थेरपी आणि औषध निश्चितीसाठी कृपया खालील ७ प्रश्नांची उत्तरे द्या:\n\n**प्रश्न १**: ${q.q}`;
      } else {
        reply = `Thank you. Your details are recorded. To determine the most authentic Ayurvedic treatment, therapy, and medicines for your condition, please answer the following 7 diagnostic questions:\n\n**Question 1**: ${q.q}`;
      }
      suggestedQuestions = q.opts.map(o => `${o.k}) ${o.t}`);
    }

    // ── STEP 5–11: Diagnostic questions (1 to 7) ────────
    else if (state.step >= 5 && state.step <= 11) {
      const lang = state.language;
      const qSet = getLocalizedQuestions(state.category, lang);
      const currentQIdx = state.step - 5;
      const currentQ = qSet[currentQIdx];

      // Detect answer A / B / C
      let scoreChoice = null;
      if (inputLower.match(/^a[\s)\.]/i) || inputLower === 'a' || (currentQ && currentQ.opts[0] && inputLower.includes(currentQ.opts[0].t.toLowerCase().slice(0, 10)))) {
        scoreChoice = currentQ.opts[0].s;
      } else if (inputLower.match(/^b[\s)\.]/i) || inputLower === 'b' || (currentQ && currentQ.opts[1] && inputLower.includes(currentQ.opts[1].t.toLowerCase().slice(0, 10)))) {
        scoreChoice = currentQ.opts[1].s;
      } else if (inputLower.match(/^c[\s)\.]/i) || inputLower === 'c' || (currentQ && currentQ.opts[2] && inputLower.includes(currentQ.opts[2].t.toLowerCase().slice(0, 10)))) {
        scoreChoice = currentQ.opts[2].s;
      } else {
        // Keyword fallback
        const vataKw  = ['dry','gas','anxious','fear','cold','crack','variable','irre','thin','constip','light sleep','worry','scatter','fragi','रूखी','सूखी','खुरदरी','कब्ज','चिंता','हवा','अकड़न','कोरडी','बद्धकोष्ठता'];
        const pittaKw = ['acid','hot','sweat','anger','acne','red','inflam','burn','spicy','yellow','loose','irrit','compet','एसिडिटी','जलन','लाल','मुंहासे','गुस्सा','गरम','पित्त','जळजळ','लालसरपणा','राग','उष्णता'];
        const kaphaKw = ['heavy','sluggish','deep sleep','oily','thick','mucus','slow','damp','weight','congestion','sad','withdraw','मोटी','नम','चिपचिपी','भारी','आलस','कफ','बलगम','सुस्ती','जाड','ओलसर','चिकट','कफज'];
        const vS = vataKw.filter(k => inputLower.includes(k)).length;
        const pS = pittaKw.filter(k => inputLower.includes(k)).length;
        const kS = kaphaKw.filter(k => inputLower.includes(k)).length;
        scoreChoice = vS >= pS && vS >= kS ? 'vata' : pS >= kS ? 'pitta' : 'kapha';
      }

      state.scores[scoreChoice] = (state.scores[scoreChoice] || 0) + 1;

      if (state.step < 11) {
        nextStep = state.step + 1;
        const nextQ = qSet[nextStep - 5];
        const qNum = nextStep - 4;

        if (lang === 'hi') {
          reply = `✓ नोट किया गया। प्रश्न ${qNum} (7 में से):\n\n${nextQ.q}`;
        } else if (lang === 'mr') {
          reply = `✓ नोंदवले. प्रश्न ${qNum} (७ पैकी):\n\n${nextQ.q}`;
        } else {
          reply = `✓ Noted. Question ${qNum} of 7:\n\n${nextQ.q}`;
        }
        suggestedQuestions = nextQ.opts.map(o => `${o.k}) ${o.t}`);
      } else {
        // ── Final: Generate authentic treatment report in selected language ────
        nextStep = 12;
        const { vata, pitta, kapha } = state.scores;

        dominantDosha = vata >= pitta && vata >= kapha ? 'vata'
                          : pitta >= kapha ? 'pitta' : 'kapha';

        // Dual dosha labels
        let doshaLabel = dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1);
        let doshaTranslation = doshaLabel;
        if (lang === 'hi') {
          doshaTranslation = dominantDosha === 'vata' ? 'वात (Vata)' : dominantDosha === 'pitta' ? 'पित्त (Pitta)' : 'कफ (Kapha)';
        } else if (lang === 'mr') {
          doshaTranslation = dominantDosha === 'vata' ? 'वात (Vata)' : dominantDosha === 'pitta' ? 'पित्त (Pitta)' : 'कफ (Kapha)';
        }

        if (vata === pitta && vata > kapha) { 
          dominantDosha = 'vata'; 
          doshaLabel = 'Vata-Pitta (Dual)';
          doshaTranslation = lang === 'hi' ? 'द्विदोषज वात-पित्त (Vata-Pitta)' : lang === 'mr' ? 'द्विदोषज वात-पित्त (Vata-Pitta)' : 'Vata-Pitta (Dual)';
        } else if (pitta === kapha && pitta > vata) { 
          dominantDosha = 'pitta'; 
          doshaLabel = 'Pitta-Kapha (Dual)';
          doshaTranslation = lang === 'hi' ? 'द्विदोषज पित्त-कफ (Pitta-Kapha)' : lang === 'mr' ? 'द्विदोषज पित्त-कफ (Pitta-Kapha)' : 'Pitta-Kapha (Dual)';
        } else if (vata === kapha && vata > pitta) { 
          dominantDosha = 'vata'; 
          doshaLabel = 'Vata-Kapha (Dual)';
          doshaTranslation = lang === 'hi' ? 'द्विदोषज वात-कफ (Vata-Kapha)' : lang === 'mr' ? 'द्विदोषज वात-कफ (Vata-Kapha)' : 'Vata-Kapha (Dual)';
        }

        // Fetch treatments (localized if available, fallback to english)
        tx = null;
        if (lang !== 'en' && treatmentsLocalized[lang] && treatmentsLocalized[lang][state.category]) {
          tx = treatmentsLocalized[lang][state.category][dominantDosha];
        }
        if (!tx) {
          const catTreatments = treatments[state.category] || treatments['general'];
          tx = catTreatments[dominantDosha];
        }
        
        // Search Knowledge Base for richer disease-specific treatment if user problem matches
        kbMatch = null;
        if (knowledgeBase.length > 0) {
          const probLower = (state.problem || '').toLowerCase();
          const catLower = (state.category || '').toLowerCase();
          
          kbMatch = knowledgeBase.find(item => {
            const disease = (item.Disease || '').toLowerCase();
            const hindiName = (item['Hindi Name'] || '').toLowerCase();
            const marathiName = (item['Marathi Name'] || '').toLowerCase();
            const symptoms = (item.Symptoms || '').toLowerCase();
            return probLower.includes(disease) || disease.includes(probLower) ||
                   probLower.includes(hindiName) || probLower.includes(marathiName) ||
                   symptoms.split(',').some(s => probLower.includes(s.trim()));
          });

          if (kbMatch) {
            console.log(`[AI Doctor] Matched Knowledge Base Disease: ${kbMatch.Disease}`);
          }
        }

        if (!tx && kbMatch) {
          tx = {
            diagnosis: `**${kbMatch.Disease} (${kbMatch['Hindi Name'] || kbMatch['Marathi Name'] || ''})**: ${kbMatch.Symptoms}. Primary Dosha affect: ${kbMatch.Doshas || dominantDosha}. ${kbMatch['Diet and Lifestyle Recommendations'] || ''}`,
            medicines: [
              kbMatch['Ayurvedic Herbs'] ? `Ayurvedic Herbs: ${kbMatch['Ayurvedic Herbs']}` : '',
              kbMatch.Formulation ? `Formulation: ${kbMatch.Formulation}` : '',
              kbMatch['Medical Intervention'] ? `Medical Support: ${kbMatch['Medical Intervention']}` : ''
            ].filter(Boolean),
            homeRemedies: [
              kbMatch['Herbal/Alternative Remedies'] ? `Herbal Remedy: ${kbMatch['Herbal/Alternative Remedies']}` : '',
              kbMatch['Diet and Lifestyle Recommendations'] ? `Diet & Lifestyle: ${kbMatch['Diet and Lifestyle Recommendations']}` : '',
              kbMatch.Prevention ? `Prevention: ${kbMatch.Prevention}` : ''
            ].filter(Boolean),
            therapies: [
              kbMatch['Yoga & Physical Therapy'] ? `Yoga Therapy: ${kbMatch['Yoga & Physical Therapy']}` : '',
              kbMatch['Diagnosis & Tests'] ? `Recommended Tests: ${kbMatch['Diagnosis & Tests']}` : ''
            ].filter(Boolean)
          };
        }

        if (!tx) {
          tx = buildFallbackTreatment(dominantDosha, state.problem);
        }

        // Fetch matching products
        try {
          const products = getProducts();
          recommendedProducts = products.filter((_, i) => i < 4);
        } catch(e) { recommendedProducts = []; }

        const medicineList  = tx.medicines.map(m => `  - ${m}`).join('\n');
        const remedyList    = tx.homeRemedies.map(r => `  - ${r}`).join('\n');
        const therapyList   = tx.therapies.map(t => `  - ${t}`).join('\n');

        if (lang === 'hi') {
          reply = `## 🌿 वेदनिदान आयुर्वेदिक परामर्श रिपोर्ट (Charaka Consultation Report)\n\n` +
            `---\n\n` +
            `### 📋 रोगी का नाम और विवरण (Patient Information)\n` +
            `- **नाम**: ${state.name}\n` +
            `- **वजन**: ${state.weight || "अनिर्दिष्ट"} | **ऊंचाई**: ${state.height || "अनिर्दिष्ट"}\n` +
            `- **समस्या की अवधि**: ${state.duration}\n` +
            `- **मुख्य चिंता**: *"${state.problem}"*\n\n` +
            `---\n\n` +
            `### 🔬 दोष विश्लेषण (Prakriti-Vikriti Assessment)\n` +
            `| दोष (Dosha) | स्कोर (Score) |\n|---|---|\n| 🌬 वात (Vata) | ${vata}/7 |\n| 🔥 पित्त (Pitta) | ${pitta}/7 |\n| 🌊 कफ (Kapha) | ${kapha}/7 |\n\n` +
            `**प्रमुख असंतुलन (Primary Imbalance): ${doshaTranslation}**\n\n` +
            `---\n\n` +
            `### 🩺 शास्त्रीय आयुर्वेदिक निदान (Classical Diagnosis)\n${tx.diagnosis}\n\n` +
            `---\n\n` +
            `### 💊 शास्त्रीय आयुर्वेदिक औषधियां (Shastra-Okta Aushadhi)\n` +
            `*चरक संहिता एवं अष्टांग हृदयम सूत्रों के आधार पर प्राचीन औषधियां:*\n${medicineList}\n\n` +
            `> ⚠️ **निर्देश**: शास्त्रीय औषधियों का सेवन करने से पहले किसी पंजीकृत आयुर्वेदिक चिकित्सक (वैद्य) से परामर्श अवश्य लें।\n\n` +
            `---\n\n` +
            `### 🏡 प्रामाणिक घरेलू उपचार (Grihya Chikitsa)\n` +
            `*चरक संहिता सूत्र स्थान के अनुसार रसोईघर आधारित उपचार:*\n${remedyList}\n\n` +
            `---\n\n` +
            `### 🧘 शास्त्रीय पंचकर्म और थेरेपी (Panchakarma & Therapy Prescription)\n` +
            `*चरक चिकित्सा स्थान के अनुसार प्रस्तावित थेरेपी:*\n${therapyList}\n\n` +
            `---\n\n` +
            `### 📅 फॉलो-अप और मार्गदर्शन (Follow-up)\n` +
            `- इस दिनचर्या और उपचार का न्यूनतम **21 दिनों** तक पालन करें।\n` +
            `- पंचकर्म प्रक्रियाओं (जैसे वमन, विरेचन, बस्ती) के लिए क्लिनिक में जाकर प्रत्यक्ष वैद्य परामर्श करें।\n` +
            `- इन-क्लिनिक थेरेपी सत्रों को बुक करने के लिए **Book Therapist** (थेरेपिस्ट बुकिंग) अनुभाग का उपयोग करें।\n\n` +
            `*ईश्वर आपको उत्तम स्वास्थ्य प्रदान करें — आयु, आरोग्य, सुख।* 🙏`;

          suggestedQuestions = ["नया परामर्श शुरू करें", "थेरेपी सत्र बुक करें", "पंचकर्म क्या है?", "मेरे दोष के बारे में बताएं"];
        } else if (lang === 'mr') {
          reply = `## 🌿 वेदनिदान आयुर्वेदिक सल्लागार अहवाल (Charaka Consultation Report)\n\n` +
            `---\n\n` +
            `### 📋 रुग्णाचे नाव आणि तपशील (Patient Information)\n` +
            `- **नाव**: ${state.name}\n` +
            `- **वजन**: ${state.weight || "अनिर्दिष्ट"} | **उंची**: ${state.height || "अनिर्दिष्ट"}\n` +
            `- **समस्येचा कालावधी**: ${state.duration}\n` +
            `- **मुख्य चिंता**: *"${state.problem}"*\n\n` +
            `---\n\n` +
            `### 🔬 दोष विश्लेषण (Prakriti-Vikriti Assessment)\n` +
            `| दोष (Dosha) | गुण (Score) |\n|---|---|\n| 🌬 वात (Vata) | ${vata}/7 |\n| 🔥 पित्त (Pitta) | ${pitta}/7 |\n| 🌊 कफ (Kapha) | ${kapha}/7 |\n\n` +
            `**मुख्य असंतुलन (Primary Imbalance): ${doshaTranslation}**\n\n` +
            `---\n\n` +
            `### 🩺 शास्त्रीय आयुर्वेदिक निदान (Classical Diagnosis)\n${tx.diagnosis}\n\n` +
            `---\n\n` +
            `### 💊 शास्त्रीय आयुर्वेदिक औषधे (Shastra-Okta Aushadhi)\n` +
            `*चरक संहिता आणि अष्टांग हृदयमच्या सूत्रांवर आधारित औषधे:*\n${medicineList}\n\n` +
            `> ⚠️ **टीप**: शास्त्रीय औषधे सुरू करण्यापूर्वी नोंदणीकृत आयुर्वेदिक डॉक्टरांचा (वैद्यांचा) सल्ला जरूर घ्यावा.\n\n` +
            `---\n\n` +
            `### 🏡 अस्सल घरगुती उपाय (Grihya Chikitsa)\n` +
            `*स्वयंपाकघरातील शास्त्रीय उपचार:*\n${remedyList}\n\n` +
            `---\n\n` +
            `### 🧘 शास्त्रीय पंचकर्म आणि थेरपी (Panchakarma & Therapy Prescription)\n` +
            `*पारंपारिक आयुर्वेदिक उपचार पद्धती:*\n${therapyList}\n\n` +
            `---\n\n` +
            `### 📅 पुढील मार्गदर्शन (Follow-up)\n` +
            `- या नियमांचे आणि उपचारांचे किमान **२१ दिवस** पालन करा.\n` +
            `- प्रत्यक्ष पंचकर्म उपचारांसाठी वैद्यांचा सल्ला घ्या.\n` +
            `- क्लिनिकमधील उपचारांसाठी **Book Therapist** (थेरपिस्ट बुकिंग) विभागाचा वापर करा.\n\n` +
            `*तुम्हाला उत्तम आरोग्य लाभो हीच प्रार्थना — आयु, आरोग्य, सुख।* 🙏`;

          suggestedQuestions = ["नवीन सल्ला सुरू करा", "थेरपी सत्र बुक करा", "पंचकर्म म्हणजे काय?", "माझ्या दोषाबद्दल सांगा"];
        } else {
          reply = `## 🌿 VedNidan Ayurvedic Consultation Report\n\n` +
            `---\n\n` +
            `### 📋 Patient Details\n` +
            `- **Name**: ${state.name}\n` +
            `- **Weight**: ${state.weight || "Not specified"} | **Height**: ${state.height || "Not specified"}\n` +
            `- **Duration of Problem**: ${state.duration}\n` +
            `- **Main Concern**: *"${state.problem}"*\n\n` +
            `---\n\n` +
            `### 🔬 Dosha Analysis (Prakriti-Vikriti Assessment)\n` +
            `| Dosha | Score |\n|---|---|\n| 🌬 Vata | ${vata}/7 |\n| 🔥 Pitta | ${pitta}/7 |\n| 🌊 Kapha | ${kapha}/7 |\n\n` +
            `**Primary Imbalance: ${doshaLabel}**\n\n` +
            `---\n\n` +
            `### 🩺 Classical Ayurvedic Diagnosis\n${tx.diagnosis}\n\n` +
            `---\n\n` +
            `### 💊 Classical Ayurvedic Medicines (Shastra-Okta Aushadhi)\n` +
            `*Based on Charaka Samhita and formulation texts:*\n${medicineList}\n\n` +
            `> ⚠️ Dosage guidance provided. Consult a registered Vaidya before starting classical formulations.\n\n` +
            `---\n\n` +
            `### 🏡 Authentic Home Remedies (Grihya Chikitsa)\n` +
            `*Classical kitchen-based treatments:*\n${remedyList}\n\n` +
            `---\n\n` +
            `### 🧘 Classical Panchakarma & Therapy Prescription\n` +
            `*Traditional Ayurvedic therapies:*\n${therapyList}\n\n` +
            `---\n\n` +
            `### 📅 Follow-up Guidance\n` +
            `- Follow this protocol for a minimum of **21 days** before expecting changes.\n` +
            `- Book a **physical Vaidya consultation** for Panchakarma procedures (Basti, Vamana, Virechana).\n` +
            `- Use the **Book Therapist** section to schedule your in-clinic Ayurvedic therapy sessions.\n\n` +
            `*May you be blessed with Swastha (perfect health) — Ayu, Aarogya, Sukha.* 🙏`;

          suggestedQuestions = ["Start New Consultation", "Book a Therapy Session", "What is Panchakarma?", "Explain my Dosha"];
        }
      }
    }

    // ── STEP 12+: Reset / Post-consultation options ─────────────────────
    else {
      state = {
        step: 0,
        language: "",
        name: "",
        weight: "",
        height: "",
        problem: "",
        duration: "",
        symptom: "",
        category: "general",
        scores: { vata: 0, pitta: 0, kapha: 0 }
      };
      nextStep = 0;
      reply = `Namaste 🙏 Welcome back to VedNidan AI Doctor.\nPlease choose your preferred language to begin / कृपया अपनी पसंदीदा भाषा चुनें / कृपया तुमची सोयीची भाषा निवडा:`;
      suggestedQuestions = ["English", "Hindi (हिंदी)", "Marathi (मराठी)"];
    }

    state.step = nextStep;

    // Log consultation report to consultation_logs.json when completed (step 12)
    if (nextStep === 12 && tx) {
      try {
        const logFile = path.join(__dirname, '../data/consultation_logs.json');
        let logs = [];
        if (fs.existsSync(logFile)) {
          logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
        }
        logs.unshift({
          id: 'CONS-' + Date.now(),
          timestamp: new Date().toISOString(),
          name: state.name,
          age: state.age || '',
          gender: state.gender || '',
          address: state.address || 'Online Tele-Consult',
          weight: state.weight,
          height: state.height,
          problem: state.problem,
          duration: state.duration,
          category: state.category,
          dominantDosha,
          scores: state.scores,
          language: state.language,
          diagnosis: tx.diagnosis,
          medicines: tx.medicines,
          homeRemedies: tx.homeRemedies,
          therapies: tx.therapies
        });
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
      } catch (logErr) {
        console.error('[AI Doctor] Error saving consultation log:', logErr);
      }
    }

    return res.json({ reply, chatState: state, recommendedProducts, suggestedQuestions, treatment: tx, kbMatch });

  } catch (error) {
    console.error('[Charak AI Error]', error);
    return res.status(500).json({ message: 'Error processing Ayurvedic consultation' });
  }
};
