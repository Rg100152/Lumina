/* Rendered views: shell, dashboard and reservations */
'use strict';

function renderSidebar() {
  const arrivals = arrivalsToday().length;
  const available = DB.rooms.filter((r) => r.status === 'available').length;
  const due = DB.invoices.filter((i) => !i.paid).length;

  const items = [
    { view: 'dashboard', label: 'Dashboard', iconName: 'dashboard', badge: null },
    { view: 'bookings', label: 'Reservations', iconName: 'calendar', badge: arrivals || null },
    { view: 'rooms', label: 'Rooms', iconName: 'door', badge: available },
    { view: 'guests', label: 'Guests', iconName: 'users', badge: null },
    { view: 'billing', label: 'Billing', iconName: 'receipt', badge: due || null, alert: due > 0 }
  ];

  const nav = items.map((item) => {
    const active = state.view === item.view;
    return '<a href="#/' + item.view + '" class="nav-item ' + (active ? 'active' : '') + '" data-action="close-nav"' + (active ? ' aria-current="page"' : '') + '>' +
      icon(item.iconName, 19) +
      '<span>' + item.label + '</span>' +
      (item.badge ? '<span class="nav-badge ' + (item.alert ? 'alert' : '') + '">' + item.badge + '</span>' : '') +
      '</a>';
  }).join('');

  $('#sidebar').innerHTML =
    '<div class="brand">' +
      '<div class="brand-mark">L</div>' +
      '<div class="brand-text"><div class="brand-name">Lumina</div><div class="brand-sub">Harbour Hotel</div></div>' +
    '</div>' +
    '<div class="nav-label">Front office</div>' +
    '<nav class="nav">' + nav + '</nav>' +
    '<div class="sidebar-foot">' +
      '<button class="sidebar-reset" data-action="reset-data">' + icon('refresh', 15) + ' Reset demo data</button>' +
      '<div class="user-chip">' +
        '<span class="avatar" style="background:#b9922f;color:#1c2a22">AR</span>' +
        '<div><div class="user-name">Ava Reyes</div><div class="user-role">Front desk manager</div></div>' +
        '<span class="online-dot" title="Online"></span>' +
      '</div>' +
    '</div>';
}

function renderTopbar() {
  $('#topbar').innerHTML =
    '<button class="icon-btn hamburger" data-action="toggle-nav" aria-label="Open navigation">' + icon('menu', 20) + '</button>' +
    '<div class="crumb"><span>' + esc(DB.meta.hotelName) + '</span>' + icon('chevronRight', 14) + '<strong>' + VIEW_LABELS[state.view] + '</strong></div>' +
    '<div class="topbar-spacer"></div>' +
    '<div class="date-chip">' + icon('calendar', 16) + '<span>' + fmtMedium(todayISO()) + '</span></div>' +
    '<button class="btn btn-primary" data-action="new-booking">' + icon('plus', 17) + '<span>New reservation</span></button>';
}

/* ---------------- Dashboard ---------------- */

