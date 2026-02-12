diff --git a/README.md b/README.md
index 1d67aa17a1cf6065407edb12695c4721ee93cf58..aa1817224fb1169cf56dd9daae8e481db67845b0 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,34 @@
-# elforbrukning
\ No newline at end of file
+# Elförbrukning – loggbok
+
+En enkel webbapp för att logga mätarställning och följa elförbrukning för:
+
+- **Storhuset** (huvudmätare)
+- **Attefallshuset**
+
+## Funktioner
+
+- Alla månader (jan–dec) finns för varje år.
+- Du fyller i mätarställning per månad.
+- Månadsförbrukning räknas automatiskt som differens från föregående månad.
+- Storhusets förbrukning beräknas som:
+  - `Huvudmätare månadsförbrukning - Attefallshuset månadsförbrukning`
+- Årssummering för båda husen.
+- Stöd för flera år (lagras i webbläsaren via LocalStorage).
+- Årsjämförelse mot föregående år.
+- Cirkeldiagram med färger:
+  - **Storhuset: blå**
+  - **Attefallshuset: röd**
+
+## Kom igång
+
+Öppna `index.html` i webbläsaren.
+
+Alternativt kör lokal server:
+
+```bash
+python3 -m http.server 4173
+```
+
+Öppna sedan:
+
+`http://localhost:4173`
