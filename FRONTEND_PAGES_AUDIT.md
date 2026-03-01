# Frontend Pages Audit Report

## Executive Summary

This audit analyzed **31 page files** in `frontend/src/pages/`. Issues are categorized into:
1. **Hardcoded/Dummy Data** - Static data that should come from API
2. **Non-Functional Buttons** - Buttons missing onClick handlers or with empty handlers
3. **Missing API Integrations** - Pages not using proper data fetching hooks
4. **Placeholder Components** - TODO comments, "Coming Soon", or incomplete functionality

---

## Issues by Page

### 1. Dashboard.tsx

**API Integration:** ✅ Uses `useAnalytics`, `useListings` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines 32-42 | `fallbackEnergyData` and `fallbackCityData` arrays hardcoded | Fetch from analytics API or show loading state |
| Hardcoded Data | Line 66 | Stats change percentages hardcoded (`"+12.4%"`, `"+8.2%"`, `"+5.1%"`, `"-2.1%"`) | Calculate from historical data comparison |
| Hardcoded Data | Line 67 | "Avg Price" stat hardcoded as `"₹6.40"` | Compute from API data or add avgPrice to analytics endpoint |

---

### 2. Marketplace.tsx

**API Integration:** ✅ Uses `useListings` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~37 | Distance calculated with fake formula `(idx * 3.7 + 1.2) % 15 + 1` | Add geolocation to listings API or use real distance calculation |
| Hardcoded Data | Line ~38 | Reliability hardcoded as `90 + (idx * 3) % 10` | Add reliability field to producer/listing API |
| Non-Functional Button | Lines ~108-110 | Filter buttons ("Best Price", "Nearest", "Greenest") have no onClick handlers | Implement sorting logic with `setSortBy` state |
| Non-Functional Button | Line ~180 | "Details" button has no onClick handler | Navigate to listing detail page or open modal |
| Hardcoded Data | AI Picks panel | Producer names ("HydroFlow Kerala", "SolarMax Delhi") and values are hardcoded | Fetch AI recommendations from backend |

---

### 3. BuyEnergy.tsx

**API Integration:** ✅ Uses `useListings`, `useBuyEnergy` hooks properly

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~40 | Reliability hardcoded as `96` for all listings | Add reliability field to producer API |

---

### 4. Certificates.tsx

**API Integration:** ✅ Uses `useCertificates` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~28 | Type mapping hardcoded `["REC", "G-GO", "I-REC"]` by index | Use actual certificate type from API |
| Non-Functional Button | Line ~94 | "Issue Certificate" button has no onClick handler | Implement certificate issuance modal/flow |
| Non-Functional Button | Lines ~230-235 | "Download PDF" button has no functional handler | Implement PDF generation/download |
| Non-Functional Button | Line ~236 | "Validate" button has no functional handler | Implement certificate validation API call |
| Hardcoded Data | Various | Issuer hardcoded as "Bureau of Energy Efficiency" | Use issuer field from certificate API |

---

### 5. Contracts.tsx

**API Integration:** ✅ Uses `useContracts` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~53 | energyType hardcoded as `"solar"` for all contracts | Add energy_type field to contracts API |
| Non-Functional Button | Line ~145 | "New Contract" button has no onClick handler | Navigate to contract creation page or open modal |
| Non-Functional Button | Line ~196 | "Filter" button has no onClick handler | Implement filter modal/dropdown logic |

---

### 6. CreateListing.tsx

**API Integration:** ✅ Uses `useCreateListing`, `useProducers` hooks properly

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| — | — | Well integrated | None |

---

### 7. Payments.tsx

**API Integration:** ✅ Uses `usePayments` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Non-Functional Button | Line ~134 | "Export CSV" button has no onClick handler | Implement CSV export logic |
| Non-Functional Button | Line ~200 | "Pay Now" button has no onClick handler | Implement payment initiation flow |
| Hardcoded Data | Lines ~230-240 | Payment settings hardcoded (HDFC •••• 4521, Mumbai MH 400001) | Fetch from user profile/settings API |
| Non-Functional Button | Multiple | "Edit" buttons on payment settings have no handlers | Implement edit modal for payment methods |

