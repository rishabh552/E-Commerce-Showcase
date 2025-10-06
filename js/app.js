// js/app.js

/***********************
 * Safety: make sure products are available
 ***********************/
(function ensureProductsLoaded(){
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const hasData = Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
  if (!hasData) {
    console.error("products.js not loaded or empty. Check /js/products.js path, order, or syntax.");
    if (empty) {
      empty.hidden = false;
      empty.textContent = "⚠️ Couldn't load products. Check that /js/products.js exists and loads before app.js.";
    }
    throw new Error("PRODUCTS not available");
  }
})();

/***********************
 * Utilities
 ***********************/
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function formatINR(n){
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
function stars(r){
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - half);
}
function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function catSlug(c){ return slugify(c); }

/***********************
 * Local-first image candidates, then remote, then visible fallback
 ***********************/
function localCandidatesFor(p, idx = 0, size = {w:800, h:600}) {
  const s = slugify(p.name);
  const c = catSlug(p.category);
  return [
    // Per-product WEBP/JPG/PNG (1..3)
    `assets/products/${s}-1.webp`, `assets/products/${s}-2.webp`, `assets/products/${s}-3.webp`,
    `assets/products/${s}-1.jpg`,  `assets/products/${s}-2.jpg`,  `assets/products/${s}-3.jpg`,
    `assets/products/${s}-1.png`,  `assets/products/${s}-2.png`,  `assets/products/${s}-3.png`,
    // Category defaults
    `assets/defaults/${c}-1.webp`, `assets/defaults/${c}-2.webp`,
    `assets/defaults/${c}-1.jpg`,  `assets/defaults/${c}-2.jpg`,
    `assets/defaults/${c}-1.png`,  `assets/defaults/${c}-2.png`,
  ];
}
function remoteCandidatesFor(p, idx = 0, size = {w:800, h:600}) {
  const slug = slugify(p.name);
  return [
    ...(p.images || []), // if you ever add URLs in products.js
    `https://picsum.photos/seed/${slug}-${idx}/${size.w}/${size.h}`,
    `https://source.unsplash.com/${size.w}x${size.h}/?${encodeURIComponent(p.category)}`
  ];
}
function candidateImagesFor(p, size = {w:800, h:600}, idx = 0) {
  return [...localCandidatesFor(p, idx, size), ...remoteCandidatesFor(p, idx, size)];
}
function mediaFallbackEl(text){
  const el = document.createElement('div');
  el.className = 'media-fallback';
  const initials = text.split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase();
  el.innerHTML = `<span>${initials}</span>`;
  return el;
}
function createSmartImage(candidates, alt, onTotalFailure){
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.alt = alt;

  img._candidates = candidates.filter(Boolean);
  img._i = 0;

  const tryNext = () => {
    if (img._i < img._candidates.length){
      img.src = img._candidates[img._i++];
    } else {
      img.onerror = null;
      if (onTotalFailure) onTotalFailure(img);
    }
  };
  img.onerror = tryNext;
  tryNext();
  return img;
}

/***********************
 * Data normalization
 ***********************/
const PRODUCTS = window.PRODUCTS.map((p, i) => ({ ...p, _index: i }));

/***********************
 * State & DOM
 ***********************/
const state = {
  query: "",
  categories: new Set(),
  priceMin: 0,
  priceMax: 0,
  sort: "featured",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]"))
};

const grid = $("#grid");
const empty = $("#empty");
const resultCount = $("#resultCount");
const searchInput = $("#search");
const clearSearchBtn = $("#clearSearch");
const categoryChips = $("#categoryChips");
const minPriceInput = $("#minPrice");
const maxPriceInput = $("#maxPrice");
const sortSelect = $("#sort");
const clearAllBtn = $("#clearAll");
const featuredSection = $("#featuredSection");
const featuredWrapper = $("#featuredWrapper");
const toast = $("#toast");

// Modal
const modalBackdrop = $("#modalBackdrop");
const modalClose = $("#modalClose");
const modalTitle = $("#modalTitle");
const modalRating = $("#modalRating");
const modalPrice = $("#modalPrice");
const modalDesc = $("#modalDesc");
const modalTags = $("#modalTags");
const modalMainImage = $("#modalMainImage");
const modalThumbs = $("#modalThumbs");
const shareBtn = $("#shareBtn");

let lastFocusedEl = null;

/***********************
 * Init: categories & prices
 ***********************/
const CATEGORIES = Array.from(new Set(PRODUCTS.map(p => p.category))).sort();
const [GLOBAL_MIN, GLOBAL_MAX] = (() => {
  const prices = PRODUCTS.map(p => p.price);
  return [Math.min(...prices), Math.max(...prices)];
})();
state.priceMin = GLOBAL_MIN;
state.priceMax = GLOBAL_MAX;
minPriceInput.value = String(GLOBAL_MIN);
maxPriceInput.value = String(GLOBAL_MAX);

