import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validerUtilisateur(telephone: string, motDePasse: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { telephone },
      include: { livreur: true },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return utilisateur;
  }

  async login(telephone: string, motDePasse: string) {
    const utilisateur = await this.validerUtilisateur(telephone, motDePasse);

    const payload = {
      sub: utilisateur.id,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
      livreurId: utilisateur.livreur?.id,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
      },
    };
  }

  async rafraichirToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const nouveauPayload = {
        sub: payload.sub,
        telephone: payload.telephone,
        role: payload.role,
        livreurId: payload.livreurId,
      };

      return {
        accessToken: this.jwtService.sign(nouveauPayload, { expiresIn: '15m' }),
      };
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  static async hasherMotDePasse(motDePasse: string): Promise<string> {
    return bcrypt.hash(motDePasse, 10);
  }
}
