let marketInterval = null;
let simulationInterval = null;
let marketIsLoading = false;

const REAL_UPDATE_INTERVAL = 120000;
const SIMULATION_MIN_INTERVAL = 2000;
const SIMULATION_MAX_INTERVAL = 5000;

const COINGECKO_IDS = {
    BTC: "bitcoin",
    ETH: "ethereum",
    XRP: "ripple",
    SOL: "solana",
    XLM: "stellar",
    ADA: "cardano",
    NEAR: "near",
    TRX: "tron",
    HBAR: "hedera-hashgraph",
    DOGE: "dogecoin",
    FET: "artificial-superintelligence-alliance",
    LINK: "chainlink",
    AAVE: "aave",
    AVAX: "avalanche-2",
    BCH: "bitcoin-cash",
    LTC: "litecoin",
    DOT: "polkadot",
    GRT: "the-graph",
    ALGO: "algorand",
    RNDR: "render-token",
    MATIC: "matic-network",
    SUI: "sui",
    UNI: "uniswap",
    BAND: "band-protocol",
    SNX: "havven",
    TON: "the-open-network",
    CHZ: "chiliz",
    LDO: "lido-dao",
    CRV: "curve-dao-token",
    AXS: "axie-infinity",
    SKY: "sky",
    TRUMP: "official-trump",
    ETC: "ethereum-classic",
    COMP: "compound-governance-token",
    KNC: "kyber-network-crystal",
    CTSI: "cartesi",
    STORJ: "storj",
    QNT: "quant-network",
    "1INCH": "1inch",
    AUDIO: "audius",
    YFI: "yearn-finance",
    LRC: "loopring",
    BNT: "bancor",
    BAT: "basic-attention-token",
    MELANIA: "melania-meme",
    IMX: "immutable-x",
    OGN: "origin-protocol",
    SUSHI: "sushi",
    ZRX: "0x",
    SAND: "the-sandbox",
    UMA: "uma"
};

function getCryptoSymbols() {
    if (typeof assetData === "undefined") {
        return [];
    }

    return Object.keys(assetData).filter(function (symbol) {
        return assetData[symbol] && assetData[symbol].type === "CRYPTO";
    });
}

function getSupportedCryptoSymbols() {
    return getCryptoSymbols().filter(function (symbol) {
        return COINGECKO_IDS[symbol];
    });
}

function getCoinGeckoIdsForRequest() {
    return getSupportedCryptoSymbols().map(function (symbol) {
        return COINGECKO_IDS[symbol];
    });
}

function getSymbolByCoinGeckoId(coinId) {
    const symbols = Object.keys(COINGECKO_IDS);

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];

        if (COINGECKO_IDS[symbol] === coinId) {
            return symbol;
        }
    }

    return null;
}

async function updateRealCryptoPrices() {
    if (marketIsLoading) {
        return;
    }

    const ids = getCoinGeckoIdsForRequest();

    if (ids.length === 0) {
        return;
    }

    marketIsLoading = true;

    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets" +
            "?vs_currency=eur" +
            "&ids=" + encodeURIComponent(ids.join(",")) +
            "&price_change_percentage=24h" +
            "&sparkline=false" +
            "&per_page=250"
        );

        if (!response.ok) {
            console.log("Crypto API nicht erreichbar:", response.status);
            return;
        }

        const data = await response.json();

        data.forEach(function (coin) {
            const symbol = getSymbolByCoinGeckoId(coin.id);

            if (symbol) {
                updateCryptoAssetFromMarketApi(symbol, coin);
            }
        });
    } catch (error) {
        console.log("Crypto Live-Daten konnten nicht geladen werden:", error);
    } finally {
        marketIsLoading = false;
    }
}

