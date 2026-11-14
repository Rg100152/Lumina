/* Shared line-icon set (inline SVG, no dependencies) */
(function () {
  'use strict';

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.6"/><rect x="3" y="15" width="7.5" height="6" rx="1.6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/>',
    door: '<path d="M4 21V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17"/><path d="M2.5 21h19"/><circle cx="15.5" cy="12" r="1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6"/><path d="M17.6 14.5a6.2 6.2 0 0 1 3.6 5.5"/>',
    receipt: '<path d="M6 2.5h12a1 1 0 0 1 1 1V21l-3.5-2.2L12 21l-3.5-2.2L5 21V3.5a1 1 0 0 1 1-1Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.2 16.2 21 21"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="m4.5 12.5 5 5L20 6.5"/>',
    refresh: '<path d="M20.5 11.5a8.5 8.5 0 1 1-2.4-6"/><path d="M20.5 4.5v6.5h-6.5"/>',
    printer: '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>',
    trash: '<path d="M4 6h16M9 6V4h6v2M6 6l1 14.5h10L18 6"/><path d="M10 10v6M14 10v6"/>',
    edit: '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
    phone: '<path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h3"/>',
    key: '<circle cx="8" cy="15.5" r="4"/><path d="m11 13 9.5-9.5M17 7l3 3M14 10l3 3"/>',
    sparkles: '<path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    wrench: '<path d="M14.5 6.5a3.8 3.8 0 0 1 5 5l-8.2 8.2a2.3 2.3 0 0 1-3.3 0l-1.2-1.2a2.3 2.3 0 0 1 0-3.3Z"/><path d="m5 5 3.5 3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    download: '<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15"/>',
    star: '<path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.8l6-.8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.5 2"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    bed: '<path d="M3 19v-9M3 15h18M21 19v-8a2 2 0 0 0-2-2h-7v6"/><path d="M6 11V8h4v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    logout: '<path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'
  };

  window.icon = function (name, size, cls) {
    const body = ICONS[name] || ICONS.sparkles;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  };
})();
