# main.py
# ============================================================
# Planning SPV (4 créneaux/jour) avec OR-Tools CP-SAT
# C1: 3 dispo | C2: 8 dispo | C3: astreinte (2 AMB + 1 FPT = 9 rôles) | C4: 8 dispo
# ============================================================

from __future__ import annotations
import re
from collections import defaultdict
from typing import Dict, Tuple, List
import pandas as pd
from ortools.sat.python import cp_model

# ---------- FICHIERS ----------
XLSX_VOLONTAIRES = "SPV Pibrac Hackathon.xlsx"                # feuille: 2026
XLSX_PRIORITES   = "Priorité dans les recherches de fonctions opérationnelles.xlsx"  # Feuil1
CSV_DISPOS       = "disponibilites_2026.csv"                   # personne,YYYY-MM-DD_creneau1..4

# ---------- PARAMS MODELE ----------
NEEDS_SIMPLE = {1: 3, 2: 8, 4: 8}       # C1,C2,C4
NEEDS_C3 = {                             
    "AMB_CHEF": 2,
    "AMB_COND": 2,
    "AMB_EQUI_SUAP": 2,
    "FPT_CHEF": 1,
    "FPT_COND": 1,
    "FPT_EQUI_INC": 1,   # augmenté de 1 à 2 pour atteindre 9 rôles au total
}
ROLE_KEYS = list(NEEDS_C3.keys())

# Poids objectif
MAX_CONSEC_NUITS = 2
L_EQUI  = 10
L_REPOS = 8
L_PRIOS = 5
L_PREF  = 1
L_COHESION = 0

# Contraintes souples (pour avoir toujours une solution exportable)
SOFT_CONSTRAINTS = True
PENALITY_SIMPLE  = 1000
PENALITY_C3      = 5000

# ---------- Utils ----------
def _canon(s: str) -> str:
    if s is None:
        return ""
    t = str(s).strip().upper().replace("’", "'")
    return re.sub(r"\s+", " ", t)

GRADE_MAP = {
    "1CL": 1, "2CL": 1, "SAP": 1, "SAPEUR": 1, "SAPEUR 1CL": 1, "SAPEUR 2CL": 1,
    "CPL": 2, "CCH": 2, "CAPORAL": 2, "CAPORAL CHEF": 2, "CAPORAL-CHEF": 2,
    "SGT": 3, "SCH": 3, "SERGENT": 3, "SERGENT CHEF": 3, "SERGENT-CHEF": 3,
    "ADJ": 4, "ADC": 4, "ADJUDANT": 4, "ADJUDANT CHEF": 4, "ADJUDANT-CHEF": 4,
    "LTN": 5, "LIEUTENANT": 5,
    "CNE": 6, "CAPITAINE": 6,
}

# ---------- Export CSV ----------
def export_planning_csv(out_path: str, solver: cp_model.CpSolver,
                        vols: Dict[str, dict], DAYS: List[str], V: List[str],
                        z: dict, x: dict, ROLE_KEYS: List[str],
                        SOFT_CONSTRAINTS: bool,
                        short_simple: dict, short_c3: dict) -> None:
    rows = []

    # C1, C2, C4
    for d in DAYS:
        for s in (1, 2, 4):
            for v in V:
                if (v, d, s) in z and solver.Value(z[(v, d, s)]) == 1:
                    rows.append({
                        "day": d, "slot": s, "category": "SIMPLE", "role": "-",
                        "person_id": v, "person_name": vols[v]["nom"], "shortage_count": ""
                    })
            if SOFT_CONSTRAINTS and (d, s) in short_simple:
                miss = solver.Value(short_simple[(d, s)])
                if miss > 0:
                    rows.append({
                        "day": d, "slot": s, "category": "SHORTAGE", "role": "-",
                        "person_id": "", "person_name": "", "shortage_count": int(miss)
                    })

    # C3 (rôles)
    for d in DAYS:
        for r in ROLE_KEYS:
            for v in V:
                if (v, d, r) in x and solver.Value(x[(v, d, r)]) == 1:
                    rows.append({
                        "day": d, "slot": 3, "category": "C3", "role": r,
                        "person_id": v, "person_name": vols[v]["nom"], "shortage_count": ""
                    })
            if SOFT_CONSTRAINTS and (d, r) in short_c3:
                miss = solver.Value(short_c3[(d, r)])
                if miss > 0:
                    rows.append({
                        "day": d, "slot": 3, "category": "SHORTAGE", "role": r,
                        "person_id": "", "person_name": "", "shortage_count": int(miss)
                    })

    df_out = pd.DataFrame(rows, columns=[
        "day", "slot", "category", "role", "person_id", "person_name", "shortage_count"
    ])
    df_out.sort_values(["day", "slot", "category", "role", "person_name"], inplace=True)
    df_out.to_csv(out_path, index=False, encoding="utf-8")
    print(f"\n📄 Planning exporté: {out_path}  (lignes: {len(df_out)})")

