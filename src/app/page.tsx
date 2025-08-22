import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Highlighter } from "@/components/magicui/highlighter";

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/fpbg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-10" />
      
      {/* Main Content */}
      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
        {/* Fourplay Title with Typing Animation */}
        <TypingAnimation
          className="text-9xl md:text-[12rem] font-bold text-white mb-8 tracking-tight"
          style={{ fontFamily: 'Honk' }}
          duration={150}
          delay={500}
        >
          fourplay.
        </TypingAnimation>
        
        {/* Description */}
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          send{" "}
          <Highlighter action="highlight" color="#87CEFA">
            tokens
          </Highlighter>{" "}
          across{" "}
          <Highlighter action="underline" color="#FF9800">
            chains
          </Highlighter>{" "}
          with{" "}
          <Highlighter action="highlight" color="#FF6B6B">
            4 memes
          </Highlighter>
        </p>
        
        {/* Get Started Button */}
        <div className="flex justify-center">
          <ShimmerButton
            className="text-lg px-8 py-4"
            shimmerColor="#ffffff"
            background="rgba(0, 0, 0, 0.8)"
            shimmerDuration="2s"
            borderRadius="50px"
          >
            Get Started
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}
