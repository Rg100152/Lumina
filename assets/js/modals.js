/* Modal dialogs and forms */
'use strict';

function openModal(html, opts) {
  const options = opts || {};
  const root = $('#modal-root');
  root.innerHTML = '<div class="modal-backdrop"><div class="modal ' + (options.wide ? 'wide' : '') + (options.narrow ? ' narrow' : '') +
    '" role="dialog" aria-modal="true">' + html + '</div></div>';
  document.body.classList.add('modal-open');
  const focusEl = root.querySelector('[data-autofocus]') || root.querySelector('input, select, textarea, button');
  if (focusEl) {
    setTimeout(function () {
      try { focusEl.focus(); } catch (err) { /* ignore */ }
    }, 60);
  }
}

function closeModal() {
  const root = $('#modal-root');
  if (root) root.innerHTML = '';
  document.body.classList.remove('modal-open');
  pendingConfirm = null;
}

function confirmDialog(opts) {
  pendingConfirm = opts.onConfirm || null;
  const tone = opts.tone || 'danger';
  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">Please confirm</div><h3>' + esc(opts.title) + '</h3></div>' +
      '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button>' +
    '</div>' +
    '<div class="modal-body"><p class="confirm-text">' + opts.message + '</p></div>' +
    '<div class="modal-foot">' +
      '<button class="btn btn-quiet" data-action="close-modal">Cancel</button>' +
      '<button class="btn ' + (tone === 'danger' ? 'btn-danger' : 'btn-primary') + '" data-action="confirm-yes">' + esc(opts.confirmLabel || 'Confirm') + '</button>' +
    '</div>',
    { narrow: true }
  );
}

/* ---------------- New reservation ---------------- */

function openBookingModal(roomId) {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const rooms = DB.rooms
    .filter((r) => r.status !== 'maintenance')
    .sort((a, b) => Number(a.number) - Number(b.number));
  const guests = DB.guests.slice().sort((a, b) => a.name.localeCompare(b.name));

  const guestOptions = guests.map((g) =>
    '<option value="' + g.id + '">' + esc(g.name) + (g.vip ? ' · VIP' : '') + ' · ' + esc(g.country || '') + '</option>'
  ).join('');

  const roomOptions = rooms.map((r) =>
    '<option value="' + r.id + '" data-price="' + r.price + '" data-capacity="' + r.capacity + '">' +
      r.number + ' · ' + esc(r.type) + ' · ' + fmtMoney(r.price) + '/night · sleeps ' + r.capacity +
      (r.status === 'cleaning' ? ' (cleaning)' : '') +
    '</option>'
  ).join('');

  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">New reservation</div><h3>Book a stay</h3></div>' +
      '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button>' +
    '</div>' +
    '<form data-form="booking">' +
      '<div class="modal-body">' +
        '<div class="form-grid">' +
          '<div class="field span-2">' +
            '<label for="bk-guest">Guest</label>' +
            '<select id="bk-guest" name="guestId" required>' +
              '<option value="" selected disabled>Select a guest…</option>' +
              guestOptions +
              '<option value="__new">+ Add a new guest</option>' +
            '</select>' +
          '</div>' +
          '<div class="new-guest-fields" id="new-guest-fields" hidden>' +
            '<div class="field span-2"><label for="bk-new-name">New guest name</label><input id="bk-new-name" name="newName" placeholder="e.g. Aarav Sharma"></div>' +
            '<div class="field"><label for="bk-new-email">Email</label><input id="bk-new-email" name="newEmail" type="email" placeholder="name@email.com"></div>' +
            '<div class="field"><label for="bk-new-phone">Phone</label><input id="bk-new-phone" name="newPhone" placeholder="+351 900 000 000"></div>' +
          '</div>' +
          '<div class="field"><label for="bk-in">Check-in</label><input id="bk-in" name="checkIn" type="date" value="' + today + '" required></div>' +
          '<div class="field"><label for="bk-out">Check-out</label><input id="bk-out" name="checkOut" type="date" value="' + tomorrow + '" required></div>' +
          '<div class="field"><label for="bk-room">Room</label><select id="bk-room" name="roomId" required>' +
            '<option value="" selected disabled>Select a room…</option>' + roomOptions +
          '</select></div>' +
          '<div class="field"><label for="bk-source">Booking source</label><select id="bk-source" name="source">' +
            '<option>Direct</option><option>Booking.com</option><option>Expedia</option><option>Airbnb</option><option>Phone</option>' +
          '</select></div>' +
          '<div class="field"><label for="bk-adults">Adults</label><select id="bk-adults" name="adults">' +
            '<option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option>' +
          '</select></div>' +
          '<div class="field"><label for="bk-children">Children</label><select id="bk-children" name="children">' +
            '<option value="0" selected>0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>' +
          '</select></div>' +
          '<div class="field span-2"><label for="bk-notes">Notes</label><textarea id="bk-notes" name="notes" rows="2" placeholder="Early check-in, allergies, special requests…"></textarea></div>' +
          '<div class="calc-card">' +
            '<div class="calc-row"><span>Nights</span><strong id="calc-nights">1</strong></div>' +
            '<div class="calc-row"><span>Room subtotal</span><strong id="calc-subtotal">$0</strong></div>' +
            '<div class="calc-row"><span>Tax &amp; service (12%)</span><strong id="calc-tax">$0</strong></div>' +
            '<div class="calc-row total"><span>Total</span><strong id="calc-total">$0</strong></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button type="button" class="btn btn-quiet" data-action="close-modal">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + icon('check', 16) + ' Create reservation</button>' +
      '</div>' +
    '</form>',
    { wide: true }
  );

  if (roomId) {
    const select = $('#bk-room');
    if (select) {
      const exists = Array.from(select.options).some((o) => o.value === roomId);
      if (exists) select.value = roomId;
    }
  }
  updateBookingCalc();
}

