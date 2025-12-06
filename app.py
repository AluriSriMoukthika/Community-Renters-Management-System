from flask import Flask, request, jsonify, abort, render_template
from sqlalchemy import create_engine, select, func, and_, or_, text
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import re
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from flask import make_response, json
from sqlalchemy import event
import sqlite3
from sqlalchemy import text

DB_PATH = "sqlite:///CR.db"

def make_error(message):
    return jsonify({"error": message}), 400

def get_db_connection():
    conn = sqlite3.connect("CR.db")   # <-- Put your DB name
    conn.row_factory = sqlite3.Row
    return conn

app = Flask(__name__)
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})

# Enable foreign keys on SQLite
# -----------------------------
@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):  # ensure it's SQLite
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


Base = automap_base()
Base.prepare(engine, reflect=True)

# reflected tables
Community = getattr(Base.classes, "Community", None)
Units = getattr(Base.classes, "Units", None)
Renter = getattr(Base.classes, "Renter", None)
Dependents = getattr(Base.classes, "Dependents", None)
Amenities = getattr(Base.classes, "Amenities", None)
Amenity_Payment = getattr(Base.classes, "Amenity_Payment", None)
Gym = getattr(Base.classes, "Gym", None)
Pool = getattr(Base.classes, "Pool", None)
Gaming_Cafe = getattr(Base.classes, "Gaming_Cafe", None)
Clubhouse = getattr(Base.classes, "Clubhouse", None)
Rent_Payment = getattr(Base.classes, "Rent_Payment", None)
Maintenance_Request = getattr(Base.classes, "Maintenance_Request", None)

@event.listens_for(Units, "before_insert")
def check_unit_id(mapper, connection, target):
    if target.Unit_ID is None:
        raise ValueError("Unit_ID is required")

@event.listens_for(Renter, "before_insert")
def check_renter_id(mapper, connection, target):
    if target.Renter_ID is None:
        raise ValueError("Renter_ID is required")

@event.listens_for(Community, "before_insert")
def check_community_id(mapper, connection, target):
    if getattr(target, "Com_ID", None) is None:
        raise ValueError("Com_ID is required")

# ---------------------------------------------------
# Utility helpers
# ---------------------------------------------------

def row_to_dict(row):
    if not row:
        return None
    return {c.key: getattr(row, c.key) for c in row.__table__.columns}

def parse_date(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except:
        try:
            return datetime.strptime(s, "%Y-%m-%d")
        except:
            return None

# ---------------------------------------------------
# FRONTEND ROUTES  (HTML PAGES)
# ---------------------------------------------------

@app.route("/")
def home_page():
    return render_template("index.html")

@app.route("/renters")
def renters_page():
    return render_template("renters.html")

@app.route("/dependents")
def dependents_page():
    return render_template("dependents.html")

@app.route("/communities")
def communities_page():
    return render_template("community.html")

@app.route("/units")
def units_page():
    return render_template("units.html")

@app.route("/amenities")
def amenities_page():
    return render_template("amenities.html")

@app.route("/maintenance")
def maintenance_page():
    return render_template("maintenance.html")

@app.route("/payments")
def payments_page():
    return render_template("payments.html")

@app.route("/clubhouse")
def clubhouse_page():
    return render_template("clubhouse.html")

@app.route("/gym")
def gym_page():
    return render_template("gym.html")

@app.route("/gaming_cafe")
def gaming_cafe_page():
    return render_template("gaming_cafe.html")

# Render Pool page
@app.route("/pool")
def pool_page():
    return render_template("pool.html")

@app.route("/amenity_payment")
def amenity_payment_page():
    return render_template("amenity_payment.html")

@app.route("/rent_payment")
def rent_payment_page():
    return render_template("rent_payment.html")  # create this template


# ---------------------------------------------------
# API ROUTES (PREFIXED WITH /api/)
# ---------------------------------------------------

def handle_sql_error(e):
    msg = str(e)

    if "UNIQUE constraint failed" in msg:
        return make_error("This ID already exists. Please use a different ID.")

    if "FOREIGN KEY constraint failed" in msg:
        return make_error("This record is linked to another table. You must delete related records first.")

    if "NOT NULL constraint failed" in msg:
        return make_error("A required field was left empty. Please fill all mandatory fields.")

    if "CHECK constraint failed" in msg:
        return make_error("One or more values are invalid.")

    if "datatype mismatch" in msg:
        return make_error("You entered text where a number is required.")

    # fallback: safe generic text
    return make_error("Something went wrong. Please check your input.")


# ---------- Maintenance Request ----------
@app.route("/api/maintenance", methods=["GET"])
def api_list_maintenance():
    # Use a raw connection
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT Req_ID, Unit_ID, Renter_ID, Type, Priority, Status FROM Maintenance_Priority_View")
        )
        # Convert result to list of dictionaries
        rows = [dict(row._mapping) for row in result.fetchall()]
        return jsonify(rows)

