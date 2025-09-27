# 🚒 Planning Pompiers Volontaires - Interface de Calendrier

## 📋 Description

Cette application web permet de visualiser et gérer le planning des pompiers volontaires avec deux modes principaux :
1. **Visualisation des disponibilités** : Affichage des disponibilités individuelles de chaque pompier
2. **Planning optimisé** : Génération et visualisation du planning optimal basé sur l'algorithme d'optimisation

## 🎯 Fonctionnalités Principales

### 📅 Calendrier Interactif
- Navigation par mois (2025)
- Vue calendrier avec 4 créneaux par jour :
  - **Créneau 1** : Service de jour
  - **Créneau 2** : Service de jour étendu
  - **Créneau 3** : Astreinte (9 rôles spécialisés)
  - **Créneau 4** : Service de nuit

### 👨‍🚒 Mode Disponibilités
- Sélection d'un pompier dans la liste déroulante
- Affichage visuel des disponibilités (vert = disponible, rouge = indisponible)
- Filtrage par créneau spécifique ou vue globale
- Information détaillée au survol (nom du créneau + statut)

### 📊 Mode Planning Optimisé
- Génération automatique du planning optimal via l'algorithme OR-Tools
- Affichage des affectations par créneau et par rôle
- Identification des manques de personnel
- Rôles spécialisés pour l'astreinte (C3) :
  - **AMB_CHEF** : Chef d'agrès ambulance
  - **AMB_COND** : Conducteur ambulance
  - **AMB_EQUI_SUAP** : Équipier SUAP
  - **FPT_CHEF** : Chef d'agrès fourgon
  - **FPT_COND** : Conducteur fourgon
  - **FPT_EQUI_INC** : Équipier incendie

## 🛠️ Installation et Démarrage

### Prérequis
- Python 3.13+
- Node.js 18+
- npm ou yarn

### Installation Rapide