function updateBookingCalc() {
  const roomSelect = $('#bk-room');
  if (!roomSelect) return;
  const room = roomById(roomSelect.value);
  const checkIn = $('#bk-in') ? $('#bk-in').value : '';
  const checkOut = $('#bk-out') ? $('#bk-out').value : '';
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const price = room ? room.price : 0;
  const subtotal = nights * price;
  const tax = round2(subtotal * TAX_RATE);
  $('#calc-nights').textContent = nights || '—';
  $('#calc-subtotal').textContent = fmtMoney(subtotal);
  $('#calc-tax').textContent = fmtMoney(tax);
  $('#calc-total').textContent = fmtMoney(round2(subtotal + tax));
}

/* ---------------- Reservation details ---------------- */

function openBookingModalView(id) {
  const b = bookingById(id);
  if (!b) return;
  const g = guestById(b.guestId);
  const r = roomById(b.roomId);
  const inv = invoiceForBooking(b.id);
  const nights = nightsBetween(b.checkIn, b.checkOut);

  let footer = '<button class="btn btn-quiet" data-action="close-modal">Close</button>';
  if (b.status === 'confirmed') {
    if (b.checkIn <= todayISO()) {
      footer = '<button class="btn btn-ghost btn-danger-ghost" data-action="cancel-booking" data-id="' + b.id + '">Cancel booking</button>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn-primary" data-action="checkin" data-id="' + b.id + '">' + icon('key', 16) + ' Check in guest</button>';
    } else {
      footer = '<span class="muted" style="font-size:12px">Arrival ' + relativeDay(b.checkIn).toLowerCase() + '</span>' +
        '<span class="spacer"></span>' +
        '<button class="btn btn-ghost btn-danger-ghost" data-action="cancel-booking" data-id="' + b.id + '">Cancel booking</button>' +
        '<button class="btn btn-quiet" data-action="close-modal">Close</button>';
    }
  } else if (b.status === 'checked-in') {
    footer = '<button class="btn btn-quiet" data-action="close-modal">Close</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-primary" data-action="checkout" data-id="' + b.id + '">' + icon('card', 16) + ' Check out & bill</button>';
  } else if (b.status === 'checked-out' && inv) {
    footer = '<button class="btn btn-quiet" data-action="close-modal">Close</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-ghost" data-action="view-invoice" data-id="' + inv.id + '">' + icon('receipt', 16) + ' View invoice</button>';
  }

  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">' + b.id + '</div><h3>' + esc(g.name) + '</h3></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' + bookingPill(b.status) +
        '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button></div>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="detail-guest">' + avatar(g.name, 'lg') +
        '<div><div class="name">' + esc(g.name) + vipTag(g) + '</div><div class="sub">' + esc(g.email || 'No email') + ' · ' + esc(g.phone || 'No phone') + '</div></div>' +
      '</div>' +
      '<div class="fact-grid">' +
        '<div class="fact"><span>Room</span><strong>' + r.number + ' · ' + esc(r.type) + '</strong><div class="sub">Floor ' + r.floor + ' · sleeps ' + r.capacity + '</div></div>' +
        '<div class="fact"><span>Stay</span><strong>' + fmtShort(b.checkIn) + ' → ' + fmtShort(b.checkOut) + '</strong><div class="sub">' + nights + ' night' + (nights === 1 ? '' : 's') + ' · ' + (b.adults + b.children) + ' guest' + (b.adults + b.children === 1 ? '' : 's') + '</div></div>' +
        '<div class="fact"><span>Source</span><strong>' + esc(b.source) + '</strong><div class="sub">Booked ' + fmtShort(b.createdAt) + '</div></div>' +
        '<div class="fact"><span>Total</span><strong>' + fmtMoney(b.total, 2) + '</strong><div class="sub">Incl. ' + fmtMoney(b.tax, 2) + ' tax</div></div>' +
      '</div>' +
      '<span class="section-label">Charges</span>' +
      '<div class="calc-card">' +
        '<div class="calc-row"><span>' + esc(r.type) + ' room · ' + fmtMoney(b.pricePerNight || r.price) + ' × ' + nights + '</span><strong>' + fmtMoney(b.subtotal) + '</strong></div>' +
        '<div class="calc-row"><span>Tax &amp; service (12%)</span><strong>' + fmtMoney(b.tax) + '</strong></div>' +
        '<div class="calc-row total"><span>Total</span><strong>' + fmtMoney(b.total, 2) + '</strong></div>' +
      '</div>' +
      (b.notes ? '<span class="section-label">Guest notes</span><p class="confirm-text">' + esc(b.notes) + '</p>' : '') +
    '</div>' +
    '<div class="modal-foot">' + footer + '</div>'
  );
}