# ---------- Lectures ----------
def read_volontaires_spv_pibrac(xlsx_path: str) -> Dict[str, dict]:
    xl = pd.ExcelFile(xlsx_path)
    df_raw = xl.parse("2026", header=None)

    top = df_raw.iloc[2].fillna('')
    sub = df_raw.iloc[3].fillna('')
    cols = [ (str(a).strip() if str(b).strip()=="" else f"{str(a).strip()} - {str(b).strip()}") for a,b in zip(top,sub) ]

    df = df_raw.iloc[4:].copy()
    df.columns = cols
    df = df.reset_index(drop=True)

    col_grade = "Grade"
    col_nom   = "Nom"

    def map_grade(g):
        gg = _canon(g)
        return GRADE_MAP.get(gg, GRADE_MAP.get(gg.split()[0], 1))

    suap_cols = [c for c in df.columns if "SUAP" in _canon(c)]
    inc_col   = next((c for c in df.columns if _canon(c) in ("- INC", "INC")), None)
    cod0_col  = next((c for c in df.columns if "COD 0" in _canon(c) or "COD0" in _canon(c)), None)
    cod1_col  = next((c for c in df.columns if "COD1" in _canon(c) or "COD 1" in _canon(c)), None)
    pl_col    = next((c for c in df.columns if "PERMIS C" in _canon(c) or "PERMIS PL" in _canon(c)), None)
    b_col     = next((c for c in df.columns if "PERMIS B" in _canon(c) or _canon(c) == "B"), None)

    vols, seen = {}, {}
    for _, r in df.iterrows():
        nom = str(r.get(col_nom, "")).strip()
        if not nom or nom.lower() == "nan":
            continue
        idx = seen.get(nom, 0)
        vid = nom if idx == 0 else f"{nom}#{idx}"
        seen[nom] = idx + 1

        grade = map_grade(r.get(col_grade, ""))

        habs = set()
        if suap_cols and any(str(r[c]).strip().upper() == "X" for c in suap_cols): habs.add("SUAP")
        if inc_col and str(r[inc_col]).strip().upper() == "X": habs.add("INC")
        if cod0_col and str(r[cod0_col]).strip().upper() == "X": habs.add("COD0")
        if cod1_col and str(r[cod1_col]).strip().upper() == "X": habs.add("COD1")
        if pl_col and str(r[pl_col]).strip().upper() == "X": habs.add("PL")
        if b_col and str(r[b_col]).strip().upper() == "X": habs.add("B")

        vols[vid] = {"nom": nom, "grade": grade, "habs": habs, "equipe": None}

    if not vols:
        raise ValueError("Aucun volontaire détecté dans la feuille '2026'.")
    return vols

