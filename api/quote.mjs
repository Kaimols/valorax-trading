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

function createError(message, status) {
    return Response.json(
        { error: message },
        { status: status }
    );
}

export async function GET(request) {
    const url = new URL(request.url);

    const inputSymbol = normalizeSymbol(url.searchParams.get("symbol"));

    if (!inputSymbol) {
        return createError("Symbol fehlt.", 400);
    }

    if (!isValidGermanSymbol(inputSymbol)) {
        return createError(
            "Bitte nutze ein deutsches EUR-Symbol, z. B. SAP, BMW, SIE oder ALV.",
            400
        );
    }

    const yahooSymbol = toYahooSymbol(inputSymbol);
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
            return createError("Kurs konnte nicht geladen werden.", 400);
        }

        const result = data.chart.result && data.chart.result[0];

        if (!result || !result.meta) {
            return createError("Für dieses Symbol wurde kein Kurs gefunden.", 404);
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
            return createError(
                "Für dieses EUR-Symbol wurde kein Kurs gefunden. Versuche z. B. SAP, BMW, SIE, ALV oder DTE.",
                404
            );
        }

        const change = price - previousClose;
        const percentChange = previousClose
            ? (change / previousClose) * 100
            : 0;

        return Response.json(
            {
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
            },
            {
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    } catch (error) {
        return createError("Serverfehler beim Laden des Kurses.", 500);
    }
}