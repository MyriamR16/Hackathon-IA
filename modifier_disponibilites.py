#!/usr/bin/env python3
import pandas as pd
import random

# Lecture du fichier CSV
df = pd.read_csv('disponibilites_2026.csv')

print(f"Forme du DataFrame: {df.shape} (lignes x colonnes)")
print(f"Nombre de pompiers: {len(df)}")

# Obtenir les colonnes (sauf la première qui est "personne")
colonnes = df.columns[1:].tolist()
print(f"Nombre total de colonnes de créneaux: {len(colonnes)}")

# Sélectionner aléatoirement quelques colonnes pour chaque type
n_colonnes_oui = random.randint(3, 6)  # 3-6 colonnes avec que des "oui"
n_colonnes_non = random.randint(3, 6)  # 3-6 colonnes avec que des "non"  
n_colonnes_variees = random.randint(5, 8)  # 5-8 colonnes avec des dispos variées

# Sélectionner les colonnes aléatoirement
colonnes_oui = random.sample(colonnes, n_colonnes_oui)
colonnes_restantes = [col for col in colonnes if col not in colonnes_oui]

colonnes_non = random.sample(colonnes_restantes, n_colonnes_non)
colonnes_restantes = [col for col in colonnes_restantes if col not in colonnes_non]

colonnes_variees = random.sample(colonnes_restantes, n_colonnes_variees)

print(f"\nColonnes sélectionnées:")
print(f"- Que des OUI ({len(colonnes_oui)} colonnes): {colonnes_oui[:3]}...")
print(f"- Que des NON ({len(colonnes_non)} colonnes): {colonnes_non[:3]}...")
print(f"- Disponibilités variées ({len(colonnes_variees)} colonnes): {colonnes_variees[:3]}...")

# Appliquer les modifications
print(f"\nApplication des modifications...")

# Colonnes avec que des "oui"
for col in colonnes_oui:
    df[col] = 'oui'

# Colonnes avec que des "non"
for col in colonnes_non:
    df[col] = 'non'

# Colonnes avec des disponibilités variées (mélange aléatoire)
nb_pompiers = len(df)
for col in colonnes_variees:
    # Créer un mélange aléatoire avec plus de variété
    nb_oui = random.randint(2, nb_pompiers - 2)  # Entre 2 et nb_pompiers-2 "oui"
    nb_non = nb_pompiers - nb_oui
    valeurs = ['oui'] * nb_oui + ['non'] * nb_non
    random.shuffle(valeurs)
    df[col] = valeurs

# Sauvegarder le fichier modifié
df.to_csv('disponibilites_2026.csv', index=False)

print(f"\n✅ Modifications appliquées et fichier sauvegardé!")
print(f"📊 Résumé des changements:")
print(f"   - {len(colonnes_oui)} colonnes maintenant avec que des 'oui'")
print(f"   - {len(colonnes_non)} colonnes maintenant avec que des 'non'")
print(f"   - {len(colonnes_variees)} colonnes avec des disponibilités variées")
print(f"   - {len(colonnes) - len(colonnes_oui) - len(colonnes_non) - len(colonnes_variees)} colonnes inchangées")
