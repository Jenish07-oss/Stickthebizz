import fs from 'fs';

const filePath = 'app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the pass preview container (from line 245 to 398)
const startMarker = '{/* 3. Interactive Customer Loyalty Pass Preview (Order 3 on mobile; Col 8-12 on desktop) */}';
const midMarker = '{/* 4. Other Details (Order 4 on mobile: moved lower below phone animation; Col 1-7 on desktop) */}';
const endMarker = '{/* LIVE MOVING RETAIL TICKER */}';

const startIdx = content.indexOf(startMarker);
const midIdx = content.indexOf(midMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || midIdx === -1 || endIdx === -1) {
  console.error('Markers not found', { startIdx, midIdx, endIdx });
  process.exit(1);
}

const replacement = `${startMarker}
              <div className="order-3 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-3 flex flex-col items-center justify-center pt-2 lg:pt-0">
                <div className="w-full max-w-[360px] flex flex-col items-center">
                  <div className="mb-2.5 flex flex-col items-center text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-primary/25 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-secondary shadow-xs">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span>INTERACTIVE PREVIEW • SAMPLE STAMP PASS</span>
                    </span>
                    <p className="mt-1 text-[11px] text-ink/75 font-medium leading-tight">
                      Click stamp circles or button to punch live in real time
                    </p>
                  </div>

                  <InteractiveStampPass rule={passConfig} />
                </div>
              </div>

              ${midMarker}
              <div className="order-4 lg:col-span-7 flex flex-col items-start text-left space-y-6 pt-2">
                <RetailPresetSelector
                  selectedPreset={selectedPreset}
                  onSelectPreset={handlePresetSelect}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-ink/80 w-full">
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 border border-white/30 shadow-sm">
                    <AntiFraudIcon size={20} />
                    <span>Strict 1-Scan Per Day (12:00 AM Reset)</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 border border-white/30 shadow-sm">
                    <CustomersIcon size={20} />
                    <span>DPDP Safe Customer Privacy</span>
                  </div>
                </div>

                <ROICalculator
                  onCalculationChange={(res) => {
                    setMonthlyExtraRevenue(res.extraRevenue);
                    setMonthlyExtraVisits(res.extraVisits);
                  }}
                />
              </div>
            </div>
          </div>
        </AnimatedHero>

        `;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);

// Also add OfflineBanner near bottom
if (!content.includes('<OfflineBanner />')) {
  content = content.replace('<Footer />', '<OfflineBanner />\n      <Footer />');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated app/page.tsx with interactive components');

