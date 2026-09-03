/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";

interface GoogleTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const GoogleTextField = React.forwardRef<
  HTMLInputElement,
  GoogleTextFieldProps
>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      className = "",
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : defaultValue !== undefined
          ? String(defaultValue).length > 0
          : false;

    const isFloating = isFocused || hasValue;

    return (
      <div className="w-full flex flex-col group/field text-left">
        <div
          className={`relative flex items-center min-h-[50px] sm:min-h-[54px] rounded-[4px] border transition-all duration-200 bg-transparent ${
            error
              ? "border-red-600 dark:border-red-400 ring-1 ring-red-600 dark:ring-red-400"
              : isFocused
                ? "border-blue-600 dark:border-blue-400 ring-1 ring-blue-600 dark:ring-blue-400"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-700 dark:hover:border-slate-400"
          }`}
        >
          {leadingIcon && (
            <div
              className={`pl-3 pr-1 shrink-0 transition-colors ${
                error
                  ? "text-red-600 dark:text-red-400"
                  : isFocused
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {leadingIcon}
            </div>
          )}

          {/* Floating Label */}
          <label
            htmlFor={inputId}
            className={`absolute pointer-events-none transition-all duration-150 ease-out origin-top-left select-none truncate max-w-[calc(100%-2rem)] ${
              leadingIcon ? "left-9" : "left-3"
            } ${
              isFloating
                ? `-top-2.5 px-1.5 text-xs font-medium bg-white dark:bg-[#1e1f20] ${
                    error
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : isFocused
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                  }`
                : "top-1/2 -translate-y-1/2 text-sm sm:text-[15px] text-slate-500 dark:text-slate-400"
            }`}
          >
            {label}
          </label>

          <input
            id={inputId}
            ref={ref}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`w-full h-full bg-transparent px-3.5 py-3 sm:py-3.5 text-sm sm:text-[15px] text-slate-900 dark:text-slate-100 rounded-[4px] focus:outline-none placeholder-transparent ${className}`}
            {...props}
          />

          {trailingIcon && (
            <div className="pr-3 pl-1 shrink-0">{trailingIcon}</div>
          )}
        </div>

        {error ? (
          <p className="mt-1 ml-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1 ml-1 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

GoogleTextField.displayName = "GoogleTextField";
