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

export async function GET(request) {
    const url = new URL(request.url);

    const inputSymbol = (url.searchParams.get("symbol") || "")
        .trim()
        .toUpperCase()
        .replace(".DE", "");

    if (!inputSymbol) {
        return Response.json(
            { error: "Symbol fehlt." },
            { status: 400 }
        );
    }

    if (!isValidGermanSymbol(inputSymbol)) {
        return Response.json(
            { error: "Bitte nutze ein deutsches EUR-Symbol, z. B. SAP, BMW, SIE oder ALV." },
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

    const providerSymbol = toProviderSymbol(inputSymbol);
    const displaySymbol = toDisplaySymbol(providerSymbol);

    const apiUrl = new URL("https://finnhub.io/api/v1/quote");
    apiUrl.searchParams.set("symbol", providerSymbol);
    apiUrl.searchParams.set("token", apiKey);

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            return Response.json(
                { error: data.error || "Kurs konnte nicht geladen werden." },
                { status: 400 }
            );
        }

        const price = Number(data.c || 0);
        const previousClose = Number(data.pc || 0);
        const change = Number(data.d || 0);
        const percentChange = Number(data.dp || 0);

        if (!price) {
            return Response.json(
                {
                    error: "Für dieses EUR-Symbol wurde kein Kurs gefunden. Versuche z. B. SAP, BMW, SIE, ALV oder DTE."
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                symbol: displaySymbol,
                providerSymbol: providerSymbol,
                name: symbolNames[displaySymbol] || displaySymbol,
                currency: "EUR",
                price: price,
                previousClose: previousClose,
                change: change,
                percentChange: percentChange,
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
            { error: "Serverfehler beim Laden des Kurses." },
            { status: 500 }
        );
    }
}