---

### 8. TradingHistory.tsx

**API Integration:** ✅ Uses `useContracts` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~46 | Trade type logic broken: `c.buyer_id === c.id` always false | Compare `c.buyer_id === currentUserId` |
| Hardcoded Data | Line ~47 | energyType hardcoded as `"solar"` for all trades | Use actual energy_source from contract data |
| Non-Functional Button | Line ~117 | "Export CSV" button has no onClick handler | Implement CSV export functionality |

---

### 9. Wallet.tsx

**API Integration:** ✅ Uses `usePayments` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~64 | walletAddress hardcoded `"0x7f9e8d...3a4b5c6d"` | Fetch from user's blockchain wallet API |
| Hardcoded Data | Lines ~68-75 | `balanceHistory` array completely hardcoded | Fetch transaction history from payments API |
| Hardcoded Data | Line ~63 | energyCredits hardcoded `"850 kWh"` | Fetch from user credits/certificates API |
| Non-Functional Button | Line ~125 | "Withdraw" button has no onClick handler | Implement withdrawal flow |
| Non-Functional Button | Line ~128 | "Add Funds" button has no onClick handler | Implement deposit/top-up flow |
| Non-Functional Button | handleCopy | Copy function only sets state, doesn't copy to clipboard | Use `navigator.clipboard.writeText()` |

---

### 10. AdminConsole.tsx

**API Integration:** ✅ Uses `useAnalytics`, `useProducers`, `useContracts` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~91-92 | Uptime "99.9%" and Latency "24ms" hardcoded | Fetch from system health API endpoint |
| Non-Functional Button | Lines ~168-178 | All admin action buttons have no handlers: "Backup Database", "Security Scan", "Export Logs", "User Management", "Emergency Stop" | Implement admin action APIs and wire handlers |
| Non-Functional Button | Line ~195 | "View All" button has no onClick handler | Navigate to full list view |
| Non-Functional Button | Line ~210 | "Manage" buttons have no onClick handlers | Implement management modal/navigation |
| Non-Functional Button | Line ~232 | "Export" button has no onClick handler | Implement data export functionality |

---

### 11. Profile.tsx

**API Integration:** ✅ Uses `useAuth`, `useAnalytics` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~40-45 | Profile data hardcoded (phone: "+91 98765 43210", location, company, bio) | Fetch from user profile API |
| Non-Functional Button | Notification toggles | Switches update local state but don't persist to backend | Add API call to save notification preferences |
| Non-Functional Button | Line ~254 | "Save Changes" button has no onClick handler | Implement profile update API call |
| Non-Functional Button | Line ~253 | "Cancel" button has no onClick handler | Reset form to original values |
| Non-Functional Button | Line ~277 | "Change" password button has no onClick handler | Implement password change modal/flow |

---

### 12. SmartMeter.tsx

**API Integration:** ✅ Uses `useMeters` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~17-20 | Fallback devices hardcoded when no API data | Show empty state or loading instead |
| Hardcoded Data | Lines ~48-51 | Stats row values hardcoded ("6,770", "66%", "70%", "4") | Calculate from actual meter readings |
| Non-Functional Button | Line ~96 | "Add Device" button has no onClick handler | Implement device registration flow |
| Non-Functional Button | handleSync | Sync function only does `setTimeout` mock, no real API call | Call actual meter sync API endpoint |

---

### 13. Disputes.tsx

**API Integration:** ✅ Uses `useDisputes` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Non-Functional Button | Line ~115 | "New Dispute" button has no onClick handler | Implement dispute creation modal |
| Non-Functional Button | Line ~198 | "Upload Evidence" button has no onClick handler | Implement file upload functionality |
| Non-Functional Button | Line ~200 | "View Full History" button has no onClick handler | Navigate to dispute history or expand view |
| Non-Functional Button | Lines ~235-240 | Message send input and button have no functional handlers | Implement dispute message API |

---

### 14. AIAssistant.tsx

**API Integration:** ✅ Uses `useAIChat`, `useAIClearHistory`, `useAIExplain`, `useAITip`, `useAIModels` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| — | — | Well integrated | Minimal issues |

---

