/**
 * Created: 2025-08-07 05:52:00 UTC
 * Updated: 2025-08-07 05:52:00 UTC
 * Purpose: Friends screen with Telegram WebApp safe referral system
 * Features: Multiple referral code fallbacks, safe clipboard operations, error boundaries
 */
'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Share, Copy, Gift, ExternalLink, Coins, CheckCircle } from 'lucide-react';

export function FriendsScreen() {
  const { state, dispatch } = useGame();
  const [copied, setCopied] = useState(false);

  // Early return with loading state if not initialized
  if (!state?.isInitialized) {
    return (
      <div className="p-4 space-y-6 pb-20 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Loading Friends...</h3>
          <p className="text-gray-300 text-sm">Please wait while we initialize your data</p>
        </div>
      </div>
    );
  }

  // Safe referral code generation with multiple fallbacks
  const safeReferralCode = React.useMemo(() => {
    try {
      if (state.referralCode && state.referralCode !== 'undefined') {
        return state.referralCode;
      }
      if (state.userId && state.userId !== 0) {
        return state.userId.toString();
      }
      if (state.firstName || state.username) {
        return `USER_${(state.firstName || state.username || '').slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 5)}`;
      }
      return `DEMO_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    } catch (error) {
      console.error('Error generating safe referral code:', error);
      return `SAFE_${Date.now().toString(36).slice(-6).toUpperCase()}`;
    }
  }, [state.referralCode, state.userId, state.firstName, state.username]);

  // Safe referral link generation
  const referralLink = React.useMemo(() => {
    try {
      return `https://t.me/kezeBot?start=${safeReferralCode}`;
    } catch (error) {
      console.error('Error generating referral link:', error);
      return 'https://t.me/kezeBot';
    }
  }, [safeReferralCode]);

  const shareText = `🪙 Join me in Keze Tap Game! Earn KEZE coins by tapping and playing games. Use my referral code: ${safeReferralCode}`;

  const handleCopyReferralCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(safeReferralCode);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = safeReferralCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Trigger haptic feedback if available
      if ((window as any).triggerHaptic) {
        (window as any).triggerHaptic('light');
      }
    } catch (err) {
      console.error('Failed to copy referral code:', err);
      // Visual feedback even if copy failed
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      if ((window as any).triggerHaptic) {
        (window as any).triggerHaptic('light');
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTelegram = () => {
    try {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

      // Try Telegram WebApp sharing first if available
      if (state.telegramWebAppAvailable && (window as any).Telegram?.WebApp?.openTelegramLink) {
        (window as any).Telegram.WebApp.openTelegramLink(telegramUrl);
      } else if (window.open) {
        // Fallback to regular window.open
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Final fallback: copy link to clipboard
        handleCopyLink();
      }
    } catch (err) {
      console.error('Failed to share:', err);
      // Fallback: copy link to clipboard
      handleCopyLink();
    }
  };

  // REMOVED: Demo invite function - no longer needed

  // Safe calculation of total referral earnings with error handling
  const totalReferralEarnings = React.useMemo(() => {
    try {
      if (!state.referrals || !Array.isArray(state.referrals)) {
        return 0;
      }
      return state.referrals.reduce((sum, ref) => {
        const earnings = typeof ref?.earnings === 'number' ? ref.earnings : 0;
        return sum + earnings;
      }, 0);
    } catch (error) {
      console.error('Error calculating referral earnings:', error);
      return 0;
    }
  }, [state.referrals]);

  // Safe referrals array
  const safeReferrals = React.useMemo(() => {
    try {
      return Array.isArray(state.referrals) ? state.referrals : [];
    } catch (error) {
      console.error('Error accessing referrals:', error);
      return [];
    }
  }, [state.referrals]);

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Friends</h1>
        <p className="text-gray-300">Invite friends and earn bonus Keze coins!</p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{safeReferrals.length}</div>
            <div className="text-sm text-gray-300">Friends Invited</div>
          </CardContent>
        </Card>
        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-4 text-center">
            <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{totalReferralEarnings.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Bonus Earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Rewards */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Referral Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <div>
              <div className="text-white font-semibold">Invite a Friend</div>
              <div className="text-sm text-gray-300">Both you and your friend get bonus Keze coins</div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="font-bold">+1,000</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <div>
              <div className="text-white font-semibold">Friend Earns 10K+</div>
              <div className="text-sm text-gray-300">Additional bonus when your friend succeeds</div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="font-bold">+2,500</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code Section */}
      <Card className="bg-black/20 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
            <span className="text-xl font-mono text-yellow-400">{safeReferralCode}</span>
            <Button
              onClick={handleCopyReferralCode}
              size="sm"
              variant="outline"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-black"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              onClick={handleShareTelegram}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* REMOVED: Demo invite button - now using real referral system */}

      {/* Friends List */}
      {safeReferrals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Friends ({safeReferrals.length})
          </h2>
          <div className="space-y-3">
            {safeReferrals.map(referral => {
              try {
                return (
                  <Card key={referral.id} className="bg-black/20 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-purple-600 text-white">
                              {(referral.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white">{referral.username || 'Anonymous'}</div>
                            <div className="text-sm text-gray-300">
                              Joined {referral.joinedAt?.toLocaleDateString() || 'Recently'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Coins className="w-4 h-4" />
                            <span className="font-semibold">{(referral.earnings || 0).toLocaleString()}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-green-400 border-green-400 text-xs"
                          >
                            Active
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              } catch (error) {
                console.error('Error rendering referral:', error);
                return null;
              }
            })}
          </div>
        </div>
      )}

      {safeReferrals.length === 0 && (
        <Card className="bg-black/20 border-white/10">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No friends yet</h3>
            <p className="text-gray-300 text-sm mb-4">
              Start inviting friends to earn bonus coins and build your network!
            </p>
            <Button onClick={handleShareTelegram} className="bg-blue-600 hover:bg-blue-700">
              <Share className="w-4 h-4 mr-2" />
              Invite Your First Friend
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
