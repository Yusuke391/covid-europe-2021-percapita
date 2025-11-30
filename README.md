# COVID-19 per-capita analysis (2021)

## 目的
- 2021年の各国COVID-19累計感染者数を人口で割り、10万人あたりに正規化した値（variable i）を算出。
- GDP per capita（variable ii）と都市人口密度（variable iii）を合わせ、相関や散布図用のExcelを作成。

## データ前提
- 各国ごとのCSVに以下の列がある想定（Google Cloud COVID-19 Open Data由来の構造）:
  - `date`（YYYY-MM-DD）
  - `cumulative_confirmed`（累計感染者数）
  - `new_confirmed`（日次新規、今回の計算では未使用）
  - `population`（総人口、固定値）
  - `gdp_per_capita_usd`（多くの国では日次同値。2021年行で平均を計算）
  - `population_urban`, `area_urban_sq_km`（都市人口密度計算用、固定値）
- 対象国: Germany, France, Sweden, Netherlands, Norway, Poland, Hungary, Portugal, Greece, Czechia, Romania, Bulgaria, Serbia, Ukraine, Albania（15カ国）。

## 計算ロジック（analyze.js）
- variable (i): `ConfirmedPer100k2021`
  - 2021年の日付行を走査し、最後に出現する`cumulative_confirmed`を採用（年末時点の累計を想定）。
  - `population`で割り、10万人あたりに換算。
  - 同時に1人あたり値（`ConfirmedPerCapita2021`）も出力。
- variable (ii): `GDPPerCapitaUSD`
  - 2021年の日付行にある`gdp_per_capita_usd`を平均（全欠損ならファイル内で最初に見つかった値をフォールバック）。
- variable (iii): `UrbanDensityPerSqKm`
  - `population_urban / area_urban_sq_km`（固定値。欠損があれば空欄）。
- 出力: `covid_2021_summary.xlsx`（シート名: `2021 Summary`）。

## 使い方
```bash
npm install
npm run analyze
```
- カレントディレクトリにある各国CSVを読み込み、`covid_2021_summary.xlsx`を上書き生成します。

## 留意点・調整案
- CSVが日付順でない場合は年末値がずれるので、必要なら日付でソートする処理を追加してください。
- 2021年の新規感染者合計を使いたい場合は、`new_confirmed`を年内で合計する形に切り替えできます。
- 入力列が欠損している国は該当指標が空欄になります。除外ルールを設ける場合は分析側でフィルタしてください。

---

# (English) COVID-19 per-capita analysis (2021)

## Goal
- Compute per-capita COVID-19 cases in 2021 (per 100k) for European countries.
- Combine with GDP per capita and urban population density for correlation / scatterplot use.

## Data assumptions
- Country CSVs include: `date`, `cumulative_confirmed`, `new_confirmed` (unused here), `population`, `gdp_per_capita_usd`, `population_urban`, `area_urban_sq_km`.
- Target countries: Germany, France, Sweden, Netherlands, Norway, Poland, Hungary, Portugal, Greece, Czechia, Romania, Bulgaria, Serbia, Ukraine, Albania.

## Computation logic (analyze.js)
- Variable (i): `ConfirmedPer100k2021`
  - Scan 2021 rows; take the last `cumulative_confirmed` (end-of-year cumulative).
  - Divide by `population`, then scale to per 100k. Also output per-capita (`ConfirmedPerCapita2021`).
- Variable (ii): `GDPPerCapitaUSD`
  - Average `gdp_per_capita_usd` over 2021 rows (fallback to the first available value if 2021 is missing).
- Variable (iii): `UrbanDensityPerSqKm`
  - `population_urban / area_urban_sq_km` (single, time-invariant value).
- Output: `covid_2021_summary.xlsx` (sheet `2021 Summary`).

## Usage
```bash
npm install
npm run analyze
```
- Reads all country CSVs in the current directory and rewrites `covid_2021_summary.xlsx`.

## Notes / adjustments
- If CSV rows are unsorted by date, sort before picking the year-end value.
- To use 2021 total new cases instead, sum `new_confirmed` within 2021.
- Missing input columns yield empty cells; apply exclusion rules on the analysis side if needed.
