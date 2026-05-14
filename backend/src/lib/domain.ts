export interface FoodOption {
  slug: string;
  label: string;
  description: string;
  merit: number;
}

export const FOOD_OPTIONS: FoodOption[] = [
  {
    slug: 'algae-bite',
    label: '藻饼',
    description: '轻盈常备，适合日常投喂。',
    merit: 2,
  },
  {
    slug: 'floating-pellet',
    label: '浮水粒',
    description: '标准鱼粮，稳定加成。',
    merit: 3,
  },
  {
    slug: 'shrimp-strip',
    label: '虾干',
    description: '高能补给，适合认真投喂。',
    merit: 4,
  },
  {
    slug: 'brine-shrimp',
    label: '丰年虾',
    description: '稀有食材，功德更高。',
    merit: 5,
  },
];

export interface FishSpecies {
  id: string;
  name: string;
  description: string;
  moral: string;
  imageUrl?: string;
  sortNum: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
  accentFrom: string;
  accentTo: string;
  displayOrder: number;
}

export interface Fish {
  id: string;
  slug: string;
  fishTypeId: string;
  name: string;
  description: string;
  favoriteFoodSlug: string;
  meritBonus: number;
  displayOrder: number;
  created_at?: string;
  fishType?: FishSpecies;
}

export interface Feeding {
  id: string;
  fishId: string;
  foodSlug: string;
  foodLabel: string;
  wishDescription: string;
  feederName?: string;
  meritEarned: number;
  created_at?: string;
}

interface FishSpeciesRow {
  id: string;
  name: string;
  description: string;
  moral: string;
  image_url?: string | null;
  sort_num: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FishRow {
  id: string;
  slug: string;
  fish_type_id?: string | null;
  fish_species_id?: string | null;
  name: string;
  description: string;
  favorite_food_slug: string;
  merit_bonus: number;
  display_order: number;
  created_at: string;
}

interface FeedingRow {
  id: string;
  fish_id: string;
  food_slug: string;
  food_label: string;
  wish_description?: string | null;
  feeder_name: string | null;
  merit_earned: number;
  created_at: string;
}

const speciesAccentPalettes: Array<[string, string]> = [
  ['#0ea5e9', '#10b981'],
  ['#f59e0b', '#f97316'],
  ['#8b5cf6', '#0ea5e9'],
  ['#14b8a6', '#22c55e'],
  ['#f97316', '#eab308'],
  ['#06b6d4', '#3b82f6'],
  ['#ec4899', '#f97316'],
  ['#22c55e', '#14b8a6'],
];

const getSpeciesPalette = (sortNum: number): [string, string] => {
  const safeIndex = Math.max(sortNum, 1) - 1;
  return speciesAccentPalettes[safeIndex % speciesAccentPalettes.length];
};

const rowToFishSpecies = (row: FishSpeciesRow): FishSpecies => {
  const sortNum = Number(row.sort_num ?? 0);
  const [accentFrom, accentTo] = getSpeciesPalette(sortNum || 1);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    moral: row.moral,
    imageUrl: row.image_url || undefined,
    sortNum,
    isActive: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    accentFrom,
    accentTo,
    displayOrder: sortNum || 1,
  };
};

const rowToFish = (row: FishRow): Fish => {
  const fishTypeId = row.fish_type_id ?? row.fish_species_id ?? '';

  return {
    id: row.id,
    slug: row.slug,
    fishTypeId,
    name: row.name,
    description: row.description,
    favoriteFoodSlug: row.favorite_food_slug,
    meritBonus: Number(row.merit_bonus ?? 0),
    displayOrder: Number(row.display_order ?? 0),
    created_at: row.created_at,
  };
};

const rowToFeeding = (row: FeedingRow): Feeding => ({
  id: row.id,
  fishId: row.fish_id,
  foodSlug: row.food_slug,
  foodLabel: row.food_label,
  wishDescription: row.wish_description || row.food_label,
  feederName: row.feeder_name || undefined,
  meritEarned: Number(row.merit_earned ?? 0),
  created_at: row.created_at,
});

const speciesToSyntheticFish = (species: FishSpecies): Fish => {
  const foodIndex = Math.max(species.sortNum, 1) - 1;
  const defaultFood = FOOD_OPTIONS[foodIndex % FOOD_OPTIONS.length] || FOOD_OPTIONS[0];

  return {
    id: species.id,
    slug: `species-${species.sortNum}-${species.id.slice(0, 8)}`,
    fishTypeId: species.id,
    name: species.name,
    description: species.description,
    favoriteFoodSlug: defaultFood.slug,
    meritBonus: Math.max(1, Math.min(6, species.sortNum)),
    displayOrder: species.sortNum || 1,
    created_at: species.created_at,
    fishType: species,
  };
};

export const mapFishSpeciesRow = rowToFishSpecies;
export const mapFishRow = rowToFish;
export const mapFeedingRow = rowToFeeding;
export const mapSyntheticFish = speciesToSyntheticFish;
