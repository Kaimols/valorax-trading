let currentUser = null;
let currentAsset = null;
let buyUnitInput = "";
let buyOrderMode = "UNITS";

let buyDraftUnits = 0;
let buyDraftEuro = 0;
let buyDraftPrice = 0;
let buyDraftMode = "UNITS";

let sellAmountInput = "";
let sellDraftUnits = 0;
let sellDraftEuro = 0;
let sellDraftPercent = null;
let sellDraftPrice = 0;

let savingsAmountInput = "";
let savingsDraftAmount = 0;
let savingsDraftFrequencyCode = "WEEKLY";
let savingsDraftFrequencyLabel = "Wöchentlich";
let savingsDraftFrequencyText = "wöchentlich";
let savingsDraftStartType = "BEGINNING";
let savingsDraftStartLabel = "zum Monatsanfang";
let savingsDraftStartDate = null;

const assetAccentColors = {
    BTC: "#f7931a",
    ETH: "#627eea",
    XRP: "#23292f",
    SOL: "#14f195",
    XLM: "#ffffff",
    ADA: "#0033ad",
    NEAR: "#ffffff",
    TRX: "#ff0013",
    HBAR: "#ffffff",
    DOGE: "#c2a633",
    FET: "#ffffff",
    LINK: "#2a5ada",
    AAVE: "#b6509e",
    AVAX: "#e84142",
    BCH: "#0ac18e",
    LTC: "#345d9d",
    DOT: "#e6007a",
    GRT: "#6747ed",
    ALGO: "#ffffff",
    RNDR: "#ff4a00",
    MATIC: "#8247e5",
    SUI: "#6fbcf0",
    UNI: "#ff007a",
    BAND: "#516aff",
    SNX: "#00d1ff",
    TON: "#0098ea",
    CHZ: "#cd0124",
    LDO: "#00a3ff",
    CRV: "#d00000",
    AXS: "#0055d5",
    SKY: "#1d1d1f",
    TRUMP: "#c9a24d",
    ETC: "#328332",
    COMP: "#00d395",
    KNC: "#31cb9e",
    CTSI: "#f04a23",
    STORJ: "#2683ff",
    QNT: "#1d1d1f",
    "1INCH": "#94a3b8",
    AUDIO: "#cc0fe0",
    YFI: "#006ae3",
    LRC: "#1c60ff",
    BNT: "#ffffff",
    BAT: "#ff5000",
    MELANIA: "#c9a24d",
    IMX: "#17b5cb",
    OGN: "#1a82ff",
    SUSHI: "#f338c3",
    ZRX: "#302c2c",
    SAND: "#00adef",
    UMA: "#ff4a4a"
};

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
        return fallback;
    }
}

function getUsers() {
    return readStorage("valorax_users", []);
}

function saveUsers(users) {
    localStorage.setItem("valorax_users", JSON.stringify(users));
}

function getCurrentUser() {
    return readStorage("valorax_current_user", null);
}

function setCurrentUser(user) {
    localStorage.setItem("valorax_current_user", JSON.stringify({
        id: user.id,
        phone: user.phone,
        email: user.email,
        balance: user.balance
    }));
}

function formatEuro(value) {
    return Number(value).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR"
    });
}

function formatEuroPrecise(value) {
    const number = Number(value);

    if (number < 1) {
        return number.toLocaleString("de-DE", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }) + " €";
    }

    return number.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " €";
}

function formatEuroShort(value) {
    const number = Number(value) || 0;

    if (Number.isInteger(number)) {
        return number.toLocaleString("de-DE", {
            maximumFractionDigits: 0
        }) + " €";
    }

    return number.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " €";
}

function formatAmount(value) {
    return Number(value).toLocaleString("de-DE", {
        maximumFractionDigits: currentAsset.type === "CRYPTO" ? 8 : 6
    });
}

function formatPercent(value) {
    return value.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " %";
}

function getAskPrice(price) {
    const number = Number(price) || 0;
    return Math.round(number * 1.008 * 100000000) / 100000000;
}

function getBuyPrice() {
    return getAskPrice(currentAsset.price);
}

function getSellPrice() {
    return Number(currentAsset.price) || 0;
}

function getSymbolFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("symbol");
}

function getAssetIconBackgroundClass(asset) {
    const background = asset.iconBackground || "gray";

    if (background === "white") {
        return "logoBgWhite";
    }

    if (background === "black") {
        return "logoBgBlack";
    }

    return "logoBgGray";
}

function getAssetAccentColor(asset) {
    return asset.accentColor ||
        asset.logoColor ||
        asset.buttonColor ||
        assetAccentColors[asset.symbol] ||
        "#245f9f";
}

function hexToRgb(hex) {
    const cleanHex = String(hex).replace("#", "");

    if (cleanHex.length !== 6) {
        return { r: 36, g: 95, b: 159 };
    }

    return {
        r: parseInt(cleanHex.substring(0, 2), 16),
        g: parseInt(cleanHex.substring(2, 4), 16),
        b: parseInt(cleanHex.substring(4, 6), 16)
    };
}

function isLightColor(hex) {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

    return brightness > 165;
}

function applyAssetTheme(asset) {
    const accentColor = getAssetAccentColor(asset);
    const textColor = isLightColor(accentColor) ? "#050505" : "#ffffff";

    document.documentElement.style.setProperty("--asset-accent", accentColor);
    document.documentElement.style.setProperty("--asset-action-text", textColor);
}

function hideMainBottomActions() {
    document.getElementById("bottomActions").style.display = "none";
}

function showMainBottomActions() {
    document.getElementById("bottomActions").style.display = "grid";
}

function showSuccessToast(message) {
    const toast = document.getElementById("successToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 3000);
}

function getWatchlistSymbol(item) {
    if (typeof item === "string") {
        return item;
    }

    if (!item || typeof item !== "object") {
        return "";
    }

    return item.symbol || item.asset || item.subtitle || "";
}

function normalizeWatchlistItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map(getWatchlistSymbol)
        .filter(function (symbol) {
            return symbol && assetData[symbol] && assetData[symbol].type === "CRYPTO";
        });
}

function ensureCryptoWatchlist(user) {
    const userWatchlist = normalizeWatchlistItems(user.cryptoWatchlist || []);
    const oldUserWatchlist = normalizeWatchlistItems(user.watchlist || []);
    const localWatchlist = normalizeWatchlistItems(readStorage("valorax_watchlist", []));

    user.cryptoWatchlist = Array.from(new Set(
        []
            .concat(userWatchlist)
            .concat(oldUserWatchlist)
            .concat(localWatchlist)
    ));
}

