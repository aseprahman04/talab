const JAKARTA_OFFSET = 7 * 60 * 60 * 1000; // UTC+7, no DST

type ScheduledMessageLike = {
  repeatType: string;
  sendHour: number;
  sendMinute: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
};

export function computeNextRunAt(sm: ScheduledMessageLike, from: Date = new Date()): Date {
  // Shift 'from' into Jakarta local time so UTC getters reflect local values
  const jFrom = new Date(from.getTime() + JAKARTA_OFFSET);
  const jH = jFrom.getUTCHours();
  const jM = jFrom.getUTCMinutes();
  const jDow = jFrom.getUTCDay();
  const jDom = jFrom.getUTCDate();
  const jMonth = jFrom.getUTCMonth();
  const jYear = jFrom.getUTCFullYear();

  const sendH = sm.sendHour;
  const sendM = sm.sendMinute;
  const isPastToday = jH > sendH || (jH === sendH && jM >= sendM);

  let jNext: Date;

  switch (sm.repeatType) {
    case 'DAILY': {
      jNext = new Date(Date.UTC(jYear, jMonth, jDom, sendH, sendM, 0, 0));
      if (isPastToday) jNext = new Date(jNext.getTime() + 24 * 3_600_000);
      break;
    }
    case 'WEEKLY': {
      const target = sm.dayOfWeek ?? 0;
      let daysAhead = (target - jDow + 7) % 7;
      if (daysAhead === 0 && isPastToday) daysAhead = 7;
      jNext = new Date(Date.UTC(jYear, jMonth, jDom + daysAhead, sendH, sendM, 0, 0));
      break;
    }
    case 'MONTHLY': {
      const targetDom = sm.dayOfMonth ?? 1;
      const daysThisMonth = new Date(Date.UTC(jYear, jMonth + 1, 0)).getUTCDate();
      const clampedDom = Math.min(targetDom, daysThisMonth);
      const isPastThisMonth = jDom > clampedDom || (jDom === clampedDom && isPastToday);

      if (!isPastThisMonth) {
        jNext = new Date(Date.UTC(jYear, jMonth, clampedDom, sendH, sendM, 0, 0));
      } else {
        const nextM = jMonth + 1 > 11 ? 0 : jMonth + 1;
        const nextY = jMonth + 1 > 11 ? jYear + 1 : jYear;
        const daysNextMonth = new Date(Date.UTC(nextY, nextM + 1, 0)).getUTCDate();
        jNext = new Date(Date.UTC(nextY, nextM, Math.min(targetDom, daysNextMonth), sendH, sendM, 0, 0));
      }
      break;
    }
    default:
      throw new Error(`Unknown repeatType: ${sm.repeatType}`);
  }

  // Convert Jakarta local back to real UTC
  return new Date(jNext.getTime() - JAKARTA_OFFSET);
}
