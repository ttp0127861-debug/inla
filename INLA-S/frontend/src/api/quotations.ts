import { apiJsonRequest, HttpRequestError } from "./http";

export type WorkflowStatus =
  | "draft"
  | "cancelled"
  | "executor_intake"
  | "qa_rnd_review"
  | "executor_consolidation"
  | "accounting_review"
  | "director_review"
  | "approved"
  | "rejected";

export type BusinessOutcome = "not_updated" | "sent_to_customer" | "won" | "lost";
export type CycleType = "new" | "re_submit";
export type DimensionType = "inner" | "outer";

export type TaskType =
  | "executor_intake"
  | "qa_review"
  | "rnd_review"
  | "executor_consolidation"
  | "accounting_review"
  | "director_review";

export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export type AttachmentSection =
  | "sales"
  | "qa"
  | "rnd"
  | "executor_intake"
  | "executor_consolidation"
  | "accounting";

export type Quotation = {
  id: string;
  code: string;
  salesOwnerUsername: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  contactId: string | null;
  contactFullName?: string;
  workflowStatus: WorkflowStatus;
  businessOutcome: BusinessOutcome;
  currentCycleId: string;
  currentCycleNumber?: number;
  currentCycleType?: CycleType;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Present on some list payloads when accounting data is joined. */
  finalQuotationValue?: number | null;
  /** TODO: backend — lý do Lost khi có contract / list response. */
  businessOutcomeReason?: string | null;
  lostReason?: string | null;
};

export type TaskInboxApiSlaState = "overdue" | "warning" | "normal";

/** Query values accepted by `listTaskInbox` (aliases map to OpenAPI enum). */
export type TaskInboxSlaQuery =
  | TaskInboxApiSlaState
  | "on_track"
  | "due_soon";

export type TaskInboxItem = {
  quotation: Quotation;
  task: QuotationTask;
};

