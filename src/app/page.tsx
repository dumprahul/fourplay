'use client'
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { Highlighter } from "@/components/magicui/highlighter";
import { useLogin, usePrivy, useLogout, useWallets } from '@privy-io/react-auth';

export default function Home() {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const { logout} = useLogout();
  const disableLogin = !ready || (ready && authenticated);
  const { wallets } = useWallets();
  const wallet = wallets[0];

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
          delay={1}
        >
          fourplay.
        </TypingAnimation>

        {/* Glassy Navbar */}
        <div className="mt-8 flex justify-center">
          <nav className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-8 py-4 shadow-2xl">
            <div className="flex gap-6 items-center">
              <ShimmerButton
                className="text-base px-6 py-3"
                shimmerColor="#87CEFA"
                background="rgba(135, 206, 250, 0.2)"
                shimmerDuration="1.5s"
                borderRadius="30px"
              >
                create receipt
              </ShimmerButton>
              
              <ShimmerButton
                className="text-base px-6 py-3"
                shimmerColor="#FF9800"
                background="rgba(255, 152, 0, 0.2)"
                shimmerDuration="1.5s"
                borderRadius="30px"
              >
                drop receipt
              </ShimmerButton>
              {authenticated && wallet ? (
        <ShimmerButton
          className="text-base px-6 py-3"
          shimmerColor="#4CAF50"
          background="rgba(76, 175, 80, 0.2)"
          shimmerDuration="1.5s"
          borderRadius="30px"
          onClick={() => logout()}
        >
          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
        </ShimmerButton>
      ) : (
        <ShimmerButton
          className="text-base px-6 py-3"
          shimmerColor="#FF6B6B"
          background="rgba(255, 107, 107, 0.2)"
          shimmerDuration="1.5s"
          borderRadius="30px"
          onClick={() =>
            login({
              loginMethods: ['wallet', 'twitter', 'email'],
              walletChainType: 'ethereum-and-solana',
              disableSignup: false,
            })
          }
        >
          connect wallet
        </ShimmerButton>
      )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
