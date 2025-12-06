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

// Pool Page Logic
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#poolTable")) {
        loadPool();

        const addBtn = document.getElementById("addPoolBtn");
        if (addBtn) addBtn.addEventListener("click", addPool);

        // Optional: Preview fee in console
        document.getElementById("instructor").addEventListener("change", (e) => {
            console.log("Instructor Available:", e.target.checked ? "Yes ($50)" : "No ($0)");
        });
    }
});

// Load Pool Table
async function loadPool() {
    const data = await apiGet("pool");
    const tbody = document.querySelector("#poolTable tbody");
    tbody.innerHTML = "";

    data.forEach(p => {
        const row = document.createElement("tr");
        const columns = ["Pool_ID","Amenity_ID","Unit_ID","Renter_ID","Instructor","Pool_Fee"];

        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = p[key] ?? "";
            td.dataset.field = key;
            td.dataset.id = p.Pool_ID;

            // Make Pool_ID, Instructor, and Pool_Fee non-editable
            if(key === "Pool_ID" || key === "Instructor" || key === "Pool_Fee") td.contentEditable = false;

            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enablePoolEdit(this)">Edit</button>
            <button onclick="deletePool(${p.Pool_ID})">Delete</button>
        `;
        row.appendChild(actions);
        tbody.appendChild(row);
    });
}

// Add Pool Entry
async function addPool() {
    const instructorChecked = document.getElementById("instructor").checked;
    const data = {
        Amenity_ID: parseInt(document.getElementById("pool_amenity_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Instructor: instructorChecked,
        Pool_Fee: instructorChecked ? 50 : 0
    };

    try {
        validateFields(data);
        requireNumber(data.Amenity_ID);
        requireNumber(data.Unit_ID);
        requireNumber(data.Renter_ID);

        const res = await apiPost("pool", data);
        if (res.error) throw new Error(res.error);

        loadPool();

        ["pool_amenity_id","unit_id","renter_id"].forEach(id => {
            document.getElementById(id).value = "";
        });
        document.getElementById("instructor").checked = false;

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable Edit
function enablePoolEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        if(td.dataset.field !== "Pool_ID" && td.dataset.field !== "Instructor" && td.dataset.field !== "Pool_Fee") {
            td.contentEditable = true;
            td.style.backgroundColor = "#d79135";
        }
    });

    button.parentElement.innerHTML = `
        <button onclick="savePoolEdit(this)">Save</button>
        <button onclick="cancelPoolEdit()">Cancel</button>
    `;
}

// Save Edit
async function savePoolEdit(button) {
    const row = button.closest("tr");
    const originalPK = row.querySelector("td[data-field='Pool_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        if(td.dataset.field !== "Pool_ID" && td.dataset.field !== "Instructor" && td.dataset.field !== "Pool_Fee") {
            payload[td.dataset.field] = td.innerText;
        }
    });

    try { await apiPut(`pool/${originalPK}`, payload); loadPool(); }
    catch(err) { alert(friendlyError(err.message)); loadPool(); }
}

// Cancel Edit
function cancelPoolEdit() { loadPool(); }

// Delete Pool Entry
async function deletePool(id) {
    if(!confirm("Delete this Pool entry?")) return;
    try {
        const res = await apiDelete(`pool/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadPool();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}
