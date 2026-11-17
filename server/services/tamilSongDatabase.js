const CORE_TITLES = [
  'Vaathi Coming', 'Arabic Kuthu', 'Rowdy Baby', 'Why This Kolaveri', 'Mersal Arasan', 'Aaluma Doluma',
  'Enjoy Enjaami', 'Naan Un', 'Mazhai Varuthu', 'Kanmani Anbodu', 'Muthu Muthu', 'Kadhal Roja', 'Unnale Unnale',
  'Azhagiye', 'Anbe Peranbe', 'En Jaanu', 'Pudhu Vellai Mazhai', 'Muthu', 'Oru Deivam Thandha', 'Pachai Nirame',
  'Minsara Kanavu', 'Malarodu', 'Nenjukkul Peidhidum', 'Pudhu Vasantham', 'Yaaro Ivan', 'Pookkalae Sattradhu',
  'Kaatril Varum', 'Naan Kadavul', 'Ezhhu Thalaimuraigal', 'Sundari Neeve', 'Ariya Paruvam', 'Saroja Saman Nikalo',
  'Vaseegara', 'Pachai Nera', 'Kaatru Veliyidai', 'Aaromale', 'Mannipaaya', 'Ennulle', 'Naan Nee', 'Ninaikka Therindha',
  'Yennai Arindhaal', 'Yedho Yedho', 'Chinna Chinna', 'Kanne Kalaimaane', 'Adiye', 'Raja Raja', 'Yemma Yemma',
  'Thanga Thamizh', 'Pallikoodam', 'Aaruvi', 'Elay Keechan', 'Ullam Ketkuma', 'Pani Vizhum', 'Sundari', 'Kanne Kanne',
  'Veyilodu', 'Maya Nadhi', 'Enge Enathu', 'Oru Naal Podum', 'Kaalam Yen Kadhali', 'Ponni Nadhi', 'Vilayaadu',
  'Sivamani', 'Mugamoodi', 'Kadhaippoma', 'Vennilave', 'Anjali Anjali', 'Nee Partha', 'Mundhinam', 'Kaatril', 'Aaram',
  'Kangal Irandal', 'Megham Karukkatha', 'Vaa Vaa', 'Ponniyin Selvan', 'Maalai Nera', 'Pudhu Pudhu', 'Veppam', 'Rasathi',
  'Saami Saami', 'Azhaghu', 'Aasai Aasai', 'Ulaga Nayagan', 'Yaar Indha Saalai', 'Mangalungal', 'Yaarai', 'Yenna',
  'En Kadhal Solla', 'Oru Vaanam', 'Aaaradhana', 'Ammamma', 'Pottu Vaithu', 'Aasaiya', 'Yaaram', 'Maalai', 'Jilla',
  'Naa Ready', 'Kaatrodu', 'Thalaiva', 'Paarthen', 'Raja Rani', 'Putham Pudhu', 'Maalai', 'Naan Yaar', 'Kadai', 'Vaa',
  'Naan Yaar', 'Aayutha Ezhuthu', 'Poongatre', 'Aiye', 'Malar', 'Pudhu Manidha', 'Oru Naalil', 'Vizhigalil', 'Vaanam',
  'Mynaa', 'Engeyum Kadhal', 'Mundhinam Partheney', 'Sonna Puriyathu', 'Idhu Namma Aalu', 'Naan Kadavul', 'Kaadhal',
  'Ariya', 'Azhagiya', 'Mudhalvan', 'Vennilave', 'Nalam', 'Kalloori', 'Dhaaganam', 'Vaarayo', 'Karakattakaran', 'Ponni',
  'Vaaranam Aayiram', 'Saaral', 'Yaaradi Nee Mohini', 'Sundari', 'Megha', 'Naanum Rowdy Dhaan', 'Aandavan', 'Mayanadi',
  'Poove Unakaga', 'Raja Kaiya', 'Naan', 'Munbe Vaa', 'Kaatril', 'Azhaghai', 'Maruvaarthai', 'Mannipaaya', 'Aagayam',
  'Kaatru Veliyidai', 'Ariya', 'Adiye', 'Kallori', 'Vathikuchi', 'Enthiran', 'Neruppu Da', 'Pookal', 'Yaaran', 'Kattu',
  'Kadavul', 'Agaram', 'Oththa', 'Aasai', 'Katrinile', 'Mugam', 'Naan Mahan Alla', 'Nadodi', 'Anantha', 'Kandha',
  'Vizhigal', 'Nallavan', 'Chinna', 'Oru', 'Karuve', 'Unnai', 'Baaram', 'Vaanam', 'Ulagam', 'Samyuktha', 'Sukran',
  'Punnagai', 'Poraali', 'Kala', 'Maanadu', 'Ponniyin Selvan', 'Kavignar', 'Ariya Paruvam', 'Kattipudi', 'Ariya',
  'Kanne Kalaimaane', 'Naan Sirithal', 'Paal', 'Nila', 'Madhan', 'Vetri', 'Mugathaan', 'Karmam', 'Vaadi', 'Koduthale',
  'Thendral', 'Katra', 'Paaru', 'Hukum', 'Mazhaithuli', 'Vairamuthu', 'Kumbakonam', 'Kadaisi Vivasayi', 'Maamannan',
  'Kokki', 'Dheivangal', 'Maya', 'Pudhiya', 'Seera', 'Sethupathi', 'Kottu', 'Idi', 'Ranjitham', 'Pachaikili', 'Sivam',
  'Raja', 'Vetriya', 'Naanum', 'Pudhu', 'Ponni', 'Ranjith', 'Kangal', 'Mookuthi', 'Adha', 'Mellam', 'Unnodu',
  'Nenjame', 'Illaya', 'Maanja', 'Azhaghiya', 'Vetrivizha', 'Oru', 'Aadhavan', 'Kaalam', 'Aruvi', 'Nadandha', 'Ariya',
  'Kummatty', 'Meesai', 'Naan', 'Thaandi', 'Vaa', 'Kaatru', 'Kadhal', 'Suttrum', 'Nallathor', 'Parandhu', 'Kadal',
  'Azhaga', 'Pani', 'Sangam', 'Madhan', 'Pudhuvaazhvu', 'Mylapore', 'Kaatril', 'Aadum', 'Soodum', 'Yelitha', 'Madurai',
  'Naan', 'Aru', 'Oru', 'Nila', 'Mathu', 'Yelai', 'Vaan', 'Thendral', 'Anjaana', 'Kadal', 'Kadhalan', 'Paniya', 'Muthal',
  'Paartha', 'Thiruda', 'Avar', 'Rasigan', 'Bharathi', 'Sarvam', 'Namma', 'Raja', 'Yun', 'Patta', 'Vandha', 'Idam',
  'Pattampoochi', 'Thalapathy', 'Sudane', 'Muthu', 'Nadaga', 'Ariya', 'Mullai', 'Ilamai', 'Kadalai', 'Mannkulam'
];

