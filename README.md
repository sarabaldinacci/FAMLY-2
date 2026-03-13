# Famly — Istruzioni per Sara

---

## FASE 1 — Pubblica il codice su GitHub (una volta sola)

### 1.1 — Crea account GitHub se non ce l'hai
- Vai su **github.com** → "Sign up"
- Usa email e password

### 1.2 — Crea un nuovo repository
1. Vai su **github.com/new**
2. Scrivi come nome: `famly`
3. Lascia tutto il resto come sta (privato o pubblico, entrambi funzionano)
4. Clicca **"Create repository"**

### 1.3 — Carica il codice
1. Nella pagina del repository appena creato,  clicca **"uploading an existing file"** ok
2. Trascina dentro TUTTI i file e le cartelle dalla cartella `famly/` che ti ho dato
3. Scrivi come messaggio: `primo caricamento`
4. Clicca **"Commit changes"**

> ⚠️ Assicurati di caricare anche le cartelle: `src/`, `prisma/`, `public/`

---

## FASE 2 — Database gratuito su Neon (5 minuti)

L'app ha bisogno di un database per salvare i dati. Usiamo Neon, gratuito.

1. Vai su **neon.tech** → "Sign up" (puoi usare il tuo account Google)
2. Clicca **"Create a project"**
3. Nome: `famly`, regione: **Europe West** → Clicca "Create"
4. Vedrai una schermata con una stringa tipo:
   ```
   postgresql://sara:xxxx@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Copia questa stringa** — ti servirà nel passo successivo

---

## FASE 3 — Pubblica su Vercel (5 minuti)

1. Vai su **vercel.com** → "Sign up" → scegli **"Continue with GitHub"**
2. Autorizza Vercel ad accedere ai tuoi repository GitHub
3. Clicca **"Add New Project"**
4. Vedrai il repository `famly` — clicca **"Import"**
5. Nella sezione **"Environment Variables"** aggiungi queste due voci:

   | Nome | Valore |
   |------|--------|
   | `DATABASE_PROVIDER` | `postgresql` |
   | `DATABASE_URL` | *(incolla la stringa copiata da Neon)* |

6. Clicca **"Deploy"** e aspetta 2-3 minuti

Vercel ti darà un indirizzo tipo: `famly-sara.vercel.app`

---

## FASE 4 — Inizializza il database (una volta sola)

Dopo il primo deploy, devi creare le tabelle e caricare i dati di default.

1. Vai su **vercel.com** → il tuo progetto `famly`
2. Clicca su **"Settings"** → **"Functions"** oppure cerca **Vercel CLI**

> Alternativa più semplice: nella schermata Neon, clicca "SQL Editor" e esegui questo comando per verificare che il database sia connesso. Il resto lo fa Prisma automaticamente al primo avvio.

---

## FASE 5 — Aggiungi l'app al telefono (come app)

### Su iPhone (Safari):
1. Apri Safari e vai all'indirizzo Vercel (es. `famly-sara.vercel.app`)
2. Tocca l'icona **condividi** (il quadratino con la freccia in su)
3. Scorri e tocca **"Aggiungi a schermata Home"**
4. Lascia il nome "Famly" → tocca **"Aggiungi"**

### Su Android (Chrome):
1. Apri Chrome e vai all'indirizzo
2. Tocca i tre puntini in alto a destra
3. Tocca **"Aggiungi a schermata Home"** o **"Installa app"**

---

## Dopo l'installazione

L'app si apre come una vera app, senza barra del browser.

**Come usarla:**
- **Home**: vedi subito cosa c'è in casa e quante cene copre
- **Dispensa**: aggiungi ingredienti, specifica le porzioni (tocca la matita su ogni proteina)
- **Planner**: pianifica i pasti giorno per giorno
- **Suggerisci**: l'app ti consiglia cosa cucinare stasera in base a quello che hai
- **Impostazioni**: vedi i membri della famiglia e attiva/disattiva le regole

---

## In caso di problemi

Se qualcosa non funziona scrivimi e ti aiuto. Puoi anche aprire una issue su GitHub descrivendo il problema.

