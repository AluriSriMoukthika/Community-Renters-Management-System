const API = "http://127.0.0.1:5000/api";

function friendlyError(msg) {
    msg = msg.toLowerCase();

    if (msg.includes("exists"))
        return "This ID already exists. Try another one.";

    if (msg.includes("linked"))
        return "You cannot delete this because it is linked to other data.";

    if (msg.includes("required"))
        return "Please fill all required fields.";

    if (msg.includes("number"))
        return "Enter a valid number — letters are not allowed.";

    if (msg.includes("empty"))
        return "Some fields were left empty.";

    if (msg.includes("invalid"))
        return "Some values are invalid. Please check and try again.";

    return "Something went wrong. Please try again.";
}

// Validate that no value is empty
function validateFields(data) {
    for (const key in data) {
        if (data[key] === "" || data[key] === null || data[key] === undefined || Number.isNaN(data[key])) {
            throw new Error("empty");
        }
    }
}

// Validate numbers only
function requireNumber(value) {
    if (Number.isNaN(value)) {
        throw new Error("number");
    }
}

// -----------------------
// Generic API Functions
// -----------------------
async function apiGet(endpoint) {
    const res = await fetch(`${API}/${endpoint}`);
    return res.json();
}

async function apiPost(endpoint, data) {
    const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function apiPut(endpoint, data) {
    const res = await fetch(`${API}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const text = await res.text();
    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch (e) {
        parsed = { error: text || "Unknown error" };
    }

    if (!res.ok) {
        // Use friendly text before throwing
        throw new Error(friendlyError(parsed.error));
    }

    return parsed;
}


async function apiDelete(endpoint) {
    const res = await fetch(`${API}/${endpoint}`, { method: "DELETE" });
    return res.json();
}

// -----------------------
// Rent Payment Page Logic
// -----------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#rentPaymentTable")) {
        loadRentPayments();

        const addBtn = document.getElementById("addRentPayBtn");
        if (addBtn) addBtn.addEventListener("click", addRentPayment);
    }
});

// Load Rent Payment Table
async function loadRentPayments() {
    const data = await apiGet("rent_payment");
    const tbody = document.querySelector("#rentPaymentTable tbody");
    tbody.innerHTML = "";

    data.forEach(r => {
        const row = document.createElement("tr");
        const columns = ["Re_Pay_ID", "Unit_ID", "Renter_ID", "Rent_Amount", "Date", "Payment_Type"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = r[key] !== undefined ? r[key] : "";
            td.dataset.field = key;
            td.dataset.id = r.Re_Pay_ID;
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableRentPayEdit(this)">Edit</button>
            <button onclick="deleteRentPay(${r.Re_Pay_ID})">Delete</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

// Add Rent Payment
async function addRentPayment() {
    const data = {
        Re_Pay_ID: parseInt(document.getElementById("pay_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Rent_Amount: parseFloat(document.getElementById("rent_amount").value),
        Date: document.getElementById("pay_date").value,
        Payment_Type: document.getElementById("pay_type").value
    };

    
    try {
        validateFields(data);
        requireNumber(data.Re_Pay_ID);
        requireNumber(data.Unit_ID);
        requireNumber(data.Renter_ID);
        requireNumber(data.Rent_Amount);

        const res = await apiPost("rent_payment", data);
        if (res.error) throw new Error(res.error);

        loadRentPayments();

        ["pay_id","unit_id","renter_id","rent_amount","pay_date","pay_type"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }

}

// Enable Edit
function enableRentPayEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");
    cells.forEach(td => {
        td.contentEditable = true;
        td.style.backgroundColor = "#d79135ff";
    });
    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveRentPayEdit(this)">Save</button>
        <button onclick="cancelRentPayEdit(this)">Cancel</button>
    `;
}

// Save Edit
async function saveRentPayEdit(button) {
    const row = button.closest("tr");
    const originalPK = row.querySelector("td[data-field='Re_Pay_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    try {
        await apiPut(`rent_payment/${originalPK}`, payload);
        loadRentPayments();
    } catch (err) {
        alert(friendlyError(err.message));
        loadRentPayments();
    }
}

// Cancel Edit
function cancelRentPayEdit() {
    loadRentPayments();
}

// Delete Rent Payment
async function deleteRentPay(id) {
    if (!confirm("Delete this Rent Payment entry?")) return;
    try {
        const res = await apiDelete(`rent_payment/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadRentPayments();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}
