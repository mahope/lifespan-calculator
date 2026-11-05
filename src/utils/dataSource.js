// Single source for the life-table provenance shown in the UI (disclaimer, footer).
// Period and update date come from the generated table meta (see docs/data-refresh.md).
import { LIFE_TABLE_META } from './lifeTableDK';

const DAYS_FORMAT = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const dataSource = {
  table: 'HISB8',
  period: LIFE_TABLE_META.period,
  updated: DAYS_FORMAT.format(new Date(`${LIFE_TABLE_META.tableUpdated.slice(0, 10)}T00:00:00Z`)),
  label: `Danmarks Statistik (${LIFE_TABLE_META.period})`,
};
