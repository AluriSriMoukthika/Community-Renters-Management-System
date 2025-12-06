async function apiGet(endpoint) {
    const res = await fetch(`/api/${endpoint}`);
    if (!res.ok) throw new Error("API error: " + res.status);
    return res.json();
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#rentPerCommunity")) loadRentPerCommunity();
    if (document.querySelector("#requestsByPriority")) loadRequestsByPriority();
    if (document.querySelector("#amenityPayments")) loadAmenityPayments();
    if (document.querySelector("#maintenanceDetail")) loadMaintenanceDetail();
});

async function loadRentPerCommunity() {
    const data = await apiGet("aggregate/rent_per_community");
    const tbody = document.querySelector("#rentPerCommunity tbody");
    tbody.innerHTML = "";
    data.forEach(r => {
        tbody.innerHTML += `<tr>
            <td>${r.Com_Name}</td>
            <td>${r.Total_Rent_Collected}</td>
        </tr>`;
    });
}

async function loadRequestsByPriority() {
    const data = await apiGet("aggregate/requests_by_priority");
    const tbody = document.querySelector("#requestsByPriority tbody");
    tbody.innerHTML = "";
    data.forEach(r => {
        tbody.innerHTML += `<tr>
            <td>${r.Priority}</td>
            <td>${r.Num_Requests}</td>
        </tr>`;
    });
}

async function loadAmenityPayments() {
    const data = await apiGet("join/amenity_payments");
    const tbody = document.querySelector("#amenityPayments tbody");
    tbody.innerHTML = "";
    data.forEach(a => {
        tbody.innerHTML += `<tr>
            <td>${a.Amenity_Pay_ID}</td>
            <td>${a.Renter_Name}</td>
            <td>${a.Amenity_Name}</td>
            <td>${a.Amount}</td>
            <td>${a.Amen_Pay_Date}</td>
            <td>${a.Amen_Pay_Type}</td>
        </tr>`;
    });
}

async function loadMaintenanceDetail() {
    const data = await apiGet("join/maintenance_detail");
    const tbody = document.querySelector("#maintenanceDetail tbody");
    tbody.innerHTML = "";
    data.forEach(m => {
        tbody.innerHTML += `<tr>
            <td>${m.Req_ID}</td>
            <td>${m.Com_Name}</td>
            <td>${m.Address}</td>  <!-- matches updated query -->
            <td>${m.Renter_Name}</td>
            <td>${m.Type}</td>
            <td>${m.Priority}</td>
            <td>${m.Status}</td>
        </tr>`;
    });
}
