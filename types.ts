
export type HatCategory = 'hat' | 'antler' | 'accessory';

export interface HatAsset {
  id: string;
  name: string;
  src: string; // Data URI
  category: HatCategory;
}

export interface FrameAsset {
  id: string;
  name: string;
  src: string;
}

export interface EditorState {
  imageSrc: string | null;
  selectedHatId: string | null;
  selectedFrameId: string | null;
  hatTransform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  generatedGreeting: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
