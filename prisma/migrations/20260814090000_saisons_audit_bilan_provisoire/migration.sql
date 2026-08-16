-- Ajout de l'action d'audit pour la génération d'un bilan provisoire.
--
-- Cette migration ne contient QUE cet ALTER TYPE, volontairement : PostgreSQL
-- interdit d'utiliser une valeur d'enum dans la même transaction que son
-- ajout, et `prisma migrate` enveloppe chaque fichier de migration dans une
-- transaction. La valeur doit donc être committée avant que le code ne
-- l'émette.
ALTER TYPE "AuditAction" ADD VALUE 'GENERER_BILAN_PROVISOIRE';
