export const PROFESSIONS = [
  {
    name: 'Alchemy',
    color: '#C77DFF',
    bg: 'rgba(199,125,255,0.12)',
    border: 'rgba(199,125,255,0.30)',
    // keywords matched against the item name (high confidence)
    keywords: [
      'potion', 'flask', 'elixir', 'transmute', 'cauldron', 'tincture',
      'brew', 'draught', 'philter', 'catalyst', 'infusion', 'distillate',
      'concoction', 'salve', 'antidote', 'remedy',
    ],
    // keywords matched against reagent names (medium confidence)
    reagentKeywords: [
      'vial', 'crystal vial', 'imbued vial', 'empty vial', 'leaded vial',
    ],
  },
  {
    name: 'Blacksmithing',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.12)',
    border: 'rgba(255,107,107,0.30)',
    keywords: [
      'plate', 'breastplate', 'gauntlets', 'greaves', 'sabatons', 'vambraces',
      'helm', 'shield', 'sword', 'axe', 'mace', 'hammer', 'blade', 'halberd',
      'spear', 'dagger', 'chainmail', 'hauberk', 'spaulders', 'buckler',
      'claymore', 'broadsword', 'warhammer', 'pike', 'glaive', 'saber',
      'long sword', 'short sword', 'two-handed', 'one-handed',
    ],
    reagentKeywords: [
      'bar', 'ingot', 'coal', 'flux', 'mithril', 'thorium', 'truesilver',
      'dark iron', 'fel iron', 'cobalt', 'saronite', 'titanium', 'elementium',
      'ghost iron', 'trillium', 'leystone', 'felslate', 'monelite',
      'storm silver', 'platinum', 'laestrite', 'shadowghast', 'draconium',
      'khaz\'gorite', 'serevite', 'primal molten',
    ],
  },
  {
    name: 'Enchanting',
    color: '#74B9FF',
    bg: 'rgba(116,185,255,0.12)',
    border: 'rgba(116,185,255,0.30)',
    keywords: [
      'enchant', 'scroll', 'vellum', 'wand', 'runed', 'spellthread',
      'permanent enchantment', 'formula', 'runic',
    ],
    reagentKeywords: [
      'dust', 'essence', 'shard', 'crystal', 'void crystal', 'nexus crystal',
      'large brilliant', 'small brilliant', 'illusion dust', 'infinite dust',
      'abyss crystal', 'cosmic essence', 'heavenly shard', 'mysterious essence',
      'hypnotic dust', 'sha crystal', 'draenic dust', 'arkhana', 'leylight',
      'chaos crystal', 'umbra shard', 'veiled crystal', 'glowing shard',
      'shimmering shard', 'sacred shard', 'resonant crystal',
    ],
  },
  {
    name: 'Engineering',
    color: '#FDCB6E',
    bg: 'rgba(253,203,110,0.12)',
    border: 'rgba(253,203,110,0.30)',
    keywords: [
      'bomb', 'gun', 'scope', 'goggles', 'turret', 'robot', 'mech',
      'rocket', 'grenade', 'gadget', 'cogwheel', 'tinker', 'gyro',
      'nitro', 'blaster', 'cannon', 'targeting', 'googles', 'frag',
      'dragonling', 'workshop', 'kit (eng)', 'tranquil mech',
      'hyperspeed', 'grounded plasma', 'reticulated', 'furious gladiator',
      'thermal', 'jeeves', 'gnomish', 'goblin',
    ],
    reagentKeywords: [
      'gear', 'cog', 'copper tube', 'bronze tube', 'mithril tube',
      'thorium tube', 'handful of cobalt bolts', 'obsidium bolts',
      'stack of sprockets', 'handfull of laestrite bolts',
      'handful of serevite bolts', 'sharp arrow', 'iceblade arrow',
    ],
  },
  {
    name: 'Inscription',
    color: '#55EFC4',
    bg: 'rgba(85,239,196,0.12)',
    border: 'rgba(85,239,196,0.30)',
    keywords: [
      'glyph', 'tome', 'codex', 'vantus rune', 'contract', 'darkmoon card',
      'forged document', 'missive', 'technique', 'compendium', 'writ',
      'illuminated', 'novice', 'journeyman', 'artisan', 'master',
      'grandmaster', 'virtuoso', 'inscription', 'certificate',
    ],
    reagentKeywords: [
      'ink', 'pigment', 'parchment', 'light parchment', 'common parchment',
      'resilient parchment', 'arcane parchment', 'draenic parchment',
      'light parchment', 'scroll case',
    ],
  },
  {
    name: 'Jewelcrafting',
    color: '#00B894',
    bg: 'rgba(0,184,148,0.12)',
    border: 'rgba(0,184,148,0.30)',
    keywords: [
      'ring', 'necklace', 'pendant', 'amulet', 'jewel', 'cut', 'faceted',
      'band', 'chain', 'choker', 'locket', 'signet', 'settings', 'figurine',
      'tiara', 'crown', 'ornate', 'delicate', 'bold', 'brilliant', 'flashing',
      'fractured', 'precise', 'puissant', 'quick', 'reckless', 'resolute',
      'rigid', 'smooth', 'solid', 'sparkling', 'steady', 'subtle',
    ],
    reagentKeywords: [
      'diamond', 'ruby', 'sapphire', 'emerald', 'topaz', 'opal', 'onyx',
      'tigerseye', 'gem', 'jewel', 'jade', 'amethyst', 'zultite',
      'alexandrite', 'chrysoprase', 'carnelian', 'hessonite', 'jasper',
      'nightstone', 'alicite', 'ember topaz', 'demonseye', 'ocean sapphire',
      'dream emerald', 'inferno ruby', 'amberjewel', 'wild jade',
      'vermilion', 'roguestone', 'azerothian diamond', 'blue sapphire',
      'star ruby', 'huge emerald', 'black diamond', 'essence of underath',
      'uncut',
    ],
  },
  {
    name: 'Leatherworking',
    color: '#B8860B',
    bg: 'rgba(184,134,11,0.12)',
    border: 'rgba(184,134,11,0.30)',
    keywords: [
      'wristguards', 'tunic', 'quiver', 'ammo pouch', 'leg armor',
      'armor kit', 'dragonscale', 'draconic', 'savage', 'hardened',
      'nerubian', 'icy scale', 'mammoth', 'arctic', 'eviscerator',
      'toughened', 'jormungar', 'leatherworking', 'reinforced', 'knothide',
      'borean', 'heavy borean', 'imbued netherweave',
    ],
    reagentKeywords: [
      'leather', 'hide', 'scale', 'pelt', 'fur', 'skin', 'thick leather',
      'heavy leather', 'rugged leather', 'knothide leather', 'borean leather',
      'heavy borean leather', 'savage leather', 'exotic leather',
      'stonehide leather', 'draconic hide', 'resilient hide',
      'adamant scales', 'pristine hide', 'shimmerscale', 'tensile hide',
    ],
  },
  {
    name: 'Tailoring',
    color: '#FD79A8',
    bg: 'rgba(253,121,168,0.12)',
    border: 'rgba(253,121,168,0.30)',
    keywords: [
      'robe', 'vestments', 'garb', 'mantle', 'cowl', 'spellweave',
      'ebonweave', 'moonshroud', 'glacial', 'cloak lining', 'lining',
      'bag', 'sack', 'pouch', 'thread', 'bolt', 'dreamcloth',
      'imperial silk', 'hexweave', 'bloodtotem', 'lightless silk', 'shroud',
    ],
    reagentKeywords: [
      'cloth', 'linen', 'wool', 'silk', 'mageweave', 'runecloth',
      'netherweave', 'frostweave', 'embersilk', 'windwool', 'hexweave cloth',
      'lightweave', 'shadowlace', 'dragonweave', 'gostweave',
      'blackrock fireweave', 'profane cloth', 'lightless silk cloth',
      'shrouded cloth',
    ],
  },
  {
    name: 'Cooking',
    color: '#E17055',
    bg: 'rgba(225,112,85,0.12)',
    border: 'rgba(225,112,85,0.30)',
    keywords: [
      'feast', 'stew', 'bread', 'roast', 'crispy', 'biscuit', 'pudding',
      'pie', 'cooked', 'grilled', 'smoked', 'sauteed', 'fried', 'boiled',
      'seasoned', 'broth', 'rice', 'noodle', 'soup', 'steak', 'chowder',
      'chili', 'jerky', 'meal', 'barbecue', 'braised', 'poached',
      'delicious', 'tasty', 'savory', 'spiced',
    ],
    reagentKeywords: [
      'spice', 'honey', 'salt', 'oil', 'egg', 'milk', 'flour', 'butter',
      'cheese', 'mushroom', 'aged dalaran brie', 'simple flour',
      'mild spices', 'hot spices', 'refreshing spring water',
    ],
  },
  {
    name: 'Fishing',
    color: '#0984E3',
    bg: 'rgba(9,132,227,0.12)',
    border: 'rgba(9,132,227,0.30)',
    keywords: [
      'fish', 'eel', 'shrimp', 'lobster', 'sturgeon', 'trout', 'salmon',
      'tuna', 'bloodfin', 'firefin', 'steelscale', 'darkshore', 'spotted',
      'oily blackmouth', 'deviate fish', 'raw',
    ],
    reagentKeywords: [],
  },
]

/**
 * Scores each profession against the item name and reagent names.
 * Item-name keyword hits score 10 pts (definitive signal).
 * Reagent-name appearing in the item name scores 8 pts (the item IS a material).
 * Reagent-keyword found in actual reagents scores 3 pts (supporting evidence).
 * Returns the profession name with the highest score, or 'Unknown'.
 */
export function detectProfession(itemName, reagents = []) {
  const nameLower = itemName.toLowerCase()
  const reagentStr = reagents.map(r => r.name.toLowerCase()).join(' ')

  let best = { name: 'Unknown', score: 0 }

  for (const prof of PROFESSIONS) {
    let score = 0

    for (const kw of prof.keywords) {
      if (nameLower.includes(kw)) score += 10
    }
    for (const kw of prof.reagentKeywords) {
      if (nameLower.includes(kw)) score += 8
      else if (reagentStr.includes(kw)) score += 3
    }

    if (score > best.score) best = { name: prof.name, score }
  }

  return best.name
}

export function getProfession(name) {
  return PROFESSIONS.find(p => p.name === name) ?? null
}
