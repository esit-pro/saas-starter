import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorAuthFormProps {
  user: {
    id: number;
    phoneNumber?: string | null;
    phoneVerified?: boolean | null;
    twoFactorEnabled?: boolean | null;
  };
}

export function TwoFactorAuthForm({ user }: TwoFactorAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user.phoneVerified);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(!!user.twoFactorEnabled);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Update state when user prop changes
  useEffect(() => {
    setPhoneNumber(user.phoneNumber || '');
    setIsPhoneVerified(!!user.phoneVerified);
    setIsTwoFactorEnabled(!!user.twoFactorEnabled);
  }, [user]);
  
  // Timer for code expiration
  useEffect(() => {
    if (!codeExpiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(codeExpiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        if (showVerificationForm) {
          toast.error('Verification code expired', {
            description: 'Please request a new verification code'
          });
          setShowVerificationForm(false);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [codeExpiresAt, showVerificationForm]);
  
  // Format time remaining
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Function to update phone number
  const handleUpdatePhone = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid phone number'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Verification code sent', {
          description: 'Please check your phone for the verification code. It will expire in 10 minutes.'
        });
        
        // Set code expiration time (10 minutes from now)
        setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
        setShowVerificationForm(true);
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to send verification code'
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred'
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to verify phone number
  const handleVerifyPhone = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Invalid code', {
        description: 'Please enter a valid 6-digit verification code'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/verify-phone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Success', {
          description: 'Your phone number has been verified'
        });
        
        setIsPhoneVerified(true);
        setShowVerificationForm(false);
        setVerificationCode('');
        setCodeExpiresAt(null);
        setTimeRemaining(null);
      } else {
        if (data.error === 'Verification code has expired') {
          toast.error('Code expired', {
            description: 'Your verification code has expired. Please request a new one.'
          });
          setShowVerificationForm(false);
          setCodeExpiresAt(null);
          setTimeRemaining(null);
        } else {
          toast.error('Error', {
            description: data.error || 'Failed to verify phone number'
          });
        }
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred'
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to toggle 2FA
  const handleToggle2FA = async () => {
    if (!isPhoneVerified) {
      toast.error('Phone verification required', {
        description: 'You must verify your phone number before enabling 2FA'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/2fa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !isTwoFactorEnabled }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsTwoFactorEnabled(!isTwoFactorEnabled);
        toast.success('Success', {
          description: !isTwoFactorEnabled 
            ? 'Two-factor authentication has been enabled' 
            : 'Two-factor authentication has been disabled'
        });
      } else {
        toast.error('Error', {
          description: data.error || 'Failed to update 2FA settings'
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred'
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code from your phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex space-x-2">
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 555-5555"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading || isPhoneVerified}
              className="max-w-[250px]"
            />
            {!isPhoneVerified ? (
              <Button onClick={handleUpdatePhone} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            ) : (
              <div className="flex items-center text-green-500 px-3">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Verified</span>
              </div>
            )}
          </div>
        </div>
        
        {showVerificationForm && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <div className="flex space-x-2">
              <Input
                id="verificationCode"
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="max-w-[180px] text-center text-xl tracking-widest"
              />
              <Button onClick={handleVerifyPhone} disabled={isLoading || verificationCode.length !== 6 || timeRemaining === 0}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>
            <div className="flex items-center mt-1 text-xs text-muted-foreground space-x-2">
              <p>Enter the 6-digit verification code sent to your phone</p>
              {timeRemaining !== null && timeRemaining > 0 && (
                <div className="flex items-center text-amber-500 font-medium">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Expires in {formatTimeRemaining()}</span>
                </div>
              )}
              {timeRemaining === 0 && (
                <div className="flex items-center text-red-500 font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Code expired</span>
                </div>
              )}
            </div>
            {timeRemaining !== null && timeRemaining < 60 && timeRemaining > 0 && (
              <p className="text-xs text-red-500 font-medium">
                Your code will expire soon!
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4">
          <div className="space-y-0.5">
            <Label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication</Label>
            <p className="text-xs text-muted-foreground">
              Require a verification code when signing in
            </p>
          </div>
          <Switch
            id="twoFactorEnabled"
            checked={isTwoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading || !isPhoneVerified}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          {isTwoFactorEnabled
            ? "Two-factor authentication is enabled."
            : isPhoneVerified
              ? "Your phone is verified. You can enable two-factor authentication."
              : "Verify your phone number to enable two-factor authentication."}
        </p>
      </CardFooter>
    </Card>
  );
} 