function renderDashboard() {
  const occupied = DB.rooms.filter((r) => r.status === 'occupied').length;
  const occupancy = occupancyPct();
  const rev7 = revenueWindow(0);
  const revPrev = revenueWindow(7);
  const revDelta = revPrev > 0 ? ((rev7 - revPrev) / revPrev) * 100 : 0;
  const arrivals = arrivalsToday();
  const departures = departuresToday();
  const inHouse = inHouseBookings().length;
  const series = chartSeries();
  const chartMax = Math.max(1, ...series.map((p) => p.total));

  const bars = series.map((point) => {
    const height = Math.max(4, Math.round((point.total / chartMax) * 100));
    return '<div class="bar-col">' +
      '<div class="bar-area"><div class="bar ' + (point.today ? 'today' : '') + '" style="--h:' + height + '%" title="' + fmtMedium(point.date) + ' · ' + fmtMoney(point.total) + '"></div></div>' +
      '<div class="bar-label ' + (point.today ? 'today' : '') + '">' + (point.today ? 'Today' : fmtWeekday(point.date)) + '</div>' +
    '</div>';
  }).join('');

  const counts = roomStatusCounts();
  const totalRooms = DB.rooms.length;
  const donutColors = { available: '#2f7d5f', occupied: '#b44b32', cleaning: '#c08a2e', maintenance: '#7b8783' };
  const circumference = 2 * Math.PI * 56;
  let offset = 0;
  const segments = ['available', 'occupied', 'cleaning', 'maintenance'].map((key) => {
    const count = counts[key] || 0;
    if (!count) return '';
    const dash = (count / totalRooms) * circumference;
    const circle = '<circle cx="80" cy="80" r="56" fill="none" stroke="' + donutColors[key] + '" stroke-width="15" ' +
      'stroke-dasharray="' + Math.max(dash - 3, 0) + ' ' + (circumference - Math.max(dash - 3, 0)) + '" ' +
      'stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 80 80)"/>';
    offset += dash;
    return circle;
  }).join('');

  const legend = ['available', 'occupied', 'cleaning', 'maintenance'].map((key) => {
    const count = counts[key] || 0;
    const pct = Math.round((count / totalRooms) * 100);
    return '<div class="legend-row">' +
      '<span class="swatch" style="background:' + donutColors[key] + '"></span>' +
      '<span class="legend-name">' + ROOM_STATUS[key].label + '</span>' +
      '<span class="legend-count">' + count + '</span>' +
      '<span class="legend-pct">' + pct + '%</span>' +
    '</div>';
  }).join('');

  const arrivalRows = arrivals.slice(0, 4).map((b) => {
    const g = guestById(b.guestId);
    const r = roomById(b.roomId);
    return '<div class="mini-row">' +
      avatar(g.name) +
      '<div class="mini-main"><div class="mini-name">' + esc(g.name) + vipTag(g) + '</div>' +
      '<div class="mini-sub">Room ' + r.number + ' · ' + esc(r.type) + ' · ' + nightsBetween(b.checkIn, b.checkOut) + ' nights</div></div>' +
      '<button class="btn btn-sm btn-ghost" data-action="checkin" data-id="' + b.id + '">Check in</button>' +
    '</div>';
  }).join('');

  const departureRows = departures.slice(0, 4).map((b) => {
    const g = guestById(b.guestId);
    const r = roomById(b.roomId);
    return '<div class="mini-row">' +
      avatar(g.name) +
      '<div class="mini-main"><div class="mini-name">' + esc(g.name) + vipTag(g) + '</div>' +
      '<div class="mini-sub">Room ' + r.number + ' · ' + esc(r.type) + ' · ' + fmtMoney(b.total) + ' folio</div></div>' +
      '<button class="btn btn-sm btn-gold" data-action="checkout" data-id="' + b.id + '">Check out</button>' +
    '</div>';
  }).join('');

  const recent = DB.bookings
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id.localeCompare(a.id))
    .slice(0, 5)
    .map((b) => {
      const g = guestById(b.guestId);
      const r = roomById(b.roomId);
      return '<tr>' +
        '<td><div class="cell-guest">' + avatar(g.name, 'sm') + '<div><div class="name">' + esc(g.name) + vipTag(g) + '</div><div class="sub">' + b.id + ' · ' + esc(b.source) + '</div></div></div></td>' +
        '<td><span class="room-chip">' + r.number + '</span> <span class="sub">' + esc(r.type) + '</span></td>' +
        '<td class="stay">' + fmtShort(b.checkIn) + '<span class="arrow">→</span>' + fmtShort(b.checkOut) + '</td>' +
        '<td>' + bookingPill(b.status) + '</td>' +
        '<td class="num amount">' + fmtMoney(b.total) + '</td>' +
        '<td><div class="actions"><button class="icon-btn sm" data-action="view-booking" data-id="' + b.id + '" title="View reservation">' + icon('eye', 15) + '</button></div></td>' +
      '</tr>';
    }).join('');

  return '' +
    '<div class="page-head">' +
      '<div>' +
        '<div class="eyebrow">' + icon('sparkles', 14) + greeting() + ', Ava</div>' +
        '<h1 class="page-title">A calm day at the harbour.</h1>' +
        '<p class="page-sub">' + fmtLong(todayISO()) + ' — ' + arrivals.length + ' arrivals and ' + departures.length + ' departures on today\u2019s list.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<a class="btn btn-ghost" href="#/bookings">All reservations ' + icon('arrowRight', 16) + '</a>' +
      '</div>' +
    '</div>' +

    '<section class="kpi-grid">' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon green">' + icon('door', 19) + '</span><span class="kpi-label">Occupancy</span></div>' +
        '<div class="kpi-value">' + occupancy + '%</div>' +
        '<div class="kpi-bar"><span style="width:' + occupancy + '%"></span></div>' +
        '<div class="kpi-foot">' + occupied + ' of ' + totalRooms + ' rooms occupied</div>' +
      '</div>' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon gold">' + icon('card', 19) + '</span><span class="kpi-label">Revenue · 7 days</span></div>' +
        '<div class="kpi-value">' + fmtMoney(rev7) + '</div>' +
        '<div class="kpi-foot">' + deltaChip(revDelta) + '<span>vs previous week</span></div>' +
      '</div>' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon blue">' + icon('users', 19) + '</span><span class="kpi-label">Arrivals today</span></div>' +
        '<div class="kpi-value">' + arrivals.length + '</div>' +
        '<div class="kpi-foot">' + inHouse + ' guests currently in-house</div>' +
      '</div>' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon amber">' + icon('key', 19) + '</span><span class="kpi-label">Departures today</span></div>' +
        '<div class="kpi-value">' + departures.length + '</div>' +
        '<div class="kpi-foot">Checkout time 11:00 · folios ready</div>' +
      '</div>' +
    '</section>' +

    '<div class="dash-grid">' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">Revenue</div><div class="panel-sub">Room charges incl. 12% tax · last 7 days</div></div>' +
          '<div class="panel-figure"><span class="figure">' + fmtMoney(rev7) + '</span>' + deltaChip(revDelta) + '</div>' +
        '</div>' +
        '<div class="panel-body">' +
          '<div class="chart">' + bars + '</div>' +
          '<div class="chart-foot">' +
            '<span class="chart-legend"><span class="legend-swatch"></span> Billed</span>' +
            '<span class="chart-legend"><span class="legend-swatch gold"></span> Today</span>' +
            '<span class="spacer"></span>' +
            '<span>' + DB.invoices.length + ' invoices issued in total</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-head"><div><div class="panel-title">Room status</div><div class="panel-sub">Live housekeeping view</div></div></div>' +
        '<div class="panel-body">' +
          '<div class="donut-wrap">' +
            '<svg class="donut" viewBox="0 0 160 160" role="img" aria-label="Room status breakdown">' + segments + '</svg>' +
            '<div class="donut-center"><strong>' + totalRooms + '</strong><span>Rooms</span></div>' +
          '</div>' +
          '<div class="legend">' + legend + '</div>' +
        '</div>' +
      '</section>' +
    '</div>' +

    '<div class="dash-grid even">' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">Arrivals</div><div class="panel-sub">Due to check in today</div></div>' +
          '<span class="pill blue">' + icon('users', 12) + arrivals.length + ' expected</span>' +
        '</div>' +
        '<div class="panel-body">' +
          (arrivalRows || emptyState('calendar', 'No arrivals today', 'Every expected guest has been checked in.', true)) +
        '</div>' +
        '<div class="panel-foot"><span>Check-in from 14:00</span><a class="link-btn" href="#/bookings">Open queue ' + icon('arrowRight', 13) + '</a></div>' +
      '</section>' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<div><div class="panel-title">Departures</div><div class="panel-sub">Folios to settle today</div></div>' +
          '<span class="pill amber">' + icon('clock', 12) + departures.length + ' due</span>' +
        '</div>' +
        '<div class="panel-body">' +
          (departureRows || emptyState('key', 'No departures today', 'Rooms are staying another night.', true)) +
        '</div>' +
        '<div class="panel-foot"><span>Checkout by 11:00</span><a class="link-btn" href="#/billing">Open billing ' + icon('arrowRight', 13) + '</a></div>' +
      '</section>' +
    '</div>' +

    '<section class="panel">' +
      '<div class="panel-head">' +
        '<div><div class="panel-title">Recent reservations</div><div class="panel-sub">Latest activity at the front desk</div></div>' +
        '<a class="link-btn" href="#/bookings">View all ' + icon('arrowRight', 13) + '</a>' +
      '</div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Guest</th><th>Room</th><th>Stay</th><th>Status</th><th class="num">Total</th><th></th>' +
      '</tr></thead><tbody>' + recent + '</tbody></table></div>' +
    '</section>';
}

