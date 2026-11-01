"""Собирает dashboard.html из data/*.json.

Python готовит данные, страница рисует графики сама (SVG + немного JS):
переключатель периода, подсказки при наведении, разбор месяца по клику.
Дизайн: InnaTri book design (бумага, засечки, один глубокий красный).

    .venv/bin/python build_dashboard.py [--easy-ceiling 141] [--deload 0.6]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "data"
OUT = ROOT / "dashboard.html"


def load(name):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--easy-ceiling", type=int, default=int(os.environ.get("INNATRI_EASY_CEILING", 0)) or None,
                    help="верх лёгкого пульса вручную, если зоны в Garmin не настроены")
    ap.add_argument("--deload", type=float, default=float(os.environ.get("INNATRI_DELOAD", 0.6)),
                    help="порог разгрузочной недели как доля от средней за три предыдущие")
    ap.add_argument("--name", default=os.environ.get("INNATRI_NAME", ""))
    args = ap.parse_args()

    acts = load("activities.json") or []
    zones_all = load("hr_zones.json") or []
    zr = next((z for z in zones_all if z.get("sport") == "RUNNING"), None) or (zones_all[0] if zones_all else {})

    # --- граница лёгкого бега и её происхождение --------------------------------
    method = zr.get("trainingMethod", "")
    lthr = zr.get("lactateThresholdHeartRateUsed")
    maxhr = zr.get("maxHeartRateUsed")
    warnings = []
    formula_warn = ("Зоны в часах считаются от максимального пульса. Если максимум не измерен, а взят по формуле "
                    "220 минус возраст, граница лёгкого может быть сдвинута на 5–10 ударов. Проверьте его в настройках Garmin.")
    if args.easy_ceiling:
        ceiling, src = args.easy_ceiling, "задана вручную"
    elif zr.get("zone3Floor"):
        ceiling = zr["zone3Floor"]
        if method == "LACTATE_THRESHOLD":
            src = f"верх 2-й зоны в ваших часах, зоны от порога {lthr}"
        elif method == "HR_RESERVE":
            src = f"верх 2-й зоны в ваших часах, зоны от резерва пульса, максимум {maxhr}"
            warnings.append(formula_warn)
        else:
            src = f"верх 2-й зоны в ваших часах, зоны от максимума {maxhr}"
            warnings.append(formula_warn)
    elif lthr:
        ceiling, src = round(lthr * 0.86), f"86% от порога {lthr}"
    elif maxhr:
        ceiling, src = round(maxhr * 0.79), f"79% от максимума {maxhr}"
        warnings.append("Зоны в Garmin не настроены, граница лёгкого прикинута от максимального пульса.")
    else:
        ceiling, src = 145, "по умолчанию, зоны не найдены"
        warnings.append("Garmin не отдал ни зон, ни порога. Граница лёгкого взята по умолчанию, цифрам по зонам верить нельзя.")

    # --- пробежки ---------------------------------------------------------------
    runs = []
    for a in acts:
        t = (a.get("activityType") or {}).get("typeKey") or ""
        if "running" not in t:
            continue
        spd = a.get("averageSpeed") or 0
        gap = a.get("avgGradeAdjustedSpeed") or spd
        hr = a.get("averageHR")
        indoor = ("treadmill" in t or "indoor" in t)
        runs.append(dict(
            id=a.get("activityId"),
            name=a.get("activityName") or "Бег",
            date=a["startTimeLocal"][:10],
            km=round((a.get("distance") or 0) / 1000, 2),
            dur=round(a.get("duration") or 0),
            hr=hr, hrmax=a.get("maxHR"),
            pace=round(1000 / spd) if spd else None,
            gap=round(1000 / gap) if gap else None,
            # метров на удар сердца: только на улице, где темп настоящий
            mpb=round(gap * 60 / hr, 2) if (gap and hr and not indoor) else None,
            z=[round(a.get(f"hrTimeInZone_{i}") or 0) for i in range(1, 6)],
            load=round(a.get("activityTrainingLoad") or 0),
            te=a.get("aerobicTrainingEffect"),
            label=a.get("trainingEffectLabel"),
            cad=a.get("averageRunningCadenceInStepsPerMinute"),
            elev=a.get("elevationGain"),
            indoor=indoor,
        ))
    runs.sort(key=lambda r: r["date"])

    loads = [dict(date=a["startTimeLocal"][:10], load=round(a.get("activityTrainingLoad") or 0))
             for a in acts if a.get("activityTrainingLoad")]

    rhr = {}
    for chunk in load("daily.json") or []:
        for row in chunk.get("data", []):
            v = (row.get("heartRate") or {}).get("restingValue")
            if v and row.get("calendarDate"):
                rhr[row["calendarDate"]] = v

    hrv = {}
    for chunk in load("hrv.json") or []:
        for s in (chunk or {}).get("hrvSummaries", []):
            if s.get("lastNightAvg") and s.get("calendarDate"):
                hrv[s["calendarDate"]] = s["lastNightAvg"]

    profile = load("profile.json") or {}
    model = dict(
        name=args.name or profile.get("displayName") or "",
        built=dt.date.today().isoformat(),
        ceiling=ceiling, ceiling_src=src, lthr=lthr, maxhr=maxhr, zone_method=method,
        deload=args.deload, warnings=warnings, runs=runs, loads=loads, rhr=rhr, hrv=hrv,
    )

    tpl = (ROOT / "template.html").read_text()
    html = tpl.replace("/*__DATA__*/null", json.dumps(model, ensure_ascii=False))
    OUT.write_text(html)
    print(f"dashboard.html: {OUT.stat().st_size/1024:.0f} КБ, пробежек {len(runs)}, граница лёгкого {ceiling} ({src})")
    for w in warnings:
        print("  !", w)


if __name__ == "__main__":
    main()
