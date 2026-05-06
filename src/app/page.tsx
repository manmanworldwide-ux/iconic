import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const features = [
  {
    icon: "⚡",
    title: "Next.js 15 App Router",
    description:
      "Built on the latest Next.js with the App Router, React Server Components, and streaming.",
  },
  {
    icon: "🔐",
    title: "Supabase Auth",
    description:
      "Full authentication flow with email/password, magic links, and OAuth providers out of the box.",
  },
  {
    icon: "🎨",
    title: "Tailwind CSS",
    description:
      "Utility-first styling with a consistent design system, dark mode ready, and fully customizable.",
  },
  {
    icon: "🛡️",
    title: "Type-safe",
    description:
      "End-to-end TypeScript with strict mode. Catch bugs at compile time, not in production.",
  },
  {
    icon: "🗄️",
    title: "Supabase Database",
    description:
      "Postgres database with Row Level Security, real-time subscriptions, and auto-generated APIs.",
  },
  {
    icon: "🚀",
    title: "Production-ready",
    description:
      "Middleware for route protection, server-side rendering, and optimized for Vercel deployment.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for side projects and experiments.",
    features: ["3 projects", "10k requests/mo", "Community support", "Basic analytics"],
    cta: "Get started",
    href: "/auth/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited projects",
      "1M requests/mo",
      "Priority support",
      "Advanced analytics",
      "Custom domains",
    ],
    cta: "Start free trial",
    href: "/auth/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "Dedicated infrastructure and SLAs.",
    features: [
      "Everything in Pro",
      "SLA guarantee",
      "Dedicated support",
      "SSO / SAML",
      "On-premise option",
    ],
    cta: "Contact sales",
    href: "mailto:sales@example.com",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white py-24 sm:py-32">
        <div className="container-app text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            🎉 Open source SaaS template
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
            Ship your SaaS{" "}
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
              faster
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            A production-ready template with authentication, database, and a beautiful UI — so you
            can focus on building features, not boilerplate.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg">Get started for free</Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required</p>
        </div>

        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 opacity-20"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-brand-400 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container-app">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to ship
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stop rebuilding the same foundation. Start with a solid base and iterate fast.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} hover>
                <CardHeader>
                  <span className="text-3xl">{feature.icon}</span>
                  <CardTitle className="mt-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="container-app">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={[
                  "relative rounded-2xl p-8 shadow-sm",
                  plan.highlighted
                    ? "border-2 border-brand-500 bg-white ring-4 ring-brand-100"
                    : "border border-gray-200 bg-white",
                ].join(" ")}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">/ {plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-brand-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href={plan.href}>
                    <Button
                      variant={plan.highlighted ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-app text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to build something great?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Join thousands of developers who ship faster with Iconic.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg">Start building for free</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
