import { AppMode } from "./types";

export const LIGHTING_OPTIONS = [
  'Light (Terang)',
  'Dark (Gelap)'
];

export const LOCATION_OPTIONS = [
  'Indoor',
  'Outdoor'
];

export const AMBIENCE_OPTIONS = [
  'Bersih Minimalis',
  'Mewah Gelap',
  'Ceria Warna-warni',
  'Alam Organik',
  'Futuristik Modern',
  'Vintage Klasik',
  'Industrial Raw',
  'Pastel Dreamy',
  'Elegant Gold',
  'Rustic Warm'
];

export const MODEL_TYPES = [
  'Manusia Asli',
  'Manekin Kain'
];

export const VISUAL_STYLES = [
  'Minimalis',
  'Natural',
  'Sunset',
  'Urban',
  'Elegan',
  'Vintage',
  'Cinematic',
  'High Fashion',
  'Street Style',
  'Bohemian'
];

export const GENDERS = [
  'Wanita',
  'Pria'
];

export const HIJAB_OPTIONS = [
  'Non Hijab',
  'Hijab Modern',
  'Hijab Syari'
];

export const MODES = [
  { id: AppMode.POV, label: 'POV Tangan', icon: 'hand' },
  { id: AppMode.PRODUK, label: 'Foto Produk', icon: 'package' },
  { id: AppMode.MODEL, label: 'Model', icon: 'user' },
];

export const MODEL_POSES = [
  "Walking casually towards the camera, dynamic motion blur on background.",
  "Standing confidently with hands in pockets or resting on hips, 3/4 angle.",
  "Sitting elegantly on a modern chair or steps, relaxed posture.",
  "Candid shot looking away from camera, laughing or smiling naturally.",
  "Lean-in pose, leaning against a wall or surface, engaging with the viewer.",
  "Holding the product close to the face/body to show detail, shallow depth of field.",
  "Full body walking away slightly but looking back over the shoulder.",
  "Sitting cross-legged on the floor or a rug, casual and cozy vibe.",
  "Action shot, interacting dynamically with the product (e.g., using it).",
  "Minimalist standing pose, straight on, fashion editorial style."
];

export const MODEL_BG_VARIATIONS = [
  "Depth of field focused on model, blurry bokeh background.",
  "Sharp, clean architectural background with leading lines.",
  "Soft, diffused natural window light, dreamy atmosphere.",
  "Direct sunlight creating interesting shadow patterns on the wall.",
  "Golden hour backlight, creating a halo effect around the model.",
  "Studio style infinity curve background with subtle gradient.",
  "Urban texture background (concrete, brick) for contrast.",
  "Nature background with dappled light filtering through trees.",
  "Cozy interior background with warm lamp lighting.",
  "Clean monochromatic background matching the outfit palette."
];

export const POV_HAND_VARIATIONS = [
  "The hand is wearing a delicate gold ring on the thumb and has manicured nails.",
  "The person is wearing a cozy black knitted long-sleeve sweater that partially covers the palm.",
  "The person is wearing a warm brown aesthetic chunky knit sweater sleeve.",
  "The hand is wearing a stylish silver thumb ring and a white silk blouse sleeve.",
  "The person is wearing an oversized beige hoodie sleeve, creating a relaxed and comfy vibe.",
  "The hand is accessorized with a simple thin gold bracelet and a soft pink cardigan sleeve.",
  "The person is wearing a dark grey textured long-sleeve top, looking elegant and modern.",
  "The hand has a clean, natural look with a simple vintage ring on the index finger.",
  "The person is wearing a cream-colored cable knit sweater, perfect for a warm aesthetic.",
  "The hand is wearing a black watch and a denim jacket sleeve for a casual daily look."
];

