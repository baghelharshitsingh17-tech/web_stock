"""
Stockify backend - FastAPI + yfinance.

Endpoints:
    GET /quotes?symbols=AAPL,MSFT,RELIANCE.NS
    GET /quote/{symbol}
    GET /history/{symbol}?period=1mo&interval=1d
    GET /health

yfinance is free, unlimited (within reason), and supports:
    - US symbols:    AAPL, MSFT, TSLA ...
    - NSE (India):   RELIANCE.NS, TCS.NS ...
    - BSE (India):   RELIANCE.BO, TCS.BO ...
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List

import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Stockify API", version="1.0.0")

# Allow the static site (any origin during dev) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- tiny in-memory cache so we don't hammer Yahoo on every refresh ---
_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_TTL_SECONDS = 15  # live-ish without spamming the upstream


def _build_quote(symbol: str) -> Dict[str, Any] | None:
    """Fetch one ticker and normalise it to our frontend shape."""
    ticker = yf.Ticker(symbol)

    # fast_info is the quickest, most reliable surface in yfinance
    fi = ticker.fast_info
    try:
        price = float(fi.last_price)
        prev_close = float(fi.previous_close)
        open_ = float(fi.open)
        high = float(fi.day_high)
        low = float(fi.day_low)
        volume = int(fi.last_volume or 0)
        currency = (fi.currency or "USD").upper()
    except Exception:
        return None

    if price is None or prev_close is None:
        return None

    change = round(price - prev_close, 4)
    change_percent = round((change / prev_close) * 100, 4) if prev_close else 0.0

    # Market label
    if symbol.endswith(".NS"):
        market, symbol_label, ccy = "NSE", symbol.replace(".NS", ""), "₹"
    elif symbol.endswith(".BO"):
        market, symbol_label, ccy = "BSE", symbol.replace(".BO", ""), "₹"
    else:
        market, symbol_label = "Wall Street", symbol
        ccy = "$" if currency == "USD" else currency

    return {
        "symbol": symbol_label,
        "apiSymbol": symbol,
        "market": market,
        "currency": ccy,
        "price": round(price, 2),
        "open": round(open_, 2),
        "high": round(high, 2),
        "low": round(low, 2),
        "previousClose": round(prev_close, 2),
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
        "volume": volume,
        "live": True,
    }


def _cached_quote(symbol: str) -> Dict[str, Any] | None:
    now = time.time()
    hit = _CACHE.get(symbol)
    if hit and (now - hit[0] < _TTL_SECONDS):
        return hit[1]
    data = _build_quote(symbol)
    if data is not None:
        _CACHE[symbol] = (now, data)
    return data


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/quote/{symbol}")
def get_quote(symbol: str) -> Dict[str, Any]:
    data = _cached_quote(symbol.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    return data


@app.get("/quotes")
def get_quotes(
    symbols: str = Query(..., description="Comma-separated tickers, e.g. AAPL,MSFT,RELIANCE.NS")
) -> Dict[str, Any]:
    requested: List[str] = [s.strip().upper() for s in symbols.split(",") if s.strip()]

    # Parallel fetch - 16 threads cut 60 symbols from ~27s to ~3s
    results: List[Dict[str, Any]] = []
    errors: List[str] = []

    def work(sym: str):
        try:
            return sym, _cached_quote(sym)
        except Exception as exc:  # noqa: BLE001
            return sym, None

    with ThreadPoolExecutor(max_workers=16) as pool:
        for sym, q in pool.map(work, requested):
            if q:
                results.append(q)
            else:
                errors.append(sym)

    # Preserve requested order
    order = {s: i for i, s in enumerate(requested)}
    results.sort(key=lambda r: order.get(r["apiSymbol"], 999))

    return {
        "count": len(results),
        "errors": errors,
        "data": results,
        "timestamp": int(time.time()),
    }


@app.get("/history/{symbol}")
def get_history(
    symbol: str,
    period: str = Query("1mo", description="1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max"),
    interval: str = Query("1d", description="1m,5m,15m,30m,1h,1d,1wk,1mo"),
) -> Dict[str, Any]:
    ticker = yf.Ticker(symbol.upper())
    try:
        df = ticker.history(period=period, interval=interval)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No history for {symbol}")

    points = [
        {
            "t": idx.isoformat(),
            "o": float(row["Open"]),
            "h": float(row["High"]),
            "l": float(row["Low"]),
            "c": float(row["Close"]),
            "v": int(row["Volume"]),
        }
        for idx, row in df.iterrows()
    ]
    return {"symbol": symbol.upper(), "period": period, "interval": interval, "points": points}
