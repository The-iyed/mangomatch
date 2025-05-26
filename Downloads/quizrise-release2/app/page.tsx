"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BrainCircuit,
  Loader2,
  FileText,
  Globe,
  Youtube,
  Zap,
  Users,
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
  Star,
  ArrowRight,
  Play,
  Sparkles,
  CheckCircle,
  Clock,
  BarChart,
  Award,
  Brain,
  Lightbulb,
  Layers,
  Puzzle,
} from "lucide-react"
import Link from "next/link"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ParallaxElement } from "@/components/parallax-element"
import { CircleElement, DotsGrid, WaveElement, FloatingShapes, GradientBlob } from "@/components/decorative-elements"
import { useScrollPosition } from "@/hooks/use-scroll-position"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const scrollY = useScrollPosition()
  const mainRef = useRef<HTMLDivElement>(null)
  const supabase = getClientSupabaseInstance()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        // User is authenticated, check their role and redirect
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single()

        if (profile?.role === "admin") {
          window.location.href = "/admin"
        } else {
          window.location.href = "/quizzes"
        }
      } else {
        // Not authenticated, show the landing page
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: FileText,
      title: "PDF Upload",
      description: "Upload any PDF document and let AI extract key concepts for quiz generation",
      color: "bg-blue-500",
    },
    {
      icon: Globe,
      title: "Web Content",
      description: "Paste any URL and create quizzes from web articles and documentation",
      color: "bg-green-500",
    },
    {
      icon: Youtube,
      title: "YouTube Videos",
      description: "Transform educational videos into interactive quizzes automatically",
      color: "bg-red-500",
    },
    {
      icon: BookOpen,
      title: "Text Input",
      description: "Paste any text content and generate comprehensive quizzes instantly",
      color: "bg-purple-500",
    },
  ]

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate quizzes in seconds, not hours",
      stat: "10x faster",
    },
    {
      icon: Target,
      title: "Highly Accurate",
      description: "AI-powered questions with 95% relevance",
      stat: "95% accuracy",
    },
    {
      icon: Users,
      title: "Collaborative",
      description: "Share quizzes and compete with others",
      stat: "Team ready",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Detailed analytics and performance insights",
      stat: "Full analytics",
    },
  ]

  const steps = [
    {
      number: 1,
      title: "Choose Your Source",
      description: "Upload a PDF, paste text, enter a URL, or link a YouTube video",
      icon: FileText,
    },
    {
      number: 2,
      title: "AI Generates Questions",
      description: "Our advanced AI analyzes the content and creates relevant quiz questions",
      icon: BrainCircuit,
    },
    {
      number: 3,
      title: "Take & Share",
      description: "Test your knowledge, share with others, and track your progress",
      icon: Trophy,
    },
  ]

  const testimonials = [
    {
      quote: "QuizRise has transformed how I prepare for exams. The AI-generated questions are spot-on!",
      author: "Sarah J., Student",
      avatar: "/diverse-group-avatars.png",
    },
    {
      quote: "As a teacher, I save hours of work by using QuizRise to create quizzes from my lecture materials.",
      author: "Mark T., Professor",
      avatar: "/diverse-group-avatars.png",
    },
    {
      quote: "The session feature is amazing for live classroom engagement. My students love competing!",
      author: "Lisa R., High School Teacher",
      avatar: "/diverse-group-avatars.png",
    },
  ]

  const features2 = [
    {
      icon: CheckCircle,
      title: "Instant Feedback",
      description: "Get immediate results and explanations for each question",
    },
    {
      icon: Clock,
      title: "Timed Sessions",
      description: "Create live quiz sessions with customizable time limits",
    },
    {
      icon: BarChart,
      title: "Performance Analytics",
      description: "Track progress and identify areas for improvement",
    },
    {
      icon: Award,
      title: "Leaderboards",
      description: "Compete with others and climb the rankings",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3 sticky top-0 z-50 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 group">
            <BrainCircuit className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-xl font-bold">QuizRise</span>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="hover:scale-105 transition-transform duration-200">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 relative">
        {/* Parallax Background Elements */}
        <ParallaxElement
          speed={0.2}
          className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0"
        >
          <DotsGrid className="absolute top-0 right-0 w-[800px] h-[800px] text-primary/5" />
        </ParallaxElement>

        <ParallaxElement speed={-0.1} className="absolute top-[20%] left-[-10%] pointer-events-none z-0">
          <GradientBlob width={600} height={600} colors={["rgba(96, 165, 250, 0.1)", "rgba(59, 130, 246, 0.05)"]} />
        </ParallaxElement>

        <ParallaxElement speed={0.3} className="absolute top-[60%] right-[-5%] pointer-events-none z-0">
          <GradientBlob width={400} height={400} colors={["rgba(124, 58, 237, 0.08)", "rgba(139, 92, 246, 0.03)"]} />
        </ParallaxElement>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-background via-muted/20 to-primary/5 py-20 text-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

          <ParallaxElement speed={0.4} className="absolute top-[10%] left-[20%] pointer-events-none">
            <CircleElement size={80} color="rgba(59, 130, 246, 0.1)" />
          </ParallaxElement>

          <ParallaxElement speed={0.2} className="absolute bottom-[20%] right-[15%] pointer-events-none">
            <CircleElement size={120} color="rgba(59, 130, 246, 0.15)" />
          </ParallaxElement>

          <ParallaxElement speed={-0.3} className="absolute top-[30%] right-[25%] pointer-events-none">
            <CircleElement size={40} color="rgba(124, 58, 237, 0.2)" />
          </ParallaxElement>

          <div className="relative mx-auto max-w-5xl px-6">
            <ScrollReveal animation="fade-in" duration={800}>
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Learning Platform
              </Badge>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" duration={1000} delay={200}>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                AI-Powered Quizzes for{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent animate-gradient">
                  Better Learning
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" duration={1000} delay={400}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Transform any content into engaging quizzes with our advanced AI. Create from PDFs, websites, YouTube
                videos, or plain text in seconds.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" duration={1000} delay={600}>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="group hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="group hover:scale-105 transition-all duration-300 hover:bg-muted"
                >
                  <Link href="/quizzes">
                    <Play className="mr-2 h-4 w-4" />
                    Try Demo
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 bg-muted/30">
          <ParallaxElement speed={0.15} className="absolute top-0 left-0 w-full pointer-events-none">
            <WaveElement className="text-background w-full h-24" />
          </ParallaxElement>

          <ParallaxElement speed={0.25} className="absolute bottom-0 left-0 w-full pointer-events-none rotate-180">
            <WaveElement className="text-background w-full h-24" />
          </ParallaxElement>

          <ParallaxElement speed={-0.1} className="absolute top-[30%] left-[5%] pointer-events-none">
            <FloatingShapes
              count={3}
              baseSize={30}
              colors={["rgba(59, 130, 246, 0.2)", "rgba(124, 58, 237, 0.2)", "rgba(236, 72, 153, 0.2)"]}
            />
          </ParallaxElement>

          <ParallaxElement speed={0.3} className="absolute bottom-[20%] right-[10%] pointer-events-none">
            <FloatingShapes
              count={3}
              baseSize={20}
              colors={["rgba(59, 130, 246, 0.15)", "rgba(124, 58, 237, 0.15)", "rgba(236, 72, 153, 0.15)"]}
            />
          </ParallaxElement>

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up" duration={800}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Create Quizzes from Any Source</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our AI can process multiple content types and generate relevant, engaging quiz questions
                  automatically.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <ScrollReveal key={index} animation="zoom-in" delay={index * 100} duration={800}>
                  <Card
                    className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-gradient-to-br from-background to-muted/50 ${
                      hoveredFeature === index ? "shadow-2xl scale-105" : ""
                    }`}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${feature.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative py-20">
          <ParallaxElement speed={0.2} className="absolute top-[20%] right-[10%] pointer-events-none">
            <CircleElement size={200} color="rgba(59, 130, 246, 0.05)" />
          </ParallaxElement>

          <ParallaxElement speed={-0.15} className="absolute bottom-[15%] left-[5%] pointer-events-none">
            <CircleElement size={150} color="rgba(124, 58, 237, 0.05)" />
          </ParallaxElement>

          <ParallaxElement speed={0.1} className="absolute top-[40%] left-[15%] pointer-events-none">
            <Brain className="h-16 w-16 text-primary/5" />
          </ParallaxElement>

          <ParallaxElement speed={-0.2} className="absolute bottom-[30%] right-[20%] pointer-events-none">
            <Lightbulb className="h-12 w-12 text-primary/5" />
          </ParallaxElement>

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up" duration={800}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Get started in three simple steps and create your first AI-generated quiz in minutes.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <ScrollReveal
                  key={index}
                  animation={index % 2 === 0 ? "slide-left" : "slide-right"}
                  delay={index * 200}
                  duration={800}
                >
                  <div
                    className={`text-center group transition-all duration-500 ${
                      hoveredStep === index ? "scale-105" : ""
                    }`}
                    onMouseEnter={() => setHoveredStep(index)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className="relative mb-6">
                      <div
                        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white text-2xl font-bold transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                          hoveredStep === index ? "shadow-2xl shadow-primary/50" : ""
                        }`}
                      >
                        {step.number}
                      </div>
                      <step.icon
                        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white transition-all duration-300 ${
                          hoveredStep === index ? "scale-110" : ""
                        }`}
                      />
                    </div>
                    <h3 className="mb-4 text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-20 bg-muted/20">
          <ParallaxElement speed={0.15} className="absolute top-0 left-0 w-full pointer-events-none">
            <WaveElement className="text-background w-full h-24 opacity-50" />
          </ParallaxElement>

          <ParallaxElement speed={-0.1} className="absolute top-[40%] right-[5%] pointer-events-none">
            <Star className="h-16 w-16 text-primary/5" />
          </ParallaxElement>

          <ParallaxElement speed={0.2} className="absolute bottom-[20%] left-[10%] pointer-events-none">
            <Star className="h-12 w-12 text-primary/5" />
          </ParallaxElement>

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up" duration={800}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of satisfied users who are transforming their learning experience with QuizRise.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 200} duration={800}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="mb-4 text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="inline-block h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 flex-grow italic">"{testimonial.quote}"</p>
                      <div className="flex items-center">
                        <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                          <img
                            src={testimonial.avatar || "/placeholder.svg"}
                            alt={testimonial.author}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{testimonial.author}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* More Features Section */}
        <section className="relative py-20 bg-gradient-to-br from-background to-primary/5">
          <ParallaxElement speed={-0.2} className="absolute top-[10%] left-[20%] pointer-events-none">
            <Layers className="h-20 w-20 text-primary/5" />
          </ParallaxElement>

          <ParallaxElement speed={0.25} className="absolute bottom-[15%] right-[15%] pointer-events-none">
            <Puzzle className="h-16 w-16 text-primary/5" />
          </ParallaxElement>

          <ParallaxElement speed={0.1} className="absolute top-[30%] right-[10%] pointer-events-none">
            <FloatingShapes
              count={5}
              baseSize={15}
              colors={["rgba(59, 130, 246, 0.1)", "rgba(124, 58, 237, 0.1)", "rgba(236, 72, 153, 0.1)"]}
            />
          </ParallaxElement>

          <div className="relative mx-auto max-w-7xl px-6">
            <ScrollReveal animation="fade-up" duration={800}>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Discover all the tools and features that make QuizRise the ultimate quiz platform.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features2.map((feature, index) => (
                <ScrollReveal key={index} animation="bounce" delay={index * 150} duration={800}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-20 bg-gradient-to-r from-primary to-blue-600 text-white">
          <ParallaxElement
            speed={0.3}
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
          >
            <DotsGrid className="absolute top-0 left-0 w-full h-full text-white/5" />
          </ParallaxElement>

          <ParallaxElement speed={0.1} className="absolute top-[20%] left-[10%] pointer-events-none">
            <CircleElement size={100} color="rgba(255, 255, 255, 0.05)" />
          </ParallaxElement>

          <ParallaxElement speed={-0.2} className="absolute bottom-[20%] right-[10%] pointer-events-none">
            <CircleElement size={150} color="rgba(255, 255, 255, 0.05)" />
          </ParallaxElement>

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid gap-8 md:grid-cols-4 text-center">
              {[
                { number: "10,000+", label: "Quizzes Created", icon: BookOpen },
                { number: "50,000+", label: "Questions Generated", icon: Target },
                { number: "5,000+", label: "Active Users", icon: Users },
                { number: "98%", label: "Satisfaction Rate", icon: Star },
              ].map((stat, index) => (
                <ScrollReveal key={index} animation="zoom-in" delay={index * 150} duration={800}>
                  <div className="group">
                    <stat.icon className="mx-auto mb-4 h-12 w-12 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-3xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.number}
                    </div>
                    <div className="text-primary-foreground/80">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 text-center bg-gradient-to-br from-background to-muted/20">
          <ParallaxElement speed={0.15} className="absolute top-0 left-0 w-full pointer-events-none">
            <WaveElement className="text-blue-600/5 w-full h-32" />
          </ParallaxElement>

          <ParallaxElement speed={-0.15} className="absolute bottom-0 left-0 w-full pointer-events-none rotate-180">
            <WaveElement className="text-blue-600/5 w-full h-32" />
          </ParallaxElement>

          <ParallaxElement speed={0.2} className="absolute top-[30%] left-[20%] pointer-events-none">
            <CircleElement size={60} color="rgba(59, 130, 246, 0.1)" />
          </ParallaxElement>

          <ParallaxElement speed={-0.1} className="absolute bottom-[30%] right-[20%] pointer-events-none">
            <CircleElement size={80} color="rgba(124, 58, 237, 0.1)" />
          </ParallaxElement>

          <div className="relative mx-auto max-w-3xl px-6">
            <ScrollReveal animation="fade-up" duration={800}>
              <h2 className="mb-6 text-3xl font-bold">Ready to Transform Your Learning?</h2>
              <p className="mb-10 text-muted-foreground text-lg">
                Join thousands of learners and educators using QuizRise to create engaging, AI-powered quizzes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="group hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Link href="/register">
                    Start Creating Quizzes
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t bg-background px-6 py-8">
        <ParallaxElement speed={0.1} className="absolute top-0 left-0 w-full pointer-events-none">
          <WaveElement className="text-muted/20 w-full h-16" />
        </ParallaxElement>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 group">
              <BrainCircuit className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-xl font-bold">QuizRise</span>
            </div>

            <div className="flex gap-6">
              {["About", "Features", "Privacy", "Terms"].map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="text-sm text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
                >
                  {link}
                </Link>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} QuizRise. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-400 {
          animation-delay: 0.4s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
