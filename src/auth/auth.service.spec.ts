import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AuthService } from './auth.service';

// Mock argon2 to avoid native bindings in test environment
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$hashed'),
  verify: jest.fn().mockResolvedValue(true),
}));

// Mock google-auth-library to control OAuth2Client behaviour
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock=1'),
    getToken: jest.fn().mockResolvedValue({ tokens: { id_token: 'mock-id-token' } }),
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-123',
        email: 'budi@example.com',
        name: 'Budi Santoso',
      }),
    }),
  })),
}));

const USER_ID = '00000000-0000-0000-0000-000000000001';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyAsync: jest.fn(),
};

const user = {
  id: USER_ID,
  email: 'budi@example.com',
  name: 'Budi Santoso',
  passwordHash: '$argon2id$hashed',
  googleId: null,
  refreshVersion: 0,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
    // Restore signAsync default after clearAllMocks
    mockJwt.signAsync.mockResolvedValue('mock-jwt-token');
  });

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);

      const result = await service.register({
        name: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'S3cur3P@ss!',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.register({ name: 'x', email: 'budi@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const argon2 = await import('argon2');
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'budi@example.com', password: 'S3cur3P@ss!' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const argon2 = await import('argon2');
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'budi@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for user without password (OAuth-only)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...user, passwordHash: null });

      await expect(
        service.login({ email: 'budi@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('issues new tokens for a valid refresh token', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: USER_ID, refreshVersion: 0 });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockJwt.signAsync.mockResolvedValue('new-jwt-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-jwt-token');
    });

    it('throws UnauthorizedException for an invalid refresh token', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refreshVersion mismatches (revoked session)', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: USER_ID, refreshVersion: 0 });
      mockPrisma.user.findUnique.mockResolvedValue({ ...user, refreshVersion: 1 });

      await expect(service.refresh('stale-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeAllSessions', () => {
    it('increments refreshVersion to invalidate all sessions', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...user, refreshVersion: 1 });

      const result = await service.revokeAllSessions(USER_ID);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { refreshVersion: { increment: 1 } },
      });
    });
  });

  describe('getGoogleAuthUrl', () => {
    it('returns a Google OAuth2 authorization URL', async () => {
      mockJwt.signAsync.mockResolvedValue('csrf-state-token');

      const url = await service.getGoogleAuthUrl();

      expect(typeof url).toBe('string');
      expect(url).toContain('accounts.google.com');
    });
  });

  describe('googleCallback', () => {
    it('creates a new user on first Google login and returns tokens', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ nonce: 'abc' });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);
      mockJwt.signAsync.mockResolvedValue('google-jwt');

      const result = await service.googleCallback('auth-code', 'valid-csrf-state');

      expect(result.accessToken).toBe('google-jwt');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('returns tokens for an existing Google user without creating a new record', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ nonce: 'abc' });
      mockPrisma.user.findFirst.mockResolvedValue({ ...user, googleId: 'google-sub-123' });
      mockJwt.signAsync.mockResolvedValue('google-jwt');

      const result = await service.googleCallback('auth-code', 'valid-csrf-state');

      expect(result.accessToken).toBe('google-jwt');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('links googleId to an existing email-registered account', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ nonce: 'abc' });
      // User exists but has no googleId yet
      mockPrisma.user.findFirst.mockResolvedValue({ ...user, googleId: null });
      mockPrisma.user.update.mockResolvedValue({ ...user, googleId: 'google-sub-123' });
      mockJwt.signAsync.mockResolvedValue('google-jwt');

      await service.googleCallback('auth-code', 'valid-csrf-state');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { googleId: 'google-sub-123' } }),
      );
    });

    it('throws UnauthorizedException for invalid CSRF state', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.googleCallback('code', 'bad-state')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
