import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <SignUp />
    </main>
  );
}
