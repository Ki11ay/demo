export interface Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateItemInput {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
}
