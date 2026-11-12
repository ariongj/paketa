// PrintWorks Studio 3D — a paper carrier bag the shopper configures and prints on, drawn with three.js.
// Plain JavaScript on purpose: it is its own page (studio.html), embedded by src/site/pages/Studio3D.tsx.
// The page talks to the storefront through window.pwStudio and "pw-studio" postMessage events (see the end of the file).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import qrcode from 'qrcode-generator';
import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@fontsource-variable/montserrat/wght.css';
import '@fontsource-variable/oswald/wght.css';
import '@fontsource-variable/playfair-display/wght.css';
import '@fontsource-variable/dancing-script/wght.css';
import './studio.css';

const CM = 0.01;          // scene units are metres, the model is authored in cm
const PAPER_TILE = 3.2;   // cm covered by one tile of the paper grain texture

// ---------------- language ----------------
const params = new URLSearchParams(location.search);
// ?embed=1: only the bag, turning slowly (the homepage showcase); ?bg=ecebef sets the backdrop to match the page around it.
const embed = params.has('embed');
if (embed) document.body.classList.add('embed');
if (/^[0-9a-f]{6}$/i.test(params.get('bg') || '')) document.documentElement.style.setProperty('--stage', '#' + params.get('bg'));
let lang = params.get('lang') === 'en' ? 'en' : 'sq';
const I18N = {
  sq: {
    camera: 'Kamera', v_front: 'Para', v_side: 'Anash', v_inside: 'Brenda',
    light: 'Drita', light_rot: 'Rrotullo', light_bright: 'Ndriçimi',
    hud: 'Tërhiqeni për ta rrotulluar · rrota e miut për zmadhim',
    steps: 'Hapat', tab_samples: 'Shembuj', tab_bag: 'Qesja', tab_design: 'Dizajni',
    samples_lead: 'Nisni nga një shembull. Gjithçka mund ta ndryshoni në hapat e ardhshëm.',
    next_bag: 'Vazhdo: zgjidhni qesen', next_design: 'Vazhdo: shtoni dizajnin',
    paper: 'Letra', size: 'Madhësia', size_note: 'gjerësi × thellësi × lartësi',
    colour: 'Ngjyra e qeses', colour_custom: 'Ngjyra juaj — Pantone sipas markës', custom: 'Ngjyrë e personalizuar',
    finish: 'Finishing', handle: 'Doreza', pose_up: 'Dorezat lart', pose_down: 'Dorezat poshtë',
    side: 'Ana e qeses', front: 'Para', back: 'Prapa', copy_back: 'Kopjo prapa', copy_front: 'Kopjo para',
    editor_aria: 'Sipërfaqja e printimit për anën e zgjedhur. Tërhiqni një element për ta lëvizur, tërhiqni këndin për ta zmadhuar; shigjetat e lëvizin pak nga pak.',
    add_text: '+ Tekst', add_logo: '+ Logo', add_qr: '+ Kod QR', remove: 'Hiqe',
    k_text: 'Tekst', k_logo: 'Logo', k_qr: 'Kod QR', k_graphic: 'Grafikë',
    font: 'Fonti', qr_link: 'Lidhja e kodit QR', m_mono: '1 ngjyrë', m_full: 'Me ngjyra (CMYK)', ink: 'Ngjyra e bojës',
    width: 'Gjerësia', centre: 'Vendose në qendër',
    design_note: 'Tërhiqni për ta lëvizur. Tërhiqni katrorin në kënd për ta zmadhuar. Shigjetat e lëvizin elementin e zgjedhur. Zonat me vija nuk printohen.',
    your_text: 'Teksti juaj',
    added: 'U shtua {name}. Tërhiqeni në vendin e duhur.',
    bad_file: 'Ky skedar nuk u lexua si imazh. Provoni PNG, JPG ose SVG.',
    copied_back: 'Ana e pasme tani ka të njëjtin dizajn si e përparmja.',
    copied_front: 'Ana e përparme tani ka të njëjtin dizajn si e pasmja.',
    n_qr_contrast: 'Kontrast i ulët me letrën, ndaj telefonat mund të mos e lexojnë këtë kod QR. Zgjidhni një bojë më të errët ose më të çelët.',
    n_qr_inverted: 'Bojë e çelët mbi letër të errët jep një kod QR të përmbysur, që disa telefona nuk e lexojnë. Skanoni provën para se të porosisni.',
    n_qr_foil: 'Folja metalike e reflekton dritën dhe e vështirëson skanimin. Për kodin QR zgjidhni një bojë mat.',
    n_qr_small: 'Bëjeni të paktën 2,5 cm të gjerë që telefonat ta lexojnë lehtë.',
    n_qr_ok: 'Madhësi dhe kontrast që lexohen mirë.',
    n_full: 'Logot me ngjyra printohen në CMYK dhe i ruajnë ngjyrat e veta.',
    n_text: 'Vendosni **dy yje** rreth fjalëve për t’i bërë më të trasha. Enter për rresht të ri.',
    n_foil: 'Folja stampohet me nxehtësi pas printimit. Rrotullojeni qesen që të shihni si e kap dritën.',
    save_image: 'Ruaj imazhin',
    motif: 'Motivi', m_none: 'Pa motiv', m_chevron: 'Shevrona', m_dots: 'Pika', m_stripes: 'Vija', m_top: 'Bllok lart', m_bottom: 'Bllok poshtë',
    motif_colour: 'Ngjyra e motivit', duplicate: 'Dyfisho', rotate: 'Rrotulloje vetë', fullscreen: 'Ekran i plotë',
    g_catalogue: 'Nga katalogu PrintWorks', g_ideas: 'Ide sipas industrisë', spec_motif: 'Motivi',
    spec_title: 'Dizajn nga Studio 3D', spec_empty: 'pa printim', spec_text: 'tekst', spec_logo: 'logo', spec_qr: 'kod QR', spec_graphic: 'grafikë',
    spec_bag: 'Ngjyra e qeses', spec_handle: 'Doreza', spec_full: 'CMYK',
  },
  en: {
    camera: 'Camera', v_front: 'Front', v_side: 'Side', v_inside: 'Inside',
    light: 'Light', light_rot: 'Rotate', light_bright: 'Brightness',
    hud: 'Drag to rotate · scroll to zoom',
    steps: 'Steps', tab_samples: 'Examples', tab_bag: 'Bag', tab_design: 'Design',
    samples_lead: 'Start from an example. You can change everything in the next steps.',
    next_bag: 'Next: choose the bag', next_design: 'Next: add your design',
    paper: 'Paper', size: 'Size', size_note: 'width × depth × height',
    colour: 'Bag colour', colour_custom: 'Your colour — matched to your brand Pantone', custom: 'Custom colour',
    finish: 'Finish', handle: 'Handle', pose_up: 'Handles up', pose_down: 'Handles down',
    side: 'Bag side', front: 'Front', back: 'Back', copy_back: 'Copy to back', copy_front: 'Copy to front',
    editor_aria: 'Print area of the selected side. Drag an item to move it, drag its corner to resize; arrow keys nudge it.',
    add_text: '+ Text', add_logo: '+ Logo', add_qr: '+ QR code', remove: 'Remove',
    k_text: 'Text', k_logo: 'Logo', k_qr: 'QR code', k_graphic: 'Artwork',
    font: 'Font', qr_link: 'QR code link', m_mono: '1 colour', m_full: 'Full colour (CMYK)', ink: 'Ink colour',
    width: 'Width', centre: 'Centre across',
    design_note: 'Drag to move. Drag the corner square to resize. Arrow keys nudge the selected item. Hatched areas cannot be printed.',
    your_text: 'Your text',
    added: 'Added {name}. Drag it into place.',
    bad_file: 'That file could not be read as an image. Try a PNG, JPG or SVG.',
    copied_back: 'The back now has the same design as the front.',
    copied_front: 'The front now has the same design as the back.',
    n_qr_contrast: 'Low contrast with the paper, so phones may not read this QR code. Pick a darker or lighter ink.',
    n_qr_inverted: 'Light ink on dark paper makes an inverted QR code, which some phones cannot read. Scan the proof before ordering.',
    n_qr_foil: 'Metallic foil reflects light and is hard to scan. Pick a matte ink for the QR code.',
    n_qr_small: 'Make it at least 2.5 cm wide so phones read it easily.',
    n_qr_ok: 'Scannable size and contrast.',
    n_full: 'Full-colour logos are printed in CMYK and keep their own colours.',
    n_text: 'Put **double asterisks** around words to make them bold. Press Enter for a new line.',
    n_foil: 'Foil is hot-stamped after printing. Turn the bag to see it catch the light.',
    save_image: 'Save image',
    motif: 'Pattern', m_none: 'None', m_chevron: 'Chevrons', m_dots: 'Dots', m_stripes: 'Stripes', m_top: 'Top block', m_bottom: 'Bottom block',
    motif_colour: 'Pattern colour', duplicate: 'Duplicate', rotate: 'Turn by itself', fullscreen: 'Full screen',
    g_catalogue: 'From the PrintWorks catalogue', g_ideas: 'Ideas by industry', spec_motif: 'Pattern',
    spec_title: 'Design from Studio 3D', spec_empty: 'no print', spec_text: 'text', spec_logo: 'logo', spec_qr: 'QR code', spec_graphic: 'artwork',
    spec_bag: 'Bag colour', spec_handle: 'Handle', spec_full: 'CMYK',
  },
};
const t = (k, vars) => {
  let s = I18N[lang][k] ?? I18N.en[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b);
  return s;
};
const P2 = pair => pair[lang === 'en' ? 1 : 0];   // [Albanian, English]
const fmt = v => { const s = (Math.round(v * 10) / 10).toString(); return lang === 'sq' ? s.replace('.', ',') : s; };

// ---------------- the range (kept in step with the paper-bag products in src/data/catalog.ts) ----------------
// [label, width, height, depth] in cm. The catalogue writes them width × depth × height.
const SIZES = [['S', 18, 22, 8], ['M', 24, 32, 10], ['L', 32, 42, 12], ['XL', 40, 45, 15]];
const PAPERS = {
  art:           { name: ['Art letër', 'Art paper'], sub: ['170 g · e laminuar', '170 gsm · laminated'], colour: null, inner: '#f3f1ec', grain: 0.1,
                   handles: ['rope', 'twisted', 'flat', 'ribbon'], sizes: ['S', 'M', 'L', 'XL'] },
  'kraft-brown': { name: ['Kraft kafe', 'Brown kraft'], sub: ['120 g · natyrale', '120 gsm · natural'], colour: '#b98b5d', inner: '#b98b5d', grain: 0.55,
                   handles: ['twisted', 'flat', 'ribbon'], sizes: ['S', 'M', 'L'] },
  'kraft-white': { name: ['Kraft i bardhë', 'White kraft'], sub: ['120 g · natyrale', '120 gsm · natural'], colour: '#f0ece3', inner: '#f0ece3', grain: 0.45,
                   handles: ['twisted', 'flat', 'ribbon'], sizes: ['S', 'M', 'L'] },
};
const FINISHES = {
  matte:     { name: ['Laminim mat', 'Matte laminate'], rough: 0.6, coat: 0, coatRough: 0.5, sheen: 0.1, grain: 0.1 },
  gloss:     { name: ['Laminim me shkëlqim', 'Gloss laminate'], rough: 0.36, coat: 1, coatRough: 0.07, sheen: 0, grain: 0.03 },
  softtouch: { name: ['Soft-touch', 'Soft-touch'], rough: 0.88, coat: 0, coatRough: 0.5, sheen: 0.6, grain: 0.06 },
};
// through: the handle is threaded through punched holes and knotted inside; otherwise its ends are glued inside under a paper patch.
const HANDLES = {
  rope:    { name: ['Litar pambuku', 'Cotton rope'], through: true, round: true, r: 0.3 },
  twisted: { name: ['Letër e përdredhur', 'Twisted paper'], through: false, round: true, r: 0.22 },
  flat:    { name: ['Letër e sheshtë', 'Flat paper'], through: false, round: false, w: 1.5, k: 0.06, th: 0.045 },
  ribbon:  { name: ['Shirit saten', 'Satin ribbon'], through: true, round: false, w: 1.6, k: 0.058, th: 0.028 },
};
const WHITE = '#f6f5f2', BLACK = '#17171a', PURPLE = '#80298f', GOLD = '#d6b25a', SILVER = '#c3c6ca';
const BAG_COLOURS = [
  [['E bardhë', 'White'], WHITE], [['E zezë', 'Black'], BLACK], [['Vjollcë PrintWorks', 'PrintWorks purple'], PURPLE], [['Jargavan', 'Lilac'], '#cdbfe6'],
  [['Rozë', 'Pink'], '#f2b8cf'], [['Blu pastel', 'Pastel blue'], '#b8d8ea'], [['Mentë', 'Mint'], '#bfe3d2'], [['E verdhë', 'Yellow'], '#f1d54a'],
  [['E kuqe', 'Red'], '#c8262c'], [['Blu marine', 'Navy'], '#1f2b4d'], [['Jeshile e errët', 'Forest green'], '#1f4d3a'], [['Rërë', 'Sand'], '#dccbb0'],
];
const HANDLE_COLOURS = [
  [['E zezë', 'Black'], BLACK], [['E bardhë', 'White'], '#f1efe9'], [['Natyrale', 'Natural'], '#b98b5d'], [['Si qesja', 'Match the bag'], 'match'],
  [['Vjollcë', 'Purple'], PURPLE], [['Blu', 'Blue'], '#2b4db5'], [['Blu marine', 'Navy'], '#1f2b4d'], [['E kuqe', 'Red'], '#c8262c'], [['Ari', 'Gold'], '#b8975a'],
];
// [name, colour, hot-foil?]
const INKS = [
  [['E zezë', 'Black'], BLACK], [['Gri e errët', 'Dark grey'], '#4a4a4c'], [['E bardhë', 'White'], WHITE], [['Vjollcë PrintWorks', 'PrintWorks purple'], PURPLE],
  [['Magenta', 'Magenta'], '#d6257f'], [['E kuqe', 'Red'], '#c8262c'], [['Portokalli', 'Orange'], '#e2683a'], [['Jeshile', 'Green'], '#2e7d4f'],
  [['Blu', 'Blue'], '#2b4db5'], [['Blu marine', 'Navy'], '#1f2b4d'], [['Folje ari', 'Gold foil'], GOLD, true], [['Folje argjendi', 'Silver foil'], SILVER, true],
];
const FOILS = new Set(INKS.filter(i => i[2]).map(i => i[1]));
const isFoil = el => FOILS.has(el.ink) && !(el.kind === 'logo' && el.method === 'full');
// Text styles: [family, weight, label]
const STYLES = {
  'dm-600': ['DM Sans Variable', 600, 'DM Sans Semi Bold'], 'dm-800': ['DM Sans Variable', 800, 'DM Sans Extra Bold'],
  'sans-900': ['Montserrat Variable', 900, 'Montserrat Black'], 'sans-700': ['Montserrat Variable', 700, 'Montserrat Bold'],
  'sans-500': ['Montserrat Variable', 500, 'Montserrat Medium'], 'sans-300': ['Montserrat Variable', 300, 'Montserrat Light'],
  'cond-700': ['Oswald Variable', 700, 'Oswald Bold'],
  'serif-700': ['Playfair Display Variable', 700, 'Playfair Display Bold'], 'serif-500': ['Playfair Display Variable', 500, 'Playfair Display'],
  'script-700': ['Dancing Script Variable', 700, 'Dancing Script'],
};