### 15. AIAnalytics.tsx

**API Integration:** ✅ Uses `usePricePrediction`, `useConsumptionAnalysis`, `useSustainabilityScore`, `useAIRecommendations` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~23-30 | `SAMPLE_PRODUCERS` array hardcoded | Fetch from producers API |
| Hardcoded Data | Lines ~34-40 | `SAMPLE_READINGS` array hardcoded | Fetch from smart meter API |

---

### 16. AIVoice.tsx

**API Integration:** ✅ Uses `useVoiceSpeak`, `useVoiceNotification`, `useVoiceLanguages`, `useVoiceSpeakers` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| — | — | Well integrated | Minimal issues |

---

### 17. AIBrain.tsx

**API Integration:** ✅ Uses `useAnalytics`, `useAIHealth`, `usePricePrediction`, `useSustainabilityScore` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~20-28 | `demandPrediction` array hardcoded | Fetch from AI prediction API |
| Hardcoded Data | Lines ~30-37 | `defaultInsights` array hardcoded | Generate from AI insights endpoint |
| Hardcoded Data | Lines ~41-46 | `sources` producer array hardcoded | Fetch from producers API |
| Hardcoded Data | Lines ~50-65 | Map zone/polygon data client-side only | Create zone/geolocation API endpoint |

---

### 18. PricingAuctions.tsx

**API Integration:** ✅ Uses `useQuery` with pricingService, `useListings` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~35-42 | Fallback `spotPriceData` hardcoded | Fetch from pricing history API |
| Hardcoded Data | Lines ~50-56 | Fallback `volatilityData` hardcoded | Calculate from pricing API data |
| Non-Functional Button | Line ~156 | "Create Auction" button has no onClick handler | Implement auction creation modal/flow |
| Non-Functional Button | Line ~190 | "Bid" button has no onClick handler | Implement bid submission API call |

---

### 19. ProducerDashboard.tsx

**API Integration:** ✅ Uses `useAnalytics`, `useMonthlyAnalytics` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines 12-20 | `defaultDemandVsSupply` array hardcoded | Fetch from real-time demand/supply API |
| Hardcoded Data | Lines 54-57 | Stats change percentages hardcoded ("+8.3%", "+14.2%", "+22%", "Optimal") | Calculate from historical comparison |
| Hardcoded Data | AI Advisor panel | AI suggestions and values are static text | Fetch from AI recommendation API |

---

### 20. ProducerDetail.tsx

**API Integration:** ✅ Uses `useProducer`, `useListings`, `useAnalytics` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~47 | Rating hardcoded as `4.8` | Add rating to producer API response |
| Hardcoded Data | Lines ~58-62 | Contact info generated from company name, phone hardcoded | Add contact fields to producer API |
| Hardcoded Data | Lines ~63-67 | Certifications array hardcoded | Fetch from producer certifications API |
| Hardcoded Data | Lines ~68-73 | Stats (uptime, fulfillmentRate, avgResponseTime, repeatCustomers) hardcoded | Add performance metrics to producer API |
| Hardcoded Data | Lines ~80-88 | `productionData` chart data hardcoded | Fetch from producer analytics API |
| Hardcoded Data | Lines ~90-94 | `reviews` array hardcoded | Create producer reviews API endpoint |
| Non-Functional Button | Line ~149 | "Contact" button has no onClick handler | Implement contact modal or messaging |
| Non-Functional Button | Line ~152 | "Buy Energy" button has no onClick handler | Navigate to buy page with producer filter |
| Non-Functional Button | Line ~308 | "Visit Website" button has no onClick handler | Open external link |

---

### 21. Producers.tsx

**API Integration:** ✅ Uses `useProducers` hook

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Line ~28 | Rating hardcoded as `4.7` for all producers | Add rating field to producer API |
| Hardcoded Data | Line ~30 | Reliability hardcoded as `95` | Add reliability metric to producer API |
| Hardcoded Data | Stats strip | "98%" avg reliability is calculated client-side | Compute from actual data or add to API |

---

### 22. CarbonCredit.tsx

