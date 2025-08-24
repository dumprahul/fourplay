'use client'

import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useLogin, usePrivy, useLogout, useWallets } from '@privy-io/react-auth';
import { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, X, CheckCircle, Copy, Receipt } from 'lucide-react';
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

interface Chain {
  id: number;
  name: string;
  symbol: string;
  icon?: string;
}

export default function DropPage() {
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
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isChainModalOpen, setIsChainModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form state
  const [funnyWords, setFunnyWords] = useState('');
  const [receiptFound, setReceiptFound] = useState<Receipt | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Available chains (only GlueX supported chains)
  const availableChains: Chain[] = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
    { id: 10, name: 'Optimism', symbol: 'OP' },
    { id: 56, name: 'BNB Chain', symbol: 'BNB' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { id: 100, name: 'Gnosis', symbol: 'XDAI' },
    { id: 8453, name: 'Base', symbol: 'ETH' },
    { id: 59144, name: 'Linea', symbol: 'ETH' },
    { id: 1101, name: 'Polygon zkEVM', symbol: 'ETH' },
    { id: 5001, name: 'Mantle', symbol: 'MNT' },
    { id: 534352, name: 'Scroll', symbol: 'ETH' },
    { id: 167008, name: 'Taiko', symbol: 'ETH' },
    { id: 81457, name: 'Blast', symbol: 'ETH' },
    { id: 80085, name: 'Sonic', symbol: 'SONIC' },
    { id: 80086, name: 'Berachain', symbol: 'BERA' },
    { id: 80087, name: 'Unichain', symbol: 'UNI' },
    { id: 1337, name: 'HyperEVM', symbol: 'HYP' }
  ];

  // Search for receipt by funny words
  const searchReceipt = async () => {
    if (!funnyWords.trim()) {
      setError('Please enter the funny words');
      return;
    }

    setIsSearching(true);
    setError(null);
    setReceiptFound(null);

    try {
      console.log('🔍 Searching for receipt with funny key:', funnyWords.trim());

      const { data, error: supabaseError } = await supabase
        .from('receipts')
        .select('*')
        .eq('funny_key', funnyWords.trim())
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setError('Receipt not found. Please check the funny words and try again.');
        } else {
          console.error('❌ Supabase error:', supabaseError);
          throw new Error(`Database error: ${supabaseError.message}`);
        }
        return;
      }

      console.log('✅ Receipt found:', data);
      setReceiptFound(data);
      setError(null);

    } catch (err) {
      console.error('❌ Error searching receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to search receipt');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle receipt claim
  const handleClaim = async () => {
    if (!selectedChain || !selectedToken) {
      setError('Please select both chain and token for payment');
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      console.log('🎯 Claiming receipt:', receiptFound?.funny_key);
      console.log('💳 Payment details:', {
        chain: selectedChain.name,
        token: selectedToken.symbol,
        receipt: receiptFound
      });

      // Here you would integrate with your payment/claiming logic
      // For now, we'll simulate a successful claim
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Receipt claimed successfully!');
      setClaimSuccess(true);

    } catch (err) {
      console.error('❌ Error claiming receipt:', err);
      setError('Failed to claim receipt. Please try again.');
    } finally {
      setIsClaiming(false);
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

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsTokenModalOpen(false);
        setIsChainModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tokens from GlueX API for selected chain
  const fetchTokens = async (chainName: string) => {
    setLoading(true);
    setError(null);
    setTokens([]);
    setFilteredTokens([]);
    
    console.log('🔄 Starting to fetch tokens from GlueX API...');
    console.log('📍 Target chain:', chainName);
    
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
        chain: chainName.toLowerCase(),
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
    console.log('🚀 DropPage component mounted, fetching tokens...');
    // Initial fetch for the default chain (e.g., Ethereum)
    fetchTokens('Ethereum'); 
  }, []);

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setIsTokenModalOpen(false);
    setSearchQuery('');
    console.log('🎯 Token selected for payment:', token);
  };

  // Handle chain selection
  const handleChainSelect = (chain: Chain) => {
    setSelectedChain(chain);
    setIsChainModalOpen(false);
    setSelectedToken(null); // Clear previous token selection
    console.log('🌐 Chain selected for payment:', chain);
    
    // Fetch tokens for the selected chain
    fetchTokens(chain.name);
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedToken(null);
    setSelectedChain(null);
    setReceiptFound(null);
    setFunnyWords('');
    setClaimSuccess(false);
    setTokens([]);
    setFilteredTokens([]);
    console.log('🗑️ All selections cleared');
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
        {/* Left Side - Drop Title */}
        <div className="flex-1 text-left">
          <h1 
            className="text-9xl md:text-[12rem] font-bold text-white tracking-tight"
            style={{ fontFamily: 'Honk' }}
          >
            drop.
          </h1>
        </div>
        
        {/* Right Side - Modal Card */}
        <div className="flex-1 flex justify-end">
          <div className="relative w-full max-w-lg">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Modal Content */}
              <div className="relative z-10">
                {claimSuccess ? (
                  /* Success State */
                  <div className="text-center">
                    <div className="mb-4">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Receipt Claimed!</h3>
                      <p className="text-white/70 mb-4">You have successfully claimed the receipt</p>
                    </div>
                    
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-4 text-left">
                      <h4 className="font-semibold text-white mb-2">Receipt Details:</h4>
                      <div className="space-y-1 text-sm text-white/70">
                        <p><span className="text-white">Description:</span> {receiptFound?.description}</p>
                        <p><span className="text-white">Amount:</span> {receiptFound?.amount} {receiptFound?.token_name}</p>
                        <p><span className="text-white">Chain:</span> {receiptFound?.chain_name}</p>
                        <p><span className="text-white">Funny Key:</span> {receiptFound?.funny_key}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={clearSelections}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    >
                      Claim Another Receipt
                    </button>
                  </div>
                ) : (
                  /* Form State */
                  <div className="space-y-4">
                    {/* Funny Words Field */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Enter Funny Words
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={funnyWords}
                          onChange={(e) => setFunnyWords(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., banana-pizza-unicorn-ninja"
                          required
                        />
                        <ShimmerButton
                          onClick={searchReceipt}
                          disabled={isSearching || !funnyWords.trim()}
                          className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          shimmerColor="#FF9800"
                          background="rgba(255, 152, 0, 0.3)"
                          shimmerDuration="2s"
                          borderRadius="8px"
                        >
                          {isSearching ? 'Searching...' : 'Search'}
                        </ShimmerButton>
                      </div>
                    </div>

                    {/* Receipt Found Display */}
                    {receiptFound && (
                      <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Receipt className="w-5 h-5 text-green-400" />
                          <h4 className="font-semibold text-white">Receipt Found!</h4>
                        </div>
                        <div className="space-y-2 text-sm text-white/70">
                          <p><span className="text-white">Description:</span> {receiptFound.description}</p>
                          <p><span className="text-white">Amount:</span> {receiptFound.amount} {receiptFound.token_name}</p>
                          <p><span className="text-white">Chain:</span> {receiptFound.chain_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Fields - Only show when receipt is found */}
                    {receiptFound && (
                      <>
                        {/* Chain Selection */}
                        <div>
                          <label className="block text-white text-sm font-medium mb-1">
                            Select Chain for Payment
                          </label>
                          <div className="relative">
                            <div 
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer hover:bg-white/15 transition-colors flex items-center justify-between"
                              onClick={() => setIsChainModalOpen(true)}
                            >
                              {selectedChain ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{selectedChain.name}</span>
                                  <span className="text-white/60 text-sm">({selectedChain.symbol})</span>
                                </div>
                              ) : (
                                <span className="text-white/50">Select chain</span>
                              )}
                              <ChevronDown className="w-4 h-4 text-white/60" />
                            </div>
                          </div>
                        </div>

                        {/* Token Selection */}
                        <div>
                          <label className="block text-white text-sm font-medium mb-1">
                            Select Token for Payment
                          </label>
                          <div className="relative">
                            <div 
                              className={`w-full px-3 py-2 border border-white/20 rounded-lg text-white transition-colors flex items-center justify-between ${
                                selectedChain 
                                  ? 'bg-white/10 cursor-pointer hover:bg-white/15' 
                                  : 'bg-white/5 cursor-not-allowed opacity-50'
                              }`}
                              onClick={() => selectedChain && setIsTokenModalOpen(true)}
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
                                  {!selectedChain 
                                    ? 'Select a chain first' 
                                    : loading 
                                      ? 'Loading tokens...' 
                                      : `Select token from ${selectedChain.name}`
                                  }
                                </span>
                              )}
                              <ChevronDown className={`w-4 h-4 text-white/60 ${!selectedChain ? 'opacity-30' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Claim Button */}
                        <div className="pt-2">
                          <ShimmerButton
                            onClick={handleClaim}
                            disabled={isClaiming || !selectedChain || !selectedToken}
                            className="w-full text-base py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            shimmerColor="#4CAF50"
                            background="rgba(76, 175, 80, 0.3)"
                            shimmerDuration="2s"
                            borderRadius="12px"
                          >
                            {isClaiming ? 'Claiming Receipt...' : 'Claim Receipt'}
                          </ShimmerButton>
                        </div>
                      </>
                    )}
                    
                    {/* Status Messages */}
                    {error && (
                      <p className="text-red-400 text-xs mt-1">{error}</p>
                    )}
                    {loading && selectedChain && (
                      <p className="text-blue-400 text-xs mt-1">Loading tokens from {selectedChain.name}...</p>
                    )}
                    {!loading && !error && selectedChain && tokens.length > 0 && (
                      <p className="text-green-400 text-xs mt-1">
                        {tokens.length} tokens loaded from {selectedChain.name}
                      </p>
                    )}
                    {!loading && !error && selectedChain && tokens.length === 0 && (
                      <p className="text-yellow-400 text-xs mt-1">
                        No tokens found on {selectedChain.name}
                      </p>
                    )}
                    {!selectedChain && (
                      <p className="text-blue-400 text-xs mt-1">
                        Select a chain to view available tokens
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chain Selection Modal */}
      {isChainModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Chain</h3>
              <button
                onClick={() => setIsChainModalOpen(false)}
                className="text-white/60 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chain List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {availableChains.map((chain) => (
                <div
                  key={chain.id}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-white/5 last:border-b-0"
                  onClick={() => handleChainSelect(chain)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {chain.symbol.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{chain.name}</div>
                    <div className="text-sm text-white/60">{chain.symbol}</div>
                  </div>
                  <div className="text-xs text-white/40">
                    #{chain.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Token Selection Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Token</h3>
              <button
                onClick={() => setIsTokenModalOpen(false)}
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
