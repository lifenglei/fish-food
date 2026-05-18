const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const API_BASE_URL = (env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

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

export type FishType = FishSpecies;

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

export interface AddFeedingInput {
  fishId: string;
  foodSlug: string;
  wishDescription: string;
  feederName?: string;
}

const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = await parseJson<{ message?: string } | T>(response);

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? payload.message : `Request failed with status ${response.status}`;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return payload as T;
};

export const fishService = {
  async getFishSpecies(): Promise<FishSpecies[]> {
    try {
      return await requestJson<FishSpecies[]>('/fish/species');
    } catch (error) {
      console.error('Error fetching fish species:', error);
      return [];
    }
  },

  async getFishCatalog(): Promise<Fish[]> {
    try {
      return await requestJson<Fish[]>('/fish/catalog');
    } catch (error) {
      console.error('Error fetching fish catalog:', error);
      return [];
    }
  },

  async getRecentFeedings(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Feeding[]; total: number; page: number; pageSize: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      const qs = searchParams.toString();
      return await requestJson(`/feedings${qs ? `?${qs}` : ''}`);
    } catch (error) {
      console.error('Error fetching feedings:', error);
      return { items: [], total: 0, page: 1, pageSize: 12 };
    }
  },

  async getTotalMerit(): Promise<number> {
    try {
      const data = await requestJson<{ totalMerit: number }>('/feedings/total-merit');
      return data.totalMerit ?? 0;
    } catch (error) {
      console.error('Error fetching total merit:', error);
      return 0;
    }
  },

  async addFeeding(feeding: AddFeedingInput): Promise<Feeding | null> {
    try {
      return await requestJson<Feeding>('/feedings', {
        method: 'POST',
        body: JSON.stringify({
          fishId: feeding.fishId,
          foodSlug: feeding.foodSlug,
          wishDescription: feeding.wishDescription,
          feederName: feeding.feederName || undefined,
        }),
      });
    } catch (error) {
      console.error('Error adding feeding:', error);
      return null;
    }
  },
};