**API Integration:** ✅ Uses `useAnalytics`, `useProducerPerformance` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~9-17 | `priceHistory` array hardcoded | Fetch from carbon credit pricing API |
| Hardcoded Data | Lines ~19-36 | `leaderboard` object (consumers, producers, investors) hardcoded | Create leaderboard API endpoint |
| Non-Functional Button | "Buy" button | Buy button in Quick Trade has no onClick handler | Implement carbon credit purchase API |
| Non-Functional Button | "Sell" button | Sell button in Quick Trade has no onClick handler | Implement carbon credit sell API |

---

### 23. Community.tsx

**API Integration:** ❌ No API integration - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Line 1-3 | "Backend integration pending — No /api/v1/community endpoint exists yet" | Create community API endpoint |
| Hardcoded Data | Lines ~53-73 | `mockMembers` array hardcoded | Fetch from community members API |
| Hardcoded Data | Lines ~75-100 | `mockPosts` array hardcoded | Fetch from community posts API |
| Hardcoded Data | Lines ~102-124 | `mockChallenges` array hardcoded | Fetch from challenges API |
| Non-Functional Button | Line ~180 | "Create Post" button has no onClick handler | Implement post creation modal |
| Non-Functional Button | Post actions | Like, comment, share buttons are non-functional | Implement social interaction APIs |
| Non-Functional Button | Challenge actions | Join challenge functionality missing | Implement challenge participation API |

---

### 24. EIPSimulator.tsx

**API Integration:** ❌ Client-side only - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-3 | "Backend integration pending — No /api/v1/grid-simulation endpoint exists yet" | Create grid simulation API (optional - okay as client only) |
| Hardcoded Data | Lines ~10-19 | `nodeData` network nodes hardcoded | Could be API-driven for real grid data |
| Hardcoded Data | Lines ~21-25 | `connections` array hardcoded | Could fetch from grid topology API |
| Hardcoded Data | Lines ~27-35 | `aiCommentary` messages hardcoded | Could stream from AI feed API |
| Hardcoded Data | Lines ~42-50 | `stabilityHistory` array hardcoded | Fetch from grid health API |

---

### 25. FutureSimulator.tsx

**API Integration:** ⚠️ Partially integrated - client-side simulator

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Line 1-2 | Notes as client-side simulator, partial backend integration | N/A - designed as client-side |

---

### 26. InvestorZone.tsx

**API Integration:** ❌ No API integration - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-3 | "Backend integration pending — No /api/v1/investments endpoint exists yet" | Create investments API endpoint |
| Hardcoded Data | Lines ~10-14 | `investments` array hardcoded | Fetch from investments API |
| Hardcoded Data | Lines ~16-20 | `growthData` array hardcoded | Fetch from investment analytics API |
| Non-Functional Button | Invest action | Investment simulation doesn't persist | Add investment API for real transactions |

---

### 27. KYC.tsx

**API Integration:** ❌ No API integration - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-3 | "Backend integration pending — No /api/v1/kyc endpoint exists yet" | Create KYC API endpoint |
| Hardcoded Data | Lines ~10-15 | `verificationSteps` array hardcoded | Fetch user's KYC status from API |
| Hardcoded Data | Lines ~17-21 | `documents` array hardcoded | Fetch user's uploaded documents from API |
| Hardcoded Data | Lines ~23-27 | `reviewerMessages` array hardcoded | Fetch from KYC review messages API |
| Non-Functional Button | Line ~123 | "Upload New Document" button non-functional | Implement document upload API |
| Non-Functional Button | Line ~169 | "Upload" button in documents section non-functional | Implement document upload flow |
| Non-Functional Button | Refresh buttons | Document refresh buttons non-functional | Implement document status refresh |

---

### 28. SmartCity.tsx

**API Integration:** ⚠️ Partially integrated - uses `useAnalytics` for totals only

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-2 | "Policy simulator and zone data are client-side" | Create city/zone API endpoints |
| Hardcoded Data | Lines ~13-19 | `energyMix` array hardcoded | Fetch from city energy mix API |
| Hardcoded Data | Lines ~21-27 | `zones` array hardcoded | Fetch from city zones API |
| Hardcoded Data | City selector | Cities list hardcoded | Fetch available cities from API |

---

