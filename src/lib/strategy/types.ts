export type Direction = "long" | "short";

export type FieldKind = "close" | "open" | "high" | "low" | "volume";

export type IndicatorKind = "sma" | "ema" | "rsi" | "macd" | "atr" | "bollinger" | "max" | "min";

export type ComparisonOp = "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "cross_above" | "cross_below";

export interface SeriesRef {
  kind: "field" | "indicator" | "constant";
  field?: FieldKind;
  indicator?: IndicatorKind;
  params?: number[];
  value?: number;
}

export interface ConditionNode {
  type: "condition";
  left: SeriesRef;
  op: ComparisonOp;
  right: SeriesRef;
  negated?: boolean;
}

export interface GroupNode {
  type: "group";
  logic: "and" | "or";
  negated?: boolean;
  children: LogicNode[];
}

export type LogicNode = ConditionNode | GroupNode;

export interface RiskConfig {
  stopLossPct: number | null;
  takeProfitPct: number | null;
  trailingStopPct: number | null;
  maxBarsHeld: number | null;
}

export interface PositionSizing {
  mode: "fixed" | "percent" | "risk";
  value: number;
}

export interface StrategyConfig {
  name: string;
  description?: string;
  direction: Direction;
  entry: LogicNode[];
  exit: LogicNode[];
  risk: RiskConfig;
  positionSizing: PositionSizing;
}

export type Timeframe = "1d" | "1wk" | "1mo";

export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  from: string;
  to: string;
  startingCapital: number;
  commissionPct: number;
  slippageBps: number;
  strategy: StrategyConfig;
  allowDataFetch?: boolean;
}

export interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export type ExitReason = "signal" | "stop_loss" | "take_profit" | "trailing_stop" | "max_bars" | "end";

export interface Trade {
  entryIndex: number;
  entryDate: string;
  entryPrice: number;
  exitIndex: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  direction: Direction;
  pnl: number;
  returnPct: number;
  fees: number;
  barsHeld: number;
  exitReason: ExitReason;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdownPct: number;
  price: number;
  position: "long" | "short" | "flat";
}

export interface BacktestMetrics {
  totalReturnPct: number;
  cagrPct: number;
  sharpe: number;
  sortino: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  avgTradePct: number;
  numTrades: number;
  exposurePct: number;
  volatilityPct: number;
  bestTradePct: number;
  worstTradePct: number;
  finalEquity: number;
  grossProfit: number;
  grossLoss: number;
  startDate: string;
  endDate: string;
  bars: number;
  years: number;
}

export interface BacktestDataInfo {
  symbol: string;
  bars: number;
  start: string;
  end: string;
  source: string;
  fetchedMissing: boolean;
}

export interface BacktestResult {
  config: BacktestConfig;
  metrics: BacktestMetrics;
  equityCurve: EquityPoint[];
  trades: Trade[];
  errors: string[];
  warnings: string[];
  dataInfo: BacktestDataInfo;
}

export interface ParamSpec {
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface OptimizedCombo {
  params: Record<string, number>;
  sharpe: number;
  sortino: number;
  cagrPct: number;
  totalReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  numTrades: number;
  exposurePct: number;
  sensitivity: number;
  score: number;
  metrics: BacktestMetrics;
}

export interface OptimizeResult {
  combos: OptimizedCombo[];
  totalCombos: number;
  elapsedMs: number;
  paramSpecs: ParamSpec[];
  base: {
    sharpe: number;
    totalReturnPct: number;
    maxDrawdownPct: number;
  };
}

export interface WalkForwardFold {
  index: number;
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  params: Record<string, number>;
  trainMetrics: BacktestMetrics | null;
  testMetrics: BacktestMetrics | null;
}

export interface WalkForwardResult {
  mode: "three-way" | "rolling";
  folds: WalkForwardFold[];
  combinedOos: BacktestMetrics | null;
  combinedEquity: EquityPoint[];
  train: BacktestMetrics | null;
  validation: BacktestMetrics | null;
  verdict: {
    survives: boolean;
    reasons: string[];
  };
  elapsedMs: number;
  errors: string[];
}

export interface CollectibleParam {
  path: string;
  label: string;
  value: number;
}
