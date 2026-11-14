/* App bootstrap, routing, events and actions */
'use strict';

/* ---------------- Boot ---------------- */

function init() {
  DB = loadDB();
  bindEvents();
  const route = getRoute();
  if (!location.hash || !VIEW_LABELS[route]) {
    try { history.replaceState(null, '', '#/dashboard'); } catch (err) { location.hash = '#/dashboard'; }
  }
  state.view = route;
  render();
  window.addEventListener('hashchange', function () {
    state.view = getRoute();
    document.body.classList.remove('nav-open');
    render();
    window.scrollTo(0, 0);
  });
}

function getRoute() {
  const raw = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
  return VIEW_LABELS[raw] ? raw : 'dashboard';
}

function render() {
  renderSidebar();
  renderTopbar();
  const renderers = {
    dashboard: renderDashboard,
    bookings: renderBookings,
    rooms: renderRooms,
    guests: renderGuests,
    billing: renderBilling
  };
  const renderer = renderers[state.view] || renderDashboard;
  $('#view').innerHTML = renderer();
}

/* ---------------- Events ---------------- */

function bindEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKeydown);
}

function handleClick(event) {
  if (event.target.classList && event.target.classList.contains('modal-backdrop')) {
    closeModal();
    return;
  }

  const filterButton = event.target.closest('[data-filter][data-value]');
  if (filterButton) {
    const parts = filterButton.dataset.filter.split('.');
    state.filters[parts[0]][parts[1]] = filterButton.dataset.value;
    render();
    return;
  }

  const el = event.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case 'close-nav':
      document.body.classList.remove('nav-open');
      break;
    case 'toggle-nav':
      document.body.classList.toggle('nav-open');
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'confirm-yes': {
      const fn = pendingConfirm;
      closeModal();
      if (fn) fn();
      break;
    }
    case 'new-booking':
      openBookingModal();
      break;
    case 'book-room':
      closeModal();
      openBookingModal(id);
      break;
    case 'view-room':
      openRoomModal(id);
      break;
    case 'view-booking':
      openBookingModalView(id);
      break;
    case 'view-invoice':
      openInvoiceModal(id);
      break;
    case 'new-guest':
      openGuestModal();
      break;
    case 'edit-guest':
      openGuestModal(id);
      break;
    case 'delete-guest':
      askDeleteGuest(id);
      break;
    case 'checkin':
      doCheckIn(id);
      break;
    case 'checkout':
      doCheckOut(id);
      break;
    case 'cancel-booking':
      askCancelBooking(id);
      break;
    case 'set-room-status':
      setRoomStatus(id, el.dataset.status);
      break;
    case 'mark-paid':
      markInvoicePaid(id);
      break;
    case 'print-invoice':
      window.print();
      break;
    case 'export-bookings':
      exportBookings();
      break;
    case 'reset-data':
      askReset();
      break;
    default:
      break;
  }
}

function handleSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.form === 'booking') submitBooking(form);
  if (form.dataset.form === 'guest') submitGuest(form);
}

function handleInput(event) {
  const el = event.target;
  if (el.matches('input[data-filter]')) {
    const parts = el.dataset.filter.split('.');
    state.filters[parts[0]][parts[1]] = el.value;
    const ref = el.dataset.filter;
    render();
    const next = $('input[data-filter="' + ref + '"]');
    if (next) {
      next.focus();
      try { next.setSelectionRange(next.value.length, next.value.length); } catch (err) { /* ignore */ }
    }
    return;
  }
  if (el.id === 'bk-in' || el.id === 'bk-out') updateBookingCalc();
}

function handleChange(event) {
  const el = event.target;
  if (el.matches('select[data-filter]')) {
    const parts = el.dataset.filter.split('.');
    state.filters[parts[0]][parts[1]] = el.value;
    render();
    return;
  }
  if (el.id === 'bk-guest') {
    const fields = $('#new-guest-fields');
    if (fields) {
      fields.hidden = el.value !== '__new';
      if (!fields.hidden) {
        const nameInput = $('#bk-new-name');
        if (nameInput) nameInput.focus();
      }
    }
    return;
  }
  if (el.id === 'bk-room' || el.id === 'bk-in' || el.id === 'bk-out' || el.id === 'bk-adults') {
    updateBookingCalc();
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    if ($('#modal-root') && $('#modal-root').innerHTML.trim()) closeModal();
    document.body.classList.remove('nav-open');
    return;
  }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.room-card')) {
    event.preventDefault();
    openRoomModal(event.target.dataset.id);
  }
}

/* ---------------- Reservation flow ---------------- */

