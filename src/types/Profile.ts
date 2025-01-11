export interface Profile {
  id: string;
  name: string;
  pin: string | null;
  avatar: string;
  background: string;
  photos: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string | null;
} 