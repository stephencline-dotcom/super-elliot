// Original SVG ballpark: dusk sky, light towers, outfield wall, and a diamond. Decorative only.
const SVG = `
<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" focusable="false">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#050f26"/><stop offset="0.6" stop-color="#0b2a66"/><stop offset="1" stop-color="#1b4a9a"/>
    </linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1f7a3a"/><stop offset="1" stop-color="#14562a"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fffbe0" stop-opacity="0.95"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#sky)"/>
  <g fill="#fff" opacity="0.7">
    <circle cx="140" cy="60" r="1.6"/><circle cx="320" cy="110" r="1.4"/><circle cx="520" cy="50" r="1.6"/>
    <circle cx="700" cy="95" r="1.2"/><circle cx="880" cy="40" r="1.6"/><circle cx="1060" cy="120" r="1.4"/>
  </g>
  <g class="lights">
    <g transform="translate(130 150)"><rect x="-4" y="40" width="8" height="260" fill="#0a1736"/><rect x="-60" y="0" width="120" height="44" rx="6" fill="#0a1736"/><circle class="lamp" cx="0" cy="20" r="150" fill="url(#glow)"/>
      <g fill="#fffbe0"><circle cx="-42" cy="12" r="6"/><circle cx="-21" cy="12" r="6"/><circle cx="0" cy="12" r="6"/><circle cx="21" cy="12" r="6"/><circle cx="42" cy="12" r="6"/><circle cx="-42" cy="30" r="6"/><circle cx="-21" cy="30" r="6"/><circle cx="0" cy="30" r="6"/><circle cx="21" cy="30" r="6"/><circle cx="42" cy="30" r="6"/></g></g>
    <g transform="translate(1070 150)"><rect x="-4" y="40" width="8" height="260" fill="#0a1736"/><rect x="-60" y="0" width="120" height="44" rx="6" fill="#0a1736"/><circle class="lamp" cx="0" cy="20" r="150" fill="url(#glow)"/>
      <g fill="#fffbe0"><circle cx="-42" cy="12" r="6"/><circle cx="-21" cy="12" r="6"/><circle cx="0" cy="12" r="6"/><circle cx="21" cy="12" r="6"/><circle cx="42" cy="12" r="6"/><circle cx="-42" cy="30" r="6"/><circle cx="-21" cy="30" r="6"/><circle cx="0" cy="30" r="6"/><circle cx="21" cy="30" r="6"/><circle cx="42" cy="30" r="6"/></g></g>
  </g>
  <g fill="#102447" stroke="#62799f" stroke-width="2" opacity=".65">
    <path d="M280 350V285H320V255H355V350 M355 350V300H400V270H430V350 M780 350V275H825V245H850V350 M860 350V295H910V265H945V350"/>
  </g>
  <g stroke="#dde5f2" stroke-width="3">
    <path d="M210 340V230 M990 340V230"/>
    <path d="M210 235L275 255L210 275Z" fill="#cb3545"/>
    <path d="M990 235L925 255L990 275Z" fill="#3074a2"/>
  </g>
  <g fill="#f4d16a" opacity=".8"><circle cx="270" cy="400" r="3"/><circle cx="315" cy="395" r="3"/><circle cx="360" cy="390" r="3"/><circle cx="840" cy="390" r="3"/><circle cx="885" cy="395" r="3"/><circle cx="930" cy="400" r="3"/></g>
  <path d="M0 400 Q600 330 1200 400 L1200 440 L0 440 Z" fill="#0c3a2a"/>
  <path d="M0 400 Q600 330 1200 400" stroke="#e81828" stroke-width="8" fill="none"/>
  <rect y="430" width="1200" height="270" fill="url(#grass)"/>
  <path d="M600 470 L880 590 L600 700 L320 590 Z" fill="#b5835a" opacity="0.85"/>
  <path d="M600 500 L820 590 L600 670 L380 590 Z" fill="#1f7a3a"/>
  <g fill="#fff"><rect x="590" y="492" width="20" height="20" transform="rotate(45 600 502)"/><rect x="810" y="580" width="20" height="20" transform="rotate(45 820 590)"/><rect x="370" y="580" width="20" height="20" transform="rotate(45 380 590)"/><path d="M600 655 l14 -8 l14 8 l0 12 l-28 0 z" transform="translate(-14 0)"/></g>
  <rect y="430" width="1200" height="270" fill="#000" opacity="0.18"/>
</svg>`;

export function renderScene(root) {
  root.innerHTML = SVG; // static, trusted markup
}
