import * as fs from 'fs';
import * as path from 'path';
import { CategoryObj } from './src/types/categoriesObj';
import { createCategories } from './src/woocommerce';

const data = fs.readFileSync(path.join(__dirname, './categories.json'), 'utf8');
const json = JSON.parse(data) as CategoryObj[];

createCategories(json)
  .then(() => {
    console.log('success');
  })
  .catch((e) => {
    console.error(e);
  });