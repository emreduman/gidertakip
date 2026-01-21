import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex border-b pb-6 mb-6">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          GiderTakip&nbsp;
          <code className="font-mono font-bold">App</code>
        </p>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Kurumsal Harcama Takip Sistemi</h1>
        <p className="text-xl mb-8 text-gray-600">
          Kurumunuzun harcamalarını yapay zeka desteğiyle kolayca yönetin.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-500 transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            Panele Git
          </Link>
        </div>
      </div>
    </main>
  );
}
