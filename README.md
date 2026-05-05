# Stockify - Realtime Stock Tracker

Full-stack school project: **FastAPI + yfinance** backend serving live US + NSE/BSE stock quotes to a responsive HTML/JS dashboard.

## Run

```bash
# 1. Backend
cd backend
pip3 install -r requirements.txt
bash run.sh               # → http://localhost:8000

# 2. Frontend (new terminal)
cd web_stock
python3 -m http.server 5500   # → http://localhost:5500
```

Open http://localhost:5500.

## Endpoints

| Method | Path | Example |
|---|---|---|
| GET | `/health` | `curl localhost:8000/health` |
| GET | `/quote/{symbol}` | `localhost:8000/quote/AAPL` |
| GET | `/quotes?symbols=...` | `localhost:8000/quotes?symbols=AAPL,RELIANCE.NS` |
| GET | `/history/{symbol}?period=1mo&interval=1d` | 30-day daily candles |

Symbol format:
- **US:** `AAPL`, `MSFT`, `TSLA`
- **NSE (India):** `RELIANCE.NS`, `TCS.NS`
- **BSE (India):** `RELIANCE.BO`

## Data source

[yfinance](https://github.com/ranaroussi/yfinance) — free, unlimited, no API key. Each quote returns open/high/low/close/previous-close/volume.

A 15-second server-side cache protects against accidental spam.
