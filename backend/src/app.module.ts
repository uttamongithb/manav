import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FollowsModule } from './follows/follows.module';
import { AdminModule } from './admin/admin.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';

@Module({
  imports: [PrismaModule, PostsModule, ProfileModule, AuthModule, FollowsModule, AdminModule, ContactMessagesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
