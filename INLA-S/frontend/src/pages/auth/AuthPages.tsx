import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authErrorMessage, destinationFor } from "../../auth/cognito";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Logo } from "../../components/ui/Logo";

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111827]">
      <img src="/images/factory.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[rgba(10,13,17,0.68)]" />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <section className="flex w-full max-w-[480px] flex-col items-center gap-5 rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)]">
          <Logo className="h-[72px] w-[168px]" />
          <h1 className="text-center font-[family-name:var(--font-serif)] text-2xl leading-8 font-bold text-[var(--color-brand-title)]">
            {title}
          </h1>
          {children}
        </section>
      </div>
      <p className="absolute right-6 bottom-4 text-[11px] text-white/70">Ảnh: Bing Zhang / Unsplash</p>
    </div>
  );
}

const inputClass = [
  "h-10 w-full rounded-[4px] border-[1.05px] border-[#d1d5db] bg-white px-3 text-sm leading-[21px] text-[#111827] outline-none",
  "placeholder:text-[#9ca3af] transition-[border-color,box-shadow] duration-150",
  "hover:border-[#9ca3af] focus:border-[var(--color-action-primary)] focus:shadow-[0_0_0_3px_var(--color-input-ring)]",
  "disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]",
].join(" ");

const textLinkClass = [
  "inline-flex h-8 items-center justify-center rounded-[8px] px-4 text-center text-sm leading-[14px] font-semibold tracking-[0.35px] text-[var(--color-text-body)] uppercase",
  "hover:bg-[var(--color-text-button-hover)] hover:text-[#111827]",
  "focus-visible:bg-[var(--color-text-button-focus)] focus-visible:shadow-[0px_0px_0px_3px_rgba(107,114,128,0.22)] focus-visible:outline-none",
  "active:bg-[var(--color-text-button-hover)] active:text-[#111827]",
].join(" ");

export function LoginPage() {
  const { status, user, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;

  if (status === "authenticated" && user) {
    return <Navigate to={destinationFor(user.groups, from)} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Nhập email và mật khẩu.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const step = await signInWithPassword(email, password);
      if (step.step === "new-password") {
        navigate("/reset", { state: { newPasswordRequired: true, from } });
        return;
      }
      navigate(destinationFor(step.groups, from), { replace: true });
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard title="Đăng nhập hệ thống">
      <form className="flex w-full flex-col gap-5" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--color-text-body)]">
            Email <span className="text-[var(--color-semantic-error)]">(*)</span>
          </span>
          <input
            type="email"
            autoComplete="username"
            placeholder="nhapemail@inla.vn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--color-text-body)]">
            Mật khẩu <span className="text-[var(--color-semantic-error)]">(*)</span>
          </span>
          <span className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              className="absolute top-1 right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-[4px] hover:bg-[var(--color-text-button-hover)] focus-visible:bg-[var(--color-text-button-focus)] focus-visible:outline-none"
              onClick={() => setShow((value) => !value)}
              aria-label="Hiện mật khẩu"
            >
              <img src="/icons/eye.svg" alt="" width={20} height={20} />
            </button>
          </span>
        </label>
        {error ? <p className="text-sm text-[var(--color-semantic-error)]">{error}</p> : null}
        <Button type="submit" block disabled={pending || status === "loading"} loading={pending}>
          {pending ? "Đang đăng nhập" : "Đăng nhập"}
        </Button>
        <Link to="/forgot" className={textLinkClass}>
          Quên mật khẩu?
        </Link>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthCard title="Quên mật khẩu">
      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Nhập email công ty. Hệ thống gửi mã xác nhận để đặt lại mật khẩu.
      </p>
      <form className="flex w-full flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--color-text-body)]">
            Email <span className="text-[var(--color-semantic-error)]">(*)</span>
          </span>
          <input
            placeholder="nhapemail@inla.vn"
            className={inputClass}
          />
        </label>
        <Button to="/reset" block>Gửi yêu cầu</Button>
        <Link to="/" className={textLinkClass}>
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      required
      type={show ? "text" : "password"}
      name={autoComplete}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={onChange}
      trailing={
        <button
          type="button"
          className="absolute top-1 right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-[4px] hover:bg-[var(--color-text-button-hover)] focus-visible:bg-[var(--color-text-button-focus)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-[0.5]"
          onClick={() => setShow((visible) => !visible)}
          disabled={disabled}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          <img src="/icons/eye.svg" alt="" width={20} height={20} />
        </button>
      }
    />
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user, completeNewPassword } = useAuth();
  const routeState = location.state as { newPasswordRequired?: boolean; from?: string } | null;
  const newPasswordRequired = routeState?.newPasswordRequired === true;
  const from = routeState?.from;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canSubmit = password.length > 0 && confirm.length > 0 && !pending;

  if (newPasswordRequired && status === "authenticated" && user) {
    return <Navigate to={destinationFor(user.groups, from)} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPasswordRequired) return;
    if (!password || !confirm) {
      setError("Nhập mật khẩu mới và xác nhận mật khẩu.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const groups = await completeNewPassword(password);
      navigate(destinationFor(groups, from), { replace: true });
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  if (newPasswordRequired) {
    return (
      <AuthCard title="Đặt lại mật khẩu">
        <form className="flex w-full flex-col gap-5" onSubmit={onSubmit}>
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Mật khẩu tạm thời cần được đổi trước khi vào hệ thống.
          </p>
          <PasswordField
            label="Mật khẩu mới"
            value={password}
            onChange={setPassword}
            placeholder="Nhập mật khẩu mới"
            autoComplete="new-password"
            disabled={pending}
          />
          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirm}
            onChange={setConfirm}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            disabled={pending}
          />
          {error ? <p className="text-sm text-[var(--color-semantic-error)]">{error}</p> : null}
          <Button type="submit" block disabled={!canSubmit} loading={pending}>
            {pending ? "Đang lưu" : "Lưu mật khẩu mới"}
          </Button>
          <Link to="/" className={textLinkClass}>
            Quay lại đăng nhập
          </Link>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Đặt lại mật khẩu">
      <form className="flex w-full flex-col gap-5">
        <Field label="Mã xác nhận" required placeholder="Nhập mã xác nhận" />
        <Field label="Mật khẩu mới" required type="password" autoComplete="new-password" placeholder="Nhập mật khẩu mới" />
        <Field label="Xác nhận mật khẩu mới" required type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
        <Button to="/" block>
          Lưu mật khẩu mới
        </Button>
        <Link to="/" className={textLinkClass}>
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthCard>
  );
}

export function SessionExpiredPage() {
  return (
    <AuthCard title="Phiên đăng nhập hết hạn">
      <p className="text-center text-sm leading-5 text-[var(--color-text-muted)]">
        Bạn không thao tác trong 5 phút. Vui lòng đăng nhập lại để tiếp tục.
      </p>
      <Button to="/" block className="mt-2">
        Đăng nhập lại
      </Button>
    </AuthCard>
  );
}

export function LoginRequiredPage() {
  return (
    <AuthCard title="Không tìm thấy thông tin đăng nhập">
      <p className="text-center text-sm leading-5 text-[var(--color-text-muted)]">
        Hệ thống không tìm thấy thông tin đăng nhập hợp lệ. Vui lòng đăng nhập lại.
      </p>
      <Button to="/" block className="mt-2">
        Đăng nhập lại
      </Button>
    </AuthCard>
  );
}
