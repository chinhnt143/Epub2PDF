export const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

  @page {
    size: A4;
    margin: 20mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'Merriweather', serif;
    font-size: 11pt;
    line-height: 1.6;
    text-align: justify;
    color: #000 !important;
    background: #fff !important;
    padding: 0;
    margin: 0;
    -webkit-print-color-adjust: exact;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    color: #000;
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  h1 {
    font-size: 24pt;
    margin-top: 0;
    margin-bottom: 1.5em;
    border-bottom: 2px solid #000;
    padding-bottom: 0.5em;
    page-break-before: always;
  }

  h2 {
    font-size: 18pt;
    margin-top: 2em;
    margin-bottom: 1em;
  }

  h3 {
    font-size: 14pt;
    margin-top: 1.5em;
    margin-bottom: 0.8em;
  }

  p {
    margin: 0 0 1em 0;
    orphans: 3;
    widows: 3;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 2em auto;
    page-break-inside: avoid;
  }

  figure {
    margin: 2em 0;
    page-break-inside: avoid;
  }

  figcaption {
    text-align: center;
    font-size: 0.9em;
    font-style: italic;
    margin-top: 0.5em;
    color: #444;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2em 0;
    page-break-inside: avoid;
    font-size: 0.9em;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background-color: #f5f5f5 !important;
    font-weight: 600;
  }

  blockquote {
    border-left: 3px solid #000;
    margin: 1.5em 0;
    padding: 0.5em 0 0.5em 1.5em;
    font-style: italic;
    background-color: transparent;
  }

  code, pre {
    font-family: 'Courier New', Courier, monospace;
    background-color: #f5f5f5 !important;
    font-size: 0.9em;
  }

  pre {
    padding: 1em;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: avoid;
  }

  a {
    color: #000;
    text-decoration: underline;
    text-decoration-thickness: 1px;
  }

  /* Utility classes often found in EPUBs */
  .page-break {
    page-break-before: always;
  }
  
  .center {
    text-align: center;
  }
`;