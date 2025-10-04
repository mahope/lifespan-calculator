import React from 'react';

const ShareCard = ({ resultData }) => {
  if (!resultData) return null;

  // Calculate top lifestyle factors
  const lifestyleFactors = [];
  if (resultData.lifestyleImpact !== 0) {
    // This is a simplified version - in real implementation we'd track individual factors
    if (resultData.lifestyleImpact > 0) {
      lifestyleFactors.push('Sund livsstil', 'God motion', 'Balanceret kost');
    } else {
      lifestyleFactors.push('Rum for forbedring');
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] rounded-lg p-8 text-white shadow-lg overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

      {/* Content */}
      <div className="relative space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <h3 className="text-2xl font-bold">Mine Levetidsresultater</h3>
        </div>

        {/* Main stat */}
        <div className="text-center py-6 bg-white/10 backdrop-blur-sm rounded-lg">
          <div className="text-6xl font-bold mb-2">{resultData.remainingYears}</div>
          <div className="text-lg text-white/90">år tilbage</div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{resultData.adjustedLifeExpectancy}</div>
            <div className="text-sm text-white/80">Forventet alder</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{resultData.remainingDays}</div>
            <div className="text-sm text-white/80">Dage tilbage</div>
          </div>
        </div>

        {/* Lifestyle impact */}
        {resultData.lifestyleImpact !== 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-sm text-white/80 mb-1">Livsstil påvirkning</div>
            <div className={`text-3xl font-bold ${resultData.lifestyleImpact > 0 ? 'text-green-300' : 'text-orange-300'}`}>
              {resultData.lifestyleImpact > 0 ? '+' : ''}{resultData.lifestyleImpact} år
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/20">
          <div className="text-sm text-white/80">Beregn din egen levetid på</div>
          <div className="text-lg font-semibold">levetidsberegner.dk</div>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