function updateCryptoAssetFromMarketApi(symbol, coin) {
    if (!coin || !assetData[symbol]) {
        return;
    }

    const asset = assetData[symbol];

    if (typeof coin.current_price === "number" && coin.current_price > 0) {
        asset.realPrice = coin.current_price;
        asset.simulationBasePrice = coin.current_price;
        asset.price = coin.current_price;
    }

    if (typeof coin.price_change_percentage_24h === "number") {
        const change = coin.price_change_percentage_24h;

        asset.change =
            (change >= 0 ? "▲ " : "▼ ") +
            Math.abs(change).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) +
            " %";

        asset.changeClass = change >= 0 ? "positive" : "blueNegative";
    }

    if (coin.circulating_supply) {
        asset.supply = shortenSupply(coin.circulating_supply);
    }

    if (coin.total_supply && coin.circulating_supply) {
        asset.available =
            ((coin.circulating_supply / coin.total_supply) * 100).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + " %";
    }
}

function getSimulationBasePrice(asset) {
    if (asset.realPrice && asset.realPrice > 0) {
        return asset.realPrice;
    }

    if (!asset.simulationBasePrice || asset.simulationBasePrice <= 0) {
        asset.simulationBasePrice = asset.price;
    }

    return asset.simulationBasePrice;
}

function simulateCryptoPrice(symbol) {
    if (!assetData[symbol]) {
        return;
    }

    const asset = assetData[symbol];
    const basePrice = getSimulationBasePrice(asset);

    if (!basePrice || basePrice <= 0 || !asset.price || asset.price <= 0) {
        return;
    }

    const maxDistanceFromBasePrice = 0.0008;
    const movement = (Math.random() - 0.5) * 0.00035;

    let newPrice = asset.price * (1 + movement);

    const minPrice = basePrice * (1 - maxDistanceFromBasePrice);
    const maxPrice = basePrice * (1 + maxDistanceFromBasePrice);

    if (newPrice < minPrice) {
        newPrice = minPrice;
    }

    if (newPrice > maxPrice) {
        newPrice = maxPrice;
    }

    asset.price = roundPrice(newPrice);
}

function simulateAllCryptoPrices() {
    getCryptoSymbols().forEach(function (symbol) {
        simulateCryptoPrice(symbol);
    });
}

function getRandomSimulationDelay() {
    return Math.floor(
        SIMULATION_MIN_INTERVAL +
        Math.random() * (SIMULATION_MAX_INTERVAL - SIMULATION_MIN_INTERVAL)
    );
}

function startSimulationLoop(callback) {
    if (simulationInterval) {
        clearTimeout(simulationInterval);
    }

    function runSimulation() {
        simulateAllCryptoPrices();

        if (typeof callback === "function") {
            callback();
        }

        simulationInterval = setTimeout(runSimulation, getRandomSimulationDelay());
    }

    simulationInterval = setTimeout(runSimulation, getRandomSimulationDelay());
}

function startCryptoMarketUpdates(callback) {
    updateRealCryptoPrices().then(function () {
        if (typeof callback === "function") {
            callback();
        }
    });

    if (marketInterval) {
        clearInterval(marketInterval);
    }

    marketInterval = setInterval(function () {
        updateRealCryptoPrices().then(function () {
            if (typeof callback === "function") {
                callback();
            }
        });
    }, REAL_UPDATE_INTERVAL);

    startSimulationLoop(callback);
}

function stopCryptoMarketUpdates() {
    if (marketInterval) {
        clearInterval(marketInterval);
        marketInterval = null;
    }

    if (simulationInterval) {
        clearTimeout(simulationInterval);
        simulationInterval = null;
    }
}

function roundPrice(value) {
    if (value >= 1000) {
        return Math.round(value * 100) / 100;
    }

    if (value >= 1) {
        return Math.round(value * 10000) / 10000;
    }

    return Math.round(value * 1000000) / 1000000;
}

function shortenSupply(value) {
    const number = Number(value);

    if (!number && number !== 0) {
        return "0";
    }

    if (number >= 1000000000000) {
        return (number / 1000000000000).toLocaleString("de-DE", {
            maximumFractionDigits: 2
        }) + " Bio.";
    }

    if (number >= 1000000000) {
        return (number / 1000000000).toLocaleString("de-DE", {
            maximumFractionDigits: 2
        }) + " Mrd.";
    }

    if (number >= 1000000) {
        return (number / 1000000).toLocaleString("de-DE", {
            maximumFractionDigits: 1
        }) + " Mio.";
    }

    return number.toLocaleString("de-DE", {
        maximumFractionDigits: 0
    });
}