/* ---------------- Reservations ---------------- */

function segmented(group, key, current, options) {
  return '<div class="segmented">' + options.map((opt) =>
    '<button class="seg-btn ' + (current === opt.value ? 'active' : '') + '" data-filter="' + group + '.' + key + '" data-value="' + opt.value + '">' +
      opt.label + (opt.count != null ? ' <span class="seg-count">' + opt.count + '</span>' : '') +
    '</button>'
  ).join('') + '</div>';
}

function renderBookings() {
  const f = state.filters.bookings;
  const list = filteredBookings();
  const all = DB.bookings;

  const options = [
    { value: 'all', label: 'All', count: all.length },
    { value: 'confirmed', label: 'Confirmed', count: statusCount(all, 'confirmed') },
    { value: 'checked-in', label: 'In-house', count: statusCount(all, 'checked-in') },
    { value: 'checked-out', label: 'Departed', count: statusCount(all, 'checked-out') },
    { value: 'cancelled', label: 'Cancelled', count: statusCount(all, 'cancelled') }
  ];

  const rows = list.map((b) => {
    const g = guestById(b.guestId);
    const r = roomById(b.roomId);
    const nights = nightsBetween(b.checkIn, b.checkOut);
    const actions = [];
    if (b.status === 'confirmed') {
      if (b.checkIn <= todayISO()) {
        actions.push('<button class="btn btn-sm btn-primary" data-action="checkin" data-id="' + b.id + '">Check in</button>');
      }
      actions.push('<button class="icon-btn sm" data-action="cancel-booking" data-id="' + b.id + '" title="Cancel reservation">' + icon('x', 14) + '</button>');
    } else if (b.status === 'checked-in') {
      actions.push('<button class="btn btn-sm btn-ghost" data-action="checkout" data-id="' + b.id + '">Check out</button>');
    } else if (b.status === 'checked-out') {
      const inv = invoiceForBooking(b.id);
      if (inv) actions.push('<button class="btn btn-sm btn-ghost" data-action="view-invoice" data-id="' + inv.id + '">Invoice</button>');
    }
    actions.push('<button class="icon-btn sm" data-action="view-booking" data-id="' + b.id + '" title="Reservation details">' + icon('eye', 14) + '</button>');

    return '<tr>' +
      '<td><div class="cell-guest">' + avatar(g.name) + '<div><div class="name">' + esc(g.name) + vipTag(g) + '</div><div class="sub">' + b.id + ' · ' + esc(b.source) + '</div></div></div></td>' +
      '<td><span class="room-chip">' + r.number + '</span><div class="sub">' + esc(r.type) + '</div></td>' +
      '<td class="stay">' + fmtShort(b.checkIn) + '<span class="arrow">→</span>' + fmtShort(b.checkOut) +
        '<div class="sub">' + nights + ' night' + (nights === 1 ? '' : 's') + ' · ' + b.adults + ' adult' + (b.adults === 1 ? '' : 's') + '</div></td>' +
      '<td>' + bookingPill(b.status) + '</td>' +
      '<td class="num amount">' + fmtMoney(b.total) + '</td>' +
      '<td><div class="actions">' + actions.join('') + '</div></td>' +
    '</tr>';
  }).join('');

  return '' +
    '<div class="page-head">' +
      '<div>' +
        '<div class="eyebrow">' + icon('calendar', 14) + 'Reservation desk</div>' +
        '<h1 class="page-title">Reservations</h1>' +
        '<p class="page-sub">Manage arrivals, in-house guests and upcoming stays across ' + DB.rooms.length + ' rooms.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-ghost" data-action="export-bookings">' + icon('download', 16) + ' Export CSV</button>' +
        '<button class="btn btn-primary" data-action="new-booking">' + icon('plus', 16) + ' New reservation</button>' +
      '</div>' +
    '</div>' +

    '<section class="panel">' +
      '<div class="toolbar">' +
        segmented('bookings', 'status', f.status, options) +
        '<div class="toolbar-spacer"></div>' +
        '<div class="search">' + icon('search', 16) + '<input type="search" data-filter="bookings.q" value="' + esc(f.q) + '" placeholder="Search guest, room or booking ID" aria-label="Search reservations"></div>' +
      '</div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Guest</th><th>Room</th><th>Stay</th><th>Status</th><th class="num">Total</th><th></th>' +
      '</tr></thead><tbody>' +
        (rows || '<tr class="table-empty"><td colspan="6">' + emptyState('search', 'No reservations found', 'Try a different search or status filter.') + '</td></tr>') +
      '</tbody></table></div>' +
      '<div class="panel-foot"><span>Showing ' + list.length + ' of ' + all.length + ' reservations</span><span>All amounts include 12% tax</span></div>' +
    '</section>';
}

