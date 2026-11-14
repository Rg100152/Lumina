# Lumina — Hotel Management System (front-end)

A polished, dependency-free hotel management demo built with vanilla HTML, CSS and JavaScript. Everything runs in the browser, and all changes are saved to `localStorage` so the app survives a page reload.

![Lumina](https://img.shields.io/badge/Lumina-Hotel%20Management-0e3b31) ![No build step](https://img.shields.io/badge/build-none-b9922f)

## Run it

No installation or build step needed.

```bash
# option 1 — just open the file
xdg-open index.html        # or double-click index.html

# option 2 — serve it locally (recommended)
python3 -m http.server 8000
# then visit http://localhost:8000
```

Fonts load from Google Fonts when online; the app falls back to system fonts offline.

## What's included

- **Dashboard** — occupancy, 7-day revenue chart, room-status donut, arrivals/departures queues and recent reservations.
- **Reservations** — searchable, filterable list with the full booking lifecycle: create → check-in → check-out → invoice, plus cancellation with confirmation.
- **Rooms** — live room grid with housekeeping statuses (available / occupied / cleaning / maintenance), amenities, current and upcoming stays, and a "reserve this room" shortcut.
- **Guests** — searchable directory with stay counts, lifetime spend, VIP flags, and add/edit/delete profiles (deletion is blocked when booking history exists).
- **Billing** — automatic invoices on checkout, paid/due tracking, outstanding and monthly-collected totals, printable folio layout, and "mark as paid".
- **Extras** — CSV export of reservations, toast notifications, empty states, keyboard-friendly modals, responsive layout down to phone size, and a one-click demo reset.

## Booking rules implemented

- Check-out must be at least one night after check-in.
- A room cannot be double-booked for overlapping dates.
- Guest count must fit the room capacity.
- Rooms under maintenance cannot be booked or checked into.
- Check-in is only allowed on/after the arrival date; checkout generates a folio with 12% tax.
- After checkout the room moves to **cleaning**; after check-in it becomes **occupied**.

## Project structure

```
index.html
assets/
  css/
    base.css         # design tokens, shell, sidebar, topbar, KPIs, chart
    components.css   # tables, toolbars, room cards, modals, forms, invoice, responsive/print
  js/
    icons.js         # inline SVG icon set
    seed.js          # demo hotel, rooms, guests, reservations and invoices
    store.js         # localStorage, date/money helpers, derived metrics
    views.js         # dashboard, reservations, rooms, guests, billing renderers
    modals.js        # reservation/guest/room/invoice dialogs and forms
    app.js           # routing, events, booking flow, CSV export, toasts
```

## Demo data

- 24 rooms across 4 floors: Standard, Deluxe, Suite and Executive.
- 29 guest profiles, 29 reservations (in-house, arrivals, upcoming, departed, cancelled), and 11 invoices.
- Sample dates are generated relative to the day you open the app, so the dashboard always has arrivals, departures and a populated revenue chart.

Use **Reset demo data** in the sidebar to restore the original sample state at any time.

## Notes

This is a front-end demo: there is no server or authentication. Data lives only in your browser's `localStorage`. Invoices, folios and reports are illustrative and not connected to a payment provider.
