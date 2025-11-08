#Community Renters Management System#
Project Summary 
-	by Data Duo
Sri Moukthika Aluri
Gayathri Gandham________________________________________
Application Domain
The chosen application is a Community Renters Management System. This system is designed for residential communities where all housing units are rental-only. It provides a centralized platform to manage residents, units, maintenance requests, rent payments, amenities, and amenity payments.
The system is useful because community managers need a single solution for handling rentals, payments, facility usage, and issue tracking. Property management portals exist, but our system is tailored for smaller communities and includes specific features such as:
•	Amenity usage tracking and payments for facilities like Gym, Pool, Gaming Café and clubhouse.
•	Conflict alerts to prevent duplicate clubhouse or amenity usage.
•	Rental and maintenance transparency by linking requests and payments to specific residents and units.
Synthetic but realistic data will be used to populate the system — e.g., sample residents, unit addresses, rental agreements, amenity payments, and maintenance logs.
________________________________________
Functionality
Basic Functions
The system supports the following core operations:
1.	Insert Records: Add new residents, units, rent payments, amenity payments, maintenance requests, and amenities.
2.	Search and List: Retrieve all residents in a community, list all units and their occupancy status, and filter maintenance requests by type, priority, or status.
3.	Queries:
o	Join query: Retrieve all maintenance requests along with the unit and renter details.
o	Aggregate query: Calculate the total rent collected in a month or count how many residents use a specific amenity (e.g., pool).
4.	Update Records: Update the status of maintenance requests or edit payment details.
5.	Delete Records: Remove cancelled amenity payments, expired renter information, or outdated maintenance requests.
Advanced Functions
The application will include at least two technically challenging and creative functions:
1.	Conflict Detection and Alerts for Amenities:
o	The system automatically checks if the club house has already been booked or paid for on a particular date and time. If so, it generates an alert and prevents the conflict. It also limits the number of people that can take membership in gym, pool and café based on the capacity.
2.	Maintenance Prioritization:
o	Requests are ranked by urgency (e.g., water leakage = high priority, painting = low priority). This helps administrators handle critical problems first.
3.	Amenity Payment Tracking:
o	Tracks amenity payments by linking renters with amenities. This allows queries like “Which resident paid for the gym in September?” or “Which amenity generates the most revenue?”
________________________________________
ER Diagram
The ER model for the system includes the following entities and relationships
Entities:
•	Community (Com_ID, Com_Name, Address, Contact)
•	Units (Unit_ID, Com_ID, Unit_Address, Mail_box_Num, Occupancy, Rent)
•	Renter (Renter_ID, Unit_ID, Name, Phone, Email, SSN, StartDate, EndDate, Amenity_ID)
•	Dependents (Renter_ID, Dept_SSN, Dept_Name, Dept_Phone, Dept_Email) -> (Weak Entity)
•	Rent_Payment (Re_Pay_ID, Unit_ID, Renter_ID, Rent_Amount, Date, Payment_Type) -> (Weak Entity)
•	Maintenance_Request (Req_ID, Unit_ID, Renter_ID, Type, Priority, Status) -> (Weak Entity)
•	Amenities (Amenity_ID, Ame_Name, Com_ID)
              Subclasses: 
o	Gym (Amenity_ID , Trainer, Gym_Fee, Unit_ID, Renter_ID)
o	Pool (Amenity_ID, Instructor, Pool_Fee, Unit_ID, Renter_ID)
o	Gaming_Cafe (Amenity_ID, Café_Fee, Unit_ID, Renter_ID)
o	Clubhouse (Amenity_ID, Renter_ID, Unit_ID, Booking_Date, TimeSlot, Duration, Fee_perHour, Booking_Fee)
•	Amenity_Payment (Amenity_Pay_ID, Renter_ID, Amenity_ID, Amount, Amen_Pay_Date, Amen_Pay_Type) -> (Weak Entity)
Relationships:
•	A Community has Units (1-to-many).
•	A Unit is rented by a Renter (1-to-many).
•	Dependents depend on Renters (many-to-1).
•	A Renter makes Rent_Payments (1-to-many).
•	A Renter makes Maintenance_Requests (1-to-many).
•	A Community offers Amenities (1-to-many).
•	A Renter makes Amenity_Payments for Amenities (many-to-many via Amenity_Payment).
•	Renter uses Gym (1-to-1).
•	Renter uses Pool (1-to-1).
•	Renter uses Gaming Café (1-to-1).
•	Renter books clubhouse (1-to-1).

________________________________________
Assumptions
1.	The community is rental-only — units have no owners.
2.	Each unit belongs to exactly one community.
3.	A renter can only be linked to one active unit at a time, but history can be tracked by dates.
4.	Each maintenance request is tied to one renter and one unit.
5.	Each rent payment corresponds to one unit and one renter.
6.	Amenities are offered by the community and renters may pay to use them; each amenity may have specific attributes depending on type (Gym, Pool, Gaming Café, Clubhouse).
7.	Amenity_Payment resolves the many-to-many relationship between renters and amenities.
8.	Additionally, 1-to-1 constraints exist between Renter ↔ Gym, Renter ↔ Pool, Renter ↔ Gaming Café and Renter ↔ Clubhouse (i.e., one renter can have at most one membership/usage record for each type of amenity at a time).
Constraints
1.	The dependent count in the renter table cannot be more than 4.
2.	Gym and Pool are free for all residents but the Gym or Pool fee will be considered only if the renter chooses to have a trainer or instructor or both. So, the datatype of the Trainer and instructor will be Boolean.
3.	The membership count for Gym, Pool and Gaming Cafe will be limited.
4.	Rent is calculated monthly and clubhouse booking fee is per hour.