export type TaskInboxResponse = {
  tasks: TaskInboxItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListTaskInboxParams = {
  slaAlertState?: TaskInboxSlaQuery;
  page?: number;
  pageSize?: number;
};

function taskInboxSlaParam(state: TaskInboxSlaQuery | undefined): TaskInboxApiSlaState | undefined {
  if (!state) return undefined;
  if (state === "on_track") return "normal";
  if (state === "due_soon") return "warning";
  return state;
}

export type WorkflowCycle = {
  id: string;
  quotationId: string;
  cycleNumber: number;
  cycleType: CycleType;
  resubmitReason: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type SalesData = {
  salesNote?: string | null;
  boxType?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  dimensionType?: DimensionType | null;
  material?: string | null;
  layerCount?: number | null;
  fluteType?: string | null;
  productLoadKg?: number | null;
  printingDescription?: string | null;
  printColorCount?: number | null;
  printSideCount?: number | null;
  quantityPieces?: number | null;
  deliveryLocation?: string | null;
  desiredDeliveryTime?: string | null;
  additionalRequirements?: string | null;
  updatedAt?: string;
};

/** One proposed paper build in the technical-run section. Seven layers, in order. */
export type QaRunPaperStructure = {
  paperTypes: string[];
  basisWeights: string[];
};

/** Per-line QA row — align OpenAPI when backend ships `qaLineData`. */
export type QaLineDataRow = {
  lineNumber: number;
  qualityAssessmentResult?: string | null;
  qaNote?: string | null;
  burstStandard?: string | null;
  compressionStandard?: string | null;
  weightLimitStandard?: string | null;
  kcgStandard?: string | null;
  kcgQaSxProposal1?: string | null;
  kcgQaSxProposal2?: string | null;
  kcgQaSxProposal3?: string | null;
  edgeCrushStandard?: string | null;
  slipAngleStandard?: string | null;
  waterproofStandard?: string | null;
  facePaperType?: string | null;
  faceBasisWeight?: string | null;
  flutePaperType?: string | null;
  fluteBasisWeight?: string | null;
  middlePaperType?: string | null;
  middleBasisWeight?: string | null;
  flute2PaperType?: string | null;
  flute2BasisWeight?: string | null;
  middle2PaperType?: string | null;
  middle2BasisWeight?: string | null;
  flute3PaperType?: string | null;
  flute3BasisWeight?: string | null;
  bottomPaperType?: string | null;
  bottomBasisWeight?: string | null;
  runQualityAssessmentResult?: string | null;
  runQaNote?: string | null;
  runBurstStandard?: string | null;
  runCompressionStandard?: string | null;
  runWeightLimitStandard?: string | null;
  runKcgStandard?: string | null;
  runEdgeCrushStandard?: string | null;
  runSlipAngleStandard?: string | null;
  runWaterproofStandard?: string | null;
  runKcgQaSxProposal1?: string | null;
  runFacePaperType?: string | null;
  runFaceBasisWeight?: string | null;
  runFlutePaperType?: string | null;
  runFluteBasisWeight?: string | null;
  runMiddlePaperType?: string | null;
  runMiddleBasisWeight?: string | null;
  runFlute2PaperType?: string | null;
  runFlute2BasisWeight?: string | null;
  runMiddle2PaperType?: string | null;
  runMiddle2BasisWeight?: string | null;
  runFlute3PaperType?: string | null;
  runFlute3BasisWeight?: string | null;
  runBottomPaperType?: string | null;
  runBottomBasisWeight?: string | null;
  runPaperStructures?: QaRunPaperStructure[] | null;
};

export type QaData = {
  qualityAssessmentResult?: string | null;
  /** @deprecated QA-02 removed from UI; backend may still return until migration. */
  qualityRequirements?: string | null;
  qaNote?: string | null;
  burstStandard?: string | null;
  compressionStandard?: string | null;
  weightLimitStandard?: string | null;
  kcgStandard?: string | null;
  kcgQaSxProposal1?: string | null;
  kcgQaSxProposal2?: string | null;
  kcgQaSxProposal3?: string | null;
  edgeCrushStandard?: string | null;
  slipAngleStandard?: string | null;
  waterproofStandard?: string | null;
  facePaperType?: string | null;
  faceBasisWeight?: string | null;
  flutePaperType?: string | null;
  fluteBasisWeight?: string | null;
  middlePaperType?: string | null;
  middleBasisWeight?: string | null;
  flute2PaperType?: string | null;
  flute2BasisWeight?: string | null;
  middle2PaperType?: string | null;
  middle2BasisWeight?: string | null;
  flute3PaperType?: string | null;
  flute3BasisWeight?: string | null;
  bottomPaperType?: string | null;
  bottomBasisWeight?: string | null;
  runQualityAssessmentResult?: string | null;
  runQaNote?: string | null;
  runBurstStandard?: string | null;
  runCompressionStandard?: string | null;
  runWeightLimitStandard?: string | null;
  runKcgStandard?: string | null;
  runEdgeCrushStandard?: string | null;
  runSlipAngleStandard?: string | null;
  runWaterproofStandard?: string | null;
  runKcgQaSxProposal1?: string | null;
  runFacePaperType?: string | null;
  runFaceBasisWeight?: string | null;
  runFlutePaperType?: string | null;
  runFluteBasisWeight?: string | null;
  runMiddlePaperType?: string | null;
  runMiddleBasisWeight?: string | null;
  runFlute2PaperType?: string | null;
  runFlute2BasisWeight?: string | null;
  runMiddle2PaperType?: string | null;
  runMiddle2BasisWeight?: string | null;
  runFlute3PaperType?: string | null;
  runFlute3BasisWeight?: string | null;
  runBottomPaperType?: string | null;
  runBottomBasisWeight?: string | null;
  runPaperStructures?: QaRunPaperStructure[] | null;
  /** When present (incl. empty array), GET contract supports line-scoped QA. */
  qaLineData?: QaLineDataRow[];
};

/** Per-line R&D row — align OpenAPI when backend ships `rndLineData`. */
export type RndLineDataRow = {
  lineNumber: number;
  printingPlateCost?: number;
  dieCost?: number;
  layoutCode?: string | null;
  layoutQuoteCode?: string | null;
  dieCode?: string | null;
  dieQuoteCode?: string | null;
  productionPlan?: string | null;
  rndNote?: string | null;
};

export type RndData = {
  printingPlateCost?: number;
  dieCost?: number;
  layoutCode?: string | null;
  layoutQuoteCode?: string | null;
  dieCode?: string | null;
  dieQuoteCode?: string | null;
  productionPlan?: string | null;
  rndNote?: string | null;
  rndLineData?: RndLineDataRow[];
};

export type DevelopmentMinutesParticipant = {
  seq: number;
  fullName: string;
  department: string;
  jobTitle?: string | null;
};

export type DevelopmentMinutesPrintPlate = {
  plateNo: number;
  colorSystem?: string | null;
  formulaComposition?: string | null;
  quota?: string | null;
  trame?: string | null;
  anilox?: string | null;
};

export type DevelopmentMinutes = {
  meetingPlace?: string | null;
  meetingDate?: string | null;
  participants?: DevelopmentMinutesParticipant[];
  designNotes?: string | null;
  sampleBoxNotes?: string | null;
  printPlates?: DevelopmentMinutesPrintPlate[];
  finishDieCut?: string | null;
  finishGlue?: string | null;
  finishStaple?: string | null;
  uvCoating?: string | null;
  bundlingMethod?: string | null;
  palletNotes?: string | null;
  shippingNotes?: string | null;
  otherNotes?: string | null;
  meetingConclusion?: string | null;
  /** Production notes edited on the technical R&D sub-form. The API drops unknown payload keys until the contract includes them. */
  fluteKind?: string | null;
  creasing?: string | null;
  sheetSize?: string | null;
  fluteOther?: string | null;
  filmLamination?: string | null;
  payload?: DevelopmentMinutes | null;
  updatedAt?: string | null;
};

export type ExecutorIntakeData = { intakeNote?: string | null };

export type LineItem = {
  id?: string;
  lineNumber: number;
  itemCode?: string | null;
  itemName: string;
  fluteType: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  quantity: number;
  unitPrice?: number | null;
  lineRemark?: string | null;
};

export type LineItemPriceUpdate = {
  lineNumber: number;
  unitPrice: number;
  lineRemark?: string | null;
};

export type ExecutorConsolidationData = {
  deliveryTerms?: string | null;
  consolidationNote?: string | null;
};

export type UpdateExecutorConsolidationBody = {
  deliveryTerms?: string | null;
  consolidationNote?: string | null;
  lineItems: LineItemPriceUpdate[];
};

export type AccountingData = {
  paymentTerms?: string | null;
  vatRate?: number;
  financialAdjustment?: string | null;
  finalQuotationValue?: number | null;
  accountingNote?: string | null;
};

export type DirectorData = {
  directorDecision?: string | null;
  approvalNote?: string | null;
  rejectionReason?: string | null;
  decisionAt?: string | null;
};

export type QuotationTask = {
  id: string;
  quotationId: string;
  cycleId: string;
  taskType: TaskType;
  taskStatus: TaskStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  slaStartedAt?: string | null;
  slaDeadlineAt?: string | null;
  slaCompletedAt?: string | null;
  slaDurationHours?: number | null;
  slaAlertState?: string | null;
};

export type CustomerSnapshot = {
  customerType?: string;
  customerCode?: string;
  customerName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  province?: string;
  contactId?: string | null;
  contactFullName?: string | null;
};

export type QuotationDetailResponse = {
  quotation: Quotation;
  currentCycle: WorkflowCycle | null;
  salesData: SalesData | null;
  qaData: QaData | null;
  rndData: RndData | null;
  executorIntake: ExecutorIntakeData | null;
  executorConsolidation: ExecutorConsolidationData | null;
  accountingData: AccountingData | null;
  directorData: DirectorData | null;
  customerSnapshot: CustomerSnapshot | null;
  developmentMinutes?: DevelopmentMinutes | null;
  lineItems?: LineItem[];
  tasks: QuotationTask[];
};

export type QuotationAttachment = {
  id: string;
  quotationId: string;
  cycleId: string;
  section: AttachmentSection;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: string;
  deletedAt?: string | null;
};

export type WorkflowEvent = {
  id: number;
  quotationId: string;
  cycleId: string;
  fromStatus: string | null;
  toStatus: string | null;
  actionType: string;
  actorUsername: string;
  actorRole: string;
  actionAt: string;
  actionNote: string | null;
};

export type QuotationAuditEvent = {
  id: number;
  occurredAt: string;
  actorUsername?: string | null;
  actorRole?: string | null;
  action?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
};

export type Revision = {
  id: string;
  quotationId: string;
  cycleId: string;
  revisionNumber: number;
  revisionCode: string;
  createdAt: string;
  createdBy: string;
};

export type CreateQuotationBody = {
  customerId: string;
  contactId?: string | null;
  lineItems: LineItem[];
} & SalesData;

export type UpdateQuotationDraftBody = {
  customerId?: string;
  contactId?: string | null;
  version?: number;
  lineItems: LineItem[];
} & SalesData;

export type ListQuotationsParams = {
  q?: string;
  workflowStatus?: WorkflowStatus;
  businessOutcome?: BusinessOutcome;
  cycleType?: CycleType;
  page?: number;
  pageSize?: number;
};

export type DirectorDecisionBody = {
  decision: "approved" | "rejected";
  approvalNote?: string;
  rejectionReason?: string;
  version?: number;
};

export class QuotationsApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "QuotationsApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await apiJsonRequest<T>(path, init);
  } catch (error) {
    if (error instanceof HttpRequestError) {
      const message =
        error.code === "NETWORK" ? "Không kết nối được máy chủ báo giá." : error.message;
      throw new QuotationsApiError(error.status, error.code, message);
    }
    throw error;
  }
}

