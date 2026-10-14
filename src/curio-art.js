// Small hand-drawn curios for the cabinet, local inline SVG only (48x48 view box).
const S='stroke="#8d6a3a" stroke-width="1.3"';
const art={
 'blue-marble':`<circle cx="24" cy="24" r="12" fill="#7fa3c8" ${S}/><path d="M17 22c4-5 10-6 14-2" fill="none"`+
   ` stroke="#e7f0f7" stroke-width="2"/>`,
 'old-stamp':`<rect x="13" y="11" width="22" height="26" fill="#f3e3c3" ${S} stroke-dasharray="2 1.5"/>`+
   `<circle cx="24" cy="21" r="5" fill="#9fb06a"/><circle cx="22" cy="20" r="1.4" fill="#e8c64f"/>`+
   `<rect x="23" y="25" width="2" height="7" fill="#8d6a3a"/>`,
 'tiny-spoon':`<ellipse cx="24" cy="14" rx="6" ry="8" fill="#d9dde2" ${S}/><path d="M24 22v17" ${S}`+
   ` stroke-linecap="round"/>`,
 'glass-button':`<circle cx="24" cy="24" r="11" fill="#9cc9a6" ${S}/><g fill="#5f8a6a"><circle cx="21" cy="21"`+
   ` r="1.6"/><circle cx="27" cy="21" r="1.6"/><circle cx="21" cy="27" r="1.6"/><circle cx="27" cy="27" r="1.6"/></g>`,
 'lavender-sachet':`<path d="M15 20c0-4 18-4 18 0l-2 17H17z" fill="#c8b6dd" ${S}/><path d="M16 20c3-4 13-4 16 0"`+
   ` fill="none" stroke="#7c5f99" stroke-width="2"/><path d="M24 16v-6m-3 2 3-2 3 2" ${S} fill="none"/>`,
 'paper-star':`<path d="M24 9l4 10 10 1-8 7 3 11-9-6-9 6 3-11-8-7 10-1z" fill="#f6edd8" ${S}/>`,
 'copper-coin':`<circle cx="24" cy="24" r="11" fill="#c47e4f" ${S}/><circle cx="24" cy="24" r="7" fill="none"`+
   ` stroke="#8d4f2e" stroke-width="1"/>`,
 'seashell':`<path d="M24 37c-9 0-13-8-11-15 2-6 8-10 11-10s9 4 11 10c2 7-2 15-11 15z" fill="#f2d4c4" ${S}/>`+
   `<path d="M24 12v25M19 14l3 23M29 14l-3 23" stroke="#c99b86" stroke-width="1"/>`,
 'hair-ribbon':`<path d="M24 24c-6-8-13-7-13-2s7 6 13 2c6 4 13 3 13-2s-7-6-13 2z" fill="#e3a4b6" ${S}/>`+
   `<path d="M22 26l-4 12M26 26l4 12" stroke="#c97a93" stroke-width="2.4" stroke-linecap="round"/>`,
 'olive-wood-bird':`<path d="M12 28c2-8 10-12 18-8l6-3-2 6c0 7-6 12-14 11-4 0-7-3-8-6z"`+
   ` fill="#b48a5a" ${S}/>`+
   `<circle cx="31" cy="22" r="1.3" fill="#3f2f22"/>`,
 'embroidered-patch':`<rect x="12" y="12" width="24" height="24" rx="4" fill="#efe1cf" ${S}/>`+
   `<path d="M18 24h12M24 18v12"`+
   ` stroke="#b0607f" stroke-width="2" stroke-dasharray="2 2"/>`,
 'silver-bell':`<path d="M16 32c0-10 3-17 8-17s8 7 8 17z" fill="#d9dde2" ${S}/><circle cx="24" cy="34" r="2.5"`+
   ` fill="#b9bec6" ${S}/><path d="M24 15v-4" ${S}/>`,
};
export const curioArt=id=>art[id]?`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${art[id]}</svg>`:'';
export const CURIO_ART_IDS=Object.keys(art);
