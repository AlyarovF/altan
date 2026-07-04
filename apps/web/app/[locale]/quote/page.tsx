import { redirect } from 'next/navigation';

/** `/quote` is not a standalone page — RFQ lives in the global quote modal and
 *  on the contact page. Redirect there so footer/legacy links never 404. */
export default function QuoteRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/contact`);
}