def read_priorites_feuil1(xlsx_path: str) -> Dict[Tuple[int, str], int]:
    xl = pd.ExcelFile(xlsx_path)
    df = xl.parse("Feuil1", header=None).fillna("")

    grade_headers = list(df.iloc[1, 1:])
    func_rows = list(df.iloc[2:, 0])
    mat = df.iloc[2:, 1:].reset_index(drop=True)

    def map_grade_label(s: str) -> int:
        t = _canon(s)
        if "2CL" in t or "1CL" in t or "SAPEUR" in t: return 1
        if "CAPORAL" in t or "CPL" in t or "CCH" in t: return 2
        if "SERGENT" in t or "SGT" in t or "SCH" in t: return 3
        if "ADJUDANT" in t or "ADJ" in t or "ADC" in t: return 4
        if "LIEUTENANT" in t or "LTN" in t: return 5
        if "CAPITAINE" in t or "CNE" in t: return 6
        return 1

    prio = {}
    for i, f in enumerate(func_rows):
        fkey = _canon(f)
        if not fkey: continue
        if "CONDUCTEUR AMBULANCE" in fkey:
            roles = ["AMB_COND"]
        elif "CONDUCTEUR FOURGON" in fkey:
            roles = ["FPT_COND"]
        elif "EQUIPIER" in fkey:
            roles = ["AMB_EQUI_SUAP","FPT_EQUI_INC"]
        elif "CHEF D'AGR" in fkey or "CHEF D’AGR" in fkey:
            roles = ["AMB_CHEF","FPT_CHEF"]
        else:
            roles = []
        for j, gh in enumerate(grade_headers):
            g = map_grade_label(gh)
            val = str(mat.iat[i, j]).strip()
            if val == "" or val in {"■", "█"}: continue
            try:
                s = int(float(val))
            except:
                continue
            for rkey in roles:
                prio[(g, rkey)] = s
    return prio

def read_dispos_csv_with_slots(csv_path: str) -> List[dict]:
    df = pd.read_csv(csv_path, sep=",", dtype=str).fillna("")
    id_col = df.columns[0]
    date_cols = df.columns[1:]
    out = []
    for _, row in df.iterrows():
        pid = str(row[id_col]).strip()
        if not pid: continue
        for c in date_cols:
            try:
                day, slot = c.split("_creneau")
                slot = int(slot)
            except Exception:
                continue
            val = str(row[c]).strip().lower()
            is_dispo = val in {"oui", "yes", "1", "x", "true"}
            out.append({"id": pid, "jour": day, "slot": slot, "dispo": is_dispo, "pref": 1.0})
    if not out:
        raise ValueError("Aucune donnée lue depuis le CSV de disponibilités.")
    return out

def build_elig(vols: Dict[str, dict]) -> Dict[Tuple[str, str], int]:
    E = {}
    for v, p in vols.items():
        g = p["grade"]; H = p["habs"]

        # Ambulance: chef = grade >= Sergent (3) ; conducteur = (COD0 or COD1) AND Permis B
        E[(v, "AMB_CHEF")]      = int(g >= 3)                                 # Sergent min (pas INC obligatoire)
        E[(v, "AMB_COND")]      = int(("COD0" in H or "COD1" in H) and ("B" in H))
        E[(v, "AMB_EQUI_SUAP")] = int("SUAP" in H)

        # Fourgon
        E[(v, "FPT_CHEF")]      = int(g >= 4 and "INC" in H)
        E[(v, "FPT_COND")]      = int("PL" in H and "COD1" in H)
        E[(v, "FPT_EQUI_INC")]  = int("INC" in H)
    return E

# ---------- Diagnostic ----------
def count_dispo(DISPO, V, d, s):
    return sum(1 for v in V if DISPO.get((v, d, s), (False, 0.0))[0])

def count_role_eligible_avail(DISPO, ELIG, V, d, role):
    return sum(1 for v in V if DISPO.get((v, d, 3), (False, 0.0))[0] and ELIG.get((v, role), 0) == 1)

def diagnose(vols, DISPO, ELIG, DAYS, NEEDS_SIMPLE, NEEDS_C3):
    print("\n=== Diagnostic faisabilité ===")
    ok = True
    for d in DAYS:
        for s, need in NEEDS_SIMPLE.items():
            c = count_dispo(DISPO, vols.keys(), d, s)
            if c < need:
                ok = False
                print(f"⚠️  {d} C{s}: dispo={c} < besoin={need}")
        for r, need in NEEDS_C3.items():
            c = count_role_eligible_avail(DISPO, ELIG, vols.keys(), d, r)
            if c < need:
                ok = False
                print(f"⚠️  {d} C3 rôle {r}: elig+dispo={c} < besoin={need}")
    if ok:
        print("✅ Les besoins sont théoriquement couverts.")
    else:
        print("❌ Des manques sont détectés (voir ⚠️ ci-dessus).")