const TITLE_PREFIXES = [
  'Aasai', 'Azhage', 'Anbe', 'Ennai', 'Nenjame', 'Malar', 'Pookal', 'Kadhale', 'Vaanam', 'Maya', 'Nila', 'Vennila',
  'Sundari', 'Vetri', 'Pudhu', 'Kadhal', 'Kaatru', 'Raja', 'Kanne', 'Muthu', 'Ponni', 'Maan', 'Vizhiyil', 'Chinna',
  'Mellam', 'Pachai', 'Thendral', 'Naan', 'Unnai', 'Aruvi', 'Adiye', 'Vaa', 'Seer', 'Yen', 'Maalai', 'Nadaga', 'Kadai',
  'Ponniyin', 'Kaatril', 'Kadal', 'Mugam', 'Yaar', 'Kallori', 'Vandha', 'Sivam', 'Ilamai', 'Pavam', 'Mannum', 'Enge',
  'Raja', 'Yennai', 'Nila', 'Oru', 'Pattu', 'Kiligal', 'Poraali', 'Ariya', 'Oda', 'Thee', 'Saaral', 'Kanneer', 'Kaatru',
  'Maya', 'Pani', 'Aaja', 'Kavithai', 'Aaru', 'Vaan', 'Muzhumai', 'Kumbakonam', 'Kattu', 'Thal', 'Ulagam', 'Madhur',
  'Malarin', 'Pudhiya', 'Veettukku', 'Vaanam', 'Melli', 'Theivam', 'Saaral', 'Kovil', 'Poove', 'Thozha', 'Dheivam'
];

