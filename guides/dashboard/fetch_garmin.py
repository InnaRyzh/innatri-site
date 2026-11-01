"""Забирает год данных из Garmin Connect по личному ключу и складывает в data/.

Ключ читается из ~/.config/innatri/garmin.env (строка GARMIN_API_KEY=...).
Ничего не отправляет никуда, кроме Garmin. Запуск:
    .venv/bin/python fetch_garmin.py [--months 12]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

from garmin_personal_api import GarminPersonalApiClient, PersonalApiAuthenticator

KEY_FILE = Path.home() / ".config" / "innatri" / "garmin.env"
DATA = Path(__file__).parent / "data"


def read_key() -> str:
    env = os.environ.get("GARMIN_API_KEY") or os.environ.get("GARMIN_PERSONAL_API_KEY")
    if env:
        return env.strip()
    if not KEY_FILE.exists():
        sys.exit(f"Нет файла с ключом: {KEY_FILE}")
    for line in KEY_FILE.read_text().splitlines():
        if line.startswith("GARMIN_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("В файле нет строки GARMIN_API_KEY=...")


def save(name: str, payload) -> None:
    DATA.mkdir(exist_ok=True)
    (DATA / name).write_text(json.dumps(payload, ensure_ascii=False, indent=1))
    size = (DATA / name).stat().st_size
    print(f"  {name}: {size/1024:.0f} КБ")


def fetch_activities(client: GarminPersonalApiClient, start: date, end: date) -> list:
    """Garmin режет ответы больше ~256 КБ ошибкой 500, поэтому страницы маленькие."""
    out: list = []
    page = 0
    limit = 20
    while True:
        try:
            batch = client.search_activities(
                start=page * limit, limit=limit, start_date=start, end_date=end
            )
        except Exception as e:  # noqa: BLE001
            if "429" in str(e) or "50" in str(e):
                time.sleep(3)
                continue
            raise
        if not batch:
            break
        out.extend(batch)
        print(f"  тренировки: {len(out)}", end="\r")
        if len(batch) < limit:
            break
        page += 1
        time.sleep(0.3)
    print()
    return out


def fetch_by_month(fn, start: date, end: date, label: str, days: int = 27) -> list:
    """Эндпоинты ограничивают диапазон и размер ответа: идём кусками, при 500 делим кусок пополам."""
    out: list = []
    cur = start
    while cur <= end:
        nxt = min(cur + timedelta(days=days), end)
        try:
            chunk = fn(cur, nxt)
            if isinstance(chunk, list):
                out.extend(chunk)
            elif chunk:
                out.append(chunk)
        except Exception as e:  # noqa: BLE001
            if days > 6 and ("500" in str(e) or "502" in str(e) or "503" in str(e)):
                out.extend(fetch_by_month(fn, cur, nxt, label, days // 2))
            else:
                print(f"  {label} {cur}..{nxt}: {e}")
        cur = nxt + timedelta(days=1)
        time.sleep(0.2)
    return out


def main() -> None:
    global DATA
    ap = argparse.ArgumentParser()
    ap.add_argument("--months", type=int, default=12)
    ap.add_argument("--from", dest="date_from", help="начало периода, ГГГГ-ММ-ДД (вместо --months)")
    ap.add_argument("--to", dest="date_to", help="конец периода, ГГГГ-ММ-ДД")
    ap.add_argument("--data", default=str(DATA), help="куда складывать json")
    args = ap.parse_args()

    DATA = Path(args.data)
    end = date.fromisoformat(args.date_to) if args.date_to else date.today()
    start = date.fromisoformat(args.date_from) if args.date_from else end - timedelta(days=round(30.44 * args.months))
    key = read_key()

    with PersonalApiAuthenticator() as auth:
        token = auth.obtain_token(key)
    print("Токен получен")

    with GarminPersonalApiClient(token.access_token) as client:
        try:
            save("profile.json", client.get_user_profile_settings())
        except Exception as e:  # noqa: BLE001
            print("  профиль:", e)
        try:
            save("hr_zones.json", client.get_heart_rate_zones())
        except Exception as e:  # noqa: BLE001
            print("  зоны пульса:", e)

        acts = fetch_activities(client, start, end)
        save("activities.json", acts)

        sleep = fetch_by_month(client.get_daily_sleep_summaries, start, end, "сон")
        save("sleep.json", sleep)

        hrv = fetch_by_month(client.get_daily_hrv_summaries, start, end, "HRV")
        save("hrv.json", hrv)

        daily = fetch_by_month(client.get_daily_summaries, start, end, "дни")
        save("daily.json", daily)

    print(f"Готово: {len(acts)} тренировок с {start} по {end}.")


if __name__ == "__main__":
    main()
