import { supabase } from '../lib/supabase.js';
import { FOOD_OPTIONS, mapFeedingRow, mapFishRow, mapFishSpeciesRow, mapSyntheticFish } from '../lib/domain.js';
import type { Feeding, Fish, FishSpecies } from '../lib/domain.js';

const FISH_SPECIES_TABLE = 'fish_species';
const FISH_TABLE = 'fish';
const WISHES_TABLE = 'wishes';

const isMissingRelationError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    status?: number;
  };
  const errorText = [candidate.code, candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ');

  return (
    candidate.code === '42P01' ||
    candidate.code === 'PGRST205' ||
    candidate.status === 404 ||
    /relation .* does not exist/i.test(errorText) ||
    /could not find the (table|relation)/i.test(errorText) ||
    /schema cache/i.test(errorText)
  );
};

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

const fetchFishSpecies = async (): Promise<FishSpecies[]> => {
  const { data, error } = await supabase
    .from(FISH_SPECIES_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('sort_num', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapFishSpeciesRow(row as FishSpeciesRow));
};

const fetchFishCatalog = async (): Promise<Fish[]> => {
  const fishSpecies = await fetchFishSpecies();

  const { data: fishData, error: fishError } = await supabase
    .from(FISH_TABLE)
    .select('*')
    .order('display_order', { ascending: true });

  if (fishError) {
    if (isMissingRelationError(fishError)) {
      return fishSpecies.map((species) => mapSyntheticFish(species));
    }

    throw fishError;
  }

  const fishRows = fishData ?? [];
  if (fishRows.length === 0) {
    return fishSpecies.map((species) => mapSyntheticFish(species));
  }

  const fishSpeciesMap = new Map(fishSpecies.map((species) => [species.id, species]));

  return fishRows.map((row) => {
    const fish = mapFishRow(row as FishRow);
    const species = fishSpeciesMap.get(fish.fishTypeId);

    if (species) {
      fish.fishType = species;
    }

    return fish;
  });
};

const resolveFishById = async (fishId: string): Promise<Fish> => {
  const { data: fishData, error: fishError } = await supabase
    .from(FISH_TABLE)
    .select('*')
    .eq('id', fishId)
    .maybeSingle();

  if (fishData) {
    const fish = mapFishRow(fishData as FishRow);

    if (fish.fishTypeId) {
      const { data: speciesData, error: speciesError } = await supabase
        .from(FISH_SPECIES_TABLE)
        .select('*')
        .eq('id', fish.fishTypeId)
        .maybeSingle();

      if (speciesError && !isMissingRelationError(speciesError)) {
        throw speciesError;
      }

      if (speciesData) {
        fish.fishType = mapFishSpeciesRow(speciesData as FishSpeciesRow);
      }
    }

    return fish;
  }

  if (fishError && !isMissingRelationError(fishError)) {
    throw fishError;
  }

  const { data: speciesData, error: speciesError } = await supabase
    .from(FISH_SPECIES_TABLE)
    .select('*')
    .eq('id', fishId)
    .maybeSingle();

  if (speciesError) {
    throw speciesError;
  }

  if (!speciesData) {
    throw new Error('Selected fish does not exist');
  }

  return mapSyntheticFish(mapFishSpeciesRow(speciesData as FishSpeciesRow));
};

export async function getFishSpecies(): Promise<FishSpecies[]> {
  return fetchFishSpecies();
}

export async function getFishCatalog(): Promise<Fish[]> {
  return fetchFishCatalog();
}

export async function getRecentFeedings(params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ items: Feeding[]; total: number }> {
  const limit = params?.limit ?? 12;
  const offset = params?.offset ?? 0;

  let query = supabase.from(WISHES_TABLE).select('*', { count: 'exact' });

  if (params?.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params?.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    items: (data ?? []).map((row) => mapFeedingRow(row as FeedingRow)),
    total: count ?? 0,
  };
}

export async function getTotalMerit(): Promise<number> {
  const { data, error } = await supabase
    .from(WISHES_TABLE)
    .select('merit_earned');

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.merit_earned ?? 0), 0);
}

export async function addFeeding(input: {
  fishId: string;
  foodSlug: string;
  wishDescription: string;
  feederName?: string;
}): Promise<Feeding> {
  const food = FOOD_OPTIONS.find((item) => item.slug === input.foodSlug);
  if (!food) {
    throw new Error('Unknown food selection');
  }

  const meritEarned = food.merit;
  const selectedFish = await resolveFishById(input.fishId);

  const { data, error } = await supabase
    .from(WISHES_TABLE)
    .insert({
      fish_id: selectedFish.id,
      food_slug: input.foodSlug,
      food_label: food.label,
      wish_description: input.wishDescription,
      feeder_name: input.feederName || null,
      merit_earned: meritEarned,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const feeding = mapFeedingRow(data as FeedingRow);
  return {
    ...feeding,
    foodLabel: food.label,
    meritEarned,
    wishDescription: feeding.wishDescription,
  };
}
