let businesses = [];
let filtered = [];
let currentTab = 'all';

// ── FAVOURITES ──
function getFavourites() {
  try { return JSON.parse(localStorage.getItem('oll_favourites') || '[]'); }
  catch(e) { return []; }
}

function toggleFavourite(id) {
  let favs = getFavourites();
  const idx = favs.indexOf(id);
  if (idx > -1) { favs.splice(idx, 1); }
  else { favs.push(id); }
  localStorage.setItem('oll_favourites', JSON.stringify(favs));
  updateFavCount();
  // re-render to reflect heart state or re-filter if on favs tab
  if (currentTab === 'favs') applyFilters();
  else {
    const btn = document.querySelector(`.heart-btn[data-id="${id}"]`);
    if (btn) {
      const saved = favs.includes(id);
      btn.classList.toggle('saved', saved);
      btn.setAttribute('aria-label', saved ? 'Remove from favourites' : 'Add to favourites');
      btn.textContent = saved ? '♥' : '♡';
      btn.style.color = saved ? '#e11d48' : '#aaa';
    }
  }
}

function updateFavCount() {
  const count = getFavourites().length;
  const el = document.getElementById('fav-count');
  if (el) el.textContent = count;
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-all').classList.toggle('active', tab === 'all');
  document.getElementById('tab-favs').classList.toggle('active', tab === 'favs');
  applyFilters();
}

// ── LOAD ──
async function loadBusinesses() {
  try {
    const res = await fetch('businesses.json');
    businesses = await res.json();
    filtered = [...businesses];
    renderBubbles();
    updateFavCount();
    renderGrid();
  } catch(e) { console.error('Could not load businesses.json', e); }
}