const TITLE_SUFFIXES = [
  'Nenjame', 'Kadhale', 'Vaanam', 'Malar', 'Azhage', 'Pookal', 'Mannipaaya', 'Kaatru', 'Nila', 'Mugam', 'Aasai',
  'Kanne', 'Unnai', 'Muthu', 'Pudhu', 'Yaar', 'Pani', 'Pazhagi', 'Vennila', 'Adaya', 'Aalam', 'Kalam', 'Raani', 'Dheivam',
  'Nilave', 'Meyyame', 'Theivam', 'Kadal', 'Ponni', 'Sundari', 'Kodu', 'Vizhiyil', 'Naan', 'Enge', 'Raja', 'Neer', 'Vaa',
  'Parkum', 'Thalam', 'Kuruvai', 'Adiye', 'Kaadhal', 'Mellam', 'Solla', 'Aruvi', 'Vandha', 'Oru', 'Murum', 'Khaalam',
  'Pattu', 'Settu', 'Maan', 'Pongum', 'Peranbe', 'Ketta', 'Malar', 'Paaru', 'Sikkum', 'Yen', 'Pitha', 'Mutham', 'Naanam',
  'Naala', 'Thirum', 'Maram', 'Vinai', 'Velicham', 'Mizhi', 'Gandham', 'Adimai', 'Netru', 'Vaanam', 'Vizhigal', 'Neram',
  'Porale', 'Aagayam', 'Kadali', 'Vazhvu', 'Saaral', 'Ariyum', 'Mannan', 'Seer', 'Poonkuyil', 'Nadagam', 'Ulagam'
];

const TAMIL_TITLE_VARIANTS = {
  vaathi: ['vaathi', 'vathi', 'vaathy', 'vaati', 'vathi', 'vathii'],
  coming: ['coming', 'comin', 'comeing', 'cooming', 'comming'],
  arabic: ['arabic', 'arabi', 'arabhic', 'arabick', 'arabicv'],
  kuthu: ['kuthu', 'kuthu', 'kuttu', 'kuthu'],
  rowdy: ['rowdy', 'roudy', 'raudy', 'rowdi'],
  baby: ['baby', 'babi', 'baiby', 'baaby'],
  why: ['why', 'wy', 'y'],
  this: ['this', 'dis', 'thiz'],
  kolaveri: ['kolaveri', 'kolavari', 'kolaaveri', 'kolveri', 'kolavary', 'kolaverii', 'kolaveri'],
  tamil: ['tamil', 'tamizh', 'thamizh', 'tamiz', 'tamils'],
  veedu: ['veedu', 'video', 'vidu', 'veedu'],
  moon: ['moon', 'mun', 'moonn', 'moun'],
  neel: ['neel', 'nil', 'neelam'],
  anbe: ['anbe', 'anbee', 'anbey', 'anb'],
  heart: ['heart', 'hert', 'hearth'],
  love: ['love', 'lovers', 'lov', 'lav'],
  kadhal: ['kadhal', 'kadal', 'kadhall', 'kadhale', 'kadhal'],
  enna: ['enna', 'ena', 'inna', 'enna'],
  solla: ['solla', 'sola', 'sollai'],
  pookal: ['pookal', 'pookale', 'pookall', 'pookal'],
  vennila: ['vennila', 'vennila', 'vennela'],
  milo: ['milo', 'melo', 'milo'],
  nilave: ['nilave', 'nilave', 'nilave'],
  da: ['da', 'dha', 'dah'],
  geethai: ['geethai', 'geetha', 'geeth'],
  siva: ['siva', 'shiv', 'shiva'],
};

