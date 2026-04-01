const watchlist = [
    // Wall Street
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC",
    "ORCL", "IBM", "CSCO", "ADBE", "CRM", "QCOM", "TXN", "AVGO", "PYPL", "UBER",
    "SHOP", "SNOW", "PLTR", "SQ", "ABNB", "BABA", "COIN", "ZM", "DOCU", "ROKU",
    "DIS", "NKE", "SBUX", "MCD", "KO", "PEP", "WMT", "COST", "TGT", "HD",
    "LOW", "BA", "GE", "CAT", "XOM", "CVX", "JPM", "BAC", "GS", "MS",
    "V", "MA", "AXP", "JNJ", "PFE", "MRK", "ABBV", "UNH", "CVS", "WFC",

    // BSE / India
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "LT", "ITC", "KOTAKBANK", "AXISBANK",
    "BHARTIARTL", "ASIANPAINT", "MARUTI", "SUNPHARMA", "HCLTECH", "WIPRO", "ULTRACEMCO", "TITAN", "NESTLEIND", "BAJFINANCE",
    "BAJAJFINSV", "POWERGRID", "NTPC", "ONGC", "TATAMOTORS", "TATASTEEL", "JSWSTEEL", "ADANIENT", "ADANIPORTS", "COALINDIA",
    "INDUSINDBK", "TECHM", "HINDUNILVR", "HEROMOTOCO", "BRITANNIA", "EICHERMOT", "CIPLA", "DIVISLAB", "DRREDDY", "APOLLOHOSP",
    "GRASIM", "HINDALCO", "SHREECEM", "SBILIFE", "TATACONSUM", "UPL", "BAJAJ_AUTO", "PIDILITIND", "DABUR", "GODREJCP",
    "AMBUJACEM", "BANKBARODA", "PNB", "CANBK", "LODHA", "DLF", "IOC", "BPCL", "GAIL", "ZOMATO"
];

let allStocks = [];

const stockContainer = document.getElementById("stockContainer");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const loadBtn = document.getElementById("loadBtn");
const statusBox = document.getElementById("status");
const stockCount = document.getElementById("stockCount");
const upCount = document.getElementById("upCount");
const downCount = document.getElementById("downCount");

function getRandomBetween(min, max) {
    return +(Math.random() * (max - min) + min).toFixed(2);
}

function getMarket(symbol) {
    const wallStreetCount = 60;
    return watchlist.indexOf(symbol) < wallStreetCount ? "Wall Street" : "BSE";
}

function getFakeStock(symbol) {
    const previousClose = getRandomBetween(50, 5000);
    const open = +(previousClose + getRandomBetween(-30, 30)).toFixed(2);
    const price = +(previousClose + getRandomBetween(-80, 80)).toFixed(2);
    const high = +(Math.max(open, price) + getRandomBetween(0, 40)).toFixed(2);
    const low = +(Math.min(open, price) - getRandomBetween(0, 40)).toFixed(2);
    const change = +(price - previousClose).toFixed(2);
    const changePercent = +((change / previousClose) * 100).toFixed(2);
    const volume = Math.floor(getRandomBetween(100000, 5000000));

    return {
        symbol,
        market: getMarket(symbol),
        price,
        open,
        high,
        low,
        previousClose,
        change,
        changePercent,
        volume,
        updatedAt: new Date().toLocaleTimeString()
    };
}

function fetchFakeStocks() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = watchlist.map(symbol => getFakeStock(symbol));
            resolve({
                success: true,
                count: data.length,
                data
            });
        }, 400);
    });
}

function updateStats(stocks) {
    stockCount.textContent = stocks.length;
    upCount.textContent = stocks.filter(stock => stock.change > 0).length;
    downCount.textContent = stocks.filter(stock => stock.change < 0).length;
}

function getFilteredAndSortedStocks() {
    let filtered = [...allStocks];

    const searchText = searchInput.value.trim().toLowerCase();
    const filterValue = filterSelect.value;
    const sortValue = sortSelect.value;

    if (searchText) {
        filtered = filtered.filter(stock =>
            stock.symbol.toLowerCase().includes(searchText) ||
            stock.market.toLowerCase().includes(searchText)
        );
    }

    if (filterValue === "gainers") {
        filtered = filtered.filter(stock => stock.change > 0);
    } else if (filterValue === "losers") {
        filtered = filtered.filter(stock => stock.change < 0);
    } else if (filterValue === "bse") {
        filtered = filtered.filter(stock => stock.market === "BSE");
    } else if (filterValue === "wallstreet") {
        filtered = filtered.filter(stock => stock.market === "Wall Street");
    }

    if (sortValue === "priceHighToLow") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortValue === "priceLowToHigh") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === "changeHighToLow") {
        filtered.sort((a, b) => b.changePercent - a.changePercent);
    } else if (sortValue === "changeLowToHigh") {
        filtered.sort((a, b) => a.changePercent - b.changePercent);
    } else {
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return filtered;
}

function renderStocks() {
    const stocks = getFilteredAndSortedStocks();

    if (!stocks.length) {
        stockContainer.innerHTML = `<p class="empty-msg">No stocks found.</p>`;
        updateStats(stocks);
        return;
    }

    stockContainer.innerHTML = stocks.map(stock => {
        const isUp = stock.change >= 0;
        return `
            <div class="stock-card">
                <div class="stock-top">
                    <div>
                        <h3>${stock.symbol}</h3>
                        <p class="market">${stock.market}</p>
                    </div>
                    <span class="badge ${isUp ? "up" : "down"}">
                        ${isUp ? "▲" : "▼"} ${stock.changePercent}%
                    </span>
                </div>

                <div class="price-row">
                    <h2>₹${stock.price}</h2>
                    <p class="${isUp ? "positive" : "negative"}">
                        ${isUp ? "+" : ""}${stock.change}
                    </p>
                </div>

                <div class="stock-details">
                    <p><strong>Open:</strong> ${stock.open}</p>
                    <p><strong>High:</strong> ${stock.high}</p>
                    <p><strong>Low:</strong> ${stock.low}</p>
                    <p><strong>Prev Close:</strong> ${stock.previousClose}</p>
                    <p><strong>Volume:</strong> ${stock.volume.toLocaleString()}</p>
                    <p><strong>Updated:</strong> ${stock.updatedAt}</p>
                </div>
            </div>
        `;
    }).join("");

    updateStats(stocks);
}

async function loadStocks(showStatus = true) {
    try {
        if (showStatus) {
            statusBox.textContent = "Loading stock data...";
        }

        const response = await fetchFakeStocks();

        if (!response.success) {
            throw new Error("Failed to fetch stocks");
        }

        allStocks = response.data;
        renderStocks();

        statusBox.textContent = `Loaded ${response.count} stocks successfully`;
    } catch (error) {
        console.error(error);
        statusBox.textContent = "Error loading stocks";
        stockContainer.innerHTML = `<p class="empty-msg">Something went wrong.</p>`;
    }
}

searchInput.addEventListener("input", renderStocks);
filterSelect.addEventListener("change", renderStocks);
sortSelect.addEventListener("change", renderStocks);
loadBtn.addEventListener("click", () => loadStocks(true));

loadStocks(true);

setInterval(async () => {
    const response = await fetchFakeStocks();
    allStocks = response.data;
    renderStocks();
    statusBox.textContent = `Live updated at ${new Date().toLocaleTimeString()}`;
}, 2000);