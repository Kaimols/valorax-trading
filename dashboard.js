let currentUser = null;
let cashMode = "DEPOSIT";
let orderType = "CRYPTO";

let sendRecipientName = "";
let sendRecipientIban = "";
let sendAmountInput = "";

function getAssetsByType(type) {
    const result = {};

    Object.keys(assetData).forEach(function (symbol) {
        if (assetData[symbol].type === type) {
            result[symbol] = assetData[symbol];
        }
    });

    return result;
}

const brokerageAssets = getAssetsByType("BROKERAGE");
const cryptoAssets = getAssetsByType("CRYPTO");

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

function formatTransactionAmount(value, isPositive) {
    return (isPositive ? "+" : "") + formatEuro(value);
}

function formatTransactionDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Heute";
    }

    return date.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long"
    });
}

function ensurePortfolioKeys(portfolio, assets) {
    Object.keys(assets).forEach(function (symbol) {
        if (typeof portfolio[symbol] !== "number") {
            portfolio[symbol] = 0;
        }
    });
}

function getIconBackgroundClass(symbol) {
    const asset = assetData[symbol];
    const background = asset && asset.iconBackground ? asset.iconBackground : "gray";

    if (background === "white") {
        return "logoBgWhite";
    }

    if (background === "black") {
        return "logoBgBlack";
    }

    return "logoBgGray";
}

function createTransactionAssetIcon(symbol) {
    const icon = document.createElement("div");
    const asset = assetData[symbol];

    icon.className = "transactionIcon";

    if (!asset) {
        icon.classList.add("avatarIcon");
        icon.textContent = "?";
        return icon;
    }

    icon.classList.add(getIconBackgroundClass(symbol));

    const fallback = asset.name.charAt(0).toUpperCase();

    if (!asset.icon) {
        icon.textContent = fallback;
        return icon;
    }

    const image = document.createElement("img");
    image.src = asset.icon;
    image.alt = asset.name + " Logo";
    image.onerror = function () {
        icon.innerHTML = "";
        icon.textContent = fallback;
    };

    icon.appendChild(image);

    return icon;
}

function createTransactionCashIcon(text) {
    const icon = document.createElement("div");

    icon.className = "transactionIcon avatarIcon";
    icon.textContent = text || "€";

    return icon;
}