@app.route("/api/maintenance", methods=["POST"])
def api_create_maintenance():
    payload = request.json
    with Session(engine) as session:
        obj = Maintenance_Request(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)

@app.route("/api/maintenance/<int:req_id>", methods=["PUT"])
def api_update_maintenance(req_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Maintenance_Request, req_id)
        if not obj:
            return jsonify({"error": "Maintenance Request not found"}), 404

        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)

        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


@app.route("/api/maintenance/<int:req_id>", methods=["DELETE"])
def api_delete_maintenance(req_id):
    with Session(engine) as session:
        obj = session.get(Maintenance_Request, req_id)
        if not obj:
            return jsonify({"error": "Maintenance Request not found"}), 404

        session.delete(obj)
        session.commit()
        return jsonify({"deleted": req_id})



# ---------- Community ----------
@app.route("/api/community", methods=["GET"])
def api_list_community():
    with Session(engine) as session:
        rows = session.execute(select(Community)).scalars().all()
        return jsonify([row_to_dict(c) for c in rows])


@app.route("/api/community", methods=["POST"])
def api_create_community():
    payload = request.json

    com_id = payload.get("Com_ID")

    # Proper validation
    if com_id is None or str(com_id).strip() == "" or str(com_id).lower() == "nan":
        return jsonify({"error": "Invalid Community ID"}), 400

    with Session(engine) as session:
        obj = Community(**payload)
        session.add(obj)

        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201

        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)




@app.route("/api/community/<int:com_id>", methods=["PUT"])
def api_update_community(com_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Community, com_id)

        if not obj:
            return jsonify({"error": "Community not found"}), 404

        # Prevent editing primary key
        for k, v in payload.items():
            if k != "Com_ID" and hasattr(obj, k):
                setattr(obj, k, v)

        try:
            session.commit()
            return jsonify(row_to_dict(obj))

        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/community/<int:com_id>", methods=["DELETE"])
def api_delete_community(com_id):
    with Session(engine) as session:
        obj = session.get(Community, com_id)

        if not obj:
            return jsonify({"error": "Community not found"}), 404

        session.delete(obj)
        session.commit()
        return jsonify({"deleted": com_id})



# ---------- Units ----------
@app.route("/api/units", methods=["GET"])
def api_list_units():
    with Session(engine) as session:
        rows = session.execute(select(Units)).scalars().all()
        return jsonify([row_to_dict(u) for u in rows])