// Category display icons
const CATEGORY_ICONS = {
  "Coffee & Tea": "🫖",
  "Snacks & Sweets": "🍪",
  "Home Decor": "🪔",
  "Handmade Crafts": "🧶",
  "Skincare & Wellness": "🪷"
};

function makeChip(category, displayText){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.setAttribute("aria-pressed", "false");
  btn.dataset.category = category;
  btn.innerHTML = displayText;
  btn.addEventListener("click", () => {
    const cat = btn.dataset.category;
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!pressed));
    if (pressed) state.categories.delete(cat);
    else state.categories.add(cat);
    render();
  });
  return btn;
}

const allChip = makeChip("__ALL__", "✨ All");
allChip.addEventListener("click", () => {
  state.categories.clear();
  $$(".chip", categoryChips).forEach(c => c.setAttribute("aria-pressed", c === allChip ? "true" : "false"));
  render();
});
categoryChips.append(allChip);
allChip.setAttribute("aria-pressed", "true");
CATEGORIES.forEach(cat => {
  const label = `${CATEGORY_ICONS[cat] || "🛍️"} ${cat}`;
  categoryChips.append(makeChip(cat, label));
});

/***********************
 * Rendering
 ***********************/
function applyFilters(list){
  const q = state.query.trim().toLowerCase();
  const cats = state.categories;

  const byCategory = cats.size === 0 ? list : list.filter(p => cats.has(p.category));
  const byQuery = q ? byCategory.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q)) ||
    p.description.toLowerCase().includes(q)
  ) : byCategory;
  const byPrice = byQuery.filter(p => p.price >= state.priceMin && p.price <= state.priceMax);

  const sorted = [...byPrice].sort((a, b) => {
    switch (state.sort) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "rating-desc": return b.rating - a.rating;
      case "featured":
      default: {
        const w = (p) => p.badge === "NEW" ? 2 : p.badge === "SALE" ? 1 : 0;
        const diff = w(b) - w(a);
        if (diff !== 0) return diff;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a._index - b._index;
      }
    }
  });
  return sorted;
}

function card(p){
  const li = document.createElement("article");
  li.className = "card";
  li.setAttribute("role", "listitem");
  li.dataset.id = p.id;

  const media = document.createElement("div");
  media.className = "media";

  const img = createSmartImage(
    candidateImagesFor(p),
    p.name,
    () => { img.hidden = true; media.appendChild(mediaFallbackEl(p.name)); }
  );
  media.appendChild(img);

  const fav = document.createElement("button");
  fav.className = "favorite";
  fav.type = "button";
  fav.setAttribute("aria-label", "Toggle favorite");
  const favOn = state.favorites.has(p.id);
  fav.setAttribute("aria-pressed", String(favOn));
  fav.innerHTML = favOn ? "❤" : "♡";
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    const nowOn = !(fav.getAttribute("aria-pressed") === "true");
    fav.setAttribute("aria-pressed", String(nowOn));
    fav.innerHTML = nowOn ? "❤" : "♡";
    if (nowOn) state.favorites.add(p.id); else state.favorites.delete(p.id);
    localStorage.setItem("favorites", JSON.stringify([...state.favorites]));
  });
  media.appendChild(fav);

  if (p.badge) {
    const b = document.createElement("div");
    b.className = "badge";
    b.textContent = p.badge;
    media.appendChild(b);
  }

  const body = document.createElement("div");
  body.className = "body";
  const name = document.createElement("div");
  name.className = "name"; name.textContent = p.name;
  const cat = document.createElement("div");
  cat.className = "muted"; cat.textContent = p.category;
  const price = document.createElement("div");
  price.className = "price"; price.textContent = formatINR(p.price);
  const rating = document.createElement("div");
  rating.className = "stars"; rating.setAttribute("aria-label", `Rating ${p.rating} out of 5`);
  rating.textContent = stars(p.rating);
  body.append(name, cat, price, rating);

  const actions = document.createElement("div");
  actions.className = "actions";
  const quick = document.createElement("button");
  quick.className = "btn primary";
  quick.textContent = "Quick View";
  quick.addEventListener("click", () => openModal(p.id));
  const share = document.createElement("button");
  share.className = "btn";
  share.textContent = "Share";
  share.addEventListener("click", async () => {
    const url = new URL(window.location);
    url.hash = `product-${p.id}`;
    await copyToClipboard(url.toString());
    showToast("Product link copied");
  });
  actions.append(quick, share);

  li.append(media, body, actions);
  li.addEventListener("click", (e) => {
    if (e.target.closest(".favorite")) return;
    openModal(p.id);
  });

  return li;
}

