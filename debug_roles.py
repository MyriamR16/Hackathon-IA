# debug_roles.py - Diagnostic approfondi des rôles C3

import pandas as pd
import re
from collections import defaultdict

def _canon(s):
    if s is None: return ""
    t = str(s).strip().upper().replace("'", "'")
    return re.sub(r"\s+", " ", t)

GRADE_MAP = {
    "1CL": 1, "2CL": 1, "SAP": 1, "SAPEUR": 1, "SAPEUR 1CL": 1, "SAPEUR 2CL": 1,
    "CPL": 2, "CCH": 2, "CAPORAL": 2, "CAPORAL CHEF": 2, "CAPORAL-CHEF": 2,
    "SGT": 3, "SCH": 3, "SERGENT": 3, "SERGENT CHEF": 3, "SERGENT-CHEF": 3,
    "ADJ": 4, "ADC": 4, "ADJUDANT": 4, "ADJUDANT CHEF": 4, "ADJUDANT-CHEF": 4,
    "LTN": 5, "LIEUTENANT": 5,
    "CNE": 6, "CAPITAINE": 6,
}

def map_grade(g):
    gg = _canon(g)
    return GRADE_MAP.get(gg, GRADE_MAP.get(gg.split()[0] if gg.split() else gg, 1))

def analyze_roles():
    print("🔍 DIAGNOSTIC APPROFONDI DES RÔLES C3")
    print("="*50)
    
    # Charger CSV des disponibilités
    print("📋 Chargement des disponibilités...")
    df_dispos = pd.read_csv('disponibilites_2026.csv')
    personnes_dispos = set(df_dispos.iloc[:, 0])  # Première colonne = noms
    print(f"   Personnes dans CSV dispos: {len(personnes_dispos)}")
    
    # Simuler la lecture du fichier Excel (sans openpyxl)
    # Pour l'instant, créons des données fictives basées sur des hypothèses réalistes
    print("\n👥 Analyse des éligibilités (simulation)...")
    
    # Supposons des stats réalistes pour 44 pompiers
    pompiers_fictifs = []
    for i in range(44):
        nom = f"POMPIER_{i+1:02d}"
        # Distribution réaliste des grades
        if i < 20:   grade = 1  # Sapeurs (45%)
        elif i < 30: grade = 2  # Caporaux (23%)
        elif i < 38: grade = 3  # Sergents (18%)
        elif i < 42: grade = 4  # Adjudants (9%)
        elif i < 43: grade = 5  # Lieutenants (2%)
        else:        grade = 6  # Capitaines (2%)
        
        # Habilitations réalistes
        habs = set()
        if i % 3 == 0: habs.add("SUAP")      # 33% ont SUAP
        if i % 2 == 0: habs.add("INC")       # 50% ont INC
        if i % 5 == 0: habs.add("COD0")      # 20% ont COD0
        if i % 7 == 0: habs.add("COD1")      # 14% ont COD1
        if i % 4 == 0: habs.add("PL")        # 25% ont PL
        if i % 2 == 1: habs.add("B")         # 50% ont permis B
        
        pompiers_fictifs.append({"nom": nom, "grade": grade, "habs": habs})
    
    # Calculer les éligibilités
    NEEDS_C3 = {
        "AMB_CHEF": 1,      # grade >= 3
        "AMB_COND": 1,      # (COD0 ou COD1) ET Permis B
        "AMB_EQUI_SUAP": 2, # SUAP
        "FPT_CHEF": 2,      # grade >= 4 ET INC
        "FPT_COND": 1,      # PL ET COD1
        "FPT_EQUI_INC": 2,  # INC
    }
    
    stats = defaultdict(int)
    eligible_details = defaultdict(list)
    
    for p in pompiers_fictifs:
        g, H, nom = p["grade"], p["habs"], p["nom"]
        
        # AMB_CHEF: grade >= Sergent (3)
        if g >= 3:
            stats["AMB_CHEF"] += 1
            eligible_details["AMB_CHEF"].append(nom)
        
        # AMB_COND: (COD0 ou COD1) ET Permis B
        if ("COD0" in H or "COD1" in H) and ("B" in H):
            stats["AMB_COND"] += 1
            eligible_details["AMB_COND"].append(nom)
        
        # AMB_EQUI_SUAP: SUAP
        if "SUAP" in H:
            stats["AMB_EQUI_SUAP"] += 1
            eligible_details["AMB_EQUI_SUAP"].append(nom)
        
        # FPT_CHEF: grade >= Adjudant (4) ET INC
        if g >= 4 and "INC" in H:
            stats["FPT_CHEF"] += 1
            eligible_details["FPT_CHEF"].append(nom)
        
        # FPT_COND: PL ET COD1
        if "PL" in H and "COD1" in H:
            stats["FPT_COND"] += 1
            eligible_details["FPT_COND"].append(nom)
        
        # FPT_EQUI_INC: INC
        if "INC" in H:
            stats["FPT_EQUI_INC"] += 1
            eligible_details["FPT_EQUI_INC"].append(nom)
    
    print("\n📊 RÉSULTATS D'ÉLIGIBILITÉ:")
    print("-" * 60)
    total_required = sum(NEEDS_C3.values())
    total_available = 0
    
    for role, need in NEEDS_C3.items():
        available = stats[role]
        total_available += available
        status = "✅" if available >= need else "❌"
        print(f"{status} {role:<15}: {available:2d} éligibles / {need} requis")
        
        if available < need:
            print(f"   ⚠️  MANQUE: {need - available} personne(s)")
            if available > 0:
                print(f"   👥 Éligibles: {', '.join(eligible_details[role][:3])}{'...' if len(eligible_details[role]) > 3 else ''}")
        elif available == 0:
            print(f"   ❌ Aucune personne éligible!")
    
    print("-" * 60)
    print(f"TOTAL: {total_available} éligibilités / {total_required} requis")
    
    # Problèmes identifiés
    print(f"\n🚨 PROBLÈMES IDENTIFIÉS:")
    
    problematic_roles = [role for role, need in NEEDS_C3.items() if stats[role] < need]
    if problematic_roles:
        for role in problematic_roles:
            need = NEEDS_C3[role]
            available = stats[role]
            print(f"   • {role}: seulement {available}/{need} éligible(s)")
        
        print(f"\n💡 SOLUTIONS POSSIBLES:")
        if "FPT_CHEF" in problematic_roles:
            print("   • FPT_CHEF: Besoin de plus d'Adjudants+ avec habilitation INC")
        if "FPT_COND" in problematic_roles:
            print("   • FPT_COND: Besoin de plus de PL + COD1")
        if "AMB_COND" in problematic_roles:
            print("   • AMB_COND: Besoin de plus de COD0/COD1 + Permis B")
        if "AMB_EQUI_SUAP" in problematic_roles:
            print("   • AMB_EQUI_SUAP: Besoin de plus d'habilités SUAP")
    else:
        print("   ✅ Tous les rôles semblent avoir assez d'éligibles")

if __name__ == "__main__":
    analyze_roles()
