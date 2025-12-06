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


// Generic GET, POST, PUT, DELETE functions
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

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#rentersTable")) loadRenters();
    if (document.querySelector("#unitsTable")) loadUnits();
    if (document.querySelector("#amenitiesTable")) loadAmenities();
    if (document.querySelector("#communityTable")) loadCommunity();
    if (document.querySelector("#maintenanceTable")) loadMaintenance();
    if (document.querySelector("#dependentsTable")) loadDependents();
});



async function loadRenters() {
    const data = await apiGet("renters");
    const tbody = document.querySelector("#rentersTable tbody");
    tbody.innerHTML = "";

    data.forEach(r => {
        const row = document.createElement("tr");

        const columns = ["Renter_ID", "Name", "Unit_ID", "Phone", "Email", "SSN", "Start_Date", "End_Date", "Dept_Count"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = r[key] || "";
            td.dataset.field = key; // **all fields editable now**
            td.dataset.id = r.Renter_ID;
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableEdit(this)">Edit</button>
            <button onclick="deleteRenter(${r.Renter_ID})">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}

// Add renter
async function addRenter() {
    const data = {
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Name: document.getElementById("name").value,
        Unit_ID: parseInt(document.getElementById("unit").value),
        Phone: document.getElementById("phone").value,
        Email: document.getElementById("email").value,
        SSN: document.getElementById("ssn").value,
        Start_Date: document.getElementById("start").value,
        End_Date: document.getElementById("end").value,
        Dept_Count: parseInt(document.getElementById("dept_count").value) || 0
    };

    try {
        validateFields(data);
        requireNumber(data.Renter_ID);
        requireNumber(data.Unit_ID);

        const res = await apiPost("renters", data);
        if (res.error) throw new Error(res.error);

        loadRenters();

        ["renter_id","name","unit","phone","email","ssn","start","end","dept_count"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Delete renter
async function deleteRenter(id) {
    if (!confirm("Are you sure you want to delete this renter?")) return;
    try {
        const res = await apiDelete(`renters/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadRenters();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable inline editing
function enableEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        td.contentEditable = true;
        td.style.backgroundColor = "#d79135ff"; // yellow
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveEdit(this)">Save</button>
        <button onclick="cancelEdit(this)">Cancel</button>
    `;
}

// Save edited row
async function saveEdit(button) {
    const row = button.closest("tr");
    const id = row.querySelector("td").innerText; // Renter_ID can now be edited
    const payload = {};

    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    try {
        await apiPut(`renters/${id}`, payload);
        loadRenters(); // reload table after successful save
    } catch (err) {
        alert(friendlyError(err.message));
        loadRenters(); // revert table
    }
}

// Cancel editing
function cancelEdit(button) {
    loadRenters(); // reload table to revert changes
}


// ------------------- UNITS -----------------------

// Load Units Table
async function loadUnits() {
    const data = await apiGet("units");
    const tbody = document.querySelector("#unitsTable tbody");
    tbody.innerHTML = "";

    data.forEach(u => {
        const row = document.createElement("tr");

        const columns = ["Unit_ID", "Com_ID", "Unit_Address", "Mail_box_Num", "Occupancy", "Rent"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = u[key] || "";
            td.dataset.field = key;
            td.dataset.id = u.Unit_ID;   // store origin PK
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableUnitEdit(this)">Edit</button>
            <button onclick="deleteUnit(${u.Unit_ID})">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}


// Add Unit
async function addUnit() {
    const data = {
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Com_ID: parseInt(document.getElementById("com_id").value),
        Unit_Address: document.getElementById("unit_address").value,
        Mail_box_Num: document.getElementById("mail_box_num").value,
        Occupancy: parseInt(document.getElementById("occupancy").value),
        Rent: parseFloat(document.getElementById("rent").value)
    };

    try {
        validateFields(data);
        requireNumber(data.Unit_ID);
        requireNumber(data.Com_ID);
        requireNumber(data.Occupancy);
        requireNumber(data.Rent);

        const res = await apiPost("units", data);
        if (res.error) throw new Error(res.error);

        loadUnits();

        ["unit_id","com_id","unit_address","mail_box_num","occupancy","rent"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}


// Enable edit
function enableUnitEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        td.contentEditable = true;
        td.style.backgroundColor = "#d79135ff";
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveUnitEdit(this)">Save</button>
        <button onclick="cancelUnitEdit(this)">Cancel</button>
    `;
}


// Save edit
async function saveUnitEdit(button) {
    const row = button.closest("tr");

    // original PK (not editable)
    const originalPK = row.querySelector("td[data-field='Unit_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    try {
        await apiPut(`units/${originalPK}`, payload);
        loadUnits();
    } catch (err) {
        alert(friendlyError(err.message));
        loadUnits();
    }
}


// Cancel
function cancelUnitEdit(button) {
    loadUnits();
}


// Delete
async function deleteUnit(id) {
    if (!confirm("Delete this unit?")) return;
    try {
        const res = await apiDelete(`units/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadUnits();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}


// ------------------- AMENITIES (READ-ONLY) -----------------------

// Load Amenities Table
async function loadAmenities() {
    const data = await apiGet("amenities");
    const tbody = document.querySelector("#amenitiesTable tbody");
    tbody.innerHTML = "";

    data.forEach(a => {
        const row = document.createElement("tr");

        // Only Amenity_ID + Ame_Name remain
        const columns = ["Amenity_ID", "Ame_Name"];

        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = a[key] || "";
            td.dataset.field = key;
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
}


// Filter amenities by type (Gym, Pool, etc.)
function filterAmenity(type) {
    const tbody = document.querySelector("#amenitiesTable tbody");
    tbody.innerHTML = ""; 

    apiGet("amenities").then(data => {

        const filtered = data.filter(a => a.Ame_Name === type);

        filtered.forEach(a => {
            const row = document.createElement("tr");

            ["Amenity_ID", "Ame_Name"].forEach(key => {
                const td = document.createElement("td");
                td.innerText = a[key];
                td.dataset.field = key;
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });
    });
}


// Auto-load
window.onload = () => {
    if (window.location.pathname.includes("amenities")) {
        loadAmenities();
    }
};


// ------------------- COMMUNITY -----------------------

// Load Community Table
async function loadCommunity() {
    const data = await apiGet("community");
    const tbody = document.querySelector("#communityTable tbody");
    tbody.innerHTML = "";

    data.forEach(c => {
        const row = document.createElement("tr");

        // MUST MATCH YOUR DATABASE COLUMN NAMES EXACTLY
        const columns = ["Com_ID", "Com_Name", "Address", "Contact"];

        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = c[key] ?? "";   // ← FIX: use exact key
            td.dataset.field = key;
            td.dataset.id = c.Com_ID;     // store original PK
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableCommunityEdit(this)">Edit</button>
            <button onclick="deleteCommunity(${c.Com_ID})">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}


// Add Community
async function addCommunity() {
    const data = {
        Com_ID: parseInt(document.getElementById("com_id").value),
        Com_Name: document.getElementById("com_name").value.trim(),
        Address: document.getElementById("address").value.trim(),
        Contact: document.getElementById("contact").value.trim()
    };

    try {
        validateFields(data);
        requireNumber(data.Com_ID);

        const res = await apiPost("community", data);
        if (res.error) throw new Error(res.error);

        loadCommunity();

        ["com_id", "com_name", "address", "contact"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}




// Enable edit
function enableCommunityEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        if (td.dataset.field !== "Com_ID") {   // DO NOT EDIT PK
            td.contentEditable = true;
            td.style.backgroundColor = "#d79135ff";
        }
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveCommunityEdit(this)">Save</button>
        <button onclick="cancelCommunityEdit(this)">Cancel</button>
    `;
}


// Save edit
async function saveCommunityEdit(button) {
    const row = button.closest("tr");
    const id = row.querySelector("td[data-field='Clubhouse_ID']").innerText;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    // Recalculate Duration & Fees
    const newDuration = calculateDuration(payload.TimeSlot);
    payload.Duration = newDuration;
    payload.Fee_perHour = 15;
    payload.Booking_Fee = newDuration * 15;

    try {
        const res = await apiPut(`clubhouse/${id}`, payload);

        // Handle server-side conflict/error
        if (res.error) {
            alert(friendlyError(res.error));
            return; // keep row in edit mode
        }

        loadClubhouse(); // reload table on success
    } catch (err) {
        alert(friendlyError(err.message));
    }
}


// Cancel
function cancelCommunityEdit() {
    loadCommunity();
}


// Delete
async function deleteCommunity(id) {
    if (!confirm("Delete this community?")) return;
    try {
        const res = await apiDelete(`community/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadCommunity();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}


// Load Maintenance Requests Table
async function loadMaintenance() {
    const data = await apiGet("maintenance");
    const tbody = document.querySelector("#maintenanceTable tbody");
    tbody.innerHTML = "";

    data.forEach(r => {
        const row = document.createElement("tr");

        const columns = ["Req_ID", "Unit_ID", "Renter_ID", "Type", "Priority", "Status"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = r[key] || "";
            td.dataset.field = key;
            td.dataset.id = r.Req_ID;
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableMaintenanceEdit(this)">Edit</button>
            <button onclick="deleteMaintenance(${r.Req_ID})">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}

// Add Maintenance Request
async function addMaintenance() {
    const data = {
        Req_ID: parseInt(document.getElementById("req_id").value),
        Unit_ID: parseInt(document.getElementById("unit_id").value),
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Type: document.getElementById("type").value,
        Priority: document.getElementById("priority").value,
        Status: document.getElementById("status").value
    };

    try {
        validateFields(data);
        requireNumber(data.Req_ID);
        requireNumber(data.Unit_ID);
        requireNumber(data.Renter_ID);

        const res = await apiPost("maintenance", data);
        if (res.error) throw new Error(res.error);

        loadMaintenance();

        ["req_id","unit_id","renter_id","type","priority","status"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable edit
function enableMaintenanceEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    cells.forEach(td => {
        td.contentEditable = true;
        td.style.backgroundColor = "#d79135ff";
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveMaintenanceEdit(this)">Save</button>
        <button onclick="cancelMaintenanceEdit(this)">Cancel</button>
    `;
}

// Save edit
async function saveMaintenanceEdit(button) {
    const row = button.closest("tr");
    const originalPK = row.querySelector("td[data-field='Req_ID']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    try {
        await apiPut(`maintenance/${originalPK}`, payload);
        loadMaintenance();
    } catch (err) {
        alert(friendlyError(err.message));
        loadMaintenance();
    }
}

// Cancel
function cancelMaintenanceEdit() {
    loadMaintenance();
}

// Delete
async function deleteMaintenance(id) {
    if (!confirm("Delete this maintenance request?")) return;
    try {
        const res = await apiDelete(`maintenance/${id}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadMaintenance();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}


// Load Dependents Table
async function loadDependents() {
    const data = await apiGet("dependents");
    const tbody = document.querySelector("#dependentsTable tbody");
    tbody.innerHTML = "";

    data.forEach(d => {
        const row = document.createElement("tr");

        row.dataset.originalRenterID = d.Renter_ID;
        row.dataset.originalDeptSSN = d.Dept_SSN;

        const columns = ["Renter_ID", "Dept_SSN", "Dept_Name", "Dept_Phone", "Dept_Email"];
        columns.forEach(key => {
            const td = document.createElement("td");
            td.innerText = d[key] || "";
            td.dataset.field = key;
            td.dataset.id = key === "Dept_SSN" ? d.Dept_SSN : d.Renter_ID;
            row.appendChild(td);
        });

        const actions = document.createElement("td");
        actions.innerHTML = `
            <button onclick="enableDependentEdit(this)">Edit</button>
            <button onclick="deleteDependent(${d.Renter_ID}, '${d.Dept_SSN}')">Delete</button>
        `;
        row.appendChild(actions);

        tbody.appendChild(row);
    });
}

// Add Dependent
async function addDependent() {
    const data = {
        Renter_ID: parseInt(document.getElementById("renter_id").value),
        Dept_SSN: document.getElementById("dept_ssn").value,
        Dept_Name: document.getElementById("dept_name").value,
        Dept_Phone: document.getElementById("dept_phone").value,
        Dept_Email: document.getElementById("dept_email").value
    };

    try {
        validateFields(data);
        requireNumber(data.Renter_ID);

        const res = await apiPost("dependents", data);
        if (res.error) throw new Error(res.error);

        loadDependents();

        ["renter_id","dept_ssn","dept_name","dept_phone","dept_email"]
            .forEach(id => document.getElementById(id).value = "");

    } catch (err) {
        alert(friendlyError(err.message));
    }
}

// Enable edit
function enableDependentEdit(button) {
    const row = button.closest("tr");
    const cells = row.querySelectorAll("td[data-field]");

    // Make all cells editable and highlight
    cells.forEach(td => {
        td.contentEditable = true;
        td.style.backgroundColor = "#d79135ff";
    });

    const actionsCell = button.parentElement;
    actionsCell.innerHTML = `
        <button onclick="saveDependentEdit(this)">Save</button>
        <button onclick="cancelDependentEdit(this)">Cancel</button>
    `;
}

// Save Dependent edit
async function saveDependentEdit(button) {
    const row = button.closest("tr");

    // Use original PKs to identify row
    const originalRenterID = row.dataset.originalRenterID || row.querySelector("td[data-field='Renter_ID']").dataset.id;
    const originalDeptSSN = row.dataset.originalDeptSSN || row.querySelector("td[data-field='Dept_SSN']").dataset.id;

    const payload = {};
    row.querySelectorAll("td[data-field]").forEach(td => {
        payload[td.dataset.field] = td.innerText;
    });

    try {
        const res = await apiPut(`dependents/${originalRenterID}/${originalDeptSSN}`, payload);
        if (res.error) {
            alert(friendlyError(err.message));
        }
        loadDependents();
    } catch (err) {
        alert(friendlyError(err.message));
        loadDependents();
    }
}

// Cancel edit
function cancelDependentEdit() {
    loadDependents();
}


// Delete
async function deleteDependent(renter_id, dept_ssn) {
    if (!confirm("Delete this dependent?")) return;
    try {
        const res = await apiDelete(`dependents/${renter_id}/${dept_ssn}`);
        if (res.error) {
            alert(friendlyError(res.error));
            return;
        }
        loadDependents();
    } catch (err) {
        alert(friendlyError(err.message));
    }
}

function loadAmenityRevenue() {
    fetch('/amenity_revenue')
        .then(response => response.json())
        .then(data => {
            const table = document.querySelector('#amenityRevenueTable tbody');
            table.innerHTML = "";

            data.forEach(row => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${row.Amenity_ID}</td>
                    <td>${row.Amenity_Name}</td>
                    <td>${row.Total_Revenue}</td>
                    <td>${row.Num_Payments}</td>
                `;

                table.appendChild(tr);
            });
        });
}

