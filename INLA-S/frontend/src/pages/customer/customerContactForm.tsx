import { Field } from "../../components/ui/Field";
import { formatPhoneDisplay } from "../../lib/phoneVN";
import { customerFormIcons } from "./customerFormIcons";
import { validateEmailField, validatePhoneField } from "./customerValidation";

export type ContactFormValues = {
  fullName: string;
  jobTitle: string;
  department: string;
  phone: string;
  email: string;
  notes: string;
};

export type ContactFormFieldKey = keyof ContactFormValues;

export function contactFormTouched(values: ContactFormValues): boolean {
  return [values.fullName, values.jobTitle, values.department, values.phone, values.email, values.notes].some(
    (value) => value.trim().length > 0,
  );
}

export function validateContactForm(
  values: ContactFormValues,
  options?: { requireAll?: boolean },
): Partial<Record<ContactFormFieldKey, string>> {
  if (!options?.requireAll && !contactFormTouched(values)) return {};
  const errors: Partial<Record<ContactFormFieldKey, string>> = {};
  if (!values.fullName.trim()) errors.fullName = "Nhập họ và tên.";
  const phoneErr = validatePhoneField(values.phone);
  if (phoneErr) errors.phone = phoneErr;
  const emailErr = validateEmailField(values.email);
  if (emailErr) errors.email = emailErr;
  return errors;
}

export function phoneForForm(stored: string): string {
  const display = formatPhoneDisplay(stored);
  return display === "—" ? stored : display;
}

type ContactFormFieldsProps = {
  values: ContactFormValues;
  errors: Partial<Record<ContactFormFieldKey, string>>;
  onChange: (key: ContactFormFieldKey, value: string) => void;
  onPhoneBlur: () => void;
  required?: boolean;
  primaryMode: "checkbox" | "select";
  isPrimary: boolean | string;
  onPrimaryChange: (value: boolean | string) => void;
  layout?: "grid" | "stack";
};

export function ContactFormFields({
  values,
  errors,
  onChange,
  onPhoneBlur,
  required = true,
  primaryMode,
  isPrimary,
  onPrimaryChange,
  layout = "grid",
}: ContactFormFieldsProps) {
  const wrapClass = layout === "grid" ? "grid gap-4 md:grid-cols-2" : "grid gap-4";

  return (
  <>
      <div className={wrapClass}>
        <Field
          label="Họ và tên"
          labelOnHover
          required={required}
          requiredInside={required}
          icon={customerFormIcons.person}
          value={values.fullName}
          error={errors.fullName}
          placeholder="Nhập họ và tên"
          onChange={(value) => onChange("fullName", value)}
        />
        <Field
          label="Chức vụ"
          labelOnHover
          icon={customerFormIcons.jobTitle}
          value={values.jobTitle}
          placeholder="Trưởng phòng Thu mua"
          onChange={(value) => onChange("jobTitle", value)}
        />
        <Field
          label="Phòng ban"
          labelOnHover
          icon={customerFormIcons.department}
          value={values.department}
          placeholder="Phòng ban"
          onChange={(value) => onChange("department", value)}
        />
        <Field
          label="Số điện thoại"
          labelOnHover
          required={required}
          requiredInside={required}
          icon={customerFormIcons.phone}
          value={values.phone}
          error={errors.phone}
          placeholder="Nhập số điện thoại"
          onChange={(value) => onChange("phone", value)}
          onBlur={onPhoneBlur}
        />
        <Field
          label="Email"
          labelOnHover
          required={required}
          requiredInside={required}
          icon={customerFormIcons.email}
          value={values.email}
          error={errors.email}
          placeholder="Nhập địa chỉ email"
          onChange={(value) => onChange("email", value)}
        />
        <Field
          label="Ghi chú"
          labelOnHover
          icon={customerFormIcons.notes}
          as="textarea"
          rows={1}
          value={values.notes}
          placeholder="Ghi chú về người liên hệ"
          onChange={(value) => onChange("notes", value)}
        />
      </div>
      {primaryMode === "select" ? (
        <Field
          label="Vai trò liên hệ"
          labelOnHover
          icon={customerFormIcons.role}
          as="select"
          options={[
            { value: "true", label: "Liên hệ chính" },
            { value: "false", label: "Liên hệ phụ" },
          ]}
          value={typeof isPrimary === "string" ? isPrimary : isPrimary ? "true" : "false"}
          onChange={(value) => onPrimaryChange(value)}
        />
      ) : (
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(isPrimary)}
            onChange={(e) => onPrimaryChange(e.target.checked)}
          />
          Liên hệ chính
        </label>
      )}
    </>
  );
}
