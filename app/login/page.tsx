'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Sparkles, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error('Failed to login: ' + error.message);
        setLoading(false);
      }
    } catch (error) {
      const userError = error as { message: string };
      toast.error('Login error: ' + userError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:30px_30px]"></div>
        
        {/* Floating orbs for depth */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Invoice Generator Pro</h1>
          </div>
          <p className="text-blue-100 text-lg mb-12 font-light">
            Generate professional IGST invoices with AI-powered automation
          </p>

          <div className="space-y-6">
            <div className="group flex items-start gap-4 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Enrichment</h3>
                <p className="text-blue-100 leading-relaxed">
                  Automatically generate batch numbers, dates, botanical names, COA, and MSDS documents using advanced AI technology
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Smart Excel Extraction</h3>
                <p className="text-blue-100 leading-relaxed">
                  Upload any Excel file and let AI intelligently extract all invoice data with perfect accuracy
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure & Reliable</h3>
                <p className="text-blue-100 leading-relaxed">
                  Bank-grade encryption and secure cloud storage to keep your invoice data safe and accessible
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 hover:translate-x-2">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Export & Share</h3>
                <p className="text-blue-100 leading-relaxed">
                  Export invoices to PDF or Excel formats and share instantly with clients and partners
                </p>
              </div>
            </div>
          </div>
        </div>

        
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Mobile logo for small screens */}
        <div className="lg:hidden absolute top-8 left-8">
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">Invoice Pro</span>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 relative overflow-hidden">
          {/* Decorative gradient blur */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-200/50 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-200/50 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl mb-5 shadow-inner">
                <FileText className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Sign in to start creating professional invoices<br />with AI-powered automation
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="relative z-10">Connecting securely...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 relative z-10" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="relative z-10 group-hover:text-indigo-700 transition-colors">Continue with Google</span>
                </>
              )}
            </button>

            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Encrypted</span>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p className="mb-2">By continuing, you agree to our</p>
              <p className="space-x-1">
                <a href="#" className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors">Terms of Service</a>
                <span>&</span>
                <a href="#" className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition-colors">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