1. **Cloner le projet** (si ce n'est pas déjà fait)
```bash
cd /home/Myriam/Documents/Hackathon-IA
```

2. **Démarrage automatique**
```bash
./start.sh
```

3. **Accéder à l'application**
- Frontend : http://localhost:5173
- Backend : http://localhost:5000

4. **Arrêt de l'application**
```bash
./stop.sh
```
ou Ctrl+C dans le terminal de start.sh

### Installation Manuelle

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python run.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📖 Guide d'Utilisation

### 1. Navigation dans l'interface

1. **Connexion** : Utilisez les identifiants existants ou créez un compte
2. **Dashboard** : Cliquez sur "Voir le planning" pour accéder au calendrier
3. **Calendrier** : Naviguez avec les flèches ‹ › entre les mois

### 2. Visualisation des Disponibilités

1. Sélectionnez le mode "Disponibilités" (bouton radio)
2. Choisissez un pompier dans la liste déroulante
3. Optionnel : Filtrez par créneau spécifique
4. Les cercles colorés indiquent la disponibilité :
   - 🟢 Vert : Disponible
   - 🔴 Rouge : Indisponible

### 3. Planning Optimisé

1. Sélectionnez le mode "Planning optimisé"
2. Cliquez sur "🔄 Générer planning optimisé" pour lancer l'algorithme
3. Visualisez les affectations :
   - **Simple** : Créneaux C1, C2, C4 (couleur verte)
   - **C3** : Astreinte avec rôles spécialisés (couleur orange)
   - **Shortage** : Manques de personnel (couleur rouge)

### 4. Filtrage par Créneaux

- **Tous les créneaux** : Vue complète de la journée
- **Créneau 1** : Service de jour
- **Créneau 2** : Service de jour étendu  
- **Créneau 3** : Astreinte spécialisée
- **Créneau 4** : Service de nuit

## 📁 Structure des Données

### Fichiers Source
- `disponibilites_2026.csv` : Disponibilités de tous les pompiers
- `SPV Pibrac Hackathon.xlsx` : Informations des pompiers (grades, habilitations)
- `Priorité dans les recherches de fonctions opérationnelles.xlsx` : Matrice de priorités

### Données Générées
- `planning_optimise.csv` : Planning optimal généré par l'algorithme

## 🔧 Architecture Technique

### Backend (Flask)
- **Endpoints API** :
  - `GET /api/planning/disponibilites` : Disponibilités
  - `GET /api/planning/pompiers` : Informations pompiers
  - `POST /api/planning/optimise` : Génération planning
  - `GET /api/planning/optimise` : Récupération planning
  - `GET /api/planning/calendar/{year}/{month}` : Données calendrier

### Frontend (React + TypeScript)
- **Composants principaux** :
  - `PlanningCalendrier.tsx` : Interface calendrier
  - `Dashboard.tsx` : Tableau de bord
  - `NavBar.tsx` : Navigation

### Algorithme d'Optimisation
- **OR-Tools CP-SAT** : Solveur de contraintes
- **Objectifs optimisés** :
  - Équité des charges
  - Respect des repos
  - Priorités grade/rôle
  - Préférences personnelles

## 🎨 Personnalisation

### Couleurs des Créneaux
```css
.available { background: #4caf50; }    /* Vert - Disponible */
.unavailable { background: #f44336; }  /* Rouge - Indisponible */
.simple { background: #e8f5e8; }       /* Vert clair - Simple */
.c3 { background: #fff3e0; }           /* Orange - Astreinte */
.shortage { background: #ffebee; }      /* Rouge clair - Manque */
```

### Modification des Créneaux
Modifiez les labels dans `PlanningCalendrier.tsx` :
```typescript
const slotLabels = {
  1: 'Votre label',
  2: 'Votre label',
  3: 'Votre label', 
  4: 'Votre label'
};
```

## 🐛 Résolution de Problèmes

### Erreurs Communes

1. **Port déjà utilisé**
```bash
./stop.sh  # Arrêter les processus existants
./start.sh # Redémarrer
```

2. **Erreur de dépendances Python**
```bash
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Erreur de dépendances Node**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

4. **Fichiers de données manquants**
Vérifiez la présence de :
- `disponibilites_2026.csv`
- `SPV Pibrac Hackathon.xlsx`
- `Priorité dans les recherches de fonctions opérationnelles.xlsx`

### Logs et Debug

- **Backend** : Les logs apparaissent dans le terminal Flask
- **Frontend** : Utilisez les outils de développement du navigateur (F12)
- **Algorithme** : Consultez la sortie de `python planning_Optimal.py`

## 📊 Métriques et Performance

### Temps de Calcul Typiques
- **Lecture données** : ~1-2 secondes
- **Optimisation** : ~30-60 secondes (selon complexité)
- **Export résultats** : ~1 seconde

### Capacité
- **Pompiers** : Testé avec ~45 pompiers
- **Période** : Optimisation sur 1 an (365 jours)
- **Contraintes** : ~150,000 variables de décision

## 🔄 Mises à Jour et Maintenance

### Ajout de Nouveaux Pompiers
1. Modifier `SPV Pibrac Hackathon.xlsx`
2. Ajouter les disponibilités dans `disponibilites_2026.csv`
3. Redémarrer l'application

### Modification des Paramètres d'Optimisation
Éditez `planning_Optimal.py` :
```python
# Besoins par créneau
NEEDS_SIMPLE = {1: 3, 2: 8, 4: 8}
NEEDS_C3 = {"AMB_CHEF": 2, ...}

# Poids objectif
L_EQUI = 10      # Équité
L_REPOS = 8      # Repos
L_PRIOS = 5      # Priorités
L_PREF = 1       # Préférences
```

## 📞 Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les logs d'erreur
3. Testez avec les scripts fournis
4. Contactez l'équipe de développement

## 🏆 Crédits

Développé pour le Hackathon IA - Service Départemental d'Incendie et de Secours
- **Algorithme** : OR-Tools CP-SAT (Google)
- **Backend** : Flask (Python)
- **Frontend** : React + TypeScript
- **Base de données** : SQLAlchemy
- **Styling** : CSS personnalisé