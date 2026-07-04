import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService, type QuoteMailPayload } from './mailer/mailer.service';
import {
  QUOTE_CREATED_JOB,
  QUOTE_NOTIFICATIONS_QUEUE,
  type QuoteCreatedJobData,
} from './quotes.constants';

/**
 * Worker for the `quote-notifications` queue. On a `quote-created` job it loads the quote
 * (with items) and fires the sales alert + buyer acknowledgement via the MailerService port.
 * Runs out-of-band so the HTTP POST /quote-requests returns immediately.
 */
@Processor(QUOTE_NOTIFICATIONS_QUEUE)
export class QuoteNotificationsProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async process(job: Job<QuoteCreatedJobData>): Promise<void> {
    if (job.name !== QUOTE_CREATED_JOB) {
      this.logger.warn(
        `Unknown quote-notifications job: ${job.name}`,
        QuoteNotificationsProcessor.name,
      );
      return;
    }

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id: job.data.quoteId },
      include: { items: true },
    });
    if (!quote) {
      this.logger.warn(
        `quote-created job for missing quote ${job.data.quoteId} (${job.data.ref})`,
        QuoteNotificationsProcessor.name,
      );
      return;
    }

    const payload: QuoteMailPayload = {
      ref: quote.ref,
      companyName: quote.companyName,
      contactName: quote.contactName,
      email: quote.email,
      country: quote.country,
      destination: quote.destination,
      incoterm: quote.incoterm,
      items: quote.items.map((i) => ({
        productName: i.productNameSnapshot,
        quantity: i.quantity.toString(),
        unit: i.unit,
      })),
    };

    // Both notifications use the MailerService port (dev adapter logs; swap for real transport).
    await this.mailer.sendSalesAlert(payload);
    await this.mailer.sendBuyerAcknowledgement(payload);
  }
}