const state = {
  paper: 'art', size: 'M', W: 24, H: 32, D: 10,
  colour: WHITE, finish: 'matte', handle: 'rope', handleColour: BLACK, pose: 'upright',
  motif: 'none', motifColour: PURPLE,   // all-over print
  product: null,                        // the catalogue product an example stands for (a hint for the storefront)
};
const paperCol = () => PAPERS[state.paper].colour || state.colour;
const hd = () => HANDLES[state.handle];
const cuff = () => Math.min(5, Math.max(3.4, state.H * 0.12));   // the top is turned in by this much (cm)
const holeDrop = () => cuff() * 0.58;                             // centre of the punched hole, below the top edge
const handleSpan = () => hd().through ? 0.17 * state.W + 0.6 : 0.2 * state.W + 0.5;   // half the distance between a handle's two ends
const handleW = () => Math.min(hd().w, Math.max(1, state.W * hd().k));   // flat handles are narrower on small bags
const handleDrop = () => hd().through ? Math.min(16, Math.max(8.5, state.H * 0.38)) : Math.min(9.5, Math.max(6, state.H * 0.25));

// ---------------- renderer / scene ----------------
const stage = document.getElementById('stage');
let dirty = true;   // frames are drawn only when something changed
// The scene is drawn into the composer's own anti-aliased buffer, so the canvas itself needs neither MSAA nor a preserved buffer.
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const BASE_PR = Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2);
renderer.setPixelRatio(BASE_PR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;   // keeps saturated brand colours on hue
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // turning the camera does not change the shadow; it is redrawn only when the bag or light changes
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
// Product-photo studio: a big key softbox front-left, a weaker fill, two strip lights behind for rim highlights.
function studioEnvironment() {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 12), new THREE.MeshBasicMaterial({ color: 0xb4b4b8, side: THREE.BackSide }));
  room.position.y = 3; s.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: 0x8a8a8c }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.98; s.add(floor);
  const panel = (w, h, k, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0.4, 0); s.add(m);
  };
  panel(3.4, 2.6, 6, -2.6, 2.8, 2.6);   // key
  panel(2.6, 2.2, 3.2, 3.2, 1.4, 2.4);  // fill
  panel(0.8, 4.2, 5, 2.6, 2.0, -2.8);   // rim, right
  panel(0.8, 4.2, 4, -2.8, 2.0, -2.4);  // rim, left
  panel(5, 5, 1.2, 0, 6.8, 0);          // ceiling bounce
  return pmrem.fromScene(s, 0.02).texture;
}
scene.environment = studioEnvironment();
scene.environmentIntensity = 0.78;

const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.25; controls.maxDistance = 3;
controls.maxPolarAngle = Math.PI * 0.51;

const key = new THREE.DirectionalLight(0xfff6ec, 1.25);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.0015;
Object.assign(key.shadow.camera, { left: -0.9, right: 0.9, top: 0.9, bottom: -0.7, near: 0.1, far: 4 });
scene.add(key, key.target);
const backFill = new THREE.DirectionalLight(0xf4f2ff, 0.5);   // no shadow: it only keeps the far side of the bag readable
scene.add(backFill, backFill.target);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.2 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
scene.add(ground);

// Contact shadow: a soft dark footprint right under the bag, so it sits on the surface instead of floating.
const contact = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  for (let i = 18; i >= 0; i--) {
    const pad = 40 + i * 4.2, r = 18 + i * 4;
    x.fillStyle = 'rgba(0,0,0,0.075)';
    x.beginPath(); x.roundRect(pad, pad, 256 - 2 * pad, 256 - 2 * pad, r); x.fill();
  }
  const tx = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, color: 0x000000, opacity: 0.85 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.0001; m.renderOrder = 1;
  scene.add(m);
  return m;
})();

function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
// Plain colour backdrop (the AO pass cannot read a background texture); the studio falloff is a CSS vignette over the canvas.
scene.background = new THREE.Color(cssVar('--stage') || '#ecebef').lerp(new THREE.Color(0xffffff), 0.12);

// ---------------- small maths helpers ----------------
const smooth = (e0, e1, x) => { const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
function hash(x, y, s) { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 3) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 7) * 0.1;

// ---------------- flat layout of the bag pieces (cm) ----------------
// One texture atlas holds every panel: [left gusset][front][right gusset][back] across, bottom under the front.
const GAP = 2;
function layout() {
  const { W, H, D } = state, g = GAP;
  const left = [g, g, D, H], front = [2 * g + D, g, W, H], right = [3 * g + D + W, g, D, H], back = [4 * g + 2 * D + W, g, W, H];
  const bottom = [front[0], 2 * g + H, W, D];
  return { left, front, right, back, bottom, AW: 5 * g + 2 * D + 2 * W, AH: 3 * g + H + D };
}
let L = layout();

// ---------------- bag body geometry ----------------
// A paper carrier bag stands as a box. Its side gusset keeps a little of the inward fold it was shipped with:
// the centre crease sits slightly in, more toward the top, and the block bottom holds the base fully open.
function profile(y) {
  const g = state.D / 2, H = state.H, y0 = Math.min(g, H * 0.45);
  const s = g * 0.26 * Math.pow(smooth(y0 * 0.6, H, y), 1.15);
  return { d: Math.sqrt(g * g - s * s), s };
}
// Stiff paper: the big panels only bow out a few millimetres, with a faint waviness from handling.
function panelZ(x, y, seed) {
  const { W, H } = state;
  const ex = 1 - Math.pow(2 * x / W, 2), ey = Math.sin(Math.PI * Math.min(1, Math.max(0, y / H)));
  const bow = 0.011 * W * ex * Math.pow(ey, 0.8);
  const wave = 0.05 * fbm(x * 0.13, y * 0.09, seed) * ex * ey;
  return profile(y).d + bow + wave;
}

