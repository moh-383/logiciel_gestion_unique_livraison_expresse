import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    // Ce que retourne cette méthode devient `request.user` dans les contrôleurs.
    return {
      sub: payload.sub,
      telephone: payload.telephone,
      role: payload.role,
      livreurId: payload.livreurId,
    };
  }
}