function render(){
  allChip.setAttribute("aria-pressed", String(state.categories.size === 0));

  const min = Number(minPriceInput.value) || GLOBAL_MIN;
  const max = Number(maxPriceInput.value) || GLOBAL_MAX;
  state.priceMin = min;
  state.priceMax = max;

  const filtered = applyFilters(PRODUCTS);
  
  grid.innerHTML = "";
  empty.hidden = filtered.length > 0;
  
  if (filtered.length === 0) {
    empty.textContent = "No products match your criteria. Try adjusting your filters.";
  } else {
    filtered.forEach(p => grid.appendChild(card(p)));
  }
  
  if (resultCount) {
    resultCount.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
  }
}

/***********************
 * Event Listeners
 ***********************/
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    render();
  });
}

if (minPriceInput) {
  minPriceInput.addEventListener("input", render);
}

if (maxPriceInput) {
  maxPriceInput.addEventListener("input", render);
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
}

if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    state.query = "";
    state.categories.clear();
    state.priceMin = GLOBAL_MIN;
    state.priceMax = GLOBAL_MAX;
    if (searchInput) searchInput.value = "";
    if (minPriceInput) minPriceInput.value = String(GLOBAL_MIN);
    if (maxPriceInput) maxPriceInput.value = String(GLOBAL_MAX);
    if (sortSelect) sortSelect.value = "featured";
    $$(".chip", categoryChips).forEach(c => c.setAttribute("aria-pressed", c === allChip ? "true" : "false"));
    render();
  });
}

/***********************
 * Modal functionality
 ***********************/
function openModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  lastFocusedEl = document.activeElement;
  
  if (modalTitle) modalTitle.textContent = product.name;
  if (modalRating) {
    modalRating.textContent = stars(product.rating);
    modalRating.setAttribute("aria-label", `Rating ${product.rating} out of 5`);
  }
  if (modalPrice) modalPrice.textContent = formatINR(product.price);
  if (modalDesc) modalDesc.textContent = product.description;
  
  if (modalTags) {
    modalTags.innerHTML = "";
    product.tags.forEach(tag => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      modalTags.appendChild(span);
    });
  }
  
  if (modalMainImage && modalThumbs) {
    const images = candidateImagesFor(product);
    modalMainImage.innerHTML = "";
    modalThumbs.innerHTML = "";
    
    const mainImg = createSmartImage(
      images,
      product.name,
      () => { 
        modalMainImage.innerHTML = "";
        modalMainImage.appendChild(mediaFallbackEl(product.name)); 
      }
    );
    modalMainImage.appendChild(mainImg);
    
    // Create thumbnails (up to 3)
    for (let i = 0; i < Math.min(3, images.length); i++) {
      const thumb = createSmartImage(
        candidateImagesFor(product, {w: 150, h: 150}, i),
        `${product.name} view ${i + 1}`,
        () => {}
      );
      thumb.className = i === 0 ? "active" : "";
      thumb.addEventListener("click", () => {
        $$("img", modalThumbs).forEach(t => t.className = "");
        thumb.className = "active";
        modalMainImage.innerHTML = "";
        const newMain = createSmartImage(
          candidateImagesFor(product, {w: 800, h: 600}, i),
          product.name,
          () => { 
            modalMainImage.innerHTML = "";
            modalMainImage.appendChild(mediaFallbackEl(product.name)); 
          }
        );
        modalMainImage.appendChild(newMain);
      });
      modalThumbs.appendChild(thumb);
    }
  }
  
  modalBackdrop.classList.add("open");
  if (modalClose) modalClose.focus();
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  if (lastFocusedEl) {
    lastFocusedEl.focus();
    lastFocusedEl = null;
  }
}

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBackdrop.classList.contains("open")) {
    closeModal();
  }
});

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const url = new URL(window.location);
    const productId = modalTitle?.textContent;
    if (productId) {
      const product = PRODUCTS.find(p => p.name === productId);
      if (product) {
        url.hash = `product-${product.id}`;
        await copyToClipboard(url.toString());
        showToast("Product link copied");
      }
    }
  });
}

/***********************
 * Utility functions
 ***********************/
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  }
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/***********************
 * Initialize
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  render();
  
  // Handle URL hash for direct product links
  if (window.location.hash.startsWith("#product-")) {
    const productId = window.location.hash.replace("#product-", "");
    if (PRODUCTS.find(p => p.id === productId)) {
      openModal(productId);
    }
  }
});

// Handle browser back/forward with modal
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#product-")) {
    const productId = window.location.hash.replace("#product-", "");
    if (PRODUCTS.find(p => p.id === productId)) {
      openModal(productId);
    }
  } else if (modalBackdrop.classList.contains("open")) {
    closeModal();
  }
});