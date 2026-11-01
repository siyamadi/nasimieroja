/* NASIMIE ROJA - website menu + WhatsApp ordering */
// Isi nomor WhatsApp resmi bisnis dalam format internasional tanpa tanda + atau spasi.
// Contoh: const WHATSAPP_NUMBER = '6281324983459';
const WHATSAPP_NUMBER = '6281324983459';

const DEFAULT_MENU = [
  { id: 'nasi-tek-tek', name: 'Nasi Goreng Tek-Tek', category: 'nasi', price: 18000, description: 'Racikan nasi goreng khas dengan rasa gurih dan bumbu yang akrab di lidah.', image: 'https://images.deliveryhero.io/image/hungerstation/restaurant/android_cover_photo/ef5ed55f8ac53aba7b4e3ad8552431ee.jpg', badge: 'Favorit' },
  { id: 'nasi-seafood', name: 'Nasi Goreng Seafood', category: 'nasi', price: 25000, description: 'Pilihan untuk kamu yang ingin menikmati nasi goreng dengan sensasi seafood.', image: 'https://tcdn.mindtrip.ai/images/453051/dnm8qq.png', badge: 'Spesial' },
  { id: 'mie-tek-tek', name: 'Mie Goreng Tek-Tek', category: 'mie', price: 18000, description: 'Mie goreng dengan bumbu khas, cocok untuk penggemar sajian tek-tek.', image: 'https://static.wixstatic.com/media/dd0186_bb18df0c8ff840afadaf7b9dfe214cdc~mv2.jpg/v1/fill/w_980%2Ch_653%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/Arranged%20Food%20and%20Objects.jpg', badge: 'Andalan' },
  { id: 'es-teh', name: 'Es Teh', category: 'minuman', price: 5000, description: 'Minuman sederhana yang pas menemani menu favoritmu.', image: '', badge: 'Segar' }
];
let MENU = DEFAULT_MENU.map(item => ({ ...item }));
let activeFilter = 'all';
const cart = new Map();
const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value).replace(/\u00a0/g, ' ');
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const nav = $('.main-nav');
const navToggle = $('.nav-toggle');
const cartDrawer = $('#cart-drawer');
const cartBackdrop = $('#cart-backdrop');
const toast = $('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function safeImage(value) {
  const src = String(value || '').trim();
  return /^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(src) ? src : '';
}
function normalizeMenu(data) {
  if (!Array.isArray(data)) return null;
  const seen = new Set();
  const result = [];
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String(raw.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    const name = String(raw.name || '').trim().slice(0, 90);
    const price = Math.round(Number(raw.price));
    const category = ['nasi', 'mie', 'minuman', 'lainnya'].includes(raw.category) ? raw.category : 'lainnya';
    if (!id || !name || !Number.isFinite(price) || price < 0 || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id, name, category, price,
      description: String(raw.description || '').trim().slice(0, 240),
      image: safeImage(raw.image),
      badge: String(raw.badge || '').trim().slice(0, 32)
    });
  }
  return result;
}
function getMenu(id) { return MENU.find(item => item.id === id); }
function renderMenu() {
  const host = $('#menu-grid');
  if (!host) return;
  const items = MENU.filter(item => activeFilter === 'all' || item.category === activeFilter);
  if (!items.length) {
    host.innerHTML = '<p class="menu-disclaimer">Belum ada menu pada kategori ini.</p>';
    return;
  }
  host.innerHTML = items.map(item => {
    const image = safeImage(item.image);
    const photo = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy">`
      : `<div class="drink-art" aria-label="${escapeHtml(item.name)}"><span>🍽️</span><b>${escapeHtml(item.name.toUpperCase())}</b></div>`;
    const badge = item.badge ? `<span class="menu-badge ${item.badge.toLowerCase() === 'spesial' || item.badge.toLowerCase() === 'segar' ? 'badge-gold' : ''}">${escapeHtml(item.badge)}</span>` : '';
    return `<article class="menu-card" data-category="${escapeHtml(item.category)}"><div class="menu-photo ${image ? '' : 'drink-photo'}">${photo}${badge}</div><div class="menu-card-content"><div class="menu-card-title"><h3>${escapeHtml(item.name)}</h3><span class="price">${money(item.price)}</span></div><p>${escapeHtml(item.description)}</p><button class="add-button" type="button" data-add="${escapeHtml(item.id)}">＋ Tambah pesanan</button></div></article>`;
  }).join('');
}
async function loadMenuData() {
  try {
    const response = await fetch('./menu-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('menu-data.json tidak ditemukan');
    const data = normalizeMenu(await response.json());
    if (data) MENU = data;
  } catch (error) {
    // Fallback ke menu awal jika file lokal dibuka langsung atau JSON belum dipasang.
    console.info('Menggunakan menu bawaan:', error.message);
  }
  renderMenu();
  renderCart();
}
function scrollToMenu() {
  nav?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  $('#menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
$$('[data-scroll-menu]').forEach(button => button.addEventListener('click', scrollToMenu));
navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
});
$$('.main-nav a').forEach(link => link.addEventListener('click', () => {
  nav?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
}));
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter || 'all';
  $$('[data-filter]').forEach(chip => {
    const active = chip === button;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-pressed', String(active));
  });
  renderMenu();
}));
function addToCart(id) {
  const item = getMenu(id);
  if (!item) return;
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
  showToast(`${item.name} ditambahkan ke pesanan.`);
}
$('#menu-grid')?.addEventListener('click', event => {
  const button = event.target.closest('[data-add]');
  if (button) addToCart(button.dataset.add);
});
function renderCart() {
  const validEntries = [...cart.entries()].filter(([id]) => getMenu(id));
  const totalCount = validEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const totalValue = validEntries.reduce((sum, [id, qty]) => sum + getMenu(id).price * qty, 0);
  $('#cart-count').textContent = String(totalCount);
  $('#cart-subtotal').textContent = money(totalValue);
  const host = $('#cart-items');
  if (!totalCount) {
    host.innerHTML = '<div class="empty-cart"><span>＋</span><b>Belum ada menu</b><p>Tambahkan menu favoritmu dari daftar menu.</p></div>';
    return;
  }
  host.innerHTML = validEntries.map(([id, qty]) => {
    const item = getMenu(id);
    return `<div class="cart-row"><div><h3>${escapeHtml(item.name)}</h3><small>${money(item.price)} · ${money(item.price * qty)}</small></div><div class="cart-item-actions"><button class="qty-button" type="button" data-qty="${escapeHtml(id)}" data-delta="-1" aria-label="Kurangi ${escapeHtml(item.name)}">−</button><span class="qty-num">${qty}</span><button class="qty-button" type="button" data-qty="${escapeHtml(id)}" data-delta="1" aria-label="Tambah ${escapeHtml(item.name)}">+</button></div></div>`;
  }).join('');
  $$('[data-qty]', host).forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.qty;
    const next = (cart.get(id) || 0) + Number(button.dataset.delta);
    if (next <= 0) cart.delete(id); else cart.set(id, next);
    renderCart();
  }));
}
function openCart() {
  cartBackdrop.hidden = false;
  requestAnimationFrame(() => cartDrawer.classList.add('is-open'));
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  $('#cart-close').focus();
}
function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
  setTimeout(() => { if (!cartDrawer.classList.contains('is-open')) cartBackdrop.hidden = true; }, 320);
}
$('#cart-close').addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);
$('#checkout-button').addEventListener('click', () => {
  if (!cart.size) { showToast('Tambahkan menu terlebih dahulu.'); return; }
  const entries = [...cart.entries()].filter(([id]) => getMenu(id));
  const lines = entries.map(([id, qty]) => {
    const item = getMenu(id);
    return `• ${item.name} x${qty} — ${money(item.price * qty)}`;
  });
  const total = entries.reduce((sum, [id, qty]) => sum + getMenu(id).price * qty, 0);
  const note = $('#customer-note').value.trim();
  const message = `Halo Nasimie Roja, saya ingin memesan:\n\n${lines.join('\n')}\n\nSubtotal: ${money(total)}${note ? `\nCatatan: ${note}` : ''}\n\nMohon konfirmasi ketersediaan dan total akhir pesanan. Terima kasih.`;
  const phone = WHATSAPP_NUMBER.replace(/\D/g, '');
  const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});
$$('[data-open-cart]').forEach(button => button.addEventListener('click', openCart));
$('#year').textContent = String(new Date().getFullYear());
loadMenuData();
