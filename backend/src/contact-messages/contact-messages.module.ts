import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../admin/admin-role.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminContactMessagesController, ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContactMessagesController, AdminContactMessagesController],
  providers: [ContactMessagesService, JwtAuthGuard, AdminRoleGuard],
  exports: [ContactMessagesService],
})
export class ContactMessagesModule {}
