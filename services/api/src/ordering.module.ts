import { Module } from '@nestjs/common';
import { CartController, OrderDraftsController, OrdersController } from './ordering.controller.js';
@Module({ controllers: [CartController, OrderDraftsController, OrdersController] })
export class OrderingModule {}
