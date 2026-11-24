# Pulse 3D

> English | [ภาษาไทย](README.th.md)

A Thai-language website for submitting files to request a 3D printing quote.

## Working
- Accepts STL, 3MF, OBJ, up to 50 MB per request
- Choice of PLA, PETG, ABS, TPU (example list; actual stock must be confirmed)
- Infill density 5–100%, 4 infill patterns, 4 seam types
- Quantity, email, notes and job summary
- API stores files and requests in Cloudflare R2, with access checked via Sites identity

## Not yet open to the general public
- The website is published privately for the owner
- Google login is not connected yet, because there is no Google Client ID yet and how the hosting supports external identity must be confirmed first
- The Google button does not simulate a successful login
- There is no back-office page to view requests, shop notifications, payment, or slicer-based price calculation yet
- File extension and size are checked; mesh integrity is not checked yet
- Submitting a request is not a price confirmation or a production order

## Main files
app/studio.tsx : web page and options
app/globals.css : appearance and screen sizes
app/api/orders/route.ts : receives files and records requests
.openai/hosting.json : website ID and R2 binding

## For maintainers
Install Node.js as specified in package.json, then use npm install and npm run dev
Use npm run build to create a production build
Do not put passwords or client secrets in the source code
