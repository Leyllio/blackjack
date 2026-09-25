# Blackjack

Projet réalisé dans le cadre d’un **TD de programmation Web : création d’un jeu de Blackjack en JavaScript**.

Ce projet est un jeu de Blackjack monojoueur entièrement exécutable dans le navigateur. Il reprend le principe des cartes HTML/CSS du TD précédent et ajoute la logique de jeu, le croupier et une gestion de mise.

> **Important :** les jetons utilisés dans le jeu sont strictement virtuels. Le projet ne comporte ni paiement, ni compte, ni système d’argent réel.

## Objectifs pédagogiques

Le projet permet de mettre en pratique :

- la création et le mélange d’un jeu de 52 cartes en JavaScript ;
- la manipulation du DOM et la création d’éléments HTML ;
- le calcul des valeurs des cartes, notamment la gestion des As ;
- l’utilisation d’une machine à états pour gérer le tour du joueur et celui du dealer ;
- la gestion des actions Tirer, Rester, Doubler et Séparer ;
- la mise en place d’une interface responsive et accessible ;
- la gestion d’un solde et de mises virtuelles.

## Règles du jeu

Les règles s’appuient sur les règles générales du Blackjack décrites dans [Règles.com — Blackjack](https://www.regles.com/jeux-cartes/black-jack.html). Le jeu reste volontairement simplifié et ne constitue pas une simulation complète des règles de casino.

### Le deck

- Le jeu contient 52 cartes : 4 familles × 13 valeurs.
- Les jokers ne sont pas utilisés.
- Les cartes sont mélangées au début de chaque donne.
- Une carte ne peut être tirée qu’une seule fois dans une même donne.

### Valeur des cartes

- Les cartes de 2 à 10 valent leur valeur nominale.
- Le Valet, la Dame et le Roi valent 10 points.
- L’As vaut 1 ou 11 points, selon la valeur la plus avantageuse pour le joueur.
- Si le total dépasse 21 avec un As compté 11, l’As est automatiquement recalculé à 1.

### Tour du joueur

- Le joueur reçoit deux cartes au début de la partie.
- Il peut tirer une carte supplémentaire ou rester.
- Si sa main dépasse 21, il perd immédiatement.
- Une main à 21 termine automatiquement le tour du joueur.
- Le joueur peut doubler dans les conditions autorisées.
- Deux cartes de même valeur peuvent être séparées pour former deux mains.
- Les As séparés reçoivent chacun une seule carte supplémentaire.

### Tour du dealer

- Le dealer reçoit deux cartes, dont une face cachée.
- La carte cachée est révélée après la fin du tour du joueur.
- Le dealer tire tant que son total est inférieur à 17.
- Le dealer s’arrête à 17 ou plus.
- Si le total du joueur et celui du dealer sont identiques, la donne est nulle.

### Règles complémentaires implémentées

- Le blackjack naturel est payé 3:2.
- Une assurance peut être proposée lorsque le dealer montre un As ; elle est réglée à 2:1.
- Lorsque le joueur possède un blackjack naturel face à un As du dealer, il peut choisir l’even money ou conserver le paiement 3:2.
- Les doubles et les séparations sont pris en compte dans le calcul des mises.

### Ajouts réalisés hors TD

En complément des trois parties du TD, j’ai ajouté personnellement les fonctionnalités suivantes :

- le **système d’assurance** lorsque le dealer montre un As ;
- la possibilité de **doubler** la mise et de recevoir une carte supplémentaire ;
- la possibilité de **séparer** une main en deux mains lorsque les conditions sont remplies.

Ces ajouts étendent le jeu de base et ne font pas partie de la version minimale décrite dans l’énoncé du TD.

## Gestion des jetons

Le joueur commence chaque nouvelle session avec **1 000 jetons**.

Avant de lancer une donne, il choisit une mise :

- la mise doit être un nombre entier ;
- elle doit être supérieure ou égale à 1 ;
- elle ne peut pas dépasser le solde disponible.

La mise est retirée du solde au début de la donne :

- victoire ordinaire : le joueur récupère sa mise et reçoit un gain égal à celle-ci ;
- défaite : le joueur perd sa mise ;
- égalité : la mise est remboursée ;
- blackjack naturel : paiement 3:2 ;
- double : la mise de la main est doublée ;
- split : chaque main reçoit une mise identique.

Le solde est conservé pendant la session. Si le joueur n’a plus assez de jetons pour miser au moins 1, la partie est terminée. Le bouton **Nouvelle partie** permet alors de réinitialiser le solde à 1 000 jetons.

Un rechargement de la page réinitialise également la session à 1 000 jetons : aucune donnée n’est envoyée à un serveur.

## Fonctionnement de l’interface

L’utilisateur peut :

1. saisir une mise dans la fenêtre de début ;
2. cliquer sur **Commencer la partie** ;
3. tirer une carte avec **Tirer une carte** ;
4. terminer son tour avec **Rester** ;
5. utiliser **Doubler** ou **Séparer** lorsque ces actions sont disponibles ;
6. choisir l’assurance ou l’even money lorsque la table le demande ;
7. consulter le résultat et le solde ;
8. lancer une nouvelle donne avec **Jouer une main** ou **Nouvelle partie**.

L’interface comprend également un bouton permettant de basculer entre les thèmes clair et sombre.

## Technologies utilisées

- **HTML5** : structure de la page et éléments accessibles ;
- **CSS3** : mise en page, animations, thème clair/sombre et responsive ;
- **JavaScript** : logique du jeu, gestion du deck, du DOM, des mises et des états ;
- **Google Fonts** : Fira Sans et Roboto Slab, avec polices système de repli.

Aucun framework, compilateur, serveur ou dépendance npm n’est nécessaire pour faire fonctionner le projet.

## Lancer le projet en local

Le projet peut être ouvert directement dans un navigateur. Pour servir les fichiers avec un petit serveur local, exécuter :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000` dans un navigateur.

Une connexion Internet est nécessaire pour charger les polices Google. Sans connexion, le jeu utilise les polices système disponibles.

## Structure du projet

```text
.
├── index.html              # Point d’entrée de la page
├── css/
│   └── style.css           # Styles, animations et thèmes
├── script/
│   └── bjtable.js          # Logique complète du Blackjack
├── img/
│   ├── club.svg            # Symboles des familles
│   ├── diamond.svg
│   ├── heart.svg
│   ├── moon-stars.svg
│   ├── poker-chip.svg
│   ├── spade.svg
│   └── sun.svg
└── color palette           # Palette de couleurs du projet
```

## Architecture de la logique JavaScript

La logique principale est organisée autour de plusieurs responsabilités :

- `createDeck()` crée les 52 cartes ;
- `shuffle()` les mélange ;
- `drawCard()` retire une carte du deck ;
- `calculateTotal()` calcule la valeur d’une main et gère les As ;
- les fonctions de rendu mettent à jour les cartes, les totaux, les actions et le solde ;
- la machine à états gère les étapes `idle`, `insurance`, `even-money`, `player`, `dealer` et `over` ;
- les fonctions de règlement calculent les gains, les pertes, les égalités et les éventuelles mises annexes.

## Vérification rapide

La syntaxe JavaScript peut être contrôlée avec :

```bash
node --check script/bjtable.js
```
