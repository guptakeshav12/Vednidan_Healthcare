const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'products.json');
const therapiesFilePath = path.join(__dirname, 'therapies.json');

const herbs = [
  { name: "Ashwagandha", dosha: "Balances Vata and Kapha, gently increases Pitta in excess.", category: "vitality" },
  { name: "Triphala", dosha: "Tridoshic (Balances Vata, Pitta, and Kapha).", category: "digestion" },
  { name: "Kumkumadi Saffron", dosha: "Balances Pitta and Vata, helps dry skin.", category: "skincare" },
  { name: "Bhringraj", dosha: "Cools excess Pitta, balances Vata.", category: "haircare" },
  { name: "Chyawanprash", dosha: "Tridoshic rejuvenator (Rasayana).", category: "immunity" },
  { name: "Brahmi", dosha: "Balances Sadhaka Pitta and Prana Vata.", category: "brain" },
  { name: "Shatavari", dosha: "Pacifies Pitta and Vata, increases Kapha in excess.", category: "vitality" },
  { name: "Neem", dosha: "Balances Kapha and Pitta (anti-inflammatory).", category: "skincare" },
  { name: "Giloy Guduci", dosha: "Balances Pitta and Kapha, builds Ojas.", category: "immunity" },
  { name: "Shankhpushpi", dosha: "Balances Vata, Pitta, and Kapha; calms brain.", category: "brain" },
  { name: "Guggulu Co-enzyme", dosha: "Clears Kapha blockage, supports joints.", category: "vitality" },
  { name: "Haridra Turmeric", dosha: "Balances Pitta and Kapha; anti-inflammatory.", category: "skincare" },
  { name: "Tulsi Holy Basil", dosha: "Balances Kapha and Vata; builds respiration.", category: "immunity" },
  { name: "Yashtimadhu Licorice", dosha: "Balances Vata and Pitta; clears throat.", category: "digestion" },
  { name: "Manjistha Madder Root", dosha: "Deeply pacifies Pitta; purifies blood.", category: "skincare" }
];

const forms = [
  { type: "Vati (Tablet)", suffix: "Tablet for daily convenience", priceMultiplier: 1.2 },
  { type: "Capsule", suffix: "Standardized organic capsule", priceMultiplier: 1.4 },
  { type: "Churna (Powder)", suffix: "Traditional raw powder formulation", priceMultiplier: 0.8 },
  { type: "Kwath (Decoction)", suffix: "Infusion herbs for decoction tea", priceMultiplier: 0.9 },
  { type: "Kada (Concentrate)", suffix: "High-potency liquid wellness concentrate", priceMultiplier: 1.1 },
  { type: "Taila (Oil)", suffix: "Medicated oil for physical application", priceMultiplier: 1.5 },
  { type: "Syrup", suffix: "Sweetened herbal liquid elixir", priceMultiplier: 0.85 }
];

const prefixes = ["VedNidan", "Premium", "Organic", "Shuddha", "Classical", "Himalayan", "Divya", "Amrit", "Siddha", "Ayur"];
const goals = ["Immunity", "Vitality", "Digestion", "Skincare", "Haircare", "Memory & Focus", "Joint Support", "Detoxification", "Respiratory Shield", "Rejuvenation"];

