/* Demo data for Lumina HMS. Dates are generated relative to "today". */
(function () {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const day = (offset) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return iso(d);
  };
  const round2 = (n) => Math.round(n * 100) / 100;
  const TAX = 0.12;

  window.buildSeedData = function buildSeedData() {
    /* ---------------- Rooms ---------------- */
    const roomGroups = [
      { numbers: [101, 102, 103, 104, 105, 106, 107, 108], type: 'Standard', price: 149, capacity: 2, floor: 1, amenities: ['Queen bed', 'Wi-Fi', 'Smart TV', 'Air conditioning', 'Safety box'] },
      { numbers: [201, 202, 203, 204, 205, 206, 207, 208], type: 'Deluxe', price: 219, capacity: 3, floor: 2, amenities: ['King bed', 'Wi-Fi', 'Smart TV', 'Balcony', 'Mini bar', 'Rain shower'] },
      { numbers: [301, 302, 303, 304], type: 'Suite', price: 349, capacity: 4, floor: 3, amenities: ['King bed', 'Living room', 'Harbour view', 'Espresso machine', 'Bathtub', 'Wi-Fi'] },
      { numbers: [401, 402, 403, 404], type: 'Executive', price: 599, capacity: 4, floor: 4, amenities: ['King bed', 'Panoramic terrace', 'Lounge access', 'Butler service', 'Espresso machine', 'Wi-Fi'] }
    ];

    const rooms = [];
    roomGroups.forEach((group) => {
      group.numbers.forEach((number) => {
        rooms.push({
          id: 'r' + number,
          number: String(number),
          type: group.type,
          floor: group.floor,
          capacity: group.capacity,
          price: group.price,
          status: 'available',
          amenities: group.amenities.slice(),
          notes: ''
        });
      });
    });

    /* ---------------- Guests ---------------- */
    const guestRows = [
      ['Aarav Sharma', 'aarav.sharma@mail.com', '+91 98110 24571', 'India', false],
      ['Elena Rossi', 'elena.rossi@mail.com', '+39 340 118 7742', 'Italy', false],
      ['James Whitmore', 'j.whitmore@mail.com', '+44 7700 900 142', 'United Kingdom', true],
      ['Priya Nair', 'priya.nair@mail.com', '+91 98450 77109', 'India', false],
      ['Marcus Chen', 'marcus.chen@mail.com', '+65 8123 4471', 'Singapore', false],
      ['Sofia Alvarez', 'sofia.alvarez@mail.com', '+34 612 884 903', 'Spain', false],
      ['Tom Becker', 'tom.becker@mail.com', '+49 151 2233 8890', 'Germany', false],
      ['Nadia Haddad', 'nadia.haddad@mail.com', '+961 3 442 118', 'Lebanon', false],
      ["Liam O'Connor", 'liam.oconnor@mail.com', '+353 87 221 4590', 'Ireland', false],
      ['Yuki Tanaka', 'yuki.tanaka@mail.com', '+81 90 3341 7782', 'Japan', false],
      ['Grace Okoro', 'grace.okoro@mail.com', '+234 803 552 9014', 'Nigeria', false],
      ['Daniel Weber', 'daniel.weber@mail.com', '+49 160 887 1123', 'Germany', false],
      ['Isabella Moreau', 'isabella.moreau@mail.com', '+33 6 12 88 40 21', 'France', false],
      ['Arjun Patel', 'arjun.patel@mail.com', '+91 99043 11876', 'India', false],
      ['Hannah Kim', 'hannah.kim@mail.com', '+82 10 4421 7789', 'South Korea', false],
      ['Oliver Brown', 'oliver.brown@mail.com', '+61 412 887 330', 'Australia', false],
      ['Chloe Martin', 'chloe.martin@mail.com', '+33 6 74 20 18 55', 'France', false],
      ['Lucas Silva', 'lucas.silva@mail.com', '+55 11 98812 4471', 'Brazil', false],
      ['Amara Diallo', 'amara.diallo@mail.com', '+221 77 441 2290', 'Senegal', false],
      ['Noah Fischer', 'noah.fischer@mail.com', '+49 171 220 8845', 'Germany', true],
      ['Mei Lin', 'mei.lin@mail.com', '+86 138 7744 2291', 'China', false],
      ['David Kahn', 'david.kahn@mail.com', '+1 415 555 0132', 'United States', false],
      ['Emma Wilson', 'emma.wilson@mail.com', '+1 604 555 0188', 'Canada', false],
      ['Bianca Rossi', 'bianca.rossi@mail.com', '+39 333 778 2201', 'Italy', false],
      ['Omar Farouk', 'omar.farouk@mail.com', '+20 100 442 8890', 'Egypt', false],
      ['Ana Costa', 'ana.costa@mail.com', '+351 912 445 778', 'Portugal', false],
      ['Henry Lee', 'henry.lee@mail.com', '+1 212 555 0173', 'United States', false],
      ['Freya Nielsen', 'freya.nielsen@mail.com', '+45 22 88 41 09', 'Denmark', false],
      ['Ravi Menon', 'ravi.menon@mail.com', '+91 94440 22117', 'India', false]
    ];

    const guests = guestRows.map((row, i) => ({
      id: 'g' + (1001 + i),
      name: row[0],
      email: row[1],
      phone: row[2],
      country: row[3],
      vip: row[4],
      notes: row[4] ? 'Prefers a high floor and late check-out.' : '',
      createdAt: day(-(90 - i * 2))
    }));

    const guest = (i) => guests[i].id;

    /* ---------------- Reservations ----------------
       [guestIndex, roomNumber, checkInOffset, checkOutOffset, status, source, notes] */
    const rows = [
      // In-house guests
      [0, 203, -2, 2, 'checked-in', 'Direct', 'Quiet room away from the lift.'],
      [1, 304, -1, 3, 'checked-in', 'Booking.com', ''],
      [2, 401, -3, 1, 'checked-in', 'Direct', 'VIP — champagne on arrival.'],
      [3, 108, -1, 0, 'checked-in', 'Expedia', 'Departing today.'],
      [4, 404, -2, 0, 'checked-in', 'Direct', 'Late checkout requested.'],
      [5, 302, -4, 3, 'checked-in', 'Booking.com', ''],
      [6, 205, -1, 4, 'checked-in', 'Phone', 'Extra pillows.'],
      [23, 106, -2, 1, 'checked-in', 'Direct', ''],
      [24, 208, -3, 2, 'checked-in', 'Expedia', ''],
      [25, 103, -1, 2, 'checked-in', 'Booking.com', ''],
      [26, 204, -2, 1, 'checked-in', 'Direct', ''],
      [27, 107, -1, 3, 'checked-in', 'Phone', 'Cot for a toddler.'],

      // Arrivals today
      [7, 104, 0, 2, 'confirmed', 'Booking.com', 'Airport transfer at 14:30.'],
      [8, 206, 0, 1, 'confirmed', 'Direct', ''],
      [9, 303, 0, 3, 'confirmed', 'Expedia', 'Anniversary stay.'],

      // Upcoming
      [10, 301, 2, 5, 'confirmed', 'Booking.com', ''],
      [11, 202, 1, 3, 'confirmed', 'Direct', ''],

      // Departed (history + invoices)
      [12, 304, -6, -3, 'checked-out', 'Direct', ''],
      [13, 201, -5, -2, 'checked-out', 'Expedia', ''],
      [14, 103, -7, -4, 'checked-out', 'Booking.com', ''],
      [15, 402, -4, -1, 'checked-out', 'Direct', 'Left a jacket — posted to guest.'],
      [17, 101, -8, -5, 'checked-out', 'Airbnb', ''],
      [18, 204, -9, -6, 'checked-out', 'Booking.com', ''],
      [19, 403, -10, -7, 'checked-out', 'Direct', ''],
      [20, 206, -6, -3, 'checked-out', 'Expedia', ''],
      [21, 303, -5, -1, 'checked-out', 'Direct', ''],
      [22, 207, -4, -2, 'checked-out', 'Booking.com', ''],
      [28, 102, -5, 0, 'checked-out', 'Direct', 'Checked out early this morning.'],

      // Cancelled
      [16, 207, 3, 6, 'cancelled', 'Booking.com', 'Guest cancelled — travel plans changed.']
    ];

    const bookings = [];
    rows.forEach((row, i) => {
      const gid = guest(row[0]);
      const roomNumber = row[1];
      const room = rooms.find((r) => r.number === String(roomNumber));
      const checkIn = day(row[2]);
      const checkOut = day(row[3]);
      const nights = Math.max(1, Math.round((new Date(checkOut + 'T12:00:00') - new Date(checkIn + 'T12:00:00')) / 86400000));
      const subtotal = round2(nights * room.price);
      const tax = round2(subtotal * TAX);
      bookings.push({
        id: 'BK-' + (1001 + i),
        guestId: gid,
        roomId: room.id,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: Math.min(room.capacity, 1 + (i % 2)),
        children: 0,
        status: row[4],
        source: row[5],
        notes: row[6],
        pricePerNight: room.price,
        subtotal: subtotal,
        tax: tax,
        total: round2(subtotal + tax),
        createdAt: day(row[2] - (8 + (i % 9))),
        checkedInAt: row[4] === 'checked-in' || row[4] === 'checked-out' ? checkIn : null,
        checkedOutAt: row[4] === 'checked-out' ? checkOut : null
      });
    });

    /* ---------------- Room status ---------------- */
    const occupied = new Set(
      bookings.filter((b) => b.status === 'checked-in').map((b) => b.roomId)
    );
    rooms.forEach((room) => {
      if (occupied.has(room.id)) room.status = 'occupied';
      else if (['102', '105', '201'].includes(room.number)) room.status = 'cleaning';
      else if (room.number === '402') room.status = 'maintenance';
    });

    /* ---------------- Invoices ---------------- */
    const invoices = [];
    const paidFlags = { 402: false, 207: false };
    const methods = ['Visa •• 4242', 'Mastercard •• 8810', 'Cash', 'Bank transfer'];
    let invoiceNo = 2041;

    bookings
      .filter((b) => b.status === 'checked-out')
      .sort((a, b) => a.checkOut.localeCompare(b.checkOut))
      .forEach((b, i) => {
        const isPaid = paidFlags[Number(rooms.find((r) => r.id === b.roomId).number)] !== false;
        invoices.push({
          id: 'INV-' + invoiceNo,
          bookingId: b.id,
          guestId: b.guestId,
          roomId: b.roomId,
          issuedAt: b.checkOut,
          dueAt: day(7),
          subtotal: b.subtotal,
          tax: b.tax,
          total: b.total,
          paid: isPaid,
          method: isPaid ? methods[i % methods.length] : null,
          paidAt: isPaid ? b.checkOut : null
        });
        invoiceNo += 1;
      });

    return {
      meta: {
        hotelName: 'Lumina Harbour Hotel',
        location: 'Marina District, Lisbon',
        address: 'Rua do Porto 18, 1200-429 Lisbon, Portugal',
        phone: '+351 21 555 0180',
        email: 'frontdesk@luminaharbour.com',
        currency: 'USD',
        taxRate: TAX,
        seededAt: new Date().toISOString(),
        version: 1
      },
      rooms: rooms,
      guests: guests,
      bookings: bookings,
      invoices: invoices
    };
  };
})();
