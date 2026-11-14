/* Data store, helpers and derived metrics */
'use strict';

const STORAGE_KEY = 'lumina-hms-v1';
const TAX_RATE = 0.12;

const state = {
  view: 'dashboard',
  filters: {
    bookings: { status: 'all', q: '' },
    rooms: { status: 'all', type: 'all', q: '' },
    guests: { q: '' },
    billing: { status: 'all', q: '' }
  }
};

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  bookings: 'Reservations',
  rooms: 'Rooms',
  guests: 'Guests',
  billing: 'Billing'
};

const ROOM_STATUS = {
  available: { label: 'Available', tone: 'green' },
  occupied: { label: 'Occupied', tone: 'red' },
  cleaning: { label: 'Cleaning', tone: 'amber' },
  maintenance: { label: 'Maintenance', tone: 'slate' }
};

const BOOKING_STATUS = {
  confirmed: { label: 'Confirmed', tone: 'blue' },
  'checked-in': { label: 'In-house', tone: 'green' },
  'checked-out': { label: 'Departed', tone: 'slate' },
  cancelled: { label: 'Cancelled', tone: 'red' }
};

let DB = null;
let pendingConfirm = null;

/* ---------------- Load / save ---------------- */

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length && Array.isArray(parsed.bookings)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read saved data, starting fresh.', err);
  }
  const seeded = window.buildSeedData();
  persist(seeded);
  return seeded;
}

function persist(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save data locally.', err);
  }
}

function saveDB() {
  persist(DB);
}

/* ---------------- General helpers ---------------- */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayISO() {
  return toISO(new Date());
}

function parseISO(value) {
  const parts = String(value).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function addDaysISO(value, n) {
  const d = parseISO(value);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((parseISO(b) - parseISO(a)) / 86400000));
}

function diffDays(value) {
  return Math.round((parseISO(value) - parseISO(todayISO())) / 86400000);
}

