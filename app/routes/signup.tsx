import { useState, useEffect } from "react";
import { Form, useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "../lib/supabase.client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const shop = searchParams.get("shop");

  useEffect(() => {
    // Check if user is already logged in
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(redirect);
      }
    });
  }, [navigate, redirect]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const supabase = getSupabaseBrowserClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          shop: shop || undefined,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required
    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // If auto-confirmed, navigate to dashboard
    if (data.session) {
      navigate(redirect);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <img src="/bright-logo.svg" alt="Logistix" className="size-16" />
            <span className="text-3xl font-semibold ml-3">LOGISTIX</span>
          </div>

          <div className="bg-neutral-900 rounded-lg shadow-lg border border-green-500/30 p-8">
            <h1 className="text-3xl font-normal text-white mb-6">Check your email</h1>
            <p className="text-gray-400 mb-4">
              We've sent you an email with a confirmation link. Please check your inbox and click the link to
              activate your account.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src="/bright-logo.svg" alt="Logistix" className="size-16" />
          <span className="text-3xl font-semibold ml-3">LOGISTIX</span>
        </div>

        <div className="bg-neutral-900 rounded-lg shadow-lg border border-green-500/30 p-8">
          <h1 className="text-3xl font-normal text-white mb-6">Create Account</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
                minLength={6}
              />
              <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <a
                href={`/login${redirect !== "/dashboard" ? `?redirect=${redirect}` : ""}`}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
