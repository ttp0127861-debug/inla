import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createUser,
  disableUser,
  enableUser,
  getUser,
  listRoles,
  listUsers,
  resetUserPassword,
  updateUser,
  usersErrorMessage,
  type ApiRole,
  type ApiUser,
} from "../../api/users";
import { useAuth } from "../../auth/AuthContext";
import { AccountStatusIcon } from "../../components/ui/AccountStatusIcon";
import { Badge } from "../../components/ui/Badge";
import { IconAction } from "../../components/ui/IconAction";
import { Button } from "../../components/ui/Button";
import { Card, DataTable, PageTitle } from "../../components/ui/DataTable";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { FILTER_EMPTY_HINT } from "../../components/ui/Skeleton";
import { roleDisplayLabel } from "../../lib/roleLabels";
import { IconEdit, IconKeyReset, IconLock, IconReplace } from "./adminUserIcons";

const levels = [
  { value: "staff", label: "Nhân viên" },
  { value: "manager", label: "Quản lý" },
];

const enabledOptions = [
  { value: "true", label: "Hoạt động" },
  { value: "false", label: "Khóa" },
];

const cognitoStatus: Record<string, string> = {
  CONFIRMED: "Đã xác nhận",
  FORCE_CHANGE_PASSWORD: "Chờ đổi mật khẩu",
  RESET_REQUIRED: "Chờ đặt lại mật khẩu",
  UNCONFIRMED: "Chưa xác nhận",
  ARCHIVED: "Lưu trữ",
  COMPROMISED: "Bị xâm phạm",
  UNKNOWN: "Không rõ",
};

type Draft = { q: string; role: string; enabled: string };
type AccountForm = {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  level: string;
  enabled: string;
};
type FieldErrors = Partial<Record<keyof AccountForm, string>>;

const emptyForm: AccountForm = {
  name: "",
  email: "",
  phoneNumber: "",
  role: "",
  level: "",
  enabled: "true",
};

export function levelLabel(level: string): string {
  return levels.find((item) => item.value === level)?.label || level || "—";
}

function statusLabel(status: string): string {
  return cognitoStatus[status] || status || "—";
}

function enabledLabel(enabled: boolean): string {
  return enabled ? "Hoạt động" : "Khóa";
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return `${first}${last}`.toLocaleUpperCase("vi");
}

function userHref(username: string, action: "edit" | "reset" | "replace"): string {
  return `/admin/users/${encodeURIComponent(username)}/${action}`;
}

function sameAccount(actorEmail: string | undefined, account: ApiUser): boolean {
  const actor = (actorEmail || "").trim().toLowerCase();
  if (!actor) return false;
  return actor === account.email.trim().toLowerCase() || actor === account.username.trim().toLowerCase();
}

function matches(account: ApiUser, draft: Draft): boolean {
  if (draft.role && account.role !== draft.role) return false;
  if (draft.enabled === "true" && !account.enabled) return false;
  if (draft.enabled === "false" && account.enabled) return false;
  const term = draft.q.trim().toLowerCase();
  if (!term) return true;
  return [account.name, account.email, account.phoneNumber, account.username].some((value) => value.toLowerCase().includes(term));
}

function formFromUser(account: ApiUser): AccountForm {
  return {
    name: account.name,
    email: account.email,
    phoneNumber: account.phoneNumber,
    role: account.role || "",
    level: account.level,
    enabled: account.enabled ? "true" : "false",
  };
}

