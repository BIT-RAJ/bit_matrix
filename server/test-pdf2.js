const pdfParse = require('pdf-parse');
console.log(pdfParse.default ? typeof pdfParse.default : 'no default');
console.log(pdfParse.PDFParse ? typeof pdfParse.PDFParse : 'no PDFParse');
