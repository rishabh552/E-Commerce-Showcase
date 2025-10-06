// js/products.js
// Keep this file tiny: just the data. The app will look for local images first,
// then remote placeholders, then show a built-in initials fallback.

// IMPORTANT: assign to window so app.js can read it reliably.
window.PRODUCTS = [
  { id: 1,  name: "Masala Chai Loose Leaf", category: "Coffee & Tea", price: 299, rating: 4.7, badge: "NEW",
    tags: ["Assam", "spiced", "aromatic"], 
    description: "Robust Assam tea with cardamom, ginger, and clove for a classic masala chai."
  },
  { id: 2,  name: "South Indian Filter Coffee Decoction (250ml)", category: "Coffee & Tea", price: 349, rating: 4.8, badge: "",
    tags: ["arabica-robusta", "strong", "ready to mix"], 
    description: "Brewed the traditional way for a bold cup. Mix 1:2 with hot milk."
  },
  { id: 3,  name: "Nankhatai Cookies (12pc)", category: "Snacks & Sweets", price: 199, rating: 4.6, badge: "",
    tags: ["shortbread", "festive", "giftable"], 
    description: "Buttery cardamom shortbread baked in small batches for melt-in-mouth joy."
  },
  { id: 4,  name: "Kaju Katli (250g)", category: "Snacks & Sweets", price: 399, rating: 4.7, badge: "SALE",
    tags: ["cashew", "silver vark", "classic"], 
    description: "Silky cashew fudge with a delicate sweetness. A timeless favourite."
  },
  { id: 5,  name: "Khakhra Variety Pack (6pcs)", category: "Snacks & Sweets", price: 249, rating: 4.5, badge: "",
    tags: ["roasted", "masala", "Gujarati"], 
    description: "Thin, crunchy khakhras in jeera, methi, and masala flavours."
  },
  { id: 6,  name: "Alphonso Mango Jam (300g)", category: "Snacks & Sweets", price: 249, rating: 4.6, badge: "",
    tags: ["Aam", "natural", "no preservatives"], 
    description: "Sun-ripened Ratnagiri Alphonso mangoes slow-cooked into a bright, fruity jam."
  },
  { id: 7,  name: "Brass Diyas Set (4pc)", category: "Home Decor", price: 699, rating: 4.8, badge: "",
    tags: ["hand-polished", "festive", "traditional"], 
    description: "Solid brass deepams with a timeless sheen—perfect for puja and décor."
  },
  { id: 8,  name: "Terracotta Planter (Medium)", category: "Home Decor", price: 549, rating: 4.7, badge: "",
    tags: ["handmade", "breathable", "natural"], 
    description: "Wheel-thrown terracotta planter that keeps roots cool and happy."
  },
  { id: 9,  name: "Madhubani Coaster Set (6pc)", category: "Handmade Crafts", price: 499, rating: 4.7, badge: "NEW",
    tags: ["folk art", "hand-painted", "giftable"], 
    description: "Each coaster features a unique, hand-painted Madhubani motif."
  },
  { id:10,  name: "Neem Wood Comb", category: "Handmade Crafts", price: 149, rating: 4.6, badge: "",
    tags: ["fine teeth", "handcrafted", "sustainable"], 
    description: "Smooth, anti-static comb carved from neem wood with a pleasant natural feel."
  },
  { id:11,  name: "Sandalwood Incense Sticks (40)", category: "Home Decor", price: 129, rating: 4.5, badge: "",
    tags: ["calming", "natural oils", "long burn"], 
    description: "Warm, woody fragrance for a soothing ambience during work or meditation."
  },
  { id:12,  name: "Cold-Pressed Coconut Oil (500ml)", category: "Skincare & Wellness", price: 349, rating: 4.6, badge: "",
    tags: ["hair care", "skin care", "edible"], 
    description: "Multi-use coconut oil—great for cooking and daily self-care routines."
  }
];
