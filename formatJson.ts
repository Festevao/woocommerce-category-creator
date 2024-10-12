import * as fs from 'fs';
import * as path from 'path';
import { CategoryObj } from './src/types/categoriesObj';

const data = fs.readFileSync(path.join(__dirname, './categories.json'), 'utf8');
const json = JSON.parse(data);

function formatSlug(slug: string) {
  return slug
    .toLowerCase()
    .replaceAll(/[&?]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replaceAll(/\s/g, '-');
}

function recusrsiveSlug(item: CategoryObj) {
  if (Array.isArray(item.subcategories) && item.subcategories.length > 0) {
    item.subcategories.forEach((subItem) => {
      recusrsiveSlug(subItem);
    });
  }
  if (item.slug) {
    item.slug = formatSlug(item.slug);
  }
}

json.forEach((item: CategoryObj) => {
  recusrsiveSlug(item);
});

console.log(JSON.stringify(json, null, 2));

fs.writeFileSync(path.join(__dirname, './categories.json'), JSON.stringify(json, null, 2));