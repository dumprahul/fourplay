'use client'

import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useLogin, usePrivy, useLogout, useWallets } from '@privy-io/react-auth';
import { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, X, CheckCircle, Copy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface Receipt {
  id: string;
  funny_key: string;
  description: string;
  token_name: string;
  token_address: string;
  chain_name: string;
  chain_id: number;
  amount: number;
  token_decimals: number;
  created_at: string;
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
  
  // State for custom modal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptCreated, setReceiptCreated] = useState<Receipt | null>(null);
  const [funnyKeyCopied, setFunnyKeyCopied] = useState(false);

  // Generate 4 funny words
  const generateFunnyKey = () => {
    const funnyWords = [
      'banana', 'pizza', 'unicorn', 'ninja', 'taco', 'dragon', 'bubble', 'rainbow',
      'marshmallow', 'spaghetti', 'wizard', 'penguin', 'cupcake', 'robot', 'butterfly', 'dinosaur',
      'chocolate', 'firework', 'jellybean', 'octopus', 'popcorn', 'squirrel', 'watermelon', 'zombie',
      'avocado', 'bumblebee', 'cactus', 'donut', 'elephant', 'flamingo', 'giraffe', 'hamburger'
    ];
    
    const shuffled = funnyWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).join('-');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedToken || !description.trim() || !amount.trim()) {
      setError('Please fill in all fields and select a token');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const funnyKey = generateFunnyKey();
      console.log('🎯 Creating receipt with funny key:', funnyKey);

      const receiptData = {
        funny_key: funnyKey,
        description: description.trim(),
        token_name: selectedToken.name,
        token_address: selectedToken.tokenAddress,
        chain_name: 'hyperevm',
        chain_id: 1337, // hyperevm chain ID
        amount: parseFloat(amount),
        token_decimals: selectedToken.decimals
      };

      console.log('📤 Receipt data to store:', receiptData);

      const { data, error: supabaseError } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select()
        .single();

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      console.log('✅ Receipt created successfully:', data);
      setReceiptCreated(data);
      
      // Reset form
      setDescription('');
      setAmount('');
      setSelectedToken(null);
      setSearchQuery('');

    } catch (err) {
      console.error('❌ Error creating receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to create receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy funny key to clipboard
  const copyFunnyKey = async () => {
    if (receiptCreated) {
      try {
        await navigator.clipboard.writeText(receiptCreated.funny_key);
        setFunnyKeyCopied(true);
        setTimeout(() => setFunnyKeyCopied(false), 2000);
        console.log('📋 Funny key copied to clipboard:', receiptCreated.funny_key);
      } catch (err) {
        console.error('❌ Failed to copy to clipboard:', err);
      }
    }
  };

  // Filter tokens based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter(token => 
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.tokenAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  }, [searchQuery, tokens]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setFilteredTokens(sortedTokens);
      } else {
        console.warn('⚠️ No tokens found in response data');
        setTokens([]);
        setFilteredTokens([]);
      }
    } catch (err) {
      console.error('❌ Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      setTokens([]);
      setFilteredTokens([]);
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

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setIsDropdownOpen(false);
    setSearchQuery('');
    console.log('🎯 Token selected:', token);
  };

  // Clear selected token
  const clearSelection = () => {
    setSelectedToken(null);
    setSearchQuery('');
    console.log('🗑️ Token selection cleared');
  };

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
                
                {receiptCreated ? (
                  /* Success State */
                  <div className="text-center">
                    <div className="mb-4">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Receipt Created!</h3>
                      <p className="text-white/70 mb-4">Share this funny key with others to let them claim your receipt</p>
                    </div>
                    
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-4">
                      <p className="text-sm text-white/60 mb-2">Your Funny Key:</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-white font-mono">
                          {receiptCreated.funny_key}
                        </span>
                        <button
                          onClick={copyFunnyKey}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      {funnyKeyCopied && (
                        <p className="text-green-400 text-sm mt-2">Copied to clipboard!</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setReceiptCreated(null)}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    >
                      Create Another Receipt
                    </button>
                  </div>
                ) : (
                  /* Form State */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Description Field */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Enter receipt description..."
                        required
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
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      
                      {/* Custom Token Modal */}
                      <div className="flex-1">
                        <label className="block text-white text-sm font-medium mb-1">
                          Token
                        </label>
                        <div className="relative">
                          {/* Token Selection Button */}
                          <div 
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer hover:bg-white/15 transition-colors flex items-center justify-between"
                            onClick={() => setIsDropdownOpen(true)}
                          >
                            {selectedToken ? (
                              <div className="flex items-center gap-2">
                                {selectedToken.branding?.logoUri ? (
                                  <img 
                                    src={selectedToken.branding.logoUri} 
                                    alt={selectedToken.symbol}
                                    className="w-5 h-5 rounded-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                    {selectedToken.symbol.charAt(0)}
                                  </div>
                                )}
                                <span className="font-medium">{selectedToken.symbol}</span>
                                <span className="text-white/60 text-sm">- {selectedToken.name}</span>
                              </div>
                            ) : (
                              <span className="text-white/50">
                                {loading ? 'Loading tokens...' : 'Select token'}
                              </span>
                            )}
                            <ChevronDown className="w-4 h-4 text-white/60" />
                          </div>
                        </div>
                        
                        {/* Status Messages */}
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
                        type="submit"
                        disabled={isSubmitting || !selectedToken || !description.trim() || !amount.trim()}
                        className="w-full text-base py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        shimmerColor="#87CEFA"
                        background="rgba(135, 206, 250, 0.3)"
                        shimmerDuration="2s"
                        borderRadius="12px"
                      >
                        {isSubmitting ? 'Creating Receipt...' : 'Create Receipt'}
                      </ShimmerButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Selection Modal */}
      {isDropdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Token</h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-white/60 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Token List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <div
                    key={token.tokenAddress}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-white/5 last:border-b-0"
                    onClick={() => handleTokenSelect(token)}
                  >
                    {/* Token Logo */}
                    {token.branding?.logoUri ? (
                      <img 
                        src={token.branding.logoUri} 
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    
                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{token.symbol}</span>
                        <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70">
                          {token.type}
                        </span>
                      </div>
                      <div className="text-sm text-white/60 truncate">
                        {token.name}
                      </div>
                    </div>
                    
                    {/* Priority Badge */}
                    <div className="text-xs text-white/40 flex-shrink-0">
                      #{token.priority}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-white/60 text-sm">
                  {searchQuery ? 'No tokens found matching your search' : 'No tokens available'}
                </div>
              )}
            </div>

            {/* Clear Selection Button */}
            {selectedToken && (
              <div className="p-4 border-t border-white/20">
                <button
                  onClick={clearSelection}
                  className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-colors text-sm"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