@app.route("/api/units", methods=["POST"])
def api_create_unit():
    payload = request.json

    # Validate Unit_ID
    if "Unit_ID" not in payload or payload["Unit_ID"] in [None, ""]:
        return handle_sql_error(e)


    with Session(engine) as session:
        obj = Units(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/units/<int:unit_id>", methods=["PUT"])
def api_update_unit(unit_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Units, unit_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404

        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)

        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/units/<int:unit_id>", methods=["DELETE"])
def api_delete_unit(unit_id):
    with Session(engine) as session:
        obj = session.get(Units, unit_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404

        session.delete(obj)
        session.commit()
        return jsonify({"deleted": unit_id})


# ---------- Renters ----------
@app.route("/api/renters", methods=["GET"])
def api_list_renters():
    with Session(engine) as session:
        rows = session.execute(select(Renter)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# Add Renter
@app.route("/api/renters", methods=["POST"])
def api_create_renter():
    payload = request.json

    # Validate Renter_ID
    if "Renter_ID" not in payload or payload["Renter_ID"] in [None, ""]:
        return handle_sql_error(e)


    with Session(engine) as session:
        obj = Renter(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# Update Renter
@app.route("/api/renters/<int:renter_id>", methods=["PUT"])
def api_update_renter(renter_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Renter, renter_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        session.commit()
        return jsonify(row_to_dict(obj))

# Delete Renter
@app.route("/api/renters/<int:renter_id>", methods=["DELETE"])
def api_delete_renter(renter_id):
    with Session(engine) as session:
        obj = session.get(Renter, renter_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": renter_id})


# ---------- Dependents ----------
@app.route("/api/dependents", methods=["GET"])
def api_list_dependents():
    with Session(engine) as session:
        rows = session.execute(select(Dependents)).scalars().all()
        return jsonify([row_to_dict(d) for d in rows])

@app.route("/api/dependents", methods=["POST"])
def api_create_dependent():
    payload = request.json
    with Session(engine) as session:
        obj = Dependents(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/dependents/<int:renter_id>/<dept_ssn>", methods=["PUT"])
def api_update_dependent(renter_id, dept_ssn):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Dependents, (renter_id, dept_ssn))
        if not obj:
            return jsonify({"error": "Dependent not found"}), 404

        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)

        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


@app.route("/api/dependents/<int:renter_id>/<dept_ssn>", methods=["DELETE"])
def api_delete_dependent(renter_id, dept_ssn):
    with Session(engine) as session:
        obj = session.get(Dependents, (renter_id, dept_ssn))
        if not obj:
            return jsonify({"error": "Dependent not found"}), 404

        session.delete(obj)
        session.commit()
        return jsonify({"deleted": {"Renter_ID": renter_id, "Dept_SSN": dept_ssn}})


# ---------- Amenity Payments ----------
# GET all payments
@app.route("/api/amenity_payment", methods=["GET"])
def api_list_amenity_payment():
    with Session(engine) as session:
        rows = session.execute(select(Amenity_Payment)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST new payment
@app.route("/api/amenity_payment", methods=["POST"])
def api_create_amenity_payment():
    payload = request.json
    with Session(engine) as session:
        obj = Amenity_Payment(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# PUT (update payment)
@app.route("/api/amenity_payment/<int:pay_id>", methods=["PUT"])
def api_update_amenity_payment(pay_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Amenity_Payment, pay_id)
        if not obj:
            return jsonify({"error": "Payment not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# DELETE payment
@app.route("/api/amenity_payment/<int:pay_id>", methods=["DELETE"])
def api_delete_amenity_payment(pay_id):
    with Session(engine) as session:
        obj = session.get(Amenity_Payment, pay_id)
        if not obj:
            return jsonify({"error": "Payment not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": pay_id})


# ---------- Rent Payments ----------
# GET all Rent Payment entries
@app.route("/api/rent_payment", methods=["GET"])
def api_list_rent_payment():
    with Session(engine) as session:
        rows = session.execute(select(Rent_Payment)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST new Rent Payment
@app.route("/api/rent_payment", methods=["POST"])
def api_create_rent_payment():
    payload = request.json
    with Session(engine) as session:
        obj = Rent_Payment(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# PUT (update Rent Payment entry)
@app.route("/api/rent_payment/<int:pay_id>", methods=["PUT"])
def api_update_rent_payment(pay_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Rent_Payment, pay_id)
        if not obj:
            return jsonify({"error": "Rent Payment entry not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# DELETE Rent Payment entry
@app.route("/api/rent_payment/<int:pay_id>", methods=["DELETE"])
def api_delete_rent_payment(pay_id):
    with Session(engine) as session:
        obj = session.get(Rent_Payment, pay_id)
        if not obj:
            return jsonify({"error": "Rent Payment entry not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": pay_id})


# ---------- Amenities ----------
@app.route("/api/amenities", methods=["GET"])
def api_list_amenities():
    with Session(engine) as session:
        rows = session.execute(select(Amenities)).scalars().all()
        return jsonify([row_to_dict(a) for a in rows])


@app.route("/api/amenities", methods=["POST"])
def api_create_amenity():
    payload = request.json
    with Session(engine) as session:
        obj = Amenities(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/amenities/<int:amenity_id>", methods=["PUT"])
def api_update_amenity(amenity_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Amenities, amenity_id)
        if not obj:
            return jsonify({"error": "Amenity not found"}), 404

        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)

        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



@app.route("/api/amenities/<int:amenity_id>", methods=["DELETE"])
def api_delete_amenity(amenity_id):
    with Session(engine) as session:
        obj = session.get(Amenities, amenity_id)
        if not obj:
            return jsonify({"error": "Amenity not found"}), 404

        session.delete(obj)
        session.commit()
        return jsonify({"deleted": amenity_id})


# GET all Gym entries
@app.route("/api/gym", methods=["GET"])
def api_list_gym():
    with Session(engine) as session:
        rows = session.execute(select(Gym)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST new Gym entry
@app.route("/api/gym", methods=["POST"])
def api_create_gym():
    payload = request.json
    with Session(engine) as session:
        obj = Gym(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# PUT (update Gym entry)
@app.route("/api/gym/<int:amenity_id>", methods=["PUT"])
def api_update_gym(amenity_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Gym, amenity_id)
        if not obj:
            return jsonify({"error": "Gym entry not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# DELETE Gym entry
@app.route("/api/gym/<int:amenity_id>", methods=["DELETE"])
def api_delete_gym(amenity_id):
    with Session(engine) as session:
        obj = session.get(Gym, amenity_id)
        if not obj:
            return jsonify({"error": "Gym entry not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": amenity_id})

# GET all clubhouse entries
@app.route("/api/clubhouse", methods=["GET"])
def api_list_clubhouse():
    with Session(engine) as session:
        rows = session.execute(select(Clubhouse)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST create entry
@app.route("/api/clubhouse", methods=["POST"])
def api_create_clubhouse():
    payload = request.json
    with Session(engine) as session:
        obj = Clubhouse(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)

@app.route("/api/clubhouse/<int:id>", methods=["PUT"])
def api_update_clubhouse(id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Clubhouse, id)
        if not obj:
            return jsonify({"error": "Entry not found"}), 404

        # Update editable fields temporarily
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)

        # Parse the new timeslot
        def parse_slot(ts):
            start_str, end_str = ts.split(" - ")
            start = datetime.strptime(start_str.strip(), "%I:%M %p")
            end = datetime.strptime(end_str.strip(), "%I:%M %p")
            return start, end

        new_start, new_end = parse_slot(obj.TimeSlot)

        # Check against ALL other bookings on the same date
        existing = session.query(Clubhouse).filter(
            Clubhouse.Clubhouse_ID != id,
            Clubhouse.Booking1_Date == obj.Booking1_Date
        ).all()

        for e in existing:
            e_start, e_end = parse_slot(e.TimeSlot)
            # Check for overlap
            if not (new_end <= e_start or new_start >= e_end):
                return jsonify({"error": "Time slot conflicts with another booking"}), 400

        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)



# DELETE
@app.route("/api/clubhouse/<int:id>", methods=["DELETE"])
def api_delete_clubhouse(id):
    with Session(engine) as session:
        obj = session.get(Clubhouse, id)
        if not obj:
            return jsonify({"error": "Entry not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": id})


# GET all Gaming Cafe entries
@app.route("/api/gaming_cafe", methods=["GET"])
def api_list_gaming_cafe():
    with Session(engine) as session:
        rows = session.execute(select(Gaming_Cafe)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST new Gaming Cafe entry
@app.route("/api/gaming_cafe", methods=["POST"])
def api_create_gaming_cafe():
    payload = request.json
    with Session(engine) as session:
        obj = Gaming_Cafe(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# PUT (update Gaming Cafe entry)
@app.route("/api/gaming_cafe/<int:amenity_id>", methods=["PUT"])
def api_update_gaming_cafe(amenity_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Gaming_Cafe, amenity_id)
        if not obj:
            return jsonify({"error": "Gaming Cafe entry not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# DELETE Gaming Cafe entry
@app.route("/api/gaming_cafe/<int:amenity_id>", methods=["DELETE"])
def api_delete_gaming_cafe(amenity_id):
    with Session(engine) as session:
        obj = session.get(Gaming_Cafe, amenity_id)
        if not obj:
            return jsonify({"error": "Gaming Cafe entry not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": amenity_id})

# GET all Pool entries
@app.route("/api/pool", methods=["GET"])
def api_list_pool():
    with Session(engine) as session:
        rows = session.execute(select(Pool)).scalars().all()
        return jsonify([row_to_dict(r) for r in rows])

# POST new Pool entry
@app.route("/api/pool", methods=["POST"])
def api_create_pool():
    payload = request.json
    with Session(engine) as session:
        obj = Pool(**payload)
        session.add(obj)
        try:
            session.commit()
            return jsonify(row_to_dict(obj)), 201
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# PUT (update Pool entry)
@app.route("/api/pool/<int:amenity_id>", methods=["PUT"])
def api_update_pool(amenity_id):
    payload = request.json
    with Session(engine) as session:
        obj = session.get(Pool, amenity_id)
        if not obj:
            return jsonify({"error": "Pool entry not found"}), 404
        for k, v in payload.items():
            if hasattr(obj, k):
                setattr(obj, k, v)
        try:
            session.commit()
            return jsonify(row_to_dict(obj))
        except IntegrityError as e:
            session.rollback()
            return handle_sql_error(e)


# DELETE Pool entry
@app.route("/api/pool/<int:amenity_id>", methods=["DELETE"])
def api_delete_pool(amenity_id):
    with Session(engine) as session:
        obj = session.get(Pool, amenity_id)
        if not obj:
            return jsonify({"error": "Pool entry not found"}), 404
        session.delete(obj)
        session.commit()
        return jsonify({"deleted": amenity_id})

# ---------- Aggregate Queries ----------

# Total rent collected per community
@app.route("/api/aggregate/rent_per_community", methods=["GET"])
def api_rent_per_community():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                c.Com_Name,
                SUM(rp.Rent_Amount) AS Total_Rent_Collected
            FROM Community c
            JOIN Units u
                ON c.Com_ID = u.Com_ID
            JOIN Rent_Payment rp
                ON u.Unit_ID = rp.Unit_ID
            GROUP BY c.Com_ID, c.Com_Name
            ORDER BY c.Com_Name;
        """))
        rows = [dict(row._mapping) for row in result.fetchall()]
        return jsonify(rows)


# Count of maintenance requests by priority
@app.route("/api/aggregate/requests_by_priority", methods=["GET"])
def api_requests_by_priority():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                mr.Priority,
                COUNT(*) AS Num_Requests
            FROM Maintenance_Request mr
            GROUP BY mr.Priority
            ORDER BY
                CASE mr.Priority
                    WHEN 'High' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'Low' THEN 3
                    ELSE 4
                END;
        """))
        rows = [dict(row._mapping) for row in result.fetchall()]
        return jsonify(rows)


# ---------- Join Queries ----------

# Amenity payments with renter & amenity details
@app.route("/api/join/amenity_payments", methods=["GET"])
def api_amenity_payments():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                ap.Amenity_Pay_ID,
                r.Name AS Renter_Name,
                a.Ame_Name AS Amenity_Name,
                ap.Amount,
                ap.Amen_Pay_Date,
                ap.Amen_Pay_Type
            FROM Amenity_Payment ap
            JOIN Renter r ON ap.Renter_ID = r.Renter_ID
            JOIN Amenities a ON ap.Amenity_ID = a.Amenity_ID
            ORDER BY ap.Amen_Pay_Date;
        """))
        rows = [dict(row._mapping) for row in result.fetchall()]
        return jsonify(rows)


# Maintenance request details with community, unit, and renter
@app.route("/api/join/maintenance_detail", methods=["GET"])
def api_maintenance_detail():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                mr.Req_ID,
                c.Com_Name,
                u.Unit_Address AS Address,  -- updated to match joinquery.sql
                r.Name AS Renter_Name,
                mr.Type,
                mr.Priority,
                mr.Status
            FROM Maintenance_Request mr
            JOIN Units u ON mr.Unit_ID = u.Unit_ID
            JOIN Community c ON u.Com_ID = c.Com_ID
            JOIN Renter r ON mr.Renter_ID = r.Renter_ID
            ORDER BY mr.Req_ID;
        """))
        rows = [dict(row._mapping) for row in result.fetchall()]
        return jsonify(rows)

@app.route("/amenity_revenue")
def amenity_revenue():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Amenity_Revenue_Summary;")
    rows = cur.fetchall()
    conn.close()

    revenue = [
        {
            "Amenity_ID": r["Amenity_ID"],
            "Amenity_Name": r["Amenity_Name"],
            "Total_Revenue": r["Total_Revenue"],
            "Num_Payments": r["Num_Payments"]
        }
        for r in rows
    ]

    return jsonify(revenue)


# ---------------------------------------------------
# Run
# ---------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
