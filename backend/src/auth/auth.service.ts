import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
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

    const tokens = this.creerPaireTokens(payload);
    await this.prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshTokenHash: this.hashToken(tokens.refreshToken) },
    });

    return {
      ...tokens,
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
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: payload.sub },
        select: { id: true, telephone: true, role: true, refreshTokenHash: true, livreur: { select: { id: true } } },
      });
      const empreinteRecue = this.hashToken(refreshToken);
      if (!utilisateur?.refreshTokenHash || !timingSafeEqual(Buffer.from(empreinteRecue), Buffer.from(utilisateur.refreshTokenHash))) {
        throw new UnauthorizedException('Refresh token révoqué ou remplacé');
      }

      const nouvellePaire = this.creerPaireTokens({
        sub: utilisateur.id,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
        livreurId: utilisateur.livreur?.id,
      });
      // Compare-and-swap makes concurrent refresh attempts single-use too.
      const rotation = await this.prisma.utilisateur.updateMany({
        where: { id: utilisateur.id, refreshTokenHash: empreinteRecue },
        data: { refreshTokenHash: this.hashToken(nouvellePaire.refreshToken) },
      });
      if (rotation.count !== 1) throw new UnauthorizedException('Refresh token déjà utilisé');
      return nouvellePaire;
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
  }

  async logout(utilisateurId: string) {
    await this.prisma.utilisateur.update({ where: { id: utilisateurId }, data: { refreshTokenHash: null } });
    return { ok: true };
  }

  private creerPaireTokens(payload: Record<string, unknown>) {
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  static async hasherMotDePasse(motDePasse: string): Promise<string> {
    return bcrypt.hash(motDePasse, 10);
  }
}
