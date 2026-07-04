import { redirect } from 'next/navigation';

/** Incoterms are documented on the Sourcing & Logistics page. */
export default function IncotermsRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/sourcing`);
}
