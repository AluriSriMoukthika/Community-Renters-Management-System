// -----------------------
// amenity_payment.js
// -----------------------
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

// Generic API functions
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
// Page Logic
// -----------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#amenityPaymentTable")) {
        loadAmenityPayments();

        const addBtn = document.getElementById("addAmenityPayBtn");
        if (addBtn) addBtn.addEventListener("click", addAmenityPayment);
    }
});

// Load table
async function loadAmenityPayments() {
    const data = await apiGet("amenity_payment");
    const tbody = document.querySelector("#amenityPaymentTable tbody");
    tbody.innerHTML = "";

    data.forEach(p => {
        const row = document.createElement("tr");
        const columns = ["Amenity_Pay_ID","Renter_ID","Amenity_ID","Amount","Amen_Pay_Date","Amen_Pay_Type"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = p[key] !== undefined ? p[key] : "";
            td.dataset.field = key;
            td.dataset.id = p.Amenity_Pay_ID;
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableAmenityPayEdit(this)">Edit</button>
            <button onclick="deleteAmenityPayment(${p.Amenity_Pay_ID})">Delete</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

// Add payment
async function addAmenityPayment() {
    const data = {
        Amenity_Pay_ID: parseInt(document.getElementById("amenity_pay_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Amenity_ID: parseInt(document.getElementById("amenity_id").value),
        Amount: parseFloat(document.getElementById("amount").value),
        Amen_Pay_Date: document.getElementById("amen_pay_date").value,
        Amen_Pay_Type: document.getElementById("amen_pay_type").value
    };

    try {
        validateFields(data);
        requireNumber(data.Amenity_Pay_ID);
        requireNumber(data.Renter_ID);
        requireNumber(data.Amenity_ID);
        requireNumber(data.Amount);

        const res = await apiPost("amenity_payment", data);
        if (res.error) throw new Error(res.error);

        loadAmenityPayments();

        ["amenity_pay_id","renter_id","amenity_id","amount","amen_pay_date","amen_pay_type"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable edit
function enableAmenityPayEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");
    cells.forEach(td => { td.contentEditable = true; td.style.backgroundColor = "#d79135ff"; });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveAmenityPayEdit(this)">Save</button>
        <button onclick="cancelAmenityPayEdit(this)">Cancel</button>
    `;
}

// Save edit
async function saveAmenityPayEdit(button) {
    const row = button.closest("tr");
    const originalPK = row.querySelector("td[data-field='Amenity_Pay_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => { payload[td.dataset.field] = td.innerText; });

    try {
        await apiPut(`amenity_payment/${originalPK}`, payload);
        loadAmenityPayments();
    } catch (err) {
        alert(friendlyError(err.message));
        loadAmenityPayments();
    }
}

// Cancel edit
function cancelAmenityPayEdit() { loadAmenityPayments(); }

// Delete payment
async function deleteAmenityPayment(id) {
    if (!confirm("Delete this payment?")) return;
    try {
        const res = await apiDelete(`amenity_payment/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadAmenityPayments();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}
