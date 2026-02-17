'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        // Detect theme
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
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

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section with Gradient */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
                </div>

                {/* Navigation */}
                <nav className="absolute top-0 left-0 right-0 z-20 p-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img 
                                src="/Logo White.png" 
                                alt="Whitespace" 
                                className="h-10 w-auto"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/login"
                                className="px-4 py-2 text-white hover:text-primary-glow transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link 
                                href="/signup"
                                className="px-6 py-2 bg-primary hover:bg-primary-glow text-primary-foreground rounded-lg font-semibold transition-all hover:scale-105"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
                        Your AI-Powered
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A2B758] to-[#B5C778]">
                            CRM Platform
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
                        Transform your sales process with intelligent automation, 
                        seamless team collaboration, and actionable insights.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            href="/signup"
                            className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-glow text-primary-foreground rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            Start Free Trial
                            <ArrowRight size={20} />
                        </Link>
                        <Link 
                            href="/dashboard"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg font-semibold text-lg transition-all border border-white/20"
                        >
                            View Demo
                        </Link>
                    </div>
                    
                    {/* Trust Indicators */}
                    <div className="mt-16 flex items-center justify-center gap-8 text-white/80 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield size={16} />
                            <span>Enterprise Security</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={16} />
                            <span>Lightning Fast</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={16} />
                            <span>Cloud Based</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/50 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-background">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
                        <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
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
            <section className="py-24 bg-secondary text-secondary-foreground">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">10K+</div>
                            <div className="text-secondary-foreground/80">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">99.9%</div>
                            <div className="text-secondary-foreground/80">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">50M+</div>
                            <div className="text-secondary-foreground/80">Contacts Managed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-bold mb-2">24/7</div>
                            <div className="text-secondary-foreground/80">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-background">
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
                            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-border shadow-2xl overflow-hidden group">
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
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
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
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
            <section className="py-24 bg-muted">
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
                            <div key={i} className="bg-card border border-border rounded-xl p-8">
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
            <section className="py-24 bg-primary">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
                        Ready to transform your sales process?
                    </h2>
                    <p className="text-xl text-primary-foreground/90 mb-8">
                        Join thousands of teams already using Whitespace CRM
                    </p>
                    <Link 
                        href="/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Get Started Free
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-secondary text-secondary-foreground">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <img 
                                src="/Logo White.png" 
                                alt="Whitespace" 
                                className="h-8 w-auto mb-4"
                            />
                            <p className="text-secondary-foreground/80 text-sm">
                                AI-powered CRM for modern sales teams
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-secondary-foreground/80">
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Features</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Pricing</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Integrations</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-secondary-foreground/80">
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">About</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Blog</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Careers</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-secondary-foreground/80">
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Help Center</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Contact</Link></li>
                                <li><Link href="/dashboard" className="hover:text-secondary-foreground">Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-secondary-foreground/20 pt-8 text-center text-sm text-secondary-foreground/60">
                        © 2026 Whitespace CRM. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
