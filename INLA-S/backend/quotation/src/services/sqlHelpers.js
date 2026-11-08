function salesInsertQuery(txn, cycleId, quotationId, sales) {
  const { sets, params } = salesUpdateSets(sales);
  if (!sets.length) {
    return txn.query(
      `INSERT INTO quotation_sales_data (workflow_cycle_id, quotation_id) VALUES ($1, $2)`,
      [cycleId, quotationId]
    );
  }
  const columns = sets.map((s) => s.split(" = ")[0]).join(", ");
  const placeholders = sets
    .map((setLine, i) => {
      const cast = setLine.includes("::") ? setLine.slice(setLine.indexOf("::")) : "";
      return `$${i + 3}${cast}`;
    })
    .join(", ");
  return txn.query(
    `INSERT INTO quotation_sales_data (workflow_cycle_id, quotation_id, ${columns})
     VALUES ($1, $2, ${placeholders})`,
    [cycleId, quotationId, ...params]
  );
}

function salesUpdateSets(sales) {
  const sets = [];
  const params = [];
  const map = [
    ["salesNote", "sales_note"],
    ["boxType", "box_type"],
    ["lengthMm", "length_mm"],
    ["widthMm", "width_mm"],
    ["heightMm", "height_mm"],
    ["dimensionType", "dimension_type", "dimension_type_enum"],
    ["material", "material"],
    ["layerCount", "layer_count"],
    ["fluteType", "flute_type"],
    ["productLoadKg", "product_load_kg"],
    ["printingDescription", "printing_description"],
    ["printColorCount", "print_color_count"],
    ["printSideCount", "print_side_count"],
    ["quantityPieces", "quantity_pieces"],
    ["deliveryLocation", "delivery_location"],
    ["desiredDeliveryTime", "desired_delivery_time"],
    ["additionalRequirements", "additional_requirements"],
  ];
  for (const [key, column, enumType] of map) {
    if (sales[key] !== undefined) {
      params.push(sales[key]);
      const cast = enumType ? `::${enumType}` : "";
      sets.push(`${column} = $${params.length}${cast}`);
    }
  }
  return { sets, params };
}

function versionWhere(version, params) {
  if (version === undefined) return "";
  params.push(version);
  return ` AND version = $${params.length}`;
}

module.exports = { salesUpdateSets, salesInsertQuery, versionWhere };