function quotationPath(code: string): string {
  return `/quotations/${encodeURIComponent(code)}`;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listQuotations(
  params: ListQuotationsParams = {},
): Promise<{ quotations: Quotation[]; page: number; pageSize: number; total: number }> {
  return request(`/quotations${queryString(params)}`);
}

export function listTaskInbox(params: ListTaskInboxParams = {}): Promise<TaskInboxResponse> {
  const { slaAlertState, ...rest } = params;
  return request(
    `/tasks${queryString({
      ...rest,
      slaAlertState: taskInboxSlaParam(slaAlertState),
    })}`,
  );
}

export function createQuotation(body: CreateQuotationBody): Promise<QuotationDetailResponse> {
  return request("/quotations", { method: "POST", body: JSON.stringify(body) });
}

export function getQuotation(code: string): Promise<QuotationDetailResponse> {
  return request(quotationPath(code));
}

export function updateQuotationDraft(
  code: string,
  body: UpdateQuotationDraftBody,
): Promise<QuotationDetailResponse> {
  return request(quotationPath(code), { method: "PUT", body: JSON.stringify(body) });
}

export function cancelQuotation(code: string): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/cancel`, { method: "POST" });
}

export function submitQuotation(
  code: string,
  body?: { version?: number; resubmitReason?: string },
): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/submit`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function prepareResubmit(code: string): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/resubmit/prepare`, { method: "POST" });
}

export function resubmitSubmit(
  code: string,
  body: { resubmitReason: string; version?: number },
): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/resubmit/submit`, { method: "POST", body: JSON.stringify(body) });
}

