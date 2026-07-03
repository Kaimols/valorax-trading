export async function GET(request) {
    const url = new URL(request.url);
    const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();

    if (!symbol) {
        return Response.json(
            { error: "Symbol fehlt." },
            { status: 400 }
        );
    }

    if (!/^[A-Z0-9./:-]{1,20}$/.test(symbol)) {
        return Response.json(
            { error: "Ungültiges Symbol." },
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
    apiUrl.searchParams.set("symbol", symbol);
    apiUrl.searchParams.set("apikey", apiKey);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.status === "error" || data.code) {
            return Response.json(
                {
                    error: data.message || "Kurs konnte nicht geladen werden."
                },
                { status: 400 }
            );
        }

        const price = Number(data.close || data.price || 0);
        const change = Number(data.change || 0);
        const percentChange = Number(data.percent_change || 0);

        return Response.json(
            {
                symbol: data.symbol || symbol,
                name: data.name || "",
                exchange: data.exchange || "",
                currency: data.currency || "USD",
                price: price,
                change: change,
                percentChange: percentChange,
                datetime: data.datetime || "",
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
            { error: "Serverfehler beim Laden des Kurses." },
            { status: 500 }
        );
    }
}