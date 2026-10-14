export type EarningEntry = {
  id: string;
  date: string;
  platform: string;
  earned: number;
  expenses: number;
  hours: number;
};

export function summarize(entries: EarningEntry[]) {
  const earned = entries.reduce((s, e) => s + e.earned, 0);
  const expenses = entries.reduce((s, e) => s + e.expenses, 0);
  const hours = entries.reduce((s, e) => s + e.hours, 0);
  const net = earned - expenses;
  return { earned, expenses, hours, net, perHour: hours > 0 ? Math.round(net / hours) : 0 };
}

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