function seedDatabase() {
  console.log("Generating 10,000+ Ayurvedic products...");
  
  const products = [];
  let productCount = 0;
  
  // First, include our initial 10 high-quality products to preserve manual designs
  const initialProducts = [
    { id: 1, name: "Ashwagandha KSM-66 Capsules", category: "vitality", price: 499, originalPrice: 599, rating: 4.8, reviewsCount: 124, image: "/assets/ashwagandha.png", badge: "Best Seller", shortDescription: "Clinically proven stress relief, stamina, and mental calm support.", longDescription: "VedNidan Ashwagandha KSM-66 represents the peak of adaptogenic technology...", ingredients: ["Ashwagandha extract"], usage: "1 cap daily", dosha: "Balances Vata and Kapha" },
    { id: 2, name: "Triphala Digestive Detox Juice", category: "digestion", price: 349, originalPrice: 399, rating: 4.7, reviewsCount: 98, image: "/assets/triphala.png", badge: "100% Organic", shortDescription: "Traditional digestion and daily detox.", longDescription: "Formulated from fresh Amla, Haritaki, and Bibhitaki.", ingredients: ["Amla", "Haritaki", "Bibhitaki"], usage: "30ml in morning", dosha: "Tridoshic" },
    { id: 3, name: "Kumkumadi Radiance Face Oil", category: "skincare", price: 799, originalPrice: 999, rating: 4.9, reviewsCount: 142, image: "/assets/kumkumadi.png", badge: "Premium Glow", shortDescription: "Saffron-infused facial oil to reduce dark spots and brighten skin.", longDescription: "Crafted with pure Kashmiri Saffron.", ingredients: ["Saffron", "Sandalwood"], usage: "3 drops at night", dosha: "Balances Pitta and Vata" },
    { id: 4, name: "Bhringraj Intense Hair Oil", category: "haircare", price: 399, originalPrice: 475, rating: 4.6, reviewsCount: 85, image: "/assets/bhringraj.png", badge: "Hair Growth", shortDescription: "Combats hair fall and promotes deep root nourishment.", longDescription: "Ancient Kshir Pak recipe.", ingredients: ["Bhringraj", "Amla"], usage: "Massage warm oil", dosha: "Cools Pitta" },
    { id: 5, name: "Premium Gold Chyawanprash", category: "immunity", price: 549, originalPrice: 625, rating: 4.8, reviewsCount: 210, image: "/assets/chyawanprash.png", badge: "Best Seller", shortDescription: "Fortified with Pure Gold, Silver, and Saffron.", longDescription: "40+ powerful herbs with gold particles.", ingredients: ["Swarna Bhasma", "Amla"], usage: "1 tbsp daily", dosha: "Tridoshic" },
    { id: 6, name: "Brahmi Focus & Memory Syrup", category: "brain", price: 279, originalPrice: 320, rating: 4.7, reviewsCount: 76, image: "/assets/brahmi.png", badge: "Brain Booster", shortDescription: "Enhances focus, cognitive clarity, and memory retention.", longDescription: "Formulated with Brahmi and Shankhpushpi.", ingredients: ["Brahmi", "Shankhpushpi"], usage: "2 tsp twice daily", dosha: "Balances Sadhaka Pitta" },
    { id: 7, name: "Shatavari Balance Capsules", category: "vitality", price: 425, originalPrice: 495, rating: 4.8, reviewsCount: 89, image: "/assets/shatavari.png", badge: "Women's Health", shortDescription: "Supports female hormonal balance and reproductive vitality.", longDescription: "Pure Asparagus Racemosus roots.", ingredients: ["Shatavari extract"], usage: "1 capsule twice daily", dosha: "Balances Pitta & Vata" },
    { id: 8, name: "Neem & Turmeric Cleansing Wash", category: "skincare", price: 249, originalPrice: 299, rating: 4.5, reviewsCount: 115, image: "/assets/neem_turmeric.png", badge: "Anti-Acne", shortDescription: "Deeply purifies skin, controls oil, and fights acne.", longDescription: "Antibacterial Neem and anti-inflammatory Turmeric.", ingredients: ["Neem", "Turmeric"], usage: "Massage on wet face", dosha: "Balances Kapha & Pitta" },
    { id: 9, name: "Amla & Giloy Immunity Juice", category: "immunity", price: 299, originalPrice: 349, rating: 4.6, reviewsCount: 62, image: "/assets/amla_giloy.png", badge: "100% Organic", shortDescription: "Vitamin C powerhouse to build seasonal defenses.", longDescription: "A pure blend of Amla and Giloy.", ingredients: ["Amla", "Giloy"], usage: "30ml in warm water", dosha: "Balances Pitta and Kapha" },
    { id: 10, name: "Amrit Kalash Herbal Ghee", category: "vitality", price: 899, originalPrice: 1100, rating: 4.9, reviewsCount: 54, image: "/assets/amrit_ghee.png", badge: "Premium Vitality", shortDescription: "A2 Ghee infused with 22 anti-aging Rasayana herbs.", longDescription: "Formulated to enhance cellular memory and lifespan.", ingredients: ["A2 Ghee", "Shatavari", "Brahmi"], usage: "1 tsp in morning", dosha: "Tridoshic" }
  ];

  initialProducts.forEach(p => {
    products.push(p);
    productCount = Math.max(productCount, p.id);
  });

  // Generate algorithmically up to 10,200 products
  let loopCounter = 0;
  while (products.length < 10200) {
    const herb = herbs[loopCounter % herbs.length];
    const form = forms[Math.floor(loopCounter / herbs.length) % forms.length];
    const prefix = prefixes[Math.floor(loopCounter / (herbs.length * forms.length)) % prefixes.length];
    const goal = goals[Math.floor(loopCounter / (herbs.length * forms.length * prefixes.length)) % goals.length];
    
    productCount++;
    const name = `${prefix} ${herb.name} ${form.type} (${goal})`;
    
    // Deterministic price based on character count and multipliers
    const basePrice = 150 + ((name.length * 7) % 350);
    const price = Math.round(basePrice * form.priceMultiplier);
    const originalPrice = Math.round(price * 1.25);
    const rating = parseFloat((4.0 + ((name.length % 10) / 10)).toFixed(1));
    const reviewsCount = 5 + (name.length * 3) % 200;
    
    // Assign generic placeholder images based on category/type
    let image = "/assets/ashwagandha.png";
    if (herb.category === "skincare") image = "/assets/kumkumadi.png";
    else if (herb.category === "haircare") image = "/assets/bhringraj.png";
    else if (form.type.includes("Juice") || form.type.includes("Decoction") || form.type.includes("Syrup")) image = "/assets/triphala.png";
    else if (herb.category === "immunity") image = "/assets/chyawanprash.png";
    
    let badge = "";
    if (productCount % 12 === 0) badge = "New Launch";
    else if (productCount % 15 === 0) badge = "Value Pack";
    else if (productCount % 20 === 0) badge = "Recommended";

    products.push({
      id: productCount,
      name,
      category: herb.category,
      price,
      originalPrice,
      rating,
      reviewsCount,
      image,
      badge: badge || null,
      shortDescription: `A premium traditional ${form.suffix} featuring purified ${herb.name} extracts to support ${goal.toLowerCase()}.`,
      longDescription: `This certified Ayurvedic formulation by VedNidan is prepared in deep compliance with original texts. Combining cold-processed organic ${herb.name} with standard ${form.type} stabilizers. Promotes rapid absorption and targeted cellular delivery to achieve comprehensive ${goal.toLowerCase()}.`,
      ingredients: [`Purified ${herb.name} extract`, "Herb adjuncts", "GMP certified base stabilizers"],
      usage: `Take as directed by your Ayurvedic physician. Standard dosage: 1 unit twice daily after meals.`,
      dosha: herb.dosha
    });

    loopCounter++;
  }

  fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
  console.log(`Successfully generated and saved ${products.length} products to products.json.`);

  // Generate 1,000+ Therapies
  console.log("Generating 1,000+ Ayurvedic therapies...");
  
  const therapies = [];
  const primaryTherapies = [
    { name: "Abhyanga", desc: "Full body warm oil massage using customized Dosha-specific tailas to relieve stress, improve circulation, and build immunity.", action: "Nourishing & Detoxing" },
    { name: "Shirodhara", desc: "Continuous pouring of warm medicated liquids (milk, oils, buttermilk) onto the third eye chakra to calm mental anxieties and alleviate sleep issues.", action: "Calming & Grounding" },
    { name: "Nasya", desc: "Instilling herbal oils or nasal drops into the sinus cavity to clear phlegm congestion, relieve chronic headaches, and focus the mind.", action: "Sinus Clearance" },
    { name: "Basti (Karma)", desc: "Enema therapy using warm medicated oils and herbal decoctions. Rebalances the large intestine, the seat of Vata.", action: "Vata Grounding" },
    { name: "Janu Basti", desc: "A circular dam of black gram dough built over the knee joint, filled with warm medicated pain-relieving oils.", action: "Joint Pain Relief" },
    { name: "Kati Basti", desc: "Warm oil pooling therapy over the lumbar sacral spinal region to treat sciatica and chronic back spasms.", action: "Lower Back Care" },
    { name: "Udvartana", desc: "Dry herbal powder body scrub massaged in reverse strokes to stimulate circulation, break down fat deposits, and scrub skin.", action: "Cellulite & Sluggishness" },
    { name: "Greeva Basti", desc: "Medicated oil pooling therapy over the cervical spine area to cure neck stiffness and cervical spondylosis.", action: "Neck Pain Relief" },
    { name: "Netra Tarpana", desc: "Pouring warm liquid medicated ghee into a flour dam built around the eyes to soothe optic nerves and dry eyes.", action: "Eye Strain Rejuvenation" },
    { name: "Svedana", desc: "Herbal steam chamber treatment following full body massage to induce sweating and eliminate deeply rooted wastes.", action: "Detoxification" }
  ];

  let therapyCount = 0;
  let tLoop = 0;
  while (therapies.length < 1050) {
    const baseT = primaryTherapies[tLoop % primaryTherapies.length];
    const prefix = prefixes[Math.floor(tLoop / primaryTherapies.length) % prefixes.length];
    const goal = goals[Math.floor(tLoop / (primaryTherapies.length * prefixes.length)) % goals.length];
    
    therapyCount++;
    const name = `${prefix} ${baseT.name} Treatment (${goal})`;
    const price = 800 + ((tLoop * 13) % 2500);
    const duration = 30 + ((tLoop * 5) % 90); // 30 to 120 mins
    
    // Map indication categories
    let indication = "general";
    if (goal.includes("Immunity") || goal.includes("Detox")) indication = "immunity";
    else if (goal.includes("Digestion")) indication = "digestion";
    else if (goal.includes("Skincare")) indication = "skincare";
    else if (goal.includes("Hair")) indication = "haircare";
    else if (goal.includes("Memory") || goal.includes("Vitality")) indication = "brain";
    else if (goal.includes("Joint")) indication = "vitality";

    therapies.push({
      id: therapyCount,
      name,
      duration: `${duration} mins`,
      price,
      indication,
      action: baseT.action,
      description: `A customized clinical session of ${baseT.name} prepared under the ${prefix} traditions. Designed specifically to maximize therapeutic benefits for ${goal.toLowerCase()}. ${baseT.desc}`,
      recommendation: `Recommended frequency: 3 to 7 sessions depending on Vata/Pitta/Kapha diagnostics.`
    });

    tLoop++;
  }

  fs.writeFileSync(therapiesFilePath, JSON.stringify(therapies, null, 2));
  console.log(`Successfully generated and saved ${therapies.length} therapies to therapies.json.`);
}

seedDatabase();
