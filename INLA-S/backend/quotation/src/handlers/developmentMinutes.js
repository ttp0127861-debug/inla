const { json } = require("../lib/http");
const { readBody, pathParam } = require("../lib/request");
const { requireRole } = require("../middleware/auth");
const { loadQuotationForRead } = require("../services/access");
const payloadService = require("../services/payloads");
const { mapDevelopmentMinutes } = require("../services/mappers");
const { parseQuotationCodeParam, parseDevelopmentMinutesPayload } = require("../services/validation");

async function get(event) {
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  if (!loaded.row.current_cycle_id) {
    return json(200, null);
  }
  const row = await payloadService.getDevelopmentMinutesRow(loaded.row.current_cycle_id);
  return json(200, mapDevelopmentMinutes(row));
}

async function put(event) {
  const denied = requireRole(event, "R&D");
  if (denied) return denied;
  const code = parseQuotationCodeParam(pathParam(event, "code"));
  const loaded = await loadQuotationForRead(event, code);
  if (loaded.response) return loaded.response;
  const result = await payloadService.updateDevelopmentMinutes(
    event,
    loaded.row,
    parseDevelopmentMinutesPayload(readBody(event))
  );
  if (result.statusCode) return result;
  return json(200, result);
}

module.exports = { get, put };
