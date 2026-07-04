import { useTranslations } from 'next-intl';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from '@/i18n/routing';
import { BrandMark } from './BrandMark';
import type { FooterContent } from '@altan/shared';

type FooterColumns = NonNullable<FooterContent['columns']>;

/** Site footer, content-driven from `GET /content` (footer key). */
export function Footer({ companyName, footer }: { companyName: string; footer?: FooterContent }) {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  // CMS footer content is localized by the backend (?locale, EN base + RU/UZ
  // overrides). Prefer the admin-authored value for every locale; fall back to
  // the bundled next-intl copy only when the CMS value is missing/empty.
  const tagline = footer?.tagline || t('tagline');
  const copyright = footer?.copyright || `© ${year} ${companyName}. ${t('rights')}`;
  const columns: FooterColumns = footer?.columns?.length
    ? footer.columns
    : (t.raw('columns') as FooterColumns);

  return (
    <footer className="surface-dark text-steel-300">
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-amber/40 to-transparent"
        aria-hidden
      />
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="font-display text-lg text-white">{companyName}</span>
          </div>
          <p className="mt-4 font-display text-base text-steel-200">{tagline}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {footer?.email && (
              <li className="flex items-center gap-2">
                <MailOutlined className="text-amber-bright" />
                <a href={`mailto:${footer.email}`} className="hover:text-white">
                  {footer.email}
                </a>
              </li>
            )}
            {footer?.phone && (
              <li className="flex items-center gap-2">
                <PhoneOutlined className="text-amber-bright" />
                <a href={`tel:${footer.phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {footer.phone}
                </a>
              </li>
            )}
            {footer?.address && (
              <li className="flex items-center gap-2">
                <EnvironmentOutlined className="text-amber-bright" />
                <span>{footer.address}</span>
              </li>
            )}
          </ul>
        </div>

        {columns?.map((col) => (
          <div key={col.heading}>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-eyebrow text-steel-400">
              {col.heading}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-steel-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="shell flex flex-col items-center justify-between gap-2 py-6 text-xs text-steel-400 sm:flex-row">
          <span>{copyright}</span>
          <span className="font-mono">EXW · FCA · FOB · CFR · CIF · DAP · DDP</span>
        </div>
      </div>
    </footer>
  );
}
