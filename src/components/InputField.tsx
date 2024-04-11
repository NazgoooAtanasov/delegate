import React from "preact/compat";

type InputFieldProps = {
  name: string;
  placeholder?: string;
  value?: string;
  type?: string;
  className?: string;
  autofocus?: boolean;
  disabled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
  onChange?: (e: Event) => void;
  onFocus?: (e: Event) => void;
  onBlur?: (e: Event) => void;
};

export default function InputField({
  name,
  ref,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  className = "",
  type = "text",
  autofocus = true,
  disabled = false,
}: InputFieldProps) {
  return (
    <input
      autofocus={autofocus}
      disabled={disabled}
      type={type}
      name={name}
      className={className + " ml-[5px] mr-[5px] bg-inherit outline-none placeholder:text-gray-800"}
      ref={ref}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}
