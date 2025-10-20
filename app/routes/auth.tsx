import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "../lib/supabase.client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const shop = searchParams.get("shop");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          shop: shop || undefined, // Include shop if present
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate(redirect);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowserClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate(redirect);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900 rounded-2xl shadow-2xl border border-green-500/30 p-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/waving-bever.svg" alt="Logistix" className="size-16" />
          </div>
          <h1 className="text-3xl font-normal text-white mb-4 text-center">Check your email</h1>
          <p className="text-gray-400 mb-6 text-center">
            We've sent you an email with a confirmation link. Please check your inbox and click the link to
            activate your account.
          </p>
          {shop && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm text-center">
                Your shop <span className="font-semibold">{shop}</span> will be connected after activation.
              </p>
            </div>
          )}
          <Button onClick={() => { setSuccess(false); setIsSignUp(false); }} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden">
      <div className="relative w-full max-w-4xl h-[600px]">
        <div className="absolute inset-0 bg-neutral-900 rounded-3xl shadow-2xl border border-green-500/30 overflow-hidden">
          <div className="relative w-full h-full flex">
            {/* Overlay Panel Container */}
            <div
              className={[
                "absolute top-0 right-0 w-1/2 h-full z-20 transition-transform duration-700 ease-in-out",
                isSignUp ? "-translate-x-full" : "translate-x-0",
              ].join(" ")}
            >
              <div className="relative w-full h-full bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-12">
                <div className="text-center space-y-6">
                  <div className="flex justify-center mb-6">
                    <img
                      src={isSignUp ? "/waving-bever.svg" : "/bright-logo.svg"}
                      alt="Logistix"
                      className={[
                        "size-20 transition-transform duration-500",
                        isSignUp ? "animate-wave" : "",
                      ].join(" ")}
                      style={{
                        transformOrigin: "bottom center",
                      }}
                    />
                  </div>

                  {!isSignUp ? (
                    <>
                      <h2 className="text-4xl font-bold">Welcome Back!</h2>
                      <p className="text-green-50 text-lg">
                        To keep connected with us please login with your personal info
                      </p>
                      <button
                        onClick={() => setIsSignUp(true)}
                        className="mt-6 px-12 py-3 bg-transparent border-2 border-white rounded-full text-white font-semibold hover:bg-white hover:text-green-700 transition-all duration-300"
                      >
                        SIGN UP
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-4xl font-bold">Hello, Friend!</h2>
                      <p className="text-green-50 text-lg">
                        Enter your personal details and start journey with us
                      </p>
                      <button
                        onClick={() => setIsSignUp(false)}
                        className="mt-6 px-12 py-3 bg-transparent border-2 border-white rounded-full text-white font-semibold hover:bg-white hover:text-green-700 transition-all duration-300"
                      >
                        SIGN IN
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sign In Form */}
            <div
              className={[
                "absolute top-0 left-0 w-1/2 h-full flex items-center justify-center p-12 transition-all duration-700 ease-in-out",
                isSignUp ? "opacity-0 z-0 translate-x-0" : "opacity-100 z-10 translate-x-0",
              ].join(" ")}
            >
              <div className="w-full max-w-sm">
                <h1 className="text-4xl font-bold text-white mb-2 text-center">Sign In</h1>
                <p className="text-gray-400 mb-8 text-center">Use your account</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Password"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={loading}>
                    {loading ? "Signing in..." : "SIGN IN"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Sign Up Form */}
            <div
              className={[
                "absolute top-0 right-0 w-1/2 h-full flex items-center justify-center p-12 transition-all duration-700 ease-in-out",
                isSignUp ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-0",
              ].join(" ")}
            >
              <div className="w-full max-w-sm">
                <h1 className="text-4xl font-bold text-white mb-2 text-center">Create Account</h1>
                <p className="text-gray-400 mb-8 text-center">Use your email for registration</p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="First Name"
                      className="bg-neutral-800 border-neutral-700"
                    />
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Last Name"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  <div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Password"
                      className="bg-neutral-800 border-neutral-700"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm Password"
                      className="bg-neutral-800 border-neutral-700"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={loading}>
                    {loading ? "Creating account..." : "SIGN UP"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
