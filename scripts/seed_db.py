#!/usr/bin/env python3
import argparse
import csv
import hashlib
import json
import random
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Dict, List, Optional


GRADE_MAP = {
    "Terminale": "Terminale",
    "Premiere": "Premiere",
    "Première": "Premiere",
    "Post-bac": "Post-bac",
    "Other": "Other",
}

REGIONS = [
    "Ile-de-France",
    "Auvergne-Rhone-Alpes",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Hauts-de-France",
    "Provence-Alpes-Cote d'Azur",
    "Grand Est",
    "Bretagne",
    "Pays de la Loire",
    "Normandie",
]

FIRST_NAMES = [
    "Camille",
    "Lucas",
    "Lea",
    "Hugo",
    "Ines",
    "Nathan",
    "Sarah",
    "Noah",
    "Chloe",
    "Yanis",
    "Emma",
    "Louis",
]

LAST_NAMES = [
    "Martin",
    "Bernard",
    "Dubois",
    "Thomas",
    "Robert",
    "Petit",
    "Durand",
    "Leroy",
    "Moreau",
    "Simon",
    "Laurent",
    "Lefebvre",
]

FIELDS_OF_INTEREST = [
    "Engineering",
    "Business",
    "Computer Science",
    "Health",
    "Design",
    "Law",
    "International Relations",
    "Data",
    "Hospitality",
    "Media",
]

PROGRAMMES = [
    "BSc Data Science",
    "Bachelor Business",
    "BTS Informatique",
    "Licence Droit",
    "Bachelor Design",
    "Mastere Marketing",
    "Licence Psychologie",
    "BUT Genie Civil",
]

BAC_TRACKS = ["General", "Technological", "Professional", "International"]
GENDERS = ["female", "male", "non_binary", "prefer_not_to_say"]


@dataclass
class RawStudent:
    row_id: int
    audience_type: str
    grade: str
    student_subgroup: str
    visited_site: int
    used_ori: int
    took_test: int
    digital_experience: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed local SQLite database with qualification model demo data.")
    parser.add_argument("--db", default="backend/app/db/local.db", help="Path to SQLite database file")
    parser.add_argument("--csv", default="data/students_base.csv", help="Path to 600-student source CSV")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed")
    parser.add_argument("--fair-code", default="LTF2026", help="Fair code")
    parser.add_argument("--fair-name", default="L'Etudiant Qualification Fair 2026", help="Fair name")
    parser.add_argument("--reset", action="store_true", help="Delete seeded data before reseeding")
    parser.add_argument(
        "--migrations-dir",
        default="backend/app/db/migrations",
        help="Directory containing SQL migration files",
    )
    parser.add_argument(
        "--recompute-sql",
        default="scripts/recompute_scores.sql",
        help="SQL file to recompute derived features and scores",
    )
    return parser.parse_args()


def read_csv(csv_path: Path) -> List[RawStudent]:
    rows: List[RawStudent] = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {
            "row_id",
            "audience_type",
            "grade",
            "student_subgroup",
            "visited_site",
            "used_ORI",
            "took_test",
            "digital_experience",
        }
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV missing required columns: {sorted(missing)}")

        for r in reader:
            grade_raw = (r["grade"] or "Other").strip()
            rows.append(
                RawStudent(
                    row_id=int(r["row_id"]),
                    audience_type=(r["audience_type"] or "student").strip(),
                    grade=GRADE_MAP.get(grade_raw, "Other"),
                    student_subgroup=(r["student_subgroup"] or "non_school_group").strip(),
                    visited_site=int(r["visited_site"]),
                    used_ori=int(r["used_ORI"]),
                    took_test=int(r["took_test"]),
                    digital_experience=(r["digital_experience"] or "no").strip().lower(),
                )
            )
    return rows


def run_sql_file(conn: sqlite3.Connection, sql_path: Path) -> None:
    conn.executescript(sql_path.read_text(encoding="utf-8"))


def apply_migrations(conn: sqlite3.Connection, migrations_dir: Path) -> None:
    sql_files = sorted(migrations_dir.glob("*.sql"))
    for sql_file in sql_files:
        run_sql_file(conn, sql_file)


