
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Calculator, Target } from "lucide-react";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold text-white">ArbEdge</h1>
          </div>
          <Button 
            onClick={() => setIsLoggedIn(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Login / Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Sports Betting <span className="text-green-400">Arbitrage</span> Platform
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Discover guaranteed profit opportunities across multiple bookmakers. 
            Our advanced algorithms scan odds in real-time to find arbitrage bets 
            with guaranteed returns regardless of the outcome.
          </p>
          <Button 
            onClick={() => setIsLoggedIn(true)}
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            Start Trading <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            How ArbEdge Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Real-Time Odds Scanning</CardTitle>
                <CardDescription className="text-slate-300">
                  Our system continuously monitors odds across major bookmakers to identify discrepancies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Calculator className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Automatic Calculations</CardTitle>
                <CardDescription className="text-slate-300">
                  Get precise stake amounts and profit margins calculated using proven arbitrage formulas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <Target className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Guaranteed Profits</CardTitle>
                <CardDescription className="text-slate-300">
                  Lock in profits regardless of the outcome by betting on all possible results
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">150+</div>
              <div className="text-slate-300">Active Opportunities</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">2.8%</div>
              <div className="text-slate-300">Average ROI</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">15</div>
              <div className="text-slate-300">Bookmakers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-slate-300">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 border-t border-slate-700">
        <div className="container mx-auto text-center text-slate-400">
          <p>&copy; 2024 ArbEdge. Professional arbitrage betting platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
