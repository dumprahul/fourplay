'use client'

import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useLogin, usePrivy, useLogout, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

interface Token {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  type: string;
  priority: number;
  branding?: {
    logoUri?: string;
  };
}

export default function CreatePage() {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const { logout} = useLogout();
  const disableLogin = !ready || (ready && authenticated);
  const { wallets } = useWallets();
  const wallet = wallets[0];

  // State for tokens
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tokens from GlueX API
  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Starting to fetch tokens from GlueX API...');
    console.log('📍 Target chain: hyperevm');
    
    try {
      const query = `
        query Tokens($chain: String!, $limit: Int = 50) {
          tokens(chain: $chain, limit: $limit) {
            items {
              tokenAddress
              symbol
              name
              decimals
              type
              priority
              branding {
                logoUri
              }
            }
            total
            hasMore
          }
        }
      `;

      const variables = {
        chain: "hyperevm",
        limit: 50
      };

      console.log('📤 GraphQL Query:', query);
      console.log('📤 Variables:', variables);

      const response = await fetch('https://tokens.gluex.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Raw API response:', data);

      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (data.data?.tokens?.items) {
        const fetchedTokens = data.data.tokens.items;
        console.log('✅ Successfully fetched tokens:', fetchedTokens);
        console.log('📊 Total tokens found:', fetchedTokens.length);
        console.log('📊 Token types distribution:', 
          fetchedTokens.reduce((acc: any, token: Token) => {
            acc[token.type] = (acc[token.type] || 0) + 1;
            return acc;
          }, {})
        );
        
        // Sort tokens by priority (highest first) and then by symbol
        const sortedTokens = fetchedTokens.sort((a: Token, b: Token) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return a.symbol.localeCompare(b.symbol);
        });
        
        console.log('🔄 Sorted tokens by priority and symbol:', sortedTokens);
        setTokens(sortedTokens);
      } else {
        console.warn('⚠️ No tokens found in response data');
        setTokens([]);
      }
    } catch (err) {
      console.error('❌ Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      setTokens([]);
    } finally {
      setLoading(false);
      console.log('🏁 Token fetching completed');
    }
  };

  // Fetch tokens on component mount
  useEffect(() => {
    console.log('🚀 CreatePage component mounted, fetching tokens...');
    fetchTokens();
  }, []);

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
                      <select 
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          const selectedToken = tokens.find(t => t.tokenAddress === e.target.value);
                          console.log('🎯 Token selected:', selectedToken);
                        }}
                      >
                        <option value="" className="bg-gray-800 text-white">
                          {loading ? 'Loading tokens...' : 'Select token'}
                        </option>
                        {tokens.map((token) => (
                          <option 
                            key={token.tokenAddress} 
                            value={token.tokenAddress}
                            className="bg-gray-800 text-white"
                          >
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                      {error && (
                        <p className="text-red-400 text-xs mt-1">{error}</p>
                      )}
                      {loading && (
                        <p className="text-blue-400 text-xs mt-1">Loading tokens from hyperevm...</p>
                      )}
                      {!loading && !error && tokens.length > 0 && (
                        <p className="text-green-400 text-xs mt-1">
                          {tokens.length} tokens loaded from hyperevm
                        </p>
                      )}
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
