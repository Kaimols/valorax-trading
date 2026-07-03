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
            return symbol.trim();
        })
        .filter(Boolean)
        .slice(0, 12);

    if (symbols.length === 0) {
        return Response.json(
            { error: "Keine gültigen Symbole gefunden." },
            { status: 400 }
        );
    }

    const invalidSymbol = symbols.find(function (symbol) {
        return !/^[A-Z0-9./:-]{1,20}$/.test(symbol);
    });

    if (invalidSymbol) {
        return Response.json(
            { error: "Ungültiges Symbol: " + invalidSymbol },
            { status: 400 }
        );
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "API-Key ist nicht gesetzt." },
            { status: 500 }
        );
    }

    const apiUrl = new URL("https://api.twelvedata.com/quote");
    apiUrl.searchParams.set("symbol", symbols.join(","));
    apiUrl.searchParams.set("apikey", apiKey);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.status === "error" || data.code) {
            return Response.json(
                {
                    error: data.message || "Kurse konnten nicht geladen werden."
                },
                { status: 400 }
            );
        }

        function normalizeQuote(raw, fallbackSymbol) {
            if (!raw || raw.status === "error" || raw.code) {
                return null;
            }

            return {
                symbol: raw.symbol || fallbackSymbol,
                name: raw.name || raw.exchange || fallbackSymbol,
                exchange: raw.exchange || "",
                currency: raw.currency || "USD",
                price: Number(raw.close || raw.price || 0),
                change: Number(raw.change || 0),
                percentChange: Number(raw.percent_change || 0),
                datetime: raw.datetime || "",
                source: "Twelve Data"
            };
        }

        let quotes = [];

        if (data.symbol || data.close || data.price) {
            const quote = normalizeQuote(data, symbols[0]);

            if (quote) {
                quotes.push(quote);
            }
        } else {
            quotes = Object.keys(data)
                .map(function (key) {
                    return normalizeQuote(data[key], key);
                })
                .filter(Boolean);
        }

        return Response.json(
            {
                quotes: quotes,
                source: "Twelve Data"
            },
            {
                headers: {
                    "Cache-Control": "s-maxage=30, stale-while-revalidate=60"
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