"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange"
> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  leftElement?: ReactNode;

  value?: string | string[];
  defaultValue?: string | string[];

  onChange?: (value: string | string[]) => void;

  clearable?: boolean;

  /**
   * When true, multiple options can be selected.
   * Default: false
   */
  isMultiSelect?: boolean;
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      label,
      error,
      options = [],
      placeholder = "Select an option",
      leftElement,
      id,
      className = "",
      value,
      defaultValue = "",
      onChange,
      disabled,
      clearable = true,
      isMultiSelect = false,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [internalValue, setInternalValue] = useState<string | string[]>(
      defaultValue,
    );
    const [dropdownPos, setDropdownPos] = useState<{
      top: number;
      left: number;
      width: number;
      openUpward: boolean;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedValue = value !== undefined ? value : internalValue;

    const selectedValues = isMultiSelect
      ? Array.isArray(selectedValue)
        ? selectedValue
        : selectedValue
          ? [selectedValue]
          : []
      : [];

    const selectedOption = !isMultiSelect
      ? options.find((option) => option.value === selectedValue)
      : undefined;

    const selectedOptions = useMemo(() => {
      if (!isMultiSelect) {
        return [];
      }

      return options.filter((option) => selectedValues.includes(option.value));
    }, [options, selectedValues, isMultiSelect]);

    const filteredOptions = useMemo(() => {
      const searchValue = search.trim().toLowerCase();

      if (!searchValue) {
        return options;
      }

      return options.filter((option) =>
        option.label.toLowerCase().includes(searchValue),
      );
    }, [options, search]);

    // Compute the fixed-position coordinates for the portal dropdown,
    // based on the trigger's on-screen position — NOT the DOM tree,
    // so ancestor `overflow: hidden` (e.g. a Dialog) can never clip it.
    const updatePosition = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const dropdownHeight = 260; // approx max-h-60 (240px) + padding/border
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPos({
        top: openUpward ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        openUpward,
      });
    };

    useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
      if (!open) return;

      const handleReposition = () => updatePosition();

      // Keep the dropdown glued to the trigger on scroll/resize,
      // including scroll inside the Dialog body.
      window.addEventListener("scroll", handleReposition, true);
      window.addEventListener("resize", handleReposition);

      return () => {
        window.removeEventListener("scroll", handleReposition, true);
        window.removeEventListener("resize", handleReposition);
      };
    }, [open]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const clickedTrigger = containerRef.current?.contains(target);
        const clickedDropdown = dropdownRef.current?.contains(target);

        if (!clickedTrigger && !clickedDropdown) {
          setOpen(false);
          setSearch("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    useEffect(() => {
      if (open) {
        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });
      }
    }, [open]);

    const handleOpen = () => {
      if (disabled) return;

      setOpen(true);
      setSearch("");
    };

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;

      if (isMultiSelect) {
        const currentValues = Array.isArray(selectedValue)
          ? selectedValue
          : selectedValue
            ? [selectedValue]
            : [];

        const isSelected = currentValues.includes(option.value);

        const nextValues = isSelected
          ? currentValues.filter((item) => item !== option.value)
          : [...currentValues, option.value];

        if (value === undefined) {
          setInternalValue(nextValues);
        }

        onChange?.(nextValues);

        return;
      }

      if (value === undefined) {
        setInternalValue(option.value);
      }

      onChange?.(option.value);

      setOpen(false);
      setSearch("");
    };

    const handleClear = (event?: React.MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();

      if (disabled) return;

      const nextValue = isMultiSelect ? [] : "";

      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);

      setSearch("");
      setOpen(false);
    };

    /*
     * Keyboard handling.
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (event.key === "Enter" || event.key === "ArrowDown") {
        event.preventDefault();

        if (!open) {
          handleOpen();
          return;
        }

        const firstAvailableOption = filteredOptions.find(
          (option) => !option.disabled,
        );

        if (firstAvailableOption) {
          handleSelect(firstAvailableOption);
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();

        setOpen(false);
        setSearch("");
      }
    };

    /*
     * Determine whether anything is selected.
     */
    const hasSelection = isMultiSelect
      ? selectedValues.length > 0
      : !!selectedOption;

    /*
     * Display value for multi-select.
     */
    const multiSelectLabel = selectedOptions
      .map((option) => option.label)
      .join(", ");

    return (
      <div ref={containerRef} className="relative w-full min-w-0">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            {label}
          </label>
        )}

        {/* Select / Search Input */}
        <div className="relative">
          {open ? (
            <input
              ref={searchRef}
              id={id}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={`${id}-listbox`}
              aria-invalid={!!error}
              className={[
                "h-12 w-full min-w-0 rounded-lg border px-4 pr-11 text-sm font-normal text-ink outline-none transition",
                "placeholder:text-muted",
                "disabled:cursor-not-allowed disabled:opacity-60",
                error
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-border bg-[#F2F2F2] focus:border-primary focus:bg-[#F2F2F2] focus:ring-4 focus:ring-primary-soft",
                leftElement ? "pl-11" : "",
                className,
              ].join(" ")}
              {...props}
            />
          ) : (
            <button
              type="button"
              id={id}
              disabled={disabled}
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-invalid={!!error}
              onClick={handleOpen}
              className={[
                "flex h-12 w-full min-w-0 items-center rounded-lg border px-4 pr-20 text-left text-sm font-normal outline-none transition",
                "disabled:cursor-not-allowed disabled:opacity-60",
                error
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  : "border-border bg-[#F2F2F2] focus:border-primary focus:bg-[#F2F2F2] focus:ring-4 focus:ring-primary-soft",
                leftElement ? "pl-11" : "",
                className,
              ].join(" ")}
            >
              <span
                className={
                  hasSelection
                    ? "truncate font-normal text-ink"
                    : "truncate font-normal text-muted"
                }
              >
                {isMultiSelect
                  ? multiSelectLabel || placeholder
                  : selectedOption?.label || placeholder}
              </span>
            </button>
          )}

          {/* Left element */}
          {leftElement && (
            <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
              {leftElement}
            </div>
          )}

          {/* Clear button */}
          {!open && clearable && hasSelection && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-10 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink disabled:pointer-events-none"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Chevron */}
          <div
            className={[
              "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2",
              "text-muted transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Dropdown — rendered through a portal so it escapes any
            ancestor with overflow-hidden (Dialogs, cards, table cells, etc.)
            and always gets its full height + scroll. */}
        {open &&
          dropdownPos &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              id={`${id}-listbox`}
              role="listbox"
              style={{
                position: "fixed",
                top: dropdownPos.openUpward ? undefined : dropdownPos.top + 6,
                bottom: dropdownPos.openUpward
                  ? window.innerHeight - dropdownPos.top + 6
                  : undefined,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 9999,
              }}
              className={[
                "overflow-hidden rounded-lg border border-border",
                "bg-surface shadow-lg",
                "animate-in fade-in-0 zoom-in-95",
              ].join(" ")}
            >
              {/* Scrollable options area */}
              <div className="max-h-60 overflow-y-auto p-1.5">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => {
                    const isSelected = isMultiSelect
                      ? selectedValues.includes(option.value)
                      : option.value === selectedValue;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onClick={() => handleSelect(option)}
                        className={[
                          "flex w-full items-center rounded-lg px-3 py-2.5",
                          "text-left text-sm font-normal",
                          "transition-colors",
                          option.disabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer",
                          isSelected
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-ink hover:bg-surface-muted",
                        ].join(" ")}
                      >
                        {/* Checkbox only for multi-select */}
                        {isMultiSelect && (
                          <span
                            className={[
                              "mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-surface",
                            ].join(" ")}
                          >
                            {isSelected && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 12L10 17L19 7"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                        )}

                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>

                        {/* Existing check icon for single select */}
                        {!isMultiSelect && isSelected && (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="ml-2 shrink-0 text-primary"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 12L10 17L19 7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-muted">
                    No options found
                  </div>
                )}
              </div>

              {/* Fixed / Sticky Clear Selection */}
              {hasSelection && clearable && (
                <div className="sticky bottom-0 border-t border-border bg-surface p-1.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={disabled}
                    className="flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-left text-sm font-normal text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>,
            document.body,
          )}

        {/* Error */}
        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