export const POV_AESTHETIC_PROMPTS = [
  "soft warm-toned workspace background with a clean white desk, gentle yellow ambient light illuminating a beige wall, a vase filled with fresh white daisies casting natural shadows, a small round mirror reflecting the flowers, a white pegboard filled with cute minimal decorations and pastel cards, stacked books on the desk, subtle acrylic drawer storage with colorful stationery; cozy, feminine, bright, and aesthetically organized desk setting perfect for calm POV product review.",
  "bright pastel workspace with a white desk, cream-colored faux brick wall background, soft warm lighting, a vase of pale yellow tulips on the left, a decorative vintage mirror, pastel storage crates holding stationery, cute small plush decor, pink and beige organizers, a hanging minimalist calendar and zodiac-themed pastel poster; clean, gentle, pastel aesthetic setup ideal for soft, cute POV product review.",
  "neatly arranged pastel workstation with glossy white desk surface, white pegboard wall decorated with pink aesthetic posters, mounted white keyboard, hanging headphones, soft plush decor, a vase of tulips, small faux plants, pastel organizers holding pens and small items, warm soft ambient lighting creating a cozy glow; modern pastel desk environment with a cute organized vibe, suitable for clean POV review shots.",
  "clean Scandinavian minimalist desk, natural morning sunlight streaming through white sheer curtains, light oak wood desk surface, a ceramic cup of matcha latte, a small succulent plant in a white pot, open notebook with a pen, blurred white bookshelf in the background; fresh, airy, organic aesthetic, high key lighting, perfect for lifestyle POV.",
  "cozy evening study desk setup, warm fairy lights draped on the wall, soft beige aesthetic, a burning vanilla candle, a laptop with a lo-fi study screen, a fluffy cream rug visible, mug of hot cocoa; intimate, warm, relaxing atmosphere, low light photography style for POV.",
  "glossy marble countertop background, luxury cosmetic aesthetic, rose gold accessories, fresh pink peonies in a glass vase, soft diffuse studio lighting, blurred vanity mirror in background; elegant, chic, high-end beauty influencer style POV.",
  "sunny windowsill setup, white wooden surface, dappled sunlight through leaves casting artistic shadows, a glass of iced coffee, aesthetic magazines stacked, fresh lemons in a bowl; vibrant, summer vibes, natural light, high contrast artistic POV.",
  "cloud-themed dreamy workspace, baby blue and white color palette, fluffy cloud shaped decor, white desk, soft blue led backlight, pastel blue keyboard, cute anime figurines blurred in background; kawaii, dreamy, soft focus aesthetic POV.",
  "earthy boho desk setup, rattan placemat, dried pampas grass in a clay vase, terracotta color tones, warm sunlight, wooden accessories, textured linen tablecloth; natural, grounded, warm aesthetic for organic product POV.",
  "fresh green and white botanical workspace, many indoor plants (monstera, pothos) framing the shot, white desk, green glass vase, nature-inspired stationery, bright daylight; refreshing, organic, eco-friendly vibe POV."
];

