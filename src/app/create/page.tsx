'use client'

import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useLogin, usePrivy, useLogout, useWallets } from '@privy-io/react-auth';

export default function CreatePage() {
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
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left Side - Create Title */}
        <div className="flex-1 text-left">
          <h1 
            className="text-9xl md:text-[12rem] font-bold text-white tracking-tight"
            style={{ fontFamily: 'Honk' }}
          >
            create.
          </h1>
        </div>
        
        {/* Right Side - Modal Card */}
        <div className="flex-1 flex justify-end">
          <div className="relative w-full max-w-lg">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Modal Content */}
              <div className="relative z-10">
                {/* <h2 className="text-xl  text-white mb-4 text-center"> ReceiptCreate</h2> */}
                
                <form className="space-y-4">
                  {/* Description Field */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="Enter receipt description..."
                    />
                  </div>
                  
                  {/* Amount and Token in same row */}
                  <div className="flex gap-4">
                    {/* Amount Field */}
                    <div className="flex-1">
                      <label className="block text-white text-sm font-medium mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    {/* Token Field */}
                    <div className="flex-1">
                      <label className="block text-white text-sm font-medium mb-1">
                        Token
                      </label>
                      <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="" className="bg-gray-800 text-white">Select token</option>
                        <option value="eth" className="bg-gray-800 text-white">ETH</option>
                        <option value="usdc" className="bg-gray-800 text-white">USDC</option>
                        <option value="usdt" className="bg-gray-800 text-white">USDT</option>
                        <option value="sol" className="bg-gray-800 text-white">SOL</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-2">
                    <ShimmerButton
                      className="w-full text-base py-2"
                      shimmerColor="#87CEFA"
                      background="rgba(135, 206, 250, 0.3)"
                      shimmerDuration="2s"
                      borderRadius="12px"
                    >
                      Create Receipt
                    </ShimmerButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Glassy Navbar - Centered Below */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
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
  );
}
