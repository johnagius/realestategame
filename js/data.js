/* ========================================
   PROPERTY EMPIRE - Game Data
   ======================================== */

const GameData = {

  // ---- 20 World Cities ----
  cities: [
    {
      id: 'new_york', name: 'New York', country: 'United States', flag: '🇺🇸',
      description: 'The city that never sleeps. Premium real estate with sky-high demand.',
      priceMultiplier: 2.2, rentYield: 0.04, taxRate: 0.08, growthRate: 0.03,
      inflationRate: 0.025, tier: 1, maxProperties: 15
    },
    {
      id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧',
      description: 'Historic and prestigious. A global hub for luxury property.',
      priceMultiplier: 2.0, rentYield: 0.038, taxRate: 0.07, growthRate: 0.025,
      inflationRate: 0.022, tier: 1, maxProperties: 15
    },
    {
      id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷',
      description: 'The City of Light. Elegant apartments and charming townhouses.',
      priceMultiplier: 1.7, rentYield: 0.035, taxRate: 0.08, growthRate: 0.02,
      inflationRate: 0.020, tier: 1, maxProperties: 14
    },
    {
      id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵',
      description: 'Ultra-modern metropolis. High density, high returns.',
      priceMultiplier: 1.8, rentYield: 0.042, taxRate: 0.06, growthRate: 0.02,
      inflationRate: 0.015, tier: 1, maxProperties: 14
    },
    {
      id: 'dubai', name: 'Dubai', country: 'UAE', flag: '🇦🇪',
      description: 'Luxury paradise with zero income tax. Bold architecture.',
      priceMultiplier: 1.5, rentYield: 0.055, taxRate: 0.04, growthRate: 0.04,
      inflationRate: 0.030, tier: 1, maxProperties: 14
    },
    {
      id: 'singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬',
      description: 'Compact city-state with premium property at a premium.',
      priceMultiplier: 1.8, rentYield: 0.036, taxRate: 0.07, growthRate: 0.025,
      inflationRate: 0.018, tier: 2, maxProperties: 12
    },
    {
      id: 'hong_kong', name: 'Hong Kong', country: 'China', flag: '🇭🇰',
      description: 'One of the world\'s most expensive property markets.',
      priceMultiplier: 2.5, rentYield: 0.03, taxRate: 0.06, growthRate: 0.02,
      inflationRate: 0.020, tier: 1, maxProperties: 12
    },
    {
      id: 'sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺',
      description: 'Harbour city with stunning coastal properties.',
      priceMultiplier: 1.6, rentYield: 0.04, taxRate: 0.07, growthRate: 0.03,
      inflationRate: 0.028, tier: 2, maxProperties: 13
    },
    {
      id: 'los_angeles', name: 'Los Angeles', country: 'United States', flag: '🇺🇸',
      description: 'Hollywood glamour meets beachfront living.',
      priceMultiplier: 1.5, rentYield: 0.042, taxRate: 0.07, growthRate: 0.03,
      inflationRate: 0.026, tier: 2, maxProperties: 14
    },
    {
      id: 'miami', name: 'Miami', country: 'United States', flag: '🇺🇸',
      description: 'Tropical vibes with booming luxury condo market.',
      priceMultiplier: 1.3, rentYield: 0.05, taxRate: 0.06, growthRate: 0.035,
      inflationRate: 0.028, tier: 2, maxProperties: 14
    },
    {
      id: 'barcelona', name: 'Barcelona', country: 'Spain', flag: '🇪🇸',
      description: 'Mediterranean charm with strong tourism demand.',
      priceMultiplier: 1.2, rentYield: 0.048, taxRate: 0.08, growthRate: 0.025,
      inflationRate: 0.024, tier: 2, maxProperties: 13
    },
    {
      id: 'rome', name: 'Rome', country: 'Italy', flag: '🇮🇹',
      description: 'The Eternal City. Historic properties with timeless appeal.',
      priceMultiplier: 1.0, rentYield: 0.045, taxRate: 0.09, growthRate: 0.015,
      inflationRate: 0.022, tier: 2, maxProperties: 13
    },
    {
      id: 'berlin', name: 'Berlin', country: 'Germany', flag: '🇩🇪',
      description: 'Affordable and hip. Rapid gentrification creates opportunity.',
      priceMultiplier: 1.0, rentYield: 0.05, taxRate: 0.07, growthRate: 0.035,
      inflationRate: 0.020, tier: 3, maxProperties: 14
    },
    {
      id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱',
      description: 'Canal houses and modern living. Tight supply, high demand.',
      priceMultiplier: 1.3, rentYield: 0.04, taxRate: 0.08, growthRate: 0.02,
      inflationRate: 0.019, tier: 2, maxProperties: 12
    },
    {
      id: 'toronto', name: 'Toronto', country: 'Canada', flag: '🇨🇦',
      description: 'North America\'s fastest growing city. Condo boom.',
      priceMultiplier: 1.3, rentYield: 0.045, taxRate: 0.06, growthRate: 0.03,
      inflationRate: 0.025, tier: 2, maxProperties: 14
    },
    {
      id: 'monaco', name: 'Monaco', country: 'Monaco', flag: '🇲🇨',
      description: 'The world\'s most exclusive address. Ultra-luxury only.',
      priceMultiplier: 3.0, rentYield: 0.025, taxRate: 0.03, growthRate: 0.02,
      inflationRate: 0.012, tier: 1, maxProperties: 8
    },
    {
      id: 'shanghai', name: 'Shanghai', country: 'China', flag: '🇨🇳',
      description: 'Financial powerhouse with explosive growth potential.',
      priceMultiplier: 1.2, rentYield: 0.04, taxRate: 0.06, growthRate: 0.04,
      inflationRate: 0.025, tier: 2, maxProperties: 15
    },
    {
      id: 'mumbai', name: 'Mumbai', country: 'India', flag: '🇮🇳',
      description: 'Bollywood capital. Extreme density, extreme opportunity.',
      priceMultiplier: 0.7, rentYield: 0.055, taxRate: 0.07, growthRate: 0.05,
      inflationRate: 0.055, tier: 3, maxProperties: 15
    },
    {
      id: 'sao_paulo', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷',
      description: 'South America\'s financial hub. Affordable entry, high growth.',
      priceMultiplier: 0.6, rentYield: 0.06, taxRate: 0.06, growthRate: 0.045,
      inflationRate: 0.050, tier: 3, maxProperties: 15
    },
    {
      id: 'cape_town', name: 'Cape Town', country: 'South Africa', flag: '🇿🇦',
      description: 'Stunning scenery with bargain properties. High growth potential.',
      priceMultiplier: 0.5, rentYield: 0.065, taxRate: 0.05, growthRate: 0.05,
      inflationRate: 0.048, tier: 3, maxProperties: 14
    }
  ],

  // ---- Property Types ----
  propertyTypes: {
    land: {
      id: 'land', name: 'Land', icon: '🌳',
      description: 'Undeveloped land. Build anything you want.',
      canRent: false, canBuild: true, canRefurbish: false,
      basePriceRange: [40000, 200000],
      sizeRange: [200, 2000], // sqm
      maintenanceRate: 0.005 // annual % of value
    },
    studio: {
      id: 'studio', name: 'Studio Apartment', icon: '🏢',
      description: 'Compact and affordable. Great for rental income.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [60000, 150000],
      sizeRange: [20, 45],
      rentMultiplier: 1.2,
      maintenanceRate: 0.015
    },
    apartment: {
      id: 'apartment', name: 'Apartment', icon: '🏢',
      description: 'Standard residential apartment. Reliable income.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [100000, 350000],
      sizeRange: [50, 120],
      rentMultiplier: 1.0,
      maintenanceRate: 0.012
    },
    penthouse: {
      id: 'penthouse', name: 'Penthouse', icon: '🌆',
      description: 'Top-floor luxury with panoramic views.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [400000, 2000000],
      sizeRange: [100, 300],
      rentMultiplier: 0.7,
      maintenanceRate: 0.018
    },
    townhouse: {
      id: 'townhouse', name: 'Townhouse', icon: '🏘️',
      description: 'Multi-story urban living with character.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [150000, 500000],
      sizeRange: [80, 180],
      rentMultiplier: 0.9,
      maintenanceRate: 0.012
    },
    house: {
      id: 'house', name: 'House', icon: '🏠',
      description: 'Family home with garden. Suburban appeal.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [180000, 600000],
      sizeRange: [100, 300],
      rentMultiplier: 0.85,
      maintenanceRate: 0.01
    },
    villa: {
      id: 'villa', name: 'Villa', icon: '🏡',
      description: 'Luxury living with pool and grounds.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [500000, 3000000],
      sizeRange: [200, 600],
      rentMultiplier: 0.6,
      maintenanceRate: 0.015
    },
    mansion: {
      id: 'mansion', name: 'Mansion', icon: '🏰',
      description: 'Grand estate for the ultra-wealthy.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [2000000, 15000000],
      sizeRange: [400, 1500],
      rentMultiplier: 0.4,
      maintenanceRate: 0.02
    },
    commercial: {
      id: 'commercial', name: 'Commercial Space', icon: '🏪',
      description: 'Office or retail space. Strong yields.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [150000, 800000],
      sizeRange: [50, 500],
      rentMultiplier: 1.3,
      maintenanceRate: 0.01
    },
    warehouse: {
      id: 'warehouse', name: 'Warehouse', icon: '🏭',
      description: 'Industrial space. Low maintenance, steady income.',
      canRent: true, canBuild: false, canRefurbish: true,
      basePriceRange: [100000, 400000],
      sizeRange: [200, 2000],
      rentMultiplier: 1.1,
      maintenanceRate: 0.008
    }
  },

  // ---- Conditions ----
  conditions: {
    derelict:   { level: 0, name: 'Derelict',   color: '#E63946', rentPenalty: 0,    refurbCostPct: 0.35 },
    poor:       { level: 1, name: 'Poor',        color: '#F4A261', rentPenalty: 0.3,  refurbCostPct: 0.20 },
    fair:       { level: 2, name: 'Fair',        color: '#E9C46A', rentPenalty: 0.7,  refurbCostPct: 0.12 },
    good:       { level: 3, name: 'Good',        color: '#2A9D8F', rentPenalty: 1.0,  refurbCostPct: 0.08 },
    excellent:  { level: 4, name: 'Excellent',   color: '#2C6E49', rentPenalty: 1.15, refurbCostPct: 0 }
  },

  conditionOrder: ['derelict', 'poor', 'fair', 'good', 'excellent'],

  // ---- Building options (for land) ----
  buildOptions: {
    apartment:  { name: 'Apartment Block', icon: '🏢', costPct: 0.50, timeMonths: 6, resultType: 'apartment' },
    house:      { name: 'House',           icon: '🏠', costPct: 0.60, timeMonths: 4, resultType: 'house' },
    townhouse:  { name: 'Townhouse',       icon: '🏘️', costPct: 0.55, timeMonths: 5, resultType: 'townhouse' },
    villa:      { name: 'Villa',           icon: '🏡', costPct: 0.70, timeMonths: 8, resultType: 'villa' },
    commercial: { name: 'Commercial',      icon: '🏪', costPct: 0.45, timeMonths: 7, resultType: 'commercial' },
    warehouse:  { name: 'Warehouse',       icon: '🏭', costPct: 0.35, timeMonths: 5, resultType: 'warehouse' }
  },

  // ---- Property Name Parts ----
  nameTemplates: {
    land: [
      '{adj} Plot in {district}',
      '{district} Development Site',
      '{adj} Land Parcel - {district}',
      '{district} Vacant Lot',
    ],
    studio: [
      '{adj} Studio in {district}',
      'Compact Studio - {district}',
      '{district} Studio Flat',
    ],
    apartment: [
      '{adj} Apartment in {district}',
      '{beds}-Bed Flat in {district}',
      '{district} {adj} Residence',
      '{adj} {beds}-Bedroom - {district}',
    ],
    penthouse: [
      '{adj} Penthouse in {district}',
      '{district} Sky Residence',
      'Panoramic Penthouse - {district}',
    ],
    townhouse: [
      '{adj} Townhouse in {district}',
      '{district} Terrace House',
      'Charming Townhouse - {district}',
    ],
    house: [
      '{adj} House in {district}',
      '{beds}-Bed Family Home - {district}',
      '{district} {adj} Detached',
    ],
    villa: [
      '{adj} Villa in {district}',
      '{district} Luxury Villa',
      'Stunning Villa - {district}',
    ],
    mansion: [
      '{adj} Mansion in {district}',
      '{district} Grand Estate',
      'Prestigious Mansion - {district}',
    ],
    commercial: [
      '{adj} Office in {district}',
      '{district} Retail Space',
      'Commercial Unit - {district}',
    ],
    warehouse: [
      '{adj} Warehouse in {district}',
      '{district} Industrial Unit',
      'Storage Facility - {district}',
    ],
  },

  adjectives: [
    'Charming', 'Modern', 'Elegant', 'Sunny', 'Spacious', 'Cozy', 'Prime',
    'Renovated', 'Classic', 'Stylish', 'Bright', 'Luxurious', 'Central',
    'Quiet', 'Historic', 'Contemporary', 'Grand', 'Exclusive', 'Scenic', 'Prestigious'
  ],

  // District names per city
  districts: {
    new_york: ['Manhattan', 'Brooklyn', 'SoHo', 'Tribeca', 'Upper East Side', 'Chelsea', 'Williamsburg', 'Harlem'],
    london: ['Mayfair', 'Chelsea', 'Kensington', 'Notting Hill', 'Canary Wharf', 'Shoreditch', 'Camden', 'Hampstead'],
    paris: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Champs-Élysées', 'Bastille', 'Belleville', 'Pigalle', 'Trocadéro'],
    tokyo: ['Shibuya', 'Shinjuku', 'Ginza', 'Roppongi', 'Minato', 'Aoyama', 'Akasaka', 'Meguro'],
    dubai: ['Downtown', 'Marina', 'Palm Jumeirah', 'JBR', 'Business Bay', 'DIFC', 'Arabian Ranches', 'Creek Harbour'],
    singapore: ['Orchard', 'Marina Bay', 'Sentosa', 'Bugis', 'Holland Village', 'Tanjong Pagar', 'River Valley', 'Bukit Timah'],
    hong_kong: ['Central', 'The Peak', 'Causeway Bay', 'Tsim Sha Tsui', 'Wan Chai', 'Repulse Bay', 'Mid-Levels', 'Sai Ying Pun'],
    sydney: ['Bondi', 'Surry Hills', 'Darling Point', 'Manly', 'Paddington', 'Mosman', 'Circular Quay', 'Newtown'],
    los_angeles: ['Beverly Hills', 'Hollywood', 'Santa Monica', 'Malibu', 'Venice', 'Bel Air', 'Silver Lake', 'Downtown'],
    miami: ['South Beach', 'Brickell', 'Wynwood', 'Coconut Grove', 'Coral Gables', 'Downtown', 'Key Biscayne', 'Edgewater'],
    barcelona: ['Eixample', 'Gràcia', 'Barceloneta', 'El Born', 'Sarrià', 'Poble Sec', 'Sant Antoni', 'Poblenou'],
    rome: ['Trastevere', 'Prati', 'Monti', 'Testaccio', 'Parioli', 'San Lorenzo', 'Centro Storico', 'EUR'],
    berlin: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg', 'Friedrichshain', 'Schöneberg', 'Neukölln', 'Tiergarten'],
    amsterdam: ['Jordaan', 'De Pijp', 'Oud-West', 'Centrum', 'Vondelpark', 'Plantage', 'Oud-Zuid', 'Westerpark'],
    toronto: ['Yorkville', 'King West', 'The Annex', 'Liberty Village', 'Distillery', 'Leslieville', 'Rosedale', 'Cabbagetown'],
    monaco: ['Monte Carlo', 'La Condamine', 'Larvotto', 'Fontvieille', 'Monaco-Ville', 'Moneghetti', 'Les Révoires', 'La Rousse'],
    shanghai: ['The Bund', 'Pudong', 'French Concession', 'Jing\'an', 'Xuhui', 'Hongkou', 'Luwan', 'Changning'],
    mumbai: ['South Mumbai', 'Bandra', 'Juhu', 'Worli', 'Powai', 'Andheri', 'Lower Parel', 'Malabar Hill'],
    sao_paulo: ['Jardins', 'Vila Madalena', 'Itaim Bibi', 'Pinheiros', 'Moema', 'Brooklin', 'Higienópolis', 'Vila Olímpia'],
    cape_town: ['Camps Bay', 'Clifton', 'Sea Point', 'Waterfront', 'Gardens', 'Green Point', 'Constantia', 'Hout Bay']
  },

  // ---- City Map Coordinates (% x, % y on world map) ----
  cityCoords: {
    new_york:    { x: 26, y: 33 },
    london:      { x: 46, y: 24 },
    paris:       { x: 47, y: 28 },
    tokyo:       { x: 85, y: 33 },
    dubai:       { x: 60, y: 42 },
    singapore:   { x: 76, y: 57 },
    hong_kong:   { x: 80, y: 41 },
    sydney:      { x: 88, y: 76 },
    los_angeles: { x: 15, y: 35 },
    miami:       { x: 24, y: 42 },
    barcelona:   { x: 47, y: 32 },
    rome:        { x: 50, y: 31 },
    berlin:      { x: 50, y: 24 },
    amsterdam:   { x: 47, y: 23 },
    toronto:     { x: 23, y: 29 },
    monaco:      { x: 48, y: 30 },
    shanghai:    { x: 81, y: 36 },
    mumbai:      { x: 67, y: 44 },
    sao_paulo:   { x: 33, y: 70 },
    cape_town:   { x: 52, y: 78 }
  },

  // ---- Random Events ----
  events: [
    {
      id: 'market_boom',
      title: 'Market Boom!',
      icon: '📈',
      description: 'Economic growth drives property values up across {city}.',
      effect: { type: 'city_value_change', value: 0.08 },
      probability: 0.04
    },
    {
      id: 'market_crash',
      title: 'Market Downturn',
      icon: '📉',
      description: 'Economic uncertainty hits {city}\'s property market.',
      effect: { type: 'city_value_change', value: -0.06 },
      probability: 0.03
    },
    {
      id: 'tourism_surge',
      title: 'Tourism Surge',
      icon: '✈️',
      description: 'A wave of tourists boosts rental demand in {city}.',
      effect: { type: 'city_rent_boost', value: 0.15, duration: 3 },
      probability: 0.05
    },
    {
      id: 'new_infrastructure',
      title: 'New Infrastructure',
      icon: '🚇',
      description: 'New transit line announced near your property in {city}!',
      effect: { type: 'city_value_change', value: 0.05 },
      probability: 0.04
    },
    {
      id: 'natural_disaster',
      title: 'Natural Disaster',
      icon: '🌪️',
      description: 'Storm damage affects some properties in {city}.',
      effect: { type: 'damage', value: 1 },
      probability: 0.02
    },
    {
      id: 'tax_reform',
      title: 'Tax Reform',
      icon: '📋',
      description: 'New tax regulations affect property transactions in {city}.',
      effect: { type: 'tax_change', value: 0.02 },
      probability: 0.03
    },
    {
      id: 'tech_hub',
      title: 'Tech Hub Expansion',
      icon: '💻',
      description: 'Major tech company expands in {city}, driving demand.',
      effect: { type: 'city_value_change', value: 0.06 },
      probability: 0.03
    },
    {
      id: 'renovation_grant',
      title: 'Renovation Grant',
      icon: '🔨',
      description: 'Government offers renovation subsidies in {city}.',
      effect: { type: 'refurb_discount', value: 0.3, duration: 3 },
      probability: 0.03
    },
    {
      id: 'interest_rate_cut',
      title: 'Interest Rate Cut',
      icon: '🏦',
      description: 'Central bank cuts rates. Property values rise globally.',
      effect: { type: 'global_value_change', value: 0.03 },
      probability: 0.03
    },
    {
      id: 'interest_rate_hike',
      title: 'Interest Rate Hike',
      icon: '🏦',
      description: 'Central bank raises rates. Market cools slightly.',
      effect: { type: 'global_value_change', value: -0.02 },
      probability: 0.03
    }
  ],

  // ---- Licensing Fees (annual, per property type) ----
  licensingFees: {
    land: 200,
    studio: 500,
    apartment: 600,
    penthouse: 1200,
    townhouse: 700,
    house: 600,
    villa: 1500,
    mansion: 3000,
    commercial: 1000,
    warehouse: 800
  },

  // ---- Agent/selling fee percentage ----
  sellingFeeRate: 0.03,

  // ---- Starting cash ----
  startingCash: 500000,

  // ---- Months names ----
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  // ---- Helper: generate a property ----
  generateProperty(cityId, type) {
    const city = this.cities.find(c => c.id === cityId);
    const typeDef = this.propertyTypes[type];
    if (!city || !typeDef) return null;

    const [minPrice, maxPrice] = typeDef.basePriceRange;
    const basePrice = minPrice + Math.random() * (maxPrice - minPrice);
    const price = Math.round(basePrice * city.priceMultiplier / 1000) * 1000;

    const [minSize, maxSize] = typeDef.sizeRange;
    const size = Math.round(minSize + Math.random() * (maxSize - minSize));

    // Random condition (weighted towards fair/good)
    const condRoll = Math.random();
    let condition;
    if (condRoll < 0.08) condition = 'derelict';
    else if (condRoll < 0.22) condition = 'poor';
    else if (condRoll < 0.50) condition = 'fair';
    else if (condRoll < 0.82) condition = 'good';
    else condition = 'excellent';

    // Generate name
    const districts = this.districts[cityId] || ['Central'];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const beds = type === 'apartment' ? (Math.floor(Math.random() * 3) + 1) : (Math.floor(Math.random() * 4) + 2);
    const templates = this.nameTemplates[type] || ['{adj} Property in {district}'];
    let name = templates[Math.floor(Math.random() * templates.length)];
    name = name.replace('{adj}', adj).replace('{district}', district).replace('{beds}', beds);

    // Calculate rent
    const rentMultiplier = typeDef.rentMultiplier || 0;
    const condPenalty = this.conditions[condition].rentPenalty;
    const annualRent = price * city.rentYield * rentMultiplier * condPenalty;
    const monthlyRent = Math.round(annualRent / 12);

    // Maintenance
    const annualMaintenance = price * typeDef.maintenanceRate;
    const monthlyMaintenance = Math.round(annualMaintenance / 12);

    // Licensing fee
    const annualLicense = this.licensingFees[type] || 500;
    const monthlyLicense = Math.round(annualLicense / 12);

    return {
      id: 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      cityId,
      type,
      name,
      district,
      condition,
      size,
      purchasePrice: price,
      currentValue: price,
      monthlyRent: typeDef.canRent ? monthlyRent : 0,
      monthlyMaintenance,
      monthlyLicense,
      beds: ['studio', 'apartment', 'penthouse', 'townhouse', 'house', 'villa', 'mansion'].includes(type) ? beds : 0,
      isOwned: false,
      isRented: false,
      isRefurbishing: false,
      refurbMonthsLeft: 0,
      isBuilding: false,
      buildMonthsLeft: 0,
      buildType: null,
      monthPurchased: null,
      totalRentCollected: 0,
      totalExpensesPaid: 0,
      isNew: true,
      appreciation: 0
    };
  },

  // Generate initial properties for a city
  generateCityProperties(cityId) {
    const city = this.cities.find(c => c.id === cityId);
    if (!city) return [];

    const types = Object.keys(this.propertyTypes);
    const count = 6 + Math.floor(Math.random() * 5); // 6-10 properties
    const properties = [];

    for (let i = 0; i < count; i++) {
      // Weighted type selection
      const roll = Math.random();
      let type;
      if (roll < 0.05) type = 'land';
      else if (roll < 0.15) type = 'studio';
      else if (roll < 0.35) type = 'apartment';
      else if (roll < 0.42) type = 'penthouse';
      else if (roll < 0.52) type = 'townhouse';
      else if (roll < 0.65) type = 'house';
      else if (roll < 0.75) type = 'villa';
      else if (roll < 0.80) type = 'mansion';
      else if (roll < 0.92) type = 'commercial';
      else type = 'warehouse';

      const prop = this.generateProperty(cityId, type);
      if (prop) properties.push(prop);
    }

    return properties;
  },

  // Format currency
  formatMoney(amount) {
    if (Math.abs(amount) >= 1000000) {
      return '€' + (amount / 1000000).toFixed(2) + 'M';
    }
    return '€' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  },

  // Format short money
  formatMoneyShort(amount) {
    if (Math.abs(amount) >= 1000000) {
      return '€' + (amount / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(amount) >= 1000) {
      return '€' + (amount / 1000).toFixed(0) + 'K';
    }
    return '€' + Math.round(amount);
  },

  // ---- Banks & Loan Products ----
  banks: [
    {
      id: 'global_trust', name: 'Global Trust Bank', icon: '🏦',
      description: 'Conservative rates, reliable service.',
      baseRate: 0.045, maxLoanPct: 0.6, termMonths: [12, 24, 60, 120],
      rateVariance: 0.005
    },
    {
      id: 'metro_finance', name: 'Metro Finance', icon: '🏛️',
      description: 'Competitive rates for property investors.',
      baseRate: 0.038, maxLoanPct: 0.7, termMonths: [12, 36, 60, 120],
      rateVariance: 0.008
    },
    {
      id: 'pacific_capital', name: 'Pacific Capital', icon: '💎',
      description: 'Premium banking for high-value portfolios.',
      baseRate: 0.032, maxLoanPct: 0.8, termMonths: [24, 60, 120, 240],
      rateVariance: 0.006,
      minNetWorth: 1000000
    },
    {
      id: 'rapid_lending', name: 'Rapid Lending', icon: '⚡',
      description: 'Fast approval, higher rates. No questions asked.',
      baseRate: 0.065, maxLoanPct: 0.5, termMonths: [6, 12, 24, 36],
      rateVariance: 0.01
    }
  ],

  // ---- Business Types (for shops/manufacturing/stakes) ----
  businessTypes: {
    shop: {
      id: 'shop', name: 'Retail Shop', icon: '🛍️',
      description: 'Street-level retail. Steady foot traffic.',
      basePriceRange: [50000, 300000],
      baseRevenueYield: 0.08,
      riskFactor: 0.15,
      employeeRange: [2, 10]
    },
    restaurant: {
      id: 'restaurant', name: 'Restaurant', icon: '🍽️',
      description: 'Food & dining. High revenue, high costs.',
      basePriceRange: [80000, 500000],
      baseRevenueYield: 0.10,
      riskFactor: 0.25,
      employeeRange: [5, 25]
    },
    hotel: {
      id: 'hotel', name: 'Hotel', icon: '🏨',
      description: 'Hospitality business. Tourism dependent.',
      basePriceRange: [500000, 5000000],
      baseRevenueYield: 0.07,
      riskFactor: 0.20,
      employeeRange: [15, 80]
    },
    tech_startup: {
      id: 'tech_startup', name: 'Tech Startup', icon: '💻',
      description: 'High risk, potentially huge returns.',
      basePriceRange: [100000, 2000000],
      baseRevenueYield: 0.15,
      riskFactor: 0.40,
      employeeRange: [5, 50]
    },
    factory: {
      id: 'factory', name: 'Factory', icon: '🏭',
      description: 'Manufacturing. Stable but capital intensive.',
      basePriceRange: [300000, 3000000],
      baseRevenueYield: 0.06,
      riskFactor: 0.10,
      employeeRange: [20, 200]
    },
    gym: {
      id: 'gym', name: 'Fitness Centre', icon: '🏋️',
      description: 'Health & fitness. Growing market.',
      basePriceRange: [60000, 400000],
      baseRevenueYield: 0.09,
      riskFactor: 0.15,
      employeeRange: [3, 15]
    },
    supermarket: {
      id: 'supermarket', name: 'Supermarket', icon: '🛒',
      description: 'Grocery retail. Essential, recession-proof.',
      basePriceRange: [200000, 1500000],
      baseRevenueYield: 0.05,
      riskFactor: 0.05,
      employeeRange: [10, 60]
    },
    nightclub: {
      id: 'nightclub', name: 'Nightclub', icon: '🎶',
      description: 'Nightlife venue. High margins, volatile.',
      basePriceRange: [100000, 800000],
      baseRevenueYield: 0.12,
      riskFactor: 0.30,
      employeeRange: [5, 30]
    }
  },

  // Generate a business for a city
  generateBusiness(cityId, type) {
    const city = this.cities.find(c => c.id === cityId);
    const typeDef = this.businessTypes[type];
    if (!city || !typeDef) return null;

    const [minP, maxP] = typeDef.basePriceRange;
    const baseValue = minP + Math.random() * (maxP - minP);
    const value = Math.round(baseValue * city.priceMultiplier / 1000) * 1000;

    const districts = this.districts[cityId] || ['Central'];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];

    const [minEmp, maxEmp] = typeDef.employeeRange;
    const employees = Math.round(minEmp + Math.random() * (maxEmp - minEmp));

    const monthlyRevenue = Math.round((value * typeDef.baseRevenueYield * city.rentYield * 10) / 12);
    const monthlyExpenses = Math.round(monthlyRevenue * (0.5 + Math.random() * 0.25));

    return {
      id: 'biz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      cityId,
      type,
      name: adj + ' ' + typeDef.name + ' — ' + district,
      district,
      totalValue: value,
      employees,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      riskFactor: typeDef.riskFactor,
      performance: 1.0, // 1.0 = normal, fluctuates
      availableStake: 100, // % available for purchase
      isNew: true
    };
  }
};