function getTransactionItems() {
    const items = [];

    (currentUser.cashTransactions || []).forEach(function (transaction) {
        if (transaction.type === "DEPOSIT") {
            items.push({
                title: "Einzahlung",
                subtitle: formatTransactionDate(transaction.date) + " · Fertig",
                amount: formatTransactionAmount(transaction.amountEuro || 0, true),
                date: transaction.date,
                iconType: "CASH",
                iconText: "+"
            });
        }

        if (transaction.type === "WITHDRAW") {
            items.push({
                title: "Auszahlung",
                subtitle: formatTransactionDate(transaction.date) + " · Gesendet",
                amount: formatEuro(transaction.amountEuro || 0),
                date: transaction.date,
                iconType: "CASH",
                iconText: "−"
            });
        }
    });

    const trades = []
        .concat(currentUser.cryptoTrades || [])
        .concat(currentUser.brokerageTrades || []);

    trades.forEach(function (trade) {
        const asset = assetData[trade.asset];

        if (!asset) {
            return;
        }

        if (trade.type === "BUY") {
            items.push({
                title: asset.name,
                subtitle: formatTransactionDate(trade.date) + " · Kauforder",
                amount: formatEuro(trade.amountEuro || 0),
                date: trade.date,
                iconType: "ASSET",
                symbol: trade.asset
            });
        }

        if (trade.type === "SELL") {
            items.push({
                title: asset.name,
                subtitle: formatTransactionDate(trade.date) + " · Verkauf",
                amount: formatTransactionAmount(trade.amountEuro || 0, true),
                date: trade.date,
                iconType: "ASSET",
                symbol: trade.asset
            });
        }
    });

    return items.sort(function (a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

function createTransactionRow(transaction) {
    const row = document.createElement("div");
    const icon = transaction.iconType === "ASSET"
        ? createTransactionAssetIcon(transaction.symbol)
        : createTransactionCashIcon(transaction.iconText);

    const info = document.createElement("div");
    const title = document.createElement("h3");
    const subtitle = document.createElement("p");
    const amount = document.createElement("strong");

    row.className = "transactionRow";
    info.className = "transactionInfo";
    amount.className = "transactionAmount";

    title.textContent = transaction.title;
    subtitle.textContent = transaction.subtitle;
    amount.textContent = transaction.amount;

    info.appendChild(title);
    info.appendChild(subtitle);

    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(amount);

    return row;
}

function renderTransactionList(containerId, emptyId, limit) {
    const list = document.getElementById(containerId);
    const empty = document.getElementById(emptyId);
    const transactions = getTransactionItems();

    if (!list || !empty) {
        return;
    }

    list.innerHTML = "";

    const visibleTransactions = typeof limit === "number"
        ? transactions.slice(0, limit)
        : transactions;

    if (visibleTransactions.length === 0) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    visibleTransactions.forEach(function (transaction) {
        list.appendChild(createTransactionRow(transaction));
    });
}

function renderTransactions() {
    renderTransactionList("transactionsList", "emptyTransactions", 3);

    const allTransactionsSheet = document.getElementById("allTransactionsSheet");

    if (allTransactionsSheet && allTransactionsSheet.classList.contains("open")) {
        renderAllTransactions();
    }
}

function renderAllTransactions() {
    renderTransactionList("allTransactionsList", "emptyAllTransactions");
}

function openAllTransactionsSheet() {
    renderAllTransactions();
    document.getElementById("allTransactionsSheet").classList.add("open");
}

function closeAllTransactionsSheet() {
    document.getElementById("allTransactionsSheet").classList.remove("open");
}

function openSavingsPlanSheet() {
    document.getElementById("savingsPlanSheet").classList.add("open");
}

function closeSavingsPlanSheet() {
    document.getElementById("savingsPlanSheet").classList.remove("open");
}

function openSavingsPlanSearchFilter() {
    sessionStorage.setItem("valorax_search_slide_in", "1");
    sessionStorage.setItem("valorax_search_open_filter", "1");
    sessionStorage.setItem("valorax_search_filter_type", "CRYPTO");
    window.location.href = "search.html";
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

    ensurePortfolioKeys(realUser.brokeragePortfolio, brokerageAssets);
    ensurePortfolioKeys(realUser.cryptoPortfolio, cryptoAssets);

    if (!realUser.brokerageTrades) {
        realUser.brokerageTrades = [];
    }

    if (!realUser.cryptoTrades) {
        realUser.cryptoTrades = [];
    }

    if (!realUser.cashTransactions) {
        realUser.cashTransactions = [];
    }

    currentUser = realUser;

    document.getElementById("profileEmail").textContent = currentUser.email;
    document.getElementById("profilePhone").textContent = currentUser.phone;

    saveCurrentUser();
    updateDashboard();
}

function saveCurrentUser() {
    const users = getUsers();

    const updatedUsers = users.map(function (user) {
        if (user.id === currentUser.id) {
            return currentUser;
        }

        return user;
    });

    saveUsers(updatedUsers);
    setCurrentUser(currentUser);
}

function getPortfolioValue(portfolio, assets) {
    let value = 0;

    Object.keys(assets).forEach(function (symbol) {
        const amount = portfolio[symbol] || 0;
        value += amount * assets[symbol].price;
    });

    return value;
}

function getCryptoValue() {
    return getPortfolioValue(currentUser.cryptoPortfolio, cryptoAssets);
}

function updateDashboard() {
    const brokerageValue = 0;
    const cryptoValue = getCryptoValue();
    const totalValue = cryptoValue;
    const investmentValue = cryptoValue;

    const brokeragePercent = 0;
    const cryptoPercent = investmentValue > 0 ? 100 : 0;

    document.getElementById("totalBalance").textContent = formatEuro(totalValue);
    document.getElementById("cashBalance").textContent = formatEuro(currentUser.balance);

    document.getElementById("brokerageValue").textContent = "Deaktiviert";
    document.getElementById("cryptoWalletValue").textContent = formatEuro(cryptoValue);

    document.getElementById("brokeragePercent").textContent = brokeragePercent + " %";
    document.getElementById("cryptoPercent").textContent = cryptoPercent + " %";

    document.getElementById("brokerageCircle").className = "emptyCircle";
    document.getElementById("cryptoCircle").className = cryptoValue > 0 ? "fullCircle" : "emptyCircle";

    renderTransactions();
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(function (section) {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".topTab").forEach(function (tab) {
        tab.classList.remove("active");

        if (tab.dataset.section === sectionId) {
            tab.classList.add("active");
        }
    });
}

function openCashSheet(mode) {
    cashMode = mode;

    document.getElementById("cashSheetTitle").textContent = mode === "DEPOSIT" ? "Einzahlen" : "Auszahlen";
    document.getElementById("confirmCash").textContent = mode === "DEPOSIT" ? "Einzahlung bestätigen" : "Auszahlung bestätigen";
    document.getElementById("cashAmount").value = "";
    document.getElementById("cashPreview").textContent = "";
    document.getElementById("cashSheetMessage").textContent = "";

    document.getElementById("overlay").classList.add("open");
    document.getElementById("cashSheet").classList.add("open");

    setTimeout(function () {
        document.getElementById("cashAmount").focus();
    }, 250);
}

function closeSheets() {
    document.getElementById("overlay").classList.remove("open");
    document.getElementById("cashSheet").classList.remove("open");
}

function updateCashPreview() {
    const euroAmount = Number(document.getElementById("cashAmount").value);
    const preview = document.getElementById("cashPreview");

    if (!euroAmount || euroAmount <= 0) {
        preview.textContent = "";
        return;
    }

    preview.textContent = cashMode === "DEPOSIT"
        ? "Dein Cash erhöht sich um " + formatEuro(euroAmount) + "."
        : "Dein Cash reduziert sich um " + formatEuro(euroAmount) + ".";
}

function executeCashAction() {
    const euroAmount = Number(document.getElementById("cashAmount").value);
    const message = document.getElementById("cashSheetMessage");

    if (!euroAmount || euroAmount <= 0) {
        message.textContent = "Bitte gib einen gültigen Betrag ein.";
        return;
    }

    if (!currentUser.cashTransactions) {
        currentUser.cashTransactions = [];
    }

    if (cashMode === "DEPOSIT") {
        currentUser.balance += euroAmount;

        currentUser.cashTransactions.unshift({
            type: "DEPOSIT",
            amountEuro: euroAmount,
            date: new Date().toISOString()
        });
    }

    if (cashMode === "WITHDRAW") {
        if (euroAmount > currentUser.balance) {
            message.textContent = "Nicht genug verfügbares Cash.";
            return;
        }

        currentUser.balance -= euroAmount;

        currentUser.cashTransactions.unshift({
            type: "WITHDRAW",
            amountEuro: euroAmount,
            date: new Date().toISOString()
        });
    }

    saveCurrentUser();
    updateDashboard();
    closeSheets();
}

function updateOrderCategoryText() {
    document.getElementById("stepOneText").textContent = "Crypto auswählen";
}

function openOrderSheet() {
    orderType = "CRYPTO";
    updateOrderCategoryText();

    document.getElementById("orderOverlay").classList.add("open");
    document.getElementById("ordersSheet").classList.add("open");
}

function closeOrderSheet() {
    document.getElementById("orderOverlay").classList.remove("open");
    document.getElementById("ordersSheet").classList.remove("open");
}

function openTransferSheet() {
    document.getElementById("transferSheet").classList.add("open");
}

function closeTransferSheet() {
    document.getElementById("transferSheet").classList.remove("open");
}

function openPaymentMethodSheet() {
    document.getElementById("paymentMethodSheet").classList.add("open");
}

function closePaymentMethodSheet() {
    document.getElementById("paymentMethodSheet").classList.remove("open");
}

function openBankTransferInfoSheet() {
    document.getElementById("bankTransferInfoSheet").classList.add("open");
}

function closeBankTransferInfoSheet() {
    document.getElementById("bankTransferInfoSheet").classList.remove("open");
}

function openNewIbanSheet() {
    document.getElementById("newIbanSheet").classList.add("open");
    updateNewIbanNextButton();

    setTimeout(function () {
        document.getElementById("newIbanNameInput").focus();
    }, 250);
}

function closeNewIbanSheet() {
    document.getElementById("newIbanSheet").classList.remove("open");
}

function isValidIban(iban) {
    const cleanedIban = iban.replace(/\s/g, "").toUpperCase();

    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(cleanedIban)) {
        return false;
    }

    const countryLengths = {
        AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28,
        BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
        BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24,
        DE: 22, DK: 18, DO: 28, EE: 20, EG: 29,
        ES: 24, FI: 18, FO: 18, FR: 27, GB: 22,
        GE: 22, GI: 23, GL: 18, GR: 27, GT: 28,
        HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23,
        IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20,
        LB: 28, LC: 32, LI: 21, LT: 20, LU: 20,
        LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
        MR: 27, MT: 31, MU: 30, NL: 18, NO: 15,
        PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
        RO: 24, RS: 22, SA: 24, SC: 31, SE: 24,
        SI: 19, SK: 24, SM: 27, ST: 25, SV: 28,
        TL: 23, TN: 24, TR: 26, UA: 29, VA: 22,
        VG: 24, XK: 20
    };

    const countryCode = cleanedIban.slice(0, 2);
    const expectedLength = countryLengths[countryCode];

    if (!expectedLength || cleanedIban.length !== expectedLength) {
        return false;
    }

    const rearranged = cleanedIban.slice(4) + cleanedIban.slice(0, 4);

    let numericIban = "";

    for (let i = 0; i < rearranged.length; i++) {
        const char = rearranged[i];

        if (char >= "A" && char <= "Z") {
            numericIban += String(char.charCodeAt(0) - 55);
        } else {
            numericIban += char;
        }
    }

    let remainder = 0;

    for (let i = 0; i < numericIban.length; i++) {
        remainder = (remainder * 10 + Number(numericIban[i])) % 97;
    }

    return remainder === 1;
}

function updateNewIbanNextButton() {
    const name = document.getElementById("newIbanNameInput").value.trim();
    const iban = document.getElementById("newIbanInput").value.trim();
    const nextButton = document.getElementById("newIbanNextButton");

    const isReady = name.length >= 2 && isValidIban(iban);

    nextButton.disabled = !isReady;
    nextButton.classList.toggle("isActive", isReady);
}

function formatIbanInput() {
    const input = document.getElementById("newIbanInput");

    let rawValue = input.value
        .replace(/\s/g, "")
        .toUpperCase();

    rawValue = rawValue.replace(/[^A-Z0-9]/g, "");
    rawValue = rawValue.slice(0, 34);

    const formattedValue = rawValue
        .replace(/(.{4})/g, "$1 ")
        .trim();

    input.value = formattedValue;

    updateNewIbanNextButton();
}

function openSendAmountSheet() {
    const name = document.getElementById("newIbanNameInput").value.trim();
    const iban = document.getElementById("newIbanInput").value.trim();

    sendRecipientName = name;
    sendRecipientIban = iban;
    sendAmountInput = "";

    const firstName = name.split(" ")[0] || "Empfänger";

    document.getElementById("sendAmountTitle").textContent = "An " + firstName + " senden";
    document.getElementById("sendAvailableText").textContent = formatEuro(currentUser.balance) + " verfügbar";

    updateSendAmountDisplay();

    document.getElementById("sendAmountSheet").classList.add("open");
}

function closeSendAmountSheet() {
    document.getElementById("sendAmountSheet").classList.remove("open");
}

function getSendAmountNumber() {
    const normalized = sendAmountInput.replace(",", ".");
    const value = Number(normalized);

    if (!value || value <= 0) {
        return 0;
    }

    return value;
}

function updateSendAmountDisplay() {
    const display = document.getElementById("sendAmountDisplay");
    const nextButton = document.getElementById("sendAmountNextButton");
    const amount = getSendAmountNumber();

    display.textContent = sendAmountInput ? sendAmountInput + " €" : "0 €";
    display.classList.toggle("hasAmount", amount > 0);

    const isReady = amount >= 1;

    nextButton.disabled = !isReady;
    nextButton.classList.toggle("isActive", isReady);
}

function pressSendAmountKey(key) {
    const error = document.getElementById("sendAmountError");
    error.textContent = "";
    error.classList.remove("show");

    if (key === "delete") {
        sendAmountInput = sendAmountInput.slice(0, -1);
        updateSendAmountDisplay();
        return;
    }

    if (key === ",") {
        if (sendAmountInput.includes(",")) {
            return;
        }

        sendAmountInput = sendAmountInput || "0";
        sendAmountInput += ",";
        updateSendAmountDisplay();
        return;
    }

    if (sendAmountInput.includes(",")) {
        const decimals = sendAmountInput.split(",")[1];

        if (decimals.length >= 2) {
            return;
        }
    }

    if (sendAmountInput === "0") {
        sendAmountInput = key;
    } else {
        sendAmountInput += key;
    }

    updateSendAmountDisplay();
}

function copyBankTransferText(value) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(value);
        return;
    }

    const temporaryInput = document.createElement("input");
    temporaryInput.value = value;
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    document.body.removeChild(temporaryInput);
}

function openSearchFromBottom() {
    sessionStorage.setItem("valorax_search_slide_in", "1");
    window.location.href = "search.html";
}

function resetAccount() {
    const confirmed = confirm("Möchtest du dein Paper-Konto wirklich zurücksetzen?");

    if (!confirmed) {
        return;
    }

    currentUser.balance = 0;
    currentUser.portfolio = {};
    currentUser.trades = [];
    currentUser.brokeragePortfolio = {};
    currentUser.cryptoPortfolio = {};
    currentUser.brokerageTrades = [];
    currentUser.cryptoTrades = [];
    currentUser.cashTransactions = [];

    ensurePortfolioKeys(currentUser.brokeragePortfolio, brokerageAssets);
    ensurePortfolioKeys(currentUser.cryptoPortfolio, cryptoAssets);

    saveCurrentUser();
    updateDashboard();
}

function logout() {
    localStorage.removeItem("valorax_current_user");
    sessionStorage.removeItem("valorax_entry_mode");
    window.location.href = "index.html";
}

document.querySelectorAll(".topTab").forEach(function (tab) {
    tab.onclick = function () {
        showSection(tab.dataset.section);
    };
});

document.getElementById("profileButton").onclick = function () {
    window.location.href = "konto.html";
};

document.getElementById("searchButton").onclick = function () {
    openSearchFromBottom();
};

document.getElementById("transferButton").onclick = function () {
    openTransferSheet();
};

document.getElementById("savingsPlanButton").onclick = function () {
    openSavingsPlanSheet();
};

document.getElementById("savingsPlanHandle").onclick = function () {
    closeSavingsPlanSheet();
};

document.getElementById("savingsPlanInvestButton").onclick = function () {
    openSavingsPlanSearchFilter();
};

document.getElementById("orderButton").onclick = function () {
    openOrderSheet();
};

document.getElementById("cryptoWalletRow").onclick = function () {
    window.location.href = "crypto.html";
};

document.getElementById("addCardButton").onclick = function () {
    alert("Karte hinzufügen kommt als nächstes.");
};

document.getElementById("interestButton").onclick = function () {
    alert("Zinsen kommen als nächstes.");
};

document.getElementById("addOrderButton").onclick = function () {
    openSearchFromBottom();
};

document.getElementById("transactionsOpenButton").onclick = function () {
    openAllTransactionsSheet();
};

document.getElementById("allTransactionsHandle").onclick = function () {
    closeAllTransactionsSheet();
};

document.getElementById("transferHandle").onclick = function () {
    closeSendAmountSheet();
    closeBankTransferInfoSheet();
    closePaymentMethodSheet();
    closeNewIbanSheet();
    closeTransferSheet();
};

document.getElementById("depositTransferAction").onclick = function () {
    openPaymentMethodSheet();
};

document.getElementById("newIbanTransferAction").onclick = function () {
    openNewIbanSheet();
};

document.getElementById("paymentMethodHandle").onclick = function () {
    closeBankTransferInfoSheet();
    closePaymentMethodSheet();
};

document.getElementById("applePayMethod").onclick = function () {
    alert("Apple Pay kommt später.");
};

document.getElementById("bankTransferMethod").onclick = function () {
    openBankTransferInfoSheet();
};

document.getElementById("bankTransferInfoHandle").onclick = function () {
    closeBankTransferInfoSheet();
};

document.getElementById("newIbanHandle").onclick = function () {
    closeSendAmountSheet();
    closeNewIbanSheet();
};

document.getElementById("newIbanBackButton").onclick = function () {
    closeNewIbanSheet();
};

document.getElementById("newIbanNameInput").addEventListener("input", updateNewIbanNextButton);
document.getElementById("newIbanInput").addEventListener("input", formatIbanInput);

document.getElementById("newIbanNextButton").onclick = function () {
    if (document.getElementById("newIbanNextButton").disabled) {
        return;
    }

    openSendAmountSheet();
};

document.getElementById("sendAmountHandle").onclick = function () {
    closeSendAmountSheet();
};

document.getElementById("sendAmountBackButton").onclick = function () {
    closeSendAmountSheet();
};

document.querySelectorAll(".sendKey").forEach(function (button) {
    button.onclick = function () {
        pressSendAmountKey(button.dataset.key);
    };
});

document.getElementById("sendAmountNextButton").onclick = function () {
    if (document.getElementById("sendAmountNextButton").disabled) {
        return;
    }

    const amount = getSendAmountNumber();
    const error = document.getElementById("sendAmountError");

    if (amount > currentUser.balance) {
        error.textContent = "Du hast nicht genug Geld.";
        error.classList.add("show");
        return;
    }

    error.textContent = "Du musst mindestens 50 € einzahlen, bevor du Geld auszahlen kannst.";
    error.classList.add("show");
};

document.querySelectorAll(".copyButton").forEach(function (button) {
    button.onclick = function () {
        copyBankTransferText(button.dataset.copy);
    };
});

document.getElementById("overlay").onclick = closeSheets;
document.getElementById("cashAmount").oninput = updateCashPreview;
document.getElementById("confirmCash").onclick = executeCashAction;

document.getElementById("orderOverlay").onclick = closeOrderSheet;

document.getElementById("resetButton").onclick = resetAccount;
document.getElementById("logoutButton").onclick = logout;

loadUser();

if (typeof startCryptoMarketUpdates === "function") {
    startCryptoMarketUpdates(function () {
        updateDashboard();
    });
}