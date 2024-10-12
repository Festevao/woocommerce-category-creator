import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { CategoryObj } from './types/categoriesObj';
import * as dotenv from 'dotenv';
import axios from 'axios'; // Para baixar a imagem

dotenv.config();

const api = new WooCommerceRestApi({
  url: process.env.WP_URL,
  consumerKey: process.env.WOOCOMMERCE_KEY,
  consumerSecret: process.env.WOOCOMMERCE_SECRET,
  version: 'wc/v3',
});

const uploadImageToWordPress = async (imageUrl: string): Promise<string | null> => {
  try {
    const imageResponse = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    const contentType = imageResponse.headers['content-type'];
    const extension = contentType.split('/')[1];

    const wpResponse = await axios.post(
      `${process.env.WP_URL}/wp-json/wp/v2/media`,
      imageResponse.data,
      {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="image.${extension}"`,
          Authorization: `Basic ${Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64')}`,
        },
      }
    );

    return wpResponse.data.source_url;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
}

const categoryExists = async (slug: string): Promise<number | null> => {
  try {
    const response = await api.get('products/categories', {
      slug,
    });
    const categories = response.data;

    if (categories.length > 0) {
      return categories[0].id;
    }
    return null;
  } catch (error) {
    console.error(`Erro ao verificar categoria ${slug}:`, error);
    return null;
  }
}

const updateCategoryIfNeeded = async (categoryId: number, category: CategoryObj) => {
  try {
    const response = await api.get(`products/categories/${categoryId}`);
    const existingCategory = response.data;

    let updateRequired = false;
    const updatedFields: any = {};

    if (category.description && category.description !== existingCategory.description) {
      updatedFields.description = category.description;
      updateRequired = true;
    }

    if (category.imgUrl) {
      const newImageId = await uploadImageToWordPress(category.imgUrl);
      if (newImageId) {
        updatedFields.image = { id: newImageId };
        updateRequired = true;
      }
    }

    if (updateRequired) {
      await api.put(`products/categories/${categoryId}`, updatedFields);
      console.log(`Categoria "${category.name}" foi atualizada com sucesso.`);
    } else {
      console.log(`Categoria "${category.name}" já está atualizada.`);
    }

  } catch (error) {
    console.error(`Erro ao atualizar a categoria ${category.name}:`, error);
  }
};

const createCategory = async (category: CategoryObj, parentId?: number, path: string = '') => {
  try {
    let parentCategoryId = parentId || 0;
    const currentPath = path ? `${path} -> ${category.name}` : category.name;

    if (category.subcategories && category.subcategories.length > 0) {
      for (const subcategory of category.subcategories) {
        const subcategoryId = await createCategory(subcategory, parentCategoryId, currentPath);
        parentCategoryId = subcategoryId || parentCategoryId;
      }
    }

    const existingCategoryId = await categoryExists(category.slug);
    if (existingCategoryId) {
      console.log(`"${currentPath}" já foi criado.`);

      await updateCategoryIfNeeded(existingCategoryId, category);

      return existingCategoryId;
    }

    let imageUrl: string | null = null;
    if (category.imgUrl) {
      imageUrl = await uploadImageToWordPress(category.imgUrl);
    }

    const response = await api.post('products/categories', {
      name: category.name,
      slug: category.slug,
      parent: parentId || 0,
      description: category.description || '',
      image: imageUrl ? { src: imageUrl, name: `${category.slug}-image`, alt: `${category.slug}-image` } : undefined,
    });

    console.log(`"${currentPath}" criado com sucesso.`);
    return response.data.id;
  } catch (error) {
    console.error(`Erro ao criar a categoria ${category.name}:`, error);
    return null;
  }
};

export const createCategories = async (categories: CategoryObj[] | CategoryObj) => {
  if (Array.isArray(categories)) {
    for (const category of categories) {
      await createCategory(category);
    }

    return;
  }

  await createCategory(categories);
}