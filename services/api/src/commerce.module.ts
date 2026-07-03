import { Module } from '@nestjs/common';
import {
  AvailabilityController,
  CategoriesController,
  CombosController,
  MenusController,
  ModifiersController,
  PricingController,
  ProductsController,
} from './commerce.controller.js';
@Module({
  controllers: [
    ProductsController,
    CategoriesController,
    MenusController,
    ModifiersController,
    CombosController,
    AvailabilityController,
    PricingController,
  ],
})
export class CommerceModule {}
