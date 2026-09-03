import Link from "next/link";

const features = [
  {
    icon: "⏱️",
    title: "Timed Examinations",
    desc: "Server-synchronized countdown timer ensures accurate exam timing. Browser manipulation cannot affect exam duration.",
  },
  {
    icon: "✅",
    title: "Automatic Marking",
    desc: "Instant scoring upon submission. Get your results immediately with detailed breakdown of correct and incorrect answers.",
  },
  {
    icon: "🔀",
    title: "Question Randomization",
    desc: "Questions and answer options are randomized per student, reducing the risk of copying and ensuring exam integrity.",
  },
  {
    icon: "📊",
    title: "Real-time Progress",
    desc: "Visual question palette shows answered, unanswered, and flagged questions at a glance for easy navigation.",
  },
  {
    icon: "🔒",
    title: "Secure Sessions",
    desc: "Exam sessions are server-validated. Refreshing the page restores your session without losing progress.",
  },
  {
    icon: "📈",
    title: "Detailed Reports",
    desc: "Comprehensive performance reports for both students and administrators with subject-wise analysis.",
  },
];

const stats = [
  { value: "100%", label: "Uptime Reliability" },
  { value: "< 1s", label: "Answer Save Speed" },
  { value: "40+", label: "Question Types" },
  { value: "∞", label: "Exam Capacity" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-[#1e3a5f] text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#1e3a5f] font-black text-sm">CBT</span>
              </div>
              <span className="font-bold text-lg tracking-tight">
                CBT <span className="text-[#0ea5e9]">PRO</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-blue-200 hover:text-white text-sm transition-colors">Features</a>
              <a href="#about" className="text-blue-200 hover:text-white text-sm transition-colors">About</a>
              <Link href="/auth/login" className="text-blue-200 hover:text-white text-sm transition-colors">Student Login</Link>
              <Link
                href="/auth/login?role=admin"
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Admin Login
              </Link>
            </div>
            <div className="md:hidden flex gap-2">
              <Link href="/auth/login" className="text-blue-200 hover:text-white text-sm">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e3a5f] via-[#1e4080] to-[#0f2744] text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Professional CBT Platform — Nigeria&apos;s Most Trusted
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Professional CBT
            <br />
            <span className="text-[#0ea5e9]">Examination Platform</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-10 leading-relaxed">
            Create, manage and take secure computer-based examinations with real-time
            timing, automatic marking and detailed results. Built for Nigerian secondary
            schools, universities, and training centres.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-blue-900/30"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all"
            >
              Student Login
            </Link>
            <Link
              href="/auth/login?role=admin"
              className="bg-transparent hover:bg-white/10 border-2 border-[#0ea5e9] text-[#0ea5e9] px-8 py-4 rounded-xl text-lg font-semibold transition-all"
            >
              Admin Login
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-[#0ea5e9]">{s.value}</p>
                <p className="text-sm text-blue-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#1e3a5f] mb-4">
              Everything You Need for CBT
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              A complete examination management system built with security, fairness, and ease-of-use at its core.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CBT Interface Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-[#1e3a5f] mb-4">
              Professional Exam Interface
            </h2>
            <p className="text-gray-500 text-lg">
              Clean, distraction-free examination environment inspired by JAMB CBT
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Mock exam header */}
            <div className="bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-[#1e3a5f] font-black text-xs">CBT</span>
                </div>
                <span className="font-semibold text-sm">JAMB Mathematics Practice</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-blue-200">Question: <span className="text-white font-bold">17 / 40</span></span>
                <div className="bg-red-500 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm">
                  28:43
                </div>
              </div>
            </div>
            <div className="flex">
              <div className="flex-1 p-8">
                <div className="mb-6">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Question 17</span>
                  <p className="text-lg font-medium text-gray-800 mt-2">
                    If 2x + 4 = 10, what is the value of x?
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "A", text: "2" },
                    { label: "B", text: "3", selected: true },
                    { label: "C", text: "4" },
                    { label: "D", text: "5" },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        opt.selected
                          ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          opt.selected
                            ? "bg-[#1e3a5f] text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {opt.label}
                      </div>
                      <span className="text-gray-800 font-medium">{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Question palette */}
              <div className="w-56 border-l border-gray-100 p-4 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Question Palette</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
                    <div
                      key={n}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
                        n < 10 ? "bg-green-100 text-green-700 border border-green-200" :
                        n === 17 ? "bg-[#1e3a5f] text-white" :
                        n === 22 || n === 31 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                        "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div> Answered
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div> Unanswered
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div> Flagged
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-4 h-4 bg-[#1e3a5f] rounded"></div> Current
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-[#1e3a5f] mb-6">
                Built for Nigerian Education
              </h2>
              <p className="text-gray-500 mb-4 leading-relaxed">
                CBT PRO is designed specifically for Nigerian examination standards including JAMB UTME,
                WAEC, NECO, and internal university/college examinations.
              </p>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Our platform provides a secure, reliable, and easy-to-use CBT experience for students
                and powerful management tools for administrators.
              </p>
              <ul className="space-y-3">
                {[
                  "JAMB-style CBT interface",
                  "Multiple role management",
                  "Offline answer caching",
                  "Bulk question import via CSV",
                  "Detailed performance analytics",
                  "Printable result sheets",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2563eb] rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Get Started Today</h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="font-semibold mb-1">👨‍🎓 For Students</p>
                  <p className="text-blue-200 text-sm">Register, access exams, practice, and review your results instantly.</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="font-semibold mb-1">👨‍💼 For Administrators</p>
                  <p className="text-blue-200 text-sm">Create exams, manage questions, monitor students, and generate reports.</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="font-semibold mb-1">🏫 For Institutions</p>
                  <p className="text-blue-200 text-sm">Full control over examination workflow, scheduling, and results management.</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/auth/register"
                  className="flex-1 bg-white text-[#1e3a5f] py-3 rounded-xl text-center font-bold text-sm hover:bg-blue-50 transition-colors"
                >
                  Register
                </Link>
                <Link
                  href="/auth/login"
                  className="flex-1 bg-[#0ea5e9] py-3 rounded-xl text-center font-bold text-sm hover:bg-[#0284c7] transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1e3a5f] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">Ready to Start Your Exam?</h2>
          <p className="text-blue-200 mb-8">
            Join thousands of students and institutions using CBT PRO for secure, reliable examinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-3.5 rounded-xl font-bold transition-colors"
            >
              Create Student Account
            </Link>
            <Link
              href="/auth/login?role=admin"
              className="border-2 border-white/30 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">CBT</span>
              </div>
              <span className="font-bold text-white">CBT <span className="text-[#0ea5e9]">PRO</span></span>
            </div>
            <p className="text-sm">© 2024 CBT PRO. Professional Computer-Based Testing Platform.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/auth/login" className="hover:text-white transition-colors">Student Login</Link>
              <Link href="/auth/login?role=admin" className="hover:text-white transition-colors">Admin Login</Link>
              <Link href="/auth/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
