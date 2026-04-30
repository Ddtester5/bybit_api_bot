import { loadHistoricalCandles } from "../modules/loadHistoricalCandles";

import { getTradingPairs } from "../modules/get_tradings_pair";

import { HistoricalDataFeed } from "./HistoricalDataFeed";

import { Portfolio } from "./Portfolio";

import { BacktestEngine } from "./BacktestEngine";

import { RollbackShortStrategy } from "../strategies/RollbackShortStrategy";

async function run() {
  try {
    console.log("Starting backtest...");
    console.log("Loading trading pairs...");

    const pairs = await getTradingPairs();
    console.log(`Found ${pairs.length} trading pairs`);

    const historicalData = new Map();

    console.log("Loading historical candles...");
    for (const symbol of pairs.slice(0,1)) {
      try {
        const candles = await loadHistoricalCandles(symbol, 300);
        console.log(`  ${symbol}: ${candles.length} candles`);

        historicalData.set(symbol, candles);
      } catch (error) {
        console.warn(`  ${symbol}: Failed to load candles -`, error);
      }
    }

    console.log(`Total symbols with data: ${historicalData.size}`);

    if (historicalData.size === 0) {
      console.error("No historical data loaded!");
      process.exit(1);
    }

    const feed = new HistoricalDataFeed(historicalData);
    const portfolio = new Portfolio(10000);
    const strategy = new RollbackShortStrategy();

    console.log("Running backtest engine...");
    const engine = new BacktestEngine(feed, portfolio, strategy);

    engine.run();

    const finalBalance = portfolio.getBalance();
    const closedTrades = portfolio.getClosedTrades();

    console.log("\n=== BACKTEST RESULTS ===");
    console.log(`Initial balance: $10,000`);
    console.log(`Final balance: $${finalBalance.toFixed(2)}`);
    console.log(`P&L: $${(finalBalance - 10000).toFixed(2)}`);
    console.log(
      `Return: ${(((finalBalance - 10000) / 10000) * 100).toFixed(2)}%`,
    );
    console.log(`Total trades: ${closedTrades.length}`);

    if (closedTrades.length > 0) {
      let profitCount = 0;
      let totalPnL = 0;

      for (const trade of closedTrades) {
        if (trade.pnl > 0) profitCount++;
        totalPnL += trade.pnl;
      }

      console.log(
        `Win rate: ${((profitCount / closedTrades.length) * 100).toFixed(2)}%`,
      );
      console.log(`Total P&L: $${totalPnL.toFixed(2)}`);

      console.log("\nTrades breakdown:");
      closedTrades.slice(0, 5).forEach((trade, idx) => {
        console.log(
          `  ${idx + 1}. ${trade.symbol}: ${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)} (${trade.reason})`,
        );
      });
      if (closedTrades.length > 5) {
        console.log(`  ... and ${closedTrades.length - 5} more trades`);
      }
    }

    console.log("Backtest completed successfully!");
  } catch (error) {
    console.error("Backtest error:", error);
    process.exit(1);
  }
}

run();
