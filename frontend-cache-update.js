// Replace lines 1085-1290 in pwa/index.html with this:

                    const loadOptionsData = async () => {
                        setOptionsLoading(true);
                        
                        console.info('📊 Loading top options from daily cache...');
                        
                        const SAMCO_API = 'http://localhost:3002';
                        
                        try {
                            // Fetch pre-computed top 5 options from cache (instant load!)
                            const response = await fetch(`${SAMCO_API}/api/top-options-cached`);
                            const cached = await response.json();
                            
                            if (!cached.success) {
                                setOptionsLoading(false);
                                alert('Options data not yet available. Data refreshes at 8:00 AM IST daily. Please try again later.');
                                console.error('Cache not ready:', cached.error);
                                return;
                            }
                            
                            const allOptions = cached.data;
                            const cachedTime = new Date(cached.cachedAt).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                            });
                            
                            console.log(`✅ Loaded ${allOptions.length} top options from cache`);
                            console.log(`📅 Data as of: ${cachedTime}`);
                            console.log(`🔍 Total options scanned: ${cached.totalScanned}`);
                            console.log(`📆 Expiry: ${cached.expiryDate}`);
                        
                        // Add stock analysis to cached options
                        const optionsWithAnalysis = await Promise.all(allOptions.map(async (opt) => {
                            // Generate stock analysis for the underlying symbol
                            const stockAnalysis = await generateMockStock(opt.underlyingSymbol, 'Options', false, null);
                            
                            // Determine if this option matches our recommendation
                            const isBullish = stockAnalysis.options.optionType === 'CALL';
                            const isBearish = stockAnalysis.options.optionType === 'PUT';
                            const matchesSignal = (opt.optionType === 'CALL' && isBullish) || 
                                                  (opt.optionType === 'PUT' && isBearish);
                            
                            // Calculate profit potential
                            const currentPremium = parseFloat(opt.lastTradedPrice);
                            const targetPremium = currentPremium * 1.3; // 30% profit target
                            const stopLoss = currentPremium * 0.85; // 15% stop-loss
                            
                            // Generate detailed recommendation reasoning
                            let reasoning = '';
                            if (isBullish && opt.optionType === 'CALL') {
                                reasoning = `${opt.underlyingSymbol} showing bullish signals (Score: ${stockAnalysis.score}/100). Stock expected to move from ₹${opt.spotPrice} towards ₹${stockAnalysis.targetPrice}. This CALL has strong liquidity (OI: ${(opt.openInterest/1000000).toFixed(2)}M, Vol: ${(opt.volume/100000).toFixed(2)}L), optimal Delta: ${(opt.delta || 0).toFixed(3)}, and moderate IV: ${(opt.impliedVolatility || 0).toFixed(1)}%.`;
                            } else if (isBearish && opt.optionType === 'PUT') {
                                reasoning = `${opt.underlyingSymbol} showing bearish signals (Score: ${stockAnalysis.score}/100). Stock at ₹${opt.spotPrice} may decline. This PUT has strong liquidity (OI: ${(opt.openInterest/1000000).toFixed(2)}M, Vol: ${(opt.volume/100000).toFixed(2)}L), optimal Delta: ${(opt.delta || 0).toFixed(3)}, and moderate IV: ${(opt.impliedVolatility || 0).toFixed(1)}%.`;
                            }
                            
                            return {
                                ...opt,
                                matchesSignal,
                                stockScore: stockAnalysis.score,
                                stockRecommendation: stockAnalysis.recommendation,
                                confidence: stockAnalysis.options.confidence,
                                reasoning,
                                targetPremium: targetPremium.toFixed(2),
                                stopLoss: stopLoss.toFixed(2),
                                profitPotential: ((targetPremium - currentPremium) / currentPremium * 100).toFixed(1),
                                riskReward: ((targetPremium - currentPremium) / (currentPremium - stopLoss)).toFixed(2),
                                cachedAt: cachedTime // Add cache timestamp for display
                            };
                        }));
                        
                        console.log(`📊 Analyzed ${optionsWithAnalysis.length} cached options`);
                        
                        // Use the pre-selected top 5 options from cache
                        const allMatchingOptions = optionsWithAnalysis;
                        
                        } catch (error) {
                            console.error('Error loading cached options:', error);
                            setOptionsLoading(false);
                            alert('Failed to load options data. Please try again later.');
                            return;
                        }
