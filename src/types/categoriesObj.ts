export interface CategoryObj {
  name: string;
  slug: string;
  description: string;
  imgUrl: string;
  subcategories?: CategoryObj[];
}