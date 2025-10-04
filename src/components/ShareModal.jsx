import React, { useState, useRef } from 'react';
import ShareCard from './ShareCard';

const ShareModal = ({ isOpen, onClose, resultData }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const shareCardRef = useRef(null);

  if (!isOpen || !resultData) return null;

  const shareUrl = window.location.href;
  const shareText = `Jeg har statistisk ${resultData.remainingYears} år tilbage at leve! 🕐 Beregn din egen levetid på`;

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess('link');

      // Track with Plausible
      if (window.plausible) {
        window.plausible('Share', { props: { method: 'clipboard-link' } });
      }

      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Copy formatted results to clipboard
  const copyResults = async () => {
    const text = `🕐 Mine Levetidsresultater

📊 Forventet levetid: ${resultData.adjustedLifeExpectancy} år
⏳ Resterende tid: ${resultData.remainingYears} år (${resultData.remainingDays} dage)
📅 Estimeret slutdato: ${resultData.endDate}
📍 Baseret på: ${resultData.dataSource}

${resultData.lifestyleImpact !== 0 ? `💪 Livsstil påvirkning: ${resultData.lifestyleImpact > 0 ? '+' : ''}${resultData.lifestyleImpact} år` : ''}

Beregn din egen: ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('results');

      if (window.plausible) {
        window.plausible('Share', { props: { method: 'clipboard-results' } });
      }

      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Native share (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mine levetidsresultater',
          text: shareText,
          url: shareUrl
        });

        if (window.plausible) {
          window.plausible('Share', { props: { method: 'native' } });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  // Social media shares
  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareText} #levetid #sundhed`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');

    if (window.plausible) {
      window.plausible('Share', { props: { method: 'twitter' } });
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');

    if (window.plausible) {
      window.plausible('Share', { props: { method: 'facebook' } });
    }
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=550,height=420');

    if (window.plausible) {
      window.plausible('Share', { props: { method: 'linkedin' } });
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');

    if (window.plausible) {
      window.plausible('Share', { props: { method: 'whatsapp' } });
    }
  };

  // Download as image
  const downloadImage = async () => {
    setIsGenerating(true);

    try {
      // We'll use html2canvas when available, for now create a simple download
      // This will be enhanced in the next step
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 1200;
      canvas.height = 630;

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(1, '#7C3AED');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🕐 Mine Levetidsresultater', canvas.width / 2, 150);

      ctx.font = 'bold 72px Inter, sans-serif';
      ctx.fillText(`${resultData.remainingYears} år tilbage`, canvas.width / 2, 280);

      ctx.font = '32px Inter, sans-serif';
      ctx.fillText(`Forventet levetid: ${resultData.adjustedLifeExpectancy} år`, canvas.width / 2, 380);

      if (resultData.lifestyleImpact !== 0) {
        ctx.fillText(
          `Livsstil: ${resultData.lifestyleImpact > 0 ? '+' : ''}${resultData.lifestyleImpact} år`,
          canvas.width / 2,
          450
        );
      }

      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('levetidsberegner.dk', canvas.width / 2, 550);

      // Download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'levetidsresultater.png';
        a.click();
        URL.revokeObjectURL(url);

        if (window.plausible) {
          window.plausible('Share', { props: { method: 'download-image' } });
        }

        setIsGenerating(false);
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-card rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-card z-10">
            <h2 className="text-xl font-semibold">Del dine resultater</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Luk"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Preview Card */}
            <div ref={shareCardRef}>
              <ShareCard resultData={resultData} />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Hurtige handlinger</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className="btn btn-outline flex items-center justify-center gap-2 relative"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {copySuccess === 'link' ? 'Kopieret!' : 'Kopiér link'}
                </button>

                <button
                  onClick={copyResults}
                  className="btn btn-outline flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {copySuccess === 'results' ? 'Kopieret!' : 'Kopiér tekst'}
                </button>
              </div>

              {navigator.share && (
                <button
                  onClick={nativeShare}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Del via mobil
                </button>
              )}
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Del på sociale medier</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareToTwitter}
                  className="btn btn-outline flex items-center justify-center gap-2 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter/X
                </button>

                <button
                  onClick={shareToFacebook}
                  className="btn btn-outline flex items-center justify-center gap-2 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>

                <button
                  onClick={shareToLinkedIn}
                  className="btn btn-outline flex items-center justify-center gap-2 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </button>

                <button
                  onClick={shareToWhatsApp}
                  className="btn btn-outline flex items-center justify-center gap-2 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Download Image */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Gem som billede</h3>
              <button
                onClick={downloadImage}
                disabled={isGenerating}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Genererer...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download billede
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareModal;
