import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Worker } from "@shared/schema";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/login', { phoneNumber });
      const data = await response.json();
      
      if (response.ok && data.worker) {
        // Store worker info in localStorage
        localStorage.setItem('currentWorker', JSON.stringify(data.worker));
        // Navigate to worker app
        setLocation('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Worker Login</CardTitle>
          <CardDescription>
            Enter your phone number to access the vacation request system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg"
                data-testid="input-phone"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-destructive" data-testid="text-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !phoneNumber}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Test phone numbers:</p>
              <p>5513759096, 2272185752, 2813527628</p>
            </div>

            <div className="pt-4 border-t">
              <Link href="/supervisor">
                <Button variant="outline" className="w-full" data-testid="link-supervisor">
                  <Shield className="w-4 h-4 mr-2" />
                  Switch to Supervisor
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
