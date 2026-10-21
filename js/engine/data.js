/* PE.Data — static game data and every tunable number (PE.Data.balance).
   Cities, districts, eras, era-gated property types (with 3D model keys),
   families, rival archetypes, traits, managers, names and event text live here.
   No logic beyond tiny lookups; the bible (docs/REDESIGN.md) is the source. */
(function (root) {
  var PE = root.PE = root.PE || {};

  var D = {};
  D.currency = '£';
  D.startYear = 1850;
  D.endYear = 2030;

  /* ---------- Eras (bible §2, §4, §3.3) ---------- */
  D.eras = [
    { id: 'victorian', name: 'Victorian', from: 1850, to: 1899, baseRate: 0.035, rateSpread: 0.005, drift: 0.000, stampDuty: 0.02, cgt: 0.00, estateTax: 0.20, wealthTax: 0.000, maxLtv: 0.70, fixedRate: false, lifeMult: 1.35 },
    { id: 'gilded',    name: 'Gilded Age', from: 1900, to: 1929, baseRate: 0.045, rateSpread: 0.005, drift: 0.010, stampDuty: 0.03, cgt: 0.00, estateTax: 0.25, wealthTax: 0.002, maxLtv: 0.70, fixedRate: false, lifeMult: 1.2 },
    { id: 'crisis',    name: 'Crisis & War', from: 1930, to: 1949, baseRate: 0.045, rateSpread: 0.025, drift: -0.005, stampDuty: 0.03, cgt: 0.10, estateTax: 0.40, wealthTax: 0.005, maxLtv: 0.60, fixedRate: false, lifeMult: 1.1 },
    { id: 'boom',      name: 'Boom', from: 1950, to: 1979, baseRate: 0.065, rateSpread: 0.015, drift: 0.025, stampDuty: 0.04, cgt: 0.25, estateTax: 0.40, wealthTax: 0.010, maxLtv: 0.70, fixedRate: true, lifeMult: 0.9 },
    { id: 'modern',    name: 'Modern', from: 1980, to: 2007, baseRate: 0.070, rateSpread: 0.030, drift: 0.015, stampDuty: 0.05, cgt: 0.20, estateTax: 0.35, wealthTax: 0.006, maxLtv: 0.70, fixedRate: true, lifeMult: 0.75 },
    { id: 'digital',   name: 'Digital', from: 2008, to: 2030, baseRate: 0.030, rateSpread: 0.020, drift: 0.010, stampDuty: 0.06, cgt: 0.20, estateTax: 0.30, wealthTax: 0.004, maxLtv: 0.70, fixedRate: true, lifeMult: 0.65 }
  ];
  D.eraFor = function (year) {
    for (var i = 0; i < D.eras.length; i++) if (year <= D.eras[i].to) return D.eras[i];
    return D.eras[D.eras.length - 1];
  };
  D.eraIndex = function (eraId) { for (var i = 0; i < D.eras.length; i++) if (D.eras[i].id === eraId) return i; return 0; };

  /* ---------- Market cycle phases (bible §6.4) ---------- */
  D.cycles = {
    boom:       { name: 'Boom',       value: 0.08,  rate: 0.010, vacancy: 0.8, next: { stagnation: 0.5, recession: 0.35, growth: 0.15 }, len: [2, 4] },
    growth:     { name: 'Growth',     value: 0.03,  rate: 0.000, vacancy: 1.0, next: { boom: 0.3, growth: 0.4, stagnation: 0.3 }, len: [2, 5] },
    stagnation: { name: 'Stagnation', value: 0.00,  rate: -0.005, vacancy: 1.2, next: { growth: 0.5, recession: 0.35, boom: 0.15 }, len: [1, 3] },
    recession:  { name: 'Recession',  value: -0.10, rate: -0.010, vacancy: 1.5, next: { stagnation: 0.4, growth: 0.45, depression: 0.15 }, len: [1, 2] },
    depression: { name: 'Depression', value: -0.30, rate: 0.015, vacancy: 2.0, next: { stagnation: 0.4, growth: 0.6 }, len: [1, 2] }
  };
  /* Guaranteed historical crashes: year -> phase */
  D.scriptedCycles = { 1866: 'recession', 1873: 'depression', 1890: 'recession', 1907: 'recession', 1920: 'recession', 1929: 'depression', 1931: 'depression', 1945: 'stagnation', 1955: 'boom', 1973: 'recession', 1974: 'depression', 1987: 'recession', 1990: 'recession', 2000: 'recession', 2008: 'depression', 2009: 'recession', 2020: 'recession', 2021: 'boom' };

  /* ---------- Condition bands (bible §3.2) ---------- */
  D.conditionBands = [
    { id: 'derelict', name: 'Derelict', min: 0,  valueFactor: 0.55, rentFactor: 0.0 },
    { id: 'poor',     name: 'Poor',     min: 20, valueFactor: 0.75, rentFactor: 0.7 },
    { id: 'fair',     name: 'Fair',     min: 40, valueFactor: 0.90, rentFactor: 0.9 },
    { id: 'good',     name: 'Good',     min: 65, valueFactor: 1.00, rentFactor: 1.0 },
    { id: 'prime',    name: 'Prime',    min: 85, valueFactor: 1.12, rentFactor: 1.1 }
  ];
  D.conditionBand = function (c) {
    var b = D.conditionBands[0];
    for (var i = 0; i < D.conditionBands.length; i++) if (c >= D.conditionBands[i].min) b = D.conditionBands[i];
    return b;
  };

  /* ---------- Property types, era-gated, mapped to 3D keys ---------- */
  // sqm range, typeFactor multiplies district £/sqm, yieldMult multiplies city gross yield.
  // eras: index of first era the type appears in (0 = Victorian). weight: listing frequency.
  D.propertyTypes = {
    terrace:   { id: 'terrace',   name: 'Terrace House',    model3d: 'TH', sqm: [55, 110],    factor: 0.90, yieldMult: 1.00, fromEra: 0, toEra: 5, weight: 2.0, decay: 1.0, canRent: true },
    townhouse: { id: 'townhouse', name: 'Townhouse',        model3d: 'TH', sqm: [140, 300],   factor: 1.15, yieldMult: 0.85, fromEra: 0, toEra: 5, weight: 1.2, decay: 0.9, canRent: true },
    lodging:   { id: 'lodging',   name: 'Lodging House',    model3d: 'ST', sqm: [35, 90],     factor: 0.85, yieldMult: 1.30, fromEra: 0, toEra: 2, weight: 2.2, decay: 1.3, canRent: true },
    tenement:  { id: 'tenement',  name: 'Tenement Block',   model3d: 'AP', sqm: [250, 600],   factor: 0.55, yieldMult: 1.35, fromEra: 0, toEra: 2, weight: 1.0, decay: 1.3, canRent: true },
    warehouse: { id: 'warehouse', name: 'Warehouse',        model3d: 'WR', sqm: [300, 1200],  factor: 0.35, yieldMult: 1.20, fromEra: 0, toEra: 5, weight: 0.9, decay: 0.8, canRent: true },
    shop:      { id: 'shop',      name: 'Shop',             model3d: 'CM', sqm: [60, 200],    factor: 1.05, yieldMult: 1.15, fromEra: 0, toEra: 5, weight: 1.1, decay: 1.0, canRent: true },
    mansion:   { id: 'mansion',   name: 'Mansion',          model3d: 'MN', sqm: [400, 900],   factor: 1.30, yieldMult: 0.55, fromEra: 0, toEra: 5, weight: 0.5, decay: 1.1, canRent: true },
    land:      { id: 'land',      name: 'Building Plot',    model3d: 'CT', sqm: [300, 1500],  factor: 0.25, yieldMult: 0.00, fromEra: 0, toEra: 5, weight: 0.5, decay: 0.0, canRent: false },
    apartment: { id: 'apartment', name: 'Apartment Block',  model3d: 'AP', sqm: [300, 900],   factor: 0.80, yieldMult: 1.05, fromEra: 1, toEra: 5, weight: 1.6, decay: 1.0, canRent: true },
    villa:     { id: 'villa',     name: 'Villa',            model3d: 'VI', sqm: [200, 500],   factor: 1.30, yieldMult: 0.70, fromEra: 1, toEra: 5, weight: 0.7, decay: 0.9, canRent: true },
    office:    { id: 'office',    name: 'Office Building',  model3d: 'CM', sqm: [400, 1500],  factor: 0.90, yieldMult: 1.10, fromEra: 1, toEra: 5, weight: 1.0, decay: 0.9, canRent: true },
    house:     { id: 'house',     name: 'Suburban House',   model3d: 'HO', sqm: [90, 220],    factor: 0.95, yieldMult: 0.90, fromEra: 3, toEra: 5, weight: 1.5, decay: 0.9, canRent: true },
    studio:    { id: 'studio',    name: 'Studio Flat',      model3d: 'ST', sqm: [25, 50],     factor: 1.10, yieldMult: 1.25, fromEra: 3, toEra: 5, weight: 1.8, decay: 1.1, canRent: true },
    penthouse: { id: 'penthouse', name: 'Penthouse',        model3d: 'PH', sqm: [150, 400],   factor: 1.90, yieldMult: 0.60, fromEra: 3, toEra: 5, weight: 0.5, decay: 0.8, canRent: true },
    tower:     { id: 'tower',     name: 'Tower',            model3d: 'SK', sqm: [2000, 8000], factor: 1.10, yieldMult: 1.00, fromEra: 4, toEra: 5, weight: 0.4, decay: 0.7, canRent: true }
  };
  D.typesForEra = function (eraIdx) {
    var out = [];
    for (var k in D.propertyTypes) { var t = D.propertyTypes[k]; if (eraIdx >= t.fromEra && eraIdx <= t.toEra) out.push(t); }
    return out;
  };
  /* What a rebuild turns a plot / old building into, by era. */
  D.rebuildTarget = function (type, eraIdx) {
    if (type === 'land') return eraIdx >= 4 ? 'office' : (eraIdx >= 1 ? 'apartment' : 'terrace');
    if (type === 'lodging' && eraIdx >= 3) return 'studio';
    if (type === 'tenement' && eraIdx >= 1) return 'apartment';
    return type;
  };

  /* ---------- Tenant classes (one per property, derived) ---------- */
  D.tenantClasses = {
    labourers:  { name: 'Labourers',     care: 0.6, stability: 0.7 },
    clerks:     { name: 'Clerks',        care: 0.8, stability: 0.85 },
    merchants:  { name: 'Merchants',     care: 0.85, stability: 0.9 },
    gentry:     { name: 'Gentry',        care: 0.95, stability: 0.9 },
    corporate:  { name: 'Corporate',     care: 0.9, stability: 0.95 },
    luxury:     { name: 'Luxury',        care: 0.95, stability: 0.85 }
  };

  /* ---------- Cities (8 traits kept from the v7 twelve) ---------- */
  D.cityTraits = {
    rent_control:  { name: 'Rent Control',      desc: 'Rent rises capped at 2%/yr; occupancy +5%.' },
    redevelopment: { name: 'Redevelopment Zone', desc: 'Derelict/Poor stock appreciates faster; renovation −20% cost.' },
    elite_enclave: { name: 'Elite Enclave',     desc: 'Mansions, villas and penthouses earn +25% rent; other types −20%.' },
    tax_haven:     { name: 'Tax Haven',         desc: 'No property tax; purchase prices +12%.' },
    tech_hub:      { name: 'Tech Hub',          desc: 'Studios, apartments and offices yield +15% from the Modern era.' },
    heritage_city: { name: 'Heritage City',     desc: 'Condition never drops below 30; refurbish takes +1 year.' },
    boom_bust:     { name: 'Boom & Bust',       desc: 'Cycle swings ×2. Speculators\' paradise.' },
    foreign_buyer: { name: 'Foreign Buyer Tax', desc: '+6% purchase surcharge; appreciation +1%/yr.' }
  };

  function city(id, name, country, pp, yld, tax, growth, trait, tier, from, districts) {
    return { id: id, name: name, country: country, basePpsqm: pp, grossYield: yld, taxRate: tax, growth: growth, trait: trait, tier: tier, availableFrom: from, districts: districts };
  }
  function dd(names, mults, trends) {
    var out = [];
    for (var i = 0; i < names.length; i++) out.push({ name: names[i], mult: mults[i], trend: trends[i] });
    return out;
  }
  // trend: starting momentum bias (-1 declining, 0 stable, 1 up-and-coming, 2 hot)
  D.cities = [
    city('london', 'London', 'United Kingdom', 14, 0.070, 0.007, 0.028, 'heritage_city', 0, 1850,
      dd(['Mayfair', 'Chelsea', 'Kensington', 'Notting Hill', 'Canary Wharf', 'Shoreditch', 'Camden', 'Hampstead'], [2.4, 1.6, 1.8, 0.9, 0.5, 0.6, 0.8, 1.5], [0, 1, 0, 1, -1, 0, 0, 0])),
    city('paris', 'Paris', 'France', 11, 0.065, 0.008, 0.025, 'heritage_city', 1, 1850,
      dd(['Le Marais', 'Saint-Germain', 'Montmartre', 'Champs-Élysées', 'Bastille', 'Belleville', 'Pigalle', 'Trocadéro'], [1.5, 2.0, 0.7, 2.4, 0.8, 0.5, 0.6, 1.9], [0, 0, 1, 0, 0, 1, -1, 0])),
    city('new_york', 'New York', 'United States', 11, 0.080, 0.010, 0.032, 'rent_control', 1, 1850,
      dd(['Manhattan', 'Brooklyn', 'SoHo', 'Tribeca', 'Upper East Side', 'Chelsea', 'Williamsburg', 'Harlem'], [2.0, 0.7, 0.9, 0.8, 2.2, 1.2, 0.5, 0.6], [1, 1, 0, 1, 0, 0, 1, -1])),
    city('amsterdam', 'Amsterdam', 'Netherlands', 8, 0.070, 0.008, 0.024, 'rent_control', 1, 1850,
      dd(['Jordaan', 'De Pijp', 'Oud-West', 'Centrum', 'Vondelpark', 'Plantage', 'Oud-Zuid', 'Westerpark'], [1.2, 0.8, 0.9, 1.8, 1.5, 1.1, 1.6, 0.6], [1, 1, 0, 0, 0, 0, 0, 1])),
    city('berlin', 'Berlin', 'Germany', 6, 0.085, 0.007, 0.026, 'redevelopment', 2, 1850,
      dd(['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg', 'Friedrichshain', 'Schöneberg', 'Neukölln', 'Tiergarten'], [1.6, 0.7, 0.8, 1.5, 0.6, 1.0, 0.5, 1.7], [0, 1, 1, 0, 1, 0, 1, 0])),
    city('rome', 'Rome', 'Italy', 6, 0.080, 0.009, 0.020, 'heritage_city', 2, 1850,
      dd(['Trastevere', 'Prati', 'Monti', 'Testaccio', 'Parioli', 'San Lorenzo', 'Centro Storico', 'EUR'], [1.0, 1.3, 1.1, 0.7, 1.8, 0.6, 2.0, 0.5], [1, 0, 0, 1, 0, 0, 0, 1])),
    city('barcelona', 'Barcelona', 'Spain', 5, 0.085, 0.008, 0.026, 'boom_bust', 2, 1850,
      dd(['Eixample', 'Gràcia', 'Barceloneta', 'El Born', 'Sarrià', 'Poble Sec', 'Sant Antoni', 'Poblenou'], [1.4, 1.0, 0.7, 1.1, 1.8, 0.6, 0.8, 0.5], [1, 0, 1, 0, 0, 0, 1, 1])),
    city('monaco', 'Monaco', 'Monaco', 9, 0.045, 0.003, 0.030, 'tax_haven', 3, 1870,
      dd(['Monte Carlo', 'La Condamine', 'Larvotto', 'Fontvieille', 'Monaco-Ville', 'Moneghetti', 'Les Révoires', 'La Rousse'], [2.6, 1.5, 2.0, 0.9, 1.8, 1.2, 1.1, 1.3], [1, 0, 1, 1, 0, 0, 0, 0])),
    city('sydney', 'Sydney', 'Australia', 4, 0.080, 0.007, 0.034, 'foreign_buyer', 2, 1860,
      dd(['Bondi', 'Surry Hills', 'Darling Point', 'Manly', 'Paddington', 'Mosman', 'Circular Quay', 'Newtown'], [1.3, 0.8, 2.0, 0.9, 1.1, 1.6, 1.8, 0.6], [1, 1, 0, 0, 0, 0, 0, 1])),
    city('hong_kong', 'Hong Kong', 'China', 4, 0.100, 0.006, 0.040, 'boom_bust', 2, 1870,
      dd(['Central', 'The Peak', 'Causeway Bay', 'Tsim Sha Tsui', 'Wan Chai', 'Repulse Bay', 'Mid-Levels', 'Sai Ying Pun'], [2.2, 2.6, 1.3, 1.0, 1.1, 2.0, 1.7, 0.7], [1, 0, 1, 1, 0, 0, 0, 1])),
    city('mumbai', 'Mumbai', 'India', 2, 0.100, 0.007, 0.040, 'redevelopment', 3, 1870,
      dd(['South Mumbai', 'Bandra', 'Juhu', 'Worli', 'Powai', 'Andheri', 'Lower Parel', 'Malabar Hill'], [1.8, 0.9, 1.1, 1.0, 0.5, 0.6, 0.7, 2.4], [0, 1, 0, 1, 1, 0, 1, 0])),
    city('toronto', 'Toronto', 'Canada', 4, 0.085, 0.006, 0.030, 'foreign_buyer', 3, 1880,
      dd(['Yorkville', 'King West', 'The Annex', 'Liberty Village', 'Distillery', 'Leslieville', 'Rosedale', 'Cabbagetown'], [1.8, 1.0, 1.2, 0.6, 0.5, 0.6, 2.0, 0.8], [0, 1, 0, 1, 1, 1, 0, 0])),
    city('shanghai', 'Shanghai', 'China', 3, 0.085, 0.006, 0.038, 'boom_bust', 3, 1880,
      dd(['The Bund', 'Pudong', 'French Concession', "Jing'an", 'Xuhui', 'Hongkou', 'Luwan', 'Changning'], [2.0, 0.4, 1.6, 1.3, 1.0, 0.6, 1.1, 0.7], [0, 2, 0, 1, 0, -1, 0, 1])),
    city('cape_town', 'Cape Town', 'South Africa', 2, 0.110, 0.005, 0.034, 'redevelopment', 3, 1880,
      dd(['Camps Bay', 'Clifton', 'Sea Point', 'Waterfront', 'Gardens', 'Green Point', 'Constantia', 'Hout Bay'], [1.8, 2.2, 1.1, 1.0, 0.9, 1.0, 1.5, 0.8], [1, 0, 0, 1, 0, 1, 0, 0])),
    city('tokyo', 'Tokyo', 'Japan', 4, 0.080, 0.006, 0.030, 'tech_hub', 2, 1890,
      dd(['Shibuya', 'Shinjuku', 'Ginza', 'Roppongi', 'Minato', 'Aoyama', 'Akasaka', 'Meguro'], [1.4, 1.3, 2.2, 1.5, 1.8, 1.7, 1.6, 1.0], [1, 1, 0, 1, 0, 0, 0, 1])),
    city('singapore', 'Singapore', 'Singapore', 3, 0.070, 0.007, 0.036, 'foreign_buyer', 3, 1900,
      dd(['Orchard', 'Marina Bay', 'Sentosa', 'Bugis', 'Holland Village', 'Tanjong Pagar', 'River Valley', 'Bukit Timah'], [2.0, 1.2, 1.5, 0.8, 1.1, 0.9, 1.4, 1.8], [0, 2, 1, 0, 0, 1, 0, 0])),
    city('los_angeles', 'Los Angeles', 'United States', 3, 0.080, 0.007, 0.032, 'tech_hub', 2, 1900,
      dd(['Beverly Hills', 'Hollywood', 'Santa Monica', 'Malibu', 'Venice', 'Bel Air', 'Silver Lake', 'Downtown'], [2.4, 1.2, 1.5, 1.8, 0.8, 2.6, 0.7, 0.9], [0, 1, 0, 1, 1, 0, 1, -1])),
    city('sao_paulo', 'São Paulo', 'Brazil', 2, 0.110, 0.006, 0.036, 'tech_hub', 3, 1900,
      dd(['Jardins', 'Vila Madalena', 'Itaim Bibi', 'Pinheiros', 'Moema', 'Brooklin', 'Higienópolis', 'Vila Olímpia'], [1.9, 0.8, 1.4, 1.0, 1.2, 0.7, 1.5, 0.9], [0, 1, 1, 0, 0, 1, 0, 1])),
    city('miami', 'Miami', 'United States', 2, 0.090, 0.006, 0.035, 'boom_bust', 3, 1920,
      dd(['South Beach', 'Brickell', 'Wynwood', 'Coconut Grove', 'Coral Gables', 'Downtown', 'Key Biscayne', 'Edgewater'], [1.8, 1.2, 0.5, 1.3, 1.5, 0.9, 2.0, 0.8], [1, 1, 1, 0, 0, -1, 0, 1])),
    city('dubai', 'Dubai', 'UAE', 3, 0.095, 0.000, 0.045, 'tax_haven', 3, 1970,
      dd(['Downtown', 'Marina', 'Palm Jumeirah', 'JBR', 'Business Bay', 'DIFC', 'Arabian Ranches', 'Creek Harbour'], [1.8, 1.4, 2.4, 1.2, 1.0, 2.0, 0.8, 0.6], [2, 1, 1, 1, 1, 1, 0, 2]))
  ];
  D.cityById = {};
  for (var ci = 0; ci < D.cities.length; ci++) D.cityById[D.cities[ci].id] = D.cities[ci];

  /* ---------- Families (bible §11) ---------- */
  D.families = [
    { id: 'silva', name: 'The Silva Family', difficulty: 'Hard', color: '#7B6D4E', motto: 'From nothing, we build everything.',
      startCash: 900, trait: 'builder', reputation: 40, perk: 'free_derelict', estateTaxAdj: 0,
      desc: 'Poorest start, but a free derelict terrace and a Builder\'s hands. Win by renovation.' },
    { id: 'chen', name: 'The Chen Family', difficulty: 'Normal', color: '#2C6E49', motto: 'Patience and persistence pay dividends.',
      startCash: 2000, trait: null, reputation: 50, perk: 'merchant_network', estateTaxAdj: 0,
      desc: 'Merchant network: see the true value of one listing every year for free.' },
    { id: 'armstrong', name: 'The Armstrongs', difficulty: 'Easy', color: '#3D5A80', motto: 'Fortune favours the bold.',
      startCash: 1200, trait: 'charmer', reputation: 62, perk: 'aristocrat', estateTaxAdj: 0,
      desc: 'Aristocrats: start with two properties and the debt that came with them. Deleverage or drown.' },
    { id: 'vanderbilt', name: 'The Vanderbilts', difficulty: 'Sandbox', color: '#D4A84B', motto: 'We don\'t play the market — we are the market.',
      startCash: 12000, trait: 'banker', reputation: 55, perk: 'old_money', estateTaxAdj: 0.20,
      desc: 'Rich, but every generation pays an extra 20% estate tax. Spend it before the taxman does.' }
  ];
  D.familyById = function (id) { for (var i = 0; i < D.families.length; i++) if (D.families[i].id === id) return D.families[i]; return null; };

  /* ---------- Dynasty traits (bible §7) ---------- */
  D.traits = {
    negotiator:  { name: 'Negotiator',  desc: 'Sellers accept 5% lower offers.', positive: true },
    surveyor:    { name: 'Surveyor',    desc: 'Comparable-sale noise halved.', positive: true },
    builder:     { name: 'Builder',     desc: 'Renovations cost 15% less.', positive: true },
    banker:      { name: 'Banker',      desc: 'Rates −0.5%, max LTV +5%.', positive: true },
    charmer:     { name: 'Charmer',     desc: 'Reputation grows faster; rivals friendlier.', positive: true },
    gambler:     { name: 'Gambler',     desc: 'Auction nerve; random windfalls and losses.', positive: true },
    spendthrift: { name: 'Spendthrift', desc: 'Loses 2% of cash every year.', positive: false }
  };
  D.traitIds = ['negotiator', 'surveyor', 'builder', 'banker', 'charmer', 'gambler', 'spendthrift'];
  D.firstNames = { m: ['Edward', 'Henry', 'Arthur', 'Thomas', 'Charles', 'George', 'William', 'Frederick', 'Albert', 'Walter', 'James', 'Robert', 'Daniel', 'Oliver', 'Samuel', 'Leo', 'Max', 'Kai', 'Ravi', 'Marco'],
                   f: ['Eleanor', 'Charlotte', 'Victoria', 'Margaret', 'Alice', 'Beatrice', 'Florence', 'Edith', 'Clara', 'Harriet', 'Emma', 'Sophia', 'Isabel', 'Grace', 'Lily', 'Mia', 'Nora', 'Priya', 'Sofia', 'Ada'] };

  /* ---------- Rival archetypes (bible §5) ---------- */
  // wealthMult: starting wealth relative to the player's family starting cash.
  // noise: appraisal noise sd. leverage: target LTV. floor: buys when ask/appraisal <= floor.
  D.rivals = [
    { id: 'rothschild', name: 'The Rothschilds', archetype: 'Banker',     color: '#1B4D33', wealthMult: 3.0, noise: 0.05, leverage: 0.30, floor: 1.00, bidMult: 0.98, aggression: 0.5, prefers: 'bluechip', sells: 'rarely',  renovates: true,  lends: true },
    { id: 'wong',       name: 'The Wong Dynasty', archetype: 'Trader',    color: '#C41E3A', wealthMult: 1.5, noise: 0.08, leverage: 0.60, floor: 0.92, bidMult: 1.06, aggression: 0.9, prefers: 'any',      sells: 'boom',    renovates: true,  lends: false },
    { id: 'al_rashid',  name: 'The Al-Rashids',   archetype: 'Hoarder',   color: '#DAA520', wealthMult: 4.0, noise: 0.12, leverage: 0.20, floor: 1.10, bidMult: 1.12, aggression: 0.6, prefers: 'prestige', sells: 'never',   renovates: true,  lends: false },
    { id: 'petrov',     name: 'The Petrovs',      archetype: 'Speculator', color: '#4169E1', wealthMult: 1.2, noise: 0.15, leverage: 0.70, floor: 1.00, bidMult: 1.03, aggression: 0.95, prefers: 'momentum', sells: 'stress',  renovates: false, lends: false },
    { id: 'martinez',   name: 'The Bourbon-Martinez', archetype: 'Slumlord', color: '#E07A5F', wealthMult: 1.0, noise: 0.10, leverage: 0.50, floor: 0.95, bidMult: 0.90, aggression: 0.6, prefers: 'cheap',    sells: 'rarely',  renovates: false, lends: false },
    { id: 'okonkwo',    name: 'The Okonkwos',     archetype: 'Builder',    color: '#2A9D8F', wealthMult: 0.8, noise: 0.08, leverage: 0.55, floor: 1.00, bidMult: 1.02, aggression: 0.7, prefers: 'derelict', sells: 'rebuilt', renovates: true,  lends: false }
  ];
  D.rivalById = function (id) { for (var i = 0; i < D.rivals.length; i++) if (D.rivals[i].id === id) return D.rivals[i]; return null; };

  /* ---------- Managers (bible §6.1) ---------- */
  D.managers = [
    { id: 'mgr_blake',   name: 'Thomas Blake',    quality: 0.60, fee: 0.06, minReputation: 0,  desc: 'Cheap and cheerful. Handles the basics.' },
    { id: 'mgr_sharma',  name: 'Priya Sharma',    quality: 0.65, fee: 0.05, minReputation: 0,  desc: 'Low cost. Fills vacancies fast.' },
    { id: 'mgr_rodriguez', name: 'Elena Rodriguez', quality: 0.70, fee: 0.07, minReputation: 40, desc: 'Handy. Slows decay.' },
    { id: 'mgr_okafor',  name: 'Aisha Okafor',    quality: 0.70, fee: 0.08, minReputation: 45, desc: 'Negotiator. Better tenants.' },
    { id: 'mgr_chen',    name: 'Sarah Chen',      quality: 0.75, fee: 0.08, minReputation: 50, desc: 'Dependable. Good tenant relations.' },
    { id: 'mgr_mueller', name: 'Hans Mueller',    quality: 0.80, fee: 0.09, minReputation: 60, desc: 'Meticulous. Keeps buildings in shape.' },
    { id: 'mgr_webb',    name: 'Marcus Webb',     quality: 0.85, fee: 0.10, minReputation: 70, desc: 'Veteran. Excellent results.' },
    { id: 'mgr_obrien',  name: "James O'Brien",   quality: 0.90, fee: 0.12, minReputation: 80, desc: 'Top tier. Attracts the best tenants.' }
  ];
  D.managerById = function (id) { for (var i = 0; i < D.managers.length; i++) if (D.managers[i].id === id) return D.managers[i]; return null; };

  /* ---------- Names ---------- */
  D.adjectives = ['Charming', 'Handsome', 'Elegant', 'Sunny', 'Spacious', 'Snug', 'Prime', 'Renovated', 'Classic', 'Stately', 'Bright', 'Imposing', 'Central', 'Quiet', 'Historic', 'Modern', 'Grand', 'Exclusive', 'Scenic', 'Respectable', 'Tired', 'Faded'];
  D.streetWords = ['Street', 'Row', 'Lane', 'Square', 'Place', 'Terrace', 'Gardens', 'Court', 'Yard', 'Road', 'Crescent', 'Mews'];
  D.streetNames = ['King', 'Queen', 'Victoria', 'Albert', 'Church', 'Mill', 'Bridge', 'Station', 'Market', 'Park', 'High', 'Castle', 'Oak', 'Elm', 'Rose', 'Chapel', 'Water', 'Garden', 'Wood', 'Harbour', 'Union', 'Liberty', 'Orchard', 'Coal'];
  D.nameTemplates = {
    terrace:   ['{n} {street}', '{adj} Terrace, {district}', 'No. {n} {street}'],
    townhouse: ['{n} {street}', '{adj} Townhouse, {district}', '{district} House'],
    lodging:   ['{adj} Lodgings, {district}', '{street} Lodging House', 'Rooms at {n} {street}'],
    tenement:  ['{street} Buildings', '{district} Tenements', '{adj} Dwellings, {district}'],
    warehouse: ['{street} Warehouse', '{district} Bonded Store', '{adj} Goods Depot'],
    shop:      ['{n} {street} Shop', '{district} Emporium', '{adj} Shopfront, {street}'],
    mansion:   ['{district} Hall', '{adj} Mansion, {district}', '{street} House'],
    land:      ['Plot at {street}', '{district} Building Land', '{adj} Site, {district}'],
    apartment: ['{street} Mansions', '{district} Court', '{adj} Apartments, {district}'],
    villa:     ['Villa {street}', '{adj} Villa, {district}', '{district} Lodge'],
    office:    ['{street} Chambers', '{district} Exchange', '{adj} Offices, {district}'],
    house:     ['{n} {street}', '{adj} House, {district}', '{district} Family Home'],
    studio:    ['Studio {n}, {street}', '{adj} Studio, {district}', '{district} Loft'],
    penthouse: ['{district} Penthouse', 'The {adj} Penthouse', 'Sky Residence, {district}'],
    tower:     ['{district} Tower', 'The {street} Tower', '{adj} Tower, {district}']
  };

  /* ---------- Seller types (bible §3.3) ---------- */
  D.sellers = {
    estate:     { name: 'Estate sale',     m: [0.70, 0.95], floor: 0.88, weight: 0.22, cue: 'Heirs want a quick sale' },
    distressed: { name: 'Repossession',    m: [0.65, 0.90], floor: 0.85, weight: 0.14, cue: 'Bank repossession' },
    developer:  { name: 'Developer',       m: [1.00, 1.25], floor: 0.97, weight: 0.14, cue: 'New build, finished to a high standard' },
    landlord:   { name: 'Private landlord', m: [0.90, 1.15], floor: 0.92, weight: 0.32, cue: 'Tenanted, rent history available' },
    rival:      { name: 'Rival family',    m: [0.95, 1.30], floor: 0.95, weight: 0.08, cue: 'A rival wants out of this district' },
    auction:    { name: 'Auction',         m: [0.60, 0.60], floor: 0.60, weight: 0.10, cue: 'Open bidding; rivals will attend' }
  };

  /* ---------- Renovation tiers (bible §3.4) ---------- */
  D.renovation = {
    patch:     { name: 'Patch',     cost: 0.04, years: 0, gain: 15, uplift: 0.05, risk: 0,    riskKind: null,    riskCost: 0 },
    refurbish: { name: 'Refurbish', cost: 0.10, years: 1, gain: 35, uplift: 0.18, risk: 0.10, riskKind: 'overrun', riskCost: 0.5 },
    rebuild:   { name: 'Rebuild',   cost: 0.25, years: 2, gain: 100, uplift: 0.45, risk: 0.20, riskKind: 'delay',  riskCost: 0 }
  };

  /* ---------- Balance constants ---------- */
  D.balance = {
    // listings
    listingsBase: 4,                 // + tier
    listingAffordLow: 0.22,          // listing trueValue range as a fraction of buying power
    listingAffordHigh: 1.10,
    stretchDealMult: [2.0, 3.2],
    buyingPowerDivisor: 0.36,        // cash / this = what the player can plausibly buy (deposit + duty)
    listingMaxYears: 3,
    listingPriceDropPerYear: 0.04,
    listingSoldElsewhereBase: 0.25,  // chance a good deal disappears each year
    compsNoise: 0.10,
    estimateBand: 0.12,
    offersPerListingPerYear: 2,
    counterWindow: 0.20,             // offers more than this below floor are rejected outright
    lowballRepHit: 1,
    rivalContestChance: 0.45,        // × aggression when a rival sees a bargain
    auctionRounds: 3,
    auctionRivalStep: 1.05,
    // transaction costs
    agentFee: 0.03,
    cgtYears: 3,
    quickSaleFactor: 0.85,
    cycleSaleMood: { boom: 1.08, growth: 1.02, stagnation: 0.97, recession: 0.90, depression: 0.78 },
    // rents and costs
    baseOccupancy: 0.95,
    vacancyPerRentStep: 0.6,          // occupancy loss per +1.0 of rentSetting above 1
    maintenanceMin: 0.010,
    maintenanceMax: 0.020,
    managerFeeDefault: 0.08,
    personalCapacity: 5,
    managerCapacity: 10,
    unmanagedVacancy: 0.08,
    unmanagedDecay: 2,
    unmanagedFineChance: 0.20,
    unmanagedFine: 0.01,
    decayMin: 3,
    decayMax: 6,
    decayAgeYears: 40,                // buildings older than this decay +1
    unrentableBelow: 20,
    highVacancyBelow: 40,
    // finance
    maxLtv: 0.70,
    bankerLtvBonus: 0.05,
    repLtvThreshold: 70,
    amortYears: 25,
    amortDiscount: 0.005,
    fixedPremium: 0.01,
    lenderPremiumMin: 0.01,
    lenderPremiumMax: 0.02,
    refinanceEveryYears: 3,
    refinanceLtv: 0.70,
    covenantLtv: 0.85,
    forcedSaleFactor: 0.85,
    savingsRateBelowBase: 0.02,
    bankruptcyNegativeCashYears: 2,
    bankruptcyMissedCalls: 2,
    // taxes
    wealthTaxThresholdMult: 60,       // × family start cash × priceIndex
    estateTrustFactor: 0.5,
    trustCostPct: 0.02,
    // market dynamics
    districtNoise: 0.03,
    momentumMeanReversion: 0.15,
    momentumNoise: 0.008,
    pressurePerBuy: 0.015,
    saturationShare: 0.30,
    saturationPricePenalty: 0.10,
    saturationYieldPenalty: 0.15,
    districtStock: [30, 90],
    // rivals
    rivalMaxProperties: 30,
    rivalMaxBuysPerYear: 2,
    rivalOfferChance: 0.25,
    rivalOfferPremium: [1.10, 1.40],
    rubberBandLead: 3.0,
    rubberBandTrail: 0.30,
    rivalExpansionChance: 0.20,
    // dynasty
    birthChance: 0.22,
    maxChildren: 4,
    mortalityBase: 0.002,
    mortalityGrowth: 1.09,
    adultAge: 18,
    educationCostPct: 0.03,
    reputationInherit: 0.7,
    spendthriftDrain: 0.02,
    // events
    randomEventChance: 0.55,
    maxEventsPerYear: 2,
    // cities
    expansionBase: 2600,              // 1850 £; × priceIndex × tier multiplier
    expansionTierMult: [1.0, 1.0, 2.2, 4.5, 8.0],
    expansionCountMult: 0.35,         // +35% per already-unlocked city
    expansionRepBase: 44,
    expansionRepStep: 4,
    // comeback
    comebackCashPct: 0.10,
    comebackReputation: 40
  };

  /* ---------- Historical scripted events (bible §2, §6.4) ---------- */
  // choices: label, effect descriptor handled by events.js. EVs are deliberately non-dominant.
  D.historicalEvents = [
    { year: 1851, title: 'The Great Exhibition', text: 'Crystal Palace draws the world to London. Landlords talk of a golden decade.',
      choices: [{ label: 'Host visiting merchants (rent +10% this year, decay +3)', fx: { rentBoost: 0.10, decay: 3 } }, { label: 'Buy a plot near the park (pay 12% of cash for land)', fx: { giftLand: 0.12 } }, { label: 'Ignore the fuss', fx: {} }] },
    { year: 1866, title: 'Overend, Gurney & Co. fails', text: 'The great discount house collapses. Credit vanishes overnight; the bank rate hits 10%.', cycle: 'recession',
      choices: [{ label: 'Repay 20% of every mortgage now (safety)', fx: { repayPct: 0.20 } }, { label: 'Lend to panicked rivals at 12% (gamble: 60% +15% cash, 40% −20%)', fx: { gamble: { p: 0.6, win: 0.15, lose: 0.20 } } }, { label: 'Sit tight', fx: {} }] },
    { year: 1873, title: 'The Long Depression begins', text: 'Vienna, then Berlin, then New York. Twenty years of falling prices start today.', cycle: 'depression',
      choices: [{ label: 'Sell your weakest property now at 92% of value', fx: { sellWeakest: 0.92 } }, { label: 'Borrow against your best asset to buy the dip (cash-out refinance to 70%)', fx: { refiBest: true } }, { label: 'Hoard cash and cut rents 10% to keep tenants', fx: { rentAll: 0.9, reputation: 3 } }] },
    { year: 1888, title: 'The Jack the Ripper panic', text: 'The East End empties of respectable tenants. Slum rents collapse; charities buy lodging houses.',
      choices: [{ label: 'Donate 3% of cash to the Whitechapel mission (+8 reputation)', fx: { donatePct: 0.03, reputation: 8 } }, { label: 'Buy a cheap lodging house from a fleeing landlord (pay 15% of cash, get a Poor lodging house)', fx: { giftProperty: { type: 'lodging', condition: 30, pct: 0.15 } } }, { label: 'Stay out of it', fx: {} }] },
    { year: 1890, title: 'The Baring crisis', text: 'Barings is bankrupt on Argentine bonds. The Bank of England organises a rescue. Rates spike.', cycle: 'recession',
      choices: [{ label: 'Refinance everything onto 25-year amortising loans (+0 rate change, lower payments later)', fx: { convertAmort: true } }, { label: 'Buy Argentine bonds cheap (gamble: 50% +25% cash, 50% −25%)', fx: { gamble: { p: 0.5, win: 0.25, lose: 0.25 } } }, { label: 'Do nothing', fx: {} }] },
    { year: 1900, title: 'A new century', text: 'Electric trams and steel frames. Apartment blocks and villas appear on the deal board. Paris hosts the Exposition.',
      choices: [{ label: 'Commission a surveyor (pay 2% of cash; comps noise halved for 10 years)', fx: { surveyorYears: 10, donatePct: 0.02 } }, { label: 'Throw a society ball (pay 4% of cash, +6 reputation)', fx: { donatePct: 0.04, reputation: 6 } }, { label: 'Save the money', fx: {} }] },
    { year: 1907, title: 'The Knickerbocker panic', text: 'New York banks fail; J.P. Morgan locks the bankers in his library until they agree a rescue.', cycle: 'recession',
      choices: [{ label: 'Join the rescue syndicate (pay 5% of cash, +10 reputation, lenders +)', fx: { donatePct: 0.05, reputation: 10 } }, { label: 'Buy repossessed stock (next year\'s board gets 2 extra distressed listings)', fx: { extraDistressed: 2 } }, { label: 'Keep clear of the Americans', fx: {} }] },
    { year: 1914, title: 'The Great War', text: 'Europe marches. Tenants enlist, rents are frozen by decree and building stops for four years.',
      choices: [{ label: 'Lease your buildings to the War Office (rent −20% for 4 years, no vacancy, +5 reputation)', fx: { warLease: 4, reputation: 5 } }, { label: 'Keep private tenants (vacancy ×2 for 4 years)', fx: { vacancyYears: 4 } }, { label: 'Sell your weakest building to the Ministry at 105%', fx: { sellWeakest: 1.05 } }] },
    { year: 1920, title: 'Post-war slump', text: 'Demobilised men, Spanish flu, a short sharp recession.', cycle: 'recession',
      choices: [{ label: 'Cut rents 10% across the board (+4 reputation, tenants stay)', fx: { rentAll: 0.9, reputation: 4 } }, { label: 'Hold rents and evict defaulters (−6 reputation, cash +5%)', fx: { reputation: -6, cashPct: 0.05 } }] },
    { year: 1929, title: 'Black Tuesday', text: 'Wall Street crashes. Bankers whisper that property will follow. It will.', cycle: 'depression',
      choices: [{ label: 'Sell your two weakest properties now at 90%', fx: { sellWeakest: 0.90, count: 2 } }, { label: 'Repay 30% of all mortgages', fx: { repayPct: 0.30 } }, { label: 'Hold everything and buy the panic', fx: { extraDistressed: 3 } }] },
    { year: 1939, title: 'War again', text: 'Blackouts, bombs, requisitions. Building land in bombed districts will be cheap in 1946.',
      choices: [{ label: 'Insure against bombing (pay 3% of cash now; no event damage this era)', fx: { donatePct: 0.03, bombInsured: true } }, { label: 'Take the risk (random property may lose 40 condition)', fx: { bombRisk: true } }] },
    { year: 1946, title: 'Reconstruction', text: 'Governments pour money into rebuilding. Planning permission is easy, labour is cheap.',
      choices: [{ label: 'Rebuild grants: all renovations −30% for 5 years', fx: { renoDiscountYears: 5 } }, { label: 'Buy bombed plots (3 extra land listings next year at 60%)', fx: { extraLand: 3 } }] },
    { year: 1955, title: 'The suburbs', text: 'Cars, motorways, mortgages for everyone. Suburban houses appear on the board; fixed-rate loans are offered.', cycle: 'boom',
      choices: [{ label: 'Fix every variable mortgage (+1% rate, immune to the 1970s spike)', fx: { fixAll: true } }, { label: 'Stay variable and enjoy the boom', fx: {} }] },
    { year: 1973, title: 'Oil shock', text: 'OPEC quadruples the oil price. Inflation and rates explode; the secondary banks go under.', cycle: 'recession',
      choices: [{ label: 'Sell your most leveraged property at 95%', fx: { sellMostLeveraged: 0.95 } }, { label: 'Raise all rents to 115% (cash now, vacancy later)', fx: { rentAll: 1.15 } }, { label: 'Do nothing', fx: {} }] },
    { year: 1989, title: 'The Wall falls', text: 'Berlin reunites. Eastern districts are derelict, cheap and about to become the hippest addresses in Europe.',
      choices: [{ label: 'Buy a derelict Berlin block (pay 20% of cash; Berlin unlocked free)', fx: { unlockCity: 'berlin', giftProperty: { type: 'apartment', condition: 15, pct: 0.20, city: 'berlin' } } }, { label: 'Invest in Berlin momentum (Berlin districts trend up 5 years)', fx: { cityMomentum: { city: 'berlin', years: 5 } } }, { label: 'Watch from afar', fx: {} }] },
    { year: 2000, title: 'Dot-com bust', text: 'Tech stocks crater. Office tenants vanish in tech hubs; residential holds.', cycle: 'recession',
      choices: [{ label: 'Convert an office to flats (pay 10% of its value, +20 condition)', fx: { convertOffice: true } }, { label: 'Buy distressed offices (2 extra distressed listings next year)', fx: { extraDistressed: 2 } }, { label: 'Hold', fx: {} }] },
    { year: 2008, title: 'The Global Financial Crisis', text: 'Lehman fails. Lenders call covenants on everyone. Cash is king for two years, then it is free.', cycle: 'depression',
      choices: [{ label: 'Repay 25% of all mortgages now', fx: { repayPct: 0.25 } }, { label: 'Sell your two weakest properties at 88%', fx: { sellWeakest: 0.88, count: 2 } }, { label: 'Hold; buy the crash (4 extra distressed listings next year)', fx: { extraDistressed: 4 } }] },
    { year: 2020, title: 'Pandemic', text: 'Cities lock down. Offices and shops empty; homes with gardens boom.', cycle: 'recession',
      choices: [{ label: 'Waive 20% of commercial rent this year (+6 reputation)', fx: { commercialRent: 0.8, reputation: 6 } }, { label: 'Evict commercial defaulters (−8 reputation, rent held)', fx: { reputation: -8 } }, { label: 'Sell a shop or office at 95%', fx: { sellCommercial: 0.95 } }] }
  ];

  /* ---------- Random events with choices (bible §2, §6.6) ---------- */
  // weight: relative frequency. minProps: only when portfolio is large enough. The resolver in events.js applies fx.
  D.randomEvents = [
    { id: 'long_lease', weight: 3, minProps: 1, title: 'A tenant proposes a long lease', text: '{prop}\'s tenant offers a 6-year lease at a fixed rent, 5% above today\'s.',
      choices: [{ label: 'Accept: fixed rent 6 years, never vacant, no rent rises', fx: { lease: { years: 6, setting: 1.05 } } }, { label: 'Decline: keep flexible', fx: {} }] },
    { id: 'lawsuit', weight: 2, minProps: 2, title: 'A tenant sues', text: 'A tenant at {prop} is injured on a rotten stair and sues for damages.',
      choices: [{ label: 'Settle: pay 3% of net worth', fx: { cashPctNW: -0.03 } }, { label: 'Fight it (55%: pay nothing; 45%: pay 8% and −5 reputation)', fx: { gambleNW: { p: 0.55, win: 0, lose: 0.08, loseRep: 5 } } }] },
    { id: 'fire', weight: 2, minProps: 1, title: 'Fire!', text: 'A kitchen fire guts part of {prop}.',
      choices: [{ label: 'Repair at once (pay 6% of its value, condition unchanged)', fx: { propCostPct: 0.06 } }, { label: 'Leave it (condition −30)', fx: { propCondition: -30 } }] },
    { id: 'charity', weight: 2, minProps: 0, title: 'The hospital appeal', text: 'The governors of the city hospital ask the family for a subscription.',
      choices: [{ label: 'Give 2% of net worth (+7 reputation)', fx: { cashPctNW: -0.02, reputation: 7 } }, { label: 'Give nothing (−2 reputation)', fx: { reputation: -2 } }] },
    { id: 'compulsory', weight: 1, minProps: 2, title: 'Compulsory purchase', text: 'The council wants {prop} for a new road and offers 110% of value.',
      choices: [{ label: 'Accept 110% (no agent fee)', fx: { sellProp: 1.10 } }, { label: 'Refuse (−3 reputation; 50%: forced sale at 95%)', fx: { reputation: -3, forcedSaleChance: { p: 0.5, factor: 0.95 } } }] },
    { id: 'insider', weight: 3, minProps: 0, title: 'A word from the agent', text: 'An agent offers, for a fee, to tell you exactly what the best listing on the board is worth.',
      choices: [{ label: 'Pay 1% of cash for the true value', fx: { cashPct: -0.01, revealBest: true } }, { label: 'Trust your own eye', fx: {} }] },
    { id: 'heir_debts', weight: 1, minProps: 1, minMembers: 2, title: 'Gambling debts', text: '{member} has lost heavily at cards. The creditors are not gentle people.',
      choices: [{ label: 'Pay the debts (4% of net worth)', fx: { cashPctNW: -0.04 } }, { label: 'Refuse (−8 reputation; {member} gains Spendthrift)', fx: { reputation: -8, memberTrait: 'spendthrift' } }] },
    { id: 'rent_strike', weight: 2, minProps: 3, title: 'Rent strike', text: 'Tenants across your {city} buildings refuse to pay until rents are cut.',
      choices: [{ label: 'Cut rents to 90% in {city} (+4 reputation)', fx: { cityRent: 0.9, reputation: 4 } }, { label: 'Evict the ringleaders (−7 reputation; occupancy −20% this year)', fx: { reputation: -7, cityVacancy: 0.2 } }] },
    { id: 'partner', weight: 2, minProps: 1, title: 'A joint venture', text: '{rival} invites you into a development syndicate.',
      choices: [{ label: 'Invest 10% of cash (65%: +30% back next year; 35%: lose it; relation +)', fx: { gamble: { p: 0.65, win: 0.03, lose: 0.10 }, rivalRelation: 10 } }, { label: 'Decline politely', fx: { rivalRelation: -3 } }] },
    { id: 'inheritance', weight: 1, minProps: 0, title: 'A cousin dies', text: 'A distant cousin leaves you a mortgaged {type}. The bank wants its interest.',
      choices: [{ label: 'Accept the property and its 80% mortgage', fx: { inheritProperty: { ltv: 0.8 } } }, { label: 'Renounce it', fx: {} }] },
    { id: 'manager_fraud', weight: 1, minProps: 6, title: 'The manager\'s books', text: 'Your manager in {city} has been skimming rents.',
      choices: [{ label: 'Prosecute (lose 2% of cash, +3 reputation, manager fired)', fx: { cashPct: -0.02, reputation: 3, fireManager: true } }, { label: 'Quietly dismiss him (lose 5% of cash, manager fired)', fx: { cashPct: -0.05, fireManager: true } }] },
    { id: 'windfall_tenant', weight: 2, minProps: 2, title: 'A famous tenant', text: 'A celebrated author wants {prop} and will pay 30% over the rent — but wants it Prime.',
      choices: [{ label: 'Refurbish for them (pay refurbish cost; rent setting 1.2 locked 4 years)', fx: { refurbForTenant: true } }, { label: 'Decline', fx: {} }] }
  ];

  /* ---------- Achievements (none satisfied at start for any family) ---------- */
  D.achievements = [
    { id: 'first_deal', name: 'First Deal', desc: 'Buy a property below asking price.' },
    { id: 'auction_winner', name: 'Hammer Down', desc: 'Win an auction against a rival.' },
    { id: 'flipper', name: 'Flipper', desc: 'Sell a property for 30% more than you paid.' },
    { id: 'brrrr', name: 'Recycler', desc: 'Refinance a renovated property and recover your deposit.' },
    { id: 'portfolio_5', name: 'Landlord', desc: 'Own 5 properties.' },
    { id: 'portfolio_15', name: 'Magnate', desc: 'Own 15 properties.' },
    { id: 'portfolio_40', name: 'Empire', desc: 'Own 40 properties.' },
    { id: 'second_city', name: 'Abroad', desc: 'Unlock a second city.' },
    { id: 'five_cities', name: 'Jet Set', desc: 'Unlock five cities.' },
    { id: 'all_cities', name: 'The World', desc: 'Unlock every city.' },
    { id: 'survivor', name: 'Survivor', desc: 'Come through a depression without a forced sale while holding debt.' },
    { id: 'generation_2', name: 'Heir', desc: 'Pass the empire to a second generation.' },
    { id: 'generation_4', name: 'Dynasty', desc: 'Reach the fourth generation.' },
    { id: 'rank_1', name: 'Top of the Pile', desc: 'Lead the leaderboard.' },
    { id: 'rebuilder', name: 'Rebuilder', desc: 'Complete a Rebuild.' },
    { id: 'tower', name: 'Skyline', desc: 'Own a tower.' },
    { id: 'wealth_100x', name: 'Hundredfold', desc: 'Net worth 100× your starting cash.' },
    { id: 'reputation_90', name: 'Pillar of Society', desc: 'Reputation 90.' },
    { id: 'comeback', name: 'Phoenix', desc: 'Rebuild net worth to the pre-bankruptcy peak after continuing as the heir.' }
  ];

  /* ---------- Campaign tiers (bible §8) ---------- */
  D.campaignTiers = [
    { id: 'foundation', name: 'Foundation', desc: 'Own 3 properties and grow net worth to 1.5× your start.', props: 3, nwMult: 1.5 },
    { id: 'landlord', name: 'Landlord', desc: 'Own 6 properties in 2 cities.', props: 6, cities: 2 },
    { id: 'dynast', name: 'Dynast', desc: 'Reach the second generation with net worth 10× your start.', generation: 2, nwMult: 10 },
    { id: 'magnate', name: 'Magnate', desc: 'Five cities and a top-3 rank.', cities: 5, rank: 3 },
    { id: 'empire', name: 'Empire', desc: '25 properties and net worth 100× your start.', props: 25, nwMult: 100 },
    { id: 'legend', name: 'Legend', desc: 'Rank #1, ten cities, fourth generation.', rank: 1, cities: 10, generation: 4 }
  ];

  /* ---------- Era goals (checked at era end) ---------- */
  D.eraGoals = {
    victorian: { desc: 'Own 3 buildings in one London district before 1900.', kind: 'district_count', count: 3, city: 'london' },
    gilded:    { desc: 'Own property in 3 cities before 1930.', kind: 'cities', count: 3 },
    crisis:    { desc: 'End 1949 with no forced sales this era and cash ≥ 10% of net worth.', kind: 'survive', cashPct: 0.10 },
    boom:      { desc: 'Own 15 properties before 1980.', kind: 'props', count: 15 },
    modern:    { desc: 'Own a tower before 2008.', kind: 'type', type: 'tower' },
    digital:   { desc: 'Top the leaderboard before 2030.', kind: 'rank', rank: 1 }
  };

  PE.Data = D;
})(typeof window !== 'undefined' ? window : global);
