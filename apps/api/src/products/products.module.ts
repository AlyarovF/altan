import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { TaxonomyService } from './taxonomy.service';

@Module({
  controllers: [ProductsController, AdminProductsController, AdminTaxonomyController],
  providers: [ProductsService, TaxonomyService],
  exports: [ProductsService, TaxonomyService],
})
export class ProductsModule {}
