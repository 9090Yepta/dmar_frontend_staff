import dayjs from 'dayjs';

export function formatUnitStatus(status: number): string {
  return ['None', 'Ready', 'Continue'][Number(status)] ?? '—';
}

export function formatReportDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = dayjs(value).locale('en');
  return date.isValid() ? date.format('DD-MMM-YYYY') : '—';
}
