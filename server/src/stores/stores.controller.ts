import { Controller, Get, Param } from '@nestjs/common';
import { StoresService } from './stores.service.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getAllStores() {
    return this.storesService.getAllStores();
  }

  @Get(':id')
  async getStoreById(@Param('id') id: string) {
    return this.storesService.getStoreById(id);
  }
}
