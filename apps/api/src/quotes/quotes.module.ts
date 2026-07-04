import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AdminQuotesController } from './admin-quotes.controller';
import { LogMailerService, MailerService } from './mailer/mailer.service';
import { QuoteNotificationsProcessor } from './quote-notifications.processor';
import { QUOTE_NOTIFICATIONS_QUEUE } from './quotes.constants';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUOTE_NOTIFICATIONS_QUEUE })],
  controllers: [QuotesController, AdminQuotesController],
  providers: [
    QuotesService,
    QuoteNotificationsProcessor,
    // Mailer PORT: real provider is owner-supplied; swap this useClass binding for prod.
    { provide: MailerService, useClass: LogMailerService },
  ],
  exports: [QuotesService],
})
export class QuotesModule {}
