import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UtilisateurCourant {
  sub: string;
  telephone: string;
  role: string;
  livreurId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UtilisateurCourant => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
