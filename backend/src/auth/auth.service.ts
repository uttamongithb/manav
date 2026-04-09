import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface StoredUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
}

@Injectable()
export class AuthService {
  private usersFile = path.join(process.cwd(), 'data', 'users.json');

  constructor(private prisma: PrismaService) {}

  private async readUsers(): Promise<StoredUser[]> {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      return JSON.parse(data) as StoredUser[];
    } catch {
      return [];
    }
  }

  private async writeUsers(users: StoredUser[]): Promise<void> {
    try {
      const dir = path.dirname(this.usersFile);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Failed to write users file:', error);
    }
  }

  async register(dto: RegisterDto) {
    try {
      // Try database first
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          displayName: dto.displayName || dto.username,
          passwordHash: hashedPassword,
          role: 'reader',
          status: 'active',
          isVerified: true,
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          avatarUrl: true,
        },
      });

      return user;
    } catch (dbError) {
      // Fallback to file-based storage
      const users = await this.readUsers();

      const existingEmail = users.find((u) => u.email === dto.email);
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }

      const existingUsername = users.find((u) => u.username === dto.username);
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newUser: StoredUser = {
        id,
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName || dto.username,
        passwordHash: hashedPassword,
        role: 'reader',
      };

      await this.writeUsers([...users, newUser]);

      const { passwordHash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }
  }

  async login(dto: LoginDto) {
    try {
      // Try database first
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: dto.email || undefined },
            { username: dto.username || undefined },
          ],
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash || '',
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      };
    } catch (dbError) {
      // Fallback to file-based storage
      const users = await this.readUsers();

      const user = users.find(
        (u) => u.email === dto.email || u.username === dto.username,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          avatarUrl: true,
          bio: true,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch {
      // Fallback to file-based storage
      const users = await this.readUsers();
      const user = users.find((u) => u.id === userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  }
}