def reset_seed_data(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;
        DELETE FROM kpi_daily;
        DELETE FROM monetization;
        DELETE FROM lead_scores;
        DELETE FROM derived_features;
        DELETE FROM events;
        DELETE FROM pre_fair_signals;
        DELETE FROM student_consents;
        DELETE FROM student_profiles;
        DELETE FROM students;
        DELETE FROM source_students;
        DELETE FROM stands;
        DELETE FROM conferences;
        DELETE FROM fairs;
        """
    )


def pseudonymize(value: str, salt: str) -> str:
    h = hashlib.sha256(f"{salt}:{value}".encode("utf-8")).hexdigest()
    return h[:24]


def pick_date_in_range(rng: random.Random, start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=rng.randint(0, max(delta, 0)))


def random_timestamp(rng: random.Random, d: date) -> str:
    t = time(hour=rng.randint(8, 20), minute=rng.randint(0, 59), second=rng.randint(0, 59))
    return datetime.combine(d, t).strftime("%Y-%m-%d %H:%M:%S")


def maybe(rng: random.Random, probability: float) -> bool:
    return rng.random() < probability


def insert_reference_data(conn: sqlite3.Connection, fair_id: int, rng: random.Random, starts_on: date) -> Dict[str, List[int]]:
    stand_categories = ["Engineering", "Business", "Health", "Design", "Digital", "International"]
    stand_ids: List[int] = []
    for i in range(1, 25):
        stand_code = f"ST-{i:03d}"
        exhibitor_name = f"Exhibitor {i:02d}"
        category = stand_categories[(i - 1) % len(stand_categories)]
        cur = conn.execute(
            """
            INSERT INTO stands (fair_id, stand_code, exhibitor_name, stand_category)
            VALUES (?, ?, ?, ?)
            """,
            (fair_id, stand_code, exhibitor_name, category),
        )
        stand_ids.append(cur.lastrowid)

    conference_ids: List[int] = []
    topics = ["Orientation", "Scholarships", "Careers", "Admissions", "AI", "International Studies"]
    for i in range(1, 13):
        conf_code = f"CF-{i:03d}"
        topic = topics[(i - 1) % len(topics)]
        scheduled = datetime.combine(starts_on + timedelta(days=(i - 1) % 2), time(9 + (i % 8), 0))
        cur = conn.execute(
            """
            INSERT INTO conferences (fair_id, conference_code, conference_title, topic, speaker_name, scheduled_at, duration_min)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                fair_id,
                conf_code,
                f"{topic} Session {i}",
                topic,
                f"Speaker {i:02d}",
                scheduled.strftime("%Y-%m-%d %H:%M:%S"),
                45,
            ),
        )
        conference_ids.append(cur.lastrowid)

    return {"stands": stand_ids, "conferences": conference_ids}


def generate_profile(rng: random.Random, row: RawStudent, row_id: int) -> Dict[str, Optional[str]]:
    first = rng.choice(FIRST_NAMES)
    last = rng.choice(LAST_NAMES)
    full_name = f"{first} {last}"
    email = f"student{row_id:04d}@demo-letudiant.fr"

    dob: Optional[date] = None
    if maybe(rng, 0.95):
        min_age, max_age = (17, 19) if row.grade in {"Terminale", "Premiere"} else (18, 25)
        age = rng.randint(min_age, max_age)
        year = datetime.now().year - age
        dob = date(year, rng.randint(1, 12), rng.randint(1, 28))

    phone = None
    if maybe(rng, 0.70):
        phone = f"+336{rng.randint(10000000, 99999999)}"

    region = rng.choice(REGIONS) if maybe(rng, 0.60) else None
    gender = rng.choice(GENDERS) if maybe(rng, 0.90) else None
    bac_track = rng.choice(BAC_TRACKS) if maybe(rng, 0.85) else None

    fields = None
    if maybe(rng, 0.80):
        n = rng.randint(1, 3)
        fields = rng.sample(FIELDS_OF_INTEREST, k=n)

    programme = rng.choice(PROGRAMMES) if maybe(rng, 0.60) else None

    study_level = {
        "Premiere": "High School - Premiere",
        "Terminale": "High School - Terminale",
        "Post-bac": "Higher Education",
        "Other": "Other",
    }.get(row.grade, "Other")

    age_years = None
    if dob is not None:
        today = date.today()
        age_years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    fields_count = len(fields) if fields else 0
    profile_rich = int(fields_count >= 2 and programme is not None and phone is not None and region is not None)

    return {
        "full_name": full_name,
        "email": email,
        "dob": dob.isoformat() if dob else None,
        "age_years": age_years,
        "phone": phone,
        "region": region,
        "gender": gender,
        "study_level": study_level,
        "bac_track": bac_track,
        "fields_csv": ",".join(fields) if fields else None,
        "fields_count": fields_count,
        "programme": programme,
        "profile_rich": profile_rich,
        "email_hash": pseudonymize(email, "email"),
    }


