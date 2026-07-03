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

function toProviderSymbol(inputSymbol) {
    const cleanSymbol = String(inputSymbol || "")
        .trim()
        .toUpperCase()
        .replace(".DE", "");

    return cleanSymbol + ".DE";
}

function toDisplaySymbol(providerSymbol) {
    return String(providerSymbol || "")
        .toUpperCase()
        .replace(".DE", "");
}

function isValidGermanSymbol(symbol) {
    return /^[A-Z0-9]{1,8}$/.test(symbol);
}

async function loadQuote(symbol, apiKey) {
    const providerSymbol = toProviderSymbol(symbol);
    const displaySymbol = toDisplaySymbol(providerSymbol);

    const apiUrl = new URL("https://finnhub.io/api/v1/quote");
    apiUrl.searchParams.set("symbol", providerSymbol);
    apiUrl.searchParams.set("token", apiKey);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.error || !Number(data.c || 0)) {
        return null;
    }

    return {
        symbol: displaySymbol,
        providerSymbol: providerSymbol,
        name: symbolNames[displaySymbol] || displaySymbol,
        currency: "EUR",
        price: Number(data.c || 0),
        previousClose: Number(data.pc || 0),
        change: Number(data.d || 0),
        percentChange: Number(data.dp || 0),
        source: "Finnhub"
    };
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
            return symbol.trim().replace(".DE", "");
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

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "FINNHUB_API_KEY ist nicht gesetzt." },
            { status: 500 }
        );
    }

    try {
        const quotes = await Promise.all(
            symbols.map(function (symbol) {
                return loadQuote(symbol, apiKey);
            })
        );

        return Response.json(
            {
                quotes: quotes.filter(Boolean),
                source: "Finnhub"
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