function submitBooking(form) {
  const data = {};
  new FormData(form).forEach(function (value, key) { data[key] = value; });

  let guestId = data.guestId;
  let pendingNewGuest = null;
  if (!guestId) {
    showToast('Select a guest for this reservation.', 'error');
    return;
  }

  if (guestId === '__new') {
    const name = String(data.newName || '').trim();
    if (!name) {
      showToast("Enter the new guest's name.", 'error');
      return;
    }
    const email = String(data.newEmail || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Enter a valid email address.', 'error');
      return;
    }
    pendingNewGuest = {
      id: uid('g'),
      name: name,
      email: email,
      phone: String(data.newPhone || '').trim(),
      country: '',
      vip: false,
      notes: '',
      createdAt: todayISO()
    };
    guestId = '';
  }

  if (guestId && !guestById(guestId)) {
    showToast('That guest could not be found.', 'error');
    return;
  }

  const checkIn = data.checkIn;
  const checkOut = data.checkOut;
  if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) {
    showToast('Check-out must be at least one night after check-in.', 'error');
    return;
  }

  const room = roomById(data.roomId);
  if (!room) {
    showToast('Select a room for this reservation.', 'error');
    return;
  }
  if (room.status === 'maintenance') {
    showToast('Room ' + room.number + ' is out of order for maintenance.', 'error');
    return;
  }

  const adults = Number(data.adults) || 1;
  const children = Number(data.children) || 0;
  if (adults + children > room.capacity) {
    showToast('Room ' + room.number + ' sleeps a maximum of ' + room.capacity + ' guests.', 'error');
    return;
  }
  if (!isRoomFree(room.id, checkIn, checkOut)) {
    showToast('Room ' + room.number + ' is already reserved for those dates.', 'error');
    return;
  }

  if (pendingNewGuest) {
    DB.guests.push(pendingNewGuest);
    guestId = pendingNewGuest.id;
  }

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = round2(nights * room.price);
  const tax = round2(subtotal * TAX_RATE);
  const booking = {
    id: nextBookingId(),
    guestId: guestId,
    roomId: room.id,
    checkIn: checkIn,
    checkOut: checkOut,
    adults: adults,
    children: children,
    status: 'confirmed',
    source: data.source || 'Direct',
    notes: String(data.notes || '').trim(),
    pricePerNight: room.price,
    subtotal: subtotal,
    tax: tax,
    total: round2(subtotal + tax),
    createdAt: todayISO(),
    checkedInAt: null,
    checkedOutAt: null
  };

  DB.bookings.push(booking);
  saveDB();
  closeModal();
  render();
  showToast('Reservation ' + booking.id + ' created for ' + guestById(guestId).name + '.', 'success');
}

function doCheckIn(id) {
  const booking = bookingById(id);
  if (!booking || booking.status !== 'confirmed') return;
  const today = todayISO();
  if (today < booking.checkIn) {
    showToast('This guest is not due until ' + fmtMedium(booking.checkIn) + '.', 'error');
    return;
  }
  const room = roomById(booking.roomId);
  if (room.status === 'maintenance') {
    showToast('Room ' + room.number + ' is out of order for maintenance.', 'error');
    return;
  }
  const current = activeBookingForRoom(room.id);
  if (current && current.id !== booking.id) {
    showToast('Room ' + room.number + ' is still occupied. Check the current guest out first.', 'error');
    return;
  }

  booking.status = 'checked-in';
  booking.checkedInAt = today;
  room.status = 'occupied';
  saveDB();
  closeModal();
  render();
  showToast(guestById(booking.guestId).name + ' checked into room ' + room.number + '.', 'success');
}

function doCheckOut(id) {
  const booking = bookingById(id);
  if (!booking || booking.status !== 'checked-in') return;
  const room = roomById(booking.roomId);
  const guest = guestById(booking.guestId);

  booking.status = 'checked-out';
  booking.checkedOutAt = todayISO();
  room.status = 'cleaning';

  let invoice = invoiceForBooking(booking.id);
  if (!invoice) {
    invoice = {
      id: nextInvoiceId(),
      bookingId: booking.id,
      guestId: booking.guestId,
      roomId: booking.roomId,
      issuedAt: todayISO(),
      dueAt: addDaysISO(todayISO(), 7),
      subtotal: booking.subtotal,
      tax: booking.tax,
      total: booking.total,
      paid: false,
      method: null,
      paidAt: null
    };
    DB.invoices.push(invoice);
  }

  saveDB();
  closeModal();
  render();
  showToast(guest.name + ' checked out · ' + invoice.id + ' for ' + fmtMoney(invoice.total, 2) + '.', 'success');
}

function askCancelBooking(id) {
  const booking = bookingById(id);
  if (!booking) return;
  const guest = guestById(booking.guestId);
  confirmDialog({
    title: 'Cancel this reservation?',
    message: 'This will free up room ' + roomById(booking.roomId).number + ' for <strong>' + esc(guest.name) + '</strong> (' + esc(booking.id) + '). This action cannot be undone.',
    confirmLabel: 'Cancel reservation',
    onConfirm: function () {
      booking.status = 'cancelled';
      saveDB();
      render();
      showToast('Reservation ' + booking.id + ' cancelled.', 'info');
    }
  });
}