function saveCryptoWatchlistMirror() {
    if (!currentUser || !currentUser.cryptoWatchlist) {
        return;
    }

    localStorage.setItem("valorax_watchlist", JSON.stringify(currentUser.cryptoWatchlist));
}

function isCurrentAssetInWatchlist() {
    if (!currentUser || !currentAsset || !Array.isArray(currentUser.cryptoWatchlist)) {
        return false;
    }

    return currentUser.cryptoWatchlist.includes(currentAsset.symbol);
}

function updateWatchButton() {
    const button = document.getElementById("watchButton");

    if (!button || !currentAsset || currentAsset.type !== "CRYPTO") {
        return;
    }

    const isActive = isCurrentAssetInWatchlist();

    button.classList.toggle("isActive", isActive);
    button.setAttribute(
        "aria-label",
        isActive ? "Von Watchlist entfernen" : "Zur Watchlist hinzufügen"
    );
}

function toggleWatchlist() {
    if (!currentUser || !currentAsset || currentAsset.type !== "CRYPTO") {
        return;
    }

    if (!currentUser.cryptoWatchlist) {
        currentUser.cryptoWatchlist = [];
    }

    ensureCryptoWatchlist(currentUser);

    const symbol = currentAsset.symbol;
    const isActive = currentUser.cryptoWatchlist.includes(symbol);

    if (isActive) {
        currentUser.cryptoWatchlist = currentUser.cryptoWatchlist.filter(function (item) {
            return item !== symbol;
        });

        saveCurrentUser();
        saveCryptoWatchlistMirror();
        updateWatchButton();
        showSuccessToast("Von Watchlist entfernt");
        return;
    }

    currentUser.cryptoWatchlist.unshift(symbol);
    currentUser.cryptoWatchlist = Array.from(new Set(currentUser.cryptoWatchlist));

    saveCurrentUser();
    saveCryptoWatchlistMirror();
    updateWatchButton();
    showSuccessToast("Zur Watchlist hinzugefügt");
}

function loadAsset() {
    const symbol = getSymbolFromUrl();

    if (!symbol || !assetData[symbol]) {
        window.location.href = "search.html";
        return;
    }

    currentAsset = assetData[symbol];
    renderAsset();
}

function loadUser() {
    const savedUser = getCurrentUser();
    const users = getUsers();

    if (!savedUser) {
        window.location.href = "index.html";
        return;
    }

    const realUser = users.find(function (user) {
        return user.id === savedUser.id;
    });

    if (!realUser) {
        localStorage.removeItem("valorax_current_user");
        window.location.href = "index.html";
        return;
    }

    if (typeof realUser.balance !== "number") {
        realUser.balance = 0;
    }

    if (!realUser.brokeragePortfolio) {
        realUser.brokeragePortfolio = {};
    }

    if (!realUser.cryptoPortfolio) {
        realUser.cryptoPortfolio = {};
    }

    Object.keys(assetData).forEach(function (symbol) {
        if (assetData[symbol].type === "BROKERAGE") {
            if (typeof realUser.brokeragePortfolio[symbol] !== "number") {
                realUser.brokeragePortfolio[symbol] = 0;
            }
        }

        if (assetData[symbol].type === "CRYPTO") {
            if (typeof realUser.cryptoPortfolio[symbol] !== "number") {
                realUser.cryptoPortfolio[symbol] = 0;
            }
        }
    });

    if (!realUser.brokerageTrades) {
        realUser.brokerageTrades = [];
    }

    if (!realUser.cryptoTrades) {
        realUser.cryptoTrades = [];
    }

    if (!realUser.cryptoSavingsPlans) {
    realUser.cryptoSavingsPlans = [];
}

if (!realUser.cryptoWatchlist) {
    realUser.cryptoWatchlist = [];
}

ensureCryptoWatchlist(realUser);

currentUser = realUser;
saveCurrentUser();
saveCryptoWatchlistMirror();
renderPosition();
updateWatchButton();
}

function saveCurrentUser() {
    const users = getUsers();

    const updatedUsers = users.map(function (user) {
        return user.id === currentUser.id ? currentUser : user;
    });

    saveUsers(updatedUsers);
    setCurrentUser(currentUser);
}

function getPortfolio() {
    return currentAsset.type === "CRYPTO"
        ? currentUser.cryptoPortfolio
        : currentUser.brokeragePortfolio;
}

function getTrades() {
    return currentAsset.type === "CRYPTO"
        ? currentUser.cryptoTrades
        : currentUser.brokerageTrades;
}

function getOwnedAmount() {
    if (!currentUser) {
        return 0;
    }

    const portfolio = getPortfolio();
    return portfolio[currentAsset.symbol] || 0;
}

function getOwnedValue() {
    return getOwnedAmount() * currentAsset.price;
}

function hasOwnedAsset() {
    return getOwnedAmount() > 0.0000000001;
}

function updateTradeButton() {
    const button = document.getElementById("buyButton");

    if (hasOwnedAsset()) {
        button.innerHTML = "Handeln<span>＋</span>";
        return;
    }

    button.innerHTML = "Kaufen<span>＋</span>";
}

