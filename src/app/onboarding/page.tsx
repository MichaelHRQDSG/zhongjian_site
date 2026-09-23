export default function OnboardingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5EFE6] px-6">
      <section className="max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#0F2E5F]">企业专属测评</h1>
        <p className="mt-4 leading-7 text-[#4A5A78]">
          此测评仅通过企业专属链接开放，请使用企业提供的链接或二维码进入。
        </p>
        <a className="mt-7 inline-flex rounded-xl bg-[#1E4C9A] px-5 py-3 text-sm font-medium text-white" href="/">
          返回首页
        </a>
      </section>
    </main>
  );
}
