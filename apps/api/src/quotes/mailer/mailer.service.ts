import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/** Payload describing a quote for notification emails. */
export interface QuoteMailPayload {
  ref: string;
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  destination: string;
  incoterm: string;
  items: { productName: string; quantity: string; unit: string }[];
}

/**
 * Mailer PORT. The concrete provider (SMTP/SendGrid/SES) is OWNER-SUPPLIED — swap the
 * `useClass` binding in QuotesModule to plug in the real transport. Kept abstract so the
 * business code depends only on this contract, never a vendor SDK.
 */
@Injectable()
export abstract class MailerService {
  /** Alert the sales team that a new RFQ landed (drives the 12h SLA). */
  abstract sendSalesAlert(payload: QuoteMailPayload): Promise<void>;
  /** Acknowledge receipt to the buyer. */
  abstract sendBuyerAcknowledgement(payload: QuoteMailPayload): Promise<void>;
}

/**
 * Dev adapter: logs would-be emails via pino instead of sending. Real provider is
 * owner-supplied; swap the `useClass` binding (see quotes.module.ts) for production.
 */
@Injectable()
export class LogMailerService extends MailerService {
  constructor(private readonly logger: Logger) {
    super();
  }

  async sendSalesAlert(payload: QuoteMailPayload): Promise<void> {
    this.logger.log(
      `[MAIL→sales] New RFQ ${payload.ref} from ${payload.companyName} (${payload.email}); ` +
        `${payload.items.length} item(s) → ${payload.destination} ${payload.incoterm}`,
      LogMailerService.name,
    );
  }

  async sendBuyerAcknowledgement(payload: QuoteMailPayload): Promise<void> {
    this.logger.log(
      `[MAIL→buyer] Acknowledged RFQ ${payload.ref} to ${payload.contactName} <${payload.email}>`,
      LogMailerService.name,
    );
  }
}
