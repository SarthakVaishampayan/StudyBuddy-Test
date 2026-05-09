const pdfParse = require('pdf-parse');
console.log("DEFAULT EXPORT TYPE:", typeof pdfParse);
console.log("KEYS:", Object.keys(pdfParse));
if (typeof pdfParse !== 'function') {
  console.log("pdfParse.default TYPE:", typeof pdfParse.default);
  console.log("pdfParse.pdf TYPE:", typeof pdfParse.pdf);
}
