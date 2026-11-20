import { Controller, Get, Param } from '@nestjs/common';
import { LensesService } from './lenses.service.js';

@Controller('lenses')
export class LensesController {
  constructor(private readonly lensesService: LensesService) {}

  @Get('types')
  async getLensTypes() {
    return this.lensesService.getLensTypes();
  }

  @Get('types/:id')
  async getLensType(@Param('id') id: string) {
    return this.lensesService.getLensTypeById(id);
  }
}
