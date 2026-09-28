import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  async getProducts(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('frameShape') frameShape?: string,
    @Query('gender') gender?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
  ) {
    return this.catalogService.getProducts({
      category,
      brand,
      frameShape,
      gender,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
    });
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  @Get('categories')
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('brands')
  async getBrands() {
    return this.catalogService.getBrands();
  }
}
