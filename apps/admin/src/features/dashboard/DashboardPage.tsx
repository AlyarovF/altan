import { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, List, Row, Skeleton, Statistic, Tag } from 'antd';

// The @ant-design/plots engine is heavy; load it only when the chart actually renders
// so the KPI cards and news list paint first.
const Pie = lazy(() => import('@ant-design/plots').then((m) => ({ default: m.Pie })));
import {
  AlertOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { QuoteStatus } from '@altan/shared';
import { qk } from '@/lib/queryClient';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { formatDateShort, SLA_HOURS } from '@/lib/format';
import { BRAND, QUOTE_STATUS_CHART } from '@/lib/statusColors';
import { fetchDashboardData } from './api';

const OPEN_STATUSES: QuoteStatus[] = [QuoteStatus.NEW, QuoteStatus.IN_REVIEW, QuoteStatus.QUOTED];

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.dashboard,
    queryFn: fetchDashboardData,
    refetchInterval: 60_000,
  });

  const kpis = useMemo(() => {
    if (!data) return null;
    const quotes = data.quotes.data;
    const open = quotes.filter((q) => OPEN_STATUSES.includes(q.status as QuoteStatus));
    const overdue = quotes.filter((q) => !q.respondedAt && q.overdue);
    const publishedProducts = data.products.data.filter((p) => p.status === 'PUBLISHED').length;

    const byStatus = Object.values(QuoteStatus).map((s) => ({
      type: s,
      value: quotes.filter((q) => q.status === s).length,
    }));

    return {
      openCount: open.length,
      overdueCount: overdue.length,
      publishedProducts,
      totalProducts: data.products.meta.total,
      byStatus: byStatus.filter((b) => b.value > 0),
      latestNews: data.news.data,
    };
  }, [data]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Operational overview · ${SLA_HOURS}h quote SLA`} />
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {kpis && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Open quotes"
                    value={kpis.openCount}
                    prefix={<ProfileOutlined className="text-amber" />}
                  />
                  <Link to="/quotes" className="text-xs">
                    View workspace →
                  </Link>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className={kpis.overdueCount > 0 ? '!border-signal-down' : undefined}>
                  <Statistic
                    title={`Overdue (> ${SLA_HOURS}h SLA)`}
                    value={kpis.overdueCount}
                    valueStyle={{
                      color: kpis.overdueCount > 0 ? BRAND.signalDown : BRAND.signalUp,
                    }}
                    prefix={
                      kpis.overdueCount > 0 ? (
                        <AlertOutlined />
                      ) : (
                        <CheckCircleOutlined className="text-signal-up" />
                      )
                    }
                  />
                  <Link to="/quotes?overdue=true" className="text-xs">
                    {kpis.overdueCount > 0 ? 'Triage now →' : 'All within SLA'}
                  </Link>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Products published"
                    value={kpis.publishedProducts}
                    suffix={`/ ${kpis.totalProducts}`}
                  />
                  <Link to="/products" className="text-xs">
                    Manage catalog →
                  </Link>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="News articles"
                    value={data?.news.meta.total ?? 0}
                    prefix={<FileTextOutlined />}
                  />
                  <Link to="/news" className="text-xs">
                    Manage news →
                  </Link>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
              <Col xs={24} lg={10}>
                <Card title="Quotes by status">
                  {kpis.byStatus.length > 0 ? (
                    <Suspense
                      fallback={<Skeleton.Node active style={{ width: '100%', height: 260 }} />}
                    >
                      <Pie
                        data={kpis.byStatus}
                        angleField="value"
                        colorField="type"
                        height={260}
                        innerRadius={0.5}
                        scale={{
                          color: {
                            domain: QUOTE_STATUS_CHART.domain,
                            range: QUOTE_STATUS_CHART.range,
                          },
                        }}
                        legend={{ color: { position: 'bottom' } }}
                        // The slice ramp mixes light brass (amberBright/amber) with
                        // dark tones, so a flat white label is illegible on the light
                        // slices. Give each number an ink halo (dark stroke behind a
                        // white glyph) so it stays legible on every slice colour.
                        label={{
                          text: 'value',
                          position: 'inside',
                          style: {
                            fill: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 700,
                            stroke: BRAND.ink,
                            lineWidth: 3,
                            strokeLinejoin: 'round',
                            paintOrder: 'stroke',
                          },
                        }}
                      />
                    </Suspense>
                  ) : (
                    <div className="py-12 text-center text-steel-500">No quotes yet</div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card title="Latest market intelligence">
                  <List
                    dataSource={kpis.latestNews}
                    locale={{ emptyText: 'No news' }}
                    renderItem={(n) => (
                      <List.Item actions={[<Tag key="s">{n.status}</Tag>]}>
                        <List.Item.Meta
                          title={<Link to={`/news?edit=${n.id}`}>{n.title}</Link>}
                          description={
                            <span className="text-xs text-steel-500">
                              {n.commodity} · {formatDateShort(n.publishedAt as string | null)} ·{' '}
                              {n.outlook}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </QueryState>
    </>
  );
}