/* ---------------- Room details ---------------- */

function openRoomModal(id) {
  const r = roomById(id);
  if (!r) return;
  const active = activeBookingForRoom(id);
  const activeGuest = active ? guestById(active.guestId) : null;
  const upcoming = DB.bookings
    .filter((b) => b.roomId === id && b.status === 'confirmed' && b.checkIn >= todayISO())
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 3);

  let statusButtons = '';
  if (r.status !== 'occupied') {
    if (r.status !== 'available') statusButtons += '<button class="btn btn-sm btn-ghost" data-action="set-room-status" data-id="' + r.id + '" data-status="available">Set available</button>';
    if (r.status !== 'cleaning') statusButtons += '<button class="btn btn-sm btn-ghost" data-action="set-room-status" data-id="' + r.id + '" data-status="cleaning">Mark cleaning</button>';
    if (r.status !== 'maintenance') statusButtons += '<button class="btn btn-sm btn-ghost" data-action="set-room-status" data-id="' + r.id + '" data-status="maintenance">Maintenance</button>';
  }

  const upcomingHtml = upcoming.length
    ? upcoming.map((b) => {
      const g = guestById(b.guestId);
      return '<div class="mini-booking">' + avatar(g.name, 'sm') +
        '<div class="grow"><div class="name">' + esc(g.name) + '</div><div class="sub">' + fmtShort(b.checkIn) + ' → ' + fmtShort(b.checkOut) + ' · ' + b.id + '</div></div>' +
        bookingPill(b.status) +
      '</div>';
    }).join('')
    : '<p class="muted" style="font-size:12px">No upcoming reservations for this room.</p>';

  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">Room details</div><h3>Room ' + r.number + '</h3></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' + roomPill(r.status) +
        '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button></div>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="fact-grid" style="margin-top:0">' +
        '<div class="fact"><span>Type</span><strong>' + esc(r.type) + '</strong><div class="sub">Floor ' + r.floor + '</div></div>' +
        '<div class="fact"><span>Rate</span><strong>' + fmtMoney(r.price) + ' / night</strong><div class="sub">Incl. 12% tax at checkout</div></div>' +
        '<div class="fact"><span>Capacity</span><strong>' + r.capacity + ' guests</strong><div class="sub">' + icon('bed', 12) + ' King or twin</div></div>' +
        '<div class="fact"><span>Status</span><strong>' + ROOM_STATUS[r.status].label + '</strong><div class="sub">Updated by housekeeping</div></div>' +
      '</div>' +
      '<span class="section-label">Amenities</span>' +
      '<div class="chips">' + r.amenities.map((a) => '<span class="chip">' + esc(a) + '</span>').join('') + '</div>' +
      (active && activeGuest ?
        '<span class="section-label">Currently in-house</span>' +
        '<div class="detail-guest">' + avatar(activeGuest.name, 'lg') +
          '<div><div class="name">' + esc(activeGuest.name) + vipTag(activeGuest) + '</div>' +
          '<div class="sub">' + active.id + ' · ' + fmtShort(active.checkIn) + ' → ' + fmtShort(active.checkOut) + ' · ' + fmtMoney(active.total) + '</div></div>' +
        '</div>' : '') +
      '<span class="section-label">Upcoming reservations</span>' +
      upcomingHtml +
    '</div>' +
    '<div class="modal-foot">' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + statusButtons + '</div>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-primary" data-action="book-room" data-id="' + r.id + '">' + icon('plus', 16) + ' Reserve this room</button>' +
    '</div>',
    { wide: true }
  );
}