function getAverageEntryPrice() {
    const trades = getTrades()
        .filter(function (trade) {
            return trade.asset === currentAsset.symbol;
        })
        .slice()
        .sort(function (a, b) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    if (trades.length === 0) {
        return 0;
    }

    let ownedUnits = 0;
    let totalCost = 0;

    trades.forEach(function (trade) {
        const units = trade.units || 0;
        const euro = trade.amountEuro || 0;

        if (trade.type === "BUY") {
            ownedUnits += units;
            totalCost += euro;
        }

        if (trade.type === "SELL" && ownedUnits > 0) {
            const sellUnits = Math.min(units, ownedUnits);
            const averagePrice = totalCost / ownedUnits;

            totalCost -= averagePrice * sellUnits;
            ownedUnits -= sellUnits;

            if (ownedUnits <= 0.0000000001) {
                ownedUnits = 0;
                totalCost = 0;
            }
        }
    });

    return ownedUnits > 0 ? totalCost / ownedUnits : 0;
}

function getProfitValue() {
    const ownedAmount = getOwnedAmount();
    const entryPrice = getAverageEntryPrice();

    if (ownedAmount <= 0 || entryPrice <= 0) {
        return 0;
    }

    return (currentAsset.price - entryPrice) * ownedAmount;
}

function getPerformancePercent() {
    const entryPrice = getAverageEntryPrice();

    if (entryPrice <= 0) {
        return 0;
    }

    return ((currentAsset.price - entryPrice) / entryPrice) * 100;
}

function setPerformanceElement(id, value, formatter) {
    const element = document.getElementById(id);

    element.textContent =
        (value >= 0 ? "▲ " : "▼ ") + formatter(Math.abs(value));

    element.classList.remove("positive", "blueNegative");
    element.classList.add(value >= 0 ? "positive" : "blueNegative");
}

function renderAssetIcon() {
    const iconElement = document.getElementById("assetIcon");
    const fallback = currentAsset.name.charAt(0).toUpperCase();

    iconElement.classList.remove("logoBgWhite", "logoBgBlack", "logoBgGray");
    iconElement.classList.add(getAssetIconBackgroundClass(currentAsset));
    iconElement.innerHTML = "";

    if (!currentAsset.icon) {
        iconElement.textContent = fallback;
        return;
    }

    const image = document.createElement("img");
    image.src = currentAsset.icon;
    image.alt = currentAsset.name + " Logo";
    image.onerror = function () {
        iconElement.innerHTML = "";
        iconElement.textContent = fallback;
    };

    iconElement.appendChild(image);
}

function renderAnyAssetIcon(elementId) {
    const iconElement = document.getElementById(elementId);
    const fallback = currentAsset.name.charAt(0).toUpperCase();

    iconElement.classList.remove("logoBgWhite", "logoBgBlack", "logoBgGray");
    iconElement.classList.add(getAssetIconBackgroundClass(currentAsset));
    iconElement.innerHTML = "";

    if (!currentAsset.icon) {
        iconElement.textContent = fallback;
        return;
    }

    const image = document.createElement("img");
    image.src = currentAsset.icon;
    image.alt = currentAsset.name + " Logo";
    image.onerror = function () {
        iconElement.innerHTML = "";
        iconElement.textContent = fallback;
    };

    iconElement.appendChild(image);
}

function renderAsset() {
    document.title = "ValoraX " + currentAsset.name;

    applyAssetTheme(currentAsset);
    renderAssetIcon();

    document.getElementById("assetName").textContent = currentAsset.name;
    document.getElementById("assetPrice").textContent = formatEuro(currentAsset.price);

    const change = document.getElementById("assetChange");
    change.textContent = currentAsset.change || "–";
    change.className = currentAsset.changeClass || "neutral";

    document.getElementById("infoText").textContent = currentAsset.info;
    document.getElementById("bidPrice").textContent = formatEuroPrecise(currentAsset.price);
    document.getElementById("askPrice").textContent = formatEuroPrecise(getAskPrice(currentAsset.price));
    document.getElementById("supplyValue").textContent = currentAsset.supply;
    document.getElementById("marketAvailable").textContent = currentAsset.available;
    document.getElementById("newsHeadline").textContent = currentAsset.news;
}

function renderPosition() {
    const ownedValue = getOwnedValue();
    const performance = getPerformancePercent();

    document.getElementById("miniPositionValue").textContent = formatEuro(ownedValue);

    setPerformanceElement("miniPerformanceValue", performance, formatPercent);

    renderDetailViews();
    updateTradeButton();
    updateWatchButton();
}

function renderDetailViews() {
    const ownedValue = getOwnedValue();
    const ownedAmount = getOwnedAmount();
    const entryPrice = getAverageEntryPrice();
    const profit = getProfitValue();
    const performance = getPerformancePercent();

    document.getElementById("positionAssetName").textContent = currentAsset.name;
    document.getElementById("performanceAssetName").textContent = currentAsset.name;

    document.getElementById("detailTotalValue").textContent = formatEuro(ownedValue);

    document.getElementById("detailAssetAmount").textContent =
        ownedAmount > 0 ? formatAmount(ownedAmount) : "0";

    document.getElementById("detailEntryPrice").textContent =
        entryPrice > 0 ? formatEuro(entryPrice) : "0,00 €";

    setPerformanceElement("detailPerformanceValue", performance, formatPercent);
    setPerformanceElement("detailProfitValue", profit, formatEuro);

    renderPerformanceTransactions();
}

function formatAssetTransactionDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Heute";
    }

    return date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long"
    });
}