def generate_consents(rng: random.Random) -> Dict[str, int]:
    return {
        "newsletter": 1 if maybe(rng, 0.86) else 0,
        "partners": 1 if maybe(rng, 0.58) else 0,
        "call": 1 if maybe(rng, 0.43) else 0,
    }


def generate_prefair_signals(rng: random.Random, used_ori: int) -> Dict[str, Optional[float]]:
    wax = max(0.0, min(100.0, rng.gauss(52, 18)))

    ori = None
    if used_ori == 1:
        ori = round(max(25.0, min(98.0, rng.gauss(66, 16))), 2)

    active = maybe(rng, 0.18)
    opens = rng.randint(1, 6) if active else 0
    clicks = rng.randint(1, min(3, opens)) if active and opens > 0 and maybe(rng, 0.70) else 0

    return {
        "wax": round(wax, 2),
        "ori": ori,
        "opens": opens,
        "clicks": clicks,
    }


def create_event(
    conn: sqlite3.Connection,
    fair_id: int,
    student_id: int,
    event_type: str,
    event_time: str,
    stand_id: Optional[int] = None,
    conference_id: Optional[int] = None,
    source_channel: Optional[str] = None,
    payload: Optional[dict] = None,
) -> None:
    conn.execute(
        """
        INSERT INTO events (fair_id, student_id, stand_id, conference_id, event_type, event_time, source_channel, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            fair_id,
            student_id,
            stand_id,
            conference_id,
            event_type,
            event_time,
            source_channel,
            json.dumps(payload) if payload is not None else None,
        ),
    )


def seed(args: argparse.Namespace) -> None:
    root = Path(__file__).resolve().parents[1]
    db_path = (root / args.db).resolve()
    csv_path = (root / args.csv).resolve()
    migrations_dir = (root / args.migrations_dir).resolve()
    recompute_sql = (root / args.recompute_sql).resolve()

    db_path.parent.mkdir(parents=True, exist_ok=True)

    rng = random.Random(args.seed)
    rows = read_csv(csv_path)

    fair_start = date(2026, 10, 10)
    fair_end = date(2026, 10, 12)

    eligible_fast = [r.row_id for r in rows if r.student_subgroup == "school_group" and r.visited_site == 0]
    target_fast_count = round(0.20 * len(eligible_fast))
    fast_converted_ids = set(rng.sample(eligible_fast, k=target_fast_count)) if eligible_fast else set()

    with sqlite3.connect(str(db_path)) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")

        apply_migrations(conn, migrations_dir)

        if args.reset:
            reset_seed_data(conn)

        cur = conn.execute(
            """
            INSERT INTO fairs (fair_code, fair_name, starts_on, ends_on, location_city)
            VALUES (?, ?, ?, ?, ?)
            """,
            (args.fair_code, args.fair_name, fair_start.isoformat(), fair_end.isoformat(), "Paris"),
        )
        fair_id = cur.lastrowid

        ref_ids = insert_reference_data(conn, fair_id, rng, fair_start)
        stand_ids = ref_ids["stands"]
        conference_ids = ref_ids["conferences"]

        for row in rows:
            conn.execute(
                """
                INSERT INTO source_students (
                  fair_id, row_id, audience_type, grade, student_subgroup,
                  visited_site, used_ori, took_test, digital_experience
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    fair_id,
                    row.row_id,
                    row.audience_type,
                    row.grade,
                    row.student_subgroup,
                    row.visited_site,
                    row.used_ori,
                    row.took_test,
                    row.digital_experience,
                ),
            )

            if row.visited_site == 1:
                is_registered = 1
                registration_channel = "standard"
            elif row.row_id in fast_converted_ids:
                is_registered = 1
                registration_channel = "fast"
            else:
                is_registered = 0
                registration_channel = "none"

            repeat_visitor = 1 if maybe(rng, 0.30 if row.visited_site == 1 else 0.12) else 0

            pseudonymized_id = pseudonymize(f"{fair_id}:{row.row_id}", "student")
            cur_student = conn.execute(
                """
                INSERT INTO students (
                  fair_id, source_row_id, audience_type, grade, student_subgroup,
                  visited_site, used_ori, took_test, digital_experience,
                  is_registered, registration_channel, repeat_visitor, pseudonymized_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    fair_id,
                    row.row_id,
                    row.audience_type,
                    row.grade,
                    row.student_subgroup,
                    row.visited_site,
                    row.used_ori,
                    row.took_test,
                    row.digital_experience,
                    is_registered,
                    registration_channel,
                    repeat_visitor,
                    pseudonymized_id,
                ),
            )
            student_id = cur_student.lastrowid

            if is_registered == 1:
                profile = generate_profile(rng, row, row.row_id)
                consents = generate_consents(rng)
                prefair = generate_prefair_signals(rng, row.used_ori)

                conn.execute(
                    """
                    INSERT INTO student_profiles (
                      fair_id, student_id, full_name, email, date_of_birth, age_years,
                      phone, postal_region, gender, current_study_level, bac_track_type,
                      fields_of_interest_csv, fields_interest_count, programme_of_interest,
                      profile_rich, pseudonymized_email_hash
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        fair_id,
                        student_id,
                        profile["full_name"],
                        profile["email"],
                        profile["dob"],
                        profile["age_years"],
                        profile["phone"],
                        profile["region"],
                        profile["gender"],
                        profile["study_level"],
                        profile["bac_track"],
                        profile["fields_csv"],
                        profile["fields_count"],
                        profile["programme"],
                        profile["profile_rich"],
                        profile["email_hash"],
                    ),
                )

                conn.execute(
                    """
                    INSERT INTO student_consents (
                      fair_id, student_id, consent_newsletter, consent_partners, consent_call
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        fair_id,
                        student_id,
                        consents["newsletter"],
                        consents["partners"],
                        consents["call"],
                    ),
                )

                conn.execute(
                    """
                    INSERT INTO pre_fair_signals (
                      fair_id, student_id, wax_engagement_score, ori_test_score,
                      pre_fair_email_opens, pre_fair_email_clicks
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        fair_id,
                        student_id,
                        prefair["wax"],
                        prefair["ori"],
                        prefair["opens"],
                        prefair["clicks"],
                    ),
                )

                before_start = fair_start - timedelta(days=30)
                if row.visited_site == 1:
                    for _ in range(rng.randint(1, 3)):
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "site_page_view",
                            random_timestamp(rng, pick_date_in_range(rng, before_start, fair_start - timedelta(days=1))),
                            source_channel="web",
                            payload={"phase": "before", "page": "landing"},
                        )

                if row.took_test == 1:
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "quiz_response",
                        random_timestamp(rng, pick_date_in_range(rng, before_start, fair_start - timedelta(days=1))),
                        source_channel="web",
                        payload={"phase": "before", "score_bucket": "mid"},
                    )

                if registration_channel == "fast":
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "fast_registration",
                        random_timestamp(rng, fair_start - timedelta(days=rng.randint(0, 7))),
                        source_channel="onsite_kiosk",
                        payload={"campaign": "school_group_fast_lane"},
                    )

                checked_in = maybe(rng, 0.78 if registration_channel == "fast" else 0.70)
                if checked_in:
                    check_in_day = pick_date_in_range(rng, fair_start, fair_end)
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "check_in",
                        random_timestamp(rng, check_in_day),
                        source_channel="onsite_qr",
                    )

                    stand_taps = min(10, int(abs(rng.gauss(3.8, 2.5))))
                    if stand_taps > 0:
                        for _ in range(stand_taps):
                            sid = rng.choice(stand_ids)
                            t = random_timestamp(rng, pick_date_in_range(rng, fair_start, fair_end))
                            create_event(
                                conn,
                                fair_id,
                                student_id,
                                "stand_tap",
                                t,
                                stand_id=sid,
                                source_channel="nfc",
                            )
                            if maybe(rng, 0.35):
                                create_event(
                                    conn,
                                    fair_id,
                                    student_id,
                                    "brochure_request",
                                    t,
                                    stand_id=sid,
                                    source_channel="kiosk",
                                )

                    conference_scans = min(3, int(abs(rng.gauss(1.0, 1.0))))
                    for _ in range(conference_scans):
                        cid = rng.choice(conference_ids)
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "conference_scan",
                            random_timestamp(rng, pick_date_in_range(rng, fair_start, fair_end)),
                            conference_id=cid,
                            source_channel="badge_scan",
                        )

                    exhibitor_scans = min(3, int(abs(rng.gauss(0.8, 1.0))))
                    for _ in range(exhibitor_scans):
                        sid = rng.choice(stand_ids)
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "exhibitor_scan",
                            random_timestamp(rng, pick_date_in_range(rng, fair_start, fair_end)),
                            stand_id=sid,
                            source_channel="badge_scan",
                        )

                    if maybe(rng, 0.65):
                        clarity = max(1, min(5, int(round(rng.gauss(3.4, 1.2)))))
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "exit_survey",
                            random_timestamp(rng, fair_end),
                            source_channel="survey_tablet",
                            payload={"clarity_score": clarity},
                        )

                    progress_steps = rng.randint(0, 4)
                    progress = 0
                    for _ in range(progress_steps):
                        progress = min(100, progress + rng.randint(20, 45))
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "passport_progress",
                            random_timestamp(rng, pick_date_in_range(rng, fair_start, fair_end)),
                            source_channel="mobile_app",
                            payload={"progress": progress, "completed": 1 if progress >= 100 else 0},
                        )

                    if maybe(rng, 0.35 + 0.20 * (1 if consents["call"] == 1 else 0)):
                        create_event(
                            conn,
                            fair_id,
                            student_id,
                            "followup_cta_to_exhibitor",
                            random_timestamp(rng, fair_end + timedelta(days=rng.randint(0, 2))),
                            source_channel="email",
                            payload={"cta": "book_call"},
                        )

                post_days = fair_end + timedelta(days=7)
                opens = rng.randint(0, 4)
                clicks = 0
                if opens > 0:
                    clicks = rng.randint(0, min(3, opens))

                for _ in range(opens):
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "post_fair_email_open",
                        random_timestamp(rng, pick_date_in_range(rng, fair_end + timedelta(days=1), post_days)),
                        source_channel="email",
                    )

                for _ in range(clicks):
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "post_fair_email_click",
                        random_timestamp(rng, pick_date_in_range(rng, fair_end + timedelta(days=1), post_days)),
                        source_channel="email",
                    )

                pageviews_7d = rng.randint(0, 7)
                for _ in range(pageviews_7d):
                    create_event(
                        conn,
                        fair_id,
                        student_id,
                        "site_page_view",
                        random_timestamp(rng, pick_date_in_range(rng, fair_end, post_days)),
                        source_channel="web",
                        payload={"phase": "after", "page": rng.choice(["programme", "exhibitor", "blog"])}
                    )

        run_sql_file(conn, recompute_sql)
        conn.commit()


if __name__ == "__main__":
    seed(parse_args())
