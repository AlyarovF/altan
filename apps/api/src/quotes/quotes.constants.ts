/** BullMQ queue + job names for quote notifications. */
export const QUOTE_NOTIFICATIONS_QUEUE = 'quote-notifications';
export const QUOTE_CREATED_JOB = 'quote-created';

/** Job payload for the `quote-created` job. */
export interface QuoteCreatedJobData {
  quoteId: string;
  ref: string;
}
