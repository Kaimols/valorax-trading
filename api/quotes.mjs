const symbolNames = {
    SAP: "SAP",
    SIE: "Siemens",
    BMW: "BMW",
    ALV: "Allianz",
    DTE: "Deutsche Telekom",
    ADS: "Adidas",
    MBG: "Mercedes-Benz Group",
    VOW3: "Volkswagen Vz."
};

function normalizeSymbol(inputSymbol) {
    return String(inputSymbol || "")
        .trim()
        .toUpperCase()
        .replace(".DE", "");
}

function toYahooSymbol(inputSymbol) {
    return normalizeSymbol(inputSymbol) + ".DE";
}

function toDisplaySymbol(yahooSymbol) {
    return String(yahooSymbol || "")
        .toUpperCase()
        .replace(".DE", "");
}

function isValidGermanSymbol(symbol) {
    return /^[A-Z0-9]{1,8}$/.test(symbol);
}

async function loadQuote(symbol) {
    const cleanSymbol = normalizeSymbol(symbol);
    const yahooSymbol = toYahooSymbol(cleanSymbol);
    const displaySymbol = toDisplaySymbol(yahooSymbol);

    const apiUrl = new URL(
        "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(yahooSymbol)
    );

    apiUrl.searchParams.set("range", "1d");
    apiUrl.searchParams.set("interval", "1m");

    try {
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const data = await response.json();

        if (!response.ok || !data.chart || data.chart.error) {
            return null;
        }

        const result = data.chart.result && data.chart.result[0];

        if (!result || !result.meta) {
            return null;
        }

        const meta = result.meta;

        const price = Number(
            meta.regularMarketPrice ||
            meta.previousClose ||
            meta.chartPreviousClose ||
            0
        );

        const previousClose = Number(
            meta.previousClose ||
            meta.chartPreviousClose ||
            price ||
            0
        );

        if (!price) {
            return null;
        }

        const change = price - previousClose;
        const percentChange = previousClose
            ? (change / previousClose) * 100
            : 0;

        return {
            symbol: displaySymbol,
            providerSymbol: yahooSymbol,
            name: symbolNames[displaySymbol] || displaySymbol,
            currency: meta.currency || "EUR",
            price: price,
            previousClose: previousClose,
            change: change,
            percentChange: percentChange,
            datetime: meta.regularMarketTime || "",
            source: "Yahoo Finance"
        };
    } catch (error) {
        return null;
    }
}

export async function GET(request) {
    const url = new URL(request.url);

    const symbolsParam = (url.searchParams.get("symbols") || "")
        .trim()
        .toUpperCase();

    if (!symbolsParam) {
        return Response.json(
            { error: "Symbole fehlen." },
            { status: 400 }
        );
    }

    const symbols = symbolsParam
        .split(",")
        .map(function (symbol) {
            return normalizeSymbol(symbol);
        })
        .filter(Boolean)
        .slice(0, 12);

    const invalidSymbol = symbols.find(function (symbol) {
        return !isValidGermanSymbol(symbol);
    });

    if (invalidSymbol) {
        return Response.json(
            { error: "Ungültiges EUR-Symbol: " + invalidSymbol },
            { status: 400 }
        );
    }

    try {
        const quotes = await Promise.all(
            symbols.map(function (symbol) {
                return loadQuote(symbol);
            })
        );

        const validQuotes = quotes.filter(Boolean);

        if (validQuotes.length === 0) {
            return Response.json(
                {
                    error: "Keine Kurse gefunden. Prüfe die Symbole, z. B. SAP, BMW, SIE, ALV oder DTE."
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                quotes: validQuotes,
                source: "Yahoo Finance"
            },
            {
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    } catch (error) {
        return Response.json(
            { error: "Serverfehler beim Laden der Kurse." },
            { status: 500 }
        );
    }
}