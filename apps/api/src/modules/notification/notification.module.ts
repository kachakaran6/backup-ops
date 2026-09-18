import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationIntegration } from './entities/notification-integration.entity';
import { NotificationRule } from './entities/notification-rule.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TelegramNotificationProvider } from './providers/telegram.provider';
import { SmtpNotificationProvider } from './providers/smtp.provider';
import { PushoverNotificationProvider } from './providers/pushover.provider';
import { GotifyNotificationProvider } from './providers/gotify.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationIntegration,
      NotificationRule,
      NotificationDelivery,
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    TelegramNotificationProvider,
    SmtpNotificationProvider,
    PushoverNotificationProvider,
    GotifyNotificationProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
