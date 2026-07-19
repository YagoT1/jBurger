import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from '@jburger/domain-products';
import { Branch } from '../common/decorators/branch.decorator.js';
import { Tenant } from '../common/decorators/tenant.decorator.js';
@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
  @Get()
  async getMenu(@Tenant() tenantId: string | undefined, @Branch() branchId: string | undefined) {
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required.');
    }
    if (!branchId) {
      throw new BadRequestException('x-branch-id header is required.');
    }
    return this.menuService.getMenu({ tenantId, branchId });
  }
}
