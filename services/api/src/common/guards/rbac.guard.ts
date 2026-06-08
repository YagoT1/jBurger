import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    void context;
    return true;
  }
}
