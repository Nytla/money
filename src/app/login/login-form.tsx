"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-describedby={state.error ? "password-error" : undefined}
          aria-invalid={state.error ? true : undefined}
          className="rounded-md border border-black/20 bg-transparent px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-current dark:border-white/25"
        />
      </div>

      {state.error ? (
        <p id="password-error" role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current disabled:opacity-60"
      >
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}