function validate(form: AccountForm, emailRequired: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Nhập họ và tên.";
  if (emailRequired && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Nhập email hợp lệ.";
  if (!form.phoneNumber.trim()) errors.phoneNumber = "Nhập số điện thoại.";
  if (!form.role) errors.role = "Chọn vai trò.";
  if (!form.level) errors.level = "Chọn cấp độ.";
  if (form.enabled !== "true" && form.enabled !== "false") errors.enabled = "Chọn trạng thái.";
  return errors;
}

function Notice({ tone, children }: { tone: "error" | "info" | "ok"; children: string }) {
  const toneClass = tone === "error" ? "bg-[#fef2f2] text-[#b91c1c]" : tone === "ok" ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#eff6ff] text-[var(--color-text-body)]";
  return <p className={`mb-4 rounded-[var(--radius-sm)] p-3 text-sm ${toneClass}`}>{children}</p>;
}

export function UserListBody() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ApiUser[] | null>(null);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ q: "", role: "", enabled: "" });
  const [applied, setApplied] = useState<Draft>({ q: "", role: "", enabled: "" });

  useEffect(() => {
    let active = true;
    Promise.all([listUsers(), listRoles()])
      .then(([listed, roleList]) => {
        if (!active) return;
        setAccounts(listed.users);
        setRoles(roleList.roles);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(usersErrorMessage(loadError));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => (accounts || []).filter((account) => matches(account, applied)), [accounts, applied]);

  async function toggleEnabled(account: ApiUser) {
    setPending(account.username);
    setError(null);
    try {
      const result = account.enabled ? await disableUser(account.username) : await enableUser(account.username);
      setAccounts((current) => current?.map((item) => (item.username === account.username ? result.user : item)) ?? null);
    } catch (toggleError) {
      setError(usersErrorMessage(toggleError));
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <PageTitle title="Quản lý người dùng" aside={<Button to="/admin/users/new">+ Tạo người dùng</Button>} />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
          <input
            value={draft.q}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder="Tìm theo Họ và tên, Email, Số điện thoại..."
            className="h-10 rounded-[4px] border-[1.05px] border-[#d1d5db] px-3 text-sm leading-[21px] text-[#111827] outline-none placeholder:text-[#9ca3af] hover:border-[#9ca3af] focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]"
          />
          <select
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
            className="h-10 rounded-[4px] border-[1.05px] border-[#d1d5db] bg-white px-2 text-sm leading-[21px] text-[#111827] outline-none hover:border-[#9ca3af] focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]"
          >
            <option value="">Tất cả vai trò</option>
            {roles.map((role) => (
              <option key={role.name} value={role.name}>
                {roleDisplayLabel(role.name)}
              </option>
            ))}
          </select>
          <select
            value={draft.enabled}
            onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.value }))}
            className="h-10 rounded-[4px] border-[1.05px] border-[#d1d5db] bg-white px-2 text-sm leading-[21px] text-[#111827] outline-none hover:border-[#9ca3af] focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Khóa</option>
          </select>
          <Button onClick={() => setApplied(draft)}>Lọc</Button>
          <Button
            variant="text"
            onClick={() => {
              const cleared = { q: "", role: "", enabled: "" };
              setDraft(cleared);
              setApplied(cleared);
            }}
          >
            Đặt lại
          </Button>
        </div>
      </Card>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <DataTable
        loading={loading}
        emptyHint={FILTER_EMPTY_HINT}
        skeletonCells={["avatarRow", "barWide", "barNarrow", "pill", "barNarrow", "icon", "actions"]}
        columns={["Họ và tên", "Email", "Số điện thoại", "Vai trò", "Cấp độ", "Trạng thái", "Hành động"]}
        rows={visible.map((account) => {
            const self = sameAccount(user?.email, account);
            return [
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-avatar)] text-xs font-bold">{initialsFrom(account.name || account.email)}</span>
                {account.name || "—"}
              </span>,
              account.email || account.username,
              account.phoneNumber || "—",
              account.role ? <Badge tone="brand">{roleDisplayLabel(account.role)}</Badge> : "—",
              levelLabel(account.level),
              <AccountStatusIcon
                enabled={account.enabled}
                cognitoStatusKey={account.status || "UNKNOWN"}
                enabledText={enabledLabel(account.enabled)}
                cognitoText={statusLabel(account.status)}
              />,
              <span className="flex flex-wrap items-center gap-1">
                <IconAction label="Sửa" to={userHref(account.username, "edit")} icon={<IconEdit />} />
                <IconAction label="Đặt lại mật khẩu" to={userHref(account.username, "reset")} icon={<IconKeyReset />} />
                {self ? null : (
                  <IconAction
                    label={account.enabled ? "Khóa" : "Mở khóa"}
                    variant="danger"
                    disabled={pending === account.username}
                    icon={<IconLock open={!account.enabled} />}
                    onClick={() => void toggleEnabled(account)}
                  />
                )}
                <IconAction label="Thay thế" variant="muted" to={userHref(account.username, "replace")} icon={<IconReplace />} />
              </span>,
            ];
          })}
      />
      {!loading && accounts ? (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Hiển thị {visible.length} trong tổng số {accounts.length} người dùng</p>
      ) : null}
    </>
  );
}

