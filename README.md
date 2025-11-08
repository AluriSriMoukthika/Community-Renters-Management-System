# Community Renters Management System

## Project Summary

### 👩‍💻 By Data Duo  
**Sri Moukthika Aluri**  
**Gayathri Gandham**

---

## 🏘️ Application Domain

The chosen application is a **Community Renters Management System**.  
This system is designed for residential communities where all housing units are rental-only. It provides a centralized platform to manage residents, units, maintenance requests, rent payments, amenities, and amenity payments.

The system is useful because community managers need a single solution for handling rentals, payments, facility usage, and issue tracking.

Property management portals exist, but our system is tailored for smaller communities and includes specific features such as:

- **Amenity usage tracking and payments** for facilities like Gym, Pool, Gaming Café, and Clubhouse.  
- **Conflict alerts** to prevent duplicate clubhouse or amenity usage.  
- **Rental and maintenance transparency** by linking requests and payments to specific residents and units.

Synthetic but realistic data will be used to populate the system — e.g., sample residents, unit addresses, rental agreements, amenity payments, and maintenance logs.

---

## ⚙️ Functionality

### Basic Functions
The system supports the following core operations:

- **Insert Records**: Add new residents, units, rent payments, amenity payments, maintenance requests, and amenities.  
- **Search and List**: Retrieve all residents, list units and their occupancy, filter maintenance requests by type, priority, or status.  
- **Queries:**
  - Join query: Retrieve all maintenance requests along with the unit and renter details.  
  - Aggregate query: Calculate total rent collected per month or count residents using a specific amenity.  
- **Update Records**: Update the status of maintenance requests or edit payment details.  
- **Delete Records**: Remove cancelled amenity payments, expired renter information, or outdated maintenance requests.

### Advanced Functions

1. **Conflict Detection and Alerts for Amenities**
   - The system automatically checks if the clubhouse has already been booked or paid for on a particular date/time.
   - It limits membership based on capacity for Gym, Pool, and Café.

2. **Maintenance Prioritization**
   - Requests are ranked by urgency (e.g., water leakage = high priority, painting = low priority).

3. **Amenity Payment Tracking**
   - Tracks amenity payments by linking renters with amenities.
   - Supports queries like “Which resident paid for the gym in September?” or “Which amenity generates the most revenue?”

---

## 🧩 ER Diagram

### Entities
- **Community** (Com_ID, Com_Name, Address, Contact)  
- **Units** (Unit_ID, Com_ID, Unit_Address, Mail_box_Num, Occupancy, Rent)  
- **Renter** (Renter_ID, Unit_ID, Name, Phone, Email, SSN, StartDate, EndDate, Amenity_ID)  
- **Dependents** (Renter_ID, Dept_SSN, Dept_Name, Dept_Phone, Dept_Email) → *(Weak Entity)*  
- **Rent_Payment** (Re_Pay_ID, Unit_ID, Renter_ID, Rent_Amount, Date, Payment_Type) → *(Weak Entity)*  
- **Maintenance_Request** (Req_ID, Unit_ID, Renter_ID, Type, Priority, Status) → *(Weak Entity)*  
- **Amenities** (Amenity_ID, Ame_Name, Com_ID)

#### Subclasses:
- Gym (Amenity_ID, Trainer, Gym_Fee, Unit_ID, Renter_ID)  
- Pool (Amenity_ID, Instructor, Pool_Fee, Unit_ID, Renter_ID)  
- Gaming_Cafe (Amenity_ID, Café_Fee, Unit_ID, Renter_ID)  
- Clubhouse (Amenity_ID, Renter_ID, Unit_ID, Booking_Date, TimeSlot, Duration, Fee_perHour, Booking_Fee)

- **Amenity_Payment** (Amenity_Pay_ID, Renter_ID, Amenity_ID, Amount, Amen_Pay_Date, Amen_Pay_Type) → *(Weak Entity)*

### Relationships
- A **Community** has **Units** (1-to-many).  
- A **Unit** is rented by a **Renter** (1-to-many).  
- **Dependents** depend on **Renters** (many-to-1).  
- A **Renter** makes **Rent_Payments** (1-to-many).  
- A **Renter** makes **Maintenance_Requests** (1-to-many).  
- A **Community** offers **Amenities** (1-to-many).  
- A **Renter** makes **Amenity_Payments** (many-to-many via Amenity_Payment).  
- **Renter** uses **Gym, Pool, Gaming Café, Clubhouse** (1-to-1 each).

---

## 📘 Assumptions

- The community is rental-only — units have no owners.  
- Each unit belongs to exactly one community.  
- A renter can only be linked to one active unit at a time.  
- Each maintenance request is tied to one renter and one unit.  
- Each rent payment corresponds to one unit and one renter.  
- Amenities are offered by the community and renters may pay to use them.  
- Amenity_Payment resolves the many-to-many relationship between renters and amenities.  
- One renter can have at most one membership/usage record for each amenity type at a time.

---

## ⚠️ Constraints

- The dependent count for each renter cannot exceed **4**.  
- **Gym** and **Pool** are free for all residents, but trainer/instructor options are optional (Boolean type).  
- **Membership counts** for Gym, Pool, and Gaming Café are limited.  
- **Rent** is calculated monthly and **Clubhouse booking** is charged hourly.
