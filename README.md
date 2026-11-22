# Folio

A trainable document organiser by **Diana-Mariia Shevchenko**. Upload a document, extract its text, and sort it into a category learned from examples.

**[Try the live demo](https://dianashalai.github.io/folio/)** · **[Watch the original recording](https://drive.google.com/file/d/1kwpkw0s2s_Xr4N_jTPark5ROJvvHdfmC/view)**

## What it does

- Includes all **37 training examples** from the original Folio, across five categories: Resume, Advertisement, Lab test, Insurance correspondence, and Invoice.
- Reads PDF, DOCX, TXT, JPG, PNG, WEBP, and TIFF. OCR supports English and German.
- Lets visitors create categories, add training examples, correct text and categories, search files, and download selected originals in a ZIP.
- Provides a basic invoice summary with explicit totals, currencies, and invoice dates.
- Stores each visitor's workspace in their own browser. No sign-in, server, API key, or shared database is required.
- Includes English and German interfaces, synthetic sample files, and the original product recording.

## Preserving the original learning

The original classifier is weighted TF-IDF with cosine similarity to individual labelled examples. The first ten tokens have a weight of three; subsequent tokens have a weight of one. The highest example similarity determines the category when there is a non-zero match. A similarity score is **not** a calibrated confidence estimate.

`public/data/model.json` retains the original example vectors and document frequencies. Tokens are represented by SHA-256 digests. There are no raw source documents, training document filenames, or original training texts in the public model.

Before migration, the exported model was compared with the original classifier on all **66 documents** in the source workspace: predicted categories and scores matched exactly. This verifies migration fidelity; it is **not** a claim of classification accuracy on unseen documents. One supplied synthetic advertisement sample is classified as Resume by the original model too; use a correction to demonstrate additional training.

Token hashing reduces exposure of readable training content but is not encryption or a formal privacy guarantee. Vocabulary hypotheses can be checked against hashes. Do not use this format as a privacy guarantee for sensitive training material.

The private backup of the original application's source, database snapshot, and original files is kept separately from this repository. No production credentials or ChatGPT authentication configuration are needed here.

## Visitor data

New documents and added training are saved using IndexedDB on this site's origin. They stay in the visitor's browser and are not uploaded to the original Folio or any document-processing service. OCR libraries and language models are served by this site. The interface loads optional fonts from Google Fonts, and the recording is embedded from Google Drive only when opened.

Use **Export training** to download added training texts and categories. Import that file in another browser to restore those additional examples. The included 37-example model is always supplied by the application; training exports do not include original file bytes. Use **Download ZIP** to save originals separately. Clearing browser data removes the visitor's local workspace.

Files are limited to 20 MB each, PDF/TIFF to 30 pages, and ZIP exports to 50 MB. OCR quality depends on scan quality. Invoice values are extracted heuristically and require review.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run build
npm run preview
```

For development, run `node scripts/prepare-assets.mjs` once after installation, then `npm run dev`. The build copies the version-matched PDF worker, OCR workers, WebAssembly cores, and language data from the locked dependencies. These generated assets are not committed.

```sh
npm test
```

## Publishing

The GitHub Actions workflow builds and publishes to GitHub Pages whenever `main` changes. Pages must use **GitHub Actions** as its publishing source. Vite uses relative asset paths, so the application works under a project subdirectory.

## Project background

Folio was conceived and developed as an AI-assisted MVP, iterated through document recognition, example-based training, classification, correction, and invoice analysis. The portfolio edition preserves its original classification behaviour while replacing the private server-side storage with a browser-local workspace.
