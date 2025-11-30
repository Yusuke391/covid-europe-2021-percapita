const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');

const dataDir = '.';

const csvFiles = fs.readdirSync(dataDir).filter((file) => file.endsWith('.csv'));
if (csvFiles.length === 0) {
  console.error('No CSV files found in the current directory.');
  process.exit(1);
}

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const results = csvFiles.map((file) => {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true });

  const countryName = rows[0]?.country_name || file.replace(/\.csv$/i, '');

  let gdpPerCapita = null;
  let urbanDensity = null;
  let cumulativeConfirmed2021 = null;
  let population = null;
  const gdpSamples2021 = [];

  for (const row of rows) {
    const gdp = parseNumber(row.gdp_per_capita_usd);
    if (row.date && row.date.startsWith('2021-') && gdp !== null) {
      gdpSamples2021.push(gdp);
    }
    if (gdpPerCapita === null && gdp !== null) {
      gdpPerCapita = gdp; // fallback if 2021 data missing
    }

    if (population === null) {
      population = parseNumber(row.population);
    }

    if (urbanDensity === null) {
      const popUrban = parseNumber(row.population_urban);
      const areaUrban = parseNumber(row.area_urban_sq_km);
      if (popUrban !== null && areaUrban) {
        urbanDensity = popUrban / areaUrban;
      }
    }

    if (row.date && row.date.startsWith('2021-')) {
      const cum = parseNumber(row.cumulative_confirmed);
      if (cum !== null) cumulativeConfirmed2021 = cum; // rows are chronological
    }
  }

  if (gdpSamples2021.length > 0) {
    const sum = gdpSamples2021.reduce((acc, val) => acc + val, 0);
    gdpPerCapita = sum / gdpSamples2021.length; // average over 2021 values
  }

  const confirmedPerCapita =
    cumulativeConfirmed2021 !== null && population
      ? cumulativeConfirmed2021 / population
      : null;
  const confirmedPer100k =
    confirmedPerCapita !== null ? confirmedPerCapita * 100_000 : null;

  return {
    Country: countryName,
    ConfirmedPerCapita2021: confirmedPerCapita,
    ConfirmedPer100k2021: confirmedPer100k,
    GDPPerCapitaUSD: gdpPerCapita,
    UrbanDensityPerSqKm: urbanDensity,
  };
});

const sheet = xlsx.utils.json_to_sheet(results, {
  header: [
    'Country',
    'ConfirmedPerCapita2021',
    'ConfirmedPer100k2021',
    'GDPPerCapitaUSD',
    'UrbanDensityPerSqKm',
  ],
});
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, sheet, '2021 Summary');

const outputPath = path.join(dataDir, 'covid_2021_summary.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log(`Wrote summary for ${results.length} countries to ${outputPath}`);
