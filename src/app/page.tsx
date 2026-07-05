'use client';

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingDown, TrendingUp, Calendar, PieChart, History,
  Lightbulb, Bell, Plus, Edit3, Trash2, Search, Filter, Moon, Sun,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle, 
  IndianRupee, Target, Clock, BarChart3, ArrowUpRight, ArrowDownRight,
  Settings, Eye, ChevronDown
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAppStore, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Category, type ViewTab } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, AreaChart, Area, Legend
} from "recharts";

// ─── Helper functions ───
function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function getDaysRemaining(month: number, year: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (month === currentMonth && year === currentYear) {
    const daysInMonth = getDaysInMonth(month, year);
    return daysInMonth - now.getDate() + 1;
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return getDaysInMonth(month, year);
  }
  return 0;
}

function getTodaySpent(expenses: any[]): number {
  const today = new Date().toISOString().split("T")[0];
  return expenses
    .filter((e) => new Date(e.date).toISOString().split("T")[0] === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

function getMonthName(month: number): string {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return months[month - 1] || "";
}

function getShortMonthName(month: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] || "";
}

// ─── Stat Card Component ───
function StatCard({ title, value, icon: Icon, trend, color, subtitle }: {
  title: string;
  value: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
          {trend && (
            <div className="flex items-center mt-3 text-xs">
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
              ) : null}
              <span className={trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}>
                {trend === "up" ? "Under budget" : trend === "down" ? "Over budget" : "On track"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Budget Status Card ───
function BudgetStatusCard({ budget, totalSpent, remaining, daysRemaining, todaySpent }: {
  budget: number;
  totalSpent: number;
  remaining: number;
  daysRemaining: number;
  todaySpent: number;
}) {
  const safeDailyLimit = daysRemaining > 0 ? remaining / daysRemaining : 0;
  const todayDifference = todaySpent - safeDailyLimit;
  const isOverBudget = todayDifference > 0;
  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  
  // Projected savings
  const projectedEndOfMonth = daysRemaining > 0 
    ? totalSpent + (safeDailyLimit * daysRemaining) 
    : totalSpent;
  const projectedSavings = budget - projectedEndOfMonth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Financial Insight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget usage progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Usage</span>
              <span className={`font-semibold ${percentage > 90 ? "text-red-500" : percentage > 75 ? "text-amber-500" : "text-emerald-500"}`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  percentage > 90 ? "bg-gradient-to-r from-red-500 to-red-600" :
                  percentage > 75 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                  percentage > 50 ? "bg-gradient-to-r from-yellow-500 to-amber-500" :
                  "bg-gradient-to-r from-emerald-500 to-teal-500"
                }`}
              />
            </div>
          </div>

          {/* Insight grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Monthly Budget</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(budget)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(remaining)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Days Left</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{daysRemaining}</p>
            </div>
          </div>

          {/* Daily limit */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium">Safe Daily Limit</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(Math.round(safeDailyLimit))}<span className="text-sm font-normal text-muted-foreground">/day</span>
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Today&apos;s Spending:</span>
              <span className="font-semibold">{formatCurrency(todaySpent)}</span>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`rounded-xl p-4 ${
            isOverBudget 
              ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
              : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{isOverBudget ? "🔴" : "🟢"}</span>
              <div>
                {isOverBudget ? (
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      You spent more than today&apos;s recommended budget
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      You&apos;re {formatCurrency(Math.round(todayDifference))} over today&apos;s limit. 
                      New daily limit: {formatCurrency(Math.round(daysRemaining > 1 ? (remaining - todaySpent) / (daysRemaining - 1) : 0))}/day
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Great! You are {formatCurrency(Math.round(Math.abs(todayDifference)))} under today&apos;s recommended limit
                    </p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">
                      If you continue at this pace, you will finish the month with approximately {formatCurrency(Math.round(Math.max(0, projectedSavings)))} saved.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Add/Edit Expense Dialog ───
function ExpenseFormDialog() {
  const { showAddExpense, setShowAddExpense, editingExpense, setEditingExpense, addExpense, updateExpense } = useAppStore();
  const isOpen = showAddExpense || !!editingExpense;
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [prevEditingId, setPrevEditingId] = useState<string | null>(null);
  const [prevShowAdd, setPrevShowAdd] = useState(false);

  // Sync form when dialog opens/changes - using ref pattern to avoid setState-in-effect
  if (editingExpense && editingExpense.id !== prevEditingId) {
    setAmount(editingExpense.amount.toString());
    setCategory(editingExpense.category);
    setNote(editingExpense.note);
    setDate(new Date(editingExpense.date).toISOString().split("T")[0]);
    setPrevEditingId(editingExpense.id);
    setPrevShowAdd(false);
  } else if (showAddExpense && !prevShowAdd && !editingExpense) {
    setAmount("");
    setCategory("Food");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setPrevShowAdd(true);
    setPrevEditingId(null);
  } else if (!showAddExpense && !editingExpense) {
    if (prevShowAdd) setPrevShowAdd(false);
    if (prevEditingId) setPrevEditingId(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        amount: parseFloat(amount),
        category,
        note,
        date,
      });
      setEditingExpense(null);
    } else {
      await addExpense({
        amount: parseFloat(amount),
        category,
        note,
        date,
      });
      setShowAddExpense(false);
    }

    setLoading(false);
    setAmount("");
    setCategory("Food");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowAddExpense(false);
        setEditingExpense(null);
      }
    }}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-white/20 dark:border-gray-800/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingExpense ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-xl text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span>{cat}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              placeholder="What was this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            disabled={loading || !amount}
          >
            {loading ? "Saving..." : editingExpense ? "Update Expense" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Budget Setting Dialog ───
function BudgetSettingDialog() {
  const { budget, setBudget, selectedMonth, selectedYear } = useAppStore();
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open && !prevOpen) {
    setAmount(budget ? budget.amount.toString() : "");
    setPrevOpen(true);
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setBudget(parseFloat(amount) || 0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-2 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
          <Settings className="w-4 h-4" />
          Set Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget for {getMonthName(selectedMonth)} {selectedYear}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Budget Amount (₹)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="e.g., 3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="rounded-xl text-lg"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            Save Budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Notification Bell ───
function NotificationBell() {
  const { notifications, markNotificationRead } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {n.type === "100" ? "🔴" : n.type === "90" ? "🟠" : n.type === "75" ? "🟡" : "🟢"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Dashboard View ───
function DashboardView() {
  const { budget, expenses, analytics } = useAppStore();
  const { selectedMonth, selectedYear } = useAppStore();

  const budgetAmount = budget?.amount || analytics?.budget || 0;
  const totalSpent = analytics?.totalSpent || 0;
  const remaining = analytics?.remaining || 0;
  const daysRemaining = getDaysRemaining(selectedMonth, selectedYear);
  const todaySpent = getTodaySpent(expenses);

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Budget"
          value={formatCurrency(budgetAmount)}
          icon={Wallet}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={TrendingDown}
          color="bg-gradient-to-br from-red-500 to-rose-600"
          trend={totalSpent > budgetAmount ? "down" : "up"}
        />
        <StatCard
          title="Remaining"
          value={formatCurrency(remaining)}
          icon={TrendingUp}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          trend={remaining > 0 ? "up" : "down"}
        />
        <StatCard
          title="Days Left"
          value={daysRemaining.toString()}
          icon={Calendar}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          subtitle={`of ${getDaysInMonth(selectedMonth, selectedYear)} days`}
        />
        <StatCard
          title="Today's Spending"
          value={formatCurrency(todaySpent)}
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Safe Daily Limit"
          value={daysRemaining > 0 ? `${formatCurrency(Math.round(remaining / daysRemaining))}` : "₹0"}
          icon={Target}
          color="bg-gradient-to-br from-cyan-500 to-teal-600"
          subtitle="per day remaining"
        />
      </div>

      {/* Financial Insight Card */}
      <BudgetStatusCard
        budget={budgetAmount}
        totalSpent={totalSpent}
        remaining={remaining}
        daysRemaining={daysRemaining}
        todaySpent={todaySpent}
      />

      {/* Recent Expenses */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expenses yet. Add your first expense!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 5).map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xl">{CATEGORY_ICONS[expense.category as Category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{expense.note || expense.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="font-semibold text-sm text-red-600 dark:text-red-400">
                    -{formatCurrency(expense.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Expenses View ───
function ExpensesView() {
  const { expenses, deleteExpense, setEditingExpense, searchQuery, setSearchQuery, filterCategory, setFilterCategory } = useAppStore();

  const filtered = expenses.filter((e) => {
    const matchesSearch = !searchQuery || 
      e.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expenses found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="divide-y">
                {filtered.map((expense, i) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${CATEGORY_COLORS[expense.category as Category]}20` }}
                    >
                      {CATEGORY_ICONS[expense.category as Category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{expense.note || expense.category}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs rounded-lg">
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={() => setEditingExpense(expense)}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Analytics View ───
function AnalyticsView() {
  const { analytics, budget } = useAppStore();
  const { selectedMonth, selectedYear } = useAppStore();

  if (!analytics || analytics.budget === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No data to analyze yet</p>
        <p className="text-sm mt-1">Set a budget and add expenses to see analytics</p>
      </div>
    );
  }

  const categoryData = Object.entries(analytics.categoryBreakdown).map(([name, value]) => ({
    name,
    value: Math.round(value),
    color: CATEGORY_COLORS[name as Category] || "#6b7280",
  }));

  const dailyData = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => {
    const day = i + 1;
    const found = analytics.dailySpending.find((d) => d.day === day);
    return { day, amount: found ? Math.round(found.amount) : 0 };
  });

  const weeklyData = analytics.weeklySpending.map((w) => ({
    ...w,
    amount: Math.round(w.amount),
  }));

  const percentage = analytics.budget > 0 ? (analytics.totalSpent / analytics.budget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Usage Gauge */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Budget Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={percentage > 90 ? "#ef4444" : percentage > 75 ? "#f59e0b" : percentage > 50 ? "#eab308" : "#10b981"}
                  strokeWidth="8"
                  strokeDasharray={`${(Math.min(percentage, 100) / 100) * 251.3} 251.3`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{percentage.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">used</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Spent</p>
              <p className="font-bold text-red-500">{formatCurrency(analytics.totalSpent)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Budget</p>
              <p className="font-bold text-emerald-500">{formatCurrency(analytics.budget)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Left</p>
              <p className="font-bold text-blue-500">{formatCurrency(analytics.remaining)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      {categoryData.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="w-full lg:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-2">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm flex-1">{CATEGORY_ICONS[item.name as Category]} {item.name}</span>
                    <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Spending Chart */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Day ${label}`} />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Spending Chart */}
      {weeklyData.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weekly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend (Area) */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData.filter((d) => d.amount > 0)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Day ${label}`} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Calendar View ───
function CalendarView() {
  const { expenses, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  // Group expenses by day
  const expensesByDay: Record<number, typeof expenses> = {};
  expenses.forEach((e) => {
    const day = new Date(e.date).getDate();
    if (!expensesByDay[day]) expensesByDay[day] = [];
    expensesByDay[day].push(e);
  });

  const dailyTotals: Record<number, number> = {};
  expenses.forEach((e) => {
    const day = new Date(e.date).getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
  });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const selectedDayExpenses = selectedDate ? (expensesByDay[selectedDate] || []) : [];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => {
            if (selectedMonth === 1) {
              setSelectedMonth(12);
              setSelectedYear(selectedYear - 1);
            } else {
              setSelectedMonth(selectedMonth - 1);
            }
            setSelectedDate(null);
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold">
          {getMonthName(selectedMonth)} {selectedYear}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => {
            if (selectedMonth === 12) {
              setSelectedMonth(1);
              setSelectedYear(selectedYear + 1);
            } else {
              setSelectedMonth(selectedMonth + 1);
            }
            setSelectedDate(null);
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const hasExpenses = expensesByDay[day] && expensesByDay[day].length > 0;
              const total = dailyTotals[day] || 0;
              const isToday = day === new Date().getDate() && selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear();
              const isSelected = day === selectedDate;

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                  className={`relative p-1.5 rounded-xl text-sm transition-all aspect-square flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
                      : isToday
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="font-medium text-xs">{day}</span>
                  {hasExpenses && (
                    <div className={`flex gap-0.5 mt-0.5`}>
                      <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                    </div>
                  )}
                  {hasExpenses && (
                    <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                      {total >= 1000 ? `${(total / 1000).toFixed(0)}k` : total}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Expenses */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {getMonthName(selectedMonth)} {selectedDate}, {selectedYear}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Total: {formatCurrency(dailyTotals[selectedDate] || 0)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No expenses on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayExpenses.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30">
                      <span>{CATEGORY_ICONS[e.category as Category]}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{e.note || e.category}</p>
                        <Badge variant="secondary" className="text-xs rounded-lg">{e.category}</Badge>
                      </div>
                      <span className="font-semibold text-sm">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── History View ───
function HistoryView() {
  const { fetchBudget, fetchExpenses, fetchAnalytics, setSelectedMonth, setSelectedYear } = useAppStore();
  const [historyMonths, setHistoryMonths] = useState<{ month: number; year: number; budget: number; spent: number }[]>([]);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<{ month: number; year: number } | null>(null);

  const loadHistory = useCallback(async () => {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      try {
        const budgetRes = await fetch(`/api/budget?month=${m}&year=${y}`);
        const analyticsRes = await fetch(`/api/analytics?month=${m}&year=${y}`);
        if (budgetRes.ok && analyticsRes.ok) {
          const budgets = await budgetRes.json();
          const analytics = await analyticsRes.json();
          const b = budgets.find((b: any) => b.month === m && b.year === y);
          if (b || analytics.totalSpent > 0) {
            months.push({
              month: m,
              year: y,
              budget: b?.amount || 0,
              spent: analytics.totalSpent || 0,
            });
          }
        }
      } catch (e) {
        // skip
      }
    }
    setHistoryMonths(months);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const switchToMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchBudget(month, year);
    fetchExpenses(month, year);
    fetchAnalytics(month, year);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <History className="w-5 h-5 text-emerald-500" />
        Monthly History
      </h3>
      {historyMonths.length === 0 ? (
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
          <CardContent className="py-12 text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No history yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {historyMonths.map((m, i) => {
            const savings = m.budget - m.spent;
            const percentage = m.budget > 0 ? (m.spent / m.budget) * 100 : 0;
            return (
              <motion.div
                key={`${m.month}-${m.year}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => switchToMonth(m.month, m.year)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{getMonthName(m.month)} {m.year}</p>
                        <p className="text-xs text-muted-foreground">
                          Budget: {formatCurrency(m.budget)} | Spent: {formatCurrency(m.spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${savings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {savings >= 0 ? "+" : ""}{formatCurrency(savings)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}% used
                        </p>
                      </div>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Savings Insights View ───
function InsightsView() {
  const { analytics, expenses, selectedMonth, selectedYear, budget } = useAppStore();

  if (!analytics || !budget) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Set a budget and add expenses to see insights</p>
      </div>
    );
  }

  const totalSpent = analytics.totalSpent;
  const totalBudget = analytics.budget;
  const totalSaved = totalBudget - totalSpent;
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysWithExpenses = analytics.dailySpending.length;
  const avgDailySpending = daysWithExpenses > 0 ? totalSpent / daysWithExpenses : 0;
  const savingPercentage = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

  // Highest/lowest spending day
  let highestDay = { day: 0, amount: 0 };
  let lowestDay = { day: 0, amount: Infinity };
  analytics.dailySpending.forEach((d) => {
    if (d.amount > highestDay.amount) highestDay = d;
    if (d.amount < lowestDay.amount) lowestDay = d;
  });
  if (lowestDay.amount === Infinity) lowestDay = { day: 0, amount: 0 };

  // Most expensive category
  let mostExpensiveCategory = { name: "None", amount: 0 };
  Object.entries(analytics.categoryBreakdown).forEach(([name, amount]) => {
    if (amount > mostExpensiveCategory.amount) {
      mostExpensiveCategory = { name, amount };
    }
  });

  const insights = [
    {
      label: "Total Saved",
      value: formatCurrency(Math.max(0, totalSaved)),
      icon: TrendingUp,
      color: totalSaved >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: totalSaved >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Average Daily Spending",
      value: formatCurrency(Math.round(avgDailySpending)),
      icon: BarChart3,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Highest Spending Day",
      value: highestDay.day ? `Day ${highestDay.day} - ${formatCurrency(highestDay.amount)}` : "N/A",
      icon: ArrowUpRight,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Lowest Spending Day",
      value: lowestDay.day ? `Day ${lowestDay.day} - ${formatCurrency(lowestDay.amount)}` : "N/A",
      icon: ArrowDownRight,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Most Expensive Category",
      value: mostExpensiveCategory.name !== "None" ? `${CATEGORY_ICONS[mostExpensiveCategory.name as Category]} ${mostExpensiveCategory.name} (${formatCurrency(mostExpensiveCategory.amount)})` : "N/A",
      icon: PieChart,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Monthly Saving Percentage",
      value: `${savingPercentage.toFixed(1)}%`,
      icon: Target,
      color: savingPercentage >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: savingPercentage >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        Savings Insights for {getMonthName(selectedMonth)} {selectedYear}
      </h3>
      <div className="grid gap-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-800/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${insight.bgColor}`}>
                    <insight.icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{insight.label}</p>
                    <p className={`font-semibold ${insight.color}`}>{insight.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App Shell ───
function MainApp() {
  const {
    currentTab, setCurrentTab,
    selectedMonth, selectedYear,
    showAddExpense, setShowAddExpense,
    fetchBudget, fetchExpenses, fetchAnalytics, fetchNotifications,
    checkAuth, isAuthenticated, isLoading,
    budget,
  } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  // Auto-login: create default user if not authenticated
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const res = await fetch("/api/auth/auto-login", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            // Update store with authenticated user
            const state = useAppStore.getState();
            (state as any).isAuthenticated = true;
            (state as any).isLoading = false;
            (state as any).user = { id: data.user.id, email: data.user.email, name: data.user.name || "" };
          }
        }
      } catch (error) {
        console.error("Auto-login error:", error);
      }
    };

    if (!isAuthenticated) {
      autoLogin();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBudget();
      fetchExpenses();
      fetchAnalytics();
      fetchNotifications();
    }
  }, [isAuthenticated, selectedMonth, selectedYear]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const tabs: { id: ViewTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: Wallet },
    { id: "expenses", label: "Expenses", icon: TrendingDown },
    { id: "analytics", label: "Analytics", icon: PieChart },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "history", label: "History", icon: History },
    { id: "insights", label: "Insights", icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-800/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block">
              Smart Budget
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <BudgetSettingDialog />
            <NotificationBell />
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentTab === "dashboard" && <DashboardView />}
            {currentTab === "expenses" && <ExpensesView />}
            {currentTab === "analytics" && <AnalyticsView />}
            {currentTab === "calendar" && <CalendarView />}
            {currentTab === "history" && <HistoryView />}
            {currentTab === "insights" && <InsightsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FAB - Add Expense */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-300 dark:shadow-emerald-900/50 flex items-center justify-center text-white"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-t border-white/20 dark:border-gray-800/50 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-around py-2 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                currentTab === tab.id
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {currentTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="w-4 h-0.5 rounded-full bg-emerald-500 mt-0.5"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Expense Form Dialog */}
      <ExpenseFormDialog />
    </div>
  );
}

// ─── Page Entry ───
export default function Home() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

// ─── Theme Provider Wrapper ───
import { ThemeProvider as NextThemesProvider } from "next-themes";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