/* ---------------- Guest form ---------------- */

function openGuestModal(id) {
  const g = id ? guestById(id) : null;
  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">' + (g ? 'Guest profile' : 'New guest') + '</div><h3>' + (g ? esc(g.name) : 'Add a guest') + '</h3></div>' +
      '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button>' +
    '</div>' +
    '<form data-form="guest">' +
      '<input type="hidden" name="id" value="' + (g ? g.id : '') + '">' +
      '<div class="modal-body">' +
        '<div class="form-grid">' +
          '<div class="field span-2"><label for="g-name">Full name</label><input id="g-name" name="name" required value="' + esc(g ? g.name : '') + '" placeholder="e.g. Aarav Sharma"></div>' +
          '<div class="field"><label for="g-email">Email</label><input id="g-email" name="email" type="email" value="' + esc(g ? g.email : '') + '" placeholder="name@email.com"></div>' +
          '<div class="field"><label for="g-phone">Phone</label><input id="g-phone" name="phone" value="' + esc(g ? g.phone : '') + '" placeholder="+351 900 000 000"></div>' +
          '<div class="field"><label for="g-country">Country</label><input id="g-country" name="country" value="' + esc(g ? g.country : '') + '" placeholder="Country"></div>' +
          '<div class="field"><span class="field-label">Guest status</span><label class="check"><input type="checkbox" name="vip"' + (g && g.vip ? ' checked' : '') + '> VIP guest</label></div>' +
          '<div class="field span-2"><label for="g-notes">Notes</label><textarea id="g-notes" name="notes" rows="2" placeholder="Preferences, allergies, special occasions…">' + esc(g ? g.notes : '') + '</textarea></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button type="button" class="btn btn-quiet" data-action="close-modal">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">' + icon('check', 16) + (g ? ' Save changes' : ' Add guest') + '</button>' +
      '</div>' +
    '</form>'
  );
}

/* ---------------- Invoice ---------------- */

