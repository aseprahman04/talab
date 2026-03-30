import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { SessionService } from './session.service';
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

const mockSession = {
  create: jest.fn().mockResolvedValue('mock-session-token'),
  revokeAll: jest.fn().mockResolvedValue(undefined),
  revoke: jest.fn().mockResolvedValue(undefined),
  listSessions: jest.fn().mockResolvedValue([]),
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
        { provide: SessionService, useValue: mockSession },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
    mockJwt.signAsync.mockResolvedValue('mock-jwt-token');
    mockSession.create.mockResolvedValue('mock-session-token');
  });

  describe('register', () => {
    it('creates a new user and returns a session token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);

      const result = await service.register({
        name: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'S3cur3P@ss!',
      });

      expect(result.sessionToken).toBe('mock-session-token');
      expect(result.user.email).toBe('budi@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockSession.create).toHaveBeenCalledWith(USER_ID, expect.any(Object));
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
    it('returns session token for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const argon2 = await import('argon2');
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'budi@example.com', password: 'S3cur3P@ss!' });

      expect(result.sessionToken).toBe('mock-session-token');
      expect(result.user.id).toBe(USER_ID);
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

  describe('revokeAllSessions', () => {
    it('revokes all DB sessions for the user', async () => {
      const result = await service.revokeAllSessions(USER_ID);

      expect(result.success).toBe(true);
      expect(mockSession.revokeAll).toHaveBeenCalledWith(USER_ID);
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

      const result = await service.googleCallback('auth-code', 'valid-csrf-state');

      expect(result.sessionToken).toBe('mock-session-token');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('returns tokens for an existing Google user without creating a new record', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ nonce: 'abc' });
      mockPrisma.user.findFirst.mockResolvedValue({ ...user, googleId: 'google-sub-123' });

      const result = await service.googleCallback('auth-code', 'valid-csrf-state');

      expect(result.sessionToken).toBe('mock-session-token');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('links googleId to an existing email-registered account', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ nonce: 'abc' });
      mockPrisma.user.findFirst.mockResolvedValue({ ...user, googleId: null });
      mockPrisma.user.update.mockResolvedValue({ ...user, googleId: 'google-sub-123' });

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