export function UserListPage() {
  return <UserListBody />;
}

function AccountFields({
  form,
  errors,
  roles,
  emailReadOnly,
  onChange,
}: {
  form: AccountForm;
  errors: FieldErrors;
  roles: ApiRole[];
  emailReadOnly?: boolean;
  onChange: (patch: Partial<AccountForm>) => void;
}) {
  const roleOptions = roles.map((role) => ({ value: role.name, label: roleDisplayLabel(role.name) }));
  return (
    <div className="grid gap-4">
      <Field label="Họ và tên" required placeholder="Nhập họ và tên" value={form.name} error={errors.name} onChange={(name) => onChange({ name })} />
      <Field label="Email đăng nhập" required placeholder="Nhập email đăng nhập" value={form.email} error={errors.email} readOnly={emailReadOnly} disabled={emailReadOnly} onChange={(email) => onChange({ email })} />
      <Field label="Số điện thoại" required placeholder="Nhập số điện thoại" value={form.phoneNumber} error={errors.phoneNumber} onChange={(phoneNumber) => onChange({ phoneNumber })} />
      <Field label="Vai trò" required as="select" placeholder="Chọn vai trò" options={roleOptions} value={form.role} error={errors.role} onChange={(role) => onChange({ role })} />
      <Field label="Cấp độ" required as="select" placeholder="Chọn cấp độ" options={levels} value={form.level} error={errors.level} onChange={(level) => onChange({ level })} />
      <Field label="Trạng thái" required as="select" placeholder="Chọn trạng thái" options={enabledOptions} value={form.enabled} error={errors.enabled} onChange={(enabled) => onChange({ enabled })} />
    </div>
  );
}

