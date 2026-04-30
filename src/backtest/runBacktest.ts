import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";

import { getTradingPairs } from "../modules/get_tradings_pair";

import { HistoricalDataFeed } from "./HistoricalDataFeed";

import { Portfolio } from "./Portfolio";

import { BacktestEngine } from "./BacktestEngine";

import { RollbackShortStrategy } from "../strategies/RollbackShortStrategy";

async function run() {
  const pairs = await getTradingPairs();

  const historicalData = new Map();

  for (const symbol of pairs) {
    const candles = await loadHistoricalCandles(symbol, 30);

    for (const c of candles) {
      c.symbol = symbol;
    }

    historicalData.set(symbol, candles);
  }

  const feed = new HistoricalDataFeed(historicalData);

  const portfolio = new Portfolio(10000);

  const strategy = new RollbackShortStrategy(portfolio, null);

  const engine = new BacktestEngine(feed, portfolio, strategy);

  engine.run();

  console.log(portfolio.getBalance());
}

run();