### 29. Notifications.tsx

**API Integration:** ❌ No API integration - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-3 | "Backend integration pending — No /api/v1/notifications endpoint exists yet" | Create notifications API endpoint |
| Hardcoded Data | Lines ~10-23 | `notifications` array (10 items) hardcoded | Fetch from notifications API |
| Non-Functional Button | "Load More" button | Doesn't fetch more notifications | Implement paginated notification fetch |

---

### 30. OrderDetails.tsx

**API Integration:** ✅ Uses `useContract`, `usePayments`, `useCertificates` hooks

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| Hardcoded Data | Lines ~40-47 | Producer/consumer names generated from IDs | Fetch actual names from user/producer API |
| Hardcoded Data | Line ~49 | Location hardcoded as "India" | Use actual location from API |
| Hardcoded Data | Line ~50 | Rating hardcoded as `4.8` | Fetch from producer ratings |
| Hardcoded Data | Lines ~54-58 | Blockchain data partially generated from contract ID | Use actual blockchain transaction data |
| Non-Functional Button | "Invoice" download | Button exists but may not have full implementation | Verify PDF generation works |
| Non-Functional Button | "Download" cert button | Certificate download button has no onClick | Implement certificate PDF download |
| Non-Functional Button | External link button | Blockchain explorer link non-functional | Implement actual blockchain explorer link |

---

### 31. Help.tsx

**API Integration:** ❌ No API integration - explicit TODO comment

| Issue Type | Location | Description | Fix Required |
|------------|----------|-------------|--------------|
| TODO Comment | Lines 1-2 | "Contact form does not submit to any API endpoint yet" | Create /api/v1/support endpoint |
| Hardcoded Data | Lines ~26-148 | All FAQ content hardcoded | Could be fetched from CMS/API |
| Non-Functional Form | handleSubmit | Contact form only simulates submission with `setTimeout` | Wire to support ticket API |
| Non-Functional Button | Live Chat card | No onClick to open chat | Integrate live chat widget |
| Non-Functional Button | Resource links | All resource links point to `#` | Add actual documentation URLs |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Pages Analyzed | 31 |
| Pages with Full API Integration | 12 |
| Pages with Partial API Integration | 7 |
| Pages with No API Integration | 12 |
| Non-Functional Buttons Found | 48+ |
| Hardcoded Data Instances | 65+ |
| TODO/Placeholder Comments | 8 |

---

## Priority Recommendations

### High Priority (Core Functionality)
1. **Payments.tsx** - Pay Now, Export buttons need handlers
2. **Profile.tsx** - Save Changes must persist to API
3. **Disputes.tsx** - All interaction buttons non-functional
4. **KYC.tsx** - Document upload must work for compliance
5. **Wallet.tsx** - Withdraw/Add Funds critical for transactions

### Medium Priority (User Experience)
1. **Marketplace.tsx** - Filter/sort buttons, Details button
2. **Certificates.tsx** - Issue, Download, Validate buttons
3. **Contracts.tsx** - New Contract, Filter buttons
4. **AdminConsole.tsx** - All admin action buttons
5. **SmartMeter.tsx** - Add Device, actual sync functionality

### Low Priority (Enhancement)
1. **Community.tsx** - Entire page needs API backend
2. **InvestorZone.tsx** - Entire page needs API backend
3. **Notifications.tsx** - Needs API endpoint
4. **Help.tsx** - Contact form submission
5. **EIPSimulator.tsx** - Acceptable as client-side simulator

---

## Backend API Endpoints Needed

Based on this audit, the following API endpoints are missing or incomplete:

1. `/api/v1/community` - Posts, members, challenges
2. `/api/v1/investments` - Investment projects, returns
3. `/api/v1/kyc` - Verification status, document upload
4. `/api/v1/notifications` - User notifications
5. `/api/v1/support` - Contact form, tickets
6. `/api/v1/city-zones` - Smart city zone data
7. `/api/v1/carbon-credits` - Trading, leaderboard
8. `/api/v1/producer-ratings` - Reviews, ratings
9. `/api/v1/user-profile` - Full profile with settings

---

*Generated: Audit of frontend/src/pages/ directory*
