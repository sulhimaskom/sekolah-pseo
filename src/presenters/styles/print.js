'use strict';

// Print styles (@media print).
module.exports = `/* Print styles */
@media print {
  * {
    background: white !important;
    color: black !important;
  }

  html, body {
    font-size: 12pt;
  }

  .skip-link {
    display: none !important;
  }

  header[role="banner"] {
    position: static;
    border-bottom: 1pt solid #000;
    box-shadow: none;
    padding: 0;
  }

  nav {
    display: none !important;
  }

  main[role="main"] {
    max-width: 100%;
    padding: 0;
    margin: 0;
  }

  article {
    box-shadow: none;
    border: 1pt solid #000;
  }

  article h1 {
    font-size: 18pt;
    border-bottom: 1pt solid #000;
  }

  .school-details-list {
    display: block;
  }

  .school-details-list dt,
  .school-details-list dd {
    display: inline;
  }

  .school-details-list dt::after {
    content: ": ";
  }

  .school-details-list dd::after {
    content: "; ";
    display: block;
    margin-bottom: 8pt;
  }

  .badge {
    border: 1pt solid #000;
    padding: 2pt 4pt;
    font-size: 10pt;
  }

  footer {
    border-top: 1pt solid #000;
    margin-top: 12pt;
    font-size: 10pt;
  }

  a {
    text-decoration: underline;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
  }

  @page {
    margin: 2cm;
  }
}
`;