export function cloneQuotation(
  code: string,
  body?: { copyAttachmentIds?: string[] },
): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/clone`, { method: "POST", body: JSON.stringify(body ?? {}) });
}

export function patchBusinessOutcome(
  code: string,
  body: { businessOutcome: BusinessOutcome; version?: number },
): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/business-outcome`, { method: "PATCH", body: JSON.stringify(body) });
}

export function startTask(code: string, taskType: TaskType): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/tasks/${encodeURIComponent(taskType)}/start`, { method: "POST" });
}

export function completeTask(code: string, taskType: TaskType): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/tasks/${encodeURIComponent(taskType)}/complete`, { method: "POST" });
}

export function updateQaData(code: string, body: QaData): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/qa`, { method: "PUT", body: JSON.stringify(body) });
}

export function updateRndData(code: string, body: RndData): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/rnd`, { method: "PUT", body: JSON.stringify(body) });
}

export function getDevelopmentMinutes(code: string): Promise<DevelopmentMinutes> {
  return request(`${quotationPath(code)}/development-minutes`);
}

export function updateDevelopmentMinutes(code: string, body: DevelopmentMinutes): Promise<DevelopmentMinutes> {
  return request(`${quotationPath(code)}/development-minutes`, { method: "PUT", body: JSON.stringify(body) });
}