// ── STARS ──
function renderStars(rating) {
  if (!rating) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── ICONS / COLOURS ──
const CAT_ICONS = {
  'Makeup Artist':'💄','Hairdresser/Hair Stylist':'✂️','Bridal Makeup':'👰','Lash Artist':'👁️',
  'Nail Tech':'💅','Skincare':'🧴','Spray Tan':'✨','Massage & Wellness':'💆',
  'Personal Trainer':'💪','Home Studio':'🎨',
  'Photographer':'📷','Videographer':'🎥','Graphic Designer':'🖌️','Content Creator':'📱',
  'DJ & Music':'🎵','Live Entertainment':'🎤',
  'Cake Maker':'🎂','Catering':'🍽️','Home Baker':'🧁','Personal Chef':'👨‍🍳','Food Truck':'🚚','Coffee & Drinks':'☕',
  'Gardener & Landscaping':'🌿','Handyman':'🔨','Cleaner':'🧹',
  'Painter & Decorator':'🖼️','Pool & Spa Care':'🏊',
  'Event Planner':'📋','Florist':'🌸','Venue':'🏛️','Wedding Vendor':'💍',
  'Hire & Styling':'🛋️','Face Painter & Entertainment':'🎭',
  'Naturopath & Wellness':'🌱','Counselling & Coaching':'🧠',
  'Kids Activities':'🎈','Family Daycare':'🏠','Babysitter/Nanny':'👶',
  'Electrician':'⚡','Plumber':'🔧','Builder':'🏗️','Pest Control':'🐛','Car & Auto':'🚗',
  'Jeweller':'💎','Candle Maker':'🕯️','Dress Alterations & Sewing':'🧵',
  'Hair Accessories':'🎀','Laser Cutting & Homewares':'✂️','Kids Clothing':'👗',
  'Personalised Gifts':'🎁','Other':'⭐'
};
const CAT_COLORS = {
  'Makeup Artist':'#FFF0E8','Hairdresser/Hair Stylist':'#F2E7FF','Bridal Makeup':'#FFF0E8',
  'Lash Artist':'#E0F7FA','Nail Tech':'#EDE7F6','Skincare':'#E8EAF6',
  'Spray Tan':'#FBE9E7','Massage & Wellness':'#F3E5F5','Personal Trainer':'#FFF0E8',
  'Home Studio':'#F2E7FF','Photographer':'#E7F0FF','Videographer':'#EDE7F6',
  'Graphic Designer':'#F2E7FF','Content Creator':'#FFF0E8','DJ & Music':'#E0F2F1',
  'Live Entertainment':'#FCE4EC','Cake Maker':'#FFF8E1','Catering':'#FFF3E0',
  'Home Baker':'#FFF8E1','Personal Chef':'#FFF3E0','Food Truck':'#FFF3E0','Coffee & Drinks':'#FFF8E1',
  'Gardener & Landscaping':'#E8F5E9','Handyman':'#E3F2FD','Cleaner':'#E8F5E9',
  'Painter & Decorator':'#FFF0E8','Pool & Spa Care':'#E0F7FA','Event Planner':'#E3F2FD',
  'Florist':'#E8F5E9','Venue':'#F9FBE7','Wedding Vendor':'#FCE4EC',
  'Hire & Styling':'#F2E7FF','Face Painter & Entertainment':'#FCE4EC',
  'Naturopath & Wellness':'#E8F5E9','Counselling & Coaching':'#F2E7FF',
  'Kids Activities':'#FFF8E1','Family Daycare':'#FFF0E8','Babysitter/Nanny':'#FFF0E8',
  'Electrician':'#FFF8E1','Plumber':'#E3F2FD','Builder':'#E3F2FD',
  'Pest Control':'#E8F5E9','Car & Auto':'#E3F2FD','Jeweller':'#F2E7FF',
  'Candle Maker':'#FFF8E1','Dress Alterations & Sewing':'#FCE4EC',
  'Hair Accessories':'#FCE4EC','Laser Cutting & Homewares':'#F2E7FF',
  'Kids Clothing':'#FCE4EC','Personalised Gifts':'#FFF0E8','Other':'#F2E7FF'
};

function getBg(cats) { return CAT_COLORS[cats?.[0]] || '#F2E7FF'; }
function getIcon(cats) {
  for (const c of (cats || [])) if (CAT_ICONS[c]) return CAT_ICONS[c];
  return '⭐';
}

// ── BUBBLES ──
function getTopCategories(n) {
  const counts = {};
  businesses.forEach(b => (b.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([cat]) => cat);
}

let activeBubble = null;

function renderBubbles() {
  const wrap = document.getElementById('bubbles-wrap');
  if (!wrap) return;
  const top5 = getTopCategories(5);
  wrap.innerHTML = top5.map(cat =>
    `<span class="bubble" data-cat="${cat}" onclick="filterBubble('${cat}', this)">
      <span class="bubble-icon">${CAT_ICONS[cat] || '⭐'}</span>
      <span class="bubble-label">${cat}</span>
    </span>`
  ).join('') + `<a href="categories.html" class="bubble-see-all">
      <span class="bubble-icon">→</span>
      <span class="bubble-label">See all</span>
    </a>`;
}

function filterBubble(cat, el) {
  if (activeBubble === cat) {
    activeBubble = null;
    el.classList.remove('active');
    document.getElementById('filter-category').value = '';
  } else {
    activeBubble = cat;
    document.querySelectorAll('.bubble').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('filter-category').value = cat;
  }
  // sync dropdown
  document.querySelectorAll('.bubble').forEach(b => b.classList.remove('active'));
  if (activeBubble) el.classList.add('active');
  applyFilters();
}

// ── GRID ──
function renderGrid() {
  const grid = document.getElementById('business-grid');
  const countEl = document.getElementById('result-count');
  const favs = getFavourites();

  let list = filtered;
  if (currentTab === 'favs') {
    list = businesses.filter(b => favs.includes(b.id));
  }

  if (countEl) countEl.textContent = list.length === 1 ? '1 business' : `${list.length} businesses`;

  if (currentTab === 'favs' && list.length === 0) {
    grid.innerHTML = `
      <div class="empty-favs">
        <div class="icon">🤍</div>
        <h3>No favourites yet</h3>
        <p>Tap the ♡ heart on any business card to save it here.</p>
      </div>`;
    return;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No businesses found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(b => {
    const bg = getBg(b.categories);
    const isSaved = favs.includes(b.id);
    const hasPhoto = b.photo && b.photo !== '';
    const photoEl = hasPhoto
      ? `<img class="card-photo" src="${b.photo}" alt="${b.name}" onerror="this.outerHTML='<div class=\\'card-photo-placeholder\\' style=\\'background:${bg}\\'>${getIcon(b.categories)}</div>'">`
      : `<div class="card-photo-placeholder" style="background:${bg}">${getIcon(b.categories)}</div>`;
    const tags = (b.categories || []).slice(0, 2).map(c => `<span class="tag">${c}</span>`).join('');
    const rating = b.googleRating
      ? `<div class="card-rating"><span class="stars">${renderStars(b.googleRating)}</span><strong>${b.googleRating.toFixed(1)}</strong><span class="rating-count">(${b.googleReviewCount})</span></div>`
      : '';
    return `
      <div class="card-wrap">
        <button class="heart-btn ${isSaved ? 'saved' : ''}" data-id="${b.id}"
          onclick="event.stopPropagation(); toggleFavourite(${b.id})"
          aria-label="${isSaved ? 'Remove from favourites' : 'Add to favourites'}"
          style="color:${isSaved ? '#e11d48' : '#aaa'}">${isSaved ? '♥' : '♡'}</button>
        <div class="card" onclick="openProfile(${b.id})">
          ${photoEl}
          <div class="card-body">
            <div class="card-name">${b.name}</div>
            <div class="card-location">📍 ${b.location}</div>
            <div class="card-tags">${tags}</div>
            ${rating}
          </div>
        </div>
      </div>`;
  }).join('');
}

function applyFilters() {
  const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const location = document.getElementById('filter-location')?.value || '';
  const event = document.getElementById('filter-event')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';

  filtered = businesses.filter(b => {
    const matchSearch = !search ||
      b.name.toLowerCase().includes(search) ||
      (b.blurb || '').toLowerCase().includes(search) ||
      (b.categories || []).some(c => c.toLowerCase().includes(search));
    const matchLocation = !location || b.location === location;
    const matchEvent = !event || (b.eventTypes || []).includes(event);
    const matchCategory = !category || (b.categories || []).includes(category);
    return matchSearch && matchLocation && matchEvent && matchCategory;
  });

  renderGrid();
}

function doSearch() { applyFilters(); }

function openProfile(id) { window.location.href = `profile.html?id=${id}`; }

function getLinkIcon(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('instagram')) return '📸';
  if (l.includes('facebook')) return '📘';
  if (l.includes('tiktok')) return '🎵';
  if (l.includes('portfolio')) return '🖼️';
  if (l.includes('website') || l.includes('web')) return '🌐';
  return '🔗';
}

// ── PROFILE ──
async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  try {
    const res = await fetch('businesses.json');
    const all = await res.json();
    const b = all.find(x => x.id === id);
    if (!b) { document.getElementById('profile-content').innerHTML = '<p style="padding:40px;color:#999">Business not found.</p>'; return; }
    document.title = `${b.name} — Our Local Loop`;
    const bg = getBg(b.categories);
    const favs = getFavourites();
    const isSaved = favs.includes(b.id);
    const hasPhoto = b.photo && b.photo !== '';
    const photoEl = hasPhoto
      ? `<img class="profile-photo" src="${b.photo}" alt="${b.name}" onerror="this.outerHTML='<div class=\\'profile-photo-placeholder\\' style=\\'background:${bg}\\'>${getIcon(b.categories)}</div>'">`
      : `<div class="profile-photo-placeholder" style="background:${bg}">${getIcon(b.categories)}</div>`;
    const categoryTags = (b.categories || []).map(c => `<span class="profile-tag">${c}</span>`).join('');
    const eventTags = (b.eventTypes || []).map(e => `<span class="profile-event-tag">${e}</span>`).join('');
    const links = [b.link1, b.link2].filter(Boolean).map(l =>
      `<a href="${l.url}" target="_blank" rel="noopener" class="profile-link-btn">${getLinkIcon(l.label)} ${l.label}</a>`
    ).join('');
    const rating = b.googleRating
      ? `<a href="${b.googleUrl || '#'}" target="_blank" rel="noopener" class="profile-rating-link">
          <span class="stars">${renderStars(b.googleRating)}</span>
          <strong>${b.googleRating.toFixed(1)}</strong>
          <span style="color:var(--text3)">(${b.googleReviewCount} Google reviews)</span> ↗
        </a>` : '';
    document.getElementById('profile-content').innerHTML = `
      <div class="profile-card">
        <div style="position:relative">
          ${photoEl}
          <button class="heart-btn ${isSaved ? 'saved' : ''}" style="position:absolute;top:14px;right:14px;width:38px;height:38px;font-size:20px;color:${isSaved ? '#e11d48' : '#aaa'}"
            onclick="toggleProfileHeart(${b.id}, this)" aria-label="${isSaved ? 'Remove from favourites' : 'Add to favourites'}">${isSaved ? '♥' : '♡'}</button>
        </div>
        <div class="profile-body">
          <div class="profile-name">${b.name}</div>
          <div class="profile-meta">
            <span class="profile-location">📍 ${b.location}</span>
            ${rating}
          </div>
          <hr class="profile-divider">
          <p class="profile-blurb">${b.blurb}</p>
          <div class="profile-section-label">Services</div>
          <div class="profile-tags">${categoryTags}</div>
          <div class="profile-section-label">Events</div>
          <div class="profile-tags">${eventTags}</div>
          ${links ? `<hr class="profile-divider"><div class="profile-section-label">Links</div><div class="profile-links">${links}</div>` : ''}
        </div>
      </div>`;
  } catch(e) { console.error(e); }
}

function toggleProfileHeart(id, btn) {
  let favs = getFavourites();
  const idx = favs.indexOf(id);
  if (idx > -1) { favs.splice(idx, 1); }
  else { favs.push(id); }
  localStorage.setItem('oll_favourites', JSON.stringify(favs));
  const saved = favs.includes(id);
  btn.classList.toggle('saved', saved);
  btn.style.color = saved ? '#e11d48' : '#aaa';
  btn.textContent = saved ? '♥' : '♡';
  btn.setAttribute('aria-label', saved ? 'Remove from favourites' : 'Add to favourites');
}

// ── CATEGORIES PAGE ──
async function loadCategories() {
  try {
    const res = await fetch('businesses.json');
    const all = await res.json();
    const counts = {};
    all.forEach(b => (b.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));

    // Show ALL known categories, not just ones with businesses
    const allCats = [
      'Makeup Artist','Hairdresser/Hair Stylist','Bridal Makeup','Lash Artist','Nail Tech',
      'Skincare','Spray Tan','Massage & Wellness','Personal Trainer','Home Studio',
      'Photographer','Videographer','Graphic Designer','Content Creator','DJ & Music','Live Entertainment',
      'Cake Maker','Catering','Home Baker','Personal Chef','Food Truck','Coffee & Drinks',
      'Gardener & Landscaping','Handyman','Cleaner','Painter & Decorator','Pool & Spa Care',
      'Event Planner','Florist','Venue','Wedding Vendor','Hire & Styling','Face Painter & Entertainment',
      'Naturopath & Wellness','Counselling & Coaching','Kids Activities','Family Daycare','Babysitter/Nanny',
      'Electrician','Plumber','Builder','Pest Control','Car & Auto',
      'Jeweller','Candle Maker','Dress Alterations & Sewing','Hair Accessories',
      'Laser Cutting & Homewares','Kids Clothing','Personalised Gifts','Other'
    ];

    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    grid.innerHTML = allCats.map(cat => {
      const count = counts[cat] || 0;
      return `
        <div class="category-card" onclick="window.location.href='index.html?category=${encodeURIComponent(cat)}'">
          <div class="icon">${CAT_ICONS[cat] || '⭐'}</div>
          <div class="name">${cat}</div>
          <div class="count">${count} business${count === 1 ? '' : 'es'}</div>
        </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

// ── INIT ──
if (document.getElementById('business-grid')) {
  document.addEventListener('DOMContentLoaded', () => {
    loadBusinesses().then(() => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) { document.getElementById('filter-category').value = cat; applyFilters(); }
    });
    document.getElementById('search-input').addEventListener('keyup', e => { if (e.key === 'Enter') doSearch(); });
    document.getElementById('filter-location').addEventListener('change', applyFilters);
    document.getElementById('filter-event').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', () => {
      activeBubble = null;
      document.querySelectorAll('.bubble').forEach(b => b.classList.remove('active'));
      applyFilters();
    });
  });
}

if (document.getElementById('profile-content')) {
  document.addEventListener('DOMContentLoaded', loadProfile);
}

if (document.getElementById('categories-grid')) {
  document.addEventListener('DOMContentLoaded', loadCategories);
}