function getCurrentAssetTransactions() {
    return getTrades()
        .filter(function (trade) {
            return trade.asset === currentAsset.symbol;
        })
        .slice()
        .sort(function (a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
}

function createAssetTransactionRow(trade) {
    const isSell = trade.type === "SELL";

    const row = document.createElement("div");
    const icon = document.createElement("div");
    const info = document.createElement("div");
    const title = document.createElement("h3");
    const subtitle = document.createElement("p");
    const amount = document.createElement("strong");

    row.className = "assetTransactionRow";
    icon.className = "assetTransactionIcon " + (isSell ? "sellIcon" : "buyIcon");
    info.className = "assetTransactionInfo";
    amount.className = "assetTransactionAmount";

    if (isSell) {
        amount.classList.add("positive");
    }

    icon.textContent = isSell ? "−" : "+";
    title.textContent = isSell ? "Verkauf" : "Kauf";

    subtitle.textContent =
        formatAssetTransactionDate(trade.date) +
        " · " +
        formatAmount(trade.units || 0) +
        " ×";

    amount.textContent = isSell
        ? "+" + formatEuro(trade.amountEuro || 0)
        : formatEuro(trade.amountEuro || 0);

    info.appendChild(title);
    info.appendChild(subtitle);

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(amount);

    return row;
}

function renderPerformanceTransactions() {
    const list = document.getElementById("assetTransactionsList");
    const empty = document.getElementById("assetTransactionsEmptyText");

    if (!list || !empty) {
        return;
    }

    const transactions = getCurrentAssetTransactions();

    list.innerHTML = "";

    if (transactions.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    transactions.forEach(function (trade) {
        list.appendChild(createAssetTransactionRow(trade));
    });
}

function openOrderSheet() {
    document.getElementById("sheetTitle").textContent = "Kaufen";
    document.getElementById("confirmOrder").textContent = "Kaufen";
    document.getElementById("orderAmount").value = "";
    document.getElementById("orderMessage").textContent = "";
    document.getElementById("orderPreview").textContent = "Preis: " + formatEuroPrecise(getBuyPrice());

    document.getElementById("overlay").classList.add("open");
    document.getElementById("orderSheet").classList.add("open");

    setTimeout(function () {
        document.getElementById("orderAmount").focus();
    }, 250);
}

function closeOrderSheet() {
    document.getElementById("overlay").classList.remove("open");
    document.getElementById("orderSheet").classList.remove("open");
}

function updateOrderPreview() {
    const euroAmount = Number(document.getElementById("orderAmount").value);
    const preview = document.getElementById("orderPreview");
    const buyPrice = getBuyPrice();

    if (!euroAmount || euroAmount <= 0) {
        preview.textContent = "Preis: " + formatEuroPrecise(buyPrice);
        return;
    }

    const units = euroAmount / buyPrice;

    preview.textContent =
        "Du kaufst ca. " +
        formatAmount(units) +
        (currentAsset.type === "CRYPTO" ? " Coins" : " Stk.") +
        " für " +
        formatEuro(euroAmount) +
        ".";
}

function executeOrder() {
    const euroAmount = Number(document.getElementById("orderAmount").value);
    const message = document.getElementById("orderMessage");
    const buyPrice = getBuyPrice();

    if (!euroAmount || euroAmount <= 0) {
        message.textContent = "Bitte gib einen gültigen Betrag ein.";
        return;
    }

    if (euroAmount > currentUser.balance) {
        message.textContent = "Nicht genug verfügbares Cash.";
        return;
    }

    const units = euroAmount / buyPrice;
    const portfolio = getPortfolio();
    const trades = getTrades();

    portfolio[currentAsset.symbol] =
        (portfolio[currentAsset.symbol] || 0) + units;

    currentUser.balance -= euroAmount;

    trades.push({
        type: "BUY",
        asset: currentAsset.symbol,
        amountEuro: euroAmount,
        units: units,
        price: buyPrice,
        date: new Date().toISOString()
    });

    saveCurrentUser();
    renderPosition();
    closeOrderSheet();
    showSuccessToast("Kauforder erstellt");
}

function getBuyInputNumber() {
    const normalized = buyUnitInput.replace(",", ".");
    const value = Number(normalized);

    if (!value || value <= 0) {
        return 0;
    }

    return value;
}

function getBuyEuroAmount() {
    const value = getBuyInputNumber();
    const buyPrice = getBuyPrice();

    if (buyOrderMode === "AMOUNT") {
        return value;
    }

    return value * buyPrice;
}

function getMissingBuyAmount() {
    const euroAmount = getBuyEuroAmount();

    if (!currentUser || !euroAmount || euroAmount <= 0) {
        return 0;
    }

    return Math.max(0, euroAmount - currentUser.balance);
}

function updateBuyFundingMessage() {
    const error = document.getElementById("buyOrderError");
    const missingAmount = getMissingBuyAmount();

    if (missingAmount > 0) {
        error.textContent = "Bitte mindestens " + formatEuro(missingAmount) + " einzahlen.";
        error.classList.add("show");
        return;
    }

    error.textContent = "";
    error.classList.remove("show");
}

function renderBuyOrderMode() {
    const label = buyOrderMode === "AMOUNT" ? "Betrag" : "Anteile";

    document.getElementById("buyModeButton").innerHTML =
        label + "<span></span>";

    document.querySelectorAll(".buyTypeOption").forEach(function (option) {
        option.classList.toggle("selected", option.dataset.buyMode === buyOrderMode);
    });
}

function openBuyTypeSheet() {
    renderBuyOrderMode();

    document.getElementById("buyTypeOverlay").classList.add("open");
    document.getElementById("buyTypeSheet").classList.add("open");
}

function closeBuyTypeSheet() {
    document.getElementById("buyTypeOverlay").classList.remove("open");
    document.getElementById("buyTypeSheet").classList.remove("open");
}

function selectBuyOrderMode(mode) {
    buyOrderMode = mode;
    buyUnitInput = "";

    document.getElementById("buyOrderError").textContent = "";
    document.getElementById("buyOrderError").classList.remove("show");

    renderBuyOrderMode();
    updateBuyAmountDisplay();
    closeBuyTypeSheet();
}

function renderBuyAssetIcon() {
    renderAnyAssetIcon("buyAssetIcon");
}

function openBuySheet() {
    hideMainBottomActions();

    buyUnitInput = "";

    renderBuyAssetIcon();
    renderBuyOrderMode();

    document.getElementById("buyAvailableBalance").textContent =
        formatEuro(currentUser.balance) + " verfügbar";

    document.getElementById("buyPriceLine").textContent =
        "Preis: " + formatEuroPrecise(getBuyPrice());

    document.getElementById("buyOrderError").textContent = "";
    document.getElementById("buyOrderError").classList.remove("show");

    updateBuyAmountDisplay();

    document.getElementById("buyFullSheet").classList.add("open");
}

function closeBuySheet() {
    closeBuyTypeSheet();
    document.getElementById("buyFullSheet").classList.remove("open");

    showMainBottomActions();
}

function updateBuyAmountDisplay() {
    const display = document.getElementById("buyAmountDisplay");
    const nextButton = document.getElementById("buyNextButton");
    const value = getBuyInputNumber();
    const euroAmount = getBuyEuroAmount();

    const suffix = buyOrderMode === "AMOUNT" ? " €" : " ×";

    display.textContent = buyUnitInput ? buyUnitInput + suffix : "0" + suffix;
    display.classList.toggle("hasAmount", value > 0);

    document.getElementById("buyPriceLine").textContent =
        "Preis: " + formatEuroPrecise(getBuyPrice());

    updateBuyFundingMessage();

    const isReady = value > 0 && euroAmount <= currentUser.balance;

    nextButton.disabled = !isReady;
    nextButton.classList.toggle("isActive", isReady);
}

function pressBuyKey(key) {
    const error = document.getElementById("buyOrderError");
    error.textContent = "";
    error.classList.remove("show");

    if (key === "delete") {
        buyUnitInput = buyUnitInput.slice(0, -1);
        updateBuyAmountDisplay();
        return;
    }

    if (key === ",") {
        if (buyUnitInput.includes(",")) {
            return;
        }

        buyUnitInput = buyUnitInput || "0";
        buyUnitInput += ",";
        updateBuyAmountDisplay();
        return;
    }

    if (buyUnitInput.includes(",")) {
        const decimals = buyUnitInput.split(",")[1];
        const maxDecimals = buyOrderMode === "AMOUNT" ? 2 : 8;

        if (decimals.length >= maxDecimals) {
            return;
        }
    }

    if (buyUnitInput === "0") {
        buyUnitInput = key;
    } else {
        buyUnitInput += key;
    }

    updateBuyAmountDisplay();
}

function prepareBuyConfirmation() {
    const inputValue = getBuyInputNumber();

    if (!inputValue || inputValue <= 0) {
        return;
    }

    if (getMissingBuyAmount() > 0) {
        updateBuyFundingMessage();
        return;
    }

    buyDraftPrice = getBuyPrice();
    buyDraftMode = buyOrderMode;

    if (buyOrderMode === "AMOUNT") {
        buyDraftEuro = inputValue;
        buyDraftUnits = inputValue / buyDraftPrice;
    } else {
        buyDraftUnits = inputValue;
        buyDraftEuro = inputValue * buyDraftPrice;
    }

    openBuyConfirmSheet();
}

function openBuyConfirmSheet() {
    document.getElementById("buyFullSheet").classList.remove("open");
    closeBuyTypeSheet();
    hideMainBottomActions();

    renderAnyAssetIcon("buyConfirmAssetIcon");

    if (buyDraftMode === "AMOUNT") {
        document.getElementById("buyConfirmTitle").textContent = "Kaufe " + formatEuro(buyDraftEuro);
    } else {
        document.getElementById("buyConfirmTitle").textContent = "Kaufe " + formatAmount(buyDraftUnits) + " ×";
    }

    document.getElementById("buyConfirmAssetName").textContent = currentAsset.name;
    document.getElementById("buyConfirmUnits").textContent = formatAmount(buyDraftUnits) + " × ";
    document.getElementById("buyConfirmPrice").textContent = formatEuroPrecise(buyDraftPrice);
    document.getElementById("buyConfirmTotal").textContent = formatEuro(buyDraftEuro);

    document.getElementById("buyConfirmError").textContent = "";
    document.getElementById("buyConfirmError").classList.remove("show");

    document.getElementById("buyConfirmButton").disabled = false;
    document.getElementById("buyConfirmButton").classList.add("isActive");

    document.getElementById("buyConfirmSheet").classList.add("open");
}

function closeBuyConfirmSheet(restoreActions) {
    document.getElementById("buyConfirmSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function executeBuyDraftOrder() {
    const error = document.getElementById("buyConfirmError");

    if (!buyDraftUnits || buyDraftUnits <= 0 || !buyDraftEuro || buyDraftEuro <= 0 || !buyDraftPrice || buyDraftPrice <= 0) {
        return;
    }

    if (buyDraftEuro > currentUser.balance) {
        error.textContent = "Bitte mindestens " + formatEuro(buyDraftEuro - currentUser.balance) + " einzahlen.";
        error.classList.add("show");
        return;
    }

    const portfolio = getPortfolio();
    const trades = getTrades();

    portfolio[currentAsset.symbol] =
        (portfolio[currentAsset.symbol] || 0) + buyDraftUnits;

    currentUser.balance -= buyDraftEuro;

    trades.push({
        type: "BUY",
        asset: currentAsset.symbol,
        amountEuro: buyDraftEuro,
        units: buyDraftUnits,
        price: buyDraftPrice,
        orderMode: buyDraftMode,
        date: new Date().toISOString()
    });

    buyDraftUnits = 0;
    buyDraftEuro = 0;
    buyDraftPrice = 0;
    buyDraftMode = "UNITS";
    buyUnitInput = "";

    saveCurrentUser();
    renderPosition();

    closeBuyConfirmSheet(true);
    showSuccessToast("Kauforder erstellt");
}

function getSavingsAmountNumber() {
    const normalized = savingsAmountInput.replace(",", ".");
    const value = Number(normalized);

    if (!value || value <= 0) {
        return 0;
    }

    return value;
}

function openSavingsAmountSheet() {
    hideMainBottomActions();

    savingsAmountInput = "";

    renderAnyAssetIcon("savingsAmountAssetIcon");
    updateSavingsAmountDisplay();

    document.getElementById("savingsAmountSheet").classList.add("open");
}

function closeSavingsAmountSheet(restoreActions) {
    document.getElementById("savingsAmountSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function updateSavingsAmountDisplay() {
    const display = document.getElementById("savingsAmountDisplay");
    const nextButton = document.getElementById("savingsAmountNextButton");
    const error = document.getElementById("savingsAmountError");
    const amount = getSavingsAmountNumber();

    display.textContent = savingsAmountInput ? savingsAmountInput + " €" : "0 €";
    display.classList.toggle("hasAmount", amount > 0);

    if (amount > 0 && amount < 1) {
        error.textContent = "Mindestens 1,00 €.";
        error.classList.add("show");
    } else {
        error.textContent = "";
        error.classList.remove("show");
    }

    const isReady = amount >= 1;

    nextButton.disabled = !isReady;
    nextButton.classList.toggle("isActive", isReady);
}

function pressSavingsKey(key) {
    if (!key) {
        return;
    }

    if (key === "delete") {
        savingsAmountInput = savingsAmountInput.slice(0, -1);
        updateSavingsAmountDisplay();
        return;
    }

    if (key === ",") {
        if (savingsAmountInput.includes(",")) {
            return;
        }

        savingsAmountInput = savingsAmountInput || "0";
        savingsAmountInput += ",";
        updateSavingsAmountDisplay();
        return;
    }

    if (savingsAmountInput.includes(",")) {
        const decimals = savingsAmountInput.split(",")[1];

        if (decimals.length >= 2) {
            return;
        }
    }

    if (savingsAmountInput === "0") {
        savingsAmountInput = key;
    } else {
        savingsAmountInput += key;
    }

    updateSavingsAmountDisplay();
}

function openSavingsFrequencySheet() {
    const amount = getSavingsAmountNumber();

    if (amount < 1) {
        updateSavingsAmountDisplay();
        return;
    }

    savingsDraftAmount = amount;

    closeSavingsAmountSheet(false);
    hideMainBottomActions();

    renderAnyAssetIcon("savingsFrequencyAssetIcon");

    document.getElementById("savingsFrequencyTitle").textContent =
        "Spare " + formatEuroShort(savingsDraftAmount);

    document.getElementById("savingsFrequencySheet").classList.add("open");
}

function closeSavingsFrequencySheet(restoreActions) {
    document.getElementById("savingsFrequencySheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function getSavingsFrequencyConfig(code) {
    if (code === "TWICE_MONTHLY") {
        return {
            code: "TWICE_MONTHLY",
            label: "Zweimal im Monat",
            text: "zweimal im Monat"
        };
    }

    if (code === "MONTHLY") {
        return {
            code: "MONTHLY",
            label: "Monatlich",
            text: "monatlich"
        };
    }

    if (code === "QUARTERLY") {
        return {
            code: "QUARTERLY",
            label: "Alle drei Monate",
            text: "alle drei Monate"
        };
    }

    return {
        code: "WEEKLY",
        label: "Wöchentlich",
        text: "wöchentlich"
    };
}

function selectSavingsFrequency(code) {
    const config = getSavingsFrequencyConfig(code);

    savingsDraftFrequencyCode = config.code;
    savingsDraftFrequencyLabel = config.label;
    savingsDraftFrequencyText = config.text;

    openSavingsStartSheet();
}

function getNextMonthlyDate(day) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let date = new Date(year, month, day);

    if (date <= now) {
        date = new Date(year, month + 1, day);
    }

    return date;
}

function getGermanMonthName(monthIndex) {
    const names = [
        "Jan.",
        "Feb.",
        "März",
        "Apr.",
        "Mai",
        "Juni",
        "Juli",
        "Aug.",
        "Sept.",
        "Okt.",
        "Nov.",
        "Dez."
    ];

    return names[monthIndex];
}

function formatSavingsDateLong(date) {
    const day = date.getDate();
    const month = getGermanMonthName(date.getMonth());
    const year = String(date.getFullYear()).slice(-2);

    return day + ". " + month + " " + year;
}

function formatSavingsDateShort(date) {
    const day = date.getDate();
    const month = getGermanMonthName(date.getMonth());

    return day + ". " + month;
}

function openSavingsStartSheet() {
    closeSavingsFrequencySheet(false);
    hideMainBottomActions();

    renderAnyAssetIcon("savingsStartAssetIcon");

    const beginningDate = getNextMonthlyDate(3);
    const middleDate = getNextMonthlyDate(16);

    document.getElementById("savingsStartTitle").textContent =
        "Spare " + formatEuroShort(savingsDraftAmount) + " " + savingsDraftFrequencyText + " zum";

    document.getElementById("savingsStartBeginningText").textContent =
        "Start am " + formatSavingsDateLong(beginningDate);

    document.getElementById("savingsStartMiddleText").textContent =
        "Start am " + formatSavingsDateLong(middleDate);

    document.getElementById("savingsStartSheet").classList.add("open");
}

function closeSavingsStartSheet(restoreActions) {
    document.getElementById("savingsStartSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function selectSavingsStart(type) {
    if (type === "MIDDLE") {
        savingsDraftStartType = "MIDDLE";
        savingsDraftStartLabel = "zur Mitte des Monats";
        savingsDraftStartDate = getNextMonthlyDate(16);
    } else {
        savingsDraftStartType = "BEGINNING";
        savingsDraftStartLabel = "zum Monatsanfang";
        savingsDraftStartDate = getNextMonthlyDate(3);
    }

    openSavingsConfirmSheet();
}

function openSavingsConfirmSheet() {
    closeSavingsStartSheet(false);
    hideMainBottomActions();

    renderAnyAssetIcon("savingsConfirmAssetIcon");

    document.getElementById("savingsConfirmTitle").textContent =
        "Spare " +
        formatEuroShort(savingsDraftAmount) +
        " " +
        savingsDraftFrequencyText +
        " " +
        savingsDraftStartLabel +
        " und zahle mit Cash";

    document.getElementById("savingsConfirmAssetName").textContent = currentAsset.name;

    document.getElementById("savingsConfirmInterval").textContent =
        "Ab dem " +
        formatSavingsDateShort(savingsDraftStartDate) +
        " · " +
        savingsDraftFrequencyLabel;

    document.getElementById("savingsConfirmTotal").textContent =
        formatEuro(savingsDraftAmount);

    document.getElementById("savingsConfirmSheet").classList.add("open");
}

function closeSavingsConfirmSheet(restoreActions) {
    document.getElementById("savingsConfirmSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function createSavingsPlan() {
    if (!currentUser.cryptoSavingsPlans) {
        currentUser.cryptoSavingsPlans = [];
    }

    currentUser.cryptoSavingsPlans.unshift({
        asset: currentAsset.symbol,
        assetName: currentAsset.name,
        amountEuro: savingsDraftAmount,
        frequencyCode: savingsDraftFrequencyCode,
        frequencyLabel: savingsDraftFrequencyLabel,
        startType: savingsDraftStartType,
        startLabel: savingsDraftStartLabel,
        startDate: savingsDraftStartDate.toISOString(),
        payment: "CASH",
        status: "ACTIVE",
        createdAt: new Date().toISOString()
    });

    saveCurrentUser();

    savingsAmountInput = "";
    savingsDraftAmount = 0;
    savingsDraftFrequencyCode = "WEEKLY";
    savingsDraftFrequencyLabel = "Wöchentlich";
    savingsDraftFrequencyText = "wöchentlich";
    savingsDraftStartType = "BEGINNING";
    savingsDraftStartLabel = "zum Monatsanfang";
    savingsDraftStartDate = null;

    closeSavingsConfirmSheet(true);
    showSuccessToast("Sparplan erstellt");
}

function openTradeActions() {
    hideMainBottomActions();

    document.getElementById("tradeActionsOverlay").classList.add("open");
    document.getElementById("tradeActionsPanel").classList.add("open");
}

function closeTradeActions(restoreActions) {
    document.getElementById("tradeActionsOverlay").classList.remove("open");
    document.getElementById("tradeActionsPanel").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function getSellOwnedEuro() {
    return getOwnedAmount() * getSellPrice();
}

function openSellSheet() {
    closeTradeActions(false);
    hideMainBottomActions();

    document.getElementById("sellOwnedValue").textContent = formatEuro(getSellOwnedEuro());

    document.getElementById("sellOverlay").classList.add("open");
    document.getElementById("sellSheet").classList.add("open");
}

function closeSellSheet(restoreActions) {
    document.getElementById("sellOverlay").classList.remove("open");
    document.getElementById("sellSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function openSellAmountSheet() {
    closeSellSheet(false);
    hideMainBottomActions();

    sellAmountInput = "";

    renderAnyAssetIcon("sellAmountAssetIcon");

    document.getElementById("sellAmountOwnedValue").textContent = formatEuro(getSellOwnedEuro());
    document.getElementById("sellAmountPriceLine").textContent = "Preis: " + formatEuroPrecise(getSellPrice());
    document.getElementById("sellAmountError").textContent = "";
    document.getElementById("sellAmountError").classList.remove("show");

    updateSellAmountDisplay();

    document.getElementById("sellAmountSheet").classList.add("open");
}

function closeSellAmountSheet(restoreActions) {
    document.getElementById("sellAmountSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function getSellAmountNumber() {
    const normalized = sellAmountInput.replace(",", ".");
    const value = Number(normalized);

    if (!value || value <= 0) {
        return 0;
    }

    return value;
}

function updateSellAmountDisplay() {
    const display = document.getElementById("sellAmountDisplay");
    const nextButton = document.getElementById("sellAmountNextButton");
    const error = document.getElementById("sellAmountError");
    const amount = getSellAmountNumber();
    const ownedEuro = getSellOwnedEuro();

    display.textContent = sellAmountInput ? sellAmountInput + " €" : "0 €";
    display.classList.toggle("hasAmount", amount > 0);

    document.getElementById("sellAmountPriceLine").textContent =
        "Preis: " + formatEuroPrecise(getSellPrice());

    if (amount > ownedEuro) {
        error.textContent = "Du besitzt nicht genug.";
        error.classList.add("show");
    } else {
        error.textContent = "";
        error.classList.remove("show");
    }

    const isReady = amount > 0 && amount <= ownedEuro;

    nextButton.disabled = !isReady;
    nextButton.classList.toggle("isActive", isReady);
}

function pressSellAmountKey(key) {
    const error = document.getElementById("sellAmountError");
    error.textContent = "";
    error.classList.remove("show");

    if (key === "delete") {
        sellAmountInput = sellAmountInput.slice(0, -1);
        updateSellAmountDisplay();
        return;
    }

    if (key === ",") {
        if (sellAmountInput.includes(",")) {
            return;
        }

        sellAmountInput = sellAmountInput || "0";
        sellAmountInput += ",";
        updateSellAmountDisplay();
        return;
    }

    if (sellAmountInput.includes(",")) {
        const decimals = sellAmountInput.split(",")[1];

        if (decimals.length >= 2) {
            return;
        }
    }

    if (sellAmountInput === "0") {
        sellAmountInput = key;
    } else {
        sellAmountInput += key;
    }

    updateSellAmountDisplay();
}

function prepareSellByPercent(percent) {
    const ownedAmount = getOwnedAmount();

    sellDraftPrice = getSellPrice();
    sellDraftPercent = percent;
    sellDraftUnits = ownedAmount * (percent / 100);
    sellDraftEuro = sellDraftUnits * sellDraftPrice;

    openSellConfirmSheet();
}

function prepareSellByEuroAmount() {
    const euroAmount = getSellAmountNumber();

    if (!euroAmount || euroAmount <= 0) {
        return;
    }

    if (euroAmount > getSellOwnedEuro()) {
        updateSellAmountDisplay();
        return;
    }

    sellDraftPrice = getSellPrice();
    sellDraftPercent = null;
    sellDraftEuro = euroAmount;
    sellDraftUnits = euroAmount / sellDraftPrice;

    openSellConfirmSheet();
}

function openSellConfirmSheet() {
    closeSellSheet(false);
    closeSellAmountSheet(false);
    hideMainBottomActions();

    if (!sellDraftPrice || sellDraftPrice <= 0) {
        sellDraftPrice = getSellPrice();
    }

    renderAnyAssetIcon("sellConfirmAssetIcon");

    if (sellDraftPercent) {
        document.getElementById("sellConfirmTitle").textContent =
            "Verkaufe " + sellDraftPercent + " % deiner Position";
    } else {
        document.getElementById("sellConfirmTitle").textContent =
            "Verkaufe " + formatEuro(sellDraftEuro);
    }

    document.getElementById("sellConfirmAssetName").textContent = currentAsset.name;
    document.getElementById("sellConfirmUnits").textContent = formatAmount(sellDraftUnits) + " × ";
    document.getElementById("sellConfirmPrice").textContent = formatEuroPrecise(sellDraftPrice);
    document.getElementById("sellConfirmTotal").textContent = formatEuro(sellDraftEuro);

    document.getElementById("sellConfirmButton").disabled = false;
    document.getElementById("sellConfirmButton").classList.add("isActive");

    document.getElementById("sellConfirmSheet").classList.add("open");
}

function closeSellConfirmSheet(restoreActions) {
    document.getElementById("sellConfirmSheet").classList.remove("open");

    if (restoreActions !== false) {
        showMainBottomActions();
    }
}

function executeSellOrder() {
    if (!sellDraftUnits || sellDraftUnits <= 0 || !sellDraftEuro || sellDraftEuro <= 0) {
        return;
    }

    const portfolio = getPortfolio();
    const trades = getTrades();
    const ownedAmount = getOwnedAmount();
    const sellPrice = sellDraftPrice;

    const finalUnits = Math.min(sellDraftUnits, ownedAmount);
    const finalEuro = finalUnits * sellPrice;

    portfolio[currentAsset.symbol] = Math.max(0, ownedAmount - finalUnits);

    if (portfolio[currentAsset.symbol] < 0.0000000001) {
        portfolio[currentAsset.symbol] = 0;
    }

    currentUser.balance += finalEuro;

    trades.push({
        type: "SELL",
        asset: currentAsset.symbol,
        amountEuro: finalEuro,
        units: finalUnits,
        price: sellPrice,
        percent: sellDraftPercent,
        date: new Date().toISOString()
    });

    sellDraftUnits = 0;
    sellDraftEuro = 0;
    sellDraftPercent = null;
    sellDraftPrice = 0;

    saveCurrentUser();
    renderPosition();

    closeSellConfirmSheet(true);
    showSuccessToast("Verkaufsorder erstellt");
}

document.getElementById("handleWrap").onclick = function () {
    window.location.href = "search.html";
};

document.getElementById("watchButton").onclick = function () {
    toggleWatchlist();
};

document.getElementById("openPositionView").onclick = function () {
    renderDetailViews();
    document.getElementById("positionDetailView").classList.add("open");
};

document.getElementById("openPerformanceView").onclick = function () {
    renderDetailViews();
    document.getElementById("performanceDetailView").classList.add("open");
};

document.querySelectorAll(".detailHandle").forEach(function (handle) {
    handle.onclick = function () {
        document.querySelectorAll(".detailView").forEach(function (view) {
            view.classList.remove("open");
        });
    };
});

document.getElementById("savingsPlanButton").onclick = function () {
    openSavingsAmountSheet();
};

document.getElementById("buyButton").onclick = function () {
    if (hasOwnedAsset()) {
        openTradeActions();
        return;
    }

    openBuySheet();
};

document.getElementById("overlay").onclick = closeOrderSheet;
document.getElementById("orderAmount").oninput = updateOrderPreview;
document.getElementById("confirmOrder").onclick = executeOrder;

document.getElementById("buyFullHandle").onclick = closeBuySheet;

document.querySelectorAll(".buyKey").forEach(function (button) {
    button.onclick = function () {
        pressBuyKey(button.dataset.key);
    };
});

document.getElementById("buyNextButton").onclick = function () {
    if (document.getElementById("buyNextButton").disabled) {
        return;
    }

    prepareBuyConfirmation();
};

document.getElementById("buyModeButton").onclick = function () {
    openBuyTypeSheet();
};

document.getElementById("buyConfirmHandle").onclick = function () {
    closeBuyConfirmSheet(true);
};

document.getElementById("buyConfirmBackButton").onclick = function () {
    closeBuyConfirmSheet(false);
    hideMainBottomActions();

    document.getElementById("buyFullSheet").classList.add("open");
    updateBuyAmountDisplay();
};

document.getElementById("buyConfirmButton").onclick = function () {
    executeBuyDraftOrder();
};

document.getElementById("buyTypeOverlay").onclick = closeBuyTypeSheet;
document.getElementById("buyTypeHandle").onclick = closeBuyTypeSheet;

document.querySelectorAll(".buyTypeOption").forEach(function (option) {
    option.onclick = function () {
        selectBuyOrderMode(option.dataset.buyMode);
    };
});

document.getElementById("savingsAmountHandle").onclick = function () {
    closeSavingsAmountSheet(true);
};

document.getElementById("savingsAmountBackButton").onclick = function () {
    closeSavingsAmountSheet(true);
};

document.querySelectorAll(".savingsKey").forEach(function (button) {
    button.onclick = function () {
        pressSavingsKey(button.dataset.key);
    };
});

document.getElementById("savingsAmountNextButton").onclick = function () {
    if (document.getElementById("savingsAmountNextButton").disabled) {
        return;
    }

    openSavingsFrequencySheet();
};

document.getElementById("savingsFrequencyHandle").onclick = function () {
    closeSavingsFrequencySheet(true);
};

document.getElementById("savingsFrequencyBackButton").onclick = function () {
    closeSavingsFrequencySheet(false);
    hideMainBottomActions();

    document.getElementById("savingsAmountSheet").classList.add("open");
    updateSavingsAmountDisplay();
};

document.querySelectorAll(".savingsChoiceRow[data-frequency]").forEach(function (button) {
    button.onclick = function () {
        selectSavingsFrequency(button.dataset.frequency);
    };
});

document.getElementById("savingsStartHandle").onclick = function () {
    closeSavingsStartSheet(true);
};

document.getElementById("savingsStartBackButton").onclick = function () {
    closeSavingsStartSheet(false);
    hideMainBottomActions();

    document.getElementById("savingsFrequencySheet").classList.add("open");
};

document.querySelectorAll(".savingsChoiceRow[data-start]").forEach(function (button) {
    button.onclick = function () {
        selectSavingsStart(button.dataset.start);
    };
});

document.getElementById("savingsConfirmHandle").onclick = function () {
    closeSavingsConfirmSheet(true);
};

document.getElementById("savingsConfirmBackButton").onclick = function () {
    closeSavingsConfirmSheet(false);
    hideMainBottomActions();

    document.getElementById("savingsStartSheet").classList.add("open");
};

document.getElementById("savingsConfirmCreateButton").onclick = function () {
    createSavingsPlan();
};

document.getElementById("tradeActionsOverlay").onclick = function () {
    closeTradeActions(true);
};

document.getElementById("closeTradeActionsButton").onclick = function () {
    closeTradeActions(true);
};

document.getElementById("openBuyFromTradeButton").onclick = function () {
    closeTradeActions(false);
    openBuySheet();
};

document.getElementById("openSellFromTradeButton").onclick = function () {
    openSellSheet();
};

document.getElementById("sellOverlay").onclick = function () {
    closeSellSheet(true);
};

document.getElementById("sellHandle").onclick = function () {
    closeSellSheet(true);
};

document.querySelectorAll(".sellQuickButton").forEach(function (button) {
    button.onclick = function () {
        const value = button.dataset.sellPercent;

        if (value === "custom") {
            openSellAmountSheet();
            return;
        }

        prepareSellByPercent(Number(value));
    };
});

document.getElementById("sellAmountHandle").onclick = function () {
    closeSellAmountSheet(false);
    openSellSheet();
};

document.querySelectorAll(".sellKey").forEach(function (button) {
    button.onclick = function () {
        pressSellAmountKey(button.dataset.key);
    };
});

document.getElementById("sellAmountNextButton").onclick = function () {
    if (document.getElementById("sellAmountNextButton").disabled) {
        return;
    }

    prepareSellByEuroAmount();
};

document.getElementById("sellAmountModeButton").onclick = function () {
    alert("Betrag-Modus ist bereits aktiv.");
};

document.getElementById("sellConfirmHandle").onclick = function () {
    closeSellConfirmSheet(true);
};

document.getElementById("sellConfirmBackButton").onclick = function () {
    closeSellConfirmSheet(false);

    if (sellDraftPercent) {
        openSellSheet();
    } else {
        document.getElementById("sellAmountSheet").classList.add("open");
        hideMainBottomActions();
    }
};

document.getElementById("sellConfirmButton").onclick = function () {
    executeSellOrder();
};

loadAsset();
loadUser();

if (typeof startCryptoMarketUpdates === "function") {
    startCryptoMarketUpdates(function () {
        if (currentAsset && currentAsset.type === "CRYPTO") {
            renderAsset();
            renderPosition();
            updateOrderPreview();

            if (document.getElementById("buyFullSheet").classList.contains("open")) {
                document.getElementById("buyAvailableBalance").textContent =
                    formatEuro(currentUser.balance) + " verfügbar";

                updateBuyAmountDisplay();
            }

            if (document.getElementById("buyConfirmSheet").classList.contains("open")) {
                document.getElementById("buyConfirmUnits").textContent = formatAmount(buyDraftUnits) + " × ";
                document.getElementById("buyConfirmPrice").textContent = formatEuroPrecise(buyDraftPrice);
                document.getElementById("buyConfirmTotal").textContent = formatEuro(buyDraftEuro);
            }

            if (document.getElementById("sellSheet").classList.contains("open")) {
                document.getElementById("sellOwnedValue").textContent = formatEuro(getSellOwnedEuro());
            }

            if (document.getElementById("sellAmountSheet").classList.contains("open")) {
                document.getElementById("sellAmountOwnedValue").textContent = formatEuro(getSellOwnedEuro());
                updateSellAmountDisplay();
            }

            if (document.getElementById("sellConfirmSheet").classList.contains("open")) {
                document.getElementById("sellConfirmUnits").textContent = formatAmount(sellDraftUnits) + " × ";
                document.getElementById("sellConfirmPrice").textContent = formatEuroPrecise(sellDraftPrice);
                document.getElementById("sellConfirmTotal").textContent = formatEuro(sellDraftEuro);
            }
        }
    });
}