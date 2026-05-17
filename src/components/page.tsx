'use client';

import React, { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import { store } from '@/lib/store';
import { getPropertyValue } from '@/lib/property-utils';
import { calculateBalance } from '@/lib/billing-utils';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import type { Property, Bop, Payment } from '@/lib/types';
import Image from 'next/image';

const formatCurrency = (value: number) => 
  `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const chartConfig: ChartConfig = {
  revenue: { label: "Daily Revenue", color: "hsl(var(--primary))" },
  cumulative: { label: "Cumulative Progress", color: "hsl(var(--chart-2))" },
};

/**
 * Printable component for the Monthly Revenue Report
 */
const PrintableReport = React.forwardRef<HTMLDivElement, { 
  stats: any; 
  history: any[]; 
  goal: number;
  arrears: number;
}>(({ stats, history, goal, arrears }, ref) => {
  const appearance = store.settings.appearanceSettings || {};
  const general = store.settings.generalSettings || {};
  const progress = Math.min(100, (stats.month / goal) * 100);
  const yearTotal = stats.yearProperty + stats.yearBop;
  const prevYearTotal = stats.prevYearProperty + stats.prevYearBop;

  const calculateGrowth = (current: number, prev: number) => {
    if (prev <= 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const propGrowth = calculateGrowth(stats.yearProperty, stats.prevYearProperty);
  const bopGrowth = calculateGrowth(stats.yearBop, stats.prevYearBop);
  const totalGrowth = calculateGrowth(yearTotal, prevYearTotal);

  const GrowthBadge = ({ value }: { value: number }) => (
    <div className={cn(
      "text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center mt-1",
      value >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {value >= 0 ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </div>
  );

  return (
    <div ref={ref} className="p-10 text-black bg-white print:p-8 hidden print:block">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-primary pb-6 mb-8">
        {appearance.ghanaLogo && (
          <Image src={appearance.ghanaLogo} alt="Ghana Logo" width={80} height={80} className="object-contain" />
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase">{general.assemblyName || 'DISTRICT ASSEMBLY'}</h1>
          <p className="text-sm">{general.postalAddress}</p>
          <h2 className="text-xl font-extrabold mt-4 text-primary underline">MONTHLY REVENUE & GOAL PROGRESS REPORT</h2>
          <p className="text-sm font-medium mt-1">Reporting Period: {format(new Date(), 'MMMM yyyy')}</p>
        </div>
        {appearance.assemblyLogo && (
          <Image src={appearance.assemblyLogo} alt="Assembly Logo" width={80} height={80} className="object-contain" />
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border p-4 rounded-lg bg-slate-50">
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-2">Revenue Collection Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Monthly Target:</span><span className="font-bold">{formatCurrency(goal)}</span></div>
            <div className="flex justify-between text-green-700"><span>Total Collected:</span><span className="font-bold">{formatCurrency(stats.month)}</span></div>
            <div className="flex justify-between border-t pt-2"><span>Arrears / Outstanding:</span><span className="font-bold text-destructive">{formatCurrency(arrears)}</span></div>
          </div>
        </div>
        <div className="border p-4 rounded-lg bg-slate-50">
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-2">Goal Performance</h3>
          <div className="mt-4">
             <div className="flex justify-between mb-2">
                <span className="text-sm">Progress to Goal:</span>
                <span className="font-bold">{progress.toFixed(1)}%</span>
             </div>
             <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${progress}%` }}></div>
             </div>
             <p className="text-[10px] mt-4 italic text-slate-400">Generated on {format(new Date(), 'PPP p')}</p>
          </div>
        </div>
      </div>

      {/* Year-to-Date Performance Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-2">Year-to-Date (YTD) Performance</h3>
        <div className="grid grid-cols-3 gap-4">
            <div className="border p-3 rounded bg-slate-50 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">Property YTD</p>
                <p className="text-lg font-bold">{formatCurrency(stats.yearProperty)}</p>
                <GrowthBadge value={propGrowth} />
            </div>
            <div className="border p-3 rounded bg-slate-50 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase">BOP YTD</p>
                <p className="text-lg font-bold">{formatCurrency(stats.yearBop)}</p>
                <GrowthBadge value={bopGrowth} />
            </div>
            <div className="border p-3 rounded bg-primary/10 text-center border-primary/20">
                <p className="text-xs font-bold text-primary uppercase">Total YTD Revenue</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(yearTotal)}</p>
                <GrowthBadge value={totalGrowth} />
            </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 border-l-4 border-primary pl-2">Collection Breakdown</h3>
        <Table className="border">
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="text-black font-bold">Revenue Category</TableHead>
              <TableHead className="text-black font-bold text-right">Amount (GHS)</TableHead>
              <TableHead className="text-black font-bold text-right">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Property Rates</TableCell>
              <TableCell className="text-right">{formatCurrency(stats.monthProperty)}</TableCell>
              <TableCell className="text-right">{((stats.monthProperty / stats.month) * 100 || 0).toFixed(1)}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Business Operating Permits (BOP)</TableCell>
              <TableCell className="text-right">{formatCurrency(stats.monthBop)}</TableCell>
              <TableCell className="text-right">{((stats.monthBop / stats.month) * 100 || 0).toFixed(1)}%</TableCell>
            </TableRow>
            <TableRow className="font-bold bg-slate-50">
              <TableCell>Total Monthly Revenue</TableCell>
              <TableCell className="text-right">{formatCurrency(stats.month)}</TableCell>
              <TableCell className="text-right">100.0%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
PrintableReport.displayName = 'PrintableReport';

export default function PaymentsDashboardPage() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const billDisplay = store.settings.billDisplaySettings || {};
  const accentColor = billDisplay.accentColor || '#2980D1';
  
  const monthlyGoal = store.settings.generalSettings?.monthlyRevenueGoal || 50000;

  // Aggregate payments and calculate arrears from across the entire system
  const { 
    recentPayments, 
    stats, 
    totalArrears,
    revenueHistory
  } = useMemo(() => {
    const allPayments: Array<{ 
      payment: Payment; 
      item: Property | Bop; 
      itemType: 'property' | 'bop';
      ownerName: string;
      identifier: string;
    }> = [];

    let propertyArrears = 0;
    
    // Prepare 30-day revenue history map
    const end = new Date();
    const start = subDays(end, 29);
    const days = eachDayOfInterval({ start, end });
    const historyMap = new Map(days.map(d => [format(d, 'yyyy-MM-dd'), 0]));

    let bopArrears = 0;
    
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const monthStr = format(now, 'yyyy-MM');
    const currentYear = now.getFullYear();
    const sameDayLastYear = subDays(now, 365);

    let totalToday = 0;
    let totalMonth = 0;
    let totalMonthProp = 0;
    let totalMonthBop = 0;
    let totalYearProp = 0;
    let totalYearBop = 0;
    let totalPrevYearProp = 0;
    let totalPrevYearBop = 0;

    // Process Property Arrears and Payments
    store.properties.forEach(p => {
      propertyArrears += Math.max(0, calculateBalance(p));
      
      const systemPayments = p.payments || [];

      systemPayments.forEach(pay => {
        const payDate = new Date(pay.date);
        const payYear = payDate.getFullYear();
        if (format(payDate, 'yyyy-MM-dd') === todayStr) totalToday += pay.amount;
        if (format(payDate, 'yyyy-MM') === monthStr) {
            totalMonth += pay.amount;
            totalMonthProp += pay.amount;
        }
        if (payYear === currentYear) {
            totalYearProp += pay.amount;
        }
        if (payYear === currentYear - 1 && payDate <= sameDayLastYear) {
            totalPrevYearProp += pay.amount;
        }

        const dayKey = format(payDate, 'yyyy-MM-dd');
        if (historyMap.has(dayKey)) {
            historyMap.set(dayKey, historyMap.get(dayKey)! + pay.amount);
        }

        allPayments.push({
          payment: pay,
          item: p,
          itemType: 'property',
          ownerName: getPropertyValue(p, 'Owner Name') || 'Unknown',
          identifier: getPropertyValue(p, 'Property No') || 'N/A'
        });
      });
    });

    // Process BOP Arrears and Payments
    store.bops.forEach(b => {
      bopArrears += Math.max(0, calculateBalance(b));
      
      const systemPayments = b.payments || [];

      systemPayments.forEach(pay => {
        const payDate = new Date(pay.date);
        const payYear = payDate.getFullYear();
        if (format(payDate, 'yyyy-MM-dd') === todayStr) totalToday += pay.amount;
        if (format(payDate, 'yyyy-MM') === monthStr) {
            totalMonth += pay.amount;
            totalMonthBop += pay.amount;
        }
        if (payYear === currentYear) {
            totalYearBop += pay.amount;
        }
        if (payYear === currentYear - 1 && payDate <= sameDayLastYear) {
            totalPrevYearBop += pay.amount;
        }

        const dayKey = format(payDate, 'yyyy-MM-dd');
        if (historyMap.has(dayKey)) {
            historyMap.set(dayKey, historyMap.get(dayKey)! + pay.amount);
        }

        allPayments.push({
          payment: pay,
          item: b,
          itemType: 'bop',
          ownerName: getPropertyValue(b, 'NAME OF OWNER') || 'Unknown',
          identifier: getPropertyValue(b, 'BOP No') || 'N/A'
        });
      });
    });

    // Sort payments by date descending (Newest first)
    allPayments.sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());

    let runningTotal = 0;
    const revenueHistory = Array.from(historyMap.entries()).map(([date, revenue]) => {
      runningTotal += revenue;
      return {
        date: format(new Date(date), 'dd MMM'),
        revenue,
        cumulative: runningTotal
      };
    });

    return {
      recentPayments: allPayments.slice(0, 15),
      stats: {
        today: totalToday,
        month: totalMonth,
        monthProperty: totalMonthProp,
        monthBop: totalMonthBop,
        yearProperty: totalYearProp,
        yearBop: totalYearBop,
        prevYearProperty: totalPrevYearProp,
        prevYearBop: totalPrevYearBop
      },
      totalArrears: propertyArrears + bopArrears,
      revenueHistory
    };
  }, [store.properties, store.bops]);

  const handlePrintReceipt = (payment: Payment, item: Property | Bop, itemType: 'property' | 'bop') => {
    // Calculate balance at time of payment for historical accuracy on receipt
    const payments = item.payments || [];
    const index = payments.findIndex(p => p.id === payment.id);
    const paymentsUntilThen = payments.slice(0, index + 1);
    const totalPaidUntilThen = paymentsUntilThen.reduce((sum, p) => sum + p.amount, 0);
    
    let initialAmountDue = 0;
    if (itemType === 'property') {
        const rateableValue = Number(getPropertyValue(item, 'Rateable Value')) || 0;
        const rateImpost = Number(getPropertyValue(item, 'Rate Impost')) || 0;
        const sanitation = Number(getPropertyValue(item, 'Sanitation Charged')) || 0;
        const prevBalance = Number(getPropertyValue(item, 'Previous Balance')) || 0;
        const initialExcelPaid = Number(getPropertyValue(item, 'Total Payment')) || 0;
        initialAmountDue = (rateableValue * rateImpost) + sanitation + prevBalance - initialExcelPaid;
    } else {
        const amount = Number(getPropertyValue(item, 'AMOUNT')) || 0;
        const initialExcelPaid = Number(getPropertyValue(item, 'Payment')) || 0;
        initialAmountDue = amount - initialExcelPaid;
    }

    const receiptData = {
        payment,
        billedItem: item,
        balanceAfterPayment: initialAmountDue - totalPaidUntilThen,
    };

    localStorage.setItem('receiptDetails', JSON.stringify(receiptData));
    router.push(`/receipt?receiptId=${payment.id}`);
  };

  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Revenue_Report_${format(new Date(), 'MMM_yyyy')}`,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline" style={{ color: accentColor }}>Payments Dashboard</h1>
          <p className="text-muted-foreground">Monitor collections, track arrears, and manage receipts.</p>
        </div>
        <Button onClick={handlePrintReport} variant="outline" className="flex items-center gap-2" style={{ color: accentColor, borderColor: accentColor }}>
          <Download className="h-4 w-4" /> Download PDF Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collections Today</CardTitle>
            <Wallet className="h-4 w-4" style={{ color: accentColor }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.today)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total revenue recorded today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.month)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total for {format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalArrears)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total uncollected revenue across system</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Collection Trend</CardTitle>
          <CardDescription>Daily collections over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={revenueHistory}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis yAxisId="left" tickFormatter={(value) => `${value}`} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
              <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="var(--color-cumulative)" strokeWidth={2} dot={false} />
              <ReferenceLine yAxisId="right" y={monthlyGoal} label={{ position: 'top', value: `Goal: ${formatCurrency(monthlyGoal)}`, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>The last 15 payments received across all categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Owner / Business</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.length > 0 ? (
                recentPayments.map(({ payment, item, itemType, ownerName, identifier }) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                        {format(new Date(payment.date), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{ownerName}</div>
                        <div className="text-xs text-muted-foreground uppercase">{itemType}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{identifier}</TableCell>
                    <TableCell className="capitalize">{payment.method.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePrintReceipt(payment, item, itemType)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No payment transactions found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden printable report component */}
      <PrintableReport 
        ref={reportRef} 
        stats={stats} 
        history={revenueHistory} 
        goal={monthlyGoal} 
        arrears={totalArrears} 
      />
    </div>
  );
}