"""Собирает dashboard.html из data/*.json.

Python готовит данные, страница рисует графики сама (SVG + немного JS):
переключатель периода, подсказки при наведении, разбор месяца по клику.
Дизайн: InnaTri book design (бумага, засечки, один глубокий красный).

    .venv/bin/python build_dashboard.py [--easy-ceiling 141] [--deload 0.7]
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


def num(v, nd=1):
    return round(v, nd) if isinstance(v, (int, float)) and v > 0 else None


def temp(a):
    lo, hi = a.get("minTemperature"), a.get("maxTemperature")
    vals = [v for v in (lo, hi) if isinstance(v, (int, float))]
    return round(sum(vals) / len(vals), 1) if vals else None


def main() -> None:
    global DATA, OUT
    ap = argparse.ArgumentParser()
    ap.add_argument("--easy-ceiling", type=int, default=int(os.environ.get("INNATRI_EASY_CEILING", 0)) or None,
                    help="верх лёгкого пульса вручную, если зоны в Garmin не настроены")
    ap.add_argument("--deload", type=float, default=float(os.environ.get("INNATRI_DELOAD", 0.7)),
                    help="порог разгрузочной недели как доля от средней за три предыдущие")
    ap.add_argument("--name", default=os.environ.get("INNATRI_NAME"), help="имя в шапке; пустая строка, чтобы не печатать")
    ap.add_argument("--data", default=str(DATA), help="папка с json")
    ap.add_argument("--out", default=str(OUT), help="куда писать html")
    ap.add_argument("--hide-year", action="store_true", help="не печатать год в датах (для демо)")
    ap.add_argument("--lang", choices=["ru", "en", "uk"], default=os.environ.get("INNATRI_LANG", "ru"), help="язык дашборда")
    args = ap.parse_args()
    DATA, OUT = Path(args.data), Path(args.out)

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
    # коды: текст на нужном языке подставляет сам дашборд
    merge3 = False  # 3-я зона часов считается лёгкой (зоны от максимума по умолчанию)
    if args.easy_ceiling:
        ceiling, kind, src = args.easy_ceiling, "manual", "задана вручную"
    elif zr.get("zone3Floor"):
        ceiling = zr["zone3Floor"]
        if method == "LACTATE_THRESHOLD":
            kind, src = "zone_lt", f"верх 2-й зоны в ваших часах, зоны от порога {lthr}"
        elif method == "HR_RESERVE":
            kind, src = "zone_hrr", f"верх 2-й зоны в ваших часах, зоны от резерва пульса, максимум {maxhr}"
            warnings.append("formula")
        else:
            kind, src = "zone_max", f"верх 2-й зоны в ваших часах, зоны от максимума {maxhr}"
            warnings.append("formula")
            # Зоны Garmin от максимума по умолчанию: 2-я кончается на 70%, а первый порог у бегунов
            # обычно 75–82% максимума (Seiler 2010). Тогда граница лёгкого: верх 3-й зоны (80%).
            z3, z4 = zr.get("zone3Floor"), zr.get("zone4Floor")
            if maxhr and z3 / maxhr < 0.75:
                if z4 and 0.75 <= z4 / maxhr <= 0.85:
                    ceiling, kind, merge3 = z4, "zone_max3", True
                    src = f"верх 3-й зоны в ваших часах, около 80% от максимума {maxhr}"
                else:
                    ceiling, kind = round(maxhr * 0.8), "maxhr80"
                    src = f"80% от максимума {maxhr}"
    elif lthr:
        ceiling, kind, src = round(lthr * 0.86), "lthr", f"86% от порога {lthr}"
    elif maxhr:
        ceiling, kind, src = round(maxhr * 0.79), "maxhr", f"79% от максимума {maxhr}"
        warnings.append("no_zones")
    else:
        ceiling, kind, src = 145, "default", "по умолчанию, зоны не найдены"
        warnings.append("no_data")

    # --- нагрузка: если Garmin её не отдал (старые часы, до 2020), оцениваем по времени и пульсу ------
    ref_hr = lthr or (round(maxhr * 0.9) if maxhr else 160)
    load_est = 0

    def load_of(a):
        nonlocal load_est
        v = a.get("activityTrainingLoad")
        if v:
            return round(v), False
        mins = (a.get("duration") or 0) / 60
        hr = a.get("averageHR")
        if mins <= 0:
            return 0, False
        load_est += 1
        return round(mins * ((hr / ref_hr) ** 2 if hr else 0.5)), True

    loads_by_id = {}
    for a in acts:
        v, _ = load_of(a)
        if v:
            loads_by_id[a.get("activityId")] = v

    # --- пробежки ---------------------------------------------------------------
    runs = []
    zmiss = 0
    for a in acts:
        t = (a.get("activityType") or {}).get("typeKey") or ""
        if "running" not in t:
            continue
        spd = a.get("averageSpeed") or 0
        gap = a.get("avgGradeAdjustedSpeed") or spd
        hr = a.get("averageHR")
        indoor = ("treadmill" in t or "indoor" in t)
        z = [round(a.get(f"hrTimeInZone_{i}") or 0) for i in range(1, 6)]
        if merge3:
            z = [z[0], z[1] + z[2], 0, z[3], z[4]]
        if not sum(z):
            zmiss += 1
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
            z=z, zmiss=not sum(z),
            load=loads_by_id.get(a.get("activityId"), 0),
            te=a.get("aerobicTrainingEffect"),
            label=a.get("trainingEffectLabel"),
            cad=a.get("averageRunningCadenceInStepsPerMinute"),
            elev=a.get("elevationGain"),
            indoor=indoor,
            # техника и условия: что часы отдали, то и берём
            spd=round(gap, 3) if gap else None,
            stride=num(a.get("avgStrideLength")), gct=num(a.get("avgGroundContactTime")),
            vo=num(a.get("avgVerticalOscillation")), vr=num(a.get("avgVerticalRatio")),
            pw=num(a.get("avgPower")), t=temp(a),
        ))
    runs.sort(key=lambda r: r["date"])

    loads = [dict(date=a["startTimeLocal"][:10], load=loads_by_id[a.get("activityId")])
             for a in acts if a.get("activityId") in loads_by_id]

    rhr = {}
    for chunk in load("daily.json") or []:
        for row in chunk.get("data", []):
            v = (row.get("heartRate") or {}).get("restingValue")
            if v and row.get("calendarDate"):
                rhr[row["calendarDate"]] = v

    stress = {}
    for chunk in load("daily.json") or []:
        for row in chunk.get("data", []):
            v = (row.get("stress") or {}).get("avgLevel")
            if v and v > 0 and row.get("calendarDate"):
                stress[row["calendarDate"]] = v

    sleep = {}
    for row in load("sleep.json") or []:
        d, sec = (row or {}).get("calendarDate"), (row or {}).get("sleepTimeSeconds")
        if d and sec:
            sleep[d] = round(sec / 3600, 2)

    hrv = {}
    for chunk in load("hrv.json") or []:
        for s in (chunk or {}).get("hrvSummaries", []):
            if s.get("lastNightAvg") and s.get("calendarDate"):
                hrv[s["calendarDate"]] = s["lastNightAvg"]

    profile = load("profile.json") or {}
    model = dict(
        name=args.name if args.name is not None else (profile.get("displayName") or ""),
        built=dt.date.today().isoformat(),
        ceiling=ceiling, ceiling_src=src, ceiling_kind=kind, lang=args.lang, lthr=lthr, maxhr=maxhr, zone_method=method,
        deload=args.deload, warnings=warnings, hide_year=args.hide_year, zmiss_n=zmiss, load_est_n=load_est, runs=runs, loads=loads, rhr=rhr, hrv=hrv, stress=stress, sleep=sleep,
    )

    tpl = (ROOT / "template.html").read_text()
    html = tpl.replace("/*__DATA__*/null", json.dumps(model, ensure_ascii=False))
    OUT.write_text(html)
    print(f"{OUT.name}: {OUT.stat().st_size/1024:.0f} КБ, пробежек {len(runs)}, граница лёгкого {ceiling} ({src})")
    if zmiss:
        print(f"  зоны не записаны у {zmiss} пробежек, их время разнесено по среднему пульсу")
    if load_est:
        print(f"  нагрузка оценена по времени и пульсу у {load_est} тренировок")
    for w in warnings:
        print("  !", formula_warn if w == "formula" else w)


if __name__ == "__main__":
    main()
