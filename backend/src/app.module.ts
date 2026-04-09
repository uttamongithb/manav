import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, PostsModule, ProfileModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