# ===================== SOLVEUR ===============================
def solve():
    print("Lecture données…")
    vols = read_volontaires_spv_pibrac(XLSX_VOLONTAIRES)
    priorites = read_priorites_feuil1(XLSX_PRIORITES)
    dispos = read_dispos_csv_with_slots(CSV_DISPOS)
    ELIG = build_elig(vols)

    DAYS = sorted({d["jour"] for d in dispos})
    if not DAYS:
        raise ValueError("Aucun jour détecté dans le CSV des disponibilités.")
    V = list(vols.keys())

    DISPO = {(d["id"], d["jour"], d["slot"]): (bool(d["dispo"]), float(d["pref"])) for d in dispos}

    # Diagnostic avant modélisation
    diagnose(vols, DISPO, ELIG, DAYS, NEEDS_SIMPLE, NEEDS_C3)

    mdl = cp_model.CpModel()

    # --- Variables C1,C2,C4 ---
    z = {(v, d, s): mdl.NewBoolVar(f"z_{v}_{d}_{s}") for v in V for d in DAYS for s in (1, 2, 4)}
    short_simple = {}

    for d in DAYS:
        for s, need in NEEDS_SIMPLE.items():
            varlist = [z[(v, d, s)] for v in V if (v, d, s) in DISPO]
            if SOFT_CONSTRAINTS:
                short_simple[(d, s)] = mdl.NewIntVar(0, need, f"short_c{s}_{d}")
                mdl.Add(sum(varlist) + short_simple[(d, s)] == need)
            else:
                mdl.Add(sum(varlist) == need)
            for v in V:
                ok, _ = DISPO.get((v, d, s), (False, 0.0))
                if not ok:
                    mdl.Add(z[(v, d, s)] == 0)

    # --- Variables C3 (rôles) ---
    x = {(v, d, r): mdl.NewBoolVar(f"x_{v}_{d}_{r}") for v in V for d in DAYS for r in ROLE_KEYS}
    short_c3 = {}

    # D'abord, forcer à 0 les variables pour personnes non éligibles ou non disponibles
    for d in DAYS:
        for v in V:
            ok, _ = DISPO.get((v, d, 3), (False, 0.0))
            for r in ROLE_KEYS:
                if (not ok) or (ELIG.get((v, r), 0) == 0):
                    mdl.Add(x[(v, d, r)] == 0)
    
    # Ensuite, contraintes de besoins par rôle (en incluant toutes les variables)
    for d in DAYS:
        for r, need in NEEDS_C3.items():
            # Prendre TOUTES les variables pour ce rôle (même celles à 0)
            varlist = [x[(v, d, r)] for v in V]
            if SOFT_CONSTRAINTS:
                short_c3[(d, r)] = mdl.NewIntVar(0, need, f"short_{r}_{d}")
                mdl.Add(sum(varlist) + short_c3[(d, r)] == need)
            else:
                mdl.Add(sum(varlist) == need)
        
        # Contrainte : une personne ne peut avoir qu'un rôle maximum par jour
        for v in V:
            mdl.Add(sum(x[(v, d, r)] for r in ROLE_KEYS) <= 1)

    # --- y/h/spread ---
    y = {(v, d): mdl.NewBoolVar(f"y_{v}_{d}") for v in V for d in DAYS}
    for v in V:
        for d in DAYS:
            mdl.Add(y[(v, d)] == sum(x[(v, d, r)] for r in ROLE_KEYS))
    h = {v: mdl.NewIntVar(0, len(DAYS), f"h_{v}") for v in V}
    for v in V:
        mdl.Add(h[v] == sum(y[(v, d)] for d in DAYS))
    h_min = mdl.NewIntVar(0, len(DAYS), "h_min")
    h_max = mdl.NewIntVar(0, len(DAYS), "h_max")
    mdl.AddMinEquality(h_min, list(h.values()))
    mdl.AddMaxEquality(h_max, list(h.values()))
    spread = mdl.NewIntVar(0, len(DAYS), "spread")
    mdl.Add(spread == h_max - h_min)

    # --- Nuits consécutives (> K) ---
    over_terms = []
    K = MAX_CONSEC_NUITS
    W = K + 1
    if len(DAYS) >= W:
        for v in V:
            for i in range(0, len(DAYS) - K):
                ssum = mdl.NewIntVar(0, W, f"suite_{v}_{i}")
                mdl.Add(ssum == sum(y[(v, DAYS[t])] for t in range(i, i + W)))
                over = mdl.NewIntVar(0, W, f"over_{v}_{i}")
                mdl.Add(over >= 0)
                mdl.Add(over >= ssum - K)
                over_terms.append(over)

    # --- Priorités grade↔rôle (C3): malus = score-1 ---
    prio_terms = []
    for d in DAYS:
        for v in V:
            g = vols[v]["grade"]
            for r in ROLE_KEYS:
                score = priorites.get((g, r), 3)
                malus = max(0, score - 1)
                if malus:
                    prio_terms.append(malus * x[(v, d, r)])

    # --- Préférences (C1,C2,C4): bonus ---
    pref_terms = []
    for (v, d, s), (_, pref) in DISPO.items():
        if s in (1, 2, 4) and pref > 0:
            pref_terms.append(pref * z[(v, d, s)])

    # --- Objectif ---
    mdl.Minimize(
        1 * (L_EQUI * spread) +
        1 * (L_REPOS * sum(over_terms) if over_terms else 0) +
        1 * (L_PRIOS * sum(prio_terms) if prio_terms else 0) -
        1 * (L_PREF * sum(pref_terms) if pref_terms else 0) +
        (PENALITY_SIMPLE * sum(short_simple.values()) if SOFT_CONSTRAINTS else 0) +
        (PENALITY_C3     * sum(short_c3.values())     if SOFT_CONSTRAINTS else 0)
    )

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(mdl)
    print("Status:", solver.StatusName(status), "| Objective:", solver.ObjectiveValue())
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print("❌ Pas de solution.")
        return

    # --- Affichage court ---
    print("\n=== Charges (nuits C3) ===")
    hv = {v: solver.Value(h[v]) for v in V}
    for v, val in sorted(hv.items(), key=lambda kv: -kv[1])[:20]:
        print(f"- {vols[v]['nom']:<24} {val}")

    for d in DAYS[:7]:
        print(f"\n=== Jour {d} ===")
        for s in (1, 2, 4):
            names = [vols[v]["nom"] for v in V if solver.Value(z[(v, d, s)]) == 1]
            print(f" C{s} ({NEEDS_SIMPLE[s]}): {', '.join(names)}")
        print(" C3 (astreinte, 9 rôles) :")
        assigned = defaultdict(list)
        for r in ROLE_KEYS:
            for v in V:
                if solver.Value(x[(v, d, r)]) == 1:
                    assigned[r].append(vols[v]["nom"])
        for r in ROLE_KEYS:
            print(f"  - {r:<13}: {', '.join(assigned[r])}")

    if SOFT_CONSTRAINTS:
        print("\n=== Manques (pénalisés) ===")
        any_short = False
        for (d, s), var in short_simple.items():
            val = solver.Value(var)
            if val > 0:
                any_short = True
                print(f"- {d} C{s}: {val} manquant(s)")
        for (d, r), var in short_c3.items():
            val = solver.Value(var)
            if val > 0:
                any_short = True
                print(f"- {d} C3 {r}: {val} manquant(s)")
        if not any_short:
            print("Aucun manque.")

    # --- Export CSV ---
    export_planning_csv(
        out_path="planning_optimise.csv",
        solver=solver,
        vols=vols,
        DAYS=DAYS,
        V=V,
        z=z,
        x=x,
        ROLE_KEYS=ROLE_KEYS,
        SOFT_CONSTRAINTS=SOFT_CONSTRAINTS,
        short_simple=short_simple,
        short_c3=short_c3
    )

if __name__ == "__main__":
    solve()
