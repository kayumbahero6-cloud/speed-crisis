import { TRACK_LIST } from './catalog.js';
import { hash } from './util.js';

const has = (n, arr) => arr.some((k) => n.includes(k));
const NEON = ['adelaide', 'baku', 'detroit', 'guia', 'jeddah', 'las vegas', 'long beach', 'marina bay', 'miami', 'nashville', 'norisring', 'pau', 'san jose', 'st. petersburg', 'toronto', 'albert park', 'losail', 'monaco'];
const OVAL = ['bristol', 'darlington', 'daytona', 'knoxville', 'martinsville', 'pocono', 'talladega', 'trenton', 'nazareth', 'indianapolis'];
const FOREST = ['rburgring', 'sarthe', 'spa-', 'brands hatch', 'oulton', 'road america', 'watkins', 'tremblant', 'motorsport park', 'brainerd', 'road atlanta', 'lime rock', 'mid-ohio', 'virginia', 'magny', 'dijon', 'charade', 'clermont', 'rouen', 'reims', 'solitude', 'schleizer', 'sachsenring', 'hockenheim', 'zolder', 'red bull', 'knockhill', 'croft', 'mosport', 'oschersleben', 'salzburgring', 'donington', 'castle combe', 'goodwood', 'thruxton', 'mallory', 'avus', 'portland', 'bridgehampton'];
const OPEN = ['kyalami', 'zwartkops', 'chang', 'barbagallo', 'phillip island', 'sonoma', 'laguna', 'riverside', 'vallelunga', 'fuji', 'estoril', 'algarve', 'mugello', 'misano', 'ricard', 'tormo', 'catalunya', 'hungaroring', 'motegi', 'aida', 'tsukuba', 'inje', 'winton', 'pergusa', 'daytona', 'snetterton', 'zandvoort', 'winton'];

export const STYLE_INFO = {
  neon: { label: 'NEON CITY', theme: 'night', k: 1.45, h: 0.35 },
  city: { label: 'CITY', theme: 'day', k: 1.0, h: 0.8 },
  forest: { label: 'FOREST', theme: 'day', k: 1.25, h: 1.7 },
  open: { label: 'OPEN COUNTRY', theme: 'day', k: 0.9, h: 0.6 },
  oval: { label: 'SPEEDWAY', theme: 'sunset', k: 0.0, h: 0.0 },
};

function styleOf(n) {
  n = n.toLowerCase();
  if (has(n, OVAL)) return 'oval';
  if (has(n, NEON)) return 'neon';
  if (has(n, FOREST)) return 'forest';
  if (has(n, OPEN)) return 'open';
  return 'city';
}

export const TRACKS = TRACK_LIST.map(([name, country, img, desc], i) => {
  const style = styleOf(name), info = STYLE_INFO[style], h = hash(i * 7.1 + 3);
  const params = {
    ph: [hash(i * 1.1) * 6.28, hash(i * 2.3) * 6.28, hash(i * 3.7) * 6.28, hash(i * 5.1) * 6.28, hash(i * 9.1) * 6.28],
    k: info.k * (0.8 + h * 0.55), h: info.h * (0.7 + hash(i * 4.4) * 0.7), wl: 0.75 + hash(i * 6.6) * 0.7, oval: style === 'oval',
  };
  let theme = info.theme; if (style !== 'neon' && style !== 'oval') theme = h < 0.18 ? 'sunset' : h > 0.9 ? 'rain' : 'day';
  const id = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { id, name, country, img, desc, style, params, theme, label: info.label };
}).sort((a, b) => a.name.localeCompare(b.name));
export const trackById = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];
