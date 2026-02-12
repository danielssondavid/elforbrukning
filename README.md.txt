diff --git a/README.md b/README.md
index 1d67aa17a1cf6065407edb12695c4721ee93cf58..b94acd5164f5856425abb99dadcfbcf8bc3ed2da 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,78 @@
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
+- Januari räknas mot decembervärdet från föregående år (om det finns sparat).
+- Storhusets förbrukning beräknas som:
+  - `Huvudmätare månadsförbrukning - Attefallshuset månadsförbrukning`
+- Årssummering för båda husen.
+- Stöd för flera år (lagras i webbläsaren via LocalStorage).
+- Årsjämförelse mot föregående år.
+- Månadsjämförelse mot samma månad föregående år (plus/minus i %).
+- Cirkeldiagram med färger:
+  - **Storhuset: blå**
+  - **Attefallshuset: röd**
+- Linjediagram längst ner för att jämföra flera år samtidigt för:
+  - **Totalt**
+  - **Storhuset**
+  - **Attefallshuset**
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
+
+## Lägga upp projektet på GitHub
+
+Om det "inte funkar att lägga in i GitHub" kan du följa denna säkra checklista från början:
+
+```bash
+# 1) Stå i projektmappen
+cd /workspace/elforbrukning
+
+# 2) Kontrollera att git-repo finns
+git status
+
+# 3) Lägg till och committa ändringar
+git add .
+git commit -m "Uppdatera elförbrukningsloggbok"
+
+# 4) Koppla ditt GitHub-repo (byt URL till din)
+git remote add origin https://github.com/DITT-NAMN/elforbrukning.git
+
+# 5) Pusha upp koden
+git push -u origin HEAD
+```
+
+Om du redan har `origin` satt:
+
+```bash
+git remote -v
+git push
+```
+
+Vanliga fel:
+
+- **`remote origin already exists`**  
+  Kör: `git remote set-url origin https://github.com/DITT-NAMN/elforbrukning.git`
+- **`Authentication failed`**  
+  Logga in i GitHub CLI (`gh auth login`) eller använd Personal Access Token.
+- **`Repository not found`**  
+  Kontrollera att repot finns på GitHub och att URL:en stämmer exakt.