function grid(nu, nv, f, hint) {
  const n = (nu + 1) * (nv + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), uv1 = new Float32Array(n * 2), col = new Float32Array(n * 3);
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, k++) {
    const r = f(i / nu, j / nv);
    pos[k * 3] = r.p[0] * CM; pos[k * 3 + 1] = r.p[1] * CM; pos[k * 3 + 2] = r.p[2] * CM;
    uv[k * 2] = r.a[0] / L.AW; uv[k * 2 + 1] = 1 - r.a[1] / L.AH;
    uv1[k * 2] = r.a[0] / PAPER_TILE; uv1[k * 2 + 1] = -r.a[1] / PAPER_TILE;
    // fake occlusion for the inside of the bag: darker toward the bottom
    const ao = 0.45 + 0.55 * Math.pow(Math.min(1, Math.max(0, r.p[1] / state.H)), 0.7);
    col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = ao;
  }
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // make every piece face outward
  const nrm = g.getAttribute('normal'), ci = Math.floor(nv / 2) * (nu + 1) + Math.floor(nu / 2);
  if (nrm.getX(ci) * hint[0] + nrm.getY(ci) * hint[1] + nrm.getZ(ci) * hint[2] < 0) {
    for (let q = 0; q < idx.length; q += 3) { const tmp = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = tmp; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  return g;
}

// Panels are separate pieces that share their seam vertices: the folds between them stay sharp, with no cracks.
const NU = 48, NV = 64, NGU = 10;
function buildBody() {
  const { W, H, D } = state, g = D / 2;
  const parts = [];
  parts.push(grid(NU, NV, (u, v) => { const x = -W / 2 + u * W, y = v * H; return { p: [x, y, panelZ(x, y, 1)], a: [L.front[0] + u * W, L.front[1] + (1 - v) * H] }; }, [0, 0, 1]));
  parts.push(grid(NU, NV, (u, v) => { const x = W / 2 - u * W, y = v * H; return { p: [x, y, -panelZ(x, y, 2)], a: [L.back[0] + u * W, L.back[1] + (1 - v) * H] }; }, [0, 0, -1]));
  for (const sx of [1, -1]) for (const half of ['f', 'b']) {
    const R = sx > 0 ? L.right : L.left;
    parts.push(grid(NGU, NV, (u, v) => {
      const y = v * H, { d, s } = profile(y);
      // u: panel edge -> centre crease; each half is almost flat, bowing out a hair
      const bow = 0.06 * Math.sin(Math.PI * u) * smooth(0, 2.5, y);
      const p = [sx * (W / 2 - s * u + bow), y, (half === 'f' ? d : -d) * (1 - u)];
      const fromFront = half === 'f' ? u * g : D - u * g;
      return { p, a: [R[0] + (sx > 0 ? fromFront : D - fromFront), R[1] + H - y] };
    }, [sx, 0, 0]));
  }
  parts.push(grid(NU, 2 * NGU, (u, v) => ({ p: [-W / 2 + u * W, 0, g - v * 2 * g], a: [L.bottom[0] + u * W, L.bottom[1] + v * D] }), [0, -1, 0]));
  return mergeGeometries(parts);
}

// ---------------- handles ----------------
// Rope and ribbon are threaded through two punched holes and knotted inside; paper handles are glued inside under a patch.
// Up: the loop stands above the bag. Down: it hangs against the outside of the panel.
function buildHandle(sgn) {
  const h = hd(), { H } = state, a = handleSpan(), drop = handleDrop(), seed = sgn > 0 ? 1 : 2, down = state.pose === 'relaxed';
  const off = h.round ? h.r : h.th, hw = h.round ? 0 : handleW();
  const face = (x, y) => sgn * panelZ(x, Math.min(y, H), seed);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const outZ = (x, y) => face(x, y) + sgn * (off + 0.05), inZ = (x, y) => face(x, y) - sgn * (off + 0.05);
  const lean = 0.07;   // a standing loop tips a little away from the bag
  const up = (x, hh, z0) => V(x, H + hh * Math.cos(lean * hh / drop), z0 + sgn * hh * Math.sin(lean * hh / drop));
  const yh = H - holeDrop(), knots = [];
  let pts;
  if (h.through) {
    const start = sx => { const p = V(sx * a, yh - 0.4, face(sx * a, yh) - sgn * 0.42); knots.push(p); return [p, V(sx * a, yh + 0.05, face(sx * a, yh) + sgn * off * 0.4)]; };
    if (down) {
      const hang = (x, k) => { const y = yh - k * drop; return V(x, y, outZ(x, y) + sgn * 0.12 * Math.sin(Math.PI * Math.min(1, k * 2))); };
      pts = [...start(-1), hang(-a * 1.02, 0.12), hang(-a, 0.45), hang(-a * 0.8, 0.86), hang(0, 1), hang(a * 0.8, 0.86), hang(a, 0.45), hang(a * 1.02, 0.12), ...start(1).reverse()];
    } else {
      const z0 = outZ(0, H);
      const leg = sx => [V(sx * a, yh + 0.9, outZ(sx * a, yh + 0.9)), V(sx * a, H - 0.05, outZ(sx * a, H))];
      pts = [...start(-1), ...leg(-1), up(-a, 0.32 * drop, z0), up(-a * 0.84, 0.82 * drop, z0), up(0, drop, z0), up(a * 0.84, 0.82 * drop, z0), up(a, 0.32 * drop, z0), ...leg(1).reverse(), ...start(1).reverse()];
    }
  } else {
    const y0 = H - cuff() + 0.5;
    const leg = sx => [V(sx * a, y0, inZ(sx * a, y0)), V(sx * a, H - 0.5, inZ(sx * a, H))];
    if (down) {
      // over the top edge, then hanging down the outside of the panel
      const over = sx => [V(sx * a, H + off + 0.12, face(sx * a, H)), V(sx * a, H - 0.6, outZ(sx * a, H - 0.6))];
      const hang = (x, k) => { const y = H - k * drop; return V(x, y, outZ(x, y)); };
      const sq = h.round ? 0.84 : 0.94;
      pts = [...leg(-1), ...over(-1), hang(-a, 0.4), hang(-a * sq, 0.84), hang(-a * 0.45, 1), hang(0, 1), hang(a * 0.45, 1), hang(a * sq, 0.84), hang(a, 0.4), ...over(1).reverse(), ...leg(1).reverse()];
    } else {
      const z0 = inZ(0, H);
      // a flat paper handle is a folded strip: straight legs and a nearly flat top; a twisted cord makes a round arch
      const loop = h.round
        ? [up(-a, 0.3 * drop, z0), up(-a * 0.84, 0.82 * drop, z0), up(0, drop, z0), up(a * 0.84, 0.82 * drop, z0), up(a, 0.3 * drop, z0)]
        : [up(-a, 0.5 * drop, z0), up(-a * 0.95, 0.88 * drop, z0), up(-a * 0.55, drop, z0), up(0, drop, z0), up(a * 0.55, drop, z0), up(a * 0.95, 0.88 * drop, z0), up(a, 0.5 * drop, z0)];
      pts = [...leg(-1), ...loop, ...leg(1).reverse()];
    }
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const N = 180, sp = curve.getSpacedPoints(N), K = h.round ? 10 : 12;
  // cross-section: a circle for rope and cord, a flat strip with rounded edges for paper and ribbon
  const ring = [];
  for (let k = 0; k <= K; k++) {
    const q = Math.PI / 2 + k / K * Math.PI * 2, c = Math.cos(q), s = Math.sin(q);
    ring.push(h.round ? [c * h.r, s * h.r] : [Math.sign(c) * Math.abs(c) ** 0.35 * hw / 2, Math.sign(s) * Math.abs(s) ** 0.7 * h.th]);
  }
  const pitch = state.handle === 'rope' ? 0.85 : 1.5;   // cm of handle per turn of the twist
  const pos = [], uv = [], idx = [];
  const N0 = new THREE.Vector3(0, 0, sgn), T = new THREE.Vector3(), Wv = new THREE.Vector3(), Nn = new THREE.Vector3(), last = new THREE.Vector3(-1, 0, 0);
  let len = 0;
  for (let i = 0; i <= N; i++) {
    const p = sp[i];
    T.subVectors(sp[Math.min(N, i + 1)], sp[Math.max(0, i - 1)]).normalize();
    if (i > 0) len += p.distanceTo(sp[i - 1]);
    Wv.crossVectors(N0, T);
    if (Wv.lengthSq() < 0.02) Wv.copy(last); else { Wv.normalize(); last.copy(Wv); }   // where it runs straight through the hole
    if (state.handle === 'ribbon') {   // a ribbon turns a little along its length; a paper strip does not
      const tw = 0.22 * Math.sin(len * 0.3 + sgn * 1.7) * smooth(0.1, 0.4, Math.min(len, curve.getLength() - len) / drop);
      Nn.crossVectors(T, Wv).normalize(); Wv.multiplyScalar(Math.cos(tw)).addScaledVector(Nn, Math.sin(tw));
    }
    Nn.crossVectors(T, Wv).normalize();
    ring.forEach(([rx, ry], k) => {
      pos.push((p.x + Wv.x * rx + Nn.x * ry) * CM, (p.y + Wv.y * rx + Nn.y * ry) * CM, (p.z + Wv.z * rx + Nn.z * ry) * CM);
      if (h.round) uv.push(len / pitch, k / K); else uv.push(len / PAPER_TILE, (rx + hw / 2) / PAPER_TILE);
    });
    if (i < N) for (let k = 0; k < K; k++) { const b = i * (K + 1) + k, c = b + K + 1; idx.push(b, b + 1, c, b + 1, c + 1, c); }   // wound to face outward
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (!knots.length) return g;
  const parts = [g.toNonIndexed()];
  for (const p of knots) {   // the knot that stops the handle pulling out of its hole
    const kn = new THREE.SphereGeometry(1, 14, 10);
    if (h.round) kn.scale(h.r * 1.9 * CM, h.r * 1.7 * CM, h.r * 1.7 * CM); else kn.scale(hw * 0.42 * CM, 0.34 * CM, 0.26 * CM);
    kn.translate(p.x * CM, p.y * CM, (p.z - sgn * 0.12) * CM);
    parts.push(kn.toNonIndexed());
  }
  return mergeGeometries(parts);
}
// The paper patch glued over the ends of a paper handle, inside the bag.
function buildPatch(sgn) {
  const h = hd(), { H } = state, a = handleSpan(), c = cuff(), seed = sgn > 0 ? 1 : 2;
  const w = 2 * a + 3.6, y1 = H - 0.5, y0 = H - c - 0.3, off = (h.round ? 2 * h.r : 2 * h.th) + 0.07;
  const g = new THREE.PlaneGeometry(w * CM, (y1 - y0) * CM, 12, 1), p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / CM, y = (y0 + y1) / 2 + p.getY(i) / CM;
    p.setXYZ(i, x * CM, y * CM, (sgn * panelZ(x, y, seed) - sgn * off) * CM);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------- procedural textures ----------------
function normalFromHeight(h, w, hh, strength) {
  const c = document.createElement('canvas'); c.width = w; c.height = hh;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const dx = (h[y * w + (x + 1) % w] - h[y * w + (x - 1 + w) % w]) * strength;
    const dy = (h[((y + 1) % hh) * w + x] - h[((y - 1 + hh) % hh) * w + x]) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
// Paper grain: a fine tooth with slightly longer features across the sheet, tileable.
function paperNormal() {
  const S = 256, h = new Float32Array(S * S);
  const ph = (i, j, P, sd) => hash(((i % P) + P) % P, ((j % P) + P) % P, sd);
  const pn = (u, v, P, sd) => {
    const ui = Math.floor(u), vi = Math.floor(v), uf = u - ui, vf = v - vi, a = uf * uf * (3 - 2 * uf), b = vf * vf * (3 - 2 * vf);
    const p00 = ph(ui, vi, P, sd), p10 = ph(ui + 1, vi, P, sd), p01 = ph(ui, vi + 1, P, sd), p11 = ph(ui + 1, vi + 1, P, sd);
    return p00 + (p10 - p00) * a + (p01 - p00) * b + (p00 - p10 - p01 + p11) * a * b;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    h[y * S + x] = 0.5 * pn(u * 20, v * 20, 20, 3) + 0.32 * pn(u * 56, v * 56, 56, 5) + 0.18 * Math.random();
  }
  const tx = new THREE.CanvasTexture(normalFromHeight(h, S, S, 2.2));
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8;
  return tx;
}
// Twisted strands: `strands` rounded ridges around the handle that spiral along its length (rope: 3, paper cord: 2).
function twistTex(strands, noise) {
  const w = 64, hh = 96, h = new Float32Array(w * hh);
  const col = document.createElement('canvas'); col.width = w; col.height = hh;
  const ctx = col.getContext('2d'), img = ctx.createImageData(w, hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const v = Math.abs(Math.sin(Math.PI * (strands * y / hh + x / w)));
    h[y * w + x] = Math.pow(v, 0.7) + (Math.random() - 0.5) * noise;
    const c = (0.8 + 0.2 * Math.pow(v, 0.6) + (Math.random() - 0.5) * noise * 0.12) * 255, i = (y * w + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace;
  const nm = new THREE.CanvasTexture(normalFromHeight(h, w, hh, 1.6));
  for (const tx of [map, nm]) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8; }
  return { map, nm };
}
// Paper fibres: thousands of faint short strokes, tiled.
function fibreCanvas() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
  x.lineWidth = 1; x.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {
    const px = Math.random() * S, py = Math.random() * S, a = (Math.random() - 0.5) * 1.6, l = 6 + Math.random() * 26, bend = (Math.random() - 0.5) * 0.9;
    x.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
    x.beginPath();
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {   // wrap so the tile repeats seamlessly
      x.moveTo(px + ox, py + oy);
      x.quadraticCurveTo(px + ox + Math.cos(a + bend) * l / 2, py + oy + Math.sin(a + bend) * l / 2, px + ox + Math.cos(a) * l, py + oy + Math.sin(a) * l);
    }
    x.stroke();
  }
  return c;
}
function mottleCanvas() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d'), img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = 128 + 70 * (vnoise(x / 16, y / 16, 11) * 0.5 + vnoise(x / 4, y / 4, 5) * 0.5), i = (y * S + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
// Kraft paper: darker specks and fibres over the base colour.
function fleckCanvas() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const px = Math.random() * S, py = Math.random() * S, r = 0.4 + Math.random() ** 3 * 2.2, k = 120 + Math.random() * 90;
    x.fillStyle = `rgba(${k * 0.75 | 0},${k * 0.55 | 0},${k * 0.35 | 0},${0.35 + Math.random() * 0.5})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.beginPath(); x.ellipse(px + ox, py + oy, r, r * (0.4 + Math.random() * 0.6), Math.random() * 3, 0, Math.PI * 2); x.fill(); }
  }
  x.lineWidth = 0.8; x.strokeStyle = 'rgba(120,80,45,0.25)';
  for (let i = 0; i < 700; i++) { const px = Math.random() * S, py = Math.random() * S, a = Math.random() * 6.3, l = 6 + Math.random() * 18; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  return c;
}

// ---------------- artwork atlas ----------------
const atlas = document.createElement('canvas');
const atlasTex = new THREE.CanvasTexture(atlas);
atlasTex.colorSpace = THREE.SRGBColorSpace;
atlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
const mottle = mottleCanvas(), fibres = fibreCanvas(), flecks = fleckCanvas();
const relLum = hex => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };   // linear rgb

// ---------------- design: text, logos and QR codes on each side ----------------
// Items are stored in cm on their panel: x, y = centre measured from the panel's top-left corner, w = printed width.
const design = { front: [], back: [] };
let side = 'front', selId = null, nextId = 1;
const assets = new Map();        // uploaded logo id -> { mask, color, name }
const graphics = {};             // built-in artwork name -> mask
const maskCache = new Map();     // text / QR key -> mask canvas (white where ink goes)
const tintCache = new WeakMap(); // mask -> Map(colour -> tinted canvas)

function tinted(mask, hex) {
  let m = tintCache.get(mask); if (!m) tintCache.set(mask, m = new Map());
  if (!m.has(hex)) {
    const c = document.createElement('canvas'); c.width = mask.width; c.height = mask.height;
    const x = c.getContext('2d'); x.fillStyle = hex; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0);
    m.set(hex, c);
  }
  return m.get(hex);
}
// Text is drawn in white on a transparent canvas; words wrapped in **double asterisks** are set bolder.
function textMask(el) {
  const k = `t|${el.style}|${el.track || 0}|${el.text}`;
  if (maskCache.has(k)) return maskCache.get(k);
  const [fam, weight] = STYLES[el.style] || STYLES['sans-700'], S = 160, sp = (el.track || 0) * S;
  const bold = Math.min(900, weight + 200);
  const lines = (el.text || ' ').split('\n').map(l => l.split('**').map((s, i) => [s, i % 2 ? bold : weight]).filter(([s]) => s));
  const c = document.createElement('canvas'), x = c.getContext('2d');
  const setFont = w => { x.font = `${w} ${S}px "${fam}", "Helvetica Neue", Arial, sans-serif`; if ('letterSpacing' in x) x.letterSpacing = sp + 'px'; };
  const lineW = segs => segs.reduce((sum, [txt, w]) => { setFont(w); return sum + x.measureText(txt).width; }, 0) || S * 0.3;
  const widths = lines.map(lineW), lh = S * 1.12, pad = S * 0.14;
  c.width = Math.ceil(Math.max(...widths) + pad * 2); c.height = Math.ceil(lines.length * lh + pad);
  x.fillStyle = '#fff'; x.textBaseline = 'middle';
  lines.forEach((segs, i) => {
    let X = (c.width - widths[i]) / 2 + sp / 2;
    for (const [txt, w] of segs) { setFont(w); x.fillText(txt, X, pad / 2 + lh * (i + 0.5)); X += x.measureText(txt).width; }
  });
  maskCache.set(k, c); return c;
}
function qrMask(data) {
  const k = 'q|' + data;
  if (maskCache.has(k)) return maskCache.get(k);
  const q = qrcode(0, 'M'); q.addData(data || ' '); q.make();
  const n = q.getModuleCount(), quiet = 2, cell = 16, c = document.createElement('canvas');
  c.width = c.height = (n + quiet * 2) * cell;
  const x = c.getContext('2d'); x.fillStyle = '#fff';
  for (let r = 0; r < n; r++) for (let j = 0; j < n; j++) if (q.isDark(r, j)) x.fillRect((j + quiet) * cell, (r + quiet) * cell, cell, cell);
  maskCache.set(k, c); return c;
}
function elementMask(el) {
  if (el.kind === 'text') return textMask(el);
  if (el.kind === 'qr') return qrMask(el.data);
  if (el.kind === 'logo') return assets.get(el.asset)?.mask || null;
  return graphics[el.graphic] || null;
}
function elementSize(el) { const m = elementMask(el); return [el.w, m ? el.w * m.height / m.width : el.w * 0.4]; }
const minWidth = el => el.kind === 'qr' ? 2 : 1;

// Artwork stays clear of the punched holes at the top and of the bottom fold.
function printArea() {
  const { W, H } = state;
  return { x0: 1, x1: W - 1, y0: hd().through ? holeDrop() + 1.1 : 1, y1: H - 1.2 };
}
function clampEl(el) {
  const a = printArea(); let [w, h] = elementSize(el);
  const k = Math.min(1, (a.x1 - a.x0) / w, (a.y1 - a.y0) / h);
  if (k < 1) { el.w *= k; w *= k; h *= k; }
  el.x = Math.min(Math.max(el.x, a.x0 + w / 2), a.x1 - w / 2);
  el.y = Math.min(Math.max(el.y, a.y0 + h / 2), a.y1 - h / 2);
}
const inkMottle = (() => {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const v = vnoise(i / 9, j / 9, 31) * 0.55 + vnoise(i / 3, j / 3, 37) * 0.45, k = (j * S + i) * 4;
    img.data[k + 3] = Math.max(0, Math.min(255, (v * 0.5 + 0.5) ** 2.2 * 255));
  }
  x.putImageData(img, 0, 0); return c;
})();
const inkLayer = document.createElement('canvas');
// Draw one side's items onto a panel whose top-left corner is (ox, oy) cm.
// `paint` (optional) returns the flat colour to draw an item's shape in, or null to skip it: used for the gloss and metal maps.
function drawSide(ctx, PX, ox, oy, items, paint = null) {
  for (const el of items) {
    const m = elementMask(el); if (!m) continue;
    const [w, h] = elementSize(el);
    let src;
    if (paint) { const c = paint(el); if (!c) continue; src = tinted(m, c); }
    else src = el.kind === 'logo' && el.method === 'full' ? assets.get(el.asset).color : tinted(m, el.ink);
    ctx.drawImage(src, (ox + el.x - w / 2) * PX, (oy + el.y - h / 2) * PX, w * PX, h * PX);
  }
}
// The printed version for the 3D model: on laminated art paper ink is solid; on uncoated kraft it soaks in a little unevenly.
function drawPrinted(ctx, PX, ox, oy, items) {
  if (!items.length) return;
  if (state.paper === 'art') { drawSide(ctx, PX, ox, oy, items); return; }
  inkLayer.width = Math.ceil(state.W * PX); inkLayer.height = Math.ceil(state.H * PX);
  const x = inkLayer.getContext('2d');
  drawSide(x, PX, 0, 0, items);
  x.save(); x.globalCompositeOperation = 'destination-out';
  const pat = x.createPattern(inkMottle, 'repeat'); pat.setTransform(new DOMMatrix().scale(5 * PX / inkMottle.width));
  x.globalAlpha = 0.16; x.fillStyle = pat; x.fillRect(0, 0, inkLayer.width, inkLayer.height);
  x.restore();
  ctx.save(); ctx.globalAlpha = 0.94; ctx.drawImage(inkLayer, ox * PX, oy * PX); ctx.restore();
}

// Three maps share one layout: colour, relief (creases, the turned-in top) and gloss + metal (laminate, ink, foil).
const bumpC = document.createElement('canvas'), roughC = document.createElement('canvas'), alphaC = document.createElement('canvas');
const bumpTex = new THREE.CanvasTexture(bumpC), roughTex = new THREE.CanvasTexture(roughC), alphaTex = new THREE.CanvasTexture(alphaC);

// Fold lines pressed into the paper when the bag was made and shipped flat.
function drawCreases(ctx, PX) {
  const { W, H, D } = state, g = D / 2, ay = Math.min(g, H * 0.45);
  const line = (x1, y1, x2, y2) => { ctx.moveTo(x1 * PX, y1 * PX); ctx.lineTo(x2 * PX, y2 * PX); };
  ctx.beginPath();
  for (const [x, y] of [L.left, L.right]) {
    const apex = y + H - ay;
    line(x + g, y, x + g, apex);                                        // centre fold of the gusset
    line(x + g, apex, x, y + H); line(x + g, apex, x + D, y + H);       // the two folds of the block bottom
    line(x, apex, x + D, apex);
  }
  { const [x, y] = L.back; line(x, y + H - ay, x + W, y + H - ay); }    // where the bottom folded up against the back
  { const [x, y] = L.bottom; line(x, y + D / 2, x + W, y + D / 2); }
  ctx.stroke();
}
// Punched holes for rope and ribbon handles, as an outline on a panel whose top-left corner is (x, y) cm; the caller fills it.
function cutPath(ctx, PX, x, y) {
  const h = hd(), { W } = state, a = handleSpan(), yh = holeDrop();
  ctx.beginPath();
  if (!h.through) return;
  for (const sx of [-1, 1]) {
    const cx = x + W / 2 + sx * a;
    if (h.round) { ctx.moveTo((cx + h.r + 0.07) * PX, (y + yh) * PX); ctx.arc(cx * PX, (y + yh) * PX, (h.r + 0.07) * PX, 0, Math.PI * 2); }
    else { const w = handleW(); ctx.roundRect((cx - w / 2 - 0.1) * PX, (y + yh - 0.16) * PX, (w + 0.2) * PX, 0.32 * PX, 0.16 * PX); }
  }
}

// All-over print: a repeating motif or a colour block that runs round the four upright panels.
// `u0` is where the area starts, measured round the bag from the left gusset (cm), so the pattern lines up from
// panel to panel and matches in the flat editor.
const MOTIFS = ['none', 'chevron', 'dots', 'stripes', 'top', 'bottom'];
const motifTiles = new Map();
function motifTile(kind, colour, PX) {
  const k = [kind, colour, Math.round(PX * 100), state.W].join('|');
  if (motifTiles.has(k)) return motifTiles.get(k);
  if (motifTiles.size > 12) motifTiles.clear();
  const c = document.createElement('canvas'), x = c.getContext('2d');
  if (kind === 'chevron') {   // the PrintWorks chevron row, two staggered rows per tile
    const tw = Math.max(9, state.W * 0.5), th = tw * 0.66, s = tw * 0.7 * PX / 330, row = new Path2D(PW_ROW);
    c.width = Math.round(tw * PX); c.height = Math.round(th * PX);
    x.fillStyle = colour;
    for (const [ox, oy] of [[0.06, 0.08], [0.56, 0.58], [-0.44, 0.58]]) { x.save(); x.translate(ox * c.width, oy * c.height); x.scale(s, s); x.fill(row); x.restore(); }
  } else if (kind === 'dots') {
    c.width = c.height = Math.round(2.6 * PX); x.fillStyle = colour;
    for (const q of [0.25, 0.75]) { x.beginPath(); x.arc(q * c.width, q * c.height, 0.42 * PX, 0, Math.PI * 2); x.fill(); }
  } else {
    c.width = Math.round(2.4 * PX); c.height = 8; x.fillStyle = colour; x.fillRect(0, 0, c.width / 2, 8);
  }
  motifTiles.set(k, c); return c;
}
function drawMotif(ctx, PX, x, y, w, h, u0) {
  const kind = state.motif; if (kind === 'none') return;
  ctx.save(); ctx.globalAlpha *= state.paper === 'art' ? 1 : 0.92; ctx.fillStyle = state.motifColour;
  if (kind === 'top') ctx.fillRect(x * PX, y * PX, w * PX, h * 0.46 * PX);
  else if (kind === 'bottom') ctx.fillRect(x * PX, (y + h * 0.64) * PX, w * PX, h * 0.36 * PX);
  else {
    const pat = ctx.createPattern(motifTile(kind, state.motifColour, PX), 'repeat');
    pat.setTransform(new DOMMatrix().translate((x - u0) * PX, y * PX));
    ctx.beginPath(); ctx.rect(x * PX, y * PX, w * PX, h * PX); ctx.clip();
    ctx.fillStyle = pat; ctx.fillRect(x * PX, y * PX, w * PX, h * PX);
  }
  ctx.restore();
}
const roundBag = () => [[L.left, 0], [L.front, state.D], [L.right, state.D + state.W], [L.back, 2 * state.D + state.W]];

let PXa = 40, baseKey = '', bumpKey = '';
const ATLAS_MAX = Math.min(renderer.capabilities.maxTextureSize, innerWidth < 760 ? 2800 : 4000);   // phones get a smaller texture
const baseC = document.createElement('canvas');   // the plain paper with its creases, reused while only the print changes
function creaseColour(hex) {
  const c = new THREE.Color(hex), dark = relLum(hex) < 0.1, k = dark ? 1.5 : 0.84, add = dark ? 0.04 : 0;
  return `rgb(${Math.min(1, c.r * k + add) * 255 | 0},${Math.min(1, c.g * k + add) * 255 | 0},${Math.min(1, c.b * k + add) * 255 | 0})`;
}
function redrawAtlas() {
  L = layout();
  PXa = Math.min(40, ATLAS_MAX / L.AW, ATLAS_MAX / L.AH);
  const PX = PXa, wpx = Math.round(L.AW * PX), hpx = Math.round(L.AH * PX), { W, D } = state, col = paperCol(), art = state.paper === 'art', c = cuff();
  // a texture already on the GPU cannot change size in place, so release it and let three.js upload a fresh one
  if (atlas.width !== wpx || atlas.height !== hpx) for (const tx of [atlasTex, bumpTex, roughTex, alphaTex]) tx.dispose();

  // colour: the plain paper layer is rebuilt only when the paper, its size or its colour changes
  const k = [state.paper, W, state.H, D, col, state.motif, state.motifColour, wpx, hpx].join('|');
  if (k !== baseKey) {
    baseKey = k; baseC.width = wpx; baseC.height = hpx;
    const bx = baseC.getContext('2d');
    bx.fillStyle = col; bx.fillRect(0, 0, wpx, hpx);
    const tile = (img, scale, op, alpha) => {
      const pat = bx.createPattern(img, 'repeat'); pat.setTransform(new DOMMatrix().scale(scale));
      bx.save(); bx.globalCompositeOperation = op; bx.globalAlpha = alpha; bx.fillStyle = pat; bx.fillRect(0, 0, wpx, hpx); bx.restore();
    };
    if (state.paper === 'kraft-brown') { tile(mottle, PX / 40, 'soft-light', 0.16); tile(fibres, PX / 40, 'soft-light', 0.5); tile(flecks, PX / 40, 'multiply', 0.32); tile(mottle, PX / 90, 'soft-light', 0.2); }
    else if (state.paper === 'kraft-white') { tile(fibres, PX / 40, 'soft-light', 0.3); tile(flecks, PX / 40, 'multiply', 0.07); tile(mottle, PX / 90, 'soft-light', 0.12); }
    else tile(mottle, PX / 90, 'soft-light', 0.05);
    for (const [R, u0] of roundBag()) drawMotif(bx, PX, R[0], R[1], R[2], R[3], u0);
    bx.save(); bx.strokeStyle = creaseColour(col); bx.lineWidth = 0.05 * PX; bx.globalAlpha = art ? 0.3 : 0.55;
    drawCreases(bx, PX); bx.restore();
  }
  atlas.width = wpx; atlas.height = hpx;
  const ctx = atlas.getContext('2d');
  ctx.drawImage(baseC, 0, 0);
  drawPrinted(ctx, PX, L.front[0], L.front[1], design.front);
  drawPrinted(ctx, PX, L.back[0], L.back[1], design.back);
  atlasTex.needsUpdate = true;

  const reliefKey = [W, state.H, D, wpx, hpx].join('|');
  if (reliefKey !== bumpKey) {   // the relief (creases, turned-in top) does not depend on the print or the colour
    bumpKey = reliefKey;
    bumpC.width = wpx; bumpC.height = hpx;
    const b = bumpC.getContext('2d');
    b.fillStyle = '#808080'; b.fillRect(0, 0, wpx, hpx);   // mid grey is the paper surface
    b.fillStyle = '#848484';                               // the turned-in top is two layers thick
    for (const R of [L.front, L.back]) b.fillRect(R[0] * PX, R[1] * PX, W * PX, c * PX);
    for (const R of [L.left, L.right]) b.fillRect(R[0] * PX, R[1] * PX, D * PX, c * PX);
    b.strokeStyle = '#404040'; b.lineWidth = 0.09 * PX; b.lineCap = 'round'; drawCreases(b, PX);
    bumpTex.needsUpdate = true;
  }

  // gloss (roughness, green channel) and metal (blue channel) in one map; half resolution is plenty
  const hs = 0.5, P = PX * hs, ch = v => Math.round(Math.min(1, Math.max(0, v)) * 255);
  const baseRough = art ? FINISHES[state.finish].rough : 0.93;
  roughC.width = Math.round(wpx * hs); roughC.height = Math.round(hpx * hs);
  const r = roughC.getContext('2d');
  r.fillStyle = `rgb(0,${ch(baseRough)},0)`; r.fillRect(0, 0, roughC.width, roughC.height);
  // foil is bright metal; flexo ink on kraft is a touch smoother than the bare paper; under laminate ink looks like the paper
  const paint = el => isFoil(el) ? 'rgb(0,70,215)' : art ? null : `rgb(0,${ch(baseRough - 0.12)},0)`;
  drawSide(r, P, L.front[0], L.front[1], design.front, paint);
  drawSide(r, P, L.back[0], L.back[1], design.back, paint);
  roughTex.needsUpdate = true;

  // cut-outs: green = paper, black = punched hole
  alphaC.width = roughC.width; alphaC.height = roughC.height;
  const al = alphaC.getContext('2d');
  al.fillStyle = 'rgb(255,255,0)'; al.fillRect(0, 0, alphaC.width, alphaC.height);
  al.fillStyle = '#000';
  for (const R of [L.front, L.back]) { cutPath(al, P, R[0], R[1]); al.fill(); }
  alphaTex.needsUpdate = true;

  cuffV.value = 1 - (GAP + c) / L.AH;
  dirty = true;
  queueNotify();
}

// ---------------- materials & meshes ----------------
const paperN = paperNormal(); paperN.channel = 1;
const paperN0 = paperN.clone(); paperN0.channel = 0; paperN0.needsUpdate = true;   // the same grain for parts that only have one UV set
const rope = twistTex(3, 0.5), cord = twistTex(2, 0.25);
const outerMat = new THREE.MeshPhysicalMaterial({
  map: atlasTex, normalMap: paperN, normalScale: new THREE.Vector2(0.1, 0.1),
  bumpMap: bumpTex, bumpScale: 1.6, roughnessMap: roughTex, roughness: 1, metalnessMap: roughTex, metalness: 1,
  alphaMap: alphaTex, alphaTest: 0.5, side: THREE.FrontSide, sheenRoughness: 0.5, sheenColor: 0xffffff,
});
// three.js uses either a normal map or a bump map; apply the crease relief on top of the paper grain.
outerMat.onBeforeCompile = sh => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>',
    '#include <normal_fragment_maps>\n#if defined( USE_BUMPMAP ) && defined( USE_NORMALMAP_TANGENTSPACE )\n\tnormal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );\n#endif');
};
outerMat.customProgramCacheKey = () => 'pw-bag-outer';
// Inside: the bare paper, except for the top band where the printed outside is turned in.
const cuffV = { value: 0.9 }, cuffColour = { value: new THREE.Color(WHITE) };
const innerMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, vertexColors: true, normalMap: paperN, normalScale: new THREE.Vector2(0.35, 0.35),
  alphaMap: alphaTex, alphaTest: 0.5, roughness: 0.92, side: THREE.BackSide,
});
innerMat.onBeforeCompile = sh => {
  sh.uniforms.cuffV = cuffV; sh.uniforms.cuffColour = cuffColour;
  sh.fragmentShader = 'uniform float cuffV;\nuniform vec3 cuffColour;\n' + sh.fragmentShader.replace('#include <alphamap_fragment>',
    '#include <alphamap_fragment>\n#ifdef USE_ALPHAMAP\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, cuffColour, step( cuffV, vAlphaMapUv.y ) );\n#endif');
};
innerMat.customProgramCacheKey = () => 'pw-bag-inner';
const handleMats = {
  rope:    new THREE.MeshPhysicalMaterial({ map: rope.map, normalMap: rope.nm, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.9, sheen: 0.6, sheenRoughness: 0.55 }),
  twisted: new THREE.MeshPhysicalMaterial({ map: cord.map, normalMap: cord.nm, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.92 }),
  flat:    new THREE.MeshPhysicalMaterial({ normalMap: paperN0, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.92, side: THREE.DoubleSide }),
  ribbon:  new THREE.MeshPhysicalMaterial({ roughness: 0.34, sheen: 1, sheenRoughness: 0.3, side: THREE.DoubleSide }),
};
const patchMat = new THREE.MeshStandardMaterial({ normalMap: paperN0, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.93, side: THREE.DoubleSide });

const bag = new THREE.Group(); scene.add(bag);
bag.position.y = 0.0004;   // 0.4 mm clear of the floor, so the base never flickers against it
const outer = new THREE.Mesh(new THREE.BufferGeometry(), outerMat);
const inner = new THREE.Mesh(new THREE.BufferGeometry(), innerMat);
const straps = [new THREE.Mesh(new THREE.BufferGeometry(), handleMats.rope), new THREE.Mesh(new THREE.BufferGeometry(), handleMats.rope)];
const patches = [new THREE.Mesh(new THREE.BufferGeometry(), patchMat), new THREE.Mesh(new THREE.BufferGeometry(), patchMat)];
outer.castShadow = outer.receiveShadow = true; inner.receiveShadow = true;
outer.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: alphaTex, alphaTest: 0.5 });   // shadows respect the holes
for (const s of straps) { s.castShadow = s.receiveShadow = true; }
bag.add(outer, inner, ...straps, ...patches);

const handleHex = () => state.handleColour === 'match' ? paperCol() : state.handleColour;
function applyColours() {
  const P = PAPERS[state.paper], art = state.paper === 'art', F = FINISHES[state.finish], col = paperCol();
  outerMat.clearcoat = art ? F.coat : 0; outerMat.clearcoatRoughness = art ? F.coatRough : 0.5;
  outerMat.sheen = art ? F.sheen : 0.1; outerMat.sheenColor.set(col).lerp(new THREE.Color(0xffffff), 0.4);
  outerMat.normalScale.setScalar(art ? F.grain : P.grain);
  outerMat.bumpScale = art ? 1.3 : 1.8;
  innerMat.color.set(P.inner); cuffColour.value.set(col);
  patchMat.color.set(P.inner);
  const hc = handleHex();
  for (const m of Object.values(handleMats)) m.color.set(hc);
  handleMats.ribbon.sheenColor.set(hc).lerp(new THREE.Color(0xffffff), 0.55);
  handleMats.rope.sheenColor.set(hc).lerp(new THREE.Color(0xffffff), 0.3);
  straps.forEach(s => { s.material = handleMats[state.handle]; });
  document.documentElement.style.setProperty('--bagc', col);
  dirty = true;
}

function rebuild() {
  L = layout();
  const body = buildBody();
  outer.geometry.dispose(); outer.geometry = body; inner.geometry = body;
  straps.forEach((s, i) => { s.geometry.dispose(); s.geometry = buildHandle(i === 0 ? 1 : -1); });
  patches.forEach((p, i) => { p.visible = !hd().through; p.geometry.dispose(); p.geometry = p.visible ? buildPatch(i === 0 ? 1 : -1) : new THREE.BufferGeometry(); });
  contact.scale.set(state.W * CM / 0.69 * 1.04, state.D * CM / 0.69 * 1.1, 1);
  redrawAtlas();
}

// ---------------- camera views ----------------
const VIEWS = {
  '34':   { dir: [0.62, 0.3, 0.73], ty: 0.5 },
  front:  { dir: [0, 0.12, 1], ty: 0.5 },
  side:   { dir: [1, 0.12, 0.02], ty: 0.5 },
  top:    { dir: [0.08, 1.5, 0.62], ty: 0.55 },
  back:   { dir: [-0.62, 0.3, -0.73], ty: 0.5 },
};
let tween = null;
function viewTarget(name) {
  const v = VIEWS[name], H = state.H + (state.pose === 'relaxed' ? 0 : handleDrop() * 0.75), size = Math.max(H, state.W * 1.1) * CM;
  const target = new THREE.Vector3(0, (name === 'top' ? state.H * v.ty : H * v.ty) * CM, 0);
  const dist = size / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (camera.aspect < 1 ? 1.35 / camera.aspect : 1.35);
  const pos = new THREE.Vector3(...v.dir).normalize().multiplyScalar(dist).add(target);
  return { pos, target };
}
function setView(name, animate = true) {
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.view === name));
  const to = viewTarget(name);
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    camera.position.copy(to.pos); controls.target.copy(to.target); tween = null; dirty = true; return;
  }
  tween = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), to };
}
document.getElementById('views').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
controls.addEventListener('start', () => { tween = null; document.querySelectorAll('#views button').forEach(b => b.classList.remove('on')); });

// ---------------- controls ----------------
const $ = id => document.getElementById(id);
const samplesEl = $('samples');
function clearSample() { samplesEl.querySelectorAll('.sample').forEach(b => b.classList.remove('on')); }
function showTab(name) {
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll('.pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
  $('panes').scrollTop = 0;
  if (name === 'design') drawEditor();
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => showTab(b.dataset.go); });

// A row of choice buttons, rebuilt when the language changes. `items` = [[value, label, small print]].
function seg(id, items, current, pick, disabled = () => false) {
  const el = $(id); el.innerHTML = '';
  for (const [v, label, sub] of items) {
    const b = document.createElement('button'); b.dataset.v = v; b.textContent = label;
    if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
    b.classList.toggle('on', v === current); b.disabled = disabled(v);
    b.onclick = () => { pick(v); clearSample(); };
    el.appendChild(b);
  }
}
function swatches(id, list, current, pick) {
  const el = $(id); el.innerHTML = '';
  const name = document.createElement('span'); name.className = 'swname';
  for (const [label, v, foil] of list) {
    const b = document.createElement('button'); b.className = 'sw' + (foil ? ' foil' : ''); b.dataset.v = v; b.title = P2(label); b.setAttribute('aria-label', P2(label));
    if (v !== 'match') b.style.background = v;
    b.classList.toggle('on', v === current);
    b.onclick = () => pick(v);
    el.appendChild(b);
  }
  const hit = list.find(([, v]) => v === current);
  name.textContent = hit ? P2(hit[0]) : current ? `${t('custom')} ${current}` : '';
  el.appendChild(name);
}
const sizeOf = label => SIZES.find(z => z[0] === label);
const dimsText = () => `${fmt(state.W)} × ${fmt(state.D)} × ${fmt(state.H)} cm`;

// Every control is drawn from the state, so one function keeps the panel, the summary and the HUD in step.
function syncControls() {
  const P = PAPERS[state.paper], art = state.paper === 'art';
  seg('paperSeg', Object.entries(PAPERS).map(([k, v]) => [k, P2(v.name), P2(v.sub)]), state.paper, setPaper);
  seg('sizeSeg', SIZES.map(z => [z[0], z[0]]), state.size, v => setSize(v), v => !P.sizes.includes(v));
  $('sizeNote').innerHTML = `<b>${dimsText()}</b> · ${t('size_note')}`;
  $('colourSec').hidden = $('finishSec').hidden = !art;
  swatches('bagSw', BAG_COLOURS, state.colour, v => { state.colour = v; afterLook(); });
  $('customColour').value = state.colour;
  seg('finishSeg', Object.entries(FINISHES).map(([k, v]) => [k, P2(v.name)]), state.finish, v => { state.finish = v; afterLook(); });
  seg('motifSeg', MOTIFS.map(k => [k, t('m_' + k)]), state.motif, v => { state.motif = v; afterLook(); });
  $('motifSw').hidden = state.motif === 'none';
  swatches('motifSw', INKS.filter(i => !i[2]), state.motifColour, v => { state.motifColour = v; afterLook(); });
  seg('handleSeg', P.handles.map(k => [k, P2(HANDLES[k].name)]), state.handle, setHandle);
  swatches('handleSw', HANDLE_COLOURS, state.handleColour, v => { state.handleColour = v; afterLook(); });
  document.querySelectorAll('#poseSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === state.pose));
  $('sumType').textContent = `${P2(P.name)} · ${state.size} · ${P2(hd().name)}`;
  $('sumDims').textContent = dimsText();
  $('dimsHud').textContent = dimsText();
}
// colour, finish or handle colour changed: no new geometry needed
function afterLook() { clearSample(); syncControls(); applyColours(); redrawAtlas(); drawEditor(); syncProps(); }
function setSize(label, turn = true) {
  const z = sizeOf(label); if (!z) return;
  const oW = state.W, oH = state.H;
  Object.assign(state, { size: label, W: z[1], H: z[2], D: z[3] });
  // the design keeps its proportions on the new panel, then stays inside the printable area
  for (const k of ['front', 'back']) for (const el of design[k]) { el.x *= state.W / oW; el.y *= state.H / oH; el.w *= state.W / oW; clampEl(el); }
  syncControls(); rebuild(); drawEditor(); syncProps();
  if (turn) setView(side === 'back' ? 'back' : '34');
}
function defaultHandleColour() {
  if (hd().through) return state.handleColour === '#b98b5d' ? BLACK : state.handleColour;   // rope and ribbon are dyed, not kraft
  return state.paper === 'kraft-brown' ? '#b98b5d' : state.paper === 'kraft-white' ? '#f1efe9' : state.handleColour;
}
function setHandle(v) {
  state.handle = v; state.handleColour = defaultHandleColour();
  for (const k of ['front', 'back']) design[k].forEach(clampEl);
  syncControls(); applyColours(); rebuild(); drawEditor(); syncProps();
}
function setPaper(v) {
  const P = PAPERS[v];
  state.paper = v;
  if (!P.handles.includes(state.handle)) state.handle = P.handles[0];
  state.handleColour = defaultHandleColour();
  if (!P.sizes.includes(state.size)) { setSize(P.sizes[P.sizes.length - 1], false); }
  for (const k of ['front', 'back']) design[k].forEach(clampEl);
  syncControls(); applyColours(); rebuild(); drawEditor(); syncProps();
}
$('customColour').addEventListener('input', e => { state.colour = e.target.value; afterLook(); });
$('poseSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.pose = b.dataset.v; syncControls(); rebuild(); setView(side === 'back' ? 'back' : '34');
});

const envRot = $('envRot'), expo = $('expo');
function applyLight() {
  const a = +envRot.value * Math.PI / 180;
  scene.environmentRotation.y = a;
  key.position.set(Math.sin(a - Math.PI / 4) * 1.25, 1.0, Math.cos(a - Math.PI / 4) * 1.25);   // matches the key softbox
  backFill.position.set(Math.sin(a + Math.PI * 0.62) * 1.25, 0.7, Math.cos(a + Math.PI * 0.62) * 1.25);
  renderer.toneMappingExposure = +expo.value;
  $('o-envRot').textContent = envRot.value + '°';
  $('o-expo').textContent = (+expo.value).toFixed(2);
  dirty = true;
}
envRot.oninput = applyLight; expo.oninput = applyLight; applyLight();

// stage tools: a slow turntable, and full screen for presenting
const spin = $('spin'), full = $('full');
function setSpin(on) {
  controls.autoRotate = on; controls.autoRotateSpeed = embed ? 1.1 : 1.6;
  spin.classList.toggle('on', on); spin.setAttribute('aria-pressed', on); dirty = true;
}
spin.onclick = () => setSpin(!controls.autoRotate);
if (!document.fullscreenEnabled) full.hidden = true;
full.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };

// ---------------- artwork loading ----------------
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
// Turn any logo into an ink mask: keep real transparency, otherwise separate ink from a light (or dark) background.
function toArt(img, name) {
  const s = Math.min(1, 2400 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const color = document.createElement('canvas'); color.width = w; color.height = h;
  const cx = color.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
  const d = cx.getImageData(0, 0, w, h), px = d.data;
  let transparent = 0; const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { if (px[i * 4 + 3] < 250) transparent++; lum[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]; }
  const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
  const mx = mask.getContext('2d'), md = mx.createImageData(w, h);
  if (transparent > w * h * 0.02) {
    for (let i = 0; i < w * h; i++) { md.data[i * 4 + 3] = px[i * 4 + 3]; }
  } else {
    const sorted = Float32Array.from(lum).sort(), bg = sorted[Math.floor(sorted.length * 0.5)];
    const light = bg > 127, ink = light ? sorted[Math.floor(sorted.length * 0.02)] : sorted[Math.floor(sorted.length * 0.98)];
    const thr = (bg + ink) / 2;
    for (let i = 0; i < w * h; i++) {
      const a = Math.min(1, Math.max(0, ((light ? thr - lum[i] : lum[i] - thr) / 40) + 0.5));
      md.data[i * 4 + 3] = a * 255; px[i * 4 + 3] = a * 255;
    }
    cx.putImageData(d, 0, 0);   // the full-colour version drops the plain background too
  }
  mx.putImageData(md, 0, 0);
  return { mask, color, name };
}

// ---------------- built-in artwork ----------------
// The PrintWorks mark: two stacked chevron rows, the same paths as src/components/brand/Logo.tsx (330 × 194 units).
const PW_ROW = 'M72 0H107.5V29.5L35 102H0V72Z M114.5 0H150L217 67V102H187L114.5 29.5Z M229 74L303 0H330V38L266 102H229Z';
function pwMark() {
  const s = 4, c = document.createElement('canvas'); c.width = 330 * s; c.height = 194 * s;
  const x = c.getContext('2d'), p = new Path2D(PW_ROW);
  x.scale(s, s); x.fillStyle = '#fff'; x.fill(p); x.translate(0, 92); x.fill(p);
  return c;
}

// ---------------- examples ----------------
// Positions are fractions of the panel (fx, fy = centre, fw = width) so each example fits whatever size it is shown at.
// Text may be [Albanian, English]. The first group follows the six paper bags in the catalogue (src/data/catalog.ts)
// and the way they are photographed there; `product` tells the storefront which one an example is ordered as.
const pwBag = (word, mark) => [
  { text: 'PrintWorks', style: 'dm-600', track: -0.03, fx: 0.5, fy: 0.27, fw: 0.8, ink: word },
  { text: 'solutions', style: 'sans-500', fx: 0.76, fy: 0.345, fw: 0.2, ink: word },
  { kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.64, fw: 0.76, ink: mark },
];
const lines = (...l) => l.join('\n');
const one = (text, style, fy, fw, ink, track = 0) => ({ text, style, track, fx: 0.5, fy, fw, ink });
const atelier = [one('ATELIER', 'serif-500', 0.47, 0.66, GOLD, 0.2), one('PRISHTINË', 'sans-500', 0.565, 0.34, GOLD, 0.45)];
const kantina = [one('KANTINA', 'serif-700', 0.44, 0.7, GOLD, 0.08), one(['VERË · RAKI · DHURATA', 'WINE · SPIRITS · GIFTS'], 'sans-500', 0.56, 0.56, GOLD, 0.3)];
const lume = [one('lumë', 'serif-500', 0.47, 0.5, '#4a4a4c'), one(['KOZMETIKË NATYRALE', 'NATURAL SKINCARE'], 'sans-500', 0.6, 0.5, '#4a4a4c', 0.34)];
const flora = [one('flora', 'script-700', 0.5, 0.62, WHITE), one(['LULE & DHURATA', 'FLOWERS & GIFTS'], 'sans-500', 0.67, 0.5, WHITE, 0.3)];
const paperBag = ink => [
  { text: lines('PAPER', 'BAG'), style: 'serif-500', fx: 0.27, fy: 0.19, fw: 0.36, ink: BLACK },
  { kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.52, fw: 0.74, ink: BLACK },
  one('PrintWorks', 'dm-600', 0.82, 0.62, ink, -0.03),
];
const SAMPLES = [
  // from the catalogue
  { id: 'premium', group: 'catalogue', product: 'p-qese-premium', name: ['Premium me litar', 'Premium rope handle'], paper: 'art', size: 'M', colour: WHITE, finish: 'matte', handle: 'rope', handleColour: '#f1efe9', ink: PURPLE,
    front: pwBag(BLACK, PURPLE), back: pwBag(BLACK, PURPLE) },
  { id: 'ngjyre', group: 'catalogue', product: 'p-qese-ngjyre', name: ['Ngjyrë e plotë', 'Full colour'], paper: 'art', size: 'M', colour: '#e772c4', finish: 'matte', handle: 'rope', handleColour: '#f1efe9', ink: BLACK,
    front: paperBag(WHITE), back: paperBag(WHITE) },
  { id: 'kraft', group: 'catalogue', product: 'p-qese-kraft', name: ['Kraft dyngjyrëshe', 'Two-tone kraft'], paper: 'kraft-brown', size: 'M', handle: 'twisted', handleColour: BLACK, ink: '#d9a39c', motif: 'top', motifColour: '#d9a39c',
    front: [{ text: lines('Paper', 'Bag'), style: 'dm-800', track: -0.02, fx: 0.5, fy: 0.42, fw: 0.5, ink: '#ecd3b4' }, { kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.18, fw: 0.22, ink: '#ecd3b4' },
            { kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.8, fw: 0.22, ink: '#d9a39c' }], back: [] },
  { id: 'luksoze', group: 'catalogue', product: 'p-qese-luksoze', name: ['Luksoze me motiv', 'Luxury all-over'], paper: 'art', size: 'L', colour: WHITE, finish: 'matte', handle: 'rope', handleColour: '#f1efe9', ink: PURPLE,
    motif: 'chevron', motifColour: PURPLE, front: [], back: [] },
  { id: 'pastel', group: 'catalogue', product: 'p-qese-pastel', name: ['Seria pastel', 'Pastel series'], paper: 'art', size: 'M', colour: '#cdbfe6', finish: 'matte', handle: 'ribbon', handleColour: '#2b4db5', ink: '#2b4db5',
    front: [{ kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.5, fw: 0.82, ink: '#2b4db5' }, { text: 'PAPER BAG', style: 'dm-600', fx: 0.3, fy: 0.9, fw: 0.36, ink: '#2b4db5' }],
    back: [{ kind: 'graphic', graphic: 'pw', fx: 0.5, fy: 0.5, fw: 0.82, ink: '#2b4db5' }] },
  { id: 'blerjesh', group: 'catalogue', product: 'p-qese-blerjesh', name: ['Blerjesh e madhe', 'Large shopping bag'], paper: 'art', size: 'XL', colour: '#dde07e', finish: 'matte', handle: 'rope', handleColour: BLACK, ink: PURPLE,
    motif: 'chevron', motifColour: '#e6c634',
    front: [one('ShoppingBag', 'dm-600', 0.47, 0.78, PURPLE, -0.03), { kind: 'graphic', graphic: 'pw', fx: 0.4, fy: 0.62, fw: 0.14, ink: PURPLE }, { text: 'PrintWorks', style: 'dm-600', track: -0.03, fx: 0.63, fy: 0.62, fw: 0.3, ink: PURPLE }],
    back: [one('ShoppingBag', 'dm-600', 0.5, 0.78, PURPLE, -0.03)] },
  // ideas by industry
  { id: 'butik', group: 'ideas', name: ['Butik · folje ari', 'Boutique · gold foil'], paper: 'art', size: 'M', colour: BLACK, finish: 'softtouch', handle: 'rope', handleColour: BLACK, ink: GOLD,
    front: atelier, back: atelier },
  { id: 'kafe', group: 'ideas', name: ['Furrë & kafe', 'Bakery & café'], paper: 'kraft-brown', size: 'M', handle: 'twisted', handleColour: '#b98b5d', ink: BLACK,
    front: [one([lines('bukë', '& kafe'), lines('bread', '& coffee')], 'serif-700', 0.44, 0.6, BLACK), one(['E PJEKUR ÇDO MËNGJES', 'BAKED EVERY MORNING'], 'sans-500', 0.69, 0.56, BLACK, 0.22)],
    back: [{ kind: 'qr', data: 'https://printwor-ks.com', fx: 0.5, fy: 0.46, fw: 0.34, ink: BLACK }, one(['SKANO MENYNË', 'SCAN THE MENU'], 'sans-700', 0.68, 0.42, BLACK, 0.2)] },
  { id: 'vere', group: 'ideas', name: ['Verë & dhurata', 'Wine & gifts'], paper: 'art', size: 'M', colour: '#1f4d3a', finish: 'matte', handle: 'rope', handleColour: '#b8975a', ink: GOLD,
    front: kantina, back: kantina },
  { id: 'kozmetike', group: 'ideas', name: ['Kozmetikë · soft-touch', 'Cosmetics · soft-touch'], paper: 'art', size: 'S', colour: '#dccbb0', finish: 'softtouch', handle: 'ribbon', handleColour: BLACK, ink: '#4a4a4c',
    front: lume, back: lume },
  { id: 'flora', group: 'ideas', name: ['Lule · shirit saten', 'Florist · satin ribbon'], paper: 'art', size: 'S', colour: '#f2b8cf', finish: 'matte', handle: 'ribbon', handleColour: '#f1efe9', ink: WHITE,
    front: flora, back: [flora[0]] },
  { id: 'takeaway', group: 'ideas', name: ['Takeaway', 'Takeaway'], paper: 'kraft-brown', size: 'M', handle: 'flat', handleColour: '#b98b5d', ink: BLACK, motif: 'bottom', motifColour: BLACK,
    front: [one(lines('BURGER', '& CO.'), 'cond-700', 0.34, 0.62, BLACK, 0.02), one(['POROSIT ONLINE', 'ORDER ONLINE'], 'sans-700', 0.8, 0.5, WHITE, 0.2)],
    back: [{ kind: 'qr', data: 'https://printwor-ks.com', fx: 0.5, fy: 0.36, fw: 0.3, ink: BLACK }, one(['SKANO & POROSIT', 'SCAN & ORDER'], 'sans-700', 0.8, 0.5, WHITE, 0.2)] },
  { id: 'femije', group: 'ideas', name: ['Lodra & fëmijë', 'Toys & kids'], paper: 'art', size: 'M', colour: '#f1d54a', finish: 'gloss', handle: 'twisted', handleColour: '#f1efe9', ink: '#1f2b4d',
    motif: 'dots', motifColour: WHITE, front: [one('lodra', 'dm-800', 0.5, 0.62, '#1f2b4d', -0.03)], back: [one('lodra', 'dm-800', 0.5, 0.62, '#1f2b4d', -0.03)] },
  { id: 'eko', group: 'ideas', name: ['Kraft i bardhë · eko', 'White kraft · eco'], paper: 'kraft-white', size: 'M', handle: 'flat', handleColour: '#f1efe9', ink: '#2e7d4f',
    front: [one(['E GJELBËR', 'GREEN'], 'cond-700', 0.42, 0.7, '#2e7d4f', 0.04), one(['100% e riciklueshme', '100% recyclable'], 'sans-500', 0.6, 0.56, '#2e7d4f', 0.08)], back: [] },
];
const colourName = hex => { const hit = BAG_COLOURS.find(([, v]) => v === hex); return hit ? P2(hit[0]) : hex; };
function renderSamples() {
  const on = samplesEl.querySelector('.sample.on')?.dataset.i;
  samplesEl.innerHTML = '';
  for (const group of ['catalogue', 'ideas']) {
    const list = SAMPLES.map((smp, i) => [smp, i]).filter(([smp]) => smp.group === group);
    const h = document.createElement('h3'); h.textContent = t('g_' + group);
    const n = document.createElement('span'); n.textContent = list.length; h.appendChild(n);
    samplesEl.appendChild(h);
    for (const [smp, i] of list) {
      const b = document.createElement('button'); b.className = 'sample'; b.dataset.i = i;
      b.innerHTML = '<i class="dot"></i><span><b></b><small></small></span>';
      const col = PAPERS[smp.paper].colour || smp.colour;
      b.querySelector('.dot').style.background = `linear-gradient(135deg, ${col} 58%, ${smp.ink} 58%)`;
      b.querySelector('b').textContent = P2(smp.name);
      b.querySelector('small').textContent = `${smp.size} · ${P2(PAPERS[smp.paper].name)}`;
      b.classList.toggle('on', String(i) === on);
      b.onclick = () => loadSample(i);
      samplesEl.appendChild(b);
    }
  }
}
function loadSample(i, over = {}) {
  const s = { ...SAMPLES[i], ...over }, z = sizeOf(PAPERS[s.paper].sizes.includes(s.size) ? s.size : 'M');
  design.front = []; design.back = [];
  Object.assign(state, {
    paper: s.paper, size: z[0], W: z[1], H: z[2], D: z[3], colour: s.colour || WHITE, finish: s.finish || 'matte',
    handle: PAPERS[s.paper].handles.includes(s.handle) ? s.handle : PAPERS[s.paper].handles[0], handleColour: s.handleColour || BLACK,
    motif: s.motif || 'none', motifColour: s.motifColour || PURPLE, product: s.product || null,
  });
  for (const k of ['front', 'back']) design[k] = s[k].map(({ fx, fy, fw, ...e }) => {
    const el = { kind: 'text', ...e, id: nextId++, x: fx * state.W, y: fy * state.H, w: fw * state.W };
    if (Array.isArray(el.text)) el.text = P2(el.text);
    clampEl(el); return el;
  });
  side = 'front'; selId = null;
  syncControls(); syncSideUI(); applyColours(); rebuild(); drawEditor(); syncProps(); setView('34');
  samplesEl.querySelectorAll('.sample').forEach(b => b.classList.toggle('on', +b.dataset.i === i && !Object.keys(over).length));
}

// ---------------- design editor (flat view of one side) ----------------
const ed = $('editor'), edx = ed.getContext('2d');
const props = $('props'), designNote = $('designNote');
const pText = $('pText'), pStyle = $('pStyle'), pQr = $('pQr'), pMethod = $('pMethod'), pInk = $('pInk'), pSize = $('pSize'), pNote = $('pNote'), copyBtn = $('copySide');
let edScale = 10, drag = null, atlasQueued = false;
const guides = { x: false, y: false };   // centre lines shown while an item snaps to them
const selected = () => design[side].find(e => e.id === selId) || null;

function changed() {   // editor now, 3D on the next frame (dragging stays smooth)
  drawEditor(); clearSample();
  if (!atlasQueued) { atlasQueued = true; requestAnimationFrame(() => { atlasQueued = false; redrawAtlas(); }); }
}
const hatchCache = {};
function hatch(dark) {
  if (!hatchCache[dark]) {
    const c = document.createElement('canvas'); c.width = c.height = 10;
    const x = c.getContext('2d'); x.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'; x.fillRect(0, 0, 10, 10);
    x.strokeStyle = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.22)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(-2, 12); x.lineTo(12, -2); x.moveTo(-2, 2); x.lineTo(2, -2); x.moveTo(8, 12); x.lineTo(12, 8); x.stroke();
    hatchCache[dark] = c;
  }
  return hatchCache[dark];
}
function drawEditor() {
  const { W, H } = state, avail = Math.max(120, ed.parentElement.clientWidth - 18);
  let s = avail / W; if (H * s > 330) s = 330 / H;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), cw = Math.round(W * s), ch = Math.round(H * s);
  if (ed.width !== Math.round(cw * dpr) || ed.height !== Math.round(ch * dpr)) { ed.width = Math.round(cw * dpr); ed.height = Math.round(ch * dpr); }
  ed.style.width = cw + 'px'; ed.style.height = ch + 'px';
  edScale = s;
  const P = s * dpr, a = printArea(), dark = new THREE.Color(paperCol()).getHSL({}).l < 0.5;
  edx.setTransform(1, 0, 0, 1, 0, 0);
  edx.fillStyle = paperCol(); edx.fillRect(0, 0, ed.width, ed.height);
  drawMotif(edx, P, 0, 0, W, H, side === 'front' ? state.D : 2 * state.D + W);
  edx.save(); edx.beginPath(); edx.rect(0, 0, ed.width, ed.height); edx.rect(a.x0 * P, a.y0 * P, (a.x1 - a.x0) * P, (a.y1 - a.y0) * P);
  edx.fillStyle = edx.createPattern(hatch(dark), 'repeat'); edx.fill('evenodd');
  edx.setLineDash([4 * dpr, 4 * dpr]); edx.strokeStyle = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)'; edx.lineWidth = dpr;
  edx.strokeRect(a.x0 * P, a.y0 * P, (a.x1 - a.x0) * P, (a.y1 - a.y0) * P); edx.restore();
  edx.save(); edx.fillStyle = '#f7f7f8'; cutPath(edx, P, 0, 0); edx.fill(); edx.restore();   // punched holes show the page behind
  drawSide(edx, P, 0, 0, design[side]);
  if (guides.x || guides.y) {
    edx.save(); edx.strokeStyle = '#e6007e'; edx.lineWidth = dpr; edx.beginPath();
    if (guides.x) { edx.moveTo(W / 2 * P, 0); edx.lineTo(W / 2 * P, ed.height); }
    if (guides.y) { const cy = (a.y0 + a.y1) / 2 * P; edx.moveTo(0, cy); edx.lineTo(ed.width, cy); }
    edx.stroke(); edx.restore();
  }
  const el = selected();
  if (el) {
    const [w, h] = elementSize(el), x = (el.x - w / 2) * P, y = (el.y - h / 2) * P, k = 10 * dpr;
    edx.save(); edx.strokeStyle = cssVar('--focus') || '#80298f'; edx.lineWidth = 1.5 * dpr; edx.setLineDash([5 * dpr, 3 * dpr]);
    edx.strokeRect(x, y, w * P, h * P); edx.setLineDash([]);
    edx.fillStyle = '#fff'; edx.fillRect(x + w * P - k / 2, y + h * P - k / 2, k, k); edx.strokeRect(x + w * P - k / 2, y + h * P - k / 2, k, k);
    edx.restore();
  }
}
new ResizeObserver(() => drawEditor()).observe(ed.parentElement);

const edPoint = e => { const r = ed.getBoundingClientRect(); return [(e.clientX - r.left) / edScale, (e.clientY - r.top) / edScale]; };
function hitTest(x, y) {
  const s = selected(), tol = 12 / edScale;
  if (s) { const [w, h] = elementSize(s); if (Math.abs(x - (s.x + w / 2)) < tol && Math.abs(y - (s.y + h / 2)) < tol) return [s, 'resize']; }
  const items = design[side];
  for (let i = items.length - 1; i >= 0; i--) { const el = items[i], [w, h] = elementSize(el); if (Math.abs(x - el.x) <= w / 2 && Math.abs(y - el.y) <= h / 2) return [el, 'move']; }
  return [null, null];
}
ed.addEventListener('pointerdown', e => {
  const [x, y] = edPoint(e), [el, mode] = hitTest(x, y);
  if (!el) { select(null); return; }
  select(el.id); ed.setPointerCapture(e.pointerId);
  drag = { mode, el, x0: x, y0: y, ex: el.x, ey: el.y, w0: el.w };
});
ed.addEventListener('pointermove', e => {
  const [x, y] = edPoint(e);
  if (!drag) { const [el, mode] = hitTest(x, y); ed.style.cursor = mode === 'resize' ? 'nwse-resize' : el ? 'move' : 'default'; return; }
  const el = drag.el;
  if (drag.mode === 'move') {
    el.x = drag.ex + x - drag.x0; el.y = drag.ey + y - drag.y0;
    const a = printArea(), cy = (a.y0 + a.y1) / 2, tol = 6 / edScale;
    guides.x = Math.abs(el.x - state.W / 2) < tol; guides.y = Math.abs(el.y - cy) < tol;
    if (guides.x) el.x = state.W / 2;
    if (guides.y) el.y = cy;
  }
  else el.w = Math.max(minWidth(el), drag.w0 + 2 * (x - drag.x0));   // resizes about the centre
  clampEl(el); syncProps(); changed();
});
const endDrag = () => { drag = null; if (guides.x || guides.y) { guides.x = guides.y = false; drawEditor(); } };
ed.addEventListener('pointerup', endDrag); ed.addEventListener('pointercancel', endDrag);
ed.addEventListener('keydown', e => {
  const el = selected(); if (!el) return;
  const st = e.shiftKey ? 1 : 0.2, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
  if (mv) { el.x += mv[0]; el.y += mv[1]; clampEl(el); syncProps(); changed(); e.preventDefault(); }
  if (e.key === 'Delete' || e.key === 'Backspace') { removeSelected(); e.preventDefault(); }
});
function select(id) { selId = id; syncProps(); drawEditor(); }
function removeSelected() { design[side] = design[side].filter(e => e.id !== selId); selId = null; syncProps(); changed(); }

// properties of the selected item
for (const [k, [, , label]] of Object.entries(STYLES)) pStyle.add(new Option(label, k));
function syncProps() {
  const el = selected(); props.hidden = !el; if (!el) return;
  $('propsTitle').textContent = t('k_' + el.kind);
  pText.hidden = pStyle.hidden = el.kind !== 'text';
  if (el.kind === 'text') { if (document.activeElement !== pText) pText.value = el.text; pStyle.value = el.style; }
  pQr.hidden = el.kind !== 'qr';
  if (el.kind === 'qr' && document.activeElement !== pQr) pQr.value = el.data;
  pMethod.hidden = el.kind !== 'logo';
  pMethod.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === (el.method || 'mono')));
  pInk.hidden = el.kind === 'logo' && el.method === 'full';
  swatches('pInk', INKS, el.ink, v => { const s = selected(); if (s) { s.ink = v; syncProps(); changed(); } });
  const a = printArea();
  pSize.min = minWidth(el); pSize.max = (a.x1 - a.x0).toFixed(1); pSize.value = el.w;
  $('o-pSize').textContent = fmt(el.w) + ' cm';
  let note = '', warn = false;
  if (el.kind === 'qr') {
    const li = relLum(el.ink), lf = relLum(paperCol()), ratio = (Math.max(li, lf) + 0.05) / (Math.min(li, lf) + 0.05);
    if (isFoil(el)) { note = t('n_qr_foil'); warn = true; }
    else if (ratio < 3) { note = t('n_qr_contrast'); warn = true; }
    else if (li > lf) { note = t('n_qr_inverted'); warn = true; }
    else if (el.w < 2.5) { note = t('n_qr_small'); warn = true; }
    else note = t('n_qr_ok');
  } else if (el.kind === 'logo' && el.method === 'full') note = t('n_full');
  else if (isFoil(el)) note = t('n_foil');
  else if (el.kind === 'text') note = t('n_text');
  pNote.textContent = note; pNote.classList.toggle('warn', warn); pNote.hidden = !note;
}
pText.addEventListener('input', () => { const el = selected(); if (el) { el.text = pText.value || ' '; clampEl(el); syncProps(); changed(); } });
pStyle.addEventListener('change', () => { const el = selected(); if (el) { el.style = pStyle.value; clampEl(el); changed(); } });
pQr.addEventListener('input', () => { const el = selected(); if (el) { el.data = pQr.value.trim() || ' '; clampEl(el); changed(); } });
pMethod.addEventListener('click', e => { const b = e.target.closest('button'), el = selected(); if (b && el) { el.method = b.dataset.v; syncProps(); changed(); } });
pSize.addEventListener('input', () => { const el = selected(); if (el) { el.w = +pSize.value; clampEl(el); syncProps(); changed(); } });
$('pCenter').onclick = () => { const el = selected(); if (el) { el.x = state.W / 2; clampEl(el); changed(); } };
$('delItem').onclick = removeSelected;
$('pDup').onclick = () => {
  const el = selected(); if (!el) return;
  const copy = { ...el, id: nextId++, x: el.x + 1, y: el.y + 1 };
  clampEl(copy); design[side].push(copy); selId = copy.id; syncProps(); changed();
};

// adding items
const defaultInk = () => relLum(paperCol()) > 0.3 ? BLACK : WHITE;
function addItem(el) {
  const a = printArea();
  el = { id: nextId++, x: (a.x0 + a.x1) / 2, y: (a.y0 + a.y1) / 2, ink: defaultInk(), ...el };
  clampEl(el); design[side].push(el); selId = el.id; syncProps(); changed();
}
$('addText').onclick = () => addItem({ kind: 'text', text: t('your_text'), style: 'dm-600', track: 0, w: Math.min(14, state.W * 0.55) });
$('addQr').onclick = () => {   // QR codes usually sit in a lower corner, clear of the main artwork
  const a = printArea(); addItem({ kind: 'qr', data: 'https://printwor-ks.com', w: 4, x: a.x1 - 2, y: a.y1 - 2 });
};
$('addLogo').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const img = await loadImage(URL.createObjectURL(f)), id = 'logo' + Date.now().toString(36) + nextId++;
    assets.set(id, toArt(img, f.name));
    addItem({ kind: 'logo', asset: id, method: 'mono', w: Math.min(12, state.W * 0.5) });
    designNote.textContent = t('added', { name: f.name });
  } catch { designNote.textContent = t('bad_file'); }
  e.target.value = '';
};

// front / back
function syncSideUI() {
  document.querySelectorAll('#sideSeg button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === side));
  copyBtn.textContent = side === 'front' ? t('copy_back') : t('copy_front');
}
$('sideSeg').addEventListener('click', e => {
  const b = e.target.closest('button[data-v]'); if (!b) return;
  side = b.dataset.v; selId = null; syncSideUI(); syncProps(); drawEditor();
  setView(side === 'back' ? 'back' : '34');   // turn the bag to the side being edited
});
copyBtn.onclick = () => {
  const other = side === 'front' ? 'back' : 'front';
  design[other] = design[side].map(e => ({ ...e, id: nextId++ }));
  changed(); designNote.textContent = t(other === 'back' ? 'copied_back' : 'copied_front');
};

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tAria)));
  document.querySelectorAll('[data-t-title]').forEach(el => { el.title = t(el.dataset.tTitle); el.setAttribute('aria-label', el.title); });
  designNote.textContent = t('design_note');
  renderSamples(); syncControls(); syncSideUI(); syncProps();
}

// ---------------- save image ----------------
$('shot').onclick = async () => {
  render(true);
  const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `printworks-qese-${state.size}-${side}.png`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

// ---------------- loop ----------------
// Ambient occlusion darkens the gusset fold, the inside of the bag and where it meets the ground.
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: BASE_PR >= 2 ? 2 : 4 }));
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 1, 1);
gtao.normalMaterial.side = THREE.DoubleSide;   // the inside of the bag is drawn with back faces
gtao.updateGtaoMaterial({ radius: 0.045, distanceExponent: 1.6, thickness: 0.03, scale: 1.15, samples: 12, distanceFallOff: 1 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
gtao.blendIntensity = 0.9;
// The AO pass draws every object with one normals material, which ignores the cut-out mask; give the bag panels a
// normals material with the same holes, so the punched holes do not leave a grey ghost.
const cutNormalMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, blending: THREE.NoBlending });
cutNormalMat.alphaMap = alphaTex;   // not a constructor option for this material, but three.js still compiles and feeds it when set
cutNormalMat.onBeforeCompile = sh => {
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\n#include <alphamap_pars_fragment>')
    .replace('#include <normal_fragment_begin>', '#ifdef USE_ALPHAMAP\n\tif ( texture2D( alphaMap, vAlphaMapUv ).g < 0.5 ) discard;\n#endif\n#include <normal_fragment_begin>');
};
cutNormalMat.customProgramCacheKey = () => 'pw-bag-cut-normals';
const baseOverride = gtao.renderOverride.bind(gtao), ccSave = new THREE.Color();
gtao.renderOverride = (r, overrideMaterial, target, clearColor, clearAlpha) => {
  if (overrideMaterial !== gtao.normalMaterial) return baseOverride(r, overrideMaterial, target, clearColor, clearAlpha);
  const saved = [];
  scene.traverse(o => { if (o.isMesh) { saved.push([o, o.material]); o.material = (o === outer || o === inner) ? cutNormalMat : gtao.normalMaterial; } });
  r.getClearColor(ccSave); const ca = r.getClearAlpha(), ac = r.autoClear;
  r.setRenderTarget(target); r.autoClear = false;
  r.setClearColor(clearColor); r.setClearAlpha(clearAlpha || 0); r.clear();
  r.render(scene, camera);
  r.autoClear = ac; r.setClearColor(ccSave); r.setClearAlpha(ca);
  for (const [o, m] of saved) o.material = m;
};
composer.addPass(gtao);
composer.addPass(new OutputPass());

// Crease shading is soft by nature, so it is computed at half resolution: the same look for about a quarter of the cost.
let aoScale = 0.5;
function resize() {
  const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight), pr = renderer.getPixelRatio();
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  composer.setPixelRatio(pr); composer.setSize(w, h);
  if (aoScale > 0) gtao.setSize(Math.max(1, Math.round(w * pr * aoScale)), Math.max(1, Math.round(h * pr * aoScale)));
  dirty = true;
}
// Keep it smooth: if frames run slow while the bag is moving, step the quality down once or twice (resolution first, then the extra shading).
const QUALITY = [{ pr: BASE_PR, ao: 0.5 }, { pr: Math.min(BASE_PR, 1.25), ao: 0.4 }, { pr: 1, ao: 0 }];
let quality = 0, slowFrames = 0, lastMove = 0;
function setQuality(q) {
  quality = q; renderer.setPixelRatio(QUALITY[q].pr); aoScale = QUALITY[q].ao; gtao.enabled = aoScale > 0; resize();
}
new ResizeObserver(resize).observe(stage); resize();

let active = true;   // the homepage pauses the embedded bag while it is off screen
function render(force = false) {
  if (!active && !force) return;
  let moved = false;
  if (tween) {
    moved = true;
    const k = Math.min(1, (performance.now() - tween.t0) / 650), e = 1 - Math.pow(1 - k, 3);
    camera.position.lerpVectors(tween.p0, tween.to.pos, e);
    controls.target.lerpVectors(tween.q0, tween.to.target, e);
    if (k === 1) tween = null;
  }
  moved = controls.update() || moved;
  if (moved && !force && !navigator.webdriver) {
    const now = performance.now(), dt = now - lastMove; lastMove = now;
    if (dt < 250) {   // consecutive moving frames: slower than about 33 fps counts against the current quality
      slowFrames = dt > 30 ? slowFrames + 1 : Math.max(0, slowFrames - 0.5);
      if (slowFrames > 20 && quality < QUALITY.length - 1) { slowFrames = 0; setQuality(quality + 1); }
    }
  }
  if (moved || dirty || force) {
    if (dirty || force) renderer.shadowMap.needsUpdate = true;
    composer.render(); dirty = false;
  }
}
renderer.setAnimationLoop(render);

// ---------------- the storefront's side of the glass ----------------
// What the shopper has built, in the catalogue's own vocabulary (option ids match src/data/catalog.ts).
const inkName = hex => { const hit = INKS.find(i => i[1] === hex); return hit ? P2(hit[0]).toLowerCase() : hex; };
function describe() {
  const item = el => {
    const ink = el.kind === 'logo' && el.method === 'full' ? t('spec_full') : P2((INKS.find(i => i[1] === el.ink) || [[el.ink, el.ink]])[0]).toLowerCase();
    const what = el.kind === 'text' ? `${t('spec_text')} “${el.text.replace(/\*\*/g, '').replace(/\s*\n\s*/g, ' / ')}” (${(STYLES[el.style] || [])[2] || ''})`
      : el.kind === 'qr' ? `${t('spec_qr')} → ${el.data}` : el.kind === 'logo' ? `${t('spec_logo')} ${assets.get(el.asset)?.name || ''}`.trim() : t('spec_graphic');
    return `${what}, ${fmt(el.w)} cm, ${ink}`;
  };
  const sideText = k => design[k].length ? design[k].map(item).join('; ') : t('spec_empty');
  const hc = HANDLE_COLOURS.find(([, v]) => v === state.handleColour);
  return `${t('spec_title')} — ${t('front')}: ${sideText('front')}. ${t('back')}: ${sideText('back')}. `
    + `${t('spec_bag')}: ${colourName(paperCol())}. ${t('spec_handle')}: ${P2(hd().name).toLowerCase()}, ${(hc ? P2(hc[0]) : state.handleColour).toLowerCase()}.`
    + (state.motif === 'none' ? '' : ` ${t('spec_motif')}: ${t('m_' + state.motif).toLowerCase()}, ${inkName(state.motifColour)}.`);
}
function getConfig() {
  const all = [...design.front, ...design.back];
  return {
    paper: state.paper, size: state.size, width: state.W, depth: state.D, height: state.H,
    colour: paperCol(), finish: state.paper === 'art' ? state.finish : null, handle: state.handle, handleColour: handleHex(),
    motif: state.motif, product: state.product,
    foil: all.some(isFoil), items: { front: design.front.length, back: design.back.length }, spec: describe(),
  };
}
let notifyQueued = false;
function queueNotify() {
  saveSoon();
  if (notifyQueued || window.parent === window) return;
  notifyQueued = true;
  queueMicrotask(() => { notifyQueued = false; window.parent.postMessage({ source: 'pw-studio', type: 'change', config: getConfig() }, location.origin); });
}
// A square picture of the bag as designed, for the cart line and the order in the CMS.
function snapshot(size = 420) {
  const p0 = camera.position.clone(), q0 = controls.target.clone(), tw = tween, v = viewTarget(side === 'back' ? 'back' : '34');
  tween = null; camera.position.copy(v.pos); controls.target.copy(v.target); camera.lookAt(v.target);
  composer.render();
  const src = renderer.domElement, s = Math.min(src.width, src.height), c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, size, size);
  camera.position.copy(p0); controls.target.copy(q0); camera.lookAt(q0); tween = tw; dirty = true;
  return c.toDataURL('image/jpeg', 0.84);
}
function setLang(next) {
  if (next !== 'sq' && next !== 'en' || next === lang) return;
  lang = next; applyLang(); queueNotify();
}
// The design is kept for the browser tab, so a visitor who goes to the cart and comes back finds it again.
const STORE = 'pw-studio-design-v1';
let saveTimer = 0;
function saveSoon() { if (embed || !window.__ready) return; clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); }
function save() {
  try {
    const logos = {}; let bytes = 0;
    for (const el of [...design.front, ...design.back]) if (el.kind === 'logo' && !logos[el.asset]) {
      const a = assets.get(el.asset); if (!a) continue;
      const k = Math.min(1, 900 / Math.max(a.color.width, a.color.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(a.color.width * k)); c.height = Math.max(1, Math.round(a.color.height * k));
      c.getContext('2d').drawImage(a.color, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/png'); bytes += url.length;
      if (bytes > 2.5e6) return;   // too much to keep: the last saved state stays
      logos[el.asset] = { url, name: a.name };
    }
    sessionStorage.setItem(STORE, JSON.stringify({ state, design, side, logos }));
  } catch { /* storage unavailable or full: the design simply is not kept */ }
}
async function restore() {
  try {
    const d = JSON.parse(sessionStorage.getItem(STORE) || 'null');
    if (!d || !PAPERS[d.state?.paper] || !sizeOf(d.state.size) || !HANDLES[d.state.handle] || !FINISHES[d.state.finish]) return false;
    for (const [id, l] of Object.entries(d.logos || {})) assets.set(id, toArt(await loadImage(l.url), l.name));
    Object.assign(state, d.state);
    if (!MOTIFS.includes(state.motif)) state.motif = 'none';
    for (const k of ['front', 'back']) design[k] = (d.design?.[k] || []).filter(el => el.kind !== 'logo' || assets.has(el.asset)).map(el => ({ ...el, id: nextId++ }));
    side = d.side === 'back' ? 'back' : 'front'; selId = null;
    return true;
  } catch { return false; }
}
const showSample = id => { const i = SAMPLES.findIndex(smp => smp.id === id); if (i >= 0) loadSample(i); };
const setActive = on => { active = !!on; if (active) dirty = true; };
window.pwStudio = { getConfig, snapshot, setLang, loadSample: showSample, setActive };

// ---------------- start ----------------
function fontsReady() {
  const faces = ['600 40px "DM Sans Variable"', '500 40px "Montserrat Variable"', '700 40px "Montserrat Variable"', '700 40px "Oswald Variable"', '500 40px "Playfair Display Variable"', '700 40px "Dancing Script Variable"'];
  return Promise.race([Promise.all(faces.map(f => document.fonts.load(f, 'Përsosmëri'))), new Promise(r => setTimeout(r, 5000))]).catch(() => {});
}
// Fonts that arrive late: re-render text so nothing stays in a fallback font.
document.fonts?.addEventListener?.('loadingdone', () => {
  if (!window.__ready) return;
  maskCache.clear();
  for (const k of ['front', 'back']) design[k].forEach(clampEl);
  redrawAtlas(); drawEditor();
});
if (qrcode.stringToBytesFuncs?.['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];   // QR links with accents

graphics.pw = pwMark();
applyLang();
applyColours(); rebuild(); setView('34', false);
fontsReady().then(async () => {
  maskCache.clear();
  // The storefront can open the studio on a given bag, ?paper=kraft-brown&size=M&handle=twisted&finish=matte (ids as in the
  // catalogue), or on an example, ?sample=butik. Without either, a visitor who comes back finds the design they left.
  const paper = PAPERS[params.get('paper')] ? params.get('paper') : null, size = (params.get('size') || '').toUpperCase();
  const asked = SAMPLES.findIndex(smp => paper ? smp.paper === paper : smp.id === params.get('sample'));
  const over = {};
  if (sizeOf(size)) over.size = size;
  if (HANDLES[params.get('handle')]) over.handle = params.get('handle');
  if (FINISHES[params.get('finish')]) over.finish = params.get('finish');
  if (!embed && asked < 0 && await restore()) { syncControls(); syncSideUI(); applyColours(); rebuild(); drawEditor(); syncProps(); }
  else loadSample(Math.max(0, asked), over);
  if (Object.keys(over).length || paper) showTab('bag');
  setView('34', false);
  if (embed) {   // a showpiece, not a tool: it turns by itself, the mouse can spin it, and scrolling the page is never caught
    controls.enableZoom = false; controls.enablePan = false;
    if (matchMedia('(pointer: coarse)').matches) { controls.enabled = false; renderer.domElement.style.touchAction = 'auto'; }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setSpin(true);
  }
  window.__ready = true;
  $('boot').classList.add('done');
  if (window.parent !== window) window.parent.postMessage({ source: 'pw-studio', type: 'ready', config: getConfig() }, location.origin);
});
window.__api = { renderer, render: () => render(true), getQuality: () => quality, setQuality, gtao, loadSample, SAMPLES, SIZES, PAPERS, HANDLES, FINISHES, design, select, drawEditor, printArea, elementSize,
  getSide: () => side, outer, straps, patches, state, setView, setSize, setPaper, setHandle, rebuild, redrawAtlas, camera, controls, composer, scene, showTab, afterLook };
