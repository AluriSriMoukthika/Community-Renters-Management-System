# 🚀 Community Renters Management System

### A Full-Stack Database-Driven Web Application for Residential Communities

---

## 👩‍💻 Built by **Data Duo**

**Sri Moukthika Aluri · Gayathri Gandham**

---

## 📌 Overview

The Community Renters Management System is a full-stack web application built using:

- **Python Flask** (Backend)  
- **SQLite** (Database with triggers, views, constraints)  
- **HTML/CSS/Bootstrap/JavaScript** (Frontend)

It provides community managers with a unified system to manage:

✔ Renters  
✔ Units  
✔ Amenities & Bookings  
✔ Rent payments  
✔ Maintenance requests  
✔ Amenity payments  
✔ Conflict detection & analytics  

The system is designed specifically for rental-only communities and offers features tailored for small-scale management needs.

---

## 🏗️ Features

### 🔹 Basic CRUD Operations

The system supports full Create, Read, Update, and Delete workflows for:

- Communities  
- Units  
- Renters  
- Dependents  
- Rent Payments  
- Amenity Payments  
- Maintenance Requests  
- Amenity Usage (Gym, Pool, Café, Clubhouse)

**Examples:**

- Add renter  
- Update maintenance status  
- Delete a payment  
- View units by community  

---

## 🔥 Advanced Features

### **1️⃣ Clubhouse Booking Conflict Detection**
A **BEFORE INSERT** trigger prevents overlapping bookings for the same date & timeslot.

### **2️⃣ Maintenance Priority Engine**
A SQL view automatically sorts requests:

- High → 1  
- Medium → 2  
- Low → 3  

Displayed in UI in priority order.

### **3️⃣ Amenity Revenue Analytics**
- Aggregates total revenue  
- Displays counts & totals  
- Used for admin dashboards  

### **4️⃣ Amenity Membership Validation**
Triggers prevent payments when a renter has no corresponding amenity membership.

---

## 🧩 System Architecture

Frontend (HTML, CSS, JS, Bootstrap)
↓
Flask Backend (Routing, Validation, Business Logic)
↓
SQLite Database (Triggers, Views, Constraints)


---

## 🛢️ Database Design

### 📌 ERD & Relational Model

Includes:

- **Strong entities:** Community, Units, Renter, Amenities  
- **Weak entities:** Dependents, Rent_Payment, Maintenance_Request, Amenity_Payment  
- **IS-A Hierarchy:** Gym, Pool, Gaming_Cafe, Clubhouse  
- **Many-to-many:** resolved through Amenity_Payment  

### 📎 Highlights

- Fully normalized to **3NF/BCNF**  
- **19+ triggers** enforcing data integrity  
- Multiple SQL views for analytics  
- Lease overlap prevention  
- Amenity name validation  
- Time slot format enforcement for clubhouse booking  

---

## 📂 Project Structure

Community-Renters-Management-System/
│── app.py # Flask backend
│── templates/ # HTML pages
│── static/ # CSS, JS, and images
│── community_renters.db # SQLite database
│── README.md # Documentation
│── /sql # Queries & schema (optional)



---

## 💡 How Advanced Features Work (Technical Details)

### 🔸 Conflict Detection Trigger
Ensures:
- Same date + timeslot → **booking rejected**
- Error message returned to UI

### 🔸 Maintenance Priority View
SQL view creates computed column `Priority_Order`:

- High → 1  
- Medium → 2  
- Low → 3  

### 🔸 Amenity Revenue Summary
Aggregates:
- Total revenue  
- Amenity name  

Displayed in dashboard.

---

## 🧪 Testing & Debugging

### ✔ Tests Performed:
- Database constraint testing  
- Trigger firing tests  
- UI validation  
- Integration (UI → Flask → SQLite)  
- Edge cases (invalid timeslot, invalid amenity name)

### ✔ Debug Challenges Solved:
- Preventing overlapping leases  
- Ensuring triggers do not conflict  
- Handling FK cascades  
- Time format validation  

---

## 🧑‍🤝‍🧑 Team Contributions

### **Gayathri Gandham**
- SQLite database design  
- Triggers, views, constraints  
- Backend Flask logic  
- Data population & debugging  

### **Sri Moukthika Aluri**
- Frontend UI (HTML/CSS/Bootstrap)  
- Web forms  
- JavaScript frontend logic  
- Frontend–backend integration  

### **Both**
- Documentation  
- Presentation  
- Testing  
- Final demo video  

---

## 📚 References

- SQLite Documentation  
- Flask Documentation  
- Bootstrap Docs  
- MDN Web Docs  
- Stack Overflow  
- GeeksforGeeks  
- DB Browser for SQLite  
- GSU CSC 4520/6520 Course Materials  

---

## 🏁 Future Enhancements

- Role-based authentication  
- Resident portal vs Admin portal  
- Email / SMS notifications  
- Cloud deployment (AWS / Render / GCP)  
- Detailed analytics dashboards  
- Migration to PostgreSQL  

---

## 🎉 Final Note

This project demonstrates mastery over:

- Relational schema design  
- Normalization  
- SQL triggers & views  
- Full-stack application development  
- Real-world constraint enforcement  



## 📥 Installation & Setup

```bash
git clone https://github.com/AluriSriMoukthika/Community-Renters-Management-System.git
cd Community-Renters-Management-System

python3 -m venv venv
source venv/bin/activate

pip install flask

python app.py

Open in Browser

http://127.0.0.1:5000/


