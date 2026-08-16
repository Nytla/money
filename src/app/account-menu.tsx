"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, logout } from "./account-actions";
import { emptyChangePasswordState } from "./account-form-state";

const buttonClass =
  "rounded-md border border-black/20 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-current dark:border-white/25";

export function AccountMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    emptyChangePasswordState,
  );

  useEffect(() => {
    if (state.ok) dialogRef.current?.close();
  }, [state.ok]);

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={buttonClass}>
        Сменить пароль
      </button>

      <form action={logout}>
        <button type="submit" className={buttonClass}>
          Выход
        </button>
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby="change-password-title"
        className="m-auto w-full max-w-md rounded-lg bg-background p-6 text-foreground backdrop:bg-black/50"
      >
        <h2 id="change-password-title" className="mb-4 text-lg font-semibold">
          Смена пароля
        </h2>

        <form action={formAction} className="flex flex-col gap-4">
          <PasswordField
            id="currentPassword"
            label="Текущий пароль"
            autoComplete="current-password"
            error={state.fieldErrors.currentPassword}
          />
          <PasswordField
            id="newPassword"
            label="Новый пароль"
            autoComplete="new-password"
            error={state.fieldErrors.newPassword}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md border border-black/20 px-3 py-2 text-sm dark:border-white/25"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "Меняем…" : "Сменить"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
