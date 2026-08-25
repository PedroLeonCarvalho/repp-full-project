import type { Music } from "@/features/music/types";

export interface Project {
  id: string;
  customerId: string;
  name: string;
  description: string | null;
  document: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  document?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  document?: string | null;
}

export interface ProjectWithMusics extends Project {
  musicsCount: number;
  musics?: Music[];
}
