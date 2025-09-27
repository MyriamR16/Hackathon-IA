import pandas as pd

def analyser_colonnes_disponibilites():
    """
    Analyse le fichier CSV pour trouver les colonnes qui contiennent uniquement
    des 'oui' ou uniquement des 'non'.
    """
    
    # Lire le fichier CSV
    df = pd.read_csv('disponibilites_2026.csv')
    
    print("Analyse des colonnes de disponibilités...")
    print(f"Nombre total de colonnes : {len(df.columns)}")
    print(f"Nombre de personnes : {len(df)}")
    print()
    
    colonnes_que_oui = []
    colonnes_que_non = []
    
    # Analyser chaque colonne (sauf la première qui contient les noms)
    for colonne in df.columns[1:]:  # On ignore la colonne 'personne'
        valeurs_uniques = df[colonne].unique()
        
        # Vérifier si la colonne ne contient que des 'oui'
        if len(valeurs_uniques) == 1 and valeurs_uniques[0] == 'oui':
            colonnes_que_oui.append(colonne)
        
        # Vérifier si la colonne ne contient que des 'non'
        elif len(valeurs_uniques) == 1 and valeurs_uniques[0] == 'non':
            colonnes_que_non.append(colonne)
    
    # Afficher les résultats
    print("=== RÉSULTATS DE L'ANALYSE ===")
    print()
    
    print(f"Colonnes qui contiennent UNIQUEMENT des 'oui' : {len(colonnes_que_oui)}")
    if colonnes_que_oui:
        for colonne in colonnes_que_oui:
            print(f"  - {colonne}")
    else:
        print("  Aucune colonne trouvée")
    
    print()
    
    print(f"Colonnes qui contiennent UNIQUEMENT des 'non' : {len(colonnes_que_non)}")
    if colonnes_que_non:
        for colonne in colonnes_que_non:
            print(f"  - {colonne}")
    else:
        print("  Aucune colonne trouvée")
    
    print()
    print(f"Total des colonnes avec valeurs uniformes : {len(colonnes_que_oui) + len(colonnes_que_non)}")
    
    # Statistiques supplémentaires
    print("\n=== STATISTIQUES SUPPLÉMENTAIRES ===")
    total_creneaux = len(df.columns) - 1  # -1 pour exclure la colonne 'personne'
    pourcentage_uniforme = ((len(colonnes_que_oui) + len(colonnes_que_non)) / total_creneaux) * 100
    
    print(f"Pourcentage de créneaux avec disponibilité uniforme : {pourcentage_uniforme:.2f}%")
    
    if colonnes_que_oui:
        print(f"Pourcentage de créneaux où TOUT LE MONDE est disponible : {(len(colonnes_que_oui) / total_creneaux) * 100:.2f}%")
    
    if colonnes_que_non:
        print(f"Pourcentage de créneaux où PERSONNE n'est disponible : {(len(colonnes_que_non) / total_creneaux) * 100:.2f}%")
    
    return colonnes_que_oui, colonnes_que_non

if __name__ == "__main__":
    colonnes_oui, colonnes_non = analyser_colonnes_disponibilites()