function invoiceDocument(inv) {
  const b = bookingById(inv.bookingId);
  const g = guestById(inv.guestId);
  const r = roomById(inv.roomId);
  const nights = b ? nightsBetween(b.checkIn, b.checkOut) : 1;
  const meta = DB.meta;

  return '<div class="invoice-doc">' +
    '<div class="inv-top">' +
      '<div class="inv-brand">' +
        '<div class="brand-mark">L</div>' +
        '<div><div class="inv-hotel">' + esc(meta.hotelName) + '</div><div class="inv-addr">' + esc(meta.address) + '</div><div class="inv-addr">' + esc(meta.phone) + ' · ' + esc(meta.email) + '</div></div>' +
      '</div>' +
      '<div class="inv-meta">' +
        '<div class="label">Invoice</div>' +
        '<div class="no">' + inv.id + '</div>' +
        '<div class="date">Issued ' + fmtDateFull(inv.issuedAt) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="inv-parties">' +
      '<div><div class="label">Billed to</div><strong>' + esc(g.name) + '</strong><div class="line">' + esc(g.email || '') + '</div><div class="line">' + esc(g.country || '') + '</div></div>' +
      '<div><div class="label">Stay</div><strong>Room ' + r.number + ' · ' + esc(r.type) + '</strong><div class="line">' + fmtShort(b.checkIn) + ' → ' + fmtShort(b.checkOut) + ' · ' + nights + ' night' + (nights === 1 ? '' : 's') + '</div><div class="line">Reservation ' + b.id + '</div></div>' +
    '</div>' +
    '<table class="inv-table"><thead><tr><th>Description</th><th>Nights</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>' +
      '<tr><td class="desc"><strong>' + esc(r.type) + ' room · ' + r.number + '</strong><span>Accommodation for ' + esc(g.name) + '</span></td>' +
        '<td>' + nights + '</td><td class="num">' + fmtMoney(b.pricePerNight || r.price, 2) + '</td><td class="num">' + fmtMoney(inv.subtotal, 2) + '</td></tr>' +
    '</tbody></table>' +
    '<div class="inv-totals">' +
      '<div class="row"><span>Subtotal</span><span>' + fmtMoney(inv.subtotal, 2) + '</span></div>' +
      '<div class="row"><span>Tax &amp; service (12%)</span><span>' + fmtMoney(inv.tax, 2) + '</span></div>' +
      '<div class="row grand"><span>Total</span><span>' + fmtMoney(inv.total, 2) + '</span></div>' +
    '</div>' +
    '<div class="inv-note"><span>' + (inv.paid ? 'Paid ' + fmtShort(inv.paidAt || inv.issuedAt) + ' via ' + esc(inv.method || 'card') : 'Payment due by ' + fmtShort(inv.dueAt || inv.issuedAt)) + '</span><span>Thank you for staying with us.</span></div>' +
  '</div>';
}

function openInvoiceModal(id) {
  const inv = invoiceById(id);
  if (!inv) return;
  const g = guestById(inv.guestId);

  openModal(
    '<div class="modal-head">' +
      '<div><div class="eyebrow">Folio · ' + inv.id + '</div><h3>Invoice</h3></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' + invoicePill(inv) +
        '<button class="icon-btn plain" data-action="close-modal" aria-label="Close">' + icon('x', 18) + '</button></div>' +
    '</div>' +
    '<div class="modal-body">' + invoiceDocument(inv) + '</div>' +
    '<div class="modal-foot no-print">' +
      '<span class="muted" style="font-size:12px;margin-right:auto">' + esc(g.name) + ' · ' + fmtMoney(inv.total, 2) + '</span>' +
      (!inv.paid ? '<button class="btn btn-gold" data-action="mark-paid" data-id="' + inv.id + '">' + icon('card', 16) + ' Mark as paid</button>' : '') +
      '<button class="btn btn-ghost" data-action="print-invoice">' + icon('printer', 16) + ' Print</button>' +
      '<button class="btn btn-primary" data-action="close-modal">Done</button>' +
    '</div>',
    { wide: true }
  );
}