export function updateExecutorIntake(code: string, body: ExecutorIntakeData): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/executor/intake`, { method: "PUT", body: JSON.stringify(body) });
}

export function updateExecutorConsolidation(
  code: string,
  body: UpdateExecutorConsolidationBody,
): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/executor/consolidation`, { method: "PUT", body: JSON.stringify(body) });
}

export function updateAccountingData(code: string, body: AccountingData): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/accounting`, { method: "PUT", body: JSON.stringify(body) });
}

export function directorDecision(code: string, body: DirectorDecisionBody): Promise<QuotationDetailResponse> {
  return request(`${quotationPath(code)}/director/decision`, { method: "POST", body: JSON.stringify(body) });
}

export function getQuotationHistory(
  code: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{
  events: WorkflowEvent[];
  auditEvents: QuotationAuditEvent[];
  page: number;
  pageSize: number;
  total: number;
}> {
  return request(`${quotationPath(code)}/history${queryString(params)}`);
}

export function listRevisions(code: string): Promise<{ revisions: Revision[] }> {
  return request(`${quotationPath(code)}/revisions`);
}

export function getRevision(
  code: string,
  revisionCode: string,
): Promise<{ revision: Revision; snapshot: Record<string, unknown> }> {
  return request(`${quotationPath(code)}/revisions/${encodeURIComponent(revisionCode)}`);
}

export function similarByProduct(code: string): Promise<{ quotations: Quotation[]; page: number; pageSize: number; total: number }> {
  return request(`${quotationPath(code)}/similar-by-product`);
}

export function similarByCustomer(code: string): Promise<{ quotations: Quotation[]; page: number; pageSize: number; total: number }> {
  return request(`${quotationPath(code)}/similar-by-customer`);
}

export function listCustomerQuotations(
  customerCode: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<{ quotations: Quotation[]; page: number; pageSize: number; total: number }> {
  return request(`/customers/${encodeURIComponent(customerCode)}/quotations${queryString(params)}`);
}

export function listAttachments(
  code: string,
  params: { cycleId?: string; section?: AttachmentSection } = {},
): Promise<{ attachments: QuotationAttachment[] }> {
  return request(`${quotationPath(code)}/attachments${queryString(params)}`);
}

export function presignAttachment(
  code: string,
  body: { fileName: string; mimeType: string; section: AttachmentSection; size: number },
): Promise<{ uploadUrl: string; storageKey: string; expiresInSeconds: number }> {
  return request(`${quotationPath(code)}/attachments/presign`, { method: "POST", body: JSON.stringify(body) });
}

export function confirmAttachment(
  code: string,
  body: { fileName: string; mimeType: string; section: AttachmentSection; size: number; storageKey: string },
): Promise<{ attachment: QuotationAttachment }> {
  return request(`${quotationPath(code)}/attachments/confirm`, { method: "POST", body: JSON.stringify(body) });
}

export function deleteAttachment(code: string, attachmentId: string): Promise<{ ok: boolean }> {
  return request(`${quotationPath(code)}/attachments/${encodeURIComponent(attachmentId)}`, { method: "DELETE" });
}

export async function uploadAttachmentFile(
  code: string,
  file: File,
  section: AttachmentSection,
): Promise<QuotationAttachment> {
  const presign = await presignAttachment(code, {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    section,
    size: file.size,
  });
  const upload = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!upload.ok) {
    throw new QuotationsApiError(upload.status, "INTERNAL_ERROR", "Không thể tải tệp lên S3.");
  }
  const confirmed = await confirmAttachment(code, {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    section,
    size: file.size,
    storageKey: presign.storageKey,
  });
  return confirmed.attachment;
}

export function quotationsErrorMessage(error: unknown): string {
  if (!(error instanceof QuotationsApiError)) return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
  if (error.code === "VALIDATION_ERROR") return error.message || "Dữ liệu không hợp lệ. Kiểm tra các trường bắt buộc.";
  if (error.code === "FORBIDDEN") return "Bạn không có quyền thực hiện thao tác này.";
  if (error.code === "UNAUTHORIZED") return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error.code === "NOT_FOUND") return "Không tìm thấy báo giá.";
  if (error.code === "CONFLICT") return error.message || "Dữ liệu đã thay đổi. Vui lòng tải lại.";
  if (error.code === "NETWORK") return error.message;
  return error.message || "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}