function setRoomStatus(id, status) {
  const room = roomById(id);
  if (!room || !ROOM_STATUS[status]) return;
  if (room.status === 'occupied') {
    showToast('Check the guest out before changing this room.', 'error');
    return;
  }
  room.status = status;
  saveDB();
  closeModal();
  render();
  showToast('Room ' + room.number + ' is now ' + ROOM_STATUS[status].label.toLowerCase() + '.', 'info');
}

/* ---------------- Guests ---------------- */

function submitGuest(form) {
  const data = {};
  new FormData(form).forEach(function (value, key) { data[key] = value; });

  const name = String(data.name || '').trim();
  if (!name) {
    showToast("Please enter the guest's name.", 'error');
    return;
  }
  const email = String(data.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Enter a valid email address.', 'error');
    return;
  }

  const payload = {
    name: name,
    email: email,
    phone: String(data.phone || '').trim(),
    country: String(data.country || '').trim(),
    vip: data.vip === 'on',
    notes: String(data.notes || '').trim()
  };

  if (data.id) {
    const guest = guestById(data.id);
    if (!guest) return;
    Object.assign(guest, payload);
    showToast('Guest profile updated.', 'success');
  } else {
    DB.guests.push(Object.assign({ id: uid('g'), createdAt: todayISO() }, payload));
    showToast(name + ' added to the guest directory.', 'success');
  }

  saveDB();
  closeModal();
  render();
}

function askDeleteGuest(id) {
  const guest = guestById(id);
  if (!guest) return;
  const hasHistory = DB.bookings.some(function (b) { return b.guestId === id; });
  if (hasHistory) {
    showToast('This guest has booking history and cannot be deleted.', 'error');
    return;
  }
  confirmDialog({
    title: 'Delete guest profile?',
    message: '<strong>' + esc(guest.name) + '</strong> will be removed from the guest directory. This cannot be undone.',
    confirmLabel: 'Delete guest',
    onConfirm: function () {
      DB.guests = DB.guests.filter(function (g) { return g.id !== id; });
      saveDB();
      render();
      showToast('Guest profile deleted.', 'info');
    }
  });
}

/* ---------------- Billing ---------------- */

function markInvoicePaid(id) {
  const invoice = invoiceById(id);
  if (!invoice || invoice.paid) return;
  invoice.paid = true;
  invoice.paidAt = todayISO();
  invoice.method = 'Card';
  saveDB();
  closeModal();
  render();
  showToast('Invoice ' + invoice.id + ' marked as paid.', 'success');
}

function exportBookings() {
  const rows = [['Booking', 'Guest', 'Email', 'Phone', 'Room', 'Room type', 'Check-in', 'Check-out', 'Nights', 'Status', 'Source', 'Total']];
  DB.bookings.forEach(function (b) {
    const g = guestById(b.guestId);
    const r = roomById(b.roomId);
    rows.push([
      b.id, g ? g.name : '', g ? g.email : '', g ? g.phone : '',
      r ? r.number : '', r ? r.type : '',
      b.checkIn, b.checkOut, nightsBetween(b.checkIn, b.checkOut),
      b.status, b.source, b.total.toFixed(2)
    ]);
  });
  const csv = rows.map(function (row) {
    return row.map(function (cell) {
      return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\r\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lumina-reservations-' + todayISO() + '.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  showToast('Reservation export downloaded.', 'info');
}

/* ---------------- Demo reset ---------------- */

function askReset() {
  confirmDialog({
    title: 'Reset the demo?',
    message: 'All reservations, guests, invoices and room changes you made will be replaced with the original sample data.',
    confirmLabel: 'Reset everything',
    onConfirm: resetDemo
  });
}

function resetDemo() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
  DB = window.buildSeedData();
  persist(DB);
  state.filters = {
    bookings: { status: 'all', q: '' },
    rooms: { status: 'all', type: 'all', q: '' },
    guests: { q: '' },
    billing: { status: 'all', q: '' }
  };
  try { history.replaceState(null, '', '#/dashboard'); } catch (err) { /* ignore */ }
  state.view = 'dashboard';
  document.body.classList.remove('nav-open');
  render();
  showToast('Demo data restored to its original state.', 'info');
}

/* ---------------- Toast ---------------- */

function showToast(message, type) {
  const root = $('#toast-root');
  if (!root) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  const iconName = type === 'error' ? 'alert' : type === 'info' ? 'sparkles' : 'check';
  toast.innerHTML = '<span class="toast-icon">' + icon(iconName, 17) + '</span><span>' + esc(message) + '</span>';
  root.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('out');
    setTimeout(function () { toast.remove(); }, 220);
  }, 3400);
}

/* ---------------- Start ---------------- */

init();
