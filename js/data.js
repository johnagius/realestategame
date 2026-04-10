/* ========================================
   PROPERTY EMPIRE - Game Data
   ======================================== */

const GameData = {

  // ---- Historical Eras ----
  eras: [
    {
      id: 'pre_industrial', name: 'Pre-Industrial Era', years: [1750, 1799],
      icon: '🏰', color: '#8B7355',
      description: 'Land and agriculture dominate. Cities are small trading hubs.',
      propertyMultiplier: 0.0003, rentMultiplier: 1.0, businessTypes: ['farm', 'tavern', 'market', 'workshop'],
      features: { stocks: false, mergers: false, playerBanks: false, factories: false }
    },
    {
      id: 'industrial_revolution', name: 'Industrial Revolution', years: [1800, 1869],
      icon: '🏭', color: '#6B4423',
      description: 'Steam power transforms cities. Factories and railways emerge.',
      propertyMultiplier: 0.002, rentMultiplier: 1.0, businessTypes: ['farm', 'tavern', 'market', 'workshop', 'factory', 'textile_mill', 'railway'],
      features: { stocks: true, mergers: false, playerBanks: false, factories: true }
    },
    {
      id: 'gilded_age', name: 'The Gilded Age', years: [1870, 1929],
      icon: '🎩', color: '#DAA520',
      description: 'Robber barons and tycoons. Banks, steel, and oil reshape the world.',
      propertyMultiplier: 0.01, rentMultiplier: 1.0, businessTypes: ['market', 'factory', 'textile_mill', 'railway', 'steel_works', 'oil_company', 'department_store', 'hotel'],
      features: { stocks: true, mergers: true, playerBanks: true, factories: true }
    },
    {
      id: 'modern_era', name: 'Modern Era', years: [1930, 1979],
      icon: '🏙️', color: '#4682B4',
      description: 'Suburbs, highways, and consumer culture. Real estate booms.',
      propertyMultiplier: 0.1, rentMultiplier: 1.0, businessTypes: ['factory', 'hotel', 'department_store', 'supermarket', 'restaurant', 'oil_company', 'auto_dealer', 'airline'],
      features: { stocks: true, mergers: true, playerBanks: true, factories: true }
    },
    {
      id: 'information_age', name: 'Information Age', years: [1980, 2030],
      icon: '💻', color: '#2C6E49',
      description: 'Technology, globalisation, and mega-cities. The world is connected.',
      propertyMultiplier: 1.0, rentMultiplier: 1.0, businessTypes: ['hotel', 'restaurant', 'supermarket', 'tech_startup', 'gym', 'nightclub', 'shop', 'factory'],
      features: { stocks: true, mergers: true, playerBanks: true, factories: true }
    }
  ],

  startingYear: 1750,

  // ---- Playable Families ----
  families: [
    {
      id: 'silva', name: 'The Silva Family', icon: '👨‍👩‍👧‍👦', tier: 'humble',
      description: 'Peasant farmers in 1750. Build a dynasty from the soil up.',
      startingCash: 200, difficulty: 'Hard',
      motto: '"From nothing, we build everything."',
      color: '#7B6D4E'
    },
    {
      id: 'chen', name: 'The Chen Family', icon: '👨‍👩‍👦', tier: 'middle',
      description: 'Merchants with a small trading post. Ambition runs in the blood.',
      startingCash: 500, difficulty: 'Normal',
      motto: '"Patience and persistence pay dividends."',
      color: '#2C6E49'
    },
    {
      id: 'armstrong', name: 'The Armstrongs', icon: '👫', tier: 'wealthy',
      description: 'Minor aristocrats with land holdings. Grow the family fortune.',
      startingCash: 1500, difficulty: 'Easy',
      motto: '"Fortune favours the bold."',
      color: '#3D5A80'
    },
    {
      id: 'vanderbilt', name: 'The Vanderbilts', icon: '🎩', tier: 'elite',
      description: 'Wealthy colonial merchants. An empire awaits.',
      startingCash: 5000, difficulty: 'Sandbox',
      motto: '"We don\'t play the market — we ARE the market."',
      color: '#D4A84B'
    }
  ],

  // ---- AI Competitor Families ----
  aiFamilies: [
    { id: 'rothschild', name: 'The Rothschilds', icon: '🏛️', color: '#1B4D33',
      aggressiveness: 0.7, riskTolerance: 0.5, startingWealth: 2000,
      motto: 'European banking dynasty since 1744.' },
    { id: 'wong', name: 'The Wong Dynasty', icon: '🐉', color: '#C41E3A',
      aggressiveness: 0.8, riskTolerance: 0.6, startingWealth: 1500,
      motto: 'Silk Road merchants and traders.' },
    { id: 'al_rashid', name: 'The Al-Rashids', icon: '🕌', color: '#DAA520',
      aggressiveness: 0.6, riskTolerance: 0.4, startingWealth: 3000,
      motto: 'Arabian trade route masters.' },
    { id: 'petrov', name: 'The Petrovs', icon: '🐻', color: '#4169E1',
      aggressiveness: 0.9, riskTolerance: 0.8, startingWealth: 1200,
      motto: 'Russian fur trade magnates.' },
    { id: 'martinez', name: 'The Bourbon-Martinez', icon: '⚜️', color: '#E07A5F',
      aggressiveness: 0.5, riskTolerance: 0.3, startingWealth: 800,
      motto: 'Colonial landowners.' },
    { id: 'okonkwo', name: 'The Okonkwos', icon: '🌍', color: '#2A9D8F',
      aggressiveness: 0.65, riskTolerance: 0.5, startingWealth: 400,
      motto: 'West African trade pioneers.' }
  ],

  // ---- City Landmarks ----
  cityLandmarks: {
    new_york:    { landmark: '🗽', skyline: '🏙️', feature: 'Statue of Liberty' },
    london:      { landmark: '🎡', skyline: '🏰', feature: 'Big Ben' },
    paris:       { landmark: '🗼', skyline: '🏛️', feature: 'Eiffel Tower' },
    tokyo:       { landmark: '⛩️', skyline: '🗼', feature: 'Tokyo Tower' },
    dubai:       { landmark: '🏗️', skyline: '🌇', feature: 'Burj Khalifa' },
    singapore:   { landmark: '🦁', skyline: '🏙️', feature: 'Marina Bay' },
    hong_kong:   { landmark: '🌉', skyline: '🏙️', feature: 'Victoria Harbour' },
    sydney:      { landmark: '🎭', skyline: '🌊', feature: 'Opera House' },
    los_angeles: { landmark: '🎬', skyline: '🌴', feature: 'Hollywood Sign' },
    miami:       { landmark: '🌴', skyline: '🏖️', feature: 'South Beach' },
    barcelona:   { landmark: '⛪', skyline: '🏖️', feature: 'Sagrada Familia' },
    rome:        { landmark: '🏛️', skyline: '⛲', feature: 'Colosseum' },
    berlin:      { landmark: '🚪', skyline: '🏗️', feature: 'Brandenburg Gate' },
    amsterdam:   { landmark: '🌷', skyline: '🚲', feature: 'Canal Houses' },
    toronto:     { landmark: '🗼', skyline: '🍁', feature: 'CN Tower' },
    monaco:      { landmark: '🎰', skyline: '🛥️', feature: 'Monte Carlo Casino' },
    shanghai:    { landmark: '🏯', skyline: '🌃', feature: 'Oriental Pearl Tower' },
    mumbai:      { landmark: '🕌', skyline: '🌆', feature: 'Gateway of India' },
    sao_paulo:   { landmark: '🎨', skyline: '🌆', feature: 'Ibirapuera Park' },
    cape_town:   { landmark: '⛰️', skyline: '🌊', feature: 'Table Mountain' }
  },

  // ---- 20 World Cities ----
  cities: [
    {
      id: 'new_york', name: 'New York', country: 'United States', flag: '🇺🇸',
      description: 'The city that never sleeps. Premium real estate with sky-high demand.',
      priceMultiplier: 2.2, rentYield: 0.08, taxRate: 0.08, growthRate: 0.03,
      inflationRate: 0.025, tier: 1, maxProperties: 15
    },
    {
      id: 'london', name: 'London', country: 'United Kingdom', flag: '🇬🇧',
      description: 'Historic and prestigious. A global hub for luxury property.',
      priceMultiplier: 2.0, rentYield: 0.075, taxRate: 0.07, growthRate: 0.025,
      inflationRate: 0.022, tier: 1, maxProperties: 15
    },
    {
      id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷',
      description: 'The City of Light. Elegant apartments and charming townhouses.',
      priceMultiplier: 1.7, rentYield: 0.07, taxRate: 0.08, growthRate: 0.02,
      inflationRate: 0.020, tier: 1, maxProperties: 14
    },
    {
      id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵',
      description: 'Ultra-modern metropolis. High density, high returns.',
      priceMultiplier: 1.8, rentYield: 0.08, taxRate: 0.06, growthRate: 0.02,
      inflationRate: 0.015, tier: 1, maxProperties: 14
    },
    {
      id: 'dubai', name: 'Dubai', country: 'UAE', flag: '🇦🇪',
      description: 'Luxury paradise with zero income tax. Bold architecture.',
      priceMultiplier: 1.5, rentYield: 0.10, taxRate: 0.04, growthRate: 0.04,
      inflationRate: 0.030, tier: 1, maxProperties: 14
    },
    {
      id: 'singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬',
      description: 'Compact city-state with premium property at a premium.',
      priceMultiplier: 1.8, rentYield: 0.07, taxRate: 0.07, growthRate: 0.025,
      inflationRate: 0.018, tier: 2, maxProperties: 12
    },
    {
      id: 'hong_kong', name: 'Hong Kong', country: 'China', flag: '🇭🇰',
      description: 'One of the world\'s most expensive property markets.',
      priceMultiplier: 2.5, rentYield: 0.11, taxRate: 0.06, growthRate: 0.02,
      inflationRate: 0.020, tier: 1, maxProperties: 12
    },
    {
      id: 'sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺',
      description: 'Harbour city with stunning coastal properties.',
      priceMultiplier: 1.6, rentYield: 0.08, taxRate: 0.07, growthRate: 0.03,
      inflationRate: 0.028, tier: 2, maxProperties: 13
    },
    {
      id: 'los_angeles', name: 'Los Angeles', country: 'United States', flag: '🇺🇸',
      description: 'Hollywood glamour meets beachfront living.',
      priceMultiplier: 1.5, rentYield: 0.08, taxRate: 0.07, growthRate: 0.03,
      inflationRate: 0.026, tier: 2, maxProperties: 14
    },
    {
      id: 'miami', name: 'Miami', country: 'United States', flag: '🇺🇸',
      description: 'Tropical vibes with booming luxury condo market.',
      priceMultiplier: 1.3, rentYield: 0.09, taxRate: 0.06, growthRate: 0.035,
      inflationRate: 0.028, tier: 2, maxProperties: 14
    },
    {
      id: 'barcelona', name: 'Barcelona', country: 'Spain', flag: '🇪🇸',
      description: 'Mediterranean charm with strong tourism demand.',
      priceMultiplier: 1.2, rentYield: 0.09, taxRate: 0.08, growthRate: 0.025,
      inflationRate: 0.024, tier: 2, maxProperties: 13
    },
    {
      id: 'rome', name: 'Rome', country: 'Italy', flag: '🇮🇹',
      description: 'The Eternal City. Historic properties with timeless appeal.',
      priceMultiplier: 1.0, rentYield: 0.085, taxRate: 0.09, growthRate: 0.015,
      inflationRate: 0.022, tier: 2, maxProperties: 13
    },
    {
      id: 'berlin', name: 'Berlin', country: 'Germany', flag: '🇩🇪',
      description: 'Affordable and hip. Rapid gentrification creates opportunity.',
      priceMultiplier: 1.0, rentYield: 0.09, taxRate: 0.07, growthRate: 0.035,
      inflationRate: 0.020, tier: 3, maxProperties: 14
    },
    {
      id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱',
      description: 'Canal houses and modern living. Tight supply, high demand.',
      priceMultiplier: 1.3, rentYield: 0.08, taxRate: 0.08, growthRate: 0.02,
      inflationRate: 0.019, tier: 2, maxProperties: 12
    },
    {
      id: 'toronto', name: 'Toronto', country: 'Canada', flag: '🇨🇦',
      description: 'North America\'s fastest growing city. Condo boom.',
      priceMultiplier: 1.3, rentYield: 0.085, taxRate: 0.06, growthRate: 0.03,
      inflationRate: 0.025, tier: 2, maxProperties: 14
    },
    {
      id: 'monaco', name: 'Monaco', country: 'Monaco', flag: '🇲🇨',
      description: 'The world\'s most exclusive address. Ultra-luxury only.',
      priceMultiplier: 3.0, rentYield: 0.05, taxRate: 0.03, growthRate: 0.02,
      inflationRate: 0.012, tier: 1, maxProperties: 8
    },
    {
      id: 'shanghai', name: 'Shanghai', country: 'China', flag: '🇨🇳',
      description: 'Financial powerhouse with explosive growth potential.',
      priceMultiplier: 1.2, rentYield: 0.08, taxRate: 0.06, growthRate: 0.04,
      inflationRate: 0.025, tier: 2, maxProperties: 15
    },
    {
      id: 'mumbai', name: 'Mumbai', country: 'India', flag: '🇮🇳',
      description: 'Bollywood capital. Extreme density, extreme opportunity.',
      priceMultiplier: 0.7, rentYield: 0.10, taxRate: 0.07, growthRate: 0.05,
      inflationRate: 0.055, tier: 3, maxProperties: 15
    },
    {
      id: 'sao_paulo', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷',
      description: 'South America\'s financial hub. Affordable entry, high growth.',
      priceMultiplier: 0.6, rentYield: 0.11, taxRate: 0.06, growthRate: 0.045,
      inflationRate: 0.050, tier: 3, maxProperties: 15
    },
    {
      id: 'cape_town', name: 'Cape Town', country: 'South Africa', flag: '🇿🇦',
      description: 'Stunning scenery with bargain properties. High growth potential.',
      priceMultiplier: 0.5, rentYield: 0.12, taxRate: 0.05, growthRate: 0.05,
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
  // Coords as % of 1200x600 SVG viewBox
  // Coords as % of 1600x800 viewBox — matched to new atlas continents
  cityCoords: {
    new_york:    { x: 22, y: 25 },
    london:      { x: 39, y: 12 },
    paris:       { x: 41, y: 15 },
    tokyo:       { x: 76, y: 22 },
    dubai:       { x: 53, y: 30 },
    singapore:   { x: 69, y: 48 },
    hong_kong:   { x: 71, y: 28 },
    sydney:      { x: 80, y: 70 },
    los_angeles: { x: 11, y: 25 },
    miami:       { x: 20, y: 42 },
    barcelona:   { x: 40, y: 21 },
    rome:        { x: 44, y: 22 },
    berlin:      { x: 44, y: 12 },
    amsterdam:   { x: 40, y: 11 },
    toronto:     { x: 19, y: 20 },
    monaco:      { x: 42, y: 20 },
    shanghai:    { x: 70, y: 24 },
    mumbai:      { x: 58, y: 38 },
    sao_paulo:   { x: 24, y: 60 },
    cape_town:   { x: 45, y: 68 }
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
      id: 'market_downturn',
      title: 'Market Downturn',
      icon: '📉',
      description: 'Economic uncertainty hits {city}\'s property market. Values dip.',
      effect: { type: 'city_value_change', value: -0.08 },
      probability: 0.04
    },
    {
      id: 'market_crash',
      title: 'Market Crash!',
      icon: '💥',
      description: 'Panic selling triggers a severe crash in {city}. Property values plummet!',
      effect: { type: 'city_crash', value: -0.20 },
      probability: 0.012
    },
    {
      id: 'global_recession',
      title: 'Global Recession!',
      icon: '🌍💥',
      description: 'A worldwide economic recession hammers all markets. Values drop sharply everywhere.',
      effect: { type: 'global_crash', value: -0.15 },
      probability: 0.006
    },
    {
      id: 'housing_bubble_burst',
      title: 'Housing Bubble Burst!',
      icon: '🫧',
      description: 'The property bubble in {city} has burst! Prices collapse as buyers vanish.',
      effect: { type: 'city_crash', value: -0.30 },
      probability: 0.005
    },
    {
      id: 'business_sector_crash',
      title: 'Business Sector Crash',
      icon: '📊',
      description: 'Corporate failures cascade through {city}. Businesses lose major value.',
      effect: { type: 'city_business_crash', value: -0.25 },
      probability: 0.015
    },
    {
      id: 'currency_crisis',
      title: 'Currency Crisis',
      icon: '💱',
      description: 'Currency devaluation in {city}\'s region. Foreign investors pull out.',
      effect: { type: 'city_crash', value: -0.12 },
      probability: 0.015
    },
    {
      id: 'banking_crisis',
      title: 'Banking Crisis',
      icon: '🏦💥',
      description: 'Banking sector collapses in {city}. Credit dries up, market freezes.',
      effect: { type: 'city_crash', value: -0.18 },
      probability: 0.008
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

  // ---- Historical Events (scripted, year-triggered, with choices) ----
  historicalEvents: [
    // Pre-Industrial
    { year: 1756, title: 'Seven Years War', icon: '⚔️', description: 'Global conflict disrupts trade routes. European property values shaken.',
      choices: [
        { label: 'Invest in war supplies (risky but profitable)', effect: { type: 'gamble', amount: 0.15, risk: 35 } },
        { label: 'Sell European properties for safety', effect: { type: 'city_crash', cities: ['london','paris','berlin','amsterdam'], value: -0.08 } },
        { label: 'Hold steady and wait it out', effect: { type: 'none' } }
      ]},
    { year: 1776, title: 'American Independence', icon: '🗽', description: 'The American colonies declare independence. New York property market is volatile.',
      choices: [
        { label: 'Buy cheap in revolutionary New York', effect: { type: 'city_discount', city: 'new_york', value: 0.25 } },
        { label: 'Invest in London (loyalist capital flows)', effect: { type: 'city_boost', city: 'london', value: 0.1 } },
        { label: 'Stay neutral', effect: { type: 'none' } }
      ]},
    { year: 1789, title: 'French Revolution', icon: '🔥', description: 'Revolution in Paris! Aristocratic properties seized. Chaos in French markets.',
      choices: [
        { label: 'Buy seized estates at auction (cheap but risky)', effect: { type: 'city_discount', city: 'paris', value: 0.4 } },
        { label: 'Flee French markets entirely', effect: { type: 'city_crash', cities: ['paris','monaco'], value: -0.15 } },
        { label: 'Donate to the revolution (gain reputation)', effect: { type: 'reputation', value: 15, cost: 0.05 } }
      ]},
    // Industrial Revolution
    { year: 1804, title: 'Napoleonic Wars Escalate', icon: '⚔️', description: 'Napoleon conquers Europe. Continental trade blockades disrupt commerce.',
      choices: [
        { label: 'Smuggle goods past blockade (very risky, very profitable)', effect: { type: 'gamble', amount: 0.25, risk: 45 } },
        { label: 'Invest in British naval power', effect: { type: 'city_boost', city: 'london', value: 0.12 } },
        { label: 'Wait for peace', effect: { type: 'none' } }
      ]},
    { year: 1825, title: 'Railway Mania Begins', icon: '🚂', description: 'Railway stocks are booming! Everyone is investing. Is it a bubble?',
      choices: [
        { label: 'Invest heavily in railways', effect: { type: 'gamble', amount: 0.2, risk: 30 } },
        { label: 'Buy land near proposed railway routes', effect: { type: 'global_boost', value: 0.05 } },
        { label: 'This is a bubble — stay away', effect: { type: 'none' } }
      ]},
    { year: 1848, title: 'Revolutions Across Europe', icon: '🔥', description: 'Popular uprisings sweep Paris, Berlin, Rome, Barcelona. Markets panic.',
      choices: [
        { label: 'Buy the dip — revolution creates opportunity', effect: { type: 'city_discount', city: 'paris', value: 0.3 } },
        { label: 'Move assets to stable London/New York', effect: { type: 'city_boost', city: 'new_york', value: 0.08 } },
        { label: 'Support the revolutionaries (+reputation)', effect: { type: 'reputation', value: 12, cost: 0.03 } }
      ]},
    // Gilded Age
    { year: 1873, title: 'The Long Depression', icon: '📉', description: 'A devastating global depression begins. Property values crash worldwide.',
      choices: [
        { label: 'Sell everything before it gets worse', effect: { type: 'global_crash', value: -0.12 } },
        { label: 'Buy distressed assets at rock bottom', effect: { type: 'global_discount', value: 0.2 } },
        { label: 'Hoard cash and wait', effect: { type: 'none' } }
      ]},
    { year: 1886, title: 'Statue of Liberty Unveiled', icon: '🗽', description: 'New York becomes the symbol of opportunity. Immigration drives property demand.',
      choices: [
        { label: 'Invest in New York tenements', effect: { type: 'city_boost', city: 'new_york', value: 0.15 } },
        { label: 'Build worker housing (+reputation, lower returns)', effect: { type: 'reputation', value: 10, cost: 0.02 } },
        { label: 'Focus elsewhere', effect: { type: 'none' } }
      ]},
    { year: 1914, title: 'World War I', icon: '💥', description: 'The Great War erupts. European property values plummet. Industry booms in the Americas.',
      choices: [
        { label: 'Sell European holdings, buy American', effect: { type: 'city_crash', cities: ['london','paris','berlin','rome','amsterdam'], value: -0.15 } },
        { label: 'Invest in wartime manufacturing', effect: { type: 'gamble', amount: 0.2, risk: 25 } },
        { label: 'Hold and pray for peace', effect: { type: 'none' } }
      ]},
    { year: 1929, title: 'Wall Street Crash', icon: '💥', description: 'Black Tuesday! Stock market collapses. The Great Depression begins.',
      choices: [
        { label: 'Panic sell everything', effect: { type: 'global_crash', value: -0.25 } },
        { label: 'Buy when others are fearful', effect: { type: 'global_discount', value: 0.3 } },
        { label: 'Move to gold and cash', effect: { type: 'none' } }
      ]},
    // Modern Era
    { year: 1939, title: 'World War II', icon: '💥', description: 'Global war. European cities devastated. Massive post-war rebuilding ahead.',
      choices: [
        { label: 'Invest in military industry', effect: { type: 'gamble', amount: 0.25, risk: 20 } },
        { label: 'Buy bombed-out European properties cheaply', effect: { type: 'city_discount', city: 'london', value: 0.35 } },
        { label: 'Wait for the war to end', effect: { type: 'none' } }
      ]},
    { year: 1955, title: 'Post-War Boom', icon: '🏠', description: 'Suburbs explode. Consumer culture drives housing demand worldwide.',
      choices: [
        { label: 'Build suburban housing developments', effect: { type: 'global_boost', value: 0.1 } },
        { label: 'Invest in commercial real estate (shopping malls)', effect: { type: 'gamble', amount: 0.15, risk: 15 } },
        { label: 'Focus on city center properties', effect: { type: 'none' } }
      ]},
    { year: 1973, title: 'Oil Crisis', icon: '🛢️', description: 'OPEC embargo sends oil prices soaring. Global recession follows.',
      choices: [
        { label: 'Invest in Dubai oil wealth', effect: { type: 'city_boost', city: 'dubai', value: 0.2 } },
        { label: 'Sell energy-dependent properties', effect: { type: 'global_crash', value: -0.08 } },
        { label: 'Diversify into commodities', effect: { type: 'none' } }
      ]},
    // Information Age
    { year: 1989, title: 'Fall of the Berlin Wall', icon: '🚪', description: 'The Cold War ends! Berlin property market opens up. Reunification boom.',
      choices: [
        { label: 'Rush to buy in East Berlin', effect: { type: 'city_discount', city: 'berlin', value: 0.4 } },
        { label: 'Invest across emerging Eastern Europe', effect: { type: 'global_boost', value: 0.06 } },
        { label: 'Watch and wait — too uncertain', effect: { type: 'none' } }
      ]},
    { year: 2000, title: 'Dot-Com Bubble Bursts', icon: '💻', description: 'Tech stocks collapse! Silicon Valley in crisis. Traditional real estate holds.',
      choices: [
        { label: 'Buy cheap tech company offices', effect: { type: 'city_discount', city: 'los_angeles', value: 0.25 } },
        { label: 'Double down on safe property', effect: { type: 'global_boost', value: 0.05 } },
        { label: 'Invest in the surviving tech giants', effect: { type: 'gamble', amount: 0.2, risk: 30 } }
      ]},
    { year: 2008, title: 'Global Financial Crisis', icon: '🏦', description: 'Subprime mortgage collapse! Banks fail. Property values crash 30-50% worldwide.',
      choices: [
        { label: 'Buy the crash — once in a lifetime opportunity', effect: { type: 'global_discount', value: 0.35 } },
        { label: 'Sell before it gets worse', effect: { type: 'global_crash', value: -0.2 } },
        { label: 'Hold and ride it out', effect: { type: 'global_crash', value: -0.1 } }
      ]},
    { year: 2020, title: 'Global Pandemic', icon: '🦠', description: 'COVID-19 shuts down the world. Tourism collapses. Remote work changes everything.',
      choices: [
        { label: 'Sell tourist/hotel properties', effect: { type: 'city_crash', cities: ['dubai','barcelona','rome','miami'], value: -0.15 } },
        { label: 'Buy suburban/residential (remote work boom)', effect: { type: 'global_boost', value: 0.08 } },
        { label: 'Wait for vaccines', effect: { type: 'none' } }
      ]}
  ],

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

    // Apply era multiplier to scale prices to the current time period
    const currentEra = this.eras.find(e => {
      const year = (typeof GameEngine !== 'undefined' && GameEngine.state) ? GameEngine.state.year : (this.startingYear || 1750);
      return year >= e.years[0] && year <= e.years[1];
    }) || this.eras[0];
    const eraMultiplier = currentEra.propertyMultiplier || 1;

    const [minPrice, maxPrice] = typeDef.basePriceRange;
    const basePrice = minPrice + Math.random() * (maxPrice - minPrice);
    const price = Math.max(1, Math.round(basePrice * city.priceMultiplier * eraMultiplier));

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

    // Licensing fee — scale with property value (1% annually), not fixed
    const annualLicense = Math.round(price * 0.01);
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
    if (Math.abs(amount) >= 1000) {
      return '€' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    // Small amounts (early era) — show with decimals if needed
    if (Math.abs(amount) < 1) return '€' + amount.toFixed(2);
    return '€' + amount.toLocaleString('en-US', { maximumFractionDigits: amount < 100 ? 1 : 0 });
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
    },
    // Historical business types
    farm: {
      id: 'farm', name: 'Farm', icon: '🌾',
      description: 'Agricultural land. The backbone of pre-industrial wealth.',
      basePriceRange: [100, 2000],
      baseRevenueYield: 0.06,
      riskFactor: 0.20,
      employeeRange: [2, 20]
    },
    tavern: {
      id: 'tavern', name: 'Tavern', icon: '🍺',
      description: 'A drinking house. Steady custom from locals and travellers.',
      basePriceRange: [50, 500],
      baseRevenueYield: 0.10,
      riskFactor: 0.15,
      employeeRange: [2, 8]
    },
    market: {
      id: 'market', name: 'Trading Post', icon: '⚖️',
      description: 'Buy and sell goods. Profits depend on trade routes.',
      basePriceRange: [200, 3000],
      baseRevenueYield: 0.09,
      riskFactor: 0.20,
      employeeRange: [2, 12]
    },
    workshop: {
      id: 'workshop', name: 'Workshop', icon: '🔨',
      description: 'Craftsmen producing goods by hand. Skilled labour.',
      basePriceRange: [100, 1000],
      baseRevenueYield: 0.08,
      riskFactor: 0.10,
      employeeRange: [3, 15]
    },
    textile_mill: {
      id: 'textile_mill', name: 'Textile Mill', icon: '🧵',
      description: 'Mechanised cloth production. The first factories.',
      basePriceRange: [5000, 50000],
      baseRevenueYield: 0.09,
      riskFactor: 0.15,
      employeeRange: [20, 200]
    },
    railway: {
      id: 'railway', name: 'Railway Company', icon: '🚂',
      description: 'Steel rails connecting cities. Enormous capital required.',
      basePriceRange: [50000, 500000],
      baseRevenueYield: 0.07,
      riskFactor: 0.25,
      employeeRange: [50, 500]
    },
    steel_works: {
      id: 'steel_works', name: 'Steel Works', icon: '⚒️',
      description: 'Forging the industrial age. Huge scale, huge profits.',
      basePriceRange: [100000, 2000000],
      baseRevenueYield: 0.08,
      riskFactor: 0.15,
      employeeRange: [100, 1000]
    },
    oil_company: {
      id: 'oil_company', name: 'Oil Company', icon: '🛢️',
      description: 'Black gold. The most valuable commodity on earth.',
      basePriceRange: [200000, 5000000],
      baseRevenueYield: 0.10,
      riskFactor: 0.25,
      employeeRange: [50, 500]
    },
    department_store: {
      id: 'department_store', name: 'Department Store', icon: '🏬',
      description: 'Grand retail palace. A cathedral of commerce.',
      basePriceRange: [50000, 1000000],
      baseRevenueYield: 0.07,
      riskFactor: 0.12,
      employeeRange: [20, 200]
    },
    auto_dealer: {
      id: 'auto_dealer', name: 'Auto Dealership', icon: '🚗',
      description: 'Selling the American dream on four wheels.',
      basePriceRange: [100000, 800000],
      baseRevenueYield: 0.08,
      riskFactor: 0.18,
      employeeRange: [10, 50]
    },
    airline: {
      id: 'airline', name: 'Airline', icon: '✈️',
      description: 'Connecting the world by air. Capital intensive.',
      basePriceRange: [500000, 10000000],
      baseRevenueYield: 0.05,
      riskFactor: 0.30,
      employeeRange: [100, 2000]
    }
  },

  // ---- Stock control thresholds (real-world based) ----
  controlThresholds: {
    minority: 5,        // 5%+ = minority stake, can attend meetings
    significant: 10,    // 10%+ = significant influence, board seat possible
    blocking: 25,       // 25%+ = blocking minority, can veto major decisions
    controlling: 51,    // 51%+ = controlling interest, run the business
    supermajority: 75,  // 75%+ = supermajority, can force mergers/changes
    full: 100           // 100% = full ownership
  },

  // Generate a business for a city
  generateBusiness(cityId, type) {
    const city = this.cities.find(c => c.id === cityId);
    const typeDef = this.businessTypes[type];
    if (!city || !typeDef) return null;

    const currentEra = this.eras.find(e => {
      const year = (typeof GameEngine !== 'undefined' && GameEngine.state) ? GameEngine.state.year : (this.startingYear || 1750);
      return year >= e.years[0] && year <= e.years[1];
    }) || this.eras[0];
    const eraMultiplier = currentEra.propertyMultiplier || 1;

    const [minP, maxP] = typeDef.basePriceRange;
    const baseValue = minP + Math.random() * (maxP - minP);
    const value = Math.max(5, Math.round(baseValue * city.priceMultiplier * eraMultiplier));

    const districts = this.districts[cityId] || ['Central'];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];

    const [minEmp, maxEmp] = typeDef.employeeRange;
    const employees = Math.round(minEmp + Math.random() * (maxEmp - minEmp));

    const monthlyRevenue = Math.max(1, Math.round((value * typeDef.baseRevenueYield) / 12));
    const monthlyExpenses = Math.round(monthlyRevenue * (0.35 + Math.random() * 0.25));

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
