import { setRequestLocale } from 'next-intl/server';
import { createServerClient } from '../../lib/supabase-server';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import StatStrip from '../components/StatStrip';
import VillagePlaybook from '../components/VillagePlaybook';
import StationStatusTrack from '../components/StationStatusTrack';
import TaiwanCleanups from '../components/TaiwanCleanups';
import SupportBlock from '../components/SupportBlock';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

const STATION_ORDER = ['selong-belanak', 'gili-gede', 'ekas', 'awang', 'mawun'];

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = createServerClient();

  const [{ data: stations }, { data: metrics }] = await Promise.all([
    supabase
      .from('projects')
      .select('slug, name, phase, phase1_note, phase2_pct, phase2_note, phase3_complete, phase3_note, annual_diverted_kg, annual_diverted_year')
      .in('slug', STATION_ORDER),
    supabase
      .from('metrics')
      .select('member_businesses, taiwan_volunteer_turnouts')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const sortedStations = STATION_ORDER
    .map((slug) => stations?.find((s) => s.slug === slug))
    .filter(Boolean) as NonNullable<typeof stations>;

  const memberBusinesses = metrics?.member_businesses ?? 76;
  const taiwanVolunteers = metrics?.taiwan_volunteer_turnouts ?? 2000;

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StatStrip
          memberBusinesses={memberBusinesses}
          taiwanVolunteers={taiwanVolunteers}
        />
        <VillagePlaybook />
        <StationStatusTrack stations={sortedStations ?? []} />
        <TaiwanCleanups />
        <SupportBlock />
      </main>
      <Footer />
    </>
  );
}
