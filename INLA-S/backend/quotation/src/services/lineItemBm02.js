/** BM02 per-line fields — `document/annex/BM02-field-map.md` */

const INK_COVERAGE_BANDS = ["le_30", "le_50", "le_70", "le_100"];

/** API camelCase → DB snake_case (insert/update params order). */
const LINE_ITEM_BM02_COLUMNS = [
  ["itemCode", "item_code"],
  ["fgCode", "fg_code"],
  ["sapCode", "sap_code"],
  ["itemName", "item_name"],
  ["fluteType", "flute_type"],
  ["lengthMm", "length_mm"],
  ["widthMm", "width_mm"],
  ["heightMm", "height_mm"],
  ["innerLengthMm", "inner_length_mm"],
  ["innerWidthMm", "inner_width_mm"],
  ["innerHeightMm", "inner_height_mm"],
  ["outerLengthMm", "outer_length_mm"],
  ["outerWidthMm", "outer_width_mm"],
  ["outerHeightMm", "outer_height_mm"],
  ["layerCount", "layer_count"],
  ["productWeightG", "product_weight_g"],
  ["printColorCount", "print_color_count"],
  ["quantity", "quantity"],
  ["deliveryLocation", "delivery_location"],
  ["salesLineNote", "sales_line_note"],
  ["burstWithDriverNote", "burst_with_driver_note"],
  ["burstWithoutDriverNote", "burst_without_driver_note"],
  ["compressionStrengthNote", "compression_strength_note"],
  ["paperStructureNote", "paper_structure_note"],
  ["unitsPerBundle", "units_per_bundle"],
  ["bundlesPerPallet", "bundles_per_pallet"],
  ["palletStackStrapped", "pallet_stack_strapped"],
  ["palletStackUnstrapped", "pallet_stack_unstrapped"],
  ["shrinkWrap", "shrink_wrap"],
  ["noShrinkWrap", "no_shrink_wrap"],
  ["inkCoverageBand", "ink_coverage_band"],
  ["lineRemark", "line_remark"],
];

const LINE_ITEM_DB_COLUMN_LIST = LINE_ITEM_BM02_COLUMNS.map(([, col]) => col).join(", ");

function num(row, col) {
  return row[col] != null ? Number(row[col]) : null;
}

function mapLineItemFromDb(row) {
  if (!row) return null;
  const innerL = num(row, "inner_length_mm");
  const innerW = num(row, "inner_width_mm");
  const innerH = num(row, "inner_height_mm");
  const legacyL = num(row, "length_mm");
  const legacyW = num(row, "width_mm");
  const legacyH = num(row, "height_mm");
  return {
    id: row.id,
    lineNumber: row.line_number,
    itemCode: row.item_code ?? null,
    fgCode: row.fg_code ?? null,
    sapCode: row.sap_code ?? null,
    itemName: row.item_name,
    fluteType: row.flute_type,
    lengthMm: innerL ?? legacyL,
    widthMm: innerW ?? legacyW,
    heightMm: innerH ?? legacyH,
    innerLengthMm: innerL,
    innerWidthMm: innerW,
    innerHeightMm: innerH,
    outerLengthMm: num(row, "outer_length_mm"),
    outerWidthMm: num(row, "outer_width_mm"),
    outerHeightMm: num(row, "outer_height_mm"),
    layerCount: row.layer_count ?? null,
    productWeightG: row.product_weight_g ?? null,
    printColorCount: row.print_color_count ?? null,
    quantity: row.quantity,
    deliveryLocation: row.delivery_location ?? null,
    salesLineNote: row.sales_line_note ?? null,
    burstWithDriverNote: row.burst_with_driver_note ?? null,
    burstWithoutDriverNote: row.burst_without_driver_note ?? null,
    compressionStrengthNote: row.compression_strength_note ?? null,
    paperStructureNote: row.paper_structure_note ?? null,
    unitsPerBundle: row.units_per_bundle ?? null,
    bundlesPerPallet: row.bundles_per_pallet ?? null,
    palletStackStrapped: row.pallet_stack_strapped ?? null,
    palletStackUnstrapped: row.pallet_stack_unstrapped ?? null,
    shrinkWrap: row.shrink_wrap ?? null,
    noShrinkWrap: row.no_shrink_wrap ?? null,
    inkCoverageBand: row.ink_coverage_band ?? null,
    unitPrice: row.unit_price != null ? Number(row.unit_price) : null,
    lineRemark: row.line_remark ?? null,
  };
}

function lineItemBm02InsertPlaceholders(startIndex) {
  return LINE_ITEM_BM02_COLUMNS.map(([, col], i) => {
    const n = startIndex + i;
    if (col === "ink_coverage_band") return `$${n}::ink_coverage_band_enum`;
    return `$${n}`;
  }).join(", ");
}

function lineItemBm02Params(line) {
  return LINE_ITEM_BM02_COLUMNS.map(([apiKey]) => {
    const v = line[apiKey];
    return v === undefined ? null : v;
  });
}

/** Column list for resubmit/clone INSERT SELECT from aliased `li`. */
const LINE_ITEM_COPY_COLUMN_LIST = LINE_ITEM_DB_COLUMN_LIST;

module.exports = {
  INK_COVERAGE_BANDS,
  LINE_ITEM_BM02_COLUMNS,
  LINE_ITEM_DB_COLUMN_LIST,
  LINE_ITEM_COPY_COLUMN_LIST,
  mapLineItemFromDb,
  lineItemBm02InsertPlaceholders,
  lineItemBm02Params,
};
