-- Up Migration
-- BM02 sales request: per-line cartons + SAL-07 customer_request_no (`2026-11-08` delta).

CREATE TYPE public.ink_coverage_band_enum AS ENUM ('le_30', 'le_50', 'le_70', 'le_100');

ALTER TABLE public.quotation_sales_data
  ADD COLUMN customer_request_no text;

ALTER TABLE public.quotation_line_items
  ADD COLUMN fg_code text,
  ADD COLUMN sap_code text,
  ADD COLUMN inner_length_mm numeric(18, 2),
  ADD COLUMN inner_width_mm numeric(18, 2),
  ADD COLUMN inner_height_mm numeric(18, 2),
  ADD COLUMN outer_length_mm numeric(18, 2),
  ADD COLUMN outer_width_mm numeric(18, 2),
  ADD COLUMN outer_height_mm numeric(18, 2),
  ADD COLUMN layer_count integer,
  ADD COLUMN product_weight_g integer,
  ADD COLUMN print_color_count integer,
  ADD COLUMN delivery_location text,
  ADD COLUMN sales_line_note text,
  ADD COLUMN burst_with_driver_note text,
  ADD COLUMN burst_without_driver_note text,
  ADD COLUMN compression_strength_note text,
  ADD COLUMN paper_structure_note text,
  ADD COLUMN units_per_bundle integer,
  ADD COLUMN bundles_per_pallet integer,
  ADD COLUMN pallet_stack_strapped boolean,
  ADD COLUMN pallet_stack_unstrapped boolean,
  ADD COLUMN shrink_wrap boolean,
  ADD COLUMN no_shrink_wrap boolean,
  ADD COLUMN ink_coverage_band public.ink_coverage_band_enum,
  ADD CONSTRAINT quotation_line_items_inner_length_chk
    CHECK (inner_length_mm IS NULL OR inner_length_mm > 0),
  ADD CONSTRAINT quotation_line_items_inner_width_chk
    CHECK (inner_width_mm IS NULL OR inner_width_mm > 0),
  ADD CONSTRAINT quotation_line_items_inner_height_chk
    CHECK (inner_height_mm IS NULL OR inner_height_mm > 0),
  ADD CONSTRAINT quotation_line_items_outer_length_chk
    CHECK (outer_length_mm IS NULL OR outer_length_mm > 0),
  ADD CONSTRAINT quotation_line_items_outer_width_chk
    CHECK (outer_width_mm IS NULL OR outer_width_mm > 0),
  ADD CONSTRAINT quotation_line_items_outer_height_chk
    CHECK (outer_height_mm IS NULL OR outer_height_mm > 0),
  ADD CONSTRAINT quotation_line_items_layer_count_chk
    CHECK (layer_count IS NULL OR layer_count > 0),
  ADD CONSTRAINT quotation_line_items_product_weight_g_chk
    CHECK (product_weight_g IS NULL OR product_weight_g > 0),
  ADD CONSTRAINT quotation_line_items_print_color_count_chk
    CHECK (print_color_count IS NULL OR print_color_count >= 0),
  ADD CONSTRAINT quotation_line_items_units_per_bundle_chk
    CHECK (units_per_bundle IS NULL OR units_per_bundle > 0),
  ADD CONSTRAINT quotation_line_items_bundles_per_pallet_chk
    CHECK (bundles_per_pallet IS NULL OR bundles_per_pallet > 0);

UPDATE public.quotation_line_items
SET
  inner_length_mm = length_mm,
  inner_width_mm = width_mm,
  inner_height_mm = height_mm
WHERE inner_length_mm IS NULL
  AND inner_width_mm IS NULL
  AND inner_height_mm IS NULL;

-- Down Migration

DO $$
BEGIN
  RAISE EXCEPTION '022_bm02_quotation_line_sales is forward-only';
END
$$;