export const PRODUCT_AESTHETIC_PROMPTS = [
  "soft pastel pink water surface with smooth ripples and natural reflections, warm sunlight casting organic shadows, gentle waves forming flowing texture, minimal dreamy aesthetic; one product placed partially submerged in the water, slightly tilted with a long shadow cast on the surface, clean high-end commercial style",
  "vibrant pink glossy background covered with airy foamy bubbles, soft soap-foam texture forming organic shapes, luminous bubble reflections; one product positioned embedded inside the foam, centered and slightly angled forward, surrounded by round bubbles, premium clean commercial lighting",
  "warm golden gradient background transitioning from cream to honey yellow, glossy liquid spill forming flowing shapes, elegant high-end aesthetic; three products arranged in a stacked composition, slightly leaning on each other with subtle reflections on the liquid surface, luxurious studio lighting",
  "A soft pastel pink scene with a smooth gradient background. A large textured ribbon bow hangs at the top, with long flowing satin ribbons creating elegant curves around the frame. The product is suspended slightly below the bow, tied with thin strings, appearing gently angled and floating in the air. Lighting is soft, diffused, and dreamy, emphasizing a delicate and feminine aesthetic.",
  "A bright pastel-pink flatlay setup with a gift-box theme. A square box filled with curled satin ribbons sits at the center, surrounded by glossy pearl-like spheres. The background is a smooth monochrome pink surface. The product is positioned inside the box, nestled among the ribbons, slightly tilted as if resting organically. The overall mood is playful, cute, and elegant.",
  "A warm, cozy spa-inspired scene with golden ambient lighting. Soft glowing candles illuminate a neutral beige background. A wooden tray sits at the center, decorated with chamomile flowers and green leaves. Wisps of gentle mist float across the foreground. The product rests on top of the wooden tray, slightly angled, blending into the cozy, spa-like atmosphere with warm directional lighting.",
  "A creative studio setup with a curved pastel-pink paper backdrop taped at the top, creating a smooth rolling surface. Decorative elements like strawberries, glass containers, and small props add visual interest. The product is positioned in the center on a minimal pedestal, upright and slightly separated from the other objects, with soft, even photographic lighting.",
  "A saturated pink background with a glossy satin ribbon arranged into flowing loops and curves around the frame. The product is placed in the center, partially wrapped by the ribbon, creating a gift-like presentation. The lighting is even and clean, enhancing the smooth and luxurious feel of the setup.",
  "A beach-inspired scene with fine golden sand covering most of the frame. Several seashells are scattered naturally around, creating a coastal atmosphere. The product is partially buried in the sand, positioned at a slight angle as if gently pressed into the surface. Lighting is bright and natural, mimicking strong daylight.",
  "A warm, earthy setting with a soft beige fabric draped in natural folds around the scene. A round wooden tray sits at the center, decorated with chamomile flowers and green leaves. Wisps of gentle mist float across the foreground. The product rests on top of the wooden tray, slightly angled, blending into the cozy, spa-like atmosphere with warm directional lighting.",
  "A romantic, luminous setup with soft peach roses arranged around a shimmering water surface. Ripples and reflections create a glowing, dreamy texture across the scene. The product stands upright in the center, casting a clear shadow on the watery background. Lighting is bright, warm, and diffused, enhancing the delicate floral mood.",
  "A serene spa-like environment with smooth rounded stones placed along the edge of a calm turquoise pool. Frangipani flowers float or rest near the stones, adding a tropical touch. The product lies on the water’s surface, slightly tilted, creating subtle ripples around it. Lighting is soft and natural, enhancing the peaceful ambiance.",
  "A minimal, elegant scene with a silky white fabric draped in smooth, flowing waves across the background and floor. Warm sunlight streaks through from one side, creating soft shadows and glowing highlights on the folds. A round podium sits in the center, ready to hold a product, with a clean and luxurious atmosphere.",
  "A refreshing aqua-blue scene with a reflective water surface. A round pedestal sits at the center, partially submerged, creating soft ripples around it. A dynamic water splash rises dramatically above the pedestal, frozen in motion with crystal-clear droplets scattered across the frame. Sunlight streams from above, casting soft beams and bright highlights through the misty atmosphere. Blurred green leaves appear in the background, adding a natural, breezy feel. The product should be positioned on the pedestal, interacting with the splash as if emerging from the water, slightly angled or upright depending on the desired composition.",
  "A dreamy pastel-pink environment filled with soft, luminous soap bubbles floating throughout the scene. The background features smooth curved shapes and a warm, diffused spotlight creating gentle shadows. Dense white foam covers the lower part of the frame with round glossy shapes partially submerged. The product stands in the center, placed inside the foam and slightly surrounded by bubbles, appearing upright and cleanly lit. Lighting is soft and warm to emphasize the playful and delicate atmosphere.",
  "A raw industrial concrete pedestal scene with harsh, dramatic shadows. A beam of light cuts through a dark grey minimalist background. The product is highlighted on the texture concrete block, creating a modern, edgy, streetwear or tech vibe.",
  "A lush mossy forest floor with dappled sunlight filtering through canopy leaves. Small ferns and river stones surround the product, which rests on a natural piece of driftwood. The atmosphere is fresh, organic, and deeply connected to nature.",
  "A sleek modern kitchen marble island countertop. Out of focus in the background are high-end appliances and a bowl of fresh citrus fruits. The product is placed cleanly on the marble, with a sharp reflection. Bright, clean, morning lighting suitable for home goods.",
  "A futuristic neon grid background with floating geometric shapes. Cyberpunk color palette with cyan and magenta rim lighting. The product floats in the center, illuminated by the glow, giving a high-tech gaming or electronic vibe.",
  "A luxurious red velvet podium stage with a single spotlight. Deep red curtains drape in the background. Gold confetti falls gently around the product. The atmosphere is premium, exclusive, and celebratory."
];