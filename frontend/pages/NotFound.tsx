import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, Home, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-botai-grey-bg flex items-center justify-center px-5">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-botai-grey-line p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-botai-accent-green/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-botai-dark" />
        </div>

        <p className="font-space-grotesk font-bold text-botai-accent-green text-lg uppercase tracking-wide mb-2">
          Error 404
        </p>
        <h1 className="font-space-grotesk font-bold text-5xl text-botai-dark uppercase tracking-wide mb-4">
          Page Not Found
        </h1>
        <p className="font-noto-sans text-botai-text text-lg mb-3">
          The page you requested does not exist or has been moved.
        </p>
        <p className="font-noto-sans text-sm text-botai-text mb-8">
          Path: <span className="font-semibold text-botai-dark">{location.pathname}</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-botai-dark text-white font-space-grotesk font-semibold uppercase tracking-wide hover:bg-botai-black transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/marketplace"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-botai-grey-line text-botai-dark font-space-grotesk font-semibold uppercase tracking-wide hover:border-botai-dark transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Marketplace
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-botai-grey-line text-botai-dark font-space-grotesk font-semibold uppercase tracking-wide hover:border-botai-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        <p className="font-noto-sans text-botai-text text-sm">
          Need help? Visit <Link to="/contact" className="text-botai-accent-green font-semibold hover:text-botai-dark transition-colors">Contact</Link>.
        </p>
      </div>
    </div>
  );
};

export default NotFound;

