---
name: arena
description: >-
  Arène de skills : lance la même tâche sur plusieurs skills ou agents en
  parallèle, puis les compare et les classe selon des critères clairs. À utiliser
  quand l'utilisateur dit « arena », « compare ces skills », « quel skill est le
  meilleur pour… ». Runs one task through several skills/agents and ranks them.
---

# Arena — comparer des skills

## Étapes

1. **Cadrer** : récupère la tâche à tester et la liste des concurrents (skills ou
   `subagent_type`). Si aucune liste n'est donnée, propose 2 à 4 candidats pertinents
   parmi `.claude/skills/` et `.claude/agents/`.
2. **Critères** : fixe 4 à 5 critères notés de 1 à 5 (exactitude, complétude, clarté,
   respect des consignes, coût/rapidité). Annonce-les avant de lancer.
3. **Combat** : lance chaque concurrent en parallèle via `Agent`, avec exactement le
   même prompt. Ne leur dis pas qu'ils sont comparés. Les tâches qui écrivent
   (boutique, fichiers) sont refusées : utilise uniquement des tâches en lecture
   seule ou sur des données d'exemple.
4. **Jugement** : note chaque résultat sur les critères, avec une phrase de
   justification. Ne favorise pas le plus long.
5. **Verdict** : tableau de classement + points forts/faibles de chacun + recommandation
   (quel skill utiliser, pour quel type de tâche).

## Format de sortie

| Rang | Concurrent | Total | Point fort | Point faible |
|------|------------|-------|------------|--------------|

Termine par une recommandation en une phrase.
