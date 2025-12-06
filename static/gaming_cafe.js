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

// Page logic
document.addEventListener("DOMContentLoaded", () => {
    if(document.querySelector("#gamingCafeTable")){
        loadGamingCafe();
        const addBtn = document.getElementById("addGamingCafeBtn");
        if(addBtn) addBtn.addEventListener("click", addGamingCafe);
    }
});

// Load table
async function loadGamingCafe() {
    const data = await apiGet("gaming_cafe");
    const tbody = document.querySelector("#gamingCafeTable tbody");
    tbody.innerHTML = "";

    data.forEach(g => {
        const row = document.createElement("tr");
        const columns = ["Gaming_ID","Amenity_ID","Unit_ID","Renter_ID","Cafe_Fee"];
        
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = g[key] ?? (key === "Cafe_Fee" ? 50 : "");
            td.dataset.field = key;
            td.dataset.id = g.Gaming_ID;

            // Non-editable columns
            if(key === "Gaming_ID" || key === "Cafe_Fee") td.contentEditable = false;

            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableGamingCafeEdit(this)">Edit</button>
            <button onclick="deleteGamingCafe(${g.Gaming_ID})">Delete</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

// Add entry
async function addGamingCafe() {
    const data = {
        Amenity_ID: parseInt(document.getElementById("gaming_amenity_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Cafe_Fee: 50 // constant
    };
    
    try {
        validateFields(data);
        requireNumber(data.Amenity_ID);
        requireNumber(data.Unit_ID);
        requireNumber(data.Renter_ID);

        const res = await apiPost("gaming_cafe", data);
        if (res.error) throw new Error(res.error);

        loadGamingCafe();

        ["gaming_amenity_id","unit_id","renter_id"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable Edit
function enableGamingCafeEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");
    cells.forEach(td => {
        if(td.dataset.field !== "Gaming_ID" && td.dataset.field !== "Cafe_Fee") {
            td.contentEditable = true;
            td.style.backgroundColor = "#d79135";
        }
    });

    button.parentElement.innerHTML = `
        <button onclick="saveGamingCafeEdit(this)">Save</button>
        <button onclick="cancelGamingCafeEdit()">Cancel</button>
    `;
}

// Save Edit
async function saveGamingCafeEdit(button) {
    const row = button.closest("tr");
    const originalPK = row.querySelector("td[data-field='Gaming_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        if(td.dataset.field !== "Gaming_ID" && td.dataset.field !== "Cafe_Fee") {
            payload[td.dataset.field] = td.innerText;
        }
    });

    try { await apiPut(`gaming_cafe/${originalPK}`, payload); loadGamingCafe(); }
    catch(err) { alert(friendlyError(err.message)); loadGamingCafe(); }
}

// Cancel Edit
function cancelGamingCafeEdit() { loadGamingCafe(); }

// Delete entry
async function deleteGamingCafe(id) {
    if(!confirm("Delete this Gaming Cafe entry?")) return;
    try {
        const res = await apiDelete(`gaming_cafe/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadGamingCafe();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}
