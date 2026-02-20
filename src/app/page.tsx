'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, MessageSquare, BarChart3, Zap, Shield, Globe, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LandingPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // App screenshots for the carousel
    const appScreenshots = [
        { src: '/screenshots/dashboard.png', alt: 'Dashboard Overview', title: 'Dashboard' },
        { src: '/screenshots/contacts.png', alt: 'Contact Management', title: 'Contacts' },
        { src: '/screenshots/opportunities.png', alt: 'Deal Pipeline', title: 'Opportunities' },
        { src: '/screenshots/team.png', alt: 'Team Collaboration', title: 'Team' },
        { src: '/screenshots/chat.png', alt: 'AI Chat Assistant', title: 'AI Chat' },
    ];

    useEffect(() => {
        const resolveTheme = (): 'light' | 'dark' => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                return savedTheme;
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };

        const applyTheme = (nextTheme: 'light' | 'dark') => {
            setTheme(nextTheme);
            document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        };

        const handleStorageThemeChange = (event: StorageEvent) => {
            if (event.key === 'theme') {
                applyTheme(resolveTheme());
            }
        };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                return;
            }
            applyTheme(mediaQuery.matches ? 'dark' : 'light');
        };

        applyTheme(resolveTheme());
        window.addEventListener('storage', handleStorageThemeChange);
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageThemeChange);
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % appScreenshots.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + appScreenshots.length) % appScreenshots.length);
    };

    const goToImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    const isDarkTheme = theme === 'dark';
    const brandWordmark = isDarkTheme ? '/Logo White.png' : '/Logo Black.png';
    const brandIcon = isDarkTheme ? '/Icon White.png' : '/Icon Black.png';
    const featureCardClasses = isDarkTheme
        ? 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-primary/70'
        : 'bg-card border-border hover:shadow-xl';

    return (
        <div className={`min-h-screen text-foreground ${isDarkTheme ? 'bg-[#090b10]' : 'bg-background'}`}>
            {/* Hero Section with Gradient */}
            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-0 pb-14 pt-28 sm:pb-20 sm:pt-32">
                {/* Gradient Background */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: 'url(/Whitespace-Logo-Production_Gradient-Dark-1.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: isDarkTheme
                                ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.58) 45%, rgba(0, 0, 0, 0.86) 100%)'
                                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.26) 0%, rgba(0, 0, 0, 0.34) 45%, rgba(0, 0, 0, 0.62) 100%)',
                        }}
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: isDarkTheme
                                ? 'radial-gradient(circle at top, rgba(162, 183, 88, 0.22) 0%, rgba(0, 0, 0, 0) 56%)'
                                : 'radial-gradient(circle at top, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 60%)',
                        }}
                    />
                </div>

                {/* Navigation */}
                <nav className="absolute left-0 right-0 top-0 z-20 p-4 sm:p-6">
                    <div
                        className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-3 py-3 sm:px-5 ${
                            isDarkTheme
                                ? 'border-white/15 bg-black/35 backdrop-blur-xl'
                                : 'border-black/10 bg-white/75 shadow-lg shadow-black/5 backdrop-blur-xl'
                        }`}
                    >
                        <Link href="/" className="flex min-w-0 items-center gap-3">
                            <Image
                                src={brandIcon}
                                alt="Whitespace icon"
                                width={40}
                                height={40}
                                priority
                                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                            />
                            <Image
                                src={brandWordmark}
                                alt="Whitespace"
                                width={220}
                                height={34}
                                priority
                                className="hidden h-8 w-auto object-contain object-left sm:block"
                            />
                            <span className={`text-sm font-semibold tracking-wide sm:hidden ${isDarkTheme ? 'text-white' : 'text-[#0A2C19]'}`}>
                                Whitespace
                            </span>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link
                                href="/login"
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                                    isDarkTheme
                                        ? 'text-white/90 hover:bg-white/10 hover:text-white'
                                        : 'text-[#0A2C19] hover:bg-black/5'
                                }`}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.02] sm:px-6 ${
                                    isDarkTheme
                                        ? 'bg-[#B2C76B] text-[#111410] hover:bg-[#C3D97D] shadow-lg shadow-black/25'
                                        : 'bg-[#A2B758] text-white hover:bg-[#B5C778] shadow-md shadow-black/10'
                                }`}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
                    <h1 className="mb-6 text-4xl font-bold leading-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl lg:text-8xl">
                        Your AI-Powered
                        <br />
                        <span
                            className={`bg-gradient-to-r bg-clip-text text-transparent ${
                                isDarkTheme ? 'from-[#BBD06B] to-[#D4E68F]' : 'from-[#98AB4E] to-[#B5C778]'
                            }`}
                        >
                            CRM Platform
                        </span>
                    </h1>
                    <p className="mx-auto mb-10 max-w-3xl text-base text-white/90 sm:mb-12 sm:text-xl md:text-2xl">
                        Transform your sales process with intelligent automation, seamless team collaboration, and actionable insights.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/signup"
                            className={`flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold transition-all hover:scale-[1.02] sm:w-auto ${
                                isDarkTheme
                                    ? 'bg-[#B2C76B] text-[#111410] hover:bg-[#C3D97D] shadow-xl shadow-black/35'
                                    : 'bg-[#A2B758] text-white hover:bg-[#B5C778] shadow-xl shadow-black/20'
                            }`}
                        >
                            Start Free Trial
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/dashboard"
                            className={`w-full rounded-lg border px-8 py-4 text-lg font-semibold transition-all sm:w-auto ${
                                isDarkTheme
                                    ? 'border-white/25 bg-white/10 text-white hover:bg-white/20'
                                    : 'border-white/35 bg-white/25 text-white hover:bg-white/35'
                            }`}
                        >
                            View Demo
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 text-sm sm:mt-16 sm:grid-cols-3 sm:gap-8">
                        <div className="flex items-center justify-center gap-2 text-white/85">
                            <Shield size={16} />
                            <span>Enterprise Security</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-white/85">
                            <Zap size={16} />
                            <span>Lightning Fast</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-white/85">
                            <Globe size={16} />
                            <span>Cloud Based</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce sm:block">
                    <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/50 p-2">
                        <div className="h-2 w-1 rounded-full bg-white/50" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={`py-20 sm:py-24 ${isDarkTheme ? 'bg-[#0b0f16]' : 'bg-background'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Everything you need to close more deals
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed to supercharge your sales team
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <MessageSquare className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                AI Chat Assistant
                            </h3>
                            <p className="text-muted-foreground">
                                Get instant insights and automate tasks with our intelligent AI assistant that understands your business.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Users className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Team Collaboration
                            </h3>
                            <p className="text-muted-foreground">
                                Work seamlessly with your team. Share contacts, track deals, and stay aligned on every opportunity.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Advanced Analytics
                            </h3>
                            <p className="text-muted-foreground">
                                Make data-driven decisions with powerful analytics and customizable dashboards.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Zap className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Workflow Automation
                            </h3>
                            <p className="text-muted-foreground">
                                Automate repetitive tasks and focus on what matters - building relationships and closing deals.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Shield className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Enterprise Security
                            </h3>
                            <p className="text-muted-foreground">
                                Bank-level security with role-based access control, encryption, and compliance features.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className={`${featureCardClasses} border rounded-2xl p-8 transition-all hover:-translate-y-1`}>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Globe className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Integrations (Coming Soon)
                            </h3>
                            <p className="text-muted-foreground">
                                Connect with your favorite tools. Seamlessly integrate with Insightly and more platforms.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section
                className={`py-20 sm:py-24 ${
                    isDarkTheme
                        ? 'bg-gradient-to-br from-[#131a24] via-[#121823] to-[#090d14] text-white'
                        : 'bg-secondary text-secondary-foreground'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold mb-2">10K+</div>
                            <div className={isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}>Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold mb-2">99.9%</div>
                            <div className={isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}>Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold mb-2">50M+</div>
                            <div className={isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}>Contacts Managed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold mb-2">24/7</div>
                            <div className={isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}>Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className={`py-20 sm:py-24 ${isDarkTheme ? 'bg-[#0b0f16]' : 'bg-background'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                                Close deals faster with intelligent automation
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                Whitespace CRM combines the power of AI with intuitive design to help your team 
                                work smarter, not harder. Automate repetitive tasks, gain insights from your data, 
                                and focus on building meaningful relationships.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-primary flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <span className="font-semibold text-foreground">Smart Pipeline Management</span>
                                        <p className="text-muted-foreground text-sm">Track deals through every stage with visual pipelines</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-primary flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <span className="font-semibold text-foreground">AI-Powered Insights</span>
                                        <p className="text-muted-foreground text-sm">Get recommendations and predictions based on your data</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-primary flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <span className="font-semibold text-foreground">Customizable Dashboards</span>
                                        <p className="text-muted-foreground text-sm">Build the perfect workspace with drag-and-drop widgets</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-primary flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <span className="font-semibold text-foreground">Real-Time Collaboration</span>
                                        <p className="text-muted-foreground text-sm">Work together with your team in real-time</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="relative">
                            {/* Image Carousel */}
                            <div
                                className={`relative group aspect-video overflow-hidden rounded-2xl border shadow-2xl ${
                                    isDarkTheme
                                        ? 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03]'
                                        : 'border-border bg-gradient-to-br from-primary/20 to-secondary/20'
                                }`}
                            >
                                {/* Screenshots */}
                                <div className="relative w-full h-full">
                                    {appScreenshots.map((screenshot, index) => (
                                        <div
                                            key={index}
                                            className={`absolute inset-0 transition-opacity duration-500 ${
                                                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        >
                                            <img
                                                src={screenshot.src}
                                                alt={screenshot.alt}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image doesn't exist
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            {/* Fallback content */}
                                            <div
                                                className={`absolute inset-0 flex items-center justify-center ${
                                                    isDarkTheme
                                                        ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.04]'
                                                        : 'bg-gradient-to-br from-primary/20 to-secondary/20'
                                                }`}
                                            >
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-foreground mb-2">
                                                        {screenshot.title}
                                                    </div>
                                                    <div className="text-muted-foreground">Preview Coming Soon</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevImage}
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
                                        isDarkTheme ? 'bg-black/60 hover:bg-black/80' : 'bg-black/45 hover:bg-black/65'
                                    }`}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
                                        isDarkTheme ? 'bg-black/60 hover:bg-black/80' : 'bg-black/45 hover:bg-black/65'
                                    }`}
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Image Title Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                    <div className="text-white font-semibold text-lg">
                                        {appScreenshots[currentImageIndex].title}
                                    </div>
                                </div>

                                {/* Dot Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {appScreenshots.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToImage(index)}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                index === currentImageIndex
                                                    ? 'bg-white w-8'
                                                    : 'bg-white/50 hover:bg-white/75'
                                            }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className={`py-20 sm:py-24 ${isDarkTheme ? 'bg-[#0f1520]' : 'bg-muted'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Loved by sales teams worldwide
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            See what our customers have to say
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Whitespace CRM transformed how our team works. The AI assistant saves us hours every week.",
                                author: "Sarah Johnson",
                                role: "Sales Director",
                                company: "TechCorp"
                            },
                            {
                                quote: "The best CRM we've used. Intuitive, powerful, and actually helps us close more deals.",
                                author: "Michael Chen",
                                role: "VP of Sales",
                                company: "Growth Inc"
                            },
                            {
                                quote: "Implementation was seamless, and the support team is incredible. Highly recommend!",
                                author: "Emily Rodriguez",
                                role: "CEO",
                                company: "StartupX"
                            }
                        ].map((testimonial, i) => (
                            <div
                                key={i}
                                className={`rounded-xl border p-8 ${
                                    isDarkTheme ? 'border-white/10 bg-white/[0.04]' : 'border-border bg-card'
                                }`}
                            >
                                <p className="text-foreground mb-6 text-lg">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>
                                <div>
                                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {testimonial.role}, {testimonial.company}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`py-20 sm:py-24 ${isDarkTheme ? 'bg-gradient-to-r from-[#2e2250] via-[#422d72] to-[#553a93]' : 'bg-primary'}`}>
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-primary-foreground'}`}>
                        Ready to transform your sales process?
                    </h2>
                    <p className={`text-xl mb-8 ${isDarkTheme ? 'text-white/90' : 'text-primary-foreground/90'}`}>
                        Join thousands of teams already using Whitespace CRM
                    </p>
                    <Link
                        href="/signup"
                        className={`inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-xl ${
                            isDarkTheme
                                ? 'bg-white/95 text-[#2e2250] hover:bg-white'
                                : 'bg-white text-primary'
                        }`}
                    >
                        Get Started Free
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-12 ${isDarkTheme ? 'bg-[#090d14] text-white' : 'bg-secondary text-secondary-foreground'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <Image
                                src="/Logo White.png"
                                alt="Whitespace"
                                width={170}
                                height={26}
                                className="h-8 w-auto mb-4"
                            />
                            <p className={`text-sm ${isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}`}>
                                AI-powered CRM for modern sales teams
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className={`space-y-2 text-sm ${isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}`}>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Features</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Pricing</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Integrations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className={`space-y-2 text-sm ${isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}`}>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>About</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Blog</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Careers</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className={`space-y-2 text-sm ${isDarkTheme ? 'text-white/75' : 'text-secondary-foreground/80'}`}>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Help Center</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Contact</Link></li>
                                <li><Link href="/dashboard" className={isDarkTheme ? 'hover:text-white' : 'hover:text-secondary-foreground'}>Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div
                        className={`border-t pt-8 text-center text-sm ${
                            isDarkTheme ? 'border-white/15 text-white/55' : 'border-secondary-foreground/20 text-secondary-foreground/60'
                        }`}
                    >
                        © 2026 Whitespace CRM. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
