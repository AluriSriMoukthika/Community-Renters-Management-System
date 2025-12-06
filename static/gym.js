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
async function apiGet(endpoint) { const res = await fetch(`${API}/${endpoint}`); return res.json(); }
async function apiPost(endpoint, data) { 
    const res = await fetch(`${API}/${endpoint}`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
    }); return res.json(); 
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

async function apiDelete(endpoint) { const res = await fetch(`${API}/${endpoint}`, { method:"DELETE" }); return res.json(); }

// -----------------------
// Gym Page Logic
// -----------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#gymTable")) {
        loadGym();

        const addBtn = document.getElementById("addGymBtn");
        if (addBtn) addBtn.addEventListener("click", addGym);

        // Update Gym Fee automatically on Trainer checkbox change
        const trainerCheckbox = document.getElementById("trainer");
        trainerCheckbox.addEventListener("change", () => {
            // Gym fee will be automatic on backend, we don't display input
            // Optionally, you can show it temporarily:
            console.log("Trainer available:", trainerCheckbox.checked ? "Yes ($50)" : "No ($0)");
        });
    }
});

// Load Gym Table
async function loadGym() {
    const data = await apiGet("gym");
    const tbody = document.querySelector("#gymTable tbody");
    tbody.innerHTML = "";

    data.forEach(g => {
        const row = document.createElement("tr");

        const columns = ["Gym_ID","Amenity_ID","Unit_ID","Renter_ID","Trainer","Gym_Fee"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = g[key] ?? "";
            td.dataset.field = key;
            td.dataset.id = g.Gym_ID;

            // Make Trainer and Gym_Fee non-editable
            if (key === "Gym_ID" || key === "Trainer" || key === "Gym_Fee") td.contentEditable = false;

            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableGymEdit(this)">Edit</button>
            <button onclick="deleteGym(${g.Gym_ID})">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}

// Add Gym Entry
async function addGym() {
    const trainerChecked = document.getElementById("trainer").checked;
    const data = {
        Amenity_ID: parseInt(document.getElementById("gym_amenity_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Trainer: trainerChecked,
        Gym_Fee: trainerChecked ? 50 : 0
    };

    try {
        validateFields(data);
        requireNumber(data.Amenity_ID);
        requireNumber(data.Unit_ID);
        requireNumber(data.Renter_ID);

        const res = await apiPost("gym", data);
        if (res.error) throw new Error(res.error);

        loadGym();

        document.getElementById("gym_amenity_id").value = "";
        document.getElementById("unit_id").value = "";
        document.getElementById("renter_id").value = "";
        document.getElementById("trainer").checked = false;

    } catch (err) {
        alert(friendlyError(err.message));
    }

}

// Enable Edit
function enableGymEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        if(td.dataset.field !== "Gym_ID" && td.dataset.field !== "Trainer" && td.dataset.field !== "Gym_Fee") {
            td.contentEditable = true;
            td.style.backgroundColor = "#f9d7b5";
        }
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveGymEdit(this)">Save</button>
        <button onclick="cancelGymEdit(this)">Cancel</button>
    `;
}

// Save Edit
async function saveGymEdit(button) {
    const row = button.closest("tr");
    const gymID = row.querySelector("td[data-field='Gym_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        if(td.dataset.field !== "Gym_ID" && td.dataset.field !== "Trainer" && td.dataset.field !== "Gym_Fee") {
            payload[td.dataset.field] = td.innerText;
        }
    });

    try { await apiPut(`gym/${gymID}`, payload); loadGym(); }
    catch(err) { alert(friendlyError(err.message)); loadGym(); }
}

// Cancel Edit
function cancelGymEdit() { loadGym(); }

// Delete Gym Entry
async function deleteGym(id) {
    if(!confirm("Delete this Gym entry?")) return;
    try {
        const res = await apiDelete(`gym/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadGym();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}
