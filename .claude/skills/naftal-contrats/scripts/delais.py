#!/usr/bin/env python3
"""Calcule l'échéance d'un délai contractuel, selon les deux méthodes de computation.

Usage :
    python3 delais.py 06/01/2025 60j        # délai en jours
    python3 delais.py 01/01/2024 36m        # délai en mois
    python3 delais.py --entre 06/01/2025 12/01/2025   # jours écoulés, bornes comprises

Méthode « inclusive » (pratique observée chez NAFTAL) : le jour de départ compte comme
premier jour ; l'échéance tombe la veille de la date anniversaire (36 mois du 01/01/2024
au 31/12/2026). Méthode « exclusive » : le jour de départ n'est pas compté.
Le vendredi et le samedi (repos hebdomadaire en Algérie) sont signalés.
"""
import argparse
import calendar
import re
import sys
from datetime import date, datetime, timedelta

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
REPOS = {4, 5}


def lire_date(texte):
    return datetime.strptime(texte, "%d/%m/%Y").date()


def ajouter_mois(d, n):
    mois = d.month - 1 + n
    annee, mois = d.year + mois // 12, mois % 12 + 1
    return date(annee, mois, min(d.day, calendar.monthrange(annee, mois)[1]))


def decrire(d):
    repos = "  ⚠ jour de repos" if d.weekday() in REPOS else ""
    return f"{d:%d/%m/%Y} ({JOURS[d.weekday()]}){repos}"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("depart", help="date de départ JJ/MM/AAAA")
    ap.add_argument("duree", nargs="?", help="durée : 60j ou 36m")
    ap.add_argument("--entre", metavar="FIN", help="nombre de jours du départ à FIN, bornes comprises")
    args = ap.parse_args()

    depart = lire_date(args.depart)
    if args.entre:
        fin = lire_date(args.entre)
        print(f"{(fin - depart).days + 1} jour(s) du {decrire(depart)} au {decrire(fin)}")
        return
    m = re.fullmatch(r"(\d+)\s*([jm])", (args.duree or "").lower())
    if not m:
        sys.exit("durée attendue : par ex. 60j ou 36m")
    n, unite = int(m.group(1)), m.group(2)
    exclusive = depart + timedelta(days=n) if unite == "j" else ajouter_mois(depart, n)
    inclusive = exclusive - timedelta(days=1)
    if unite == "m" and exclusive.day < depart.day:
        # Quantième absent du mois d'arrivée (ex. 31/01 + 1 mois) : échéance au dernier jour.
        inclusive = exclusive
    print(f"Départ        : {decrire(depart)} — {n} {'jours' if unite == 'j' else 'mois'}")
    print(f"Inclusive     : {decrire(inclusive)}   (jour de départ compté — pratique NAFTAL)")
    print(f"Exclusive     : {decrire(exclusive)}   (jour de départ non compté)")


if __name__ == "__main__":
    main()
