import { redirect } from 'next/navigation';

/** Compliance content lives on the Quality & Compliance page. */
export default function ComplianceRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/quality`);
}
