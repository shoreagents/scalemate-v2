import { HeroSection } from '@/components/sections/hero-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { ToolsPreviewSection } from '@/components/sections/tools-preview-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { CTASection } from '@/components/sections/cta-section'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ToolsPreviewSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
} 