function fmtShort(value) {
  return parseISO(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMedium(value) {
  return parseISO(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtLong(value) {
  return parseISO(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtDateFull(value) {
  return parseISO(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtWeekday(value) {
  return parseISO(value).toLocaleDateString('en-US', { weekday: 'short' });
}

function fmtMoney(value, decimals) {
  const d = decimals == null ? 0 : decimals;
  return '$' + Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });
}

function relativeDay(value) {
  const diff = diffDays(value);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return 'In ' + diff + ' days';
  return Math.abs(diff) + ' days ago';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ---------------- Lookups ---------------- */

const guestById = (id) => DB.guests.find((g) => g.id === id);
const roomById = (id) => DB.rooms.find((r) => r.id === id);
const bookingById = (id) => DB.bookings.find((b) => b.id === id);
const invoiceById = (id) => DB.invoices.find((i) => i.id === id);
const invoiceForBooking = (id) => DB.invoices.find((i) => i.bookingId === id);

function activeBookingForRoom(roomId) {
  return DB.bookings.find((b) => b.roomId === roomId && b.status === 'checked-in');
}

function arrivalsToday() {
  const today = todayISO();
  return DB.bookings
    .filter((b) => b.status === 'confirmed' && b.checkIn === today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

function departuresToday() {
  const today = todayISO();
  return DB.bookings.filter((b) => b.status === 'checked-in' && b.checkOut === today);
}

function inHouseBookings() {
  return DB.bookings.filter((b) => b.status === 'checked-in');
}

function isRoomFree(roomId, checkIn, checkOut) {
  return !DB.bookings.some((b) =>
    b.roomId === roomId &&
    (b.status === 'confirmed' || b.status === 'checked-in') &&
    b.checkIn < checkOut &&
    b.checkOut > checkIn
  );
}

function nextBookingId() {
  let max = 1000;
  DB.bookings.forEach((b) => {
    const n = parseInt(String(b.id).replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return 'BK-' + (max + 1);
}

function nextInvoiceId() {
  let max = 2040;
  DB.invoices.forEach((inv) => {
    const n = parseInt(String(inv.id).replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return 'INV-' + (max + 1);
}

/* ---------------- Derived metrics ---------------- */

function occupancyPct() {
  const total = DB.rooms.length || 1;
  const occupied = DB.rooms.filter((r) => r.status === 'occupied').length;
  return Math.round((occupied / total) * 100);
}

function revenueWindow(offset) {
  const start = addDaysISO(todayISO(), -(6 + offset));
  const end = addDaysISO(todayISO(), -offset);
  let total = 0;
  DB.invoices.forEach((inv) => {
    if (inv.issuedAt >= start && inv.issuedAt <= end) total += inv.total;
  });
  return round2(total);
}

function chartSeries() {
  const series = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDaysISO(todayISO(), -i);
    let total = 0;
    DB.invoices.forEach((inv) => {
      if (inv.issuedAt === date) total += inv.total;
    });
    series.push({ date, total: round2(total), today: i === 0 });
  }
  return series;
}

function roomStatusCounts() {
  const counts = { available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  DB.rooms.forEach((r) => {
    if (counts[r.status] == null) counts[r.status] = 0;
    counts[r.status] += 1;
  });
  return counts;
}

function billingTotals() {
  const outstanding = DB.invoices.filter((i) => !i.paid).reduce((sum, i) => sum + i.total, 0);
  const month = todayISO().slice(0, 7);
  const collected = DB.invoices
    .filter((i) => i.paid && String(i.paidAt || i.issuedAt).slice(0, 7) === month)
    .reduce((sum, i) => sum + i.total, 0);
  return {
    outstanding: round2(outstanding),
    collected: round2(collected),
    count: DB.invoices.length,
    due: DB.invoices.filter((i) => !i.paid).length
  };
}

/* ---------------- UI fragments ---------------- */

const AVATAR_COLORS = ['#1f6f5c', '#8a5a2b', '#3c5a8a', '#7b4a6a', '#5a6b3a', '#8a4646', '#2f6b7a', '#6a5a8a'];

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatar(name, cls) {
  const value = String(name || '?');
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash += value.charCodeAt(i);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return '<span class="avatar ' + (cls || '') + '" style="background:' + color + '">' + esc(initials(value)) + '</span>';
}

function pill(label, tone) {
  return '<span class="pill ' + tone + '"><span class="dot"></span>' + esc(label) + '</span>';
}

function roomPill(status) {
  const meta = ROOM_STATUS[status] || ROOM_STATUS.available;
  return pill(meta.label, meta.tone);
}

function bookingPill(status) {
  const meta = BOOKING_STATUS[status] || BOOKING_STATUS.confirmed;
  return pill(meta.label, meta.tone);
}

function invoicePill(inv) {
  return inv.paid ? pill('Paid', 'green') : pill('Due', 'amber');
}

function guestTone() {
  return '';
}

function vipTag(guest) {
  return guest && guest.vip ? ' <span class="tag-vip">VIP</span>' : '';
}

function emptyState(iconName, title, text, small) {
  return '<div class="empty ' + (small ? 'sm' : '') + '">' +
    '<div class="empty-icon">' + icon(iconName, small ? 17 : 20) + '</div>' +
    '<div class="empty-title">' + esc(title) + '</div>' +
    (text ? '<div class="empty-text">' + esc(text) + '</div>' : '') +
    '</div>';
}

function deltaChip(value) {
  if (!isFinite(value) || value === 0) {
    return '<span class="delta up">' + icon('arrowUpRight', 12) + '0.0%</span>';
  }
  const cls = value > 0 ? 'up' : 'down';
  return '<span class="delta ' + cls + '">' + icon('arrowUpRight', 12) + Math.abs(value).toFixed(1) + '%</span>';
}

/* ---------------- Filters ---------------- */

function filteredBookings() {
  const f = state.filters.bookings;
  const q = f.q.trim().toLowerCase();
  return DB.bookings
    .filter((b) => {
      if (f.status !== 'all' && b.status !== f.status) return false;
      if (!q) return true;
      const g = guestById(b.guestId);
      const r = roomById(b.roomId);
      return [g && g.name, b.id, r && r.number, b.source]
        .some((value) => String(value || '').toLowerCase().includes(q));
    })
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn) || b.id.localeCompare(a.id));
}

function filteredRooms() {
  const f = state.filters.rooms;
  const q = f.q.trim().toLowerCase();
  return DB.rooms
    .filter((r) => {
      if (f.status !== 'all' && r.status !== f.status) return false;
      if (f.type !== 'all' && r.type !== f.type) return false;
      if (!q) return true;
      return [r.number, r.type, r.floor].some((value) => String(value).toLowerCase().includes(q));
    })
    .sort((a, b) => Number(a.number) - Number(b.number));
}

function filteredGuests() {
  const q = state.filters.guests.q.trim().toLowerCase();
  return DB.guests
    .filter((g) => {
      if (!q) return true;
      return [g.name, g.email, g.phone, g.country]
        .some((value) => String(value || '').toLowerCase().includes(q));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function filteredInvoices() {
  const f = state.filters.billing;
  const q = f.q.trim().toLowerCase();
  return DB.invoices
    .filter((inv) => {
      if (f.status === 'paid' && !inv.paid) return false;
      if (f.status === 'due' && inv.paid) return false;
      if (!q) return true;
      const g = guestById(inv.guestId);
      const r = roomById(inv.roomId);
      return [inv.id, g && g.name, r && r.number]
        .some((value) => String(value || '').toLowerCase().includes(q));
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || b.id.localeCompare(a.id));
}

function guestStats(guestId) {
  const stays = DB.bookings.filter((b) => b.guestId === guestId && b.status !== 'cancelled').length;
  const spend = DB.invoices.filter((i) => i.guestId === guestId).reduce((sum, i) => sum + i.total, 0);
  return { stays, spend: round2(spend) };
}

function statusCount(list, status) {
  return list.filter((b) => b.status === status).length;
}
