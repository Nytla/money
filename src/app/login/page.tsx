import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход — money.com",
};

export default async function LoginPage() {
  // Решение принимается здесь, а не в proxy: только тут доступна БД, а значит
  // видно, не обесценил ли токен сменившийся пароль.
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className="text-sm opacity-70">Учёт доходов и расходов</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
