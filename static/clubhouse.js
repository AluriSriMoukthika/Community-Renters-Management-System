const API = "http://127.0.0.1:5000/api";

function friendlyError(msg) {
    msg = msg.toLowerCase();

    if (msg.includes("exists")) return "This ID already exists.";
    if (msg.includes("linked")) return "Cannot delete: linked to other data.";
    if (msg.includes("required")) return "Please fill all fields.";
    if (msg.includes("number")) return "Numbers only!";
    if (msg.includes("empty")) return "Some fields are empty.";
    if (msg.includes("invalid")) return "Invalid value entered.";

    return "Something went wrong.";
}

// Validate required fields
function validateFields(data) {
    for (const k in data) {
        if (data[k] === "" || data[k] === undefined || data[k] === null)
            throw new Error("empty");
    }
}

// Generic API
async function apiGet(e) { return (await fetch(`${API}/${e}`)).json(); }
async function apiPost(e, d) {
    const res = await fetch(`${API}/${e}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d)
    });
    return res.json();
}
async function apiPut(e, d) {
    const res = await fetch(`${API}/${e}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d)
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { error: text }; }
}
async function apiDelete(e) {
    return (await fetch(`${API}/${e}`, { method: "DELETE" })).json();
}

// Calculate duration
function calculateDuration(ts) {
    try {
        const [start, end] = ts.split(" - ");
        const s = new Date(`2020-01-01 ${start}`);
        const e = new Date(`2020-01-01 ${end}`);
        const diff = (e - s) / 3600000;
        return diff > 0 ? diff : 0;
    } catch {
        return 0;
    }
}

function updateDurationAndFee() {
    const ts = document.getElementById("time_slot").value;
    const duration = calculateDuration(ts);
    const fee = 15;
    const total = duration * fee;

    document.getElementById("duration").value = duration;
    document.getElementById("fee_per_hour").value = fee;
    document.getElementById("booking_fee").value = total;
}

// Load table
async function loadClubhouse() {
    const data = await apiGet("clubhouse");
    const tbody = document.querySelector("#clubhouseTable tbody");
    tbody.innerHTML = "";

    data.forEach(c => {
        const row = document.createElement("tr");
        const fields = [
            "Clubhouse_ID","Amenity_ID","Unit_ID","Renter_ID",
            "Booking1_Date","TimeSlot","Duration",
            "Fee_perHour","Booking_Fee"
        ];

        fields.forEach(f => {
            const td = document.createElement("td");
            td.innerText = c[f];
            td.dataset.field = f;
            td.dataset.id = c.Clubhouse_ID;

            // ALL fields are non-editable at first
            td.contentEditable = false;

            // Auto update duration/fee when editing time slot
            if (f === "TimeSlot") {
                td.addEventListener("input", () => {
                    const newDuration = calculateDuration(td.innerText);
                    const row = td.closest("tr");
                    row.querySelector("td[data-field='Duration']").innerText = newDuration;
                    row.querySelector("td[data-field='Fee_perHour']").innerText = 15;
                    row.querySelector("td[data-field='Booking_Fee']").innerText = newDuration * 15;
                });
            }

            row.appendChild(td);
        });

        // Actions
        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableEdit(this)">Edit</button>
            <button onclick="deleteClubhouse(${c.Clubhouse_ID})">Delete</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

// Enable editing
function enableEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        if (!["Duration","Fee_perHour","Booking_Fee"].includes(td.dataset.field)) {
            td.contentEditable = true;
            td.style.backgroundColor = "#fffae6";
        }
    });

    button.parentElement.innerHTML = `
        <button onclick="saveEdit(this)">Save</button>
        <button onclick="cancelEdit()">Cancel</button>
    `;
}

// Save edit
async function saveEdit(button) {
    const row = button.closest("tr");
    const id = row.querySelector("td[data-field='Clubhouse_ID']").innerText;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    // Recalculate duration and fee
    const newDuration = calculateDuration(payload.TimeSlot);
    payload.Duration = newDuration;
    payload.Fee_perHour = 15;
    payload.Booking_Fee = newDuration * 15;

    try {
        const res = await apiPut(`clubhouse/${id}`, payload);

        // Check if server returned an error
        if (res.error) {
            throw new Error(res.error);
        }

        loadClubhouse(); // Only reload if successful
    } catch (err) {
        // Show friendly error message and keep the row in edit mode
        alert(friendlyError(err.message));
    }
}

// Cancel edit
function cancelEdit() {
    loadClubhouse();
}

// Add row
async function addClubhouse() {
    updateDurationAndFee();

    const data = {
        Amenity_ID: parseInt(document.getElementById("clubhouse_amenity_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Booking1_Date: document.getElementById("booking_date").value,
        TimeSlot: document.getElementById("time_slot").value,
        Duration: parseFloat(document.getElementById("duration").value),
        Fee_perHour: parseFloat(document.getElementById("fee_per_hour").value),
        Booking_Fee: parseFloat(document.getElementById("booking_fee").value),
    };

    try {
        validateFields(data);

        const res = await apiPost("clubhouse", data);
        if (res.error) throw new Error(res.error);

        loadClubhouse();

        document.querySelectorAll(
            "#clubhouse_amenity_id,#unit_id,#renter_id,#booking_date,#time_slot"
        ).forEach(i => i.value = "");

    } catch (e) {
        alert(friendlyError(e.message));
    }
}

// Delete row
async function deleteClubhouse(id) {
    if (!confirm("Delete entry?")) return;
    await apiDelete(`clubhouse/${id}`);
    loadClubhouse();
}

document.addEventListener("DOMContentLoaded", () => {
    loadClubhouse();
    document.getElementById("time_slot").addEventListener("input", updateDurationAndFee);
    document.getElementById("addClubhouseBtn").addEventListener("click", addClubhouse);
});