/* ---------------- Rooms ---------------- */

function renderRooms() {
  const f = state.filters.rooms;
  const list = filteredRooms();
  const types = Array.from(new Set(DB.rooms.map((r) => r.type)));

  const countBy = (status) => DB.rooms.filter((r) => r.status === status).length;
  const options = [
    { value: 'all', label: 'All', count: DB.rooms.length },
    { value: 'available', label: 'Available', count: countBy('available') },
    { value: 'occupied', label: 'Occupied', count: countBy('occupied') },
    { value: 'cleaning', label: 'Cleaning', count: countBy('cleaning') },
    { value: 'maintenance', label: 'Maintenance', count: countBy('maintenance') }
  ];

  const typeOptions = ['<option value="all">All room types</option>']
    .concat(types.map((t) => '<option value="' + esc(t) + '"' + (f.type === t ? ' selected' : '') + '>' + esc(t) + '</option>'))
    .join('');

  const cards = list.map((r) => {
    const active = activeBookingForRoom(r.id);
    const activeGuest = active ? guestById(active.guestId) : null;
    const next = DB.bookings
      .filter((b) => b.roomId === r.id && b.status === 'confirmed' && b.checkIn >= todayISO())
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
    let line;
    if (r.status === 'occupied' && activeGuest) {
      line = esc(activeGuest.name) + ' · until ' + fmtShort(active.checkOut);
    } else if (r.status === 'cleaning') {
      line = 'Housekeeping in progress';
    } else if (r.status === 'maintenance') {
      line = 'Out of order for maintenance';
    } else if (next) {
      line = 'Next: ' + esc(guestById(next.guestId).name) + ' · ' + fmtShort(next.checkIn);
    } else {
      line = 'Ready to sell';
    }

    return '<div class="room-card" data-status="' + r.status + '" data-action="view-room" data-id="' + r.id + '" role="button" tabindex="0" aria-label="Room ' + r.number + ' details">' +
      '<div class="room-top">' +
        '<div><div class="room-number">' + r.number + '</div><div class="room-type">' + esc(r.type) + '</div></div>' +
        roomPill(r.status) +
      '</div>' +
      '<div class="room-meta">' +
        '<span>' + icon('users', 13) + r.capacity + ' guests</span>' +
        '<span>' + icon('bed', 13) + 'Floor ' + r.floor + '</span>' +
      '</div>' +
      '<div class="room-guest ' + (r.status === 'occupied' || next ? '' : 'muted') + '">' + line + '</div>' +
      '<div class="room-foot">' +
        '<span class="room-price"><strong>' + fmtMoney(r.price) + '</strong> / night</span>' +
        '<span class="room-open">Details ' + icon('chevronRight', 13) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  return '' +
    '<div class="page-head">' +
      '<div>' +
        '<div class="eyebrow">' + icon('door', 14) + 'Housekeeping & inventory</div>' +
        '<h1 class="page-title">Rooms</h1>' +
        '<p class="page-sub">A live floor plan of the property — statuses, rates and who is staying where.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-primary" data-action="new-booking">' + icon('plus', 16) + ' New reservation</button>' +
      '</div>' +
    '</div>' +

    '<section class="panel">' +
      '<div class="toolbar">' +
        segmented('rooms', 'status', f.status, options) +
        '<div class="toolbar-spacer"></div>' +
        '<select class="select-sm" data-filter="rooms.type" aria-label="Filter by room type">' + typeOptions + '</select>' +
        '<div class="search">' + icon('search', 16) + '<input type="search" data-filter="rooms.q" value="' + esc(f.q) + '" placeholder="Search room" aria-label="Search rooms"></div>' +
      '</div>' +
      (cards ? '<div class="rooms-grid">' + cards + '</div>' :
        emptyState('door', 'No rooms match', 'Adjust the filters to see other rooms.')) +
      '<div class="panel-foot"><span>Showing ' + list.length + ' of ' + DB.rooms.length + ' rooms</span><span>Statuses update as guests check in and out</span></div>' +
    '</section>';
}

/* ---------------- Guests ---------------- */

function renderGuests() {
  const list = filteredGuests();
  const q = state.filters.guests.q;

  const rows = list.map((g) => {
    const stats = guestStats(g.id);
    return '<tr>' +
      '<td><div class="cell-guest">' + avatar(g.name) + '<div><div class="name">' + esc(g.name) + vipTag(g) + '</div><div class="sub">' + esc(g.email || 'No email on file') + '</div></div></div></td>' +
      '<td><span class="muted">' + esc(g.country || '—') + '</span></td>' +
      '<td><div>' + esc(g.phone || '—') + '</div><div class="sub">Since ' + fmtShort(g.createdAt) + '</div></td>' +
      '<td class="num">' + stats.stays + '</td>' +
      '<td class="num amount">' + fmtMoney(stats.spend) + '</td>' +
      '<td><div class="actions">' +
        '<button class="icon-btn sm" data-action="edit-guest" data-id="' + g.id + '" title="Edit guest">' + icon('edit', 14) + '</button>' +
        '<button class="icon-btn sm" data-action="delete-guest" data-id="' + g.id + '" title="Delete guest">' + icon('trash', 14) + '</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  return '' +
    '<div class="page-head">' +
      '<div>' +
        '<div class="eyebrow">' + icon('users', 14) + 'Guest directory</div>' +
        '<h1 class="page-title">Guests</h1>' +
        '<p class="page-sub">' + DB.guests.length + ' profiles, ' + DB.guests.filter((g) => g.vip).length + ' VIPs — stay history and lifetime value at a glance.</p>' +
      '</div>' +
      '<div class="page-actions">' +
        '<button class="btn btn-primary" data-action="new-guest">' + icon('plus', 16) + ' Add guest</button>' +
      '</div>' +
    '</div>' +

    '<section class="panel">' +
      '<div class="toolbar">' +
        '<span class="muted" style="font-size:12.5px">' + list.length + ' profile' + (list.length === 1 ? '' : 's') + '</span>' +
        '<div class="toolbar-spacer"></div>' +
        '<div class="search">' + icon('search', 16) + '<input type="search" data-filter="guests.q" value="' + esc(q) + '" placeholder="Search name, email, country" aria-label="Search guests"></div>' +
      '</div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Guest</th><th>Country</th><th>Contact</th><th class="num">Stays</th><th class="num">Lifetime spend</th><th></th>' +
      '</tr></thead><tbody>' +
        (rows || '<tr class="table-empty"><td colspan="6">' + emptyState('search', 'No guests found', 'Try a different search term.') + '</td></tr>') +
      '</tbody></table></div>' +
      '<div class="panel-foot"><span>Showing ' + list.length + ' of ' + DB.guests.length + ' guests</span><span>Spend reflects invoiced stays</span></div>' +
    '</section>';
}

/* ---------------- Billing ---------------- */

function renderBilling() {
  const f = state.filters.billing;
  const list = filteredInvoices();
  const totals = billingTotals();
  const options = [
    { value: 'all', label: 'All', count: DB.invoices.length },
    { value: 'due', label: 'Due', count: DB.invoices.filter((i) => !i.paid).length },
    { value: 'paid', label: 'Paid', count: DB.invoices.filter((i) => i.paid).length }
  ];

  const rows = list.map((inv) => {
    const g = guestById(inv.guestId);
    const r = roomById(inv.roomId);
    return '<tr>' +
      '<td><div class="name" style="font-weight:600;font-size:12.5px">' + inv.id + '</div><div class="sub">Issued ' + fmtShort(inv.issuedAt) + '</div></td>' +
      '<td><div class="cell-guest">' + avatar(g.name, 'sm') + '<div><div class="name">' + esc(g.name) + vipTag(g) + '</div><div class="sub">Room ' + r.number + ' · ' + esc(r.type) + '</div></div></div></td>' +
      '<td><span class="muted">' + fmtDateFull(inv.issuedAt) + '</span></td>' +
      '<td class="num amount">' + fmtMoney(inv.total, 2) + '</td>' +
      '<td>' + invoicePill(inv) + '</td>' +
      '<td><div class="actions">' +
        '<button class="btn btn-sm btn-ghost" data-action="view-invoice" data-id="' + inv.id + '">View</button>' +
        (!inv.paid ? '<button class="btn btn-sm btn-primary" data-action="mark-paid" data-id="' + inv.id + '">Mark paid</button>' : '') +
      '</div></td>' +
    '</tr>';
  }).join('');

  return '' +
    '<div class="page-head">' +
      '<div>' +
        '<div class="eyebrow">' + icon('receipt', 14) + 'Folios & payments</div>' +
        '<h1 class="page-title">Billing</h1>' +
        '<p class="page-sub">Invoices are generated automatically when a guest checks out.</p>' +
      '</div>' +
    '</div>' +

    '<section class="kpi-grid three">' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon amber">' + icon('alert', 19) + '</span><span class="kpi-label">Outstanding</span></div>' +
        '<div class="kpi-value">' + fmtMoney(totals.outstanding, 2) + '</div>' +
        '<div class="kpi-foot">' + totals.due + ' invoice' + (totals.due === 1 ? '' : 's') + ' awaiting payment</div>' +
      '</div>' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon green">' + icon('card', 19) + '</span><span class="kpi-label">Collected this month</span></div>' +
        '<div class="kpi-value">' + fmtMoney(totals.collected, 2) + '</div>' +
        '<div class="kpi-foot">Card, cash and bank transfers</div>' +
      '</div>' +
      '<div class="kpi">' +
        '<div class="kpi-top"><span class="kpi-icon gold">' + icon('receipt', 19) + '</span><span class="kpi-label">Invoices issued</span></div>' +
        '<div class="kpi-value">' + totals.count + '</div>' +
        '<div class="kpi-foot">Across all completed stays</div>' +
      '</div>' +
    '</section>' +

    '<section class="panel">' +
      '<div class="toolbar">' +
        segmented('billing', 'status', f.status, options) +
        '<div class="toolbar-spacer"></div>' +
        '<div class="search">' + icon('search', 16) + '<input type="search" data-filter="billing.q" value="' + esc(f.q) + '" placeholder="Search invoice or guest" aria-label="Search invoices"></div>' +
      '</div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Invoice</th><th>Guest</th><th>Issued</th><th class="num">Total</th><th>Status</th><th></th>' +
      '</tr></thead><tbody>' +
        (rows || '<tr class="table-empty"><td colspan="6">' + emptyState('receipt', 'No invoices found', 'Complete a checkout to generate a folio.') + '</td></tr>') +
      '</tbody></table></div>' +
      '<div class="panel-foot"><span>Showing ' + list.length + ' of ' + DB.invoices.length + ' invoices</span><span>Tax rate 12%</span></div>' +
    '</section>';
}
