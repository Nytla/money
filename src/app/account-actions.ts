"use server";

import { redirect } from "next/navigation";
import { changePassword } from "@/lib/account";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyChangePasswordState, type ChangePasswordState } from "./account-form-state";

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireUser();

  const result = await changePassword(prisma, user.id, {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });

  if (!result.ok) {
    return { fieldErrors: { [result.field]: result.error }, ok: false };
  }

  // Версия сессии выросла, и текущая cookie только что обесценилась вместе
  // со всеми остальными. Переиздаём её, чтобы сменивший пароль не вылетел сам.
  await startSession(user.id, result.sessionVersion);

  return { ...emptyChangePasswordState, ok: true };
}
