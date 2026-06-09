import { sileo, type SileoOptions } from "sileo";

/**
 * Thin adapter over Sileo (https://sileo.aaryan.design) — the project's single
 * toast system. Accepts either a plain message string or a full SileoOptions
 * object, so simple call sites stay terse: `toast.success("Saved")`.
 */
type ToastInput = string | SileoOptions;

const normalize = (input: ToastInput): SileoOptions =>
  typeof input === "string" ? { title: input } : input;

export const toast = {
  show: (input: ToastInput) => sileo.show(normalize(input)),
  success: (input: ToastInput) => sileo.success(normalize(input)),
  error: (input: ToastInput) => sileo.error(normalize(input)),
  warning: (input: ToastInput) => sileo.warning(normalize(input)),
  info: (input: ToastInput) => sileo.info(normalize(input)),
  action: (input: ToastInput) => sileo.action(normalize(input)),
  promise: sileo.promise,
  dismiss: sileo.dismiss,
  clear: sileo.clear,
};

export type { SileoOptions };