function normalizeForMatch(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyCommonRomanization(word = '') {
  const key = normalizeForMatch(word);
  for (const [canonical, variants] of Object.entries(TAMIL_TITLE_VARIANTS)) {
    if (variants.includes(key)) return canonical;
  }
  return key;
}

function buildTanglishVariants(title = '') {
  const variants = new Set();
  const base = normalizeForMatch(title);
  if (!base) return [];

  variants.add(base);
  variants.add(title.trim());
  variants.add(title.toLowerCase());
  variants.add(title.toUpperCase());

  const tokens = base.split(' ');
  const rebuilt = tokens.map((token) => applyCommonRomanization(token)).join(' ');
  variants.add(rebuilt);

  const compact = tokens.map((token) => applyCommonRomanization(token)).join('');
  variants.add(compact);

  const titleWords = title.split(/\s+/);
  for (const token of titleWords) {
    const cleaned = normalizeForMatch(token);
    if (!cleaned) continue;
    variants.add(cleaned);

    const key = applyCommonRomanization(token);
    if (key !== cleaned) {
      variants.add(key);
    }
  }

  if (/\b(vaathi|vathi|vaathy|vaati|vathi)\b/i.test(title)) {
    variants.add('vaathi coming');
    variants.add('vathi coming');
  }
  if (/\b(arabic|arabi)\b/i.test(title)) {
    variants.add('arabic kuthu');
    variants.add('arabi kuthu');
  }
  if (/\b(rowdy|roudy)\b/i.test(title)) {
    variants.add('rowdy baby');
  }
  if (/\bkolaveri|kolavari|kolaaveri|kolveri\b/i.test(title)) {
    variants.add('why this kolaveri');
    variants.add('why this kolavari');
  }

  return [...variants].filter((entry) => entry && entry.length > 1);
}

function uniqueTitles(values = []) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    if (!cleaned || seen.has(cleaned.toLowerCase())) continue;
    seen.add(cleaned.toLowerCase());
    output.push(cleaned);
  }
  return output;
}

const generatedTitles = [];
for (const prefix of TITLE_PREFIXES) {
  for (const suffix of TITLE_SUFFIXES) {
    const title = `${prefix} ${suffix}`.trim();
    if (title.split(' ').length >= 2) generatedTitles.push(title);
  }
}

const database = uniqueTitles([
  ...CORE_TITLES,
  ...generatedTitles,
  ...TITLE_PREFIXES.map((word) => `${word} Song`),
  ...TITLE_SUFFIXES.map((word) => `${word} Theme`),
  ...TITLE_PREFIXES.flatMap((word) => [
    `${word} Kaatru`, `${word} Enge`, `${word} Vaanam`, `${word} Nenjame`, `${word} Kadhal`, `${word} Pookal`
  ])
]).map((title) => ({
  title,
  variants: buildTanglishVariants(title),
}));

export const TAMIL_SONG_DATABASE = database.slice(0, 1200);

function levenshteinDistance(a = '', b = '') {
  const left = String(a || '').toLowerCase();
  const right = String(b || '').toLowerCase();
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function fuzzyScore(left = '', right = '') {
  const source = normalizeForMatch(left);
  const target = normalizeForMatch(right);
  if (!source || !target) return 0;
  if (source === target) return 1;
  const maxLen = Math.max(source.length, target.length);
  const distance = levenshteinDistance(source, target);
  return Math.max(0, 1 - distance / maxLen);
}

export function findBestSongMatch(query = '') {
  const input = normalizeForMatch(query);
  if (!input) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const song of TAMIL_SONG_DATABASE) {
    const saw = new Set();
    for (const variant of song.variants) {
      const candidate = normalizeForMatch(variant);
      if (!candidate || saw.has(candidate)) continue;
      saw.add(candidate);

      const score = fuzzyScore(input, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = song;
      }
    }

    const titleScore = fuzzyScore(input, song.title);
    if (titleScore > bestScore) {
      bestScore = titleScore;
      bestMatch = song;
    }
  }

  if (bestScore < 0.58) return null;
  return bestMatch;
}

export function getTanglishSongAliases(title = '') {
  const match = TAMIL_SONG_DATABASE.find((song) => song.title.toLowerCase() === title.toLowerCase());
  return match ? match.variants : buildTanglishVariants(title);
}
