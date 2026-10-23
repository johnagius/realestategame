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
    { id: 'victorian', name: 'Victorian', from: 1850, to: 1899, baseRate: 0.035, rateSpread: 0.005, drift: 0.000, stampDuty: 0.02, cgt: 0.00, estateTax: 0.20, wealthTax: 0.000, maxLtv: 0.70, fixedRate: false, lifeMult: 1.35, propTaxMult: 1.0, insurance: 0.000 },
    { id: 'gilded',    name: 'Gilded Age', from: 1900, to: 1929, baseRate: 0.045, rateSpread: 0.005, drift: 0.010, stampDuty: 0.03, cgt: 0.00, estateTax: 0.25, wealthTax: 0.002, maxLtv: 0.70, fixedRate: false, lifeMult: 1.2, propTaxMult: 1.1, insurance: 0.000 },
    { id: 'crisis',    name: 'Crisis & War', from: 1930, to: 1949, baseRate: 0.045, rateSpread: 0.025, drift: -0.005, stampDuty: 0.03, cgt: 0.10, estateTax: 0.40, wealthTax: 0.005, maxLtv: 0.60, fixedRate: false, lifeMult: 1.1, propTaxMult: 1.3, insurance: 0.001 },
    { id: 'boom',      name: 'Boom', from: 1950, to: 1979, baseRate: 0.065, rateSpread: 0.015, drift: 0.025, stampDuty: 0.04, cgt: 0.25, estateTax: 0.40, wealthTax: 0.010, maxLtv: 0.70, fixedRate: true, lifeMult: 0.9, propTaxMult: 1.6, insurance: 0.0025 },
    { id: 'modern',    name: 'Modern', from: 1980, to: 2007, baseRate: 0.070, rateSpread: 0.030, drift: 0.015, stampDuty: 0.05, cgt: 0.20, estateTax: 0.35, wealthTax: 0.006, maxLtv: 0.70, fixedRate: true, lifeMult: 0.75, propTaxMult: 1.5, insurance: 0.0025 },
    { id: 'digital',   name: 'Digital', from: 2008, to: 2030, baseRate: 0.030, rateSpread: 0.020, drift: 0.010, stampDuty: 0.06, cgt: 0.20, estateTax: 0.30, wealthTax: 0.004, maxLtv: 0.70, fixedRate: true, lifeMult: 0.65, propTaxMult: 1.5, insurance: 0.0025 }
  ];
  D.eraFor = function (year) {
    for (var i = 0; i < D.eras.length; i++) if (year <= D.eras[i].to) return D.eras[i];
    return D.eras[D.eras.length - 1];
  };
  D.eraIndex = function (eraId) { for (var i = 0; i < D.eras.length; i++) if (D.eras[i].id === eraId) return i; return 0; };

  /* ---------- Market cycle phases (bible §6.4) ---------- */
  // tourismMult: rent multiplier in tourism cities by cycle (P4.4) — visitors pay in booms, vanish in busts.
  D.cycles = {
    boom:       { name: 'Boom',       value: 0.08,  rate: 0.010, vacancy: 0.8, tourismMult: 1.10, next: { stagnation: 0.5, recession: 0.35, growth: 0.15 }, len: [2, 3] },
    growth:     { name: 'Growth',     value: 0.03,  rate: 0.000, vacancy: 1.0, tourismMult: 1.05, next: { boom: 0.25, growth: 0.45, stagnation: 0.3 }, len: [2, 5] },
    stagnation: { name: 'Stagnation', value: 0.00,  rate: -0.005, vacancy: 1.2, tourismMult: 1.00, next: { growth: 0.5, recession: 0.35, boom: 0.15 }, len: [1, 3] },
    recession:  { name: 'Recession',  value: -0.10, rate: -0.010, vacancy: 1.5, tourismMult: 0.92, next: { stagnation: 0.43, growth: 0.45, depression: 0.12 }, len: [1, 2] },
    depression: { name: 'Depression', value: -0.35, rate: 0.015, vacancy: 2.0, tourismMult: 0.85, next: { stagnation: 0.5, growth: 0.5 }, len: [1, 1] }
  };
  /* Guaranteed historical crashes: year -> phase */
  D.scriptedCycles = { 1866: 'recession', 1873: 'depression', 1890: 'recession', 1907: 'recession', 1920: 'recession', 1929: 'depression', 1931: 'recession', 1945: 'stagnation', 1955: 'boom', 1973: 'recession', 1974: 'depression', 1987: 'recession', 1990: 'recession', 1992: 'recession', 2000: 'recession', 2008: 'depression', 2009: 'recession', 2020: 'recession', 2021: 'boom' };

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
  // ENG-B6: the named tenant in the building (sticky, with a memory for rent rises)
  D.tenantNames = ['Ada Vance', 'Elias Trout', 'Beatrice Holloway', 'Otto Weiss', 'Margaret Pruitt', 'Silas Cobb', 'Harriet Nokes', 'Edwin Bramble', 'Florence Teal', 'Albert Griggs', 'Rosa Lindt', 'Samuel Okafor', 'Nellie Barlow', 'Victor Hale', 'Iris Fenwick', 'Walter Dodd', 'Clara Mews', 'George Pargeter', 'Emmeline Frost', 'Jonah Reed'];

  /* ---------- Cities (8 traits kept from the v7 twelve; P4.4: tourism joins, elite enclave is cut/dormant) ---------- */
  D.cityTraits = {
    rent_control:  { name: 'Rent Control',      desc: 'Rent rises capped at 2%/yr; occupancy +5%.' },
    redevelopment: { name: 'Redevelopment Zone', desc: 'Derelict/Poor stock appreciates faster; renovation −20% cost.' },
    elite_enclave: { name: 'Elite Enclave',     desc: 'Dormant (P4.4 cut): no city carries it; the old ±rent modifier is removed.' },
    tax_haven:     { name: 'Tax Haven',         desc: 'No property tax; purchase prices +12%.' },
    tech_hub:      { name: 'Tech Hub',          desc: 'Studios, apartments and offices yield +15% from the Modern era; district prices drift +0.5%/yr Modern+.' },
    heritage_city: { name: 'Heritage City',     desc: 'Condition never drops below 30; refurbish takes +1 year.' },
    boom_bust:     { name: 'Boom & Bust',       desc: 'Cycle swings ×2. Speculators\' paradise.' },
    tourism:       { name: 'Tourism',           desc: 'Visitor rents ride the cycle: +10% in a boom, −15% in a depression.' },
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
    city('london', 'London', 'United Kingdom', 14, 0.070, 0.007, 0.022, 'heritage_city', 0, 1850,
      dd(['Mayfair', 'Chelsea', 'Kensington', 'Notting Hill', 'Canary Wharf', 'Shoreditch', 'Camden', 'Hampstead'], [2.4, 1.6, 1.8, 0.9, 0.5, 0.6, 0.8, 1.5], [0, 1, 0, 1, -1, 0, 0, 0])),
    city('paris', 'Paris', 'France', 11, 0.065, 0.008, 0.019, 'heritage_city', 1, 1850,
      dd(['Le Marais', 'Saint-Germain', 'Montmartre', 'Champs-Élysées', 'Bastille', 'Belleville', 'Pigalle', 'Trocadéro'], [1.5, 2.0, 0.7, 2.4, 0.8, 0.5, 0.6, 1.9], [0, 0, 1, 0, 0, 1, -1, 0])),
    city('new_york', 'New York', 'United States', 11, 0.080, 0.010, 0.026, 'rent_control', 1, 1850,
      dd(['Manhattan', 'Brooklyn', 'SoHo', 'Tribeca', 'Upper East Side', 'Chelsea', 'Williamsburg', 'Harlem'], [2.0, 0.7, 0.9, 0.8, 2.2, 1.2, 0.5, 0.6], [1, 1, 0, 1, 0, 0, 1, -1])),
    city('amsterdam', 'Amsterdam', 'Netherlands', 8, 0.070, 0.008, 0.018, 'rent_control', 1, 1850,
      dd(['Jordaan', 'De Pijp', 'Oud-West', 'Centrum', 'Vondelpark', 'Plantage', 'Oud-Zuid', 'Westerpark'], [1.2, 0.8, 0.9, 1.8, 1.5, 1.1, 1.6, 0.6], [1, 1, 0, 0, 0, 0, 0, 1])),
    city('berlin', 'Berlin', 'Germany', 6, 0.085, 0.007, 0.020, 'redevelopment', 2, 1850,
      dd(['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg', 'Friedrichshain', 'Schöneberg', 'Neukölln', 'Tiergarten'], [1.6, 0.7, 0.8, 1.5, 0.6, 1.0, 0.5, 1.7], [0, 1, 1, 0, 1, 0, 1, 0])),
    city('rome', 'Rome', 'Italy', 6, 0.080, 0.009, 0.014, 'heritage_city', 2, 1850,
      dd(['Trastevere', 'Prati', 'Monti', 'Testaccio', 'Parioli', 'San Lorenzo', 'Centro Storico', 'EUR'], [1.0, 1.3, 1.1, 0.7, 1.8, 0.6, 2.0, 0.5], [1, 0, 0, 1, 0, 0, 0, 1])),
    city('barcelona', 'Barcelona', 'Spain', 5, 0.085, 0.008, 0.020, 'boom_bust', 2, 1850,
      dd(['Eixample', 'Gràcia', 'Barceloneta', 'El Born', 'Sarrià', 'Poble Sec', 'Sant Antoni', 'Poblenou'], [1.4, 1.0, 0.7, 1.1, 1.8, 0.6, 0.8, 0.5], [1, 0, 1, 0, 0, 0, 1, 1])),
    city('monaco', 'Monaco', 'Monaco', 9, 0.045, 0.003, 0.024, 'tax_haven', 3, 1870,
      dd(['Monte Carlo', 'La Condamine', 'Larvotto', 'Fontvieille', 'Monaco-Ville', 'Moneghetti', 'Les Révoires', 'La Rousse'], [2.6, 1.5, 2.0, 0.9, 1.8, 1.2, 1.1, 1.3], [1, 0, 1, 1, 0, 0, 0, 0])),
    city('sydney', 'Sydney', 'Australia', 4, 0.080, 0.007, 0.028, 'foreign_buyer', 2, 1860,
      dd(['Bondi', 'Surry Hills', 'Darling Point', 'Manly', 'Paddington', 'Mosman', 'Circular Quay', 'Newtown'], [1.3, 0.8, 2.0, 0.9, 1.1, 1.6, 1.8, 0.6], [1, 1, 0, 0, 0, 0, 0, 1])),
    city('hong_kong', 'Hong Kong', 'China', 4, 0.100, 0.006, 0.034, 'boom_bust', 2, 1870,
      dd(['Central', 'The Peak', 'Causeway Bay', 'Tsim Sha Tsui', 'Wan Chai', 'Repulse Bay', 'Mid-Levels', 'Sai Ying Pun'], [2.2, 2.6, 1.3, 1.0, 1.1, 2.0, 1.7, 0.7], [1, 0, 1, 1, 0, 0, 0, 1])),
    city('mumbai', 'Mumbai', 'India', 2, 0.100, 0.007, 0.034, 'redevelopment', 3, 1870,
      dd(['South Mumbai', 'Bandra', 'Juhu', 'Worli', 'Powai', 'Andheri', 'Lower Parel', 'Malabar Hill'], [1.8, 0.9, 1.1, 1.0, 0.5, 0.6, 0.7, 2.4], [0, 1, 0, 1, 1, 0, 1, 0])),
    city('toronto', 'Toronto', 'Canada', 4, 0.085, 0.006, 0.024, 'foreign_buyer', 3, 1880,
      dd(['Yorkville', 'King West', 'The Annex', 'Liberty Village', 'Distillery', 'Leslieville', 'Rosedale', 'Cabbagetown'], [1.8, 1.0, 1.2, 0.6, 0.5, 0.6, 2.0, 0.8], [0, 1, 0, 1, 1, 1, 0, 0])),
    city('shanghai', 'Shanghai', 'China', 3, 0.085, 0.006, 0.032, 'boom_bust', 3, 1880,
      dd(['The Bund', 'Pudong', 'French Concession', "Jing'an", 'Xuhui', 'Hongkou', 'Luwan', 'Changning'], [2.0, 0.4, 1.6, 1.3, 1.0, 0.6, 1.1, 0.7], [0, 2, 0, 1, 0, -1, 0, 1])),
    city('cape_town', 'Cape Town', 'South Africa', 2, 0.110, 0.005, 0.028, 'redevelopment', 3, 1880,
      dd(['Camps Bay', 'Clifton', 'Sea Point', 'Waterfront', 'Gardens', 'Green Point', 'Constantia', 'Hout Bay'], [1.8, 2.2, 1.1, 1.0, 0.9, 1.0, 1.5, 0.8], [1, 0, 0, 1, 0, 1, 0, 0])),
    city('tokyo', 'Tokyo', 'Japan', 4, 0.080, 0.006, 0.024, 'tech_hub', 2, 1890,
      dd(['Shibuya', 'Shinjuku', 'Ginza', 'Roppongi', 'Minato', 'Aoyama', 'Akasaka', 'Meguro'], [1.4, 1.3, 2.2, 1.5, 1.8, 1.7, 1.6, 1.0], [1, 1, 0, 1, 0, 0, 0, 1])),
    city('singapore', 'Singapore', 'Singapore', 3, 0.070, 0.007, 0.030, 'foreign_buyer', 3, 1900,
      dd(['Orchard', 'Marina Bay', 'Sentosa', 'Bugis', 'Holland Village', 'Tanjong Pagar', 'River Valley', 'Bukit Timah'], [2.0, 1.2, 1.5, 0.8, 1.1, 0.9, 1.4, 1.8], [0, 2, 1, 0, 0, 1, 0, 0])),
    city('los_angeles', 'Los Angeles', 'United States', 3, 0.080, 0.007, 0.026, 'tech_hub', 2, 1900,
      dd(['Beverly Hills', 'Hollywood', 'Santa Monica', 'Malibu', 'Venice', 'Bel Air', 'Silver Lake', 'Downtown'], [2.4, 1.2, 1.5, 1.8, 0.8, 2.6, 0.7, 0.9], [0, 1, 0, 1, 1, 0, 1, -1])),
    city('sao_paulo', 'São Paulo', 'Brazil', 2, 0.110, 0.006, 0.030, 'tech_hub', 3, 1900,
      dd(['Jardins', 'Vila Madalena', 'Itaim Bibi', 'Pinheiros', 'Moema', 'Brooklin', 'Higienópolis', 'Vila Olímpia'], [1.9, 0.8, 1.4, 1.0, 1.2, 0.7, 1.5, 0.9], [0, 1, 1, 0, 0, 1, 0, 1])),
    city('miami', 'Miami', 'United States', 2, 0.090, 0.006, 0.029, 'tourism', 3, 1920,
      dd(['South Beach', 'Brickell', 'Wynwood', 'Coconut Grove', 'Coral Gables', 'Downtown', 'Key Biscayne', 'Edgewater'], [1.8, 1.2, 0.5, 1.3, 1.5, 0.9, 2.0, 0.8], [1, 1, 1, 0, 0, -1, 0, 1])),
    city('dubai', 'Dubai', 'UAE', 3, 0.095, 0.000, 0.039, 'tax_haven', 3, 1970,
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
    { id: 'rothschild', name: 'The Rothschilds', archetype: 'Banker',     color: '#1B4D33', wealthMult: 3.0, noise: 0.05, leverage: 0.30, floor: 1.00, bidMult: 0.93, aggression: 0.5, prefers: 'bluechip', sells: 'rarely',  renovates: true,  lends: true },
    { id: 'wong',       name: 'The Wong Dynasty', archetype: 'Trader',    color: '#C41E3A', wealthMult: 1.5, noise: 0.08, leverage: 0.60, floor: 0.92, bidMult: 0.99, aggression: 0.9, prefers: 'any',      sells: 'boom',    renovates: true,  lends: false },
    { id: 'al_rashid',  name: 'The Al-Rashids',   archetype: 'Hoarder',   color: '#DAA520', wealthMult: 4.0, noise: 0.12, leverage: 0.20, floor: 1.10, bidMult: 1.06, aggression: 0.6, prefers: 'prestige', sells: 'never',   renovates: true,  lends: false },
    { id: 'petrov',     name: 'The Petrovs',      archetype: 'Speculator', color: '#4169E1', wealthMult: 1.2, noise: 0.15, leverage: 0.70, floor: 1.00, bidMult: 0.98, aggression: 0.95, prefers: 'momentum', sells: 'stress',  renovates: false, lends: false },
    { id: 'martinez',   name: 'The Bourbon-Martinez', archetype: 'Slumlord', color: '#E07A5F', wealthMult: 1.0, noise: 0.10, leverage: 0.50, floor: 0.95, bidMult: 0.86, aggression: 0.6, prefers: 'cheap',    sells: 'rarely',  renovates: false, lends: false },
    { id: 'okonkwo',    name: 'The Okonkwos',     archetype: 'Builder',    color: '#2A9D8F', wealthMult: 0.8, noise: 0.08, leverage: 0.55, floor: 1.00, bidMult: 0.96, aggression: 0.7, prefers: 'derelict', sells: 'rebuilt', renovates: true,  lends: false }
  ];
  /* Optional rivals unlocked by prestige perks (P5.2). Harder than any of the six. */
  D.extraRivals = [
    { id: 'hartwell', name: 'The Hartwells', archetype: 'Magnate', color: '#5B2A86', wealthMult: 5.0, noise: 0.04, leverage: 0.50, floor: 1.02, bidMult: 1.03, aggression: 0.9, prefers: 'any', sells: 'boom', renovates: true, lends: false, perk: 'seventh_rival' }
  ];
  D.rivalById = function (id) {
    for (var i = 0; i < D.rivals.length; i++) if (D.rivals[i].id === id) return D.rivals[i];
    for (var j = 0; j < D.extraRivals.length; j++) if (D.extraRivals[j].id === id) return D.extraRivals[j];
    return null;
  };

  /* ---------- Rival voice (P3.1): per-archetype taunts and reactions.
     Kinds: outbidYou (they raise against you), outbidAny (their bid in the log),
     win (they take the lot), lose (you beat them), ally / jab / greet / idle.
     byEra adds era-flavoured pools keyed by era id (victorian..digital); PE.Rivals.voicePool
     merges era lines ahead of the base pool when the current era has the kind. ---------- */
  D.taunts = {
    Banker: {
      outbidYou: ['A pleasure to do business. Do try to keep up.', 'Sentiment is expensive, friend.', 'The bank thanks you for the rehearsal.'],
      outbidAny: ['Rothschild.', 'A modest increment.', 'Money speaks quietly.', 'A trifle more. Do keep bidding.', 'The house raises without raising its voice.'],
      win: ['Sound assets find sound owners.', 'It will sit well in our column.', 'The ledger grows by one quiet line.'],
      lose: ['You overpaid. The market will remind you.', 'A fair price for an unfair market. Enjoy.'],
      ally: ['Dinner is at eight. Bring your books.', 'Partners, then. The vault door opens both ways.'],
      jab: ['Leverage is a knife. You are holding the blade.', 'Interest accrues. So does regret.'],
      greet: ['Rothschild & Sons acknowledges you.', 'Rothschild & Sons is pleased to see solvent friends.'],
      idle: ['Counting coupons.', 'Reviewing covenants.', 'Lending only to friends.'],
      byEra: {
        victorian: { idle: ['The consol yield is a patient friend.', 'Our couriers ride before the news walks.'], jab: ['A man who counts bricks forgets to count interest.'], outbidYou: ['The house of Rothschild does not haggle.'], win: ['Entered in the ledger. Quietly.'], lose: ['Enjoy your purchase. The mortgage enjoys you.'] },
        gilded: { idle: ['Reading the tape before it is printed.', 'Credit is a garden. We water ours daily.'], jab: ['The ticker tells me your price before you know it.'], outbidYou: ['A wire to New York settles this.'], win: ['The committee will approve. The committee is us.'], lose: ['Overpaying is a tax on the impatient.'] },
        crisis: { idle: ['Gold sleeps in the vault. It does not dream of war.', 'Breadlines are long. Our line of credit is longer.'], jab: ['In a panic, amateurs sell. We are not amateurs.'], outbidYou: ['Even in the blackout, the ledger stays open.'], win: ['Distress sells cheaply to the calm.'], lose: ['Keep it. Rubble is a tenant that never pays.'] },
        boom: { idle: ['The motorway will go where we have already bought.', 'Rates rise and fall. We remain.'], jab: ['Your tower block is tall. Our patience is taller.'], outbidYou: ['Our credit outlives your concrete.'], win: ['A sound corner of a loud decade.'], lose: ['Concrete cracks. Covenants hold.'] },
        modern: { idle: ['The Big Bang made noise. We made arrangements.', 'Reviewing positions before the fax machine wakes.'], jab: ['Fax us when your cash-flow turns positive.'], outbidYou: ['Our Geneva colleagues find your bid nostalgic.'], win: ['Filed under inevitable.'], lose: ['Yours. The decade will test you.'] },
        digital: { idle: ['The algorithm works for us. It does not know it.', 'Quiet money outperforms loud money, quarterly.'], jab: ['You check portals. We read central banks.'], outbidYou: ['Our wire cleared while your app was loading.'], win: ['Acquired between two heartbeats of the market.'], lose: ['Take it. We have already shorted the street.'] }
      }
    },
    Trader: {
      outbidYou: ['Too slow, old sport.', 'I will flip it before you have found a pen.'],
      outbidAny: ['Wong Dynasty bids.', 'Cheap at twice the price.', 'Wong bids, Wong buys, Wong is gone.', 'Next! Keep the lots moving.'],
      win: ['Bought well is half sold.', 'Another one for the ledger.', 'Cha-ching — the abacus applauds.'],
      lose: ['Fine — it is your anchor to carry.', 'Your gain. I am already queued for the next lot.'],
      ally: ['Tips flow both ways between friends.', 'My network is your network, commission-free. For now.'],
      jab: ['You collect deeds the way others collect dust.'],
      greet: ['The Wong Dynasty smells a deal.', 'A friend with cash is a friend indeed.'],
      idle: ['Watching the tape.', 'Three deals before breakfast.'],
      byEra: {
        victorian: { idle: ['Buying at the docks, selling at the station.', 'A deed in each hand beats two in a drawer.'], jab: ['You walk to a deal. I am already back.'], outbidYou: ['Sold to me before you raised your finger.'], win: ['Bought at breakfast, sold by tea.'], lose: ['Take it — I flipped three while you bid.'] },
        gilded: { idle: ['The tape never sleeps, and neither do I.', 'Margins thin, hands quick.'], jab: ['By the time your telegram lands, I have resold it.'], outbidYou: ['The tape waits for no one, old sport.'], win: ['In and out before the ink dries.'], lose: ['Keep the anchor. I keep the current.'] },
        crisis: { idle: ['Breadlines are long; my queue of buyers is longer.', 'Even in the slump, a quick hand eats.'], jab: ['Fear sells cheap. I never buy it — I sell it.'], outbidYou: ['Quick hands eat while slow hands queue.'], win: ['War or no war, a deal is a deal.'], lose: ['Take it. I will buy it back cheaper by spring.'] },
        boom: { idle: ['New motorway, new margins.', 'Flipping semis faster than they print the brochures.'], jab: ['You buy to hold. I buy to be gone.'], outbidYou: ['Gazumped! Learn the word, then fear it.'], win: ['On the market by Friday, gone by Monday.'], lose: ['Enjoy the paperwork. I am three deals ahead.'] },
        modern: { idle: ['Fax the offer — I am already at the next one.', 'Yuppies want lofts; I want their deposits.'], jab: ['Your chain has six links. Mine is cash.'], outbidYou: ['My mobile weighs a brick and closes like one.'], win: ['Exchange today, complete yesterday.'], lose: ['Yours. I flipped its neighbour twice this morning.'] },
        digital: { idle: ['The portal pings, I pounce.', 'Viewing by video, offer by return.'], jab: ['You refresh listings. I am the listing.'], outbidYou: ['My bid beat yours by one refresh.'], win: ['Clicked, bought, relisted.'], lose: ['Take it. The algorithm owed me one anyway.'] }
      }
    },
    Hoarder: {
      outbidYou: ['It was never for sale to you.', 'What is bought is kept. Forever.'],
      outbidAny: ['Al-Rashid.', 'It belongs with us.', 'The Al-Rashids add to the keeping.', 'One more for the cedar boxes.'],
      win: ['It joins the collection.', 'Ours, as all fine things become.', 'Sealed. Kept. Ours.'],
      lose: ['A rare loss. It will sting, eventually.', 'Take care of it. You are merely its borrower.'],
      ally: ['Our houses are one house now.', 'Bound houses, bound fortunes. Permanently.'],
      jab: ['You buy houses. We keep homes.'],
      greet: ['The Al-Rashids remember courtesy.', 'The family remembers its friends by name and deed.'],
      idle: ['Walking the holdings.', 'Cataloguing the collection.'],
      byEra: {
        victorian: { idle: ['Polishing nameplates that will outlive the Queen.', 'Dust settles. So do we. Forever.'], jab: ['You will sell. Everything you have, eventually, sells.'], outbidYou: ['This house was promised to our grandchildren.'], win: ['Sealed into the family vault of streets.'], lose: ['Keep it warm for us. We will inherit it.'] },
        gilded: { idle: ['The collection grows by one sunrise a year.', 'Deeds in cedar boxes, older than your line.'], jab: ['Your fortune is a season. Ours is the calendar.'], outbidYou: ['You bid for a season. We bid for a century.'], win: ['Another street enters the eternal keeping of our name.'], lose: ['A century is long. We will wait for the resale.'] },
        crisis: { idle: ['Bombs take houses. They do not take deeds kept deep.', 'While others hoard sugar, we hoard streets.'], jab: ['You scramble for rations. We ration nothing; we keep.'], outbidYou: ['Ruins are only houses waiting for us.'], win: ['What survives the war belongs to the patient.'], lose: ['Hold it through the sirens. Consider it lent.'] },
        boom: { idle: ['They build towers; we keep the ground beneath them.', 'New towns rise around what we already own.'], jab: ['Concrete ages. Ownership does not.'], outbidYou: ['That plot was ours before your plans existed.'], win: ['Filed away for the next hundred years.'], lose: ['A delay, not a loss. We measure in decades.'] },
        modern: { idle: ['Gentrify around us; we were always here.', 'The vault likes what the market forgets.'], jab: ['Your portfolio churns. Ours accretes.'], outbidYou: ['We do not chase yield. We keep ground.'], win: ['The vault opens, the deed enters, the vault closes.'], lose: ['Yours for now. Forever is a long for-now.'] },
        digital: { idle: ['The cloud forgets. Our vault does not.', 'Servers crash. Deeds in cedar do not.'], jab: ['You trade at the speed of light and own nothing at dusk.'], outbidYou: ['Your app says sold. Our deed disagrees, and will for a century.'], win: ['Logged, sealed, kept.'], lose: ['Take it. We already own its future.'] }
      }
    },
    Speculator: {
      outbidYou: ['Ha! Again! Higher!', 'The wave is rising — ride or drown!'],
      outbidAny: ['Petrov bids!', 'To the moon!', 'Petrov raises! Petrov always raises!', 'Another lot! The boom is hungry!'],
      win: ['Fortune favours the loud!', 'Told you. Always bet on Petrov.', 'To the stars, one deed at a time!'],
      lose: ['Luck turns. Mine returns.', 'You win this hand. The deck, however, is mine.'],
      ally: ['Together we are a storm.', 'Two gamblers, one table, no ceiling!'],
      jab: ['Careful is just slow wearing a tie.'],
      greet: ['Petrov! Remember the name!', 'Ah, my favourite fellow genius!'],
      idle: ['Doubling down, somewhere.', 'Smelling a boom on the wind.'],
      byEra: {
        victorian: { idle: ['Railway shares, corner plots — everything is going up!', 'Credit! Glorious, generous credit!'], jab: ['Caution is bankruptcy spread over fifty years.'], outbidYou: ['Higher! This boom has no ceiling!'], win: ['Fortune favours the leveraged!'], lose: ['A setback! I shall buy twice as fast to recover!'] },
        gilded: { idle: ['The ticker is singing and I am dancing.', 'Margin is just courage with paperwork.'], jab: ['You save. I multiply. We are not the same.'], outbidYou: ['Bids are cheap when the future pays!'], win: ['Petrov rides the wave, and the wave is mine!'], lose: ['Keep it — the next one doubles!'] },
        crisis: { idle: ['They call it a depression. I call it a sale.', 'Buying rubble by the tonne — the rebuild will sing!'], jab: ['Fear is expensive. I never buy it.'], outbidYou: ['Cheap money, cheap houses, dear future!'], win: ['Bought at the bottom, wherever that turns out to be!'], lose: ['Ha! One less debt to charm the bank with.'] },
        boom: { idle: ['Motorways! Towers! Everything triples!', 'Leverage is a ladder and I am on the roof.'], jab: ['You bought one house. Adorable.'], outbidYou: ['The decade is on my side!'], win: ['Told you! Always bet on Petrov!'], lose: ['A loss? No — a rehearsal.'] },
        modern: { idle: ['Big Bang, big money, bigger Petrov.', 'Fax me a boom and I will ride it.'], jab: ['Yuppies dress the part. I am the part.'], outbidYou: ['One hundred percent mortgage, two hundred percent nerve!'], win: ['Champagne! Put it on the house I just bought!'], lose: ['Fine! Your funeral, my afterparty.'] },
        digital: { idle: ['The market never sleeps and neither does my phone.', 'Leverage, apps, speed — the wave got faster!'], jab: ['You diversify. I amplify.'], outbidYou: ['Outbid before your page finished loading!'], win: ['Screenshot this moment, friend!'], lose: ['Luck caches. Mine reloads.'] }
      }
    },
    Slumlord: {
      outbidYou: ['Nothing personal. It is all personal.', 'Every door has a price. You just paid mine.'],
      outbidAny: ['Martinez bids.', 'Cash, no questions.', 'Martinez takes the row.', 'Sold. The tenants will hear about it.'],
      win: ['Keys are keys.', 'It will pay for itself by Friday.', 'The ring of keys grows by one street.'],
      lose: ['Enjoy the repairs.', 'Take it. Every lock sticks a little.'],
      ally: ['Keys for the family, then.', 'Your tenants, my tenants — one big rent day.'],
      jab: ['You polish yours. Mine pay.'],
      greet: ['Martinez. You know the name.', 'A friendly face. Rarer than a paying tenant.'],
      idle: ['Collecting. Always collecting.', 'Rent is due. Always.'],
      byEra: {
        victorian: { idle: ['Rents due at dawn. My boots know every stair.', 'Forty doors on one street, and every lock knows me.'], jab: ['You have a parlour. I have forty keys.'], outbidYou: ['That row houses my people. Keep your gloves off.'], win: ['More keys for the ring.'], lose: ['Polish it. Tenants pay no extra for polish.'] },
        gilded: { idle: ['The motor car breaks down. My rents never do.', 'Keys do not crash. Markets do.'], jab: ['Your mansion holds one family. My row holds forty payers.'], outbidYou: ['Every door I buy closes behind me.'], win: ['The ring gets heavier. Good.'], lose: ['Enjoy the upkeep. Paint costs more than tenants.'] },
        crisis: { idle: ['Bombs clear bad tenants. I keep the good rooms.', 'Ration queues end at my rent book.'], jab: ['Your tenants fled. Mine cannot afford to.'], outbidYou: ['Rubble with a roofline still rents.'], win: ['Another door in the blackout that opens for me.'], lose: ['Take it. The roof leaks toward your side.'] },
        boom: { idle: ['Tower blocks rise; my ground floors stay paid.', 'Slums, they call them. Yield, I call them.'], jab: ['They demolish streets; I buy what falls cheap.'], outbidYou: ['That block owes me a living already.'], win: ['Cash on the stairs, every Friday.'], lose: ['Yours. The damp comes included, free of charge.'] },
        modern: { idle: ['Bedsits, basements, back rooms — all mine, all paying.', 'The yuppies renovate around my tenants. The tenants stay.'], jab: ['You sell dreams. I rent mattresses. Guess who sleeps better.'], outbidYou: ['I count rent, not wallpaper.'], win: ['Keys. Always keys.'], lose: ['Keep the view. I keep the rent book.'] },
        digital: { idle: ['They pay by app now. The money lands the same.', 'Every notification is a tenant owing.'], jab: ['Your smart street still pays my old rents.'], outbidYou: ['Bidding by phone, collecting in person.'], win: ['One more door in the portfolio. It already owes.'], lose: ['Fine. The boiler was about to go anyway.'] }
      }
    },
    Builder: {
      outbidYou: ['That plot had my mark on it already.', 'I know what that wall is hiding.'],
      outbidAny: ['Okonkwo builds.', 'Ground worth keeping.', 'Okonkwo stakes the site.', 'Ground like this deserves a drawing board.'],
      win: ['Good ground. I will make it great.', 'From ruin, we raise.', 'Surveyed, staked, ours.'],
      lose: ['Keep it standing straight, at least.', 'Build it right or sell it back to me.'],
      ally: ['Two houses, one scaffold.', 'Your capital, my cranes. A fair skyline.'],
      jab: ['Paper gains. I deal in brick.'],
      greet: ['Okonkwo builds. Remember it.', 'Well met. Mind the scaffold.'],
      idle: ['Drawing plans by lamplight.', 'Pouring foundations before dawn.'],
      byEra: {
        victorian: { idle: ['Bricks at dawn, plans by lamplight.', 'Good mortar outlasts bad luck.'], jab: ['You buy what others built. I build what others buy.'], outbidYou: ['That plot takes a foundation, not a ledger entry.'], win: ['Level ground, true walls.'], lose: ['Mind the damp course. Nobody ever does.'] },
        gilded: { idle: ['Steel frames now. The city grows upward.', 'Every crane is a promise I intend to keep.'], jab: ['Your deeds are paper. Mine are load-bearing.'], outbidYou: ['I priced that site by its footings, not its paint.'], win: ['Scaffold up by Monday.'], lose: ['Check the joists before you brag.'] },
        crisis: { idle: ['Bomb sites are foundations that have not met me yet.', 'Where they clear rubble, I set lines.'], jab: ['You count losses. I count bricks that survived.'], outbidYou: ['I see a ruin. I also see the rebuild.'], win: ['From the crater, a street.'], lose: ['Yours. Check it for blast damage twice.'] },
        boom: { idle: ['Motorways feed my mixer lorries.', 'The tower crane is my family crest now.'], jab: ['You buy flats. I pour them.'], outbidYou: ['That site is zoned for my mixer.'], win: ['Concrete by winter, tenants by spring.'], lose: ['Keep it. Call me when the subsidence starts.'] },
        modern: { idle: ['Docklands is a building site with a future.', 'Skip the permits queue; I bring the crane.'], jab: ['Yuppies flip lofts. I built the lofts.'], outbidYou: ['I know the cost of every brick in that wall.'], win: ['Hard hats on. We rise.'], lose: ['Yours. My surveyor sends condolences.'] },
        digital: { idle: ['Modular units, printed plans, the same honest brick.', 'The skyline updates; so do my drawings.'], jab: ['You trade pixels of houses. I pour the houses.'], outbidYou: ['My drone surveyed that plot last Tuesday.'], win: ['Site secured. Scaffold up.'], lose: ['Keep it plumb. I will check your work.'] }
      }
    },
    Magnate: {
      outbidYou: ['You were bidding against a weather system.', 'How quaint.'],
      outbidAny: ['Hartwell.', 'Acquired, shortly.', 'Hartwell concludes another acquisition.', 'Noted, priced, taken.'],
      win: ['Of course.', 'The map fills in.', 'The expected outcome, on schedule.'],
      lose: ['Amusing.', 'Yours. Frame the moment.'],
      ally: ['An empire accepts your map.', 'A merger of manners and maps.'],
      jab: ['Small houses, small dreams.'],
      greet: ['The Hartwells see you.', 'The Hartwells acknowledge your existence. Warmly, even.'],
      idle: ['Reviewing the map.', 'Markets are moods. We are climate.'],
      byEra: {
        victorian: { idle: ['Empires are built quietly, then all at once.', 'The map already knows our name.'], jab: ['A charming little street you have there.'], outbidYou: ['You brought a purse to a treasury fight.'], win: ['Naturally.'], lose: ['A rounding error, fondly remembered.'] },
        gilded: { idle: ['Trusts form like weather. We are the season.', 'New money arrives daily. It works for us now.'], jab: ['Your ambition is noted. Filed. Disregarded.'], outbidYou: ['The Hartwells do not bid. They conclude.'], win: ['As expected.'], lose: ['How novel, losing to a newcomer. Once.'] },
        crisis: { idle: ['Wars pass. Ownership persists.', 'Even shortages queue politely for the Hartwells.'], jab: ['Rationing is for households, not houses of this size.'], outbidYou: ['Your economy is a theatre we own.'], win: ['Inevitable, even in wartime.'], lose: ['Keep it through the sirens. We shall collect later.'] },
        boom: { idle: ['Motorways bend toward what we own.', 'New towns are old plans of ours, pouring concrete.'], jab: ['Your tower is tall. Our horizon is wider.'], outbidYou: ['A suburb to you, a region to us.'], win: ['As drawn up years ago.'], lose: ['Amusing. Do it again in twenty years.'] },
        modern: { idle: ['Big Bang? We were already the universe.', 'The yuppies work hard. For us, mostly.'], jab: ['Faxes and mobile phones — toys for the almost-rich.'], outbidYou: ['Your banker knows our banker. Awkward for you.'], win: ['Naturally so.'], lose: ['A memento of your brief relevance.'] },
        digital: { idle: ['The algorithm reports to us quarterly.', 'Every market dip is a shopping list.'], jab: ['You are one notification away from irrelevance.'], outbidYou: ['Our servers decided before you clicked.'], win: ['Logged by history, briefly.'], lose: ['Take it. The cloud remembers where it is.'] }
      }
    }
  };

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
    estate:     { name: 'Estate sale',     m: [0.70, 0.95], floor: 0.88, weight: 0.16, cue: 'Heirs want a quick sale' },
    distressed: { name: 'Repossession',    m: [0.65, 0.90], floor: 0.85, weight: 0.10, cue: 'Bank repossession' },
    developer:  { name: 'Developer',       m: [1.00, 1.25], floor: 0.97, weight: 0.18, cue: 'New build, finished to a high standard' },
    landlord:   { name: 'Private landlord', m: [0.90, 1.15], floor: 0.92, weight: 0.44, cue: 'Tenanted, rent history available' },
    rival:      { name: 'Rival family',    m: [0.95, 1.30], floor: 0.95, weight: 0.08, cue: 'A rival wants out of this district' },
    auction:    { name: 'Auction',         m: [0.60, 0.60], floor: 0.60, weight: 0.12, cue: 'Open bidding; rivals will attend' }
  };

  /* ---------- Renovation tiers (bible §3.4) ---------- */
  D.renovation = {
    patch:     { name: 'Patch',     cost: 0.04, years: 0, gain: 15, uplift: 0.05, risk: 0,    riskKind: null,    riskCost: 0 },
    refurbish: { name: 'Refurbish', cost: 0.10, years: 1, gain: 35, uplift: 0.18, risk: 0.10, riskKind: 'overrun', riskCost: 0.5 },
    rebuild:   { name: 'Rebuild',   cost: 0.25, years: 2, gain: 100, uplift: 0.45, risk: 0.20, riskKind: 'delay',  riskCost: 0 }
  };

  /* ---------- Build-to-suit (P4.3): commission a building on a plot you own ---------- */
  // classes map to existing property types; types are [type, fromEraIdx, ...] pairs, first match on eraIdx wins by scanning desc.
  D.buildClasses = {
    tenement:  { name: 'Tenement',  desc: 'Dense, cheap, high-yield housing', types: [['tenement', 0], ['apartment', 3]] },
    workhorse: { name: 'Workhorse', desc: 'The reliable family terrace',      types: [['terrace', 0], ['house', 3]] },
    prestige:  { name: 'Prestige',  desc: 'A fine address for fine tenants',  types: [['townhouse', 0], ['villa', 1]] }
  };
  D.buildClassIds = ['tenement', 'workhorse', 'prestige'];
  // costFrac × the as-if market value of the finished building; valueMult × era factor on the cost sets the expected true value.
  D.buildSpecs = {
    modest:   { name: 'Modest',   costFrac: 0.60, valueMult: 0.95, noise: 0.07, years: 1, condition: 62, delayRisk: 0.10, desc: 'Cheap and quick; the finished building sells at a discount' },
    standard: { name: 'Standard', costFrac: 0.80, valueMult: 1.10, noise: 0.09, years: 1, condition: 78, delayRisk: 0.15, desc: 'A solid build for the open market' },
    grand:    { name: 'Grand',    costFrac: 1.10, valueMult: 1.28, noise: 0.15, years: 2, condition: 92, delayRisk: 0.25, desc: 'Costly and slow; lucrative if the district holds' }
  };
  D.buildSpecIds = ['modest', 'standard', 'grand'];

  /* ---------- Balance constants ---------- */
  D.balance = {
    // listings
    listingsBase: 4,                 // + tier
    listingAffordLow: 0.14,          // listing trueValue range as a fraction of buying power
    listingAffordHigh: 1.45,
    listingCheapMult: 0.09,          // the cheapest listing on a fresh board (≈ cash / 4)
    stretchDealMult: [2.0, 3.2],
    buyingPowerDivisor: 0.36,        // cash / this = what the player can plausibly buy (deposit + duty)
    listingMaxYears: 3,
    listingPriceDropPerYear: 0.04,
    listingSoldElsewhereBase: 0.30,  // chance a good deal disappears each year
    compsNoise: 0.10,
    estimateBand: 0.12,
    offersPerListingPerYear: 2,
    counterWindow: 0.20,             // offers more than this below floor are rejected outright
    lowballRepHit: 1,
    rivalContestChance: 0.45,        // × aggression when a rival sees a bargain
    auctionRounds: 3,
    auctionRivalStep: 1.04,
    // transaction costs
    agentFee: 0.03,
    cgtYears: 3,
    quickSaleFactor: 0.85,           // fallback; the live factor is quickSaleFactorByPhase[cycle.phase] (ENG-B3)
    quickSaleFactorByPhase: { boom: 0.88, growth: 0.85, stagnation: 0.80, recession: 0.78, depression: 0.75 },
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
    decayAgeYears: 40,
    maintenanceAgeExtra: 0.003,       // old buildings cost more to keep up
    marginCallWindowYears: 2,         // two forced sales within this window = bankruptcy                // buildings older than this decay +1
    unrentableBelow: 20,
    highVacancyBelow: 40,
    // ENG-B6 sticky named tenants: the person in the building remembers what you charge them
    tenantRiseTolerance: 0.03,        // yearly rent rises above this risk notice
    tenantLeaveBase: 0.25,            // leave chance at a minimal breach; scales with the rise
    tenantLoyaltyRetention: 0.7,      // a fully loyal tenant is this much less likely to leave
    tenantLoyaltyGain: 0.15,          // loyalty per year the rent is held or cut
    tenantStartLoyalty: 0.3,
    tenantLoyaltyVacancyCut: 0.5,     // vacancy × (1 − this × loyalty)
    tenantLoyaltyDecayCut: 0.25,      // decay × (1 − this × loyalty) — long tenants care for the place
    tenantReletVacancy: 0.35,         // extra vacancy in the re-letting year after a tenant leaves
    // ENG-B8 flagship: one named crown jewel per city — rent and standing, but a target
    flagshipRentBonus: 0.05,
    flagshipRepPerYear: 1,            // reputation a year while you hold at least one flagship
    flagshipRivalWeight: 3,           // rivals are this much more likely to bid on it
    flagshipOfferPremiumMult: 1.15,   // ...and they pay up for the crown jewel
    flagshipEventWeight: 2.5,         // random events find the flagship more often
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
    foreshadowAccuracy: 0.45,          // chance the paper warns of a scripted crash
    foreshadowFalseAlarm: 0.10,        // ENG-B5: chance the paper cries wolf when no crash is coming (Town crier suppresses)
    // taxes
    wealthTaxThresholdMult: 60,       // × family start cash × priceIndex
    estateTrustFactor: 0.5,
    trustCostPct: 0.02,
    charityCostPct: 0.01,            // per year, on net worth
    charityRepPerYear: 2,
    charityTaxCut: 0.05,             // estate-tax rate points while endowed (bible §7)
    // market dynamics
    districtNoise: 0.03,
    momentumMeanReversion: 0.15,
    momentumNoise: 0.008,
    pressurePerBuy: 0.006,
    saturationShare: 0.30,
    saturationPricePenalty: 0.10,
    saturationYieldPenalty: 0.15,
    districtStock: [30, 90],
    // rivals
    rivalMaxProperties: 30,
    rivalStartWealthMult: 3.0,        // × family start cash × archetype wealthMult
    rivalPreemptChance: 0.25,         // a fresh bargain is snapped up by a rival before the board opens
    hiddenDefectChance: 0.5,          // estate/distressed/auction purchases may hide problems
    hiddenDefectRange: [5, 20],
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
    randomEventChance: 0.65,
    maxEventsPerYear: 2,
    // cities
    expansionBase: 1200,              // 1850 £; × priceIndex × tier multiplier
    expansionTierMult: [1.0, 1.0, 2.2, 4.5, 8.0],
    expansionCountMult: 0.35,         // +35% per already-unlocked city
    expansionRepBase: 44,
    expansionRepStep: 4,
    // comeback
    comebackCashPct: 0.10,
    comebackReputation: 40,
    // P3.2 marriage / alliance / relations (relations run −100..100; rv.relation 0..100 is the UI view)
    marriageMinAge: 18,
    marriageMaxAge: 40,
    marriageMinReputation: 50,
    marriageRefusalRep: -6,
    marriageRefusalRelation: -20,
    marriageAcceptRelation: 30,
    marriageCooldownYears: 5,
    mergerCost: 0.15,                 // estate-tax-like share of the ally's net worth, paid in cash
    mergerWindowYears: 20,            // merger allowed in the last 20 years of the run (or when the head is 65+)
    mergerHeadAge: 65,
    mergerLegacyMult: 0.25,           // legacy score × (1 + 0.25 per merger)
    relationOutbid: -8,               // you outbid a rival at auction
    relationOutbidBy: -2,             // a rival outbid you
    relationSoldTo: 8,                // you accepted their offer
    relationDeclined: -4,
    relationEviction: -5,             // you evicted tenants in a city where they hold buildings
    relationDrift: 1,                 // relations mean-revert toward 0 by this much a year
    relationContestSwing: 0.30,       // ENG-B4: contest chance × (1 − 0.30 × relation/100); hostile rivals hunt your deals
    relationBidSwing: 0.07,           // ENG-B4: rival max bid × (1 − 0.07 × relation/100); hostile rivals bid harder
    // P3.4 events v2
    prewarnAccuracy: 0.45,            // chance the paper foreshadows a set-piece a year ahead (same noise as the crash whisper)
    // P5.2 perks
    perkOldMoneyLtv: 0.05,
    perkPuristGoalMult: 2,
    // P5.3 weekly challenge
    challengeYears: 30,
    // P5.4 scenarios
    scenarioYears: 15,
    // P4.1 government bonds (Boom era, 1950+): 5-year fixed coupon at base+0.5%, capped at 30% of net worth
    bondTermYears: 5,
    bondCouponAboveBase: 0.005,
    bondCapPct: 0.30,
    bondMinBuy: 50,                   // smaller denominations are not worth the clerk's time
    // P4.2 own bank (Modern era + 'own_bank' perk): lend to rivals at base+2.5–4%, risk write-offs
    bankMinCapital: 25000,            // × priceIndex, one-time
    bankSpreadMin: 0.025,
    bankSpreadMax: 0.04,
    bankLoanYears: 5,
    bankMinDeployPct: 0.10,           // new loans only when ≥10% of capital is idle
    bankMinLoanMult: 250,             // × priceIndex; smaller loans are not worth the paper
    bankRecallYears: 2,               // recall: outstanding loans repay over this many years
    // P4.3 build-to-suit (land plots)
    buildDeveloperFee: 0.10,          // Okonkwo & Sons: +10% cost
    buildDeveloperDelayMult: 0.5,     // ...for half the delay risk
    buildEraFactorBase: 1.10,         // delivered value = cost × (base + era.drift × mult) × spec valueMult × district drift ± noise
    buildEraFactorDriftMult: 4,
    // P4.4 city traits v2
    redevelopmentDrift: 0.006,        // below-average districts in redevelopment cities appreciate faster
    techHubDrift: 0.005,              // Modern+ district price drift in tech hubs
    foreignBuyerDrift: 0.01           // extra yearly appreciation where foreign money chases stock
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
    { year: 1950, title: 'The planners', text: 'A new era: slum clearance orders, council housing and planning permission. Old tenements are condemned; new estates need builders.',
      choices: [{ label: 'Sell your lowest-condition building to the council at 100% (no fee)', fx: { sellWeakest: 1.0 } }, { label: 'Tender for council contracts (renovations −30% for 5 years, +3 reputation)', fx: { renoDiscountYears: 5, reputation: 3 } }, { label: 'Lobby against clearance (−4 reputation, 2 extra distressed listings next year)', fx: { reputation: -4, extraDistressed: 2 } }] },
    { year: 1955, title: 'The suburbs', text: 'Cars, motorways, mortgages for everyone. Suburban houses appear on the board; fixed-rate loans are offered.', cycle: 'boom',
      choices: [{ label: 'Fix every variable mortgage (+1% rate, immune to the 1970s spike)', fx: { fixAll: true } }, { label: 'Stay variable and enjoy the boom', fx: {} }] },
    { year: 1963, title: 'The white heat of redevelopment', text: 'Motorways, tower blocks, comprehensive redevelopment. The bulldozer is the decade\'s mascot and the compulsory purchase order its instrument.',
      choices: [{ label: 'Sell your lowest-condition building to the corporation at 102% (no fee)', fx: { sellWeakest: 1.02 } }, { label: 'Tender for the redevelopment work (renovations −30% for 3 years, +2 reputation)', fx: { renoDiscountYears: 3, reputation: 2 } }, { label: 'Campaign against the bulldozers (−2 reputation; 2 extra distressed listings as other landlords bail out)', fx: { reputation: -2, extraDistressed: 2 } }] },
    { year: 1973, title: 'Oil shock', text: 'OPEC quadruples the oil price. Inflation and rates explode; the secondary banks go under.', cycle: 'recession',
      choices: [{ label: 'Sell your most leveraged property at 95%', fx: { sellMostLeveraged: 0.95 } }, { label: 'Raise all rents to 115% (cash now, vacancy later)', fx: { rentAll: 1.15 } }, { label: 'Do nothing', fx: {} }] },
    { year: 1980, title: 'Deregulation', text: 'A new era: the banks are unleashed, council tenants get the right to buy, and towers rise on the docks.',
      choices: [{ label: 'Refinance everything to 70% while the banks are generous', fx: { refiAll: 0.7 } }, { label: 'Sell your weakest building to its tenants at 95%', fx: { sellWeakest: 0.95 } }, { label: 'Stay cautious', fx: {} }] },
    { year: 1989, title: 'The Wall falls', text: 'Berlin reunites. Eastern districts are derelict, cheap and about to become the hippest addresses in Europe.',
      choices: [{ label: 'Buy a derelict Berlin block (pay 20% of cash; Berlin unlocked free)', fx: { unlockCity: 'berlin', giftProperty: { type: 'apartment', condition: 15, pct: 0.20, city: 'berlin' } } }, { label: 'Invest in Berlin momentum (Berlin districts trend up 5 years)', fx: { cityMomentum: { city: 'berlin', years: 5 } } }, { label: 'Watch from afar', fx: {} }] },
    { year: 1992, title: 'Black Wednesday', text: 'Sterling is driven out of the exchange-rate mechanism. The bank rate touches 12% by lunch and is falling again by tea. Nobody knows what money costs any more.', cycle: 'recession',
      choices: [{ label: 'Fix every variable mortgage before the next spike (+1% rate)', fx: { fixAll: true } }, { label: 'Bet against the pound alongside the speculators (55%: +3% of net worth; 45%: −3%)', fx: { gambleNW: { p: 0.55, win: 0.03, lose: 0.03 } } }, { label: 'Repay 15% of every mortgage while money is dear', fx: { repayPct: 0.15 } }] },
    { year: 2000, title: 'Dot-com bust', text: 'Tech stocks crater. Office tenants vanish in tech hubs; residential holds.', cycle: 'recession',
      choices: [{ label: 'Convert an office to flats (pay 10% of its value, +20 condition)', fx: { convertOffice: true } }, { label: 'Buy distressed offices (2 extra distressed listings next year)', fx: { extraDistressed: 2 } }, { label: 'Hold', fx: {} }] },
    { year: 2008, title: 'The Global Financial Crisis', text: 'Lehman fails. Lenders call covenants on everyone. Cash is king for two years, then it is free.', cycle: 'depression',
      choices: [{ label: 'Repay 25% of all mortgages now', fx: { repayPct: 0.25 } }, { label: 'Sell your two weakest properties at 88%', fx: { sellWeakest: 0.88, count: 2 } }, { label: 'Hold; buy the crash (4 extra distressed listings next year)', fx: { extraDistressed: 4 } }] },
    { year: 2016, title: 'The referendum', text: 'Britain votes to leave. The pound slides, the agents\' phones go quiet, and the foreign buyers who propped up the top of the market are suddenly reading the small print.',
      choices: [{ label: 'Sell your weakest building into the wobble at 100% (no fee)', fx: { sellWeakest: 1.0 } }, { label: 'Cut all rents 5% to hold nervous tenants (+2 reputation)', fx: { rentAll: 0.95, reputation: 2 } }, { label: 'Buy the uncertainty (the pound is cheap: 2 extra distressed listings next year; −1 reputation for gloating)', fx: { extraDistressed: 2, reputation: -1 } }] },
    { year: 2020, title: 'Pandemic', text: 'Cities lock down. Offices and shops empty; homes with gardens boom.', cycle: 'recession',
      choices: [{ label: 'Waive 20% of commercial rent this year (+6 reputation)', fx: { commercialRent: 0.8, reputation: 6 } }, { label: 'Evict commercial defaulters (−8 reputation, rent held)', fx: { reputation: -8 } }, { label: 'Sell a shop or office at 95%', fx: { sellCommercial: 0.95 } }] }
  ];

  /* ---------- Historical pre-warnings (P3.4): the paper foreshadows the 12 biggest set-pieces a year ahead ---------- */
  D.prewarns = {
    1866: 'Discount houses are said to be dangerously extended. Bankers whisper of trouble next year.',
    1873: 'Vienna\'s bourse wobbles; railway shares are falling in New York. Trouble is whispered.',
    1890: 'Argentine bonds are quietly being dumped in the City. Bankers whisper of trouble.',
    1907: 'New York trust companies are rumoured to be short of gold. Trouble may cross the Atlantic.',
    1914: 'The chancelleries of Europe are mobilising. Tenants talk of enlisting.',
    1929: 'Wall Street has never been higher. A few bankers whisper of trouble.',
    1939: 'Gas masks are being issued. Builders expect requisitions.',
    1946: 'Ministers promise a rebuilding programme once the war is won.',
    1963: 'The minister speaks of white heat and modernisation. Compulsory purchase orders are said to be drafted already.',
    1973: 'The oil producers are meeting in Vienna. Bankers whisper of trouble with rates.',
    1989: 'Crowds gather at the Berlin Wall. Eastern districts may open up.',
    1992: 'Sterling is under pressure in the exchange-rate mechanism. Dealers whisper that the peg cannot hold.',
    2008: 'American mortgage bonds are souring. Lenders whisper of trouble next year.',
    2016: 'The referendum polls are too close to call. Foreign buyers are pausing; the pound is jittery.',
    2020: 'A new virus is spreading in Asia. Shopkeepers are nervous.'
  };
  for (var hi = 0; hi < D.historicalEvents.length; hi++) if (D.prewarns[D.historicalEvents[hi].year]) D.historicalEvents[hi].prewarn = D.prewarns[D.historicalEvents[hi].year];

  /* ---------- Era-transition set-pieces (P3.4): one event with two choices when the era changes ---------- */
  D.eraSetPieces = {
    gilded:  { title: 'The Gilded Age', text: 'Electric light, steel frames and new money. Apartment blocks and villas appear on the board; the old Victorian stock looks tired beside them.',
      choices: [{ label: 'Modernise the portfolio (pay 3% of net worth; every building +8 condition)', fx: { cashPctNW: -0.03, decay: -8 } }, { label: 'Keep the Victorian character (+3 reputation; buildings age as they are)', fx: { reputation: 3 } }] },
    crisis:  { title: 'Crisis and war', text: 'The thirties open with banks failing and lenders cutting loan-to-value to 60%. Cash buyers inherit the earth.',
      choices: [{ label: 'Pay down 15% of every mortgage while you still can', fx: { repayPct: 0.15 } }, { label: 'Hold cash for the bargains (3 extra distressed listings next year)', fx: { extraDistressed: 3 } }] },
    boom:    { title: 'The long boom', text: 'Full employment, motorways and mortgages for everyone. Suburbs sprawl and the planners condemn the old tenements.',
      choices: [{ label: 'Bet on the suburbs (3 extra plots next year; renovations −30% for 3 years)', fx: { extraLand: 3, renoDiscountYears: 3 } }, { label: 'Bet on the centre (every building +5 condition; +2 reputation)', fx: { decay: -5, reputation: 2 } }] },
    modern:  { title: 'Big Bang', text: 'The banks are deregulated, the docks are redeveloped and towers rise. Credit is cheap today and dear tomorrow.',
      choices: [{ label: 'Fix every variable mortgage (+1% rate; immune to the next spike)', fx: { fixAll: true } }, { label: 'Stay variable and refinance everything to 70%', fx: { refiAll: 0.7 } }] },
    digital: { title: 'The platform era', text: 'Short lets, online listings and global buyers. Tenants move with their phones; so do bargains.',
      choices: [{ label: 'List on the platforms (rents +10% this year; −2 reputation with the council)', fx: { rentBoost: 0.10, reputation: -2 } }, { label: 'Keep long leases (+3 reputation; every building +4 condition from settled tenants)', fx: { reputation: 3, decay: -4 } }] }
  };

  /* ---------- Random events with choices (bible §2, §6.6; v2 in P3.4) ---------- */
  // weight: relative frequency. minProps: only when portfolio is large enough. fromEra/toEra gate by era index.
  // Every choice set is tuned so expected values (net worth + reputation + durable effects, see js/sim/eventsmc.js)
  // sit within ±20% of each other while the risk, reputation and time profiles differ. The resolver in events.js applies fx.
  D.randomEvents = [
    // --- tenants and buildings ---
    { id: 'long_lease', weight: 1, minProps: 1, title: 'A tenant proposes a long lease', text: '{prop}\'s tenant offers a 6-year lease at a fixed rent, 5% above today\'s.',
      choices: [{ label: 'Accept: fixed rent 6 years, never vacant, no rent rises', fx: { lease: { years: 6, setting: 1.05 } } }, { label: 'Decline: keep flexible', fx: {} }] },
    { id: 'lawsuit', weight: 3, minProps: 2, title: 'A tenant sues', text: 'A tenant at {prop} is injured on a rotten stair and sues for damages.',
      choices: [{ label: 'Settle: pay 4% of net worth', fx: { cashPctNW: -0.04 } }, { label: 'Fight it (55%: pay nothing; 45%: pay 7% of net worth and −4 reputation)', fx: { gambleNW: { p: 0.55, win: 0, lose: 0.07, loseRep: 4 } } }] },
    { id: 'fire', weight: 3, minProps: 1, title: 'Fire!', text: 'A kitchen fire guts part of {prop}.',
      choices: [{ label: 'Repair at once (pay 10% of its value, condition kept)', fx: { propCostPct: 0.10 } }, { label: 'Leave the scars (condition −15, value −4%)', fx: { propCondition: -15, propQuality: -0.04 } }, { label: 'Claim on the parish insurance (35%: repaired for free; 65%: pay 10% and −3 reputation)', fx: { propGamble: { p: 0.35, loseCostPct: 0.10, loseRep: 3 } } }] },
    { id: 'windfall_tenant', weight: 2, minProps: 2, title: 'A famous tenant', text: 'A celebrated author wants {prop} and will pay 30% over the rent — but wants it Prime.',
      choices: [{ label: 'Refurbish for them (pay refurbish cost; rent setting 1.2 locked 4 years)', fx: { refurbForTenant: true } }, { label: 'Decline', fx: {} }] },
    { id: 'subsidence', weight: 2, minProps: 2, title: 'Subsidence', text: 'Cracks run up the wall of {prop}. The surveyor shrugs.',
      choices: [{ label: 'Underpin now (pay 5% of its value)', fx: { propCostPct: 0.05 } }, { label: 'Monitor it (50%: it stops; 50%: condition −22 next spring)', fx: { propGamble: { p: 0.5, loseCond: 22 } } }] },
    { id: 'squatters', weight: 2, minProps: 2, title: 'Squatters', text: 'A family has moved into the empty rooms at {prop} and will not leave.',
      choices: [{ label: 'Let them stay as tenants at 80% rent (+1 reputation)', fx: { propRent: 0.8, reputation: 1 } }, { label: 'Have the bailiffs clear them (−2 reputation; rivals with buildings in {district} tut)', fx: { reputation: -2, evictionDistrict: true } }, { label: 'Pay them to go (pay 2% of its value)', fx: { propCostPct: 0.02 } }] },
    { id: 'rent_strike', weight: 2, minProps: 3, title: 'Rent strike', text: 'Tenants across your {city} buildings refuse to pay until rents are cut.',
      choices: [{ label: 'Cut rents to 80% in {city} (+1 reputation)', fx: { cityRent: 0.8, reputation: 1 } }, { label: 'Evict the ringleaders and re-let at 110% (−2 reputation; occupancy −10% this year; rivals in {city} tut)', fx: { reputation: -2, cityVacancy: 0.1, cityRent: 1.1, evictionCity: true } }] },
    { id: 'model_tenant', weight: 1, minProps: 1, title: 'A model tenant', text: 'The tenant at {prop} has looked after the place like their own. They ask for a 10-year lease at today\'s rent.',
      choices: [{ label: 'Grant it (10 years at 105%, never vacant, no rises)', fx: { lease: { years: 10, setting: 1.05 } } }, { label: 'Offer 3 years at 95% instead', fx: { lease: { years: 3, setting: 0.95 } } }] },
    { id: 'plague_house', weight: 1, minProps: 2, toEra: 2, title: 'Fever in the house', text: 'Typhus has broken out at {prop}. The parish wants it emptied and fumigated.',
      choices: [{ label: 'Empty it for a year and fumigate (no rent this year; +3 reputation)', fx: { propVacantYears: 1, reputation: 3 } }, { label: 'Keep the tenants and pay the doctor (pay 3% of its value; −2 reputation)', fx: { propCostPct: 0.03, reputation: -2 } }] },
    { id: 'conversion', weight: 2, minProps: 2, fromEra: 1, title: 'A conversion opportunity', text: 'An architect says {prop} could be split into more units for a modest outlay.',
      choices: [{ label: 'Convert (pay 6% of its value; value +5%, rent +)', fx: { propCostPct: 0.06, propQuality: 0.05 } }, { label: 'Leave it as it is', fx: {} }] },
    { id: 'antique_find', weight: 0.5, minProps: 1, toEra: 3, title: 'Behind the panelling', text: 'Workmen at {prop} find a cache of old coins and silver behind the panelling.',
      choices: [{ label: 'Sell them quietly (+1.5% of net worth)', fx: { cashPctNW: 0.015 } }, { label: 'Hand them to the museum (+6 reputation)', fx: { reputation: 6 } }, { label: 'Auction them publicly (50%: +2.6% of net worth; 50%: +0.5%)', fx: { gambleNW: { p: 0.5, win: 0.026, loseWin: 0.005 } } }] },
    { id: 'roof', weight: 3, minProps: 1, title: 'The roof', text: 'The roof of {prop} will not survive another winter.',
      choices: [{ label: 'New roof (pay 6% of its value; condition +4)', fx: { propCostPct: 0.06, propCondition: 4 } }, { label: 'Patch and pray (pay 1%; 60%: fine; 40%: condition −15 after the storms)', fx: { propCostPct: 0.01, propGamble: { p: 0.6, loseCond: 15 } } }] },
    // --- city and market ---
    { id: 'compulsory', weight: 1, minProps: 2, title: 'Compulsory purchase', text: 'The council wants {prop} for a new road and offers 105% of value.',
      choices: [{ label: 'Accept 105% (no agent fee)', fx: { sellProp: 1.05 } }, { label: 'Refuse and petition (−1 reputation; 55%: the road is re-routed and the district gains 5%; 45%: forced sale at value)', fx: { reputation: -1, petition: { p: 0.55, shock: 0.05, factor: 1.0 } } }] },
    { id: 'insider', weight: 3, minProps: 0, title: 'A word from the agent', text: 'An agent offers, for a fee, to tell you exactly what the best listing on the board is worth.',
      choices: [{ label: 'Pay 1% of cash for the true value', fx: { cashPct: -0.01, revealBest: true } }, { label: 'Trust your own eye', fx: {} }] },
    { id: 'tramline', weight: 2, minProps: 1, title: 'A new tramline', text: 'The corporation will run a tramline through {district}, {city} if landlords contribute to the works.',
      choices: [{ label: 'Subscribe 2% of net worth (the district trends up for 4 years)', fx: { cashPctNW: -0.02, districtMomentum: 4 } }, { label: 'Let others pay (−1 reputation; 55%: the line is built anyway)', fx: { reputation: -1, districtMomentumChance: { p: 0.55, years: 4 } } }] },
    { id: 'factory', weight: 1, minProps: 1, toEra: 3, title: 'A factory next door', text: 'A tannery is to open beside {prop}. The smell will carry.',
      choices: [{ label: 'Object at the hearing (pay 0.2% of net worth in lawyers; 60%: stopped; 40%: district −6%)', fx: { cashPctNW: -0.002, districtShockChance: { p: 0.4, shock: -0.06 } } }, { label: 'Buy shares in the tannery instead (district −6%; +1.5% of net worth in dividends)', fx: { districtShock: -0.06, cashPctNW: 0.015 } }] },
    { id: 'gentrify', weight: 1, minProps: 2, title: 'Artists move in', text: 'Painters and writers are taking cheap rooms in {district}, {city}. The landlords are divided.',
      choices: [{ label: 'Let to them at 90% (the district trends up next year)', fx: { propRent: 0.9, districtMomentum: 1 } }, { label: 'Raise rents to 110% before the rush (−1 reputation; keen tenants pay a premium: +0.5% of net worth)', fx: { propRent: 1.1, reputation: -1, cashPctNW: 0.005 } }] },
    { id: 'bubble_talk', weight: 1, minProps: 2, title: 'Bubble talk', text: 'Every dinner party in {city} is about property prices. A broker offers to sell {prop} to a syndicate at 108% of value.',
      choices: [{ label: 'Sell at 108% (agent fee applies)', fx: { sellPropFee: 1.08 } }, { label: 'Hold; it is worth more next year (50%: +12% value; 50%: −4%)', fx: { propValueGamble: { p: 0.5, win: 0.12, lose: 0.04 } } }] },
    { id: 'planning', weight: 2, minProps: 1, fromEra: 3, title: 'Planning permission', text: 'The planners will allow an extra storey on {prop} — for a contribution.',
      choices: [{ label: 'Pay the contribution (5% of its value; value +7%)', fx: { propCostPct: 0.05, propQuality: 0.07 } }, { label: 'Appeal instead (free; 40%: granted, value +7%; 60%: refused)', fx: { propValueGamble: { p: 0.4, win: 0.07, lose: 0 } } }] },
    { id: 'auction_rumour', weight: 0.5, minProps: 1, title: 'A word at the club', text: 'A bankrupt merchant\'s portfolio is to be broken up next year. You could get in first.',
      choices: [{ label: 'Retain the receiver (pay 1% of net worth; 2 extra distressed listings next year)', fx: { cashPctNW: -0.01, extraDistressed: 2 } }, { label: 'Wait for the auction', fx: {} }] },
    { id: 'rival_district', weight: 1, minProps: 2, title: '{rival} want your district', text: '{rival} are buying everything in {district}, {city}. Prices there are moving.',
      choices: [{ label: 'Sell them {prop} at 108% (relation +)', fx: { sellToRival: 1.08, rivalRelation: 12 } }, { label: 'Dig in (district +4% from their buying; relation −)', fx: { districtShock: 0.04, rivalRelation: -10 } }] },
    { id: 'harbour', weight: 1, minProps: 2, title: 'New docks', text: 'A harbour expansion is planned for {city}. Warehouses will boom; genteel districts will lose their view.',
      choices: [{ label: 'Lobby for it (pay 1% of net worth; +4 reputation with the merchants)', fx: { cashPctNW: -0.01, reputation: 4 } }, { label: 'Lobby against it (−1 reputation; 40%: stopped and {district} keeps its view, trending up 2 years)', fx: { reputation: -1, districtMomentumChance: { p: 0.4, years: 2 } } }] },
    { id: 'flood', weight: 2, minProps: 2, title: 'The river rises', text: 'Floods have reached the cellars across {city}.',
      choices: [{ label: 'Pump and dry every building (pay 2.5% of net worth; condition kept)', fx: { cashPctNW: -0.025 } }, { label: 'Let them dry on their own (every building −5 condition)', fx: { decay: 5 } }] },
    { id: 'exhibition', weight: 1, minProps: 1, title: 'The city hosts an exhibition', text: '{city} will host a great fair next summer. Visitors need rooms.',
      choices: [{ label: 'Let short to visitors (rents +10% this year; tenants churn: every building −2 condition)', fx: { rentBoost: 0.10, decay: 2 } }, { label: 'Keep your tenants (+1 reputation)', fx: { reputation: 1 } }] },
    { id: 'tax_assessor', weight: 3, minProps: 3, title: 'The assessor calls', text: 'The city is reassessing property for tax. Your buildings have been valued generously.',
      choices: [{ label: 'Appeal (pay 0.5% of net worth; 60%: no extra tax; 40%: pay 3% anyway)', fx: { cashPctNW: -0.005, gambleNW: { p: 0.6, win: 0, lose: 0.03 } } }, { label: 'Pay the extra assessment (2% of net worth; +1 reputation)', fx: { cashPctNW: -0.02, reputation: 1 } }] },
    // --- finance ---
    { id: 'bank_call', weight: 3, minProps: 2, minDebt: true, title: 'The bank manager', text: 'Your lender is nervous and invites you to lunch. He would like to see less of your name on his books.',
      choices: [{ label: 'Repay 10% of every mortgage (lender reassured)', fx: { repayPct: 0.10 } }, { label: 'Charm him (50%: +1 reputation; 50%: −2; relation with the Rothschilds +)', fx: { repGamble: { p: 0.5, win: 1, lose: 2 }, namedRelation: { id: 'rothschild', delta: 8 } } }] },
    { id: 'bond_tip', weight: 2, minProps: 1, title: 'A tip from the Exchange', text: 'A broker friend swears the next issue of government stock will be oversubscribed.',
      choices: [{ label: 'Put 10% of cash in (60%: +25% on it; 40%: −15%)', fx: { gamble: { p: 0.6, win: 0.025, lose: 0.015 } } }, { label: 'Keep your powder dry', fx: {} }] },
    { id: 'debt_forgiven', weight: 1, minProps: 2, minDebt: true, title: 'A clerical error', text: 'The bank\'s ledger shows your largest mortgage as smaller than it is.',
      choices: [{ label: 'Say nothing (the error stands: largest loan −5%; 30% chance of a −6 reputation scandal later)', fx: { debtForgive: 0.05, repGamble: { p: 0.7, win: 0, lose: 6 } } }, { label: 'Report it (+2 reputation; relation with the Rothschilds +)', fx: { reputation: 2, namedRelation: { id: 'rothschild', delta: 8 } } }] },
    { id: 'partner', weight: 2, minProps: 1, title: 'A joint venture', text: '{rival} invites you into a development syndicate.',
      choices: [{ label: 'Invest 10% of cash (65%: +45% back next year; 35%: lose it; relation +)', fx: { gamble: { p: 0.65, win: 0.045, lose: 0.10 }, rivalRelation: 10 } }, { label: 'Decline politely', fx: { rivalRelation: -3 } }] },
    { id: 'insurance_offer', weight: 0.5, minProps: 3, fromEra: 1, title: 'An insurance broker', text: 'A broker offers a policy over the whole portfolio against fire and flood.',
      choices: [{ label: 'Insure (pay 0.8% of net worth; no fire or flood events for 10 years)', fx: { cashPctNW: -0.008, insuredYears: 10 } }, { label: 'Self-insure', fx: {} }] },
    { id: 'rate_lock', weight: 2, minProps: 2, minDebt: true, fromEra: 3, title: 'A fixed-rate offer', text: 'Your lender offers to fix every variable loan at today\'s rate plus 1%.',
      choices: [{ label: 'Fix everything (+1% rate; immune to spikes)', fx: { fixAll: true } }, { label: 'Stay variable', fx: {} }] },
    { id: 'inheritance', weight: 2, minProps: 0, title: 'A cousin dies', text: 'A distant cousin leaves you a mortgaged {type}. The bank wants its interest.',
      choices: [{ label: 'Accept the property and its 85% mortgage (one bad year from a margin call)', fx: { inheritProperty: { ltv: 0.85 } } }, { label: 'Renounce it (+2 reputation among the other heirs)', fx: { reputation: 2 } }] },
    // --- dynasty and reputation ---
    { id: 'charity', weight: 2, minProps: 0, title: 'The hospital appeal', text: 'The governors of the city hospital ask the family for a subscription.',
      choices: [{ label: 'Subscribe 2% of net worth (+6 reputation)', fx: { cashPctNW: -0.02, reputation: 6 } }, { label: 'Send regrets (−2 reputation)', fx: { reputation: -2 } }] },
    { id: 'heir_debts', weight: 2, minProps: 1, minMembers: 2, title: 'Gambling debts', text: '{member} has lost heavily at cards. The creditors are not gentle people.',
      choices: [{ label: 'Pay the debts (5% of net worth)', fx: { cashPctNW: -0.05 } }, { label: 'Refuse (−10 reputation; {member} gains Spendthrift)', fx: { reputation: -10, memberTrait: 'spendthrift' } }] },
    { id: 'manager_fraud', weight: 1, minProps: 6, title: 'The manager\'s books', text: 'Your manager in {city} has been skimming rents.',
      choices: [{ label: 'Prosecute (lose 5% of cash to the courts, +3 reputation, manager fired)', fx: { cashPct: -0.05, reputation: 3, fireManager: true } }, { label: 'Quietly dismiss him (lose 2% of cash, manager fired)', fx: { cashPct: -0.02, fireManager: true } }] },
    { id: 'scandal', weight: 2, minProps: 2, minMembers: 2, title: 'A scandal', text: '{member} has been seen in company the newspapers find irresistible.',
      choices: [{ label: 'Buy the editor\'s silence (pay 1% of net worth)', fx: { cashPctNW: -0.01 } }, { label: 'Brazen it out (50%: it blows over; 50%: −4 reputation)', fx: { repGamble: { p: 0.5, win: 0, lose: 4 } } }] },
    { id: 'society_wedding', weight: 1, minProps: 1, minMembers: 2, title: 'A society wedding', text: 'A good family would welcome {member} — if the wedding is grand enough.',
      choices: [{ label: 'A grand wedding (pay 1.5% of net worth; +6 reputation)', fx: { cashPctNW: -0.015, reputation: 6 } }, { label: 'A quiet ceremony (+1 reputation)', fx: { reputation: 1 } }] },
    { id: 'political_office', weight: 1, minProps: 3, title: 'Stand for office', text: 'The party asks the head of the family to stand for the council.',
      choices: [{ label: 'Stand (pay 1% of net worth; 50%: elected, +10 reputation; 50%: lose, +1)', fx: { cashPctNW: -0.01, repGamble: { p: 0.5, win: 10, lose: -1 } } }, { label: 'Decline (+1 reputation for modesty)', fx: { reputation: 1 } }] },
    { id: 'portrait', weight: 1, minProps: 1, title: 'A portrait', text: 'A fashionable painter offers to paint the head of the family.',
      choices: [{ label: 'Commission it (pay 0.6% of net worth; +2 reputation)', fx: { cashPctNW: -0.006, reputation: 2 } }, { label: 'Decline', fx: {} }] },
    { id: 'rival_feud', weight: 1, minProps: 2, title: 'Words with {rival}', text: 'At the club, {rival} accuse you of stealing their tenants.',
      choices: [{ label: 'Make peace over dinner (pay 0.3% of net worth; relation +)', fx: { cashPctNW: -0.003, rivalRelation: 12 } }, { label: 'Tell them where to go (−1 reputation; relation −; +0.5% of net worth in poached tenants)', fx: { reputation: -1, rivalRelation: -12, cashPctNW: 0.005 } }] },
    { id: 'rival_gift', weight: 1, minProps: 1, title: '{rival} send a gift', text: '{rival} send a case of wine and a note suggesting the families should be friends.',
      choices: [{ label: 'Accept and reciprocate (pay 0.3% of net worth; relation +)', fx: { cashPctNW: -0.003, rivalRelation: 10 } }, { label: 'Return it unopened (relation −; +1 reputation for independence)', fx: { rivalRelation: -8, reputation: 1 } }] },
    { id: 'press', weight: 2, minProps: 4, title: 'The press', text: 'A newspaper is writing about slum landlords in {city}. Your name may appear.',
      choices: [{ label: 'Patch every building (pay 2.5% of net worth; +2 reputation; every building +2 condition)', fx: { cashPctNW: -0.025, reputation: 2, decay: -2 } }, { label: 'Ignore the story (50%: nothing; 50%: −5 reputation)', fx: { repGamble: { p: 0.5, win: 0, lose: 5 } } }] },
    { id: 'apprentice', weight: 1, minProps: 2, minMembers: 2, title: 'An apprenticeship', text: '{member} wants to learn the trade with a surveyor rather than at school.',
      choices: [{ label: 'Pay the premium (pay 1% of net worth; comps noise halved 5 years)', fx: { cashPctNW: -0.01, surveyorYears: 5 } }, { label: 'Keep them at home (+1 reputation)', fx: { reputation: 1 } }] },
    // --- more tenants and buildings ---
    { id: 'dry_rot', weight: 3, minProps: 2, title: 'Dry rot', text: 'The surveyor\'s penknife sinks into the skirting at {prop}. Dry rot, and it has had a head start.',
      choices: [{ label: 'Strip it out now (pay 6% of its value)', fx: { propCostPct: 0.06 } }, { label: 'Treat and monitor (pay 1.5%; 60%: it holds; 40%: it spreads, condition −18)', fx: { propCostPct: 0.015, propGamble: { p: 0.6, loseCond: 18 } } }] },
    { id: 'tenant_buys', weight: 0.5, minProps: 1, title: 'The tenant offers to buy', text: 'The sitting tenant at {prop} has saved for years and offers 103% of value for the freehold.',
      choices: [{ label: 'Sell at 103% (no agent fee)', fx: { sellProp: 1.03 } }, { label: 'Decline and raise the rent to 110%', fx: { propRent: 1.1 } }] },
    { id: 'sanitary_inspector', weight: 3, minProps: 2, toEra: 2, title: 'The sanitary inspector calls', text: 'The inspector condemns the drains at {prop}. Cholera is a word he uses twice.',
      choices: [{ label: 'Re-lay the drains (pay 5% of its value; condition +3)', fx: { propCostPct: 0.05, propCondition: 3 } }, { label: 'A consideration to overlook it (pay 0.2% of net worth; 55%: he looks away; 45%: prosecution — pay 0.9% and −2 reputation)', fx: { cashPctNW: -0.002, gambleNW: { p: 0.55, win: 0, lose: 0.009, loseRep: 2 } } }] },
    { id: 'servants_quarters', weight: 1, minProps: 1, fromEra: 1, toEra: 4, title: 'Nobody keeps servants any more', text: 'The servants\' quarters at {prop} stand empty. An architect suggests flats where the attic bedrooms were.',
      choices: [{ label: 'Convert them (pay 4% of its value; value +6%)', fx: { propCostPct: 0.04, propQuality: 0.06 } }, { label: 'Leave them empty', fx: {} }] },
    { id: 'sitting_tenant', weight: 1, minProps: 1, fromEra: 3, title: 'A protected tenancy', text: 'The tenant at {prop} claims statutory protection. You will never sell with vacant possession while they stay.',
      choices: [{ label: 'Pay them to go (pay 4% of its value; empty, it is worth 5% more)', fx: { propCostPct: 0.04, propQuality: 0.05 } }, { label: 'Accept the protected rent (85%; +2 reputation with the council)', fx: { propRent: 0.85, reputation: 2 } }] },
    { id: 'short_let', weight: 2, minProps: 1, fromEra: 5, title: 'The platform guarantee', text: 'A short-let platform offers guaranteed income for {prop}: 20% over market for two years. The neighbours are already composing letters.',
      choices: [{ label: 'Sign up (rent 120% for 2 years; −2 reputation; wear and tear: condition −4)', fx: { lease: { years: 2, setting: 1.2 }, reputation: -2, propCondition: -4 } }, { label: 'Keep the long tenant (+1 reputation)', fx: { reputation: 1 } }] },
    { id: 'retrofit', weight: 1, minProps: 2, fromEra: 4, title: 'A retrofit grant', text: 'A government scheme covers half the cost of modernising {prop} — insulation, wiring, the works — if you commit this year.',
      choices: [{ label: 'Take the grant (pay 3% of its value; condition +4, value +3%)', fx: { propCostPct: 0.03, propCondition: 4, propQuality: 0.03 } }, { label: 'Skip the paperwork', fx: {} }] },
    { id: 'asbestos', weight: 1, minProps: 2, fromEra: 4, title: 'Asbestos', text: 'Surveyors find asbestos in the service ducts at {prop}. Everyone speaks very calmly about it, which is worse.',
      choices: [{ label: 'Strip it now (pay 4% of its value)', fx: { propCostPct: 0.04 } }, { label: 'Encapsulate and disclose (pay 1%; 65%: fine; 35%: a claim later — 4% of its value and −3 reputation)', fx: { propCostPct: 0.01, propGamble: { p: 0.65, loseCostPct: 0.04, loseRep: 3 } } }] },
    { id: 'porters_strike', weight: 1, minProps: 3, fromEra: 4, title: 'The porters down tools', text: 'Porters and cleaners across your {city} buildings strike for a fortnight. The bins are eloquent.',
      choices: [{ label: 'Settle: a pay rise (pay 0.9% of net worth; +1 reputation)', fx: { cashPctNW: -0.009, reputation: 1 } }, { label: 'Bring in contractors (pay 0.3% of net worth; 55%: it holds; 45%: the dispute drags on and costs another 0.7%)', fx: { cashPctNW: -0.003, gambleNW: { p: 0.55, win: 0, lose: 0.007 } } }] },
    { id: 'wiring', weight: 1, minProps: 1, fromEra: 3, title: 'The coronation on television', text: 'The tenants at {prop} are clubbing together for a television set and ask you to wire the house properly.',
      choices: [{ label: 'Wire it (pay 1% of its value; rent 105% for 3 years; condition +2)', fx: { propCostPct: 0.01, lease: { years: 3, setting: 1.05 }, propCondition: 2 } }, { label: 'Decline; the radio was good enough for you', fx: {} }] },
    { id: 'milk_bar', weight: 1, minProps: 1, fromEra: 3, title: 'A milk bar', text: 'A milk bar — all chrome and jukebox — wants the ground floor of {prop}. The teenagers will congregate, say the neighbours, darkly.',
      choices: [{ label: 'Let to them (a premium of 0.5% of net worth; −2 reputation with the neighbours)', fx: { cashPctNW: 0.005, reputation: -2 } }, { label: 'Keep the quiet grocer (+1 reputation)', fx: { reputation: 1 } }] },
    // --- more city and market ---
    { id: 'cattle_market', weight: 1, minProps: 2, toEra: 2, title: 'The cattle market moves', text: 'The corporation means to move the cattle market to {district}, {city}. Drovers and noise; but the shopkeepers are delighted.',
      choices: [{ label: 'Welcome it (+1 reputation; trade lifts the district 2%, though the noise costs {prop} 4% of value)', fx: { reputation: 1, districtShock: 0.02, propQuality: -0.04 } }, { label: 'Sell {prop} to a drover syndicate at 102% and be done with it (no fee)', fx: { sellProp: 1.02 } }] },
    { id: 'smoke_abatement', weight: 1, minProps: 2, toEra: 3, title: 'The smoke nuisance', text: 'A smoke-abatement society names {district} in its report. Soft-coal grates must go, it says, in every house you own.',
      choices: [{ label: 'Convert every grate (pay 2.5% of net worth; every building +2 condition; +1 reputation)', fx: { cashPctNW: -0.025, decay: -2, reputation: 1 } }, { label: 'Fight the report (−1 reputation; 50%: it is forgotten; 50%: fines and mandated works of 1.7% of net worth)', fx: { reputation: -1, gambleNW: { p: 0.5, win: 0, lose: 0.017 } } }] },
    { id: 'water_company', weight: 0.5, minProps: 1, toEra: 1, title: 'The water company', text: 'The new water company offers to lay mains into {district}: no more wells, for a connection fee per house.',
      choices: [{ label: 'Connect {prop} (pay 2% of its value; condition +3, value +2%)', fx: { propCostPct: 0.02, propCondition: 3, propQuality: 0.02 } }, { label: 'Keep the well; it has never killed anyone you know of', fx: {} }] },
    { id: 'motorway', weight: 1, minProps: 2, fromEra: 3, toEra: 4, title: 'The motorway box', text: 'The new motorway will take a corner of {district}. Compensation for blight is derisory, but the contractors pay cash for quick sales.',
      choices: [{ label: 'Sell {prop} to the contractors at 99%, cash this week (no fee)', fx: { sellProp: 0.99 } }, { label: 'Hold out for the inquiry (−1 reputation; 50%: the line shifts and the address gains 7%; 50%: blight, value −6%)', fx: { reputation: -1, propValueGamble: { p: 0.5, win: 0.07, lose: 0.06 } } }] },
    { id: 'heritage_listing', weight: 1, minProps: 1, fromEra: 3, title: 'A listing notice', text: 'The heritage society wants {prop} listed. Listed buildings cannot easily be altered — but the address gains a cachet.',
      choices: [{ label: 'Support the listing (value +2%)', fx: { propQuality: 0.02 } }, { label: 'Object, loudly (pay 0.2% of net worth; 55%: refused, and the publicity helps: +5%; 45%: listed anyway: +2%)', fx: { cashPctNW: -0.002, propValueGamble: { p: 0.55, win: 0.05, lose: -0.02 } } }] },
    { id: 'big_box', weight: 1, minProps: 2, fromEra: 4, title: 'A retail park', text: 'A supermarket chain wants to anchor a retail park on the edge of {district}, and covets {prop}\'s site.',
      choices: [{ label: 'Sell them {prop} at 110% (agent fee applies)', fx: { sellPropFee: 1.10 } }, { label: 'Refuse; the traffic lifts the district 2% (−1 reputation with the chain\'s friends)', fx: { districtShock: 0.02, reputation: -1 } }] },
    { id: 'garden_square', weight: 0.5, minProps: 2, toEra: 2, title: 'The garden square', text: 'The freeholder will sell the leaseholders of {district} the central garden — if every house subscribes. The railings, otherwise, stay locked forever.',
      choices: [{ label: 'Subscribe 0.8% of net worth (the district trends up a year; +1 reputation)', fx: { cashPctNW: -0.008, districtMomentum: 1, reputation: 1 } }, { label: 'Decline (−1 reputation among the other houses)', fx: { reputation: -1 } }] },
    { id: 'host_city', weight: 0.5, minProps: 2, fromEra: 5, title: 'The bid', text: '{city} is shortlisted to host the world\'s games. Property near the venues is already moving on rumour alone.',
      choices: [{ label: 'Sell {prop} into the froth at 104% (no fee)', fx: { sellProp: 1.04 } }, { label: 'Bet on the bid (55%: it wins, +4% of cash; 45%: it loses, −1.8%)', fx: { gamble: { p: 0.55, win: 0.04, lose: 0.018 } } }] },
    { id: 'students', weight: 2, minProps: 2, fromEra: 3, title: 'Student lodgings', text: 'The new university wants lodgings near {district}. Students pay well and care little.',
      choices: [{ label: 'Let {prop} to students (rent 120%; the parties cost condition −5)', fx: { propRent: 1.2, propCondition: -5 } }, { label: 'Keep families (+1 reputation)', fx: { reputation: 1 } }] },
    { id: 'department_store', weight: 1, minProps: 1, fromEra: 1, toEra: 3, title: 'A right of light', text: 'A grand department store is to rise behind {prop}. The light will go; the footfall will come.',
      choices: [{ label: 'Sell them the right of light (value −3%; trade lifts the district 1%)', fx: { propQuality: -0.03, districtShock: 0.01 } }, { label: 'Defend your light (pay 0.3% of net worth in lawyers; 65%: upheld, and the stand adds cachet: +3%; 35%: lost, value −2% more)', fx: { cashPctNW: -0.003, propValueGamble: { p: 0.65, win: 0.03, lose: 0.02 } } }] },
    { id: 'ground_rent', weight: 1, minProps: 2, toEra: 2, title: 'The speculative builder', text: 'A builder offers cash for the ground beside {prop}. He builds fast, cheap, and close.',
      choices: [{ label: 'Take his money (+0.6% of net worth; the overlookers cost {prop} 3% of value)', fx: { cashPctNW: 0.006, propQuality: -0.03 } }, { label: 'Refuse (−1 reputation among the builders; 50%: he builds anyway, value −3%; 50%: he goes elsewhere and the scarcity helps: +5%)', fx: { reputation: -1, propValueGamble: { p: 0.5, win: 0.05, lose: 0.03 } } }] },
    { id: 'slum_clearance', weight: 1, minProps: 3, fromEra: 3, toEra: 4, title: 'The clearance area', text: 'The council\'s clearance maps lap at {district}. Owners inside the line get improvement grants; owners beside it get blight.',
      choices: [{ label: 'Apply for the grant (pay 0.2% of net worth in surveyor\'s fees; renovations −30% next year)', fx: { cashPctNW: -0.002, renoDiscountYears: 1 } }, { label: 'Ignore the maps', fx: {} }] },
    { id: 'online_portal', weight: 2, minProps: 1, fromEra: 5, title: 'The portal calls', text: 'A property portal offers to feature your buildings: buyers from everywhere, for an annual fee.',
      choices: [{ label: 'Subscribe (pay 0.5% of net worth; the best listing on the board is priced for you, and a distressed seller finds you next year)', fx: { cashPctNW: -0.005, revealBest: true, extraDistressed: 1 } }, { label: 'Keep to the shop window', fx: {} }] },
    { id: 'crypto_buyer', weight: 0.5, minProps: 1, fromEra: 5, title: 'A buyer of the future', text: 'A buyer offers for {prop} — half in cash, half in something called coins. Your solicitor refuses to say the word aloud.',
      choices: [{ label: 'Take the coins (50%: they hold, value +12%; 50%: they do not, −8%)', fx: { propValueGamble: { p: 0.5, win: 0.12, lose: 0.08 } } }, { label: 'Insist on pounds (sell at 102%, no fee)', fx: { sellProp: 1.02 } }] },
    // --- more finance ---
    { id: 'insurance_scandal', weight: 1, minProps: 3, fromEra: 1, title: 'Your insurer goes smash', text: 'The insurance office carrying your risks has failed. New cover costs double until the market settles.',
      choices: [{ label: 'Re-insure at the new price (pay 0.9% of net worth; no fire or flood events for 6 years)', fx: { cashPctNW: -0.009, insuredYears: 6 } }, { label: 'Go bare and save the premium', fx: {} }] },
    { id: 'foreign_loan', weight: 1, minProps: 2, minDebt: true, fromEra: 2, title: 'A loan in francs', text: 'A continental bank offers to take over your mortgages below the bank rate — repayable in francs. What could the exchange do?',
      choices: [{ label: 'Take it (cash +0.5% of net worth now; 50%: the franc falls, +1% more; 50%: it rises, pay 1.5%)', fx: { cashPctNW: 0.005, gambleNW: { p: 0.5, win: 0.01, lose: 0.015 } } }, { label: 'Stay with your London bank', fx: {} }] },
    { id: 'private_loan', weight: 1, minProps: 2, minDebt: true, title: 'The Rothschilds\' card', text: 'The Rothschilds will advance you money against your name alone. Your own bank will not be amused.',
      choices: [{ label: 'Take it (cash +1% of net worth; your largest loan grows 2%; relation +)', fx: { cashPctNW: 0.01, debtForgive: -0.02, namedRelation: { id: 'rothschild', delta: 6 } } }, { label: 'Decline; they respect caution (relation +4)', fx: { namedRelation: { id: 'rothschild', delta: 4 } } }] },
    { id: 'discount_house', weight: 1, minProps: 2, minDebt: true, title: 'Your mortgage is sold on', text: 'Your lender has sold your largest mortgage to a discount house. The new holder is… attentive.',
      choices: [{ label: 'Repay 5% of every mortgage to placate them', fx: { repayPct: 0.05 } }, { label: 'Brazen it out (he trims 2% off the largest loan to be rid of the paperwork; 50%: −2 reputation when he mentions it at the club)', fx: { debtForgive: 0.02, repGamble: { p: 0.5, win: 0, lose: 2 } } }] },
    { id: 'bond_opportunity', weight: 1, minProps: 1, fromEra: 3, title: 'The Consols are called', text: 'The Treasury is retiring the old 3% Consols the family holds. Cash at par, or new stock at a lower coupon.',
      choices: [{ label: 'Take the cash (+0.6% of net worth)', fx: { cashPctNW: 0.006 } }, { label: 'Take the new stock and sell it on the market (50%: +1.4%; 50%: +0.1%)', fx: { gambleNW: { p: 0.5, win: 0.014, loseWin: 0.001 } } }] },
    { id: 'refinance_boom', weight: 1, minProps: 3, minDebt: true, fromEra: 4, title: 'The banks are throwing money', text: 'Every lender in town will refinance a landlord to 70% and press the difference on you in cash. It feels like a trap because it is one.',
      choices: [{ label: 'Refinance everything to 70% (cash now; interest forever)', fx: { refiAll: 0.7 } }, { label: 'Stay lean (the Rothschilds approve: relation +8)', fx: { namedRelation: { id: 'rothschild', delta: 8 } } }] },
    { id: 'touts_tip', weight: 2, minProps: 1, title: 'The tout\'s nephew', text: 'A tout has a nephew in the auctioneer\'s office. For a consideration, the reserve on the best lot coming up.',
      choices: [{ label: 'Pay him 1.5% of cash (the true value of the best listing, revealed)', fx: { cashPct: -0.015, revealBest: true } }, { label: 'Walk away; the family has standards (+1 reputation)', fx: { reputation: 1 } }] },
    // --- more dynasty and reputation ---
    { id: 'elder_son_folly', weight: 1, minProps: 1, minMembers: 2, toEra: 2, title: 'The racing stable', text: '{member} wishes to breed racehorses under the family name. The trainer\'s terms are remarkable in every sense.',
      choices: [{ label: 'Stake the stable (pay 2% of net worth; 40%: a classic winner, +5% back; 60%: gone)', fx: { cashPctNW: -0.02, gambleNW: { p: 0.4, win: 0.05, lose: 0 } } }, { label: 'Refuse absolutely (−1 reputation; he sulks for a season)', fx: { reputation: -1 } }] },
    { id: 'aunts_will', weight: 1, minProps: 0, minMembers: 2, title: 'The great-aunt\'s will', text: 'A great-aunt leaves {member} a legacy — if the family pays the death duties now. Probate is a lottery.',
      choices: [{ label: 'Pay the duties (1% of net worth; 55%: the legacy yields +2.5%; 45%: only +0.5%)', fx: { cashPctNW: -0.01, gambleNW: { p: 0.55, win: 0.025, loseWin: 0.005 } } }, { label: 'Renounce it to the cousin (+1 reputation for generosity)', fx: { reputation: 1 } }] },
    { id: 'libel_suit', weight: 1, minProps: 2, minMembers: 2, toEra: 3, title: 'A pamphlet', text: 'A scurrilous pamphlet names {member} and the word "rackrent" appears. Counsel advises action; counsel always advises action.',
      choices: [{ label: 'Sue (pay 0.5% of net worth; 55%: vindicated, +5 reputation; 45%: laughed at, −3)', fx: { cashPctNW: -0.005, repGamble: { p: 0.55, win: 5, lose: 3 } } }, { label: 'Ignore it (−1 reputation as it circulates)', fx: { reputation: -1 } }] },
    { id: 'finishing_school', weight: 1, minProps: 1, minMembers: 2, fromEra: 1, title: 'Finished abroad', text: '{member} could be finished abroad — languages, manners, a season in Paris. Great houses notice such things.',
      choices: [{ label: 'Send them (pay 1% of net worth; +3 reputation; a great house warms: relation +8)', fx: { cashPctNW: -0.01, reputation: 3, rivalRelation: 8 } }, { label: 'The schoolroom at home is enough', fx: {} }] },
    { id: 'family_pew', weight: 1, minProps: 1, toEra: 2, title: 'The church roof', text: 'The parish church needs a new roof. The family pew is in the front row — conspicuously.',
      choices: [{ label: 'Roof the nave (pay 1.2% of net worth; +5 reputation)', fx: { cashPctNW: -0.012, reputation: 5 } }, { label: 'A modest subscription (pay 0.3%; +1 reputation)', fx: { cashPctNW: -0.003, reputation: 1 } }] },
    { id: 'receiver_tip', weight: 0.5, minProps: 2, title: 'The receiver\'s hint', text: 'A receiver hints that a cousin of {rival}\'s house is being wound up quietly. There is room for one friend at the trough.',
      choices: [{ label: 'Tip the receiver 0.5% of net worth (2 extra distressed listings next year; {rival} resent it: relation −6)', fx: { cashPctNW: -0.005, extraDistressed: 2, rivalRelation: -6 } }, { label: 'Tell {rival} first (relation +10)', fx: { rivalRelation: 10 } }] },
    { id: 'club_membership', weight: 1, minProps: 3, fromEra: 1, title: 'The ballot', text: 'The club will ballot the head of the family. Election opens every door in town; a blackball is remembered for years.',
      choices: [{ label: 'Stand (pay 0.4% of net worth; 65%: elected, +5 reputation; 35%: blackballed, −1)', fx: { cashPctNW: -0.004, repGamble: { p: 0.65, win: 5, lose: 1 } } }, { label: 'Clubs are for idlers (+1 reputation among the serious)', fx: { reputation: 1 } }] },
    { id: 'war_office_stores', weight: 1, minProps: 2, fromEra: 2, toEra: 3, title: 'Requisition', text: 'The War Office needs stores and has looked at {prop}. The rent is fixed by act of parliament. Take it, or be taken.',
      choices: [{ label: 'Sign the contract (4 years at 90%, never vacant; +2 reputation)', fx: { lease: { years: 4, setting: 0.9 }, reputation: 2 } }, { label: 'Refuse; they take it anyway (2 years at 85%; −1 reputation for obstructing the war effort)', fx: { lease: { years: 2, setting: 0.85 }, reputation: -1 } }] }
  ];
  D.randomEventById = function (id) { for (var i = 0; i < D.randomEvents.length; i++) if (D.randomEvents[i].id === id) return D.randomEvents[i]; return null; };

  /* ---------- Achievements v2 (P5.5): none satisfied at start for any family or scenario ---------- */
  // category: deals | finance | survival | dynasty | cities | rivals. rare: the six hardest.
  D.achievements = [
    { id: 'first_deal', name: 'First Deal', category: 'deals', desc: 'Buy a property below asking price.' },
    { id: 'auction_winner', name: 'Hammer Down', category: 'deals', desc: 'Win an auction against a rival.' },
    { id: 'flipper', name: 'Flipper', category: 'deals', desc: 'Sell a property for 30% more than you paid.' },
    { id: 'bargain_hunter', name: 'Bargain Hunter', category: 'deals', desc: 'Buy a property for 75% of its true value or less.' },
    { id: 'ten_deals', name: 'Dealmaker', category: 'deals', desc: 'Buy 10 properties.' },
    { id: 'fifty_deals', name: 'Wheeler-Dealer', category: 'deals', desc: 'Buy 50 properties.' },
    { id: 'counter_closer', name: 'Closer', category: 'deals', desc: 'Close 5 deals by meeting a counter-offer.' },
    { id: 'brrrr', name: 'Recycler', category: 'finance', desc: 'Refinance a renovated property and recover your deposit.' },
    { id: 'refinancer', name: 'Refinancer', category: 'finance', desc: 'Refinance 10 times.' },
    { id: 'debt_free', name: 'Unencumbered', category: 'finance', desc: 'Own 5 or more properties with no mortgage on any of them.' },
    { id: 'high_wire', name: 'High Wire', category: 'finance', desc: 'Carry a portfolio LTV above 65% for 3 consecutive years without a forced sale.' },
    { id: 'covenant_kept', name: 'Covenant Kept', category: 'finance', desc: 'Clear a margin call by repaying the shortfall.' },
    { id: 'survivor', name: 'Survivor', category: 'survival', desc: 'Come through a depression without a forced sale while holding debt.' },
    { id: 'two_depressions', name: 'Twice Bitten', category: 'survival', desc: 'Survive two depressions with debt and no forced sale.' },
    { id: 'cash_king', name: 'Cash is King', category: 'survival', desc: 'Hold cash of 30% of net worth or more through a depression year.' },
    { id: 'centenarian', name: 'Centenarian', category: 'survival', desc: 'Keep the house going for 100 years.' },
    { id: 'the_long_game', name: 'The Long Game', category: 'survival', rare: true, desc: 'Reach the end of the campaign with the house standing.' },
    { id: 'comeback', name: 'Phoenix', category: 'survival', desc: 'Rebuild net worth to the pre-bankruptcy peak after continuing as the heir.' },
    { id: 'portfolio_5', name: 'Landlord', category: 'deals', desc: 'Own 5 properties.' },
    { id: 'portfolio_15', name: 'Magnate', category: 'deals', desc: 'Own 15 properties.' },
    { id: 'portfolio_40', name: 'Empire', category: 'deals', rare: true, desc: 'Own 40 properties.' },
    { id: 'rebuilder', name: 'Rebuilder', category: 'deals', desc: 'Complete a Rebuild.' },
    { id: 'tower', name: 'Skyline', category: 'cities', desc: 'Own a tower.' },
    { id: 'wealth_100x', name: 'Hundredfold', category: 'finance', desc: 'Net worth 100× your starting cash.' },
    { id: 'wealth_1000x', name: 'Thousandfold', category: 'finance', rare: true, desc: 'Net worth 1,000× your starting cash.' },
    { id: 'generation_2', name: 'Heir', category: 'dynasty', desc: 'Pass the empire to a second generation.' },
    { id: 'generation_4', name: 'Dynasty', category: 'dynasty', desc: 'Reach the fourth generation.' },
    { id: 'generation_6', name: 'Old Family', category: 'dynasty', rare: true, desc: 'Reach the sixth generation.' },
    { id: 'scholar', name: 'Scholar', category: 'dynasty', desc: 'Educate three members of the family.' },
    { id: 'matchmaker', name: 'Matchmaker', category: 'dynasty', desc: 'Marry an heir into a rival family.' },
    { id: 'merger', name: 'The Great Merger', category: 'dynasty', rare: true, desc: 'Fold an allied family\'s portfolio into your own.' },
    { id: 'trust_fund', name: 'Trust Fund', category: 'dynasty', desc: 'Pass a succession with a family trust in place.' },
    { id: 'reputation_90', name: 'Pillar of Society', category: 'dynasty', desc: 'Reputation 90.' },
    { id: 'second_city', name: 'Abroad', category: 'cities', desc: 'Unlock a second city.' },
    { id: 'five_cities', name: 'Jet Set', category: 'cities', desc: 'Unlock five cities.' },
    { id: 'ten_cities', name: 'Globetrotter', category: 'cities', desc: 'Unlock ten cities.' },
    { id: 'all_cities', name: 'The World', category: 'cities', rare: true, desc: 'Unlock every city.' },
    { id: 'world_citizen', name: 'World Citizen', category: 'cities', desc: 'Own property in five cities at once.' },
    { id: 'district_king', name: 'King of the District', category: 'cities', desc: 'Own 30% of a district\'s stock.' },
    { id: 'rank_1', name: 'Top of the Pile', category: 'rivals', desc: 'Lead the leaderboard.' },
    { id: 'top_dog_decade', name: 'Top Dog', category: 'rivals', desc: 'Lead the leaderboard for 10 consecutive years.' },
    { id: 'nemesis', name: 'Nemesis', category: 'rivals', desc: 'Outbid the same rival at auction five times.' },
    { id: 'vulture', name: 'Vulture', category: 'rivals', desc: 'Buy a bankrupt rival\'s portfolio from the receiver.' },
    { id: 'friend_of_banks', name: 'Friend of the Banks', category: 'rivals', desc: 'Borrow from the Rothschilds.' },
    { id: 'peacemaker', name: 'Peacemaker', category: 'rivals', desc: 'Be on good terms (relation 70+) with four rival families at once.' }
  ];
  D.achievementById = function (id) { for (var i = 0; i < D.achievements.length; i++) if (D.achievements[i].id === id) return D.achievements[i]; return null; };

  /* ---------- Prestige perks (P5.2): bought with legacy points; each changes a rule ---------- */
  // kind 'passive' perks apply to every new game once owned; 'mode' perks must be chosen with newGame({perks:[...]}).
  D.perks = [
    { id: 'family_solicitor', name: 'Family solicitor', cost: 2, kind: 'passive', desc: 'Comparable-sale noise halved: your estimate band is twice as tight.' },
    { id: 'old_money', name: 'Old money', cost: 3, kind: 'passive', desc: 'Lenders advance 5% more: the LTV cap rises by 5 points.' },
    { id: 'thick_skin', name: 'Thick skin', cost: 2, kind: 'passive', desc: 'Reputation losses are halved.' },
    { id: 'builders_guild', name: 'Builders\' guild', cost: 2, kind: 'passive', desc: 'Renovation overrun and delay risk halved.' },
    { id: 'town_crier', name: 'Town crier', cost: 1, kind: 'passive', desc: 'The morning paper foreshadows crashes and set-pieces far more reliably.' },
    { id: 'patient_capital', name: 'Patient capital', cost: 1, kind: 'passive', desc: 'Savings earn the full bank rate instead of 2% below it.' },
    { id: 'seventh_rival', name: 'Seventh rival', cost: 3, kind: 'mode', desc: 'The Hartwells join the table: richer, sharper and more aggressive than any of the six.' },
    { id: 'purist', name: 'Purist', cost: 4, kind: 'mode', desc: 'No mortgages at all, but yearly goal rewards are doubled.' },
    { id: 'crisis_start', name: 'Crisis start', cost: 3, kind: 'mode', desc: 'Begin in 1929 with a leveraged portfolio, the day before the crash.' },
    { id: 'second_city', name: 'Second city', cost: 5, kind: 'mode', desc: 'Paris is open from the first day.' },
    { id: 'own_bank', name: 'Own bank', cost: 6, kind: 'passive', desc: 'From the Modern era, open a private bank: lend your capital to rival families above the bank rate — and lose it when they default.' }
  ];
  D.perkById = function (id) { for (var i = 0; i < D.perks.length; i++) if (D.perks[i].id === id) return D.perks[i]; return null; };

  /* ---------- Era-start scenarios (P5.4): a leveraged portfolio on the eve of a crash ---------- */
  // props: number of starting buildings; ltv: their mortgages; cashMult: start cash as a multiple of the family's 1850 cash × price index.
  // cycle: phase during the first year (the crash lands at the first year end); baseRate: starting rate.
  D.scenarios = {
    crash1929:    { id: 'crash1929', name: 'Black Tuesday', startYear: 1929, cycle: 'depression', baseRate: 0.055, props: 5, ltv: 0.64, cashMult: 0.34, cities: ['london', 'new_york'],
      intro: 'Wall Street has crashed. Your five buildings are 64% borrowed and the bankers whisper that property follows the stock market. Survive 15 years and hand on at least what you started with.' },
    oilshock1973: { id: 'oilshock1973', name: 'Oil Shock', startYear: 1973, cycle: 'recession', baseRate: 0.11, props: 5, ltv: 0.60, cashMult: 0.40, cities: ['london', 'paris'],
      intro: 'OPEC has quadrupled the oil price and the bank rate is heading for 13%. Your loans are variable. Survive 15 years and hand on at least what you started with.' },
    gfc2008:      { id: 'gfc2008', name: 'The Credit Crunch', startYear: 2008, cycle: 'depression', baseRate: 0.05, props: 5, ltv: 0.55, cashMult: 0.40, cities: ['london', 'new_york'],
      intro: 'Lehman Brothers has failed and every lender is calling covenants. Survive 15 years and hand on at least what you started with.' }
  };
  D.scenarioById = function (id) { return D.scenarios[id] || null; };

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