function useRoleOptions() {
  const [roles, setRoles] = useState<ApiRole[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listRoles()
      .then((result) => {
        if (active) setRoles(result.roles);
      })
      .catch((loadError: unknown) => {
        if (active) setError(usersErrorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, []);

  return { roles, error };
}

export function CreateUserPage() {
  const navigate = useNavigate();
  const { roles, error: rolesError } = useRoleOptions();
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const nextErrors = validate(form, true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createUser({
        email: form.email.trim(),
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
        level: form.level,
      });
      if (form.enabled === "false") await disableUser(created.user.username);
      navigate("/admin", { replace: true });
    } catch (saveError) {
      setError(usersErrorMessage(saveError));
      setSaving(false);
    }
  }

  return (
    <>
      <UserListBody />
      <Modal title="Tạo người dùng mới" closeTo="/admin">
        <Notice tone="info">Mỗi tài khoản chỉ được gán duy nhất 01 Vai trò. Hệ thống gửi email kích hoạt sau khi lưu.</Notice>
        {rolesError ? <Notice tone="error">{rolesError}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {roles ? (
          <AccountFields form={form} errors={errors} roles={roles} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />
        ) : rolesError ? null : (
          <p className="text-sm text-[var(--color-text-muted)]">Đang tải vai trò...</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/admin" variant="text">Hủy</Button>
          <Button type="button" onClick={() => void submit()} loading={saving} disabled={!roles}>Lưu tài khoản</Button>
        </div>
      </Modal>
    </>
  );
}

export function EditUserPage() {
  const navigate = useNavigate();
  const params = useParams();
  const username = decodeURIComponent(params.username || "");
  const { roles, error: rolesError } = useRoleOptions();
  const [form, setForm] = useState<AccountForm | null>(null);
  const [cognitoState, setCognitoState] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getUser(username)
      .then((result) => {
        if (!active) return;
        setForm(formFromUser(result.user));
        setCognitoState(statusLabel(result.user.status));
      })
      .catch((loadError: unknown) => {
        if (active) setError(usersErrorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [username]);

  async function submit() {
    if (!form) return;
    const nextErrors = validate(form, false);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUser(username, {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
        level: form.level,
      });
      const wantEnabled = form.enabled === "true";
      if (updated.user.enabled !== wantEnabled) {
        if (wantEnabled) await enableUser(username);
        else await disableUser(username);
      }
      navigate("/admin", { replace: true });
    } catch (saveError) {
      setError(usersErrorMessage(saveError));
      setSaving(false);
    }
  }

  return (
    <>
      <UserListBody />
      <Modal title="Sửa người dùng" closeTo="/admin">
        {rolesError ? <Notice tone="error">{rolesError}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {form && roles ? (
          <>
            <AccountFields form={form} errors={errors} roles={roles} emailReadOnly onChange={(patch) => setForm((current) => current ? { ...current, ...patch } : current)} />
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">Trạng thái Cognito: {cognitoState}. Email không thể đổi.</p>
          </>
        ) : error || rolesError ? null : (
          <p className="text-sm text-[var(--color-text-muted)]">Đang tải người dùng...</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/admin" variant="text">Hủy</Button>
          <Button type="button" onClick={() => void submit()} loading={saving} disabled={!form || !roles}>Lưu tài khoản</Button>
        </div>
      </Modal>
    </>
  );
}

export function ResetPasswordPage() {
  const params = useParams();
  const username = decodeURIComponent(params.username || "");
  const [account, setAccount] = useState<ApiUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getUser(username)
      .then((result) => {
        if (active) setAccount(result.user);
      })
      .catch((loadError: unknown) => {
        if (active) setError(usersErrorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [username]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await resetUserPassword(username);
      setDone(true);
    } catch (saveError) {
      setError(usersErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <UserListBody />
      <Modal title="Đặt lại mật khẩu người dùng" closeTo="/admin">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {done ? <Notice tone="ok">Đã gửi email đặt lại mật khẩu.</Notice> : (
          <p className="text-sm">
            Xác nhận gửi email reset mật khẩu qua Amazon Cognito
            {account ? ` cho ${account.name || account.email} (${account.email}).` : "."}
          </p>
        )}
        {!account && !error ? <p className="mt-3 text-sm text-[var(--color-text-muted)]">Đang tải người dùng...</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/admin" variant="text">{done ? "Đóng" : "Hủy"}</Button>
          {done ? null : <Button type="button" onClick={() => void submit()} loading={saving} disabled={!account}>Xác nhận gửi</Button>}
        </div>
      </Modal>
    </>
  );
}

export function ReplaceUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = useParams();
  const username = decodeURIComponent(params.username || "");
  const { roles, error: rolesError } = useRoleOptions();
  const [current, setCurrent] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getUser(username)
      .then((result) => {
        if (!active) return;
        setCurrent(result.user);
        setForm({
          ...emptyForm,
          role: result.user.role || "",
          level: result.user.level,
          enabled: "true",
        });
      })
      .catch((loadError: unknown) => {
        if (active) setError(usersErrorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [username]);

  async function submit() {
    if (!current) return;
    if (sameAccount(user?.email, current)) {
      setError("Bạn không thể thay thế tài khoản của chính mình.");
      return;
    }
    const nextErrors = validate(form, true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setError(null);
    let disabledOld = false;
    try {
      if (current.enabled) {
        await disableUser(current.username);
        disabledOld = true;
      }
      const created = await createUser({
        email: form.email.trim(),
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
        level: form.level,
      });
      if (form.enabled === "false") await disableUser(created.user.username);
      navigate("/admin", { replace: true });
    } catch (saveError) {
      if (disabledOld) await enableUser(current.username).catch(() => undefined);
      setError(usersErrorMessage(saveError));
      setSaving(false);
    }
  }

  return (
    <>
      <UserListBody />
      <Modal title="Thay thế tài khoản nhân sự nghỉ việc" closeTo="/admin">
        <p className="mb-4 text-sm">Hệ thống sẽ vô hiệu hóa tài khoản cũ và tạo tài khoản mới với vai trò được chọn.</p>
        {current ? (
          <div className="mb-4 rounded-[var(--radius-sm)] bg-[#faf7f4] p-4 text-sm">
            <p className="text-[var(--color-text-muted)]">Tài khoản cũ bị thay thế:</p>
            <p className="font-semibold">{current.name || current.email}</p>
            <p>
              {current.email} · {current.role ? roleDisplayLabel(current.role) : "Chưa có vai trò"} · {levelLabel(current.level)}
            </p>
          </div>
        ) : null}
        {rolesError ? <Notice tone="error">{rolesError}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {current && roles ? (
          <AccountFields form={form} errors={errors} roles={roles} onChange={(patch) => setForm((existing) => ({ ...existing, ...patch }))} />
        ) : error || rolesError ? null : (
          <p className="text-sm text-[var(--color-text-muted)]">Đang tải người dùng...</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button to="/admin" variant="text">Hủy</Button>
          <Button type="button" onClick={() => void submit()} loading={saving} disabled={!current || !roles}>Lưu thay thế</Button>
        </div>
      </Modal>
    </>
  );
}

const sla = [
  ["Tiếp nhận", "EXECUTOR", "2,0", "1,0", "01/01/2026"],
  ["Đánh giá chất lượng", "QA", "4,0", "2,0", "01/01/2026"],
  ["Kỹ thuật & Chi phí", "R&D", "5,0", "3,0", "01/01/2026"],
  ["Tổng hợp báo giá", "EXECUTOR", "2,0", "1,0", "01/01/2026"],
  ["Xử lý tài chính", "ACCOUNTING", "3,0", "2,0", "01/01/2026"],
  ["Phê duyệt báo giá", "DIRECTOR", "2,0", "1,0", "01/01/2026"],
];

export function SlaConfigPage({ modal }: { modal?: "edit" | "history" }) {
  return (
    <>
      <PageTitle title="Cấu hình SLA (thời hạn xử lý công việc)" />
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">Ngưỡng cảnh báo Gần đến hạn cố định ở mức 50% thời gian định mức.</p>
      <div className="mb-3 flex justify-end">
        <Button to="/admin/sla/history" variant="secondary">Lịch sử cấu hình</Button>
      </div>
      <DataTable
        columns={["Tên công đoạn", "Vai trò phụ trách", "Thời gian luồng Mới (giờ)", "Thời gian luồng Re-submit (giờ)", "Ngày hiệu lực", "Thao tác"]}
        rows={sla.map((row) => [
          row[0], row[1], row[2], row[3], row[4],
          <Link to="/admin/sla/edit" className="font-semibold text-[var(--color-action-primary)]">Sửa</Link>,
        ])}
      />
      {modal === "edit" ? (
        <Modal title="Sửa cấu hình SLA — Đánh giá chất lượng (QA)" closeTo="/admin/sla">
          <p className="mb-4 text-sm">Cấu hình mới chỉ áp dụng cho các task/báo giá được tạo sau thời điểm lưu.</p>
          <div className="grid gap-4">
            <Field label="Thời gian luồng Mới (giờ)" required value="4.0" />
            <Field label="Thời gian luồng Re-submit (giờ)" required value="2.0" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button to="/admin/sla" variant="text">Hủy</Button>
            <Button to="/admin/sla">Lưu</Button>
          </div>
        </Modal>
      ) : null}
      {modal === "history" ? (
        <Modal title="Lịch sử cấu hình SLA" closeTo="/admin/sla">
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">14/10/2026 10:30 bởi Admin Trần Văn B</p>
          <p className="text-sm">Công đoạn Đánh giá chất lượng (QA): luồng Mới 4,0 giờ, Re-submit 2,0 giờ.</p>
        </Modal>
      ) : null}
    </>
